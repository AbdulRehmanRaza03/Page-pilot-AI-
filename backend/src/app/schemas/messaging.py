from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    psid: str
    name: str | None
    profile_url: str | None
    lead_status: str
    lead_score: int
    product_interests: list | None
    last_interaction_at: datetime | None
    created_at: datetime


class ContactUpdate(BaseModel):
    name: str | None = None
    lead_status: str | None = None
    lead_score: int | None = None
    tags: list[str] | None = None


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    page_id: UUID
    contact_id: UUID
    status: str
    assigned_to: UUID | None
    subject: str | None
    last_message_at: datetime | None
    unread_count: int
    created_at: datetime


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    direction: str
    sender_type: str
    type: str
    body: str | None
    meta_message_id: str | None
    created_at: datetime


class SendMessageRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
