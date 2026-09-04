# 07 — System Architecture (High Level)

## 1. Architectural Style

**Modular monolith** for MVP, with clean module boundaries that permit later extraction of workers or services. Rationale in `08-tech-stack.md` and `10-backend-architecture.md`.

```
                        ┌────────────────────────────┐
                        │       Web Client (Next.js)  │
                        │  React + TS + TanStack Query │
                        └──────────────┬─────────────┘
                                       │ HTTPS / REST + WebSocket
                        ┌──────────────▼─────────────┐
                        │      API Gateway / Backend  │
                        │      FastAPI (modular)      │
                        │   auth · RBAC · tenancy     │
                        └──┬─────────┬─────────┬─────┘
               ┌───────────┘         │         └──────────┐
               ▼                     ▼                    ▼
        ┌────────────┐       ┌──────────────┐      ┌────────────┐
        │ PostgreSQL │       │    Redis     │      │ Background │
        │  (source   │       │ cache/queue/ │      │  Workers   │
        │  of truth) │       │  pubsub      │      │ (Celery)   │
        └────────────┘       └──────────────┘      └─────┬──────┘
                                                          │
                    ┌─────────────────────────────────────┤
                    ▼                                     ▼
           ┌────────────────┐                    ┌────────────────┐
           │   Meta Graph    │                    │   LLM Provider  │
           │  (Messenger API,│                    │ (AI assistant)  │
           │   Webhooks)     │                    │                 │
           └────────────────┘                    └────────────────┘
```

## 2. Core Runtime Flows

### 2.1 Incoming message (webhook) — see `14`, `15`
Meta → webhook endpoint → signature validation → ack 200 → enqueue → worker normalizes → identify Page/contact/conversation → store → trigger automations → AI processing (optional) → queue permitted action → execute → store result → realtime push to UI.

### 2.2 Outbound message
UI/AI/automation → API → eligibility check (window/tag/permissions) → queue → worker → `POST /{page}/messages` → store result/status → realtime update.

### 2.3 AI assistant — see `19`, `20`
User instruction → plan → select controlled tool(s) → authorization + validation → service call → result → explanation. External actions require confirmation.

## 3. Tenancy

`User → Workspace → Members → Pages → Contacts → Conversations → Campaigns → Automations`.
Every row carries `workspace_id`; every query filters on it (via a request-scoped tenant context). Cross-tenant access = critical bug.

## 4. Real-time

WebSocket (via Redis pub/sub) for the inbox; fallback to short polling. Details in `24-real-time.md`.

## 5. Data & State

- **PostgreSQL** is the single source of truth (state + events).
- **Redis** for caching, queue broker, presence, and pub/sub.
- **Object storage** for message attachments (future), not MVP-blocking.

## 6. Security Perimeter

- All traffic HTTPS.
- Tokens (our JWT + Meta) encrypted/protected server-side.
- Webhook X-Hub-Signature-256 validation mandatory.
- RBAC enforced in every endpoint; tenant isolation in every query.
- See `23-security.md`.

## 7. Observability

Structured logs + error tracking + metrics; health checks; webhook/AI/automation execution logs. See `27-observability.md`.
