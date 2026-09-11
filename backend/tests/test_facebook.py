from __future__ import annotations

import httpx
import pytest_asyncio
import respx
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.core.db import Base
from app.modules.facebook import service
from app.services.meta_client import MetaClient

GRAPH = f"https://graph.facebook.com/{settings.meta_graph_version}"


@pytest_asyncio.fixture
async def meta() -> MetaClient:
    c = MetaClient()
    yield c
    await c.aclose()


async def test_connect_page_flow(meta: MetaClient) -> None:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    from app.core.db import async_session_factory

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async_session_factory.configure(bind=engine)

    # Create a user + workspace for the FK.
    from app.core.security import hash_password
    from app.models import User, Workspace

    async with async_session_factory() as db:
        u = User(email="fb@example.com", password_hash=hash_password("password123"))
        db.add(u)
        await db.flush()
        w = Workspace(name="W", slug="w", owner_id=u.id)
        db.add(w)
        await db.flush()

        # Mock Meta endpoints.
        with respx.mock(assert_all_called=False) as mock:
            mock.get(f"{GRAPH}/oauth/access_token").mock(
                return_value=httpx.Response(
                    200, json={"access_token": "LONG_TOKEN", "expires_in": 5184000}
                )
            )
            mock.get(f"{GRAPH}/debug_token").mock(
                return_value=httpx.Response(200, json={"data": {"user_id": "12345"}})
            )

            acct = await service.connect_oauth_account(db, w, u, meta, "SHORT_TOKEN")
            assert acct.facebook_user_id == "12345"

        # List available pages
        with respx.mock(assert_all_called=False) as mock:
            mock.get(
                f"{GRAPH}/me/accounts"
            ).mock(
                return_value=httpx.Response(
                    200,
                    json={
                        "data": [
                            {
                                "id": "PAGE1",
                                "name": "ABC Clothing",
                                "category": "Brand",
                                "access_token": "PAGE_TOKEN",
                                "tasks": ["MESSAGING"],
                            }
                        ]
                    },
                )
            )
            pages = await service.list_available_pages(db, acct, meta)
            assert len(pages) == 1
            assert pages[0].page_id == "PAGE1"

            # Connect the page
            page = await service.connect_page(db, w, acct, meta, "PAGE1")
            assert page.page_id == "PAGE1"
            assert page.name == "ABC Clothing"

            # Connect again -> idempotent (same workspace returns existing page)
            again = await service.connect_page(db, w, acct, meta, "PAGE1")
            assert again.id == page.id

            # A different workspace cannot claim the same Meta page.
            w2 = Workspace(name="W2", slug="w2", owner_id=u.id)
            db.add(w2)
            await db.flush()

            import pytest

            from app.core.errors import ConflictError

            with pytest.raises(ConflictError):
                await service.connect_page(db, w2, acct, meta, "PAGE1")

    await engine.dispose()
