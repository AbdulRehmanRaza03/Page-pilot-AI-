"""Facebook OAuth + Page connection service."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.core.errors import MetaApiError as MetaErr
from app.core.security import decrypt_secret, encrypt_secret
from app.models import FacebookAccount, FacebookPage, PageToken, User, Workspace
from app.schemas.facebook import AvailablePage
from app.services.meta_client import MetaApiError, MetaClient


async def connect_oauth_account(
    db: AsyncSession,
    workspace: Workspace,
    user: User,
    meta: MetaClient,
    short_lived_token: str,
) -> FacebookAccount:
    """Exchange short-lived token for long-lived, store the account, and return it."""
    try:
        exchanged = await meta.exchange_long_lived_token(short_lived_token)
    except MetaApiError as exc:
        raise MetaErr(f"Facebook token exchange failed: {exc.message}") from exc

    long_lived = exchanged.get("access_token")
    expires_in = exchanged.get("expires_in")  # seconds (optional)

    from datetime import UTC, datetime, timedelta

    expires_at = (
        datetime.now(UTC) + timedelta(seconds=int(expires_in))
        if expires_in
        else None
    )

    # Identify the app-scoped Facebook user id via debug_token.
    try:
        debug = await meta.debug_token(long_lived)
    except MetaApiError:
        debug = {}

    fb_user_id = debug.get("user_id", str(uuid.uuid4()))

    account = FacebookAccount(
        user_id=user.id,
        facebook_user_id=str(fb_user_id),
        long_lived_token_enc=encrypt_secret(long_lived),
        token_expires_at=expires_at,
    )
    db.add(account)
    await db.flush()
    await db.commit()
    return account


async def list_available_pages(
    db: AsyncSession,
    account: FacebookAccount,
    meta: MetaClient,
) -> list[AvailablePage]:
    token = decrypt_secret(account.long_lived_token_enc)
    try:
        pages = await meta.list_accounts(token)
    except MetaApiError as exc:
        raise MetaErr(f"Failed to list Pages: {exc.message}") from exc

    result: list[AvailablePage] = []
    for p in pages:
        result.append(
            AvailablePage(
                page_id=p["id"],
                name=p.get("name", ""),
                category=p.get("category"),
                tasks=p.get("tasks"),
            )
        )
    return result


async def connect_page(
    db: AsyncSession,
    workspace: Workspace,
    account: FacebookAccount,
    meta: MetaClient,
    page_id: str,
) -> FacebookPage:
    # Ensure not already connected.
    existing = await db.execute(
        select(FacebookPage).where(
            FacebookPage.workspace_id == workspace.id,
            FacebookPage.page_id == page_id,
            FacebookPage.disconnected_at.is_(None),
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise ConflictError("Page already connected")

    token = decrypt_secret(account.long_lived_token_enc)
    try:
        accounts = await meta.list_accounts(token)
    except MetaApiError as exc:
        raise MetaErr(f"Failed to list Pages: {exc.message}") from exc

    match = next((p for p in accounts if p["id"] == page_id), None)
    if match is None:
        raise NotFoundError("Page not found among authorized Pages")

    page = FacebookPage(
        workspace_id=workspace.id,
        facebook_account_id=account.id,
        page_id=page_id,
        name=match.get("name", ""),
        category=match.get("category"),
        picture_url=_extract_picture(match),
        status="connected",
        tasks=match.get("tasks"),
    )
    db.add(page)
    await db.flush()

    # Store the Page access token (encrypted).
    page_token = match.get("access_token")
    if page_token:
        db.add(
            PageToken(
                facebook_page_id=page.id,
                token_enc=encrypt_secret(page_token),
                scopes=[],  # page tokens don't list scopes in /me/accounts
            )
        )

    await db.commit()
    await db.refresh(page)
    return page


async def list_pages(db: AsyncSession, workspace: Workspace) -> list[FacebookPage]:
    result = await db.execute(
        select(FacebookPage).where(
            FacebookPage.workspace_id == workspace.id,
            FacebookPage.disconnected_at.is_(None),
        )
    )
    return list(result.scalars().all())


async def disconnect_page(db: AsyncSession, workspace: Workspace, page_id: str) -> FacebookPage:
    result = await db.execute(
        select(FacebookPage).where(
            FacebookPage.workspace_id == workspace.id,
            FacebookPage.page_id == page_id,
            FacebookPage.disconnected_at.is_(None),
        )
    )
    page = result.scalar_one_or_none()
    if page is None:
        raise NotFoundError("Page not connected")

    from datetime import UTC, datetime

    page.status = "disconnected"
    page.disconnected_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(page)
    return page


def _extract_picture(page: dict) -> str | None:
    picture = page.get("picture")
    if isinstance(picture, dict):
        data = picture.get("data")
        if isinstance(data, dict):
            return data.get("url")
    return None
