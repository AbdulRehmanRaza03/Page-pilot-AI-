from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.errors import UnauthorizedError
from app.models import User
from app.modules.auth.deps import get_current_user
from app.modules.auth.service import login, refresh, register
from app.modules.workspaces import service as workspaces_service
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.workspaces import MeResponse
from app.services import google_oauth

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register_route(data: RegisterRequest, db: Annotated[AsyncSession, Depends(get_db)]) -> TokenResponse:
    user, _workspace = await register(db, data)
    return await login(db, data.email, data.password, None, None)


@router.post("/login", response_model=TokenResponse)
async def login_route(
    data: LoginRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return await login(db, data.email, data.password, ip, ua)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_route(data: RefreshRequest, db: Annotated[AsyncSession, Depends(get_db)]) -> TokenResponse:
    return await refresh(db, data.refresh_token)


@router.get("/me", response_model=MeResponse)
async def me(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MeResponse:
    workspaces = await workspaces_service.list_workspaces(db, user)
    return MeResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        email_verified=user.email_verified_at is not None,
        workspaces=workspaces,
    )


@router.get("/google/start")
async def google_start() -> dict:
    """Return the Google OAuth authorization URL for the frontend."""
    return google_oauth.build_google_auth_url()


@router.get("/google/callback")
async def google_callback(
    code: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    state: str | None = None,
):
    """Handle the Google OAuth redirect. Exchanges code, finds/creates user,
    then redirects to the frontend with tokens in the URL fragment.
    """
    from fastapi.responses import RedirectResponse

    from app.core.config import settings

    try:
        tokens = await google_oauth.exchange_code(code)
        access = tokens.get("access_token")
        if not access:
            raise UnauthorizedError("Google token exchange failed")
        info = await google_oauth.get_userinfo(access)
        email = info.get("email")
        name = info.get("name")
    except Exception:
        return RedirectResponse(
            url=f"{settings.google_frontend_redirect}?auth=error"
        )

    from app.modules.auth.google_service import google_login

    result = await google_login(db, email, name, None, None)

    return RedirectResponse(
        url=(
            f"{settings.google_frontend_redirect}"
            f"#access_token={result.access_token}"
            f"&refresh_token={result.refresh_token}"
        )
    )
