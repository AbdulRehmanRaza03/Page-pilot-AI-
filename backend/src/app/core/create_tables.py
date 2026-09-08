"""Create all database tables against the configured DATABASE_URL.

Usage:
    python -m app.core.create_tables

This is a convenience helper for local/prod first setup. For proper
versioned migrations, use Alembic (alembic upgrade head).
"""

from __future__ import annotations

import asyncio
import sys

import app.models  # noqa: F401  (register all models)
from app.core.db import Base, engine


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("All tables created successfully.")
    await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:  # noqa: BLE001
        print(f"Error creating tables: {exc}", file=sys.stderr)
        sys.exit(1)
