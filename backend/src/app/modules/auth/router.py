from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
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
