from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.errors import NotFoundError
from app.models import User, Workspace
from app.modules.auth.deps import get_current_user, get_workspace
from app.modules.campaigns import service
from app.schemas.campaigns import CampaignCreate, CampaignOut

router = APIRouter(tags=["campaigns"])


@router.get("", response_model=list[CampaignOut])
async def list_campaigns(
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> list[CampaignOut]:
    campaigns = await service.list_campaigns(db, workspace)
    return [CampaignOut.model_validate(c) for c in campaigns]


@router.post("", response_model=CampaignOut, status_code=201)
async def create_campaign(
    body: CampaignCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
    user: Annotated[User, Depends(get_current_user)],
) -> CampaignOut:
    campaign = await service.create_campaign(db, workspace, body, user.id)
    return CampaignOut.model_validate(campaign)


@router.delete("/{campaign_id}", status_code=204)
async def delete_campaign(
    campaign_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> None:
    deleted = await service.delete_campaign(db, workspace, campaign_id)
    if not deleted:
        raise NotFoundError("campaign not found")
