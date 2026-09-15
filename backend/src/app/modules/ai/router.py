from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models import Workspace
from app.modules.ai import tools
from app.modules.ai.provider import get_provider
from app.modules.auth.deps import get_workspace
from app.schemas.campaigns import CampaignCreate

router = APIRouter(tags=["ai"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[dict] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    tool: str | None = None
    data: dict | None = None


def _detect_intent(text: str) -> str | None:
    """Simple, reliable intent detection for the tools.

    External actions (send/broadcast) are checked FIRST so phrases like
    "send to all leads" aren't misclassified as a lead-search.
    """
    t = text.lower()
    if any(k in t for k in ("campaign", "broadcast", "send to", "send all", "send my", "send a", "blast")):
        return "send_campaign"
    if any(k in t for k in ("lead", "contact", "customer", "who asked", "find")):
        return "search_contacts"
    if any(k in t for k in ("analytics", "performance", "metric", "stat", "dashboard", "how many")):
        return "analytics"
    if any(k in t for k in ("conversation", "inbox", "unread", "message")):
        return "get_conversations"
    if any(k in t for k in ("draft", "reply", "write a", "respond")):
        return "draft_reply"
    return None


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> ChatResponse:
    provider = get_provider()

    messages = [
        {"role": m.get("role", "user"), "content": m.get("content", "")}
        for m in body.history
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]
    messages.append({"role": "user", "content": body.message})

    # Detect + run a read-only tool, then feed the real result to the LLM so it
    # can answer with actual data instead of a generic canned reply.
    intent = _detect_intent(body.message)
    tool_name: str | None = None
    tool_data: dict | None = None
    context_context: str | None = None

    if intent == "search_contacts":
        tool_name = "search_contacts"
        tool_data = await tools.search_contacts(db, workspace)
        context_context = _contacts_to_text(tool_data)
    elif intent == "analytics":
        tool_name = "analytics"
        tool_data = await tools.get_analytics(db, workspace)
        context_context = (
            f"Dashboard metrics: connected pages {tool_data.get('connected_pages', 0)}, "
            f"contacts {tool_data.get('contacts', 0)}, conversations {tool_data.get('conversations', 0)}, "
            f"unread {tool_data.get('unread_conversations', 0)}, messages {tool_data.get('messages', 0)}, "
            f"campaigns {tool_data.get('campaigns', 0)}, new leads {tool_data.get('new_leads', 0)}."
        )
    elif intent == "get_conversations":
        tool_name = "get_conversations"
        tool_data = await tools.get_conversations(db, workspace)
        context_context = (
            f"You have {tool_data.get('count', 0)} recent conversations "
            f"and {tool_data.get('unread', 0)} unread messages."
        )
    elif intent == "draft_reply":
        tool_name = "draft_reply"
        tool_data = None
        context_context = None
    elif intent == "send_campaign":
        tool_name = "send_campaign"
        # Extract a simple message from the user's request (heuristic).
        message = _extract_campaign_message(body.message)
        tool_data = await tools.prepare_campaign(db, workspace, message)
        context_context = (
            f"The user wants to send a campaign to {tool_data['audience']} contacts "
            f"with the message: \"{message}\". This is an external action that "
            "requires explicit confirmation before sending."
        )

    reply = await provider.chat(messages, context=context_context)
    return ChatResponse(reply=reply, tool=tool_name, data=tool_data)


def _contacts_to_text(data: dict) -> str:
    contacts = data.get("contacts", [])
    if not contacts:
        return "No contacts/leads found in this workspace."
    lines = []
    for c in contacts[:20]:
        lines.append(
            f"- {c['name']} (status: {c['lead_status']}, score: {c['lead_score']})"
        )
    return (
        f"Found {data.get('count', 0)} contacts/leads. Top results:\n"
        + "\n".join(lines)
    )


def _extract_campaign_message(text: str) -> str:
    """Heuristically pull a campaign message out of the user's request.

    Extracts text inside the outermost quotes, otherwise falls back to the
    whole request stripped of common lead-in phrases.
    """
    import re

    m = re.search(r'["\'](.+?)["\']', text)
    if m:
        return m.group(1).strip()
    # Fallback: strip lead-in phrases and use the remainder.
    for phrase in (
        "send to all", "send all", "send my", "send a campaign", "broadcast",
        "send", "to all leads", "all leads",
    ):
        text = text.replace(phrase, "")
    cleaned = text.strip(" :-")
    return cleaned or "Thanks for reaching out!"


class ConfirmRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ConfirmResponse(BaseModel):
    sent: int
    skipped: int
    failed: int


@router.post("/confirm-send", response_model=ConfirmResponse)
async def confirm_send(
    body: ConfirmRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> ConfirmResponse:
    """Execute a broadcast campaign after the user has explicitly confirmed.

    This is the only place the AI assistant can trigger an actual external
    send, and it always requires a direct user confirmation call.
    """
    from app.modules.campaigns import service as campaign_service

    # Use the workspace owner as the campaign author.
    owner_id = workspace.owner_id
    data = CampaignCreate(
        name="AI Broadcast",
        message=body.message,
        page_id=None,
        audience_filter=None,
        schedule_at=None,
        recipient_limit=None,
        gap_seconds=5,
    )
    campaign = await campaign_service.create_campaign(db, workspace, data, owner_id)
    summary = await campaign_service.run_pending_send(db, workspace, campaign.id)
    return ConfirmResponse(
        sent=summary.get("sent", 0),
        skipped=summary.get("skipped", 0),
        failed=summary.get("failed", 0),
    )
