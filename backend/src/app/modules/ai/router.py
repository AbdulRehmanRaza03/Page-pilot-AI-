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

router = APIRouter(tags=["ai"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[dict] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    tool: str | None = None
    data: dict | None = None


def _detect_intent(text: str) -> str | None:
    """Simple, reliable intent detection for the read-only tools."""
    t = text.lower()
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
