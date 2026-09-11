from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.errors import AppError
from app.core.logging import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Local demo convenience: auto-create tables for SQLite.
    # Production uses Alembic migrations against PostgreSQL.
    if settings.database_url.startswith("sqlite"):
        from app.core.db import Base, engine

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield


def create_app() -> FastAPI:
    setup_logging()

    app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppError)
    async def app_error_handler(_, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=exc.to_dict())

    @app.get("/healthz", tags=["health"])
    async def healthz() -> dict:
        return {"status": "ok"}

    @app.get("/readyz", tags=["health"])
    async def readyz() -> dict:
        # TODO: check DB + Redis connectivity once wired up.
        return {"status": "ready"}

    # Routers
    from app.modules.ai.router import router as ai_router
    from app.modules.analytics.router import router as analytics_router
    from app.modules.auth.router import router as auth_router
    from app.modules.automations.router import router as automations_router
    from app.modules.campaigns.router import router as campaigns_router
    from app.modules.facebook.router import router as facebook_router
    from app.modules.messaging.router import router as messaging_router
    from app.modules.webhooks.router import router as webhooks_router
    from app.modules.workspaces.router import router as workspaces_router

    app.include_router(auth_router, prefix=f"{settings.api_prefix}/auth", tags=["auth"])
    app.include_router(facebook_router, prefix=f"{settings.api_prefix}/facebook", tags=["facebook"])
    app.include_router(workspaces_router, prefix=f"{settings.api_prefix}/workspaces", tags=["workspaces"])
    app.include_router(webhooks_router, prefix="/webhooks", tags=["webhooks"])
    app.include_router(messaging_router, prefix=f"{settings.api_prefix}", tags=["messaging"])
    app.include_router(analytics_router, prefix=f"{settings.api_prefix}/analytics", tags=["analytics"])
    app.include_router(automations_router, prefix=f"{settings.api_prefix}/automations", tags=["automations"])
    app.include_router(campaigns_router, prefix=f"{settings.api_prefix}/campaigns", tags=["campaigns"])
    app.include_router(ai_router, prefix=f"{settings.api_prefix}/ai", tags=["ai"])

    return app


app = create_app()
