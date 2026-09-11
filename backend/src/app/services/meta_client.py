"""Meta Graph API client + OAuth helpers.

All Meta credentials/secrets stay server-side. Tokens are encrypted at rest.
See docs/13-meta-integration.md for the authoritative reference.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger("pagepilot.meta")

GRAPH_BASE = f"https://graph.facebook.com/{settings.meta_graph_version}"

# Permissions required for MVP (see docs/13-meta-integration.md).
# We request the minimal set needed to list Pages and access Messenger.
# `pages_read_engagement` is requested only when the app has been granted
# Advanced Access; in Development mode we keep the minimal set to avoid
# "Invalid Scopes" errors.
MVP_PERMISSIONS = [
    "pages_show_list",
    "pages_messaging",
    "pages_manage_metadata",
]


def build_login_url(redirect_uri: str, state: str) -> str:
    """Build the Facebook Login (OAuth) URL for a business user."""
    scope = ",".join(MVP_PERMISSIONS)
    return (
        f"https://www.facebook.com/{settings.meta_graph_version}/dialog/oauth"
        f"?client_id={settings.meta_app_id}"
        f"&redirect_uri={redirect_uri}"
        f"&state={state}"
        f"&scope={scope}"
    )


class MetaApiError(Exception):
    def __init__(self, code: int | None, message: str, subcode: int | None = None):
        self.code = code
        self.subcode = subcode
        self.message = message
        super().__init__(message)


class MetaClient:
    """Thin typed wrapper around the Meta Graph API."""

    def __init__(self) -> None:
        self._http = httpx.AsyncClient(base_url=GRAPH_BASE, timeout=15.0)

    async def aclose(self) -> None:
        await self._http.aclose()

    async def _get(self, path: str, token: str, params: dict | None = None) -> dict[str, Any]:
        p = dict(params or {})
        p["access_token"] = token
        r = await self._http.get(path, params=p)
        return self._parse(r)

    async def _post(self, path: str, token: str, params: dict | None = None) -> dict[str, Any]:
        p = dict(params or {})
        p["access_token"] = token
        r = await self._http.post(path, params=p)
        return self._parse(r)

    def _parse(self, r: httpx.Response) -> dict[str, Any]:
        # Structured logging that never leaks tokens.
        try:
            data = r.json()
        except Exception as exc:
            logger.error("Meta response not JSON: status=%s url=%s", r.status_code, r.url)
            raise MetaApiError(None, f"Meta returned non-JSON (HTTP {r.status_code})") from exc

        if "error" in data:
            err = data["error"]
            logger.error(
                "Meta API error: status=%s code=%s subcode=%s type=%s message=%s url=%s",
                r.status_code,
                err.get("code"),
                err.get("error_subcode"),
                err.get("type"),
                err.get("message"),
                r.url,
            )
            raise MetaApiError(
                code=err.get("code"),
                subcode=err.get("error_subcode"),
                message=err.get("message", "Meta API error"),
            )
        return data

    # --- OAuth / token exchange ---

    async def exchange_code(self, code: str, redirect_uri: str) -> dict[str, Any]:
        """Exchange an OAuth authorization code for a short-lived user token."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(
                f"https://graph.facebook.com/{settings.meta_graph_version}/oauth/access_token",
                params={
                    "client_id": settings.meta_app_id,
                    "client_secret": settings.meta_app_secret,
                    "redirect_uri": redirect_uri,
                    "code": code,
                },
            )
            data = r.json()
            if "error" in data:
                err = data["error"]
                raise MetaApiError(err.get("code"), err.get("message", "code exchange failed"))
            return data

    async def exchange_long_lived_token(self, short_lived_token: str) -> dict[str, Any]:
        """Exchange a short-lived user token for a long-lived (~60 day) token."""
        r = await self._http.get(
            f"https://graph.facebook.com/{settings.meta_graph_version}/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.meta_app_id,
                "client_secret": settings.meta_app_secret,
                "fb_exchange_token": short_lived_token,
            },
        )
        data = r.json()
        if "error" in data:
            err = data["error"]
            raise MetaApiError(err.get("code"), err.get("message", "token exchange failed"))
        return data

    # --- Pages ---

    async def list_accounts(self, user_token: str) -> list[dict[str, Any]]:
        """Retrieve the Pages a user manages (id, name, category, access_token, tasks).

        Note: we request `picture{url}` as a nested field; requesting a bare
        `picture` field can cause Graph API errors on some app types.
        """
        data = await self._get(
            "/me/accounts",
            user_token,
            params={"fields": "id,name,category,access_token,tasks,picture{url}"},
        )
        return data.get("data", [])

    async def get_page(self, page_id: str, page_token: str) -> dict[str, Any]:
        """Fetch basic Page metadata."""
        return await self._get(f"/{page_id}", page_token, params={"fields": "id,name,category"})

    # --- Debug token (validate a token) ---

    async def debug_token(self, token: str) -> dict[str, Any]:
        r = await self._http.get(
            f"https://graph.facebook.com/{settings.meta_graph_version}/debug_token",
            params={
                "input_token": token,
                "access_token": f"{settings.meta_app_id}|{settings.meta_app_secret}",
            },
        )
        data = r.json()
        if "error" in data:
            err = data["error"]
            raise MetaApiError(err.get("code"), err.get("message", "debug_token failed"))
        return data.get("data", {})


meta_client = MetaClient()
