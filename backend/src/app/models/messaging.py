from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel, JSONType, SoftDeleteMixin


class Contact(BaseModel, SoftDeleteMixin):
    """A customer/lead, identified by a Page-scoped ID (PSID)."""

    __tablename__ = "contacts"
    __table_args__ = (UniqueConstraint("workspace_id", "psid", name="uq_contact_psid"),)

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    page_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("facebook_pages.id"), nullable=False)
    psid: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    profile_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    lead_status: Mapped[str] = mapped_column(String(32), default="new", nullable=False)
    lead_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    product_interests: Mapped[list | None] = mapped_column(JSONType, nullable=True)
    last_interaction_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Conversation(BaseModel, SoftDeleteMixin):
    """A 1:1 thread between a contact and a Page."""

    __tablename__ = "conversations"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    page_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("facebook_pages.id"), nullable=False)
    contact_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contacts.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="open", nullable=False)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    unread_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class Message(BaseModel, SoftDeleteMixin):
    """A single message in a conversation."""

    __tablename__ = "messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    direction: Mapped[str] = mapped_column(String(16), nullable=False)  # inbound | outbound
    sender_type: Mapped[str] = mapped_column(String(16), default="human", nullable=False)
    type: Mapped[str] = mapped_column(String(32), default="text", nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta_message_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    attachments: Mapped[list | None] = mapped_column(JSONType, nullable=True)


class MessageEvent(BaseModel):
    """Lifecycle delta for a message (delivered/read/echo/failed)."""

    __tablename__ = "message_events"
    __table_args__ = (
        UniqueConstraint("message_id", "event_type", "meta_event_id", name="uq_msg_event"),
    )

    message_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"), index=True
    )
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)
    meta_event_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Label(BaseModel, SoftDeleteMixin):
    __tablename__ = "labels"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str | None] = mapped_column(String(16), nullable=True)


class ContactLabel(BaseModel):
    __tablename__ = "contact_labels"
    __table_args__ = (UniqueConstraint("contact_id", "label_id", name="uq_contact_label"),)

    contact_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contacts.id", ondelete="CASCADE"))
    label_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("labels.id", ondelete="CASCADE"))


class ConversationLabel(BaseModel):
    __tablename__ = "conversation_labels"
    __table_args__ = (UniqueConstraint("conversation_id", "label_id", name="uq_conv_label"),)

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE")
    )
    label_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("labels.id", ondelete="CASCADE"))


class Note(BaseModel, SoftDeleteMixin):
    """Free-form note attached to a contact or conversation."""

    __tablename__ = "notes"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    contact_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("contacts.id"), nullable=True)
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("conversations.id"), nullable=True
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
