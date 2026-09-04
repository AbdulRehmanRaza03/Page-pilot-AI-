from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, JSONType


class FacebookAccount(BaseModel):
    """OAuth identity of a user's Facebook login + long-lived user token."""

    __tablename__ = "facebook_accounts"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    facebook_user_id: Mapped[str] = mapped_column(String(100), nullable=False)
    long_lived_token_enc: Mapped[str] = mapped_column(Text, nullable=False)  # encrypted at rest
    token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class FacebookPage(BaseModel):
    """A Facebook Page connected into a workspace."""

    __tablename__ = "facebook_pages"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    facebook_account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("facebook_accounts.id", ondelete="CASCADE"), index=True
    )
    page_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)  # Meta Page ID
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    picture_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="connected", nullable=False)
    tasks: Mapped[list | None] = mapped_column(JSONType, nullable=True)
    disconnected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PageToken(BaseModel):
    """Per-Page access token with lifecycle tracking."""

    __tablename__ = "page_tokens"

    facebook_page_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("facebook_pages.id", ondelete="CASCADE"), index=True
    )
    token_enc: Mapped[str] = mapped_column(Text, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scopes: Mapped[list | None] = mapped_column(JSONType, nullable=True)
    invalidated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    page: Mapped[FacebookPage] = relationship()
