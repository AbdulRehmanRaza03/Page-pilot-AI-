from __future__ import annotations

from app.modules.ai.provider import MockAIProvider


async def test_mock_ai_provider_never_crashes() -> None:
    p = MockAIProvider()
    reply = await p.chat([{"role": "user", "content": "Summarize my conversations"}])
    assert isinstance(reply, str)
    assert len(reply) > 0


async def test_mock_ai_reply_draft() -> None:
    p = MockAIProvider()
    reply = await p.chat([{"role": "user", "content": "Draft a reply to this customer"}])
    assert "reply" in reply.lower() or "mock" in reply.lower()


async def test_get_provider_falls_back() -> None:
    from app.core.config import settings
    from app.modules.ai.provider import MockAIProvider, get_provider

    settings.llm_api_key = ""
    provider = get_provider()
    assert isinstance(provider, MockAIProvider)
