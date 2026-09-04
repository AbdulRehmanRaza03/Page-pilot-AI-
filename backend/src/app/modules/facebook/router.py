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
async def oauth_start(redirect_uri: str) -> dict:
    """Return the Facebook Login URL the frontend should redirect the user to."""
    import secrets

    state = secrets.token_urlsafe(24)
    return {"url": build_login_url(redirect_uri, state), "state": state}


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
