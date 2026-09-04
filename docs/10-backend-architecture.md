# 10 — Backend Architecture (Modular Monolith)

## 1. Choice & Rationale

**Modular monolith** for MVP. Each module is a self-contained Python package with clear boundaries; modules communicate through internal service APIs (not HTTP). This gives fast development and simple deploys while preserving the option to extract a module (e.g., the worker/automation engine) into a separate service later.

Option comparison:

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| Monolith (naive) | Simplest | Spaghetti; hard to test/scale | ❌ |
| Modular monolith | Clean boundaries, one deploy, easy testing | Still one process (CPU contention) | ✅ **Recommended** |
| Microservices | Independent scaling | Huge operational/DevOps overhead for MVP | ❌ (not for MVP) |

## 2. Language & Framework

**Python 3.12 + FastAPI + SQLAlchemy 2.0 (async) + Alembic + Pydantic v2.** FastAPI gives async I/O for high webhook ingest throughput, first-class OpenAPI (feeds the client + AI tool schemas), and strong typing via Pydantic. See `08` for full rationale.

## 3. Module List

| Module | Responsibility |
| --- | --- |
| `auth` | registration, login, password reset, sessions, JWT |
| `users` | user profiles, settings |
| `workspaces` | workspace CRUD, membership, subscription/usage placeholders |
| `roles` | roles + permissions + RBAC checks |
| `facebook` | OAuth, token lifecycle, Page listing |
| `pages` | connected Page records, status |
| `webhooks` | Meta webhook ingestion + validation |
| `messaging` | send/receive, delivery status, retries |
| `conversations` | conversation records, status, assignment, labels |
| `contacts` | contacts + leads, tags, scoring, segmentation |
| `campaigns` | campaign CRUD, audience, recipients, queueing |
| `automation` | trigger/condition/action engine + executions |
| `ai` | assistant orchestration, tool registry, prompt/context |
| `analytics` | dashboards + metrics queries |
| `billing` | subscription/usage models (architecture-ready) |
| `notifications` | in-app + (future) email/push |

## 4. Recommended Folder Structure

```
backend/
├── pyproject.toml
├── alembic/
│   ├── env.py
│   └── versions/
├── src/
│   └── app/
│       ├── main.py                  # FastAPI app factory, router mount
│       ├── core/
│       │   ├── config.py            # pydantic-settings, env
│       │   ├── db.py                # engine, async session
│       │   ├── security.py          # hashing, JWT, encryption
│       │   ├── deps.py              # get_current_user, get_workspace, tenancy
│       │   ├── errors.py            # domain exceptions + handlers
│       │   └── logging.py
│       ├── models/                  # SQLAlchemy models (per module)
│       │   ├── base.py
│       │   ├── auth.py
│       │   ├── workspace.py
│       │   ├── facebook.py
│       │   ├── messaging.py
│       │   ├── contacts.py
│       │   ├── campaigns.py
│       │   └── automation.py
│       ├── schemas/                 # Pydantic (per module)
│       ├── modules/
│       │   ├── auth/
│       │   │   ├── router.py
│       │   │   └── service.py
│       │   ├── workspaces/
│       │   ├── facebook/
│       │   ├── pages/
│       │   ├── webhooks/
│       │   ├── messaging/
│       │   ├── conversations/
│       │   ├── contacts/
│       │   ├── campaigns/
│       │   ├── automation/
│       │   ├── ai/
│       │   │   ├── router.py
│       │   │   ├── orchestrator.py
│       │   │   ├── tools/            # each tool = one file
│       │   │   └── prompts.py
│       │   ├── analytics/
│       │   └── notifications/
│       ├── services/                # shared/internal services (meta_client, queue, etc.)
│       │   ├── meta_client.py
│       │   ├── token_store.py
│       │   ├── queue.py
│       │   └── realtime.py
│       ├── workers/
│       │   ├── celery_app.py
│       │   └── tasks/               # webhook, send, campaign, ai, automation
│       └── tests/
├── .env.example
└── Dockerfile
```

## 5. Cross-Cutting Design Rules

1. **Tenant context** is injected via a FastAPI dependency (`get_workspace`) resolved from the current user's active workspace; services accept `workspace_id` explicitly.
2. **RBAC** enforced in a permission-check dependency per endpoint (see `22`).
3. **All external I/O** (Meta, LLM) goes through `services/` clients — never called directly from routers.
4. **Background work** is always queued, never done inline in the request path (except webhook *ack*).
5. **Errors** use a unified domain exception hierarchy (see `34`-adjacent `core/errors.py`).

## 6. Background Jobs

Celery + Redis (see `25-background-jobs.md`) for message processing, sends, campaigns, automation, AI, scheduling, retry.
