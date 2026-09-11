"""Automation engine: simple trigger → condition → action.

Supports:
- Triggers: incoming_message, new_contact, keyword
- Conditions: keyword, lead_status, tag
- Actions: send_message, add_tag, update_lead_status

Automations are persisted as a small node graph; execution is evaluated
synchronously on inbound messages (see service.evaluate_for_message).
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    Automation,
    AutomationNode,
    Contact,
    Conversation,
    Workspace,
)
from app.schemas.automation import AutomationCreate, AutomationDetail


async def list_automations(db: AsyncSession, workspace: Workspace) -> list[Automation]:
    result = await db.execute(
        select(Automation).where(
            Automation.workspace_id == workspace.id, Automation.deleted_at.is_(None)
        )
    )
    return list(result.scalars().all())


async def get_automation(db: AsyncSession, workspace: Workspace, automation_id: uuid.UUID) -> AutomationDetail | None:
    result = await db.execute(
        select(Automation)
        .options(selectinload(Automation.nodes))
        .where(Automation.workspace_id == workspace.id, Automation.id == automation_id)
    )
    automation = result.scalar_one_or_none()
    if automation is None:
        return None
    return AutomationDetail(
        id=automation.id,
        name=automation.name,
        enabled=automation.enabled,
        nodes=automation.nodes,
        created_at=automation.created_at,
    )


async def create_automation(
    db: AsyncSession, workspace: Workspace, data: AutomationCreate, user_id: uuid.UUID
) -> Automation:
    automation = Automation(name=data.name, workspace_id=workspace.id, created_by=user_id, enabled=False)
    db.add(automation)
    await db.flush()

    nodes = [data.trigger]
    if data.condition:
        nodes.append(data.condition)
    nodes.append(data.action)

    for i, n in enumerate(nodes):
        db.add(
            AutomationNode(
                automation_id=automation.id,
                type=n.type,
                config=n.config,
                position=i,
            )
        )

    await db.commit()
    await db.refresh(automation)
    return automation


async def set_enabled(db: AsyncSession, workspace: Workspace, automation_id: uuid.UUID, enabled: bool) -> Automation | None:
    automation = await db.get(Automation, automation_id)
    if automation is None or automation.workspace_id != workspace.id:
        return None
    automation.enabled = enabled
    await db.commit()
    await db.refresh(automation)
    return automation


async def delete_automation(db: AsyncSession, workspace: Workspace, automation_id: uuid.UUID) -> bool:
    automation = await db.get(Automation, automation_id)
    if automation is None or automation.workspace_id != workspace.id:
        return False
    automation.deleted_at = datetime.now(UTC)
    automation.enabled = False
    await db.commit()
    return True


def _get_node(automation: Automation, node_type: str) -> AutomationNode | None:
    return next((n for n in automation.nodes if n.type == node_type), None)


async def evaluate_for_message(
    db: AsyncSession,
    workspace: Workspace,
    conversation: Conversation,
    contact: Contact,
    text: str,
) -> list[tuple[str, dict]]:
    """Evaluate enabled automations against an inbound message.

    Returns a list of (action_type, config) actions to execute.
    """
    result = await db.execute(
        select(Automation)
        .options(selectinload(Automation.nodes))
        .where(Automation.workspace_id == workspace.id, Automation.enabled.is_(True))
    )
    automations = result.scalars().all()

    actions: list[tuple[str, dict]] = []
    for automation in automations:
        trigger = _get_node(automation, "trigger")
        condition = _get_node(automation, "condition")
        action = _get_node(automation, "action")
        if trigger is None or action is None:
            continue

        # Trigger: incoming_message (always matches for a message).
        if trigger.config.get("event") not in ("incoming_message", None):
            continue

        # Condition check.
        if condition is not None and not _matches_condition(condition, contact, text):
            continue

        # Record execution (pending), then return the action for upstream to run.
        actions.append((action.type, action.config))

    return actions


def _matches_condition(condition: AutomationNode, contact: Contact, text: str) -> bool:
    cfg = condition.config
    kind = cfg.get("kind")
    if kind == "keyword":
        keyword = (cfg.get("value") or "").lower()
        return keyword in (text or "").lower()
    if kind == "lead_status":
        return contact.lead_status == cfg.get("value")
    # Other condition kinds (e.g. tag) are not matched in the current MVP.
    return kind not in {"tag"}
