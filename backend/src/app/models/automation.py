from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, JSONType, SoftDeleteMixin


class Automation(BaseModel, SoftDeleteMixin):
    __tablename__ = "automations"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)

    nodes: Mapped[list[AutomationNode]] = relationship(back_populates="automation")


class AutomationNode(BaseModel):
    """A typed node in an automation graph (trigger/condition/action/delay/branch)."""

    __tablename__ = "automation_nodes"

    automation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("automations.id", ondelete="CASCADE"), index=True
    )
    type: Mapped[str] = mapped_column(String(32), nullable=False)  # trigger|condition|action|delay|branch
    config: Mapped[dict] = mapped_column(JSONType, nullable=False)
    next_node_ids: Mapped[list | None] = mapped_column(JSONType, nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    automation: Mapped[Automation] = relationship(back_populates="nodes")


class AutomationExecution(BaseModel):
    __tablename__ = "automation_executions"

    automation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("automations.id", ondelete="CASCADE"), index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("conversations.id"), nullable=True
    )
    trigger_event_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="running", nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    result: Mapped[dict | None] = mapped_column(JSONType, nullable=True)


class AutomationExecutionStep(BaseModel):
    __tablename__ = "automation_execution_steps"

    execution_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("automation_executions.id", ondelete="CASCADE"), index=True
    )
    node_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("automation_nodes.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    input: Mapped[dict | None] = mapped_column(JSONType, nullable=True)
    output: Mapped[dict | None] = mapped_column(JSONType, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)


class AiSession(BaseModel, SoftDeleteMixin):
    __tablename__ = "ai_sessions"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    messages: Mapped[list[AiMessage]] = relationship(back_populates="session")


class AiMessage(BaseModel):
    __tablename__ = "ai_messages"

    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ai_sessions.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(String(32), nullable=False)  # user | assistant | tool
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    tool_calls: Mapped[list | None] = mapped_column(JSONType, nullable=True)

    session: Mapped[AiSession] = relationship(back_populates="messages")


class AiAction(BaseModel):
    __tablename__ = "ai_actions"

    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ai_sessions.id", ondelete="CASCADE"), index=True
    )
    tool_name: Mapped[str] = mapped_column(String(100), nullable=False)
    args: Mapped[dict] = mapped_column(JSONType, nullable=False)
    permission_level: Mapped[str] = mapped_column(String(16), nullable=False)  # READ/PREPARE/WRITE/EXTERNAL
    needs_confirmation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)

    logs: Mapped[list[AiActionLog]] = relationship(back_populates="action")


class AiActionLog(BaseModel):
    __tablename__ = "ai_action_logs"

    ai_action_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ai_actions.id", ondelete="CASCADE"), index=True
    )
    result: Mapped[dict | None] = mapped_column(JSONType, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    action: Mapped[AiAction] = relationship(back_populates="logs")


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    workspace_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=True
    )
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    before: Mapped[dict | None] = mapped_column(JSONType, nullable=True)
    after: Mapped[dict | None] = mapped_column(JSONType, nullable=True)
    ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
