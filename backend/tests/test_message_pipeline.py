from __future__ import annotations

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.db import Base
from app.main import app
from app.models import Contact, Conversation, FacebookAccount, FacebookPage, Message, User, Workspace


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


async def _seed() -> None:
    from app.core.db import async_session_factory
    from app.core.security import hash_password

    async with async_session_factory() as db:
        u = User(email="seed@x.com", password_hash=hash_password("password123"))
        db.add(u)
        await db.flush()
        ws = Workspace(name="W", slug="w", owner_id=u.id)
        db.add(ws)
        await db.flush()
        account = FacebookAccount(user_id=u.id, facebook_user_id="fb1", long_lived_token_enc="enc")
        db.add(account)
        await db.flush()
        page = FacebookPage(
            workspace_id=ws.id,
            facebook_account_id=account.id,
            page_id="PAGE_123",
            name="Test Page",
        )
        db.add(page)
        await db.commit()


def _payload(mid: str, text: str, psid: str) -> dict:
    return {
        "object": "page",
        "entry": [
            {
                "id": "PAGE_123",
                "time": 1,
                "messaging": [
                    {
                        "sender": {"id": psid},
                        "recipient": {"id": "PAGE_123"},
                        "message": {"mid": mid, "text": text},
                    }
                ],
            }
        ],
    }


async def test_inbound_message_pipeline(client: AsyncClient) -> None:
    from app.core.db import async_session_factory

    await _seed()

    # First message
    res = await client.post("/webhooks/meta", json=_payload("mid.abc", "Hi, do you have this?", "PSID_1"))
    assert res.status_code == 200

    # Duplicate (should dedupe)
    await client.post("/webhooks/meta", json=_payload("mid.abc", "Hi, do you have this?", "PSID_1"))

    # A second distinct message from same contact
    await client.post("/webhooks/meta", json=_payload("mid.def", "Also what price?", "PSID_1"))

    async with async_session_factory() as db:
        contacts = (await db.execute(select(Contact))).scalars().all()
        assert len(contacts) == 1
        assert contacts[0].psid == "PSID_1"

        conversations = (await db.execute(select(Conversation))).scalars().all()
        assert len(conversations) == 1  # same open thread reused
        assert conversations[0].unread_count == 2

        messages = (await db.execute(select(Message))).scalars().all()
        assert len(messages) == 2  # duplicate deduped
        texts = {m.body for m in messages}
        assert texts == {"Hi, do you have this?", "Also what price?"}
