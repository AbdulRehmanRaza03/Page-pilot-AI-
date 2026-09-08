from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


# PgBouncer (Supabase pooler) in transaction mode does not support prepared
# statements. Disable asyncpg's statement cache to remain compatible.
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    connect_args={"statement_cache_size": 0},
)

async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency that yields a scoped async session."""
    async with async_session_factory() as session:
        yield session
