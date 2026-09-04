from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment / .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

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

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
