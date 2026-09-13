from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1, max_length=2000)
    page_id: UUID | None = None
    audience_filter: dict | None = None
    schedule_at: datetime | None = None  # when to start sending (None = immediate)


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
    created_at: datetime
