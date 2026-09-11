from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.errors import NotFoundError
from app.models import Workspace
from app.modules.auth.deps import get_workspace
from app.modules.messaging import service
from app.schemas.messaging import (
    ContactOut,
    ContactUpdate,
    ConversationOut,
    MessageOut,
)

router = APIRouter(tags=["messaging"])


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
    status: str | None = None,
    search: str | None = None,
) -> list[ConversationOut]:
    conversations = await service.list_conversations(db, workspace, status=status, search=search)
    return [ConversationOut.model_validate(c) for c in conversations]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def list_messages(
    conversation_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> list[MessageOut]:
    messages = await service.list_messages(db, workspace, conversation_id)
    return [MessageOut.model_validate(m) for m in messages]


@router.get("/contacts", response_model=list[ContactOut])
async def list_contacts(
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
    search: str | None = None,
    lead_status: str | None = None,
) -> list[ContactOut]:
    contacts = await service.list_contacts(db, workspace, search=search, lead_status=lead_status)
    return [ContactOut.model_validate(c) for c in contacts]


@router.get("/contacts/{contact_id}", response_model=ContactOut)
async def get_contact(
    contact_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> ContactOut:
    contact = await service.get_contact(db, workspace, contact_id)
    if contact is None:
        raise NotFoundError("contact not found")
    return ContactOut.model_validate(contact)


@router.patch("/contacts/{contact_id}", response_model=ContactOut)
async def update_contact(
    contact_id: uuid.UUID,
    body: ContactUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    workspace: Annotated[Workspace, Depends(get_workspace)],
) -> ContactOut:
    contact = await service.get_contact(db, workspace, contact_id)
    if contact is None:
        raise NotFoundError("contact not found")
    if body.name is not None:
        contact.name = body.name
    if body.lead_status is not None:
        contact.lead_status = body.lead_status
    if body.lead_score is not None:
        contact.lead_score = body.lead_score
    await db.commit()
    await db.refresh(contact)
    return ContactOut.model_validate(contact)
