from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models import User
from app.modules.auth.deps import get_current_user
from app.modules.workspaces import service
from app.schemas.workspaces import WorkspaceCreate, WorkspaceListResponse, WorkspaceOut

router = APIRouter(tags=["workspaces"])


@router.get("", response_model=WorkspaceListResponse)
async def list_workspaces(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkspaceListResponse:
    workspaces = await service.list_workspaces(db, user)
    return WorkspaceListResponse(workspaces=workspaces)


@router.post("", response_model=WorkspaceOut, status_code=201)
async def create_workspace(
    data: WorkspaceCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkspaceOut:
    return await service.create_workspace(db, user, data)
