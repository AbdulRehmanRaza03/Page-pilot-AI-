from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models import Role, User, Workspace, WorkspaceMember
from app.modules.auth.deps import get_current_user, get_workspace
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


@router.get("/team/members")
async def list_team_members(
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> list[dict]:
    """Return the real members of the current workspace with their role."""
    result = await db.execute(
        select(WorkspaceMember, User, Role)
        .join(User, User.id == WorkspaceMember.user_id)
        .join(Role, Role.id == WorkspaceMember.role_id)
        .where(WorkspaceMember.workspace_id == workspace.id)
    )
    members: list[dict] = []
    for member, user, role in result.all():
        members.append(
            {
                "id": str(member.id),
                "user_id": str(user.id),
                "name": user.full_name or user.email.split("@")[0],
                "email": user.email,
                "role": role.key,
                "role_label": role.name,
            }
        )
    return members
