from __future__ import annotations

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.core.db import Base
from app.main import app


@pytest_asyncio.fixture
async def client():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    from app.core.db import async_session_factory

    async_session_factory.configure(bind=engine)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    await engine.dispose()


async def test_webhook_verification(client: AsyncClient) -> None:
    settings.meta_webhook_verify_token = "test_verify_token"
    res = await client.get(
        "/webhooks/meta",
        params={
            "hub.mode": "subscribe",
            "hub.challenge": "12345",
            "hub.verify_token": "test_verify_token",
        },
    )
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/plain")
    assert res.text == "12345"


async def test_webhook_verification_wrong_token(client: AsyncClient) -> None:
    settings.meta_webhook_verify_token = "correct"
    res = await client.get(
        "/webhooks/meta",
        params={
            "hub.mode": "subscribe",
            "hub.challenge": "12345",
            "hub.verify_token": "wrong",
        },
    )
    assert res.status_code == 403


async def test_webhook_receive(client: AsyncClient) -> None:
    payload = {
        "object": "page",
        "entry": [
            {
                "id": "123456",
                "time": 1458692752478,
                "messaging": [
                    {
                        "sender": {"id": "PSID1"},
                        "recipient": {"id": "123456"},
                        "message": {"mid": "mid.123", "text": "hello"},
                    }
                ],
            }
        ],
    }
    res = await client.post("/webhooks/meta", json=payload)
    assert res.status_code == 200
    assert res.json() == {"received": True}
