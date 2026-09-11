from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.errors import NotFoundError
from app.models import User, Workspace
from app.modules.auth.deps import get_current_user, get_workspace
from app.modules.automations import service
from app.schemas.automation import AutomationCreate, AutomationDetail, AutomationOut

router = APIRouter(tags=["automations"])


@router.get("", response_model=list[AutomationOut])
async def list_automations(
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> list[AutomationOut]:
    automations = await service.list_automations(db, workspace)
    return [AutomationOut.model_validate(a) for a in automations]


@router.get("/{automation_id}", response_model=AutomationDetail)
async def get_automation(
    automation_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> AutomationDetail:
    automation = await service.get_automation(db, workspace, automation_id)
    if automation is None:
        raise NotFoundError("automation not found")
    return automation


@router.post("", response_model=AutomationOut, status_code=201)
async def create_automation(
    body: AutomationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
    user: Annotated[User, Depends(get_current_user)],
) -> AutomationOut:
    automation = await service.create_automation(db, workspace, body, user.id)
    return AutomationOut.model_validate(automation)


@router.post("/{automation_id}/toggle", response_model=AutomationOut)
async def toggle_automation(
    automation_id: uuid.UUID,
    body: dict,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> AutomationOut:
    enabled = bool(body.get("enabled", False))
    automation = await service.set_enabled(db, workspace, automation_id, enabled)
    if automation is None:
        raise NotFoundError("automation not found")
    return AutomationOut.model_validate(automation)


@router.delete("/{automation_id}", status_code=204)
async def delete_automation(
    automation_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> None:
    deleted = await service.delete_automation(db, workspace, automation_id)
    if not deleted:
        raise NotFoundError("automation not found")
