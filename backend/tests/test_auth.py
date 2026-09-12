from __future__ import annotations

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.db import Base
from app.main import app

# Use in-memory SQLite for tests (models must be SQLite-compatible; JSONB falls back to JSON).
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


async def test_register_login_me(client: AsyncClient) -> None:
    res = await client.post(
        "/api/v1/auth/register",
        json={"email": "owner@example.com", "password": "password123", "full_name": "Owner"},
    )
    assert res.status_code == 201, res.text
    body = res.json()
    access = body["access_token"]
    refresh = body["refresh_token"]

    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access}"})
    assert me.status_code == 200
    assert me.json()["email"] == "owner@example.com"

    # login with same creds
    res2 = await client.post(
        "/api/v1/auth/login",
        json={"email": "owner@example.com", "password": "password123"},
    )
    assert res2.status_code == 200

    # refresh
    res3 = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert res3.status_code == 200
    assert "access_token" in res3.json()


async def test_login_wrong_password(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/register",
        json={"email": "x@example.com", "password": "password123"},
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "x@example.com", "password": "wrong"},
    )
    assert res.status_code == 401
