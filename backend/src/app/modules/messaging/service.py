"""Conversations, contacts, and messages read APIs for the real inbox."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Contact, Conversation, Message, Workspace


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
