"""Message processing pipeline.

Turns a raw Meta webhook `messages` event into persistent Contact,
Conversation, and Message records — the core receive flow.

Steps:
  1. Identify Page (from entry.id / recipient.id)
  2. Identify Contact (find by PSID or create)
  3. Identify Conversation (find open thread or create)
  4. Store Message (dedupe by meta_message_id)
  5. Update conversation last_message_at + unread_count

All idempotent: re-processing the same event is a no-op.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Contact, Conversation, FacebookPage, Message


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
    # 1. Contact: find by (workspace, psid) or create.
    contact = await _find_or_create_contact(db, workspace_id, page_id_fk, sender_psid)

    # 2. Conversation: find open thread for (workspace, page, contact) or create.
    conversation = await _find_or_create_conversation(db, workspace_id, page_id_fk, contact.id)

    # 3. Message: dedupe by meta_message_id.
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

    # 4. Update conversation + contact timestamps.
    conversation.last_message_at = now
    conversation.unread_count = (conversation.unread_count or 0) + 1
    contact.last_interaction_at = now

    await db.commit()
    await db.refresh(message)
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


async def resolve_page(db: AsyncSession, meta_page_id: str) -> FacebookPage | None:
    if not meta_page_id:
        return None
    result = await db.execute(
        select(FacebookPage).where(FacebookPage.page_id == str(meta_page_id))
    )
    return result.scalar_one_or_none()
