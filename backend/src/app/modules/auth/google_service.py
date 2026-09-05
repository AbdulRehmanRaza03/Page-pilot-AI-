"""Google OAuth authentication service.

Finds or creates a PagePilot user based on the verified Google identity,
then issues access/refresh tokens. Mirrors enterprise OAuth patterns:
server-side code exchange, verified email, find-or-create, session issuance.
"""

from __future__ import annotations

import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import UnauthorizedError
from app.core.security import hash_password
from app.models import User, Workspace, WorkspaceMember
from app.modules.auth.service import _issue_tokens
from app.schemas.auth import TokenResponse


async def find_or_create_google_user(
    db: AsyncSession, email: str, name: str | None
) -> User:
    """Return an existing user for this Google email, or create one."""
    normalized = email.lower()
    result = await db.execute(select(User).where(User.email == normalized))
    user = result.scalar_one_or_none()

    if user is None:
        # Create user with a random password (Google is the auth source).
        user = User(
            email=normalized,
            password_hash=hash_password(secrets.token_urlsafe(32)),
            full_name=name,
            email_verified_at=None,  # set below
        )
        db.add(user)
        await db.flush()

        # Auto-create a workspace (same as email/password onboarding).
        workspace = Workspace(
            name=f"{name or email.split('@')[0]}'s Workspace",
            slug=f"{email.split('@')[0].lower()}-{secrets.token_hex(3)}",
            owner_id=user.id,
        )
        db.add(workspace)
        await db.flush()

        from app.modules.auth.service import _create_role, _ensure_permissions

        perm_map = await _ensure_permissions(db)
        owner_role = await _create_role(db, workspace.id, "owner", "Owner", perm_map)
        await db.flush()
        db.add(WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role_id=owner_role.id))

    # Mark email verified (Google verified it for us).
    from datetime import UTC, datetime

    user.email_verified_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(user)
    return user


async def google_login(
    db: AsyncSession, email: str, name: str | None, ip: str | None, ua: str | None
) -> TokenResponse:
    """Authenticate (or register) via Google and return tokens."""
    if not email:
        raise UnauthorizedError("Google did not return an email")
    user = await find_or_create_google_user(db, email, name)
    return await _issue_tokens(db, user, ip, ua)
