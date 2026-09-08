from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.errors import NotFoundError, ValidationError
from app.models import FacebookAccount, User, Workspace
from app.modules.auth.deps import get_current_user, get_workspace
from app.modules.facebook import service
from app.schemas.facebook import (
    ConnectPageRequest,
    FacebookAccountOut,
    FacebookPageOut,
    ListAvailablePagesResponse,
)
from app.services.meta_client import build_login_url, meta_client

router = APIRouter(tags=["facebook"])


async def _get_account(db: AsyncSession, user_id) -> FacebookAccount:
    result = await db.execute(
        select(FacebookAccount)
        .where(FacebookAccount.user_id == user_id, FacebookAccount.revoked_at.is_(None))
        .order_by(FacebookAccount.created_at.desc())
    )
    account = result.scalars().first()
    if account is None:
        raise NotFoundError("No Facebook account connected")
    return account


@router.get("/oauth/start")
async def oauth_start(
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Return the Facebook Login URL and persist an OAuth state token."""
    import secrets
    from datetime import UTC, datetime, timedelta

    from app.core.config import settings
    from app.models import OAuthState

    state = secrets.token_urlsafe(32)
    db.add(
        OAuthState(
            state=state,
            user_id=user.id,
            workspace_id=workspace.id,
            provider="facebook",
            expires_at=datetime.now(UTC) + timedelta(minutes=10),
        )
    )
    await db.commit()

    return {
        "url": build_login_url(settings.meta_redirect_uri, state),
        "state": state,
        "redirect_uri": settings.meta_redirect_uri,
    }


@router.get("/oauth/callback")
async def oauth_callback(
    code: str,
    state: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Handle the Facebook OAuth redirect. Resolves the initiating user/workspace
    from the OAuth state token (callbacks cannot carry auth headers)."""
    import logging
    from datetime import UTC, datetime

    from fastapi.responses import RedirectResponse
    from sqlalchemy import select

    from app.core.config import settings
    from app.models import OAuthState, User, Workspace

    log = logging.getLogger("pagepilot.facebook")

    # Resolve state → user + workspace.
    result = await db.execute(
        select(OAuthState, User, Workspace)
        .join(User, User.id == OAuthState.user_id)
        .outerjoin(Workspace, Workspace.id == OAuthState.workspace_id)
        .where(OAuthState.state == state)
    )
    row = result.first()
    if row is None:
        log.error("Facebook OAuth callback: state not found or already consumed")
        return RedirectResponse(url=f"{settings.meta_frontend_redirect}?facebook=error&reason=invalid_state")
    oauth_state, user, workspace = row

    if oauth_state.expires_at < datetime.now(UTC):
        log.error("Facebook OAuth callback: state expired")
        return RedirectResponse(url=f"{settings.meta_frontend_redirect}?facebook=error&reason=state_expired")

    try:
        exchanged = await meta_client.exchange_code(code, settings.meta_redirect_uri)
        short_token = exchanged.get("access_token")
        if not short_token:
            log.error("Facebook OAuth callback: token exchange returned no access_token")
            return RedirectResponse(url=f"{settings.meta_frontend_redirect}?facebook=error&reason=no_token")
        await service.connect_oauth_account(db, workspace, user, meta_client, short_token)
    except Exception as exc:
        log.exception("Facebook OAuth callback failed: %s", exc)
        return RedirectResponse(url=f"{settings.meta_frontend_redirect}?facebook=error&reason=exception")

    # One-time use: invalidate the consumed state.
    await db.delete(oauth_state)
    await db.commit()

    log.info("Facebook OAuth connected for user %s", user.id)
    return RedirectResponse(url=f"{settings.meta_frontend_redirect}?facebook=connected")


@router.post("/oauth/connect", response_model=FacebookAccountOut, status_code=201)
async def oauth_connect(
    payload: dict,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
    user: Annotated[User, Depends(get_current_user)],
) -> FacebookAccountOut:
    short_token = payload.get("short_lived_token")
    if not short_token:
        raise ValidationError("short_lived_token is required")
    account = await service.connect_oauth_account(db, workspace, user, meta_client, short_token)
    return FacebookAccountOut.model_validate(account)


@router.get("/available-pages", response_model=ListAvailablePagesResponse)
async def available_pages(
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
    user: Annotated[User, Depends(get_current_user)],
) -> ListAvailablePagesResponse:
    account = await _get_account(db, user.id)
    pages = await service.list_available_pages(db, account, meta_client)
    return ListAvailablePagesResponse(pages=pages)


@router.post("/pages", response_model=FacebookPageOut, status_code=201)
async def connect_page(
    body: ConnectPageRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
    user: Annotated[User, Depends(get_current_user)],
) -> FacebookPageOut:
    account = await _get_account(db, user.id)
    page = await service.connect_page(db, workspace, account, meta_client, body.page_id)
    return FacebookPageOut.model_validate(page)


@router.get("/pages", response_model=list[FacebookPageOut])
async def list_pages(
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> list[FacebookPageOut]:
    pages = await service.list_pages(db, workspace)
    return [FacebookPageOut.model_validate(p) for p in pages]


@router.delete("/pages/{page_id}", response_model=FacebookPageOut)
async def disconnect_page(
    page_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> FacebookPageOut:
    page = await service.disconnect_page(db, workspace, page_id)
    return FacebookPageOut.model_validate(page)
