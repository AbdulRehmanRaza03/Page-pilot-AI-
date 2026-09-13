from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models import Workspace
from app.modules.ai.provider import get_provider
from app.modules.auth.deps import get_workspace

router = APIRouter(tags=["ai"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[dict] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> ChatResponse:
    provider = get_provider()
    # Build the full message list from history + the new user message so the
    # assistant has conversation context instead of only the latest message.
    messages = [
        {"role": m.get("role", "user"), "content": m.get("content", "")}
        for m in body.history
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]
    messages.append({"role": "user", "content": body.message})
    reply = await provider.chat(messages)
    return ChatResponse(reply=reply)
