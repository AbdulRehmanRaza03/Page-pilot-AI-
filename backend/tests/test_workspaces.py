from __future__ import annotations

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.db import Base
from app.main import app

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def client():
    engine = create_async_engine(TEST_DB_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    from app.core.db import async_session_factory

    async_session_factory.configure(bind=engine)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    await engine.dispose()


async def test_register_then_list_workspaces(client: AsyncClient) -> None:
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "ws@example.com", "password": "password123", "full_name": "WS User"},
    )
    assert res.status_code == 201
    token = res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    ws = await client.get("/api/v1/workspaces", headers=headers)
    assert ws.status_code == 200
    workspaces = ws.json()["workspaces"]
    assert len(workspaces) == 1
    assert workspaces[0]["role"] == "owner"

    # Create a new workspace
    created = await client.post(
        "/api/v1/workspaces", json={"name": "Second Workspace"}, headers=headers
    )
    assert created.status_code == 201
    assert created.json()["name"] == "Second Workspace"

    # Now list -> 2
    ws2 = await client.get("/api/v1/workspaces", headers=headers)
    assert len(ws2.json()["workspaces"]) == 2


async def test_workspaces_requires_auth(client: AsyncClient) -> None:
    res = await client.get("/api/v1/workspaces")
    assert res.status_code == 401
