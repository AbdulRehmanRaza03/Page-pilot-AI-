from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WorkspaceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    role: str | None = None  # current user's role key in this workspace


class WorkspaceListResponse(BaseModel):
    workspaces: list[WorkspaceOut]


class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class MeResponse(BaseModel):
    id: UUID
    email: str
    full_name: str | None
    email_verified: bool
    workspaces: list[WorkspaceOut]
