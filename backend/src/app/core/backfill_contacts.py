"""One-off data cleanup + enrichment script.

Usage:
    python -m app.core.backfill_contacts

Fixes historic data produced by early webhook bugs:
  - Deletes empty "bubble" messages (body IS NULL) that came from
    non-message webhook events (message_reads / message_echoes / deliveries).
  - Resets conversation unread_count to 0 (stale/buggy counters).
  - Enriches contacts that have no name/avatar by fetching their Meta profile
    using the connected Page token.

Safe to re-run: idempotent.
"""

from __future__ import annotations

import asyncio
import sys

from sqlalchemy import text

import app.models  # noqa: F401  (register all models)
from app.core.db import async_session_factory
from app.core.security import decrypt_secret
from app.models import Contact, FacebookPage
from app.services.meta_client import meta_client


async def main() -> None:
    async with async_session_factory() as db:
        # 1. Delete empty bubble messages (no body).
        deleted = await db.execute(
            text("DELETE FROM messages WHERE body IS NULL OR trim(body) = ''")
        )
        await db.commit()
        print(f"Deleted {deleted.rowcount or 0} empty message(s).")

        # 2. Reset stale unread counters.
        reset = await db.execute(
            text("UPDATE conversations SET unread_count = 0 WHERE unread_count > 0")
        )
        await db.commit()
        print(f"Reset unread count on {reset.rowcount or 0} conversation(s).")

        # 3. Enrich contacts missing a name/avatar.
        result = await db.execute(
            text("SELECT id, psid, page_id FROM contacts WHERE name IS NULL AND profile_url IS NULL")
        )
        rows = list(result)
        if not rows:
            print("No contacts to enrich.")
            await meta_client.aclose()
            return

        enriched = 0
        for cid, psid, page_id in rows:
            try:
                page = await db.get(FacebookPage, page_id)
                if page is None:
                    continue
                token_result = await db.execute(
                    text(
                        "SELECT token_enc FROM page_tokens "
                        "WHERE facebook_page_id = :pid AND (invalidated_at IS NULL) "
                        "ORDER BY created_at DESC LIMIT 1"
                    ),
                    {"pid": page.id},
                )
                token_row = token_result.first()
                if token_row is None:
                    continue
                page_token = decrypt_secret(token_row[0])

                profile = await meta_client.get_user_profile(psid, page_token)
                first = profile.get("first_name")
                last = profile.get("last_name")
                pic = profile.get("profile_pic")
                if not (first or last or pic):
                    continue

                contact = await db.get(Contact, cid)
                if first or last:
                    contact.name = f"{first or ''} {last or ''}".strip()
                if pic:
                    contact.profile_url = pic
                await db.commit()
                enriched += 1
            except Exception as exc:  # noqa: BLE001
                print(f"  enrich failed for psid={psid}: {exc}")

        print(f"Enriched {enriched} contact(s).")

    await meta_client.aclose()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:  # noqa: BLE001
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
