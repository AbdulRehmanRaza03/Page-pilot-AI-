from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel, JSONType


class WebhookEvent(BaseModel):
    """Raw/normalized Meta webhook event, deduplicated by meta_event_id."""

    __tablename__ = "webhook_events"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    page_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("facebook_pages.id"), nullable=True)
    object: Mapped[str] = mapped_column(String(32), nullable=False)  # "page"
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)  # messages, message_reads, ...
    meta_event_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONType, nullable=False)
    signature_valid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class OutboundJob(BaseModel):
    """Intent to send a message (direct or campaign item); worker lease + retry."""

    __tablename__ = "outbound_jobs"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    job_type: Mapped[str] = mapped_column(String(32), nullable=False)  # direct_send | campaign_item
    message_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("messages.id"), nullable=True)
    campaign_recipient_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("campaign_recipients.id"), nullable=True
    )
    recipient_psid: Mapped[str] = mapped_column(String(100), nullable=False)
    messaging_type: Mapped[str] = mapped_column(String(16), nullable=False)  # RESPONSE|UPDATE|TAGGED
    tag: Mapped[str | None] = mapped_column(String(64), nullable=True)
    payload: Mapped[dict] = mapped_column(JSONType, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="queued", nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class OAuthState(BaseModel):
    """Short-lived OAuth state token mapping to a user + workspace context.

    Used by OAuth callback endpoints (which cannot carry auth headers) to
    resolve the initiating user/workspace without exposing secrets.
    """

    __tablename__ = "oauth_states"

    state: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True
    )
    provider: Mapped[str] = mapped_column(String(32), default="facebook", nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
