"""Message processing pipeline.

Turns a raw Meta webhook `messages` event into persistent Contact,
Conversation, and Message records — the core receive flow.

Steps:
  1. Identify Page
  2. Identify Contact (find by PSID or create)
  3. Identify Conversation (find open thread or create)
  4. Store Message (dedupe by meta_message_id)
  5. Update conversation last_message_at + unread_count
  6. Evaluate automations

All idempotent: re-processing the same event is a no-op.
"""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decrypt_secret
from app.models import Contact, Conversation, FacebookPage, Message, PageToken

logger = logging.getLogger("pagepilot.messages")


async def process_inbound_message(
    db: AsyncSession,
    *,
    workspace_id: uuid.UUID,
    page_id_fk: uuid.UUID,
    sender_psid: str,
    meta_message_id: str,
    text: str | None,
) -> Message:
    """Persist an inbound message, creating contact + conversation as needed."""
    contact = await _find_or_create_contact(db, workspace_id, page_id_fk, sender_psid)
    conversation = await _find_or_create_conversation(db, workspace_id, page_id_fk, contact.id)

    # Best-effort enrichment: fetch the customer's name + avatar from Meta so the
    # inbox shows a real name instead of a raw PSID. Never blocks ingestion.
    if not contact.name:
        await _enrich_contact(db, contact, page_id_fk)

    existing = await db.execute(
        select(Message).where(Message.meta_message_id == meta_message_id)
    )
    existing_msg = existing.scalar_one_or_none()
    if existing_msg is not None:
        return existing_msg

    now = datetime.now(UTC)
    message = Message(
        conversation_id=conversation.id,
        workspace_id=workspace_id,
        direction="inbound",
        sender_type="human",
        type="text",
        body=text,
        meta_message_id=meta_message_id,
    )
    db.add(message)
    conversation.last_message_at = now
    conversation.unread_count = (conversation.unread_count or 0) + 1
    contact.last_interaction_at = now
    await db.commit()
    await db.refresh(message)

    await run_automations(db, workspace_id, conversation, contact, text)
    return message


async def _find_or_create_contact(
    db: AsyncSession, workspace_id: uuid.UUID, page_id_fk: uuid.UUID, psid: str
) -> Contact:
    result = await db.execute(
        select(Contact).where(Contact.workspace_id == workspace_id, Contact.psid == psid)
    )
    contact = result.scalar_one_or_none()
    if contact is None:
        contact = Contact(workspace_id=workspace_id, page_id=page_id_fk, psid=psid)
        db.add(contact)
        await db.flush()
    return contact


async def _find_or_create_conversation(
    db: AsyncSession, workspace_id: uuid.UUID, page_id_fk: uuid.UUID, contact_id: uuid.UUID
) -> Conversation:
    result = await db.execute(
        select(Conversation).where(
            Conversation.workspace_id == workspace_id,
            Conversation.page_id == page_id_fk,
            Conversation.contact_id == contact_id,
            Conversation.status == "open",
        )
    )
    conversation = result.scalar_one_or_none()
    if conversation is None:
        conversation = Conversation(
            workspace_id=workspace_id,
            page_id=page_id_fk,
            contact_id=contact_id,
            status="open",
        )
        db.add(conversation)
        await db.flush()
    return conversation


async def _enrich_contact(db: AsyncSession, contact: Contact, page_id_fk: uuid.UUID) -> None:
    """Fetch the contact's name + avatar from Meta and persist it (best-effort)."""
    try:
        from app.services.meta_client import meta_client

        page = await db.get(FacebookPage, page_id_fk)
        if page is None:
            return
        token_result = await db.execute(
            select(PageToken)
            .where(PageToken.facebook_page_id == page.id, PageToken.invalidated_at.is_(None))
            .order_by(PageToken.created_at.desc())
            .limit(1)
        )
        token_row = token_result.scalar_one_or_none()
        if token_row is None:
            return
        page_token = decrypt_secret(token_row.token_enc)

        profile = await meta_client.get_user_profile(contact.psid, page_token)
        first = profile.get("first_name")
        last = profile.get("last_name")
        pic = profile.get("profile_pic")
        if first or last:
            contact.name = f"{first or ''} {last or ''}".strip() or contact.name
        if pic and not contact.profile_url:
            contact.profile_url = pic
        if first or last or pic:
            await db.commit()
    except Exception:
        # Never let profile enrichment break message ingestion.
        logger.exception("contact enrichment failed for contact %s", contact.id)


async def run_automations(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    conversation: Conversation,
    contact: Contact,
    text: str | None,
) -> None:
    """Evaluate enabled automations and execute send_message actions."""
    from app.models import Workspace
    from app.modules.automations import service as automation_service

    workspace = await db.get(Workspace, workspace_id)
    if workspace is None:
        return

    actions = await automation_service.evaluate_for_message(
        db, workspace, conversation, contact, text or ""
    )

    for action_type, config in actions:
        if action_type == "send_message" and config.get("text"):
            try:
                await _send_automated_reply(db, conversation, config["text"])
            except Exception:
                logger.exception("Automation send failed for conversation %s", conversation.id)


async def _send_automated_reply(db: AsyncSession, conversation: Conversation, text: str) -> Message:
    """Send an automation reply through Meta and persist it as an outbound message."""
    from app.services.meta_client import meta_client

    contact = await db.get(Contact, conversation.contact_id)
    page = await db.get(FacebookPage, conversation.page_id)
    if contact is None or page is None:
        raise ValueError("contact or page not found")

    token_result = await db.execute(
        select(PageToken)
        .where(PageToken.facebook_page_id == page.id, PageToken.invalidated_at.is_(None))
        .order_by(PageToken.created_at.desc())
        .limit(1)
    )
    token_row = token_result.scalar_one_or_none()
    if token_row is None:
        raise ValueError("no valid page token")
    page_token = decrypt_secret(token_row.token_enc)

    result = await meta_client.send_message(page.page_id, page_token, contact.psid, text)

    message = Message(
        conversation_id=conversation.id,
        workspace_id=conversation.workspace_id,
        direction="outbound",
        sender_type="automation",
        type="text",
        body=text,
        meta_message_id=result.get("message_id"),
    )
    db.add(message)
    conversation.last_message_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(message)
    return message


async def resolve_page(db: AsyncSession, meta_page_id: str) -> FacebookPage | None:
    if not meta_page_id:
        return None
    result = await db.execute(
        select(FacebookPage).where(FacebookPage.page_id == str(meta_page_id))
    )
    return result.scalar_one_or_none()
