"""Conversations, contacts, and messages read APIs for the real inbox."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import MetaApiError as MetaErr
from app.core.security import decrypt_secret
from app.models import Contact, Conversation, FacebookPage, Message, PageToken, Workspace


async def list_conversations(
    db: AsyncSession,
    workspace: Workspace,
    *,
    status: str | None = None,
    search: str | None = None,
) -> list[Conversation]:
    stmt = select(Conversation).where(
        Conversation.workspace_id == workspace.id,
        Conversation.deleted_at.is_(None),
    )
    if status:
        stmt = stmt.where(Conversation.status == status)
    stmt = stmt.order_by(Conversation.last_message_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_conversation(
    db: AsyncSession, workspace: Workspace, conversation_id: uuid.UUID
) -> Conversation | None:
    result = await db.execute(
        select(Conversation).where(
            Conversation.workspace_id == workspace.id,
            Conversation.id == conversation_id,
            Conversation.deleted_at.is_(None),
        )
    )
    return result.scalar_one_or_none()


async def list_messages(
    db: AsyncSession, workspace: Workspace, conversation_id: uuid.UUID
) -> list[Message]:
    result = await db.execute(
        select(Message)
        .where(
            Message.workspace_id == workspace.id,
            Message.conversation_id == conversation_id,
            Message.deleted_at.is_(None),
        )
        .order_by(Message.created_at.asc())
    )
    return list(result.scalars().all())


async def get_contact(
    db: AsyncSession, workspace: Workspace, contact_id: uuid.UUID
) -> Contact | None:
    result = await db.execute(
        select(Contact).where(
            Contact.workspace_id == workspace.id,
            Contact.id == contact_id,
            Contact.deleted_at.is_(None),
        )
    )
    return result.scalar_one_or_none()


async def list_contacts(
    db: AsyncSession,
    workspace: Workspace,
    *,
    search: str | None = None,
    lead_status: str | None = None,
) -> list[Contact]:
    stmt = select(Contact).where(
        Contact.workspace_id == workspace.id,
        Contact.deleted_at.is_(None),
    )
    if lead_status:
        stmt = stmt.where(Contact.lead_status == lead_status)
    if search and "%" not in search:
        stmt = stmt.where(Contact.name.ilike(f"%{search}%"))
    stmt = stmt.order_by(Contact.last_interaction_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def send_reply(
    db: AsyncSession,
    workspace: Workspace,
    conversation: Conversation,
    text: str,
    meta,
) -> Message:
    """Send a reply through Meta, persist the outgoing message, update conversation.

    Enforces policy implicitly via messaging_type: we only send RESPONSE
    (within the 24h window). If Meta rejects, the error propagates and nothing
    is persisted as 'sent'.
    """
    contact = await db.get(Contact, conversation.contact_id)
    page = await db.get(FacebookPage, conversation.page_id)
    if contact is None or page is None:
        from app.core.errors import NotFoundError

        raise NotFoundError("contact or page not found")

    # Retrieve the Page access token (decrypted).
    token_result = await db.execute(
        select(PageToken)
        .where(PageToken.facebook_page_id == page.id, PageToken.invalidated_at.is_(None))
        .order_by(PageToken.created_at.desc())
        .limit(1)
    )
    token_row = token_result.scalar_one_or_none()
    if token_row is None:
        from app.core.errors import TokenError

        raise TokenError("No valid Page token found")
    page_token = decrypt_secret(token_row.token_enc)

    try:
        result = await meta.send_message(page.page_id, page_token, contact.psid, text)
    except Exception as exc:
        raise MetaErr(f"Failed to send: {getattr(exc, 'message', exc)}") from exc

    meta_message_id = result.get("message_id")
    now = datetime.now(UTC)
    message = Message(
        conversation_id=conversation.id,
        workspace_id=workspace.id,
        direction="outbound",
        sender_type="human",
        type="text",
        body=text,
        meta_message_id=meta_message_id,
    )
    db.add(message)
    conversation.last_message_at = now
    conversation.status = "open"
    await db.commit()
    await db.refresh(message)
    return message
