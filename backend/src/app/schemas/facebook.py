from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class FacebookAccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    facebook_user_id: str
    token_expires_at: datetime | None
    revoked_at: datetime | None


class FacebookPageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    page_id: str
    name: str
    category: str | None
    picture_url: str | None
    status: str
    disconnected_at: datetime | None


class AvailablePage(BaseModel):
    """A Page offered during connection (from Meta /me/accounts)."""

    page_id: str
    name: str
    category: str | None
    tasks: list[str] | None


class ListAvailablePagesResponse(BaseModel):
    pages: list[AvailablePage]


class ConnectPageRequest(BaseModel):
    page_id: str  # Meta Page ID
