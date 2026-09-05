"""Google OAuth 2.0 client (server-side only).

Handles authorization URL generation, code exchange, and userinfo retrieval.
All secrets stay server-side. See settings.google_* for configuration.
"""

from __future__ import annotations

import secrets
from typing import Any

import httpx

from app.core.config import settings


class GoogleOAuthError(Exception):
    pass


def build_google_auth_url(state: str | None = None) -> dict[str, str]:
    """Build the Google OAuth authorization URL."""
    state = state or secrets.token_urlsafe(32)
    scope = "openid email profile"
    url = (
        f"{settings.google_base_url}"
        f"?client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_redirect_uri}"
        f"&response_type=code"
        f"&scope={scope}"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&state={state}"
    )
    return {"url": url, "state": state}


async def exchange_code(code: str) -> dict[str, Any]:
    """Exchange an authorization code for tokens (id_token + access_token)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            settings.google_token_url,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        data = r.json()
        if "error" in data:
            raise GoogleOAuthError(data.get("error_description", data["error"]))
        return data


async def get_userinfo(access_token: str) -> dict[str, Any]:
    """Fetch the Google user's profile using their access token."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            settings.google_userinfo_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if r.status_code != 200:
            raise GoogleOAuthError("failed to fetch Google userinfo")
        return r.json()
