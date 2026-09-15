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
    # Auto-create tables on startup (idempotent — only missing tables are created,
    # existing data is never dropped). Ensures a fresh deploy works without a
    # separate manual migration step.
    from app.core.db import Base, engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Auto-add known missing columns (non-destructive) so a schema change in code
    # is picked up automatically on the next deploy.
    await _ensure_columns()
    yield


async def _ensure_columns() -> None:
    """Add known missing columns if the DB was created before they were added."""
    from sqlalchemy import text

    from app.core.db import engine

    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1024) NULL",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS page_id UUID NULL",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent_count INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_count INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS recipient_limit INTEGER NULL",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS gap_seconds INTEGER NOT NULL DEFAULT 5",
    ]
    try:
        async with engine.begin() as conn:
            for stmt in statements:
                await conn.execute(text(stmt))
    except Exception:  # noqa: BLE001
        # Never fail startup because of a column check (e.g. SQLite without ALTER).
        pass


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
        # Check DB connectivity so deployment issues are visible immediately.
        try:
            from sqlalchemy import text

            from app.core.db import async_session_factory

            async with async_session_factory() as db:
                await db.execute(text("SELECT 1"))
            return {"status": "ready", "db": "ok"}
        except Exception as exc:  # noqa: BLE001
            return {"status": "not_ready", "db": str(exc)}

    # WebSocket endpoint for real-time inbox/notification updates.
    from fastapi import WebSocket, WebSocketDisconnect

    from app.services.realtime import manager

    @app.websocket("/ws")
    async def websocket_endpoint(ws: WebSocket) -> None:
        await manager.connect(ws)
        try:
            while True:
                # Keep the connection alive; we mostly push events out.
                await ws.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(ws)
        except Exception:  # noqa: BLE001
            manager.disconnect(ws)

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
