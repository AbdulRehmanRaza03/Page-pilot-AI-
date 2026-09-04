# 26 — Testing Strategy

Testing strategy for PagePilot across the FastAPI backend, Next.js frontend, PostgreSQL, Redis, Celery workers, Meta integration, AI assistant, and automations. This document defines the test pyramid, tooling, and what each phase requires before it can be considered "done."

## 1. Guiding Principles

1. **Provider boundaries are mocked.** We never require live Meta, live LLM, or live Redis/Postgres in unit tests. External systems are faked at the narrowest seam (HTTP client, queue client, LLM client).
2. **Isolation is a first-class test target.** Every test that crosses tenants (or that *could*) is valuable. Cross-tenant access is tested explicitly as a negative case, not incidentally.
3. **Policy is regression-tested.** The 24-hour window, `messaging_type`, and message-tag rules from `13-meta-integration.md` are encoded as unit tests on the send eligibility service. A policy change is a red test.
4. **AI safety is contract-tested.** The AI orchestrator tests assert that `EXTERNAL` actions require confirmation, that tool calls re-check RBAC/tenant, and that the model cannot issue raw DB/Meta calls.
5. **Webhook idempotency is a hard requirement.** Duplicate event delivery must never produce duplicate messages/actions (see `14-webhook-architecture.md`).
6. **Confirmed state, not mocks, at the highest layer.** E2E uses real services (containers) for DB/Redis/broker, with Meta and LLM still faked via a local shim.

## 2. Test Pyramid

```
              ┌──────────────┐
              │    E2E       │  few, smoke-path, highest confidence
              ├──────────────┤
              │  Integration │  DB, Redis, Celery, webhook, Meta, LLM seams
              ├──────────────┤
              │     Unit     │  the bulk — services, schemas, engines
              └──────────────┘
```

| Layer | Share of suite | Purpose |
| --- | --- | --- |
| Unit | ~55% | Services, Pydantic schemas, eligibility/service logic, policy |
| Integration | ~30% | DB (migrations + repos), Redis/cache/queue, Celery tasks, webhook pipeline, Meta client (respx), LLM client (fake) |
| API (contract) | ~10% | FastAPI endpoints, auth/RBAC, tenant isolation, status codes |
| E2E | ~5% | Critical user journeys with real services; Meta/LLM shimmed |

Frontend testing is layered separately (see section 12): component → integration → E2E.

## 3. Tooling

| Concern | Tool | Notes |
| --- | --- | --- |
| Test runner | `pytest` | Backend standard |
| Async | `pytest-asyncio` | FastAPI + async services |
| HTTP mocking | `respx` | Mock Meta Graph API and any outbound HTTP at the transport layer |
| DB (integration) | **Testcontainers** (PostgreSQL) or per-test transaction | Testcontainers gives true constraints/indexes/migrations |
| LLM mocking | `fake-llm` fixture / deterministic stub | Deterministic structured outputs; no network, no cost |
| API coverage | `httpx` / `TestClient` (ASGI) | FastAPI |
| Coverage | `pytest-cov` + `coverage` | Gate on critical modules |
| Property/fuzz | `hypothesis` | Schemas, parser, eligibility edge cases |
| Frontend unit | `Vitest` + React Testing Library | Components/hooks |
| Frontend E2E | `Playwright` | Critical journeys |
| Security | `bandit`, `pip-audit`, `npm audit`, dependency scanning | CI gates |
| Load | `locust` | See section 15 |

## 4. Unit Tests

**Scope:** single unit — services, Pydantic models, helpers, utility functions, the automation condition matcher, the send-eligibility engine, RBAC resolution.

**Requirements:**
- No network, no DB, no Redis, no Celery, no live Meta/LLM.
- Dependencies injected as fakes; pure functions tested directly.
- Mock at the client seam (e.g., a fake `MetaClient` returning canned Graph responses).

**What must be covered:**
- Send eligibility (`window` vs `tag`, `RESPONSE`/`UPDATE`/`TAGGED` logic from `13-meta-integration.md`).
- Message normalization (inbound webhook → domain `message`).
- AI action classification (READ/PREPARE/WRITE/EXTERNAL) and confirmation policy.
- Pydantic schemas (valid + invalid inputs, strict mode).
- Lead scoring and segmentation filters.
- Token/lifecycle helpers (expiry computation) with pure time injection.
- RBAC permission-matrix resolution (each role's effective permissions).

**Exit criteria:** every service unit has ≥1 happy-path + ≥1 edge/failure test; policy-critical functions at 100% line coverage.

## 5. Integration Tests — Database (PostgreSQL)

**Scope:** repository layer, migrations, constraints, indexes, JSONB queries, tenant scoping, soft-delete + filtered unique indexes.

**Tool:** Testcontainers PostgreSQL (or a shared dev DB if CI can't run containers; Testcontainers preferred for real constraints).

**Requirements:**
- Run `alembic upgrade head` from a clean schema per test session.
- Use a per-test (or per-suite) database; clean between tests via truncation or transactions.
- Verify `workspace_id`-scoped queries return only the calling tenant's rows.

**What must be covered:**
- Every migration applies cleanly (`upgrade head`).
- Repositories respect soft-delete and composite unique constraints.
- `contacts(workspace_id, psid)` uniqueness; cross-tenant collision is impossible.
- Trigram/full-text search on `messages.body`.

## 6. Integration Tests — Redis, Cache, Queue

**Scope:** cache namespace isolation, queue publish/consume, pub/sub.

**Tool:** Testcontainers Redis (or a `fakeredis` for pure unit; real Redis for integration).

**What must be covered:**
- Cache keys are tenant-namespaced (`ws:{wid}:...` per `23-security.md`); no key collision across tenants.
- Celery task enqueue → worker consumes → correct handler invoked (via a test task).
- Pub/sub fan-out delivers to the intended workspace channel only.

## 7. API Tests (Contract)

**Scope:** FastAPI endpoints — auth, RBAC, tenancy, input validation, error codes, pagination.

**Tool:** `httpx` AsyncClient against the ASGI app (or `TestClient`), with a test DB + faked Meta/LLM.

**Requirements:**
- A fixture provides a signed JWT for each role (Owner/Admin/Member/Agent).
- Meta and LLM are faked (respx / fake-llm) — API tests do not hit the network.

**What must be covered:**
- Auth: register, login, refresh rotation, logout, email verification, password reset.
- RBAC: each permission key enforced (e.g., `Agent` cannot `campaigns.send`); `403` on denial.
- Tenancy: requesting a foreign `workspace_id`/resource returns `404` (not `403`), per `22-auth-rbac.md`.
- Validation: malformed payloads rejected with `422`; strict types; unknown fields rejected.
- Pagination: page/size bounds respected; stable ordering.

## 8. Webhook Tests

**Scope:** Meta webhook validation, signature verification, normalization, idempotency, Page matching, ack timing.

**Tool:** unit tests for HMAC verification; integration tests for the full ingest handler with faked raw body + real DB.

**What must be covered:**
- `X-Hub-Signature-256` verification accepts valid and rejects invalid/missing signatures (constant-time path).
- `hub.verify_token` handshake succeeds/fails correctly.
- `object != "page"` and unknown `entry[].id` are dropped (spoofed/foreign events).
- Normalization maps a Meta `messaging` event → domain `message` + `message_events`.
- **Idempotency:** duplicate `meta_event_id` does not create duplicate messages/actions.
- Ack `200` is returned before heavy processing (enqueue, not inline).
- Unknown PSID auto-creates a `contact` (FR-E1) exactly once.

## 9. Meta Integration Tests

**Scope:** the `MetaClient` seam — OAuth, `/me/accounts`, send, error mapping, rate-limit backoff.

**Tool:** `respx` to stub the Graph API; `freezegun`/clock injection for time-sensitive token/logic.

**What must be covered:**
- Short-lived → long-lived token exchange; `/me/accounts` page-token collection.
- Token never returned to the client (assert the serialized response omits it).
- Error mapping: `190` → token-invalid (reconnect required), `10` → permission error, `551/1545041` → recipient unavailable (no retry), `613` → rate-limit backoff+retry.
- Send calls include correct `messaging_type`/`tag`.
- Backoff honors jitter and respects `X-App-Usage` headers (per `13-meta-integration.md`).

## 10. Automation Tests

**Scope:** trigger → conditions → actions engine (`18-automation-engine.md`).

**What must be covered:**
- Trigger nodes fire on the correct event (new message, new conversation, intent).
- Condition nodes evaluate intent/label/score/keyword correctly (ephemeral/missing → false, not error).
- Action nodes (label, assign, draft, send) are applied in the intended order; delays/branches respected.
- Send action is gated by eligibility — an ineligible recipient is **skipped**, not sent.
- Execution history + step logs recorded (`automation_executions`, `automation_execution_steps`).
- Disabled automation never runs; test mode doesn't emit external sends.

## 11. AI Tool & Assistant Tests

**Scope:** the orchestrator + tool registry + safety model (`19-ai-assistant.md`, `20-ai-tools.md`).

**What must be covered:**
- Only allowlisted tools are invokable; unknown tool name → refusal.
- Class → RBAC mapping enforced (READ needs `ai.read` + resource read; EXTERNAL needs `ai.external` + `messaging.send`/`campaigns.send`/`automation.manage`).
- **EXTERNAL always requires confirmation**; WRITE requires confirmation for bulk/irreversible (see `20-ai-tools.md`).
- Service layer re-validates tenant + RBAC + Meta policy *independently* of the model.
- Bounded loop (max N tool calls) and per-turn timeout.
- Tool args Pydantic-validated; malformed → error returned to model to retry (bounded).
- Every tool call writes `ai_actions` + `ai_action_logs`.
- Deterministic fake-LLM produces structured outputs; no live LLM, no raw DB/Meta access.

## 12. Frontend Tests

| Layer | Tool | Coverage |
| --- | --- | --- |
| Unit | Vitest + React Testing Library | Components, hooks (e.g., `useConversations`), form validation, date/label rendering |
| Integration | React Testing Library + MSW | Data-fetch flows with mocked API (MSW) |
| E2E | Playwright | Critical journeys (below) |

**Requirements:**
- Mock the API with MSW for integration; do not hit real backend/network.
- Message bodies/names rendered as text (XSS safety) — test that no raw HTML executes.
- Playwright critical journeys: register → connect Page (shimmed Meta OAuth) → receive message → reply; connect → create lead → assign; create automation → confirm it drafts; AI assistant READ/EXTERNAL confirm flow.

## 13. End-to-End Tests

**Scope:** the highest-confidence smoke paths with real Backend + PostgreSQL + Redis + Celery via Testcontainers/compose; Meta and LLM shimmed locally.

**Tool:** Playwright (frontend) driving a compose-stack backend; `respx`/local Meta shim and `fake-llm` injected in the backend process.

**Critical journeys:**
1. Auth: register → verify → login → create workspace.
2. Connect Page (shim) → list Pages → connect one → tokens stored encrypted (never in client).
3. Webhook (shim) → message stored → appears in inbox (realtime).
4. Reply within window → delivered (shim confirms) → read status tracked.
5. Create lead → assign → AI draft reply → approve external send.
6. Automation trigger fires → action applied → execution logged.

**Exit criteria:** these journeys pass in CI on every merge to `develop`/`main`.

## 14. Security Tests

**Scope:** OWASP baseline + PagePilot-specific threat model (`23-security.md`).

**What must be covered:**
- SQL injection: parameterized-only assertions; a `SELECT` with a malicious string is inert.
- XSS: no `dangerouslySetInnerHTML` with unsanitized input; message bodies rendered safely.
- Auth: expired/revoked (`sid`) token rejected; reuse of a rotated refresh token revokes the session.
- CSRF: bearer-token API rejects missing/malformed credentials.
- Token secrecy: Meta tokens never in API responses, logs, or the frontend bundle (static + dynamic assertions).
- Rate limiting: per-IP and per-user limits enforced on auth + API.
- Tenant isolation: automated negative tests asserting zero cross-tenant reads/writes.
- Secrets: no secret formats (`ghp_`, Meta App Secret patterns, private keys) appear in the repo (a leak scanner in CI).
- Dependency audit: `pip-audit`, `npm audit` fail CI on known-high/CVEs.

## 15. Load & Performance Tests

**Scope:** verify NFR-1/NFR-2 (`02-product-requirements.md`): inbox render p95 < 200ms, realtime push < 2s, webhook ack < 1s.

**Tool:** `locust` (or `k6`).

**Scenarios:**
- Inbox list + conversation read under concurrent users.
- Webhook ingest burst (burst of Meta-style events) → measure ack latency + queue drain.
- Send fan-out (campaign queue) → measure queue depth and Meta-invocation rate (shim).

**Requirements:**
- Run in staging against a Meta/LLM shim; record baseline before go-live; run again before major releases.
- Fail the release gate if p95 latency regresses beyond the NFR threshold.

## 16. Test Data & Fixtures

- **Factories** (e.g., `factory_boy`/`polyfactory`) for all entities, always tenant-scoped.
- **Fixtures** for each role; a `MetaClient` fake with configurable responses; a deterministic `fake-llm`.
- **No real PII** in fixtures or committed data; use synthetic `psid`s and names.
- **Secrets** never hardcoded in tests; use env-configured placeholders.

## 17. CI Gating (see `30-git-workflow.md`)

| Check | Blocking? |
| --- | --- |
| Lint + format (ruff, prettier) | Yes |
| Unit tests | Yes |
| Integration/API tests (Testcontainers) | Yes |
| Frontend unit + Playwright smoke | Yes |
| Security + dependency scan | Yes |
| Coverage threshold (critical modules) | Yes (warn → fail on regressions) |

## 18. Coverage Targets

| Module | Target |
| --- | --- |
| Send eligibility / policy | 100% line |
| AI orchestrator + tool registry | 100% line (safety-critical) |
| Webhook signature + idempotency | 100% branch |
| RBAC resolution + tenancy scoping | 100% line |
| Repositories | ≥ 90% line |
| Services (general) | ≥ 85% line |
| Frontend critical components | ≥ 80% statements |

## 19. What Is Explicitly Not Tested Here

- Live Meta Graph API, live LLM provider (covered by local shims + a dedicated pre-launch manual smoke in staging).
- Visual regression (Snapshots/Chromatic) — deferred; available later.
- Accessibility automated audits (axe) — deferred to post-MVP (NFR-8 is a manual/best-effort target at MVP).
