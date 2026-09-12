"""AI assistant provider abstraction.

Supports a real LLM provider (OpenAI-compatible) and a deterministic mock
fallback so the app never crashes when no API key is configured.
"""

from __future__ import annotations

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("pagepilot.ai")


class AIProvider:
    """Base provider."""

    async def chat(self, messages: list[dict], context: str | None = None) -> str:
        raise NotImplementedError


class MockAIProvider(AIProvider):
    """Deterministic fallback used when no LLM key is set."""

    async def chat(self, messages: list[dict], context: str | None = None) -> str:
        last = messages[-1]["content"] if messages else ""
        lower = last.lower()
        if any(k in lower for k in ("lead", "summary", "summar")):
            return (
                "Here's a summary of your recent activity: I found conversation and "
                "lead activity in your workspace. Connect more data to see detailed insights. "
                "(AI is running in mock mode — set your LLM API key for full responses.)"
            )
        if "draft" in lower or "reply" in lower:
            return (
                "Here's a suggested reply: \"Hi! Thanks for reaching out. How can I help you "
                "today?\" (Mock mode — configure an LLM key for personalized drafts.)"
            )
        return (
            "I can help with leads, conversations, and automations. Please ask a specific "
            "question, for example: \"Show me my leads\" or \"Summarize my conversations.\" "
            "(Running in mock mode.)"
        )


class OpenAIProvider(AIProvider):
    """OpenAI-compatible chat completions provider.

    Supports both OpenAI and DeepSeek via the `llm_provider` setting:
    - openai  -> https://api.openai.com/v1/chat/completions
    - deepseek -> https://api.deepseek.com/chat/completions
    """

    def _base_url(self) -> str:
        provider = (settings.llm_provider or "").lower()
        if provider == "deepseek":
            return "https://api.deepseek.com/chat/completions"
        return "https://api.openai.com/v1/chat/completions"

    async def chat(self, messages: list[dict], context: str | None = None) -> str:
        system = (
            "You are PagePilot AI, a business automation assistant. Be concise and helpful. "
            f"Context: {context or 'No extra context provided.'}"
        )
        provider = (settings.llm_provider or "").lower()
        model = settings.llm_model or ("deepseek-chat" if provider == "deepseek" else "gpt-4o-mini")
        payload = {
            "model": model,
            "messages": [{"role": "system", "content": system}, *messages],
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                self._base_url(),
                headers={"Authorization": f"Bearer {settings.llm_api_key}"},
                json=payload,
            )
            if r.status_code != 200:
                logger.error("LLM error: %s %s", r.status_code, r.text[:200])
                # Fall back to mock rather than crash.
                return await MockAIProvider().chat(messages, context)
            data = r.json()
            return data["choices"][0]["message"]["content"]


def get_provider() -> AIProvider:
    if settings.llm_api_key:
        return OpenAIProvider()
    return MockAIProvider()
