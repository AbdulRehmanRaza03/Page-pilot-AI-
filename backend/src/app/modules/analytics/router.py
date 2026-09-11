from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models import Workspace
from app.modules.analytics import service
from app.modules.auth.deps import get_workspace

router = APIRouter(tags=["analytics"])


@router.get("/dashboard")
async def dashboard_metrics(
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> dict:
    return await service.get_dashboard_metrics(db, workspace)
