from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve the backend directory so .env is always found regardless of CWD.
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment / .env."""

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE), env_file_encoding="utf-8", extra="ignore"
    )

    # App
    app_name: str = "PagePilot"
    environment: str = "local"  # local | development | staging | production
    debug: bool = False
    api_prefix: str = "/api/v1"

    # Security
    secret_key: str = "change-me-in-production"
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 30
    # Envelope encryption master key (base64-encoded 32-byte key) for Meta tokens
    encryption_key: str = ""

    # Database — set DATABASE_URL to a real Postgres/Supabase URL for production.
    # For a local, no-install demo you may use SQLite:
    #   DATABASE_URL=sqlite+aiosqlite:///./pagepilot.db
    database_url: str = "sqlite+aiosqlite:///./pagepilot.db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Celery
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # Meta
    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_graph_version: str = "v26.0"
    meta_webhook_verify_token: str = ""

    # LLM
    llm_provider: str = ""  # openai | anthropic
    llm_api_key: str = ""
    llm_model: str = ""

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"
    google_frontend_redirect: str = "http://localhost:3000/dashboard"

    # Email (verification OTP / transactional)
    email_provider: str = ""  # resend | sendgrid | smtp
    email_api_key: str = ""
    email_from: str = "PagePilot <no-reply@pagepilot.app>"

    # CORS — comma-separated string in env, split into a list.
    cors_origins: str = "http://localhost:3000"

    @property
    def google_base_url(self) -> str:
        return "https://accounts.google.com/o/oauth2/v2/auth"

    @property
    def google_token_url(self) -> str:
        return "https://oauth2.googleapis.com/token"

    @property
    def google_userinfo_url(self) -> str:
        return "https://www.googleapis.com/oauth2/v2/userinfo"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
