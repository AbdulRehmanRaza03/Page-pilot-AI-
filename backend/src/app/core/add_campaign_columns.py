"""Add broadcast columns to the campaigns table (non-destructive).

Usage:
    python -m app.core.add_campaign_columns

Adds: page_id, enabled, sent_count, total_count.
Safe to re-run (IF NOT EXISTS).
"""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import text

import app.models  # noqa: F401
from app.core.db import engine

_STATEMENTS = [
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS page_id UUID NULL",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent_count INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_count INTEGER NOT NULL DEFAULT 0",
]


async def main() -> None:
    async with engine.begin() as conn:
        for stmt in _STATEMENTS:
            await conn.execute(text(stmt))
    print("Campaign broadcast columns ensured.")
    await engine.dispose()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:  # noqa: BLE001
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
