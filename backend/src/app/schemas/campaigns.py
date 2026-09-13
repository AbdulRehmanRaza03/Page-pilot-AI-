from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1, max_length=2000)
    page_id: UUID | None = None
    audience_filter: dict | None = None
    schedule_at: datetime | None = None
    recipient_limit: int | None = Field(default=None, ge=0)  # max recipients (None = all)
    gap_seconds: int = Field(default=5, ge=5, le=300)  # delay between sends (min 5s)


class CampaignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    status: str
    message_template: str
    audience_id: UUID | None
    schedule_at: datetime | None
    enabled: bool
    sent_count: int
    total_count: int
    recipient_limit: int | None
    gap_seconds: int
    created_at: datetime
