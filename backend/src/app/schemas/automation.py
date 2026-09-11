from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AutomationNodeCreate(BaseModel):
    type: str  # trigger | condition | action
    config: dict


class AutomationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    trigger: AutomationNodeCreate
    condition: AutomationNodeCreate | None = None
    action: AutomationNodeCreate


class AutomationNodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: str
    config: dict


class AutomationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    enabled: bool
    nodes: list[AutomationNodeOut]
    created_at: datetime


class AutomationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    enabled: bool
    created_at: datetime


class AutomationExecutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    automation_id: UUID
    status: str
    result: dict | None
    started_at: datetime
    finished_at: datetime | None
