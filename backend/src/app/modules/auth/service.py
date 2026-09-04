from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models import Permission, Role, Session, User, Workspace, WorkspaceMember
from app.schemas.auth import RegisterRequest, TokenResponse

DEFAULT_PERMISSIONS = {
    "owner": ["*"],
    "admin": [
        "conversations.read",
        "conversations.assign",
        "contacts.read",
        "contacts.write",
        "messaging.compose",
        "messaging.send",
        "campaigns.read",
        "campaigns.create",
        "campaigns.send",
        "automation.read",
        "automation.create",
        "automation.manage",
        "pages.read",
        "analytics.read",
    ],
    "member": [
        "conversations.read",
        "conversations.assign",
        "contacts.read",
        "contacts.write",
        "messaging.compose",
        "messaging.send",
        "campaigns.read",
        "automation.read",
        "pages.read",
        "analytics.read",
    ],
    "agent": [
        "conversations.read",
        "contacts.read",
        "messaging.compose",
        "messaging.send",
        "pages.read",
    ],
}


async def _ensure_permissions(db: AsyncSession) -> dict[str, Permission]:
    """Idempotently create the full permission set and return key->Permission."""
    keys = {
        "conversations.read",
        "conversations.assign",
        "contacts.read",
        "contacts.write",
        "messaging.compose",
        "messaging.send",
        "campaigns.read",
        "campaigns.create",
        "campaigns.send",
        "automation.read",
        "automation.create",
        "automation.manage",
        "pages.read",
        "analytics.read",
    }
    existing = (await db.execute(select(Permission))).scalars().all()
    by_key = {p.key: p for p in existing}
    for key in keys:
        if key not in by_key:
            perm = Permission(key=key)
            db.add(perm)
            by_key[key] = perm
    await db.flush()
    return by_key


async def _create_role(
    db: AsyncSession, workspace_id: uuid.UUID | None, key: str, name: str, perm_map: dict[str, Permission]
) -> Role:
    role = Role(workspace_id=workspace_id, key=key, name=name)
    db.add(role)
    await db.flush()
    for pk in DEFAULT_PERMISSIONS[key]:
        if pk == "*":
            continue
        role.permissions.append(perm_map[pk])
    return role


async def register(db: AsyncSession, data: RegisterRequest) -> tuple[User, Workspace]:
    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalar_one_or_none() is not None:
        raise ConflictError("email already registered")

    user = User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    await db.flush()

    # Every new user gets their own workspace + owner role.
    slug = _make_slug(data.email)
    workspace = Workspace(name=f"{data.full_name or data.email.split('@')[0]}'s Workspace", slug=slug, owner_id=user.id)
    db.add(workspace)
    await db.flush()

    perm_map = await _ensure_permissions(db)
    owner_role = await _create_role(db, workspace.id, "owner", "Owner", perm_map)
    await db.flush()

    db.add(WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role_id=owner_role.id))

    await db.commit()
    return user, workspace


async def login(db: AsyncSession, email: str, password: str, ip: str | None, ua: str | None) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if user is None or user.deleted_at is not None or not verify_password(password, user.password_hash):
        raise UnauthorizedError("invalid credentials")

    return await _issue_tokens(db, user, ip, ua)


async def refresh(db: AsyncSession, refresh_token: str) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
    except ValueError:
        raise UnauthorizedError("invalid refresh token") from None
    if payload.get("type") != "refresh":
        raise UnauthorizedError("wrong token type")

    user_id = uuid.UUID(payload["sub"])
    token_hash = _hash_token(refresh_token)
    result = await db.execute(
        select(Session).where(
            Session.user_id == user_id,
            Session.refresh_token_hash == token_hash,
            Session.revoked_at.is_(None),
        )
    )
    session = result.scalar_one_or_none()
    now = datetime.now(UTC)
    expires = session.expires_at
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=UTC)
    if session is None or (expires is not None and expires < now):
        raise UnauthorizedError("invalid refresh token")

    user = await db.get(User, user_id)
    if user is None or user.deleted_at is not None:
        raise UnauthorizedError("user not found")

    # Rotate: revoke the used refresh token and issue a fresh pair.
    session.revoked_at = datetime.now(UTC)
    return await _issue_tokens(db, user, session.ip, session.user_agent)


async def _issue_tokens(db: AsyncSession, user: User, ip: str | None, ua: str | None) -> TokenResponse:
    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))

    session = Session(
        user_id=user.id,
        refresh_token_hash=_hash_token(refresh),
        expires_at=datetime.now(UTC) + timedelta(days=30),
        ip=ip,
        user_agent=ua,
    )
    db.add(session)
    await db.commit()

    return TokenResponse(access_token=access, refresh_token=refresh)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _make_slug(email: str) -> str:
    base = email.split("@")[0].lower()
    return f"{base}-{secrets.token_hex(3)}"
