"""AI assistant tools: real actions backed by the database.

Read-only tools:
  - search_contacts   -> list/filter contacts/leads
  - analytics         -> dashboard metrics
  - get_conversation  -> latest conversations + unread
  - draft_reply       -> a suggested reply (uses the LLM)

External tools (require confirmation before execution):
  - prepare_campaign  -> preview audience + message (no send)
  - execute_campaign  -> actually send (called only after user confirms)
"""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Contact, Conversation, Workspace


async def search_contacts(
    db: AsyncSession, workspace: Workspace, query: str | None = None
) -> dict:
    stmt = select(Contact).where(
        Contact.workspace_id == workspace.id, Contact.deleted_at.is_(None)
    )
    if query and "%" not in query:
        stmt = stmt.where(Contact.name.ilike(f"%{query}%"))
    stmt = stmt.order_by(Contact.last_interaction_at.desc()).limit(50)
    result = await db.execute(stmt)
    contacts = result.scalars().all()

    rows = [
        {
            "id": str(c.id),
            "name": c.name or c.psid,
            "lead_status": c.lead_status,
            "lead_score": c.lead_score,
            "last_interaction_at": c.last_interaction_at.isoformat() if c.last_interaction_at else None,
        }
        for c in contacts
    ]
    return {"contacts": rows, "count": len(rows)}


async def get_analytics(db: AsyncSession, workspace: Workspace) -> dict:
    from app.modules.analytics import service as analytics_service

    return await analytics_service.get_dashboard_metrics(db, workspace)


async def get_conversations(db: AsyncSession, workspace: Workspace) -> dict:
    result = await db.execute(
        select(Conversation)
        .where(
            Conversation.workspace_id == workspace.id,
            Conversation.deleted_at.is_(None),
        )
        .order_by(Conversation.last_message_at.desc())
        .limit(20)
    )
    conversations = result.scalars().all()
    rows = [
        {
            "id": str(c.id),
            "status": c.status,
            "unread_count": c.unread_count,
            "last_message_at": c.last_message_at.isoformat() if c.last_message_at else None,
        }
        for c in conversations
    ]
    unread = sum(c.unread_count for c in conversations)
    return {"conversations": rows, "count": len(rows), "unread": unread}


async def prepare_campaign(
    db: AsyncSession, workspace: Workspace, message: str
) -> dict:
    """Preview a campaign: audience count + message preview. Does NOT send."""
    result = await db.execute(
        select(func.count())
        .select_from(Contact)
        .where(Contact.workspace_id == workspace.id, Contact.deleted_at.is_(None))
    )
    count = result.scalar() or 0
    return {
        "action": "send_campaign",
        "message": message,
        "audience": count,
        "page": None,  # resolved at execution time
    }
