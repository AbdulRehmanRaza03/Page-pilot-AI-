"""Meta webhook verification and event ingestion.

Handles:
- GET verification (Meta sends hub.challenge on subscribe)
- POST event delivery with X-Hub-Signature-256 validation
- Raw event persistence + idempotency

See docs/14-webhook-architecture.md and docs/13-meta-integration.md.
"""

from __future__ import annotations

import hashlib
import hmac
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.models import FacebookPage, WebhookEvent

router = APIRouter(tags=["webhooks"])


def verify_signature(payload_bytes: bytes, signature: str | None) -> bool:
    """Validate the X-Hub-Signature-256 header against the raw payload."""
    if not settings.meta_app_secret or not signature:
        return False
    expected = hmac.new(
        settings.meta_app_secret.encode(), payload_bytes, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


@router.get("/meta")
async def verify_webhook(request: Request) -> dict:
    """Meta calls this during webhook subscription (GET verify).

    Meta sends literal query params `hub.mode`, `hub.challenge`, and
    `hub.verify_token` (with dots), so we read them from raw query params.
    """
    qp = request.query_params
    mode = qp.get("hub.mode")
    challenge = qp.get("hub.challenge")
    verify_token = qp.get("hub.verify_token")

    if mode == "subscribe" and verify_token == settings.meta_webhook_verify_token and challenge:
        return {"hub.challenge": challenge}
    return {}


@router.post("/meta")
async def receive_webhook(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    x_hub_signature_256: str | None = Header(default=None),
) -> dict:
    """Receive and persist a Meta webhook event (ack fast, process later)."""
    payload_bytes = await request.body()
    signature_valid = verify_signature(payload_bytes, x_hub_signature_256)

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    # Extract Page ID + events. Meta wraps events in entry[].
    entries = payload.get("entry", []) if isinstance(payload, dict) else []

    from app.services import message_processor

    for entry in entries:
        if not isinstance(entry, dict):
            continue
        meta_page_id = entry.get("id")
        workspace_id = None
        page_id_fk = None
        # Resolve to our FacebookPage (and its workspace).
        page = await message_processor.resolve_page(db, meta_page_id)
        if page is not None:
            workspace_id = page.workspace_id
            page_id_fk = page.id
        # Process each messaging event under this entry.
        messaging = entry.get("messaging", []) or []
        for event in messaging:
            if not isinstance(event, dict):
                continue
            msg = event.get("message", {}) or {}
            mid = str(msg.get("mid") or uuid.uuid4())
            await store_event(
                db,
                workspace_id=workspace_id,
                page_id=page_id_fk,
                event_type="messages",
                meta_event_id=mid,
                payload=event,
                signature_valid=signature_valid,
            )

            # If the Page belongs to a known workspace, persist Contact +
            # Conversation + Message so it appears in the inbox.
            sender_psid = (event.get("sender") or {}).get("id")
            if workspace_id is not None and page_id_fk is not None and sender_psid:
                await message_processor.process_inbound_message(
                    db,
                    workspace_id=workspace_id,
                    page_id_fk=page_id_fk,
                    sender_psid=str(sender_psid),
                    meta_message_id=mid,
                    text=msg.get("text"),
                )

    # Always acknowledge quickly (200) to avoid Meta retries.
    return {"received": True}


async def resolve_page(db: AsyncSession, meta_page_id: str | None) -> FacebookPage | None:
    if not meta_page_id:
        return None
    from sqlalchemy import select

    result = await db.execute(
        select(FacebookPage).where(FacebookPage.page_id == str(meta_page_id))
    )
    return result.scalar_one_or_none()


async def store_event(
    db: AsyncSession,
    *,
    workspace_id: uuid.UUID | None,
    page_id: uuid.UUID | None,
    event_type: str,
    meta_event_id: str,
    payload: dict,
    signature_valid: bool,
) -> None:
    # Idempotency: skip if this event id already exists.
    from sqlalchemy import select

    existing = await db.execute(
        select(WebhookEvent).where(WebhookEvent.meta_event_id == meta_event_id)
    )
    if existing.scalar_one_or_none() is not None:
        return

    db.add(
        WebhookEvent(
            workspace_id=workspace_id,
            page_id=page_id,
            object="page",
            event_type=event_type,
            meta_event_id=meta_event_id,
            payload=payload,
            signature_valid=signature_valid,
            processed_at=datetime.now(UTC),
        )
    )
    await db.commit()
