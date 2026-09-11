"""Campaign management (MVP): CRUD + status, no destructive fan-out without review."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Campaign, Workspace
from app.schemas.campaigns import CampaignCreate


async def list_campaigns(db: AsyncSession, workspace: Workspace) -> list[Campaign]:
    result = await db.execute(
        select(Campaign).where(
            Campaign.workspace_id == workspace.id, Campaign.deleted_at.is_(None)
        )
    )
    return list(result.scalars().all())


async def create_campaign(
    db: AsyncSession, workspace: Workspace, data: CampaignCreate, user_id: uuid.UUID
) -> Campaign:
    campaign = Campaign(
        workspace_id=workspace.id,
        name=data.name,
        status="draft",
        message_template=data.message,
        created_by=user_id,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign


async def delete_campaign(db: AsyncSession, workspace: Workspace, campaign_id: uuid.UUID) -> bool:
    from datetime import UTC, datetime

    campaign = await db.get(Campaign, campaign_id)
    if campaign is None or campaign.workspace_id != workspace.id:
        return False
    campaign.deleted_at = datetime.now(UTC)
    await db.commit()
    return True
