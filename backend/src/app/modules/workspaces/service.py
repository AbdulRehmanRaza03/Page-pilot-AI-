"""Workspace listing and creation services."""

from __future__ import annotations

import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Role, User, Workspace, WorkspaceMember
from app.schemas.workspaces import WorkspaceCreate, WorkspaceOut


async def list_workspaces(db: AsyncSession, user: User) -> list[WorkspaceOut]:
    result = await db.execute(
        select(WorkspaceMember, Role)
        .join(Role, Role.id == WorkspaceMember.role_id)
        .where(WorkspaceMember.user_id == user.id)
    )
    rows = result.all()
    out: list[WorkspaceOut] = []
    for member, role in rows:
        ws = await db.get(Workspace, member.workspace_id)
        if ws is None or ws.deleted_at is not None:
            continue
        out.append(
            WorkspaceOut(id=ws.id, name=ws.name, slug=ws.slug, role=role.key)
        )
    return out


async def create_workspace(
    db: AsyncSession, user: User, data: WorkspaceCreate
) -> WorkspaceOut:
    slug = _make_slug(data.name)
    workspace = Workspace(name=data.name, slug=slug, owner_id=user.id)
    db.add(workspace)
    await db.flush()

    # Assign the owner role (system role with key "owner").
    result = await db.execute(select(Role).where(Role.key == "owner", Role.workspace_id.is_(None)))
    owner_role = result.scalars().first()
    if owner_role is None:
        owner_role = Role(key="owner", name="Owner")
        db.add(owner_role)
        await db.flush()

    db.add(WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role_id=owner_role.id))
    await db.commit()
    await db.refresh(workspace)

    return WorkspaceOut(id=workspace.id, name=workspace.name, slug=workspace.slug, role="owner")


def _make_slug(name: str) -> str:
    base = "".join(c for c in name.lower() if c.isalnum() or c == "-").strip("-") or "workspace"
    return f"{base}-{secrets.token_hex(3)}"
