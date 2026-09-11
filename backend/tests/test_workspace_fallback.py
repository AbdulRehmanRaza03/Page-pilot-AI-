from __future__ import annotations

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

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


async def test_workspace_fallback_without_header(client: AsyncClient) -> None:
    # Register (creates user + workspace).
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "fallback@example.com", "password": "password123", "full_name": "FB User"},
    )
    assert res.status_code == 201
    access = res.json()["access_token"]

    # Call /workspaces WITHOUT X-Workspace-Id header (just Bearer).
    res2 = await client.get(
        "/api/v1/workspaces", headers={"Authorization": f"Bearer {access}"}
    )
    assert res2.status_code == 200
    workspaces = res2.json()["workspaces"]
    assert len(workspaces) == 1

    # Now call /facebook/pages WITHOUT X-Workspace-Id header — should fall back
    # to the user's workspace instead of returning 403.
    res3 = await client.get(
        "/api/v1/facebook/pages", headers={"Authorization": f"Bearer {access}"}
    )
    # Either 200 (empty list) is the success path; must NOT be 403.
    assert res3.status_code == 200
    assert res3.json() == []
