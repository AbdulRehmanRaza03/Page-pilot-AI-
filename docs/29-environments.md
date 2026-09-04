# 29 — Environments & Configuration

Environment definitions, configuration variables, secrets management, and third-party credentials for PagePilot. Four environments: **LOCAL**, **DEVELOPMENT**, **STAGING**, **PRODUCTION**.

## 1. Environment Overview

| Environment | Purpose | Data | External integrations |
| --- | --- | --- | --- |
| **LOCAL** | Developer machine | Synthetic/local only, ephemeral | Meta dev-app (development mode), local/dummy LLM, local Redis/Postgres |
| **DEVELOPMENT** | Shared integration/dev | Synthetic, disposable | Meta dev-app (development mode), sandbox LLM key |
| **STAGING** | Pre-production verification | Synthetic/reset, mirrors prod shape | Meta app (Live mode, restricted testers), sandbox/test LLM key |
| **PRODUCTION** | Live customers | Real customer data | Meta app (Live mode, app-reviewed), production LLM key |

Core invariants across all environments:

- **Secrets are never committed** to source control, `.env` files in the repo, or docs. They live in a secrets manager (or, for LOCAL only, a `.env.local` that is gitignored).
- **A separate Meta app per environment is strongly recommended** (see section 6). At minimum, LOCAL/DEVELOPMENT share a Development-mode app, STAGING uses its own Live-mode app, and PRODUCTION uses its own Live-mode app.
- **Data is isolated per environment.** Never point a lower environment at a production database, broker, or Meta app.
- **Config is loaded at boot** from environment variables resolved by the deployment platform + secrets manager; no baked-in values.

## 2. Environment Variables

Reference table. "Secret?" indicates whether the value must be treated as sensitive (kept out of source, loaded from secrets manager).

| Name | Purpose | Example | Secret? |
| --- | --- | --- | --- |
| `APP_ENV` | Current environment: `local`/`development`/`staging`/`production` | `production` | No |
| `APP_NAME` | Service name in logs/metrics | `pagepilot` | No |
| `LOG_LEVEL` | Logging verbosity | `info` | No |
| `SECRET_KEY` | App signing key (cookies/CSRF/one-off tokens) | `(random 32+ bytes)` | **Yes** |
| `JWT_SIGNING_KEY` | Signs access JWT | `(random, RSA or HS key)` | **Yes** |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@host:5432/pagepilot?sslmode=require` | **Yes** (contains creds) |
| `REDIS_URL` | Redis connection (cache/pub-sub) | `rediss://:pass@host:6379/0` | **Yes** |
| `CELERY_BROKER_URL` | Celery broker (Redis) | `rediss://:pass@host:6379/1` | **Yes** |
| `CELERY_RESULT_BACKEND` | Celery result backend | `rediss://:pass@host:6379/2` | **Yes** |
| `META_APP_ID` | Meta app ID | `123456789012345` | No (public-ish, but keep consistent) |
| `META_APP_SECRET` | Meta app secret (webhook HMAC + token exchange) | `(app secret)` | **Yes** |
| `META_VERIFY_TOKEN` | Webhook `hub.verify_token` | `(random)` | **Yes** |
| `META_API_VERSION` | Graph API version pinned | `v20.0` | No |
| `META_REDIRECT_URI` | OAuth callback (HTTPS) | `https://app.pagepilot.dev/api/meta/callback` | No |
| `META_WEBHOOK_URL` | Public webhook endpoint | `https://app.pagepilot.dev/api/webhooks/meta` | No |
| `LLM_PROVIDER` | LLM provider id (e.g., `openai`, `anthropic`) | `openai` | No |
| `LLM_API_KEY` | LLM provider API key | `sk-...` | **Yes** |
| `LLM_MODEL` | Model id | `gpt-4o-mini` | No |
| `LLM_BASE_URL` | (optional) provider/self-hosted base URL | `https://api.openai.com/v1` | No |
| `KMS_KEY_ID` / `KEK_ARN` | Key-encryption key reference for envelope encryption | `arn:aws:kms:...` | No (reference only) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Object-storage / KMS credentials | — | **Yes** |
| `S3_BUCKET` | Object storage bucket (attachments) | `pagepilot-prod-media` | No |
| `SENTRY_DSN` | Error tracking DSN | `https://...@sentry.io/...` | **Yes** |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `https://app.pagepilot.dev` | No |
| `FRONTEND_URL` | Public frontend origin | `https://app.pagepilot.dev` | No |
| `RATE_LIMIT_*` | Per-IP/per-user rate limits | `100/60s` | No |
| `SMTP_*` | Transactional email (verification, reset) | `smtp.postmarkapp.com` + creds | **Yes** (creds) |
| `FEATURE_FLAGS` | Comma-separated enabled flags | `ai_assistant,campaigns` | No |
| `PORT` / `HOST` | API bind address | `8000` / `0.0.0.0` | No |
| `WORKERS` | Celery worker concurrency | `4` | No |

Notes:
- `DATABASE_URL`, `REDIS_URL`, and broker URLs each carry credentials and are always secrets.
- `META_REDIRECT_URI` and `META_WEBHOOK_URL` are environment-specific and must match the Meta app's configured values exactly (HTTPS, pinned).
- For LOCAL only, values may live in a gitignored `.env.local`; all shared/higher environments use the secrets manager.

## 3. Secrets Management

- **Source of truth:** a secrets manager (AWS Secrets Manager, HashiCorp Vault, or the PaaS's native secrets — e.g., Render/Fly secrets) per `23-security.md` section 6.
- **Access:** least-privilege; only the deploy environment/service role can read the secrets it needs.
- **Rotation:** JWT/key/DB credentials on a schedule and on compromise; `META_APP_SECRET` rotation requires reconfiguring the Meta app and webhook accordingly (coordinate carefully).
- **Envelope encryption:** Meta Page/User tokens and provider secrets are stored **encrypted at rest** using DEK/KEK (AES-256-GCM), with the KEK in KMS — see `23-security.md` section 5.
- **Never:** commit secrets; put them in logs/exception messages; copy production secrets into lower environments.

## 4. Databases

| Environment | PostgreSQL | Notes |
| --- | --- | --- |
| LOCAL | Local container/instance | Testcontainers for integration tests per `26-testing.md` |
| DEVELOPMENT | Shared dev instance | Disposable; migrations auto-run on deploy |
| STAGING | Staging instance | Resettable from synthetic fixtures; mirrors prod schema + migrations |
| PRODUCTION | Managed production instance | Automated backups, point-in-time recovery (PITR), encryption at rest |

- Migrations via **Alembic**, ordered and reversible (see `11-database-architecture.md`).
- Backups: PRODUCTION requires scheduled backups + restore drill; STAGING reset per release.

## 5. Queues & Caches (Redis / Celery)

| Environment | Redis | Celery workers |
| --- | --- | --- |
| LOCAL | Local Redis | Local single worker |
| DEVELOPMENT | Shared dev Redis | Dev worker(s) |
| STAGING | Staging Redis | Staging worker(s) |
| PRODUCTION | Managed Redis (with auth + TLS) | Production workers (separate process/container) |

- Cache keys are tenant-namespaced (`ws:{wid}:...`); broker queue names are per-environment to prevent cross-env work (see `23-security.md` section 3).
- Workers run the same code/version as the API; deploy them together (see `28-deployment.md`).

## 6. Third-Party APIs & Credentials

### Meta (Facebook)

- **Separate Meta app per environment recommended.** LOCAL/DEVELOPMENT use a Development-mode app (testers only); STAGING uses a Live-mode app restricted to testers; PRODUCTION uses the app-reviewed Live-mode app.
- **MVP permissions** (from `13-meta-integration.md`): `pages_show_list`, `pages_messaging`, `pages_manage_metadata`, `pages_read_engagement`.
- Development-mode apps allow full testing with app admins/roles without App Review; Live mode requires App Review for non-role users.
- Credentials: `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` (all secrets except app ID). The app secret validates webhook signatures and exchanges tokens — never expose it.

### LLM provider

- One production key; sandbox/test keys for DEVELOPMENT/STAGING.
- Never send unrelated tenants' or unrelated customers' data to the model (context selection — `19-ai-assistant.md`).
- Log only redacted tool arguments/counts (no completions, no message bodies) per `27-observability.md`.

### Email (transactional)

- `SMTP_*` credentials for verification/password-reset emails; separate sender per environment.

## 7. Deployment Configuration

- Configuration is injected via environment variables at deploy time (12-factor). No config files with secrets are committed.
- CORS origins, frontend URL, Meta redirect/webhook URLs differ per environment.
- Feature flags (section 2) allow dark-launching (e.g., `ai_assistant`, `campaigns`) per environment.
- `APP_ENV` drives logging verbosity, error detail exposure (no stack traces to clients in production), and health/readiness strictness.

## 8. Environment Variable Checklist (per deploy target)

Each target must have, at minimum:
- [ ] `APP_ENV`, `DATABASE_URL`, `REDIS_URL`, `CELERY_BROKER_URL`
- [ ] `SECRET_KEY`, `JWT_SIGNING_KEY`, `KMS_KEY_ID`/`KEK_ARN`
- [ ] `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN`, `META_REDIRECT_URI`, `META_WEBHOOK_URL`, `META_API_VERSION`
- [ ] `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`
- [ ] `FRONTEND_URL`, `CORS_ORIGINS`, `SENTRY_DSN`
- [ ] Email `SMTP_*`
- [ ] `FEATURE_FLAGS`, `LOG_LEVEL`

## 9. Guardrails

1. **Never commit secrets** — enforced by a CI secret-leak scanner (see `30-git-workflow.md`).
2. **Never share a Meta app between PROD and lower envs** (avoids cross-env webhook/PII confusion and makes App Review/release isolation clean).
3. **Never point a lower env at production data** (DB, cache, or Meta pages).
4. **Credentials are least-privilege**, rotated, and scoped per environment.
5. **Production webhook/OAuth URLs are HTTPS and pinned** to match Meta's configuration exactly.
