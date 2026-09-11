from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    page_id: UUID
    message: str = Field(min_length=1, max_length=2000)
    audience_filter: dict | None = None  # e.g. {"lead_status": "qualified"}


class CampaignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    status: str
    message_template: str
    audience_id: UUID | None
    created_at: datetime
