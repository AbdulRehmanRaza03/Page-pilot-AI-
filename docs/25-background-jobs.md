# 25 — Background Jobs & Asynchronous Processing

## 1. What Needs Async Processing

- Webhook event processing (after fast ack).
- Message processing pipeline (normalize → resolve → store → automation → AI).
- Outbound sends (direct + campaign fan-out).
- Campaign delivery, scheduling, retries.
- Follow-ups (scheduled, within 24h / tag rules).
- AI jobs (assistant tool execution, generation).
- Automation execution (node graph, delays).
- Analytics aggregation.
- Retry/dead-letter jobs.

## 2. Options Compared

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **Celery** (+ Redis broker) | Mature, scheduling (beat), retries, acks, routing, result backend | Heavier config; separate worker process | ✅ Recommended |
| RQ (+ Redis) | Lightweight, simple | Fewer features (scheduling via rq-scheduler), less robust retry/ack | Viable; less capable |
| ARQ / Dramatiq | Simpler APIs | Smaller ecosystem | Not preferred |
| Direct DB polling | One less system | Reinventing queue semantics; fragile | ❌ |

## 3. Recommendation

**Celery with Redis as broker (+ Redis as result backend for simple cases).** Rationale: rich, built-in support for retries with backoff, scheduled tasks (Celery Beat), task routing, acknowledgments, and dead-letter patterns — all needed for a messaging platform. RQ is simpler but we'd hand-roll scheduling/retry semantics. Celery also matches our FastAPI/Python stack and reuses Redis.

## 4. Queue Topology (MVP)

| Queue | Tasks | Concurrency note |
| --- | --- | --- |
| `webhook` | ingest + normalize webhook events | high throughput, fast, idempotent |
| `messaging` | outbound sends (+ retries) | throttled to 300/s per page |
| `automation` | run automations, delays | medium |
| `ai` | AI assistant generation + tool exec | bounded (LLM rate/cost) |
| `campaign` | campaign fan-out + item sends | throttled |
| `analytics` | aggregate/rollup metrics | low priority |
| `maintenance` | retries, dead-letter, token refresh checks | periodic (beat) |

## 5. Idempotency & At-Least-Once

- Tasks are **idempotent** via unique keys (e.g., `meta_event_id` for webhook; `outbound_jobs.id` for sends). Re-running a task must not double-send or double-store.
- **Acks late**: task acknowledges only after successful completion; failures are retried.
- **Retries** use exponential backoff + jitter; classify permanent vs transient (see `15-messaging-engine.md`).
- **Dead-letter**: after N failed attempts, route to a `dead-letter` queue for inspection; store terminal `failed`/`permanent_fail` state and surface in UI.

## 6. Scheduling

- **Celery Beat** for periodic jobs: token freshness checks, analytics rollups, retry sweeps, dead-letter inspection.
- **ETA/countdown** for scheduled sends, campaign items, follow-ups, and automation delays. Note all scheduled sends re-check Meta eligibility (window/tag) at execution time.

## 7. Observability (see `27`)

- Track queue depth, task success/fail counts, latency per queue.
- Every task logs a trace ID; failures log structured context (workspace, entity, error).
- Alert on queue backlog growth or dead-letter accumulation.

## 8. Deployment

- Same codebase, separate **worker** process (`celery -A app.workers worker -Q ...`) and a **beat** process. See `28-deployment.md` and `10-backend-architecture.md`.
