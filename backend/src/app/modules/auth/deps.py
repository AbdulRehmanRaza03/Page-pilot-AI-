"""Dependencies for auth, tenant context, and RBAC."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.models import Role, User, Workspace, WorkspaceMember

bearer_scheme = HTTPBearer(auto_error=False)


def _extract_token(creds: HTTPAuthorizationCredentials | None) -> str:
    if creds is None:
        raise UnauthorizedError("missing token")
    return creds.credentials


async def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    token = _extract_token(creds)
    try:
        payload = decode_token(token)
    except ValueError:
        raise UnauthorizedError("invalid or expired token") from None
    if payload.get("type") != "access":
        raise UnauthorizedError("wrong token type")
    user_id = payload.get("sub")
    user = await db.get(User, uuid.UUID(user_id))
    if user is None or user.deleted_at is not None:
        raise UnauthorizedError("user not found")
    return user


async def get_workspace(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Workspace:
    """Resolve the active workspace from the X-Workspace-Id header (or query param)."""
    raw = request.headers.get("x-workspace-id") or request.query_params.get("workspace_id")
    if not raw:
        raise ForbiddenError("workspace context required")
    workspace = await db.get(Workspace, uuid.UUID(raw))
    if workspace is None or workspace.deleted_at is not None:
        raise ForbiddenError("workspace not found")

    # Verify membership.
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == user.id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise ForbiddenError("not a member of this workspace")

    return workspace


async def get_member(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> WorkspaceMember:
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == user.id,
        )
    )
    return result.scalar_one()


def require_permission(permission: str):
    """Dependency factory: enforce that the current member's role has `permission`."""

    async def _checker(
        member: Annotated[WorkspaceMember, Depends(get_member)],
        db: Annotated[AsyncSession, Depends(get_db)],
    ) -> WorkspaceMember:
        result = await db.execute(
            select(Role).options(selectinload(Role.permissions)).where(Role.id == member.role_id)
        )
        role = result.scalar_one_or_none()
        if role is None:
            raise ForbiddenError("role not found")
        keys = {p.key for p in role.permissions}
        # Owner role implicitly has all permissions.
        if role.key == "owner" or permission in keys:
            return member
        raise ForbiddenError(f"missing permission: {permission}")

    return _checker
