"""Add avatar_url column to users (non-destructive).

Usage:
    python -m app.core.add_user_avatar
"""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import text

import app.models  # noqa: F401
from app.core.db import engine


async def main() -> None:
    async with engine.begin() as conn:
        await conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1024) NULL")
        )
    print("users.avatar_url column ensured.")
    await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:  # noqa: BLE001
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
