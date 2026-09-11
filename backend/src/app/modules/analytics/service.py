"""Dashboard/analytics metrics backed by real database queries (no mock numbers)."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Campaign,
    Contact,
    Conversation,
    FacebookPage,
    Message,
    Workspace,
)


async def get_dashboard_metrics(db: AsyncSession, workspace: Workspace) -> dict:
    async def count(model) -> int:
        stmt = select(func.count()).select_from(model).where(model.workspace_id == workspace.id)
        if hasattr(model, "deleted_at"):
            stmt = stmt.where(model.deleted_at.is_(None))
        return (await db.execute(stmt)).scalar() or 0

    connected_pages = await count(FacebookPage)
    contacts = await count(Contact)
    conversations = await count(Conversation)

    unread = (
        await db.execute(
            select(func.coalesce(func.sum(Conversation.unread_count), 0)).where(
                Conversation.workspace_id == workspace.id,
                Conversation.deleted_at.is_(None),
            )
        )
    ).scalar() or 0

    messages = await count(Message)
    campaigns = await count(Campaign)

    # New leads = contacts with lead_status "new".
    new_leads = (
        await db.execute(
            select(func.count()).select_from(Contact).where(
                Contact.workspace_id == workspace.id,
                Contact.deleted_at.is_(None),
                Contact.lead_status == "new",
            )
        )
    ).scalar() or 0

    return {
        "connected_pages": connected_pages,
        "contacts": contacts,
        "conversations": conversations,
        "unread_conversations": unread,
        "messages": messages,
        "campaigns": campaigns,
        "new_leads": new_leads,
    }
