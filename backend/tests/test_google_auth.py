from __future__ import annotations

import httpx
import pytest_asyncio
import respx
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

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


async def test_google_start_returns_url(client: AsyncClient) -> None:
    res = await client.get("/api/v1/auth/google/start")
    assert res.status_code == 200
    data = res.json()
    assert "url" in data
    assert "accounts.google.com" in data["url"]
    assert "state" in data


async def test_google_callback_create_user(client: AsyncClient) -> None:
    # Mock Google token + userinfo endpoints.
    with respx.mock(assert_all_called=False) as mock:
        mock.post("https://oauth2.googleapis.com/token").mock(
            return_value=httpx.Response(
                200,
                json={"access_token": "GOOGLE_ACCESS", "id_token": "ID_TOKEN"},
            )
        )
        mock.get("https://www.googleapis.com/oauth2/v2/userinfo").mock(
            return_value=httpx.Response(
                200,
                json={"email": "user@gmail.com", "name": "Real User"},
            )
        )

        res = await client.get(
            "/api/v1/auth/google/callback",
            params={"code": "AUTH_CODE", "state": "xyz"},
            follow_redirects=False,
        )

    assert res.status_code == 307  # redirect
    location = res.headers.get("location", "")
    assert "access_token" in location
    assert "refresh_token" in location

    # The tokens in the fragment should be valid; verify /me works.
    frag = location.split("#", 1)[1]
    pairs = dict(p.split("=", 1) for p in frag.split("&"))
    access = pairs["access_token"]

    me = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {access}"}
    )
    assert me.status_code == 200
    assert me.json()["email"] == "user@gmail.com"
    assert me.json()["email_verified"] is True
