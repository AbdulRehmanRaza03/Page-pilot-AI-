# 27 — Observability

Observability design for PagePilot: how we log, trace, measure, and alert across the FastAPI API, PostgreSQL, Redis, and Celery workers.

## 1. Application Structured Logging

- **Format:** JSON to stdout/stderr (the container/process logs). No free-text multi-line logs for machine-processable events.
- **Correlation:** a `trace_id` (and `span_id`) propagated across HTTP → Celery task → Meta webhook processing so a single user action can be traced end-to-end.
- **Request IDs:** every inbound request gets a `request_id`, echoed in responses and in logs.
- **Context:** every log line carries `app`, `env`, `service`, `workspace_id`, `user_id` (or `actor`), `trace_id`, `request_id`, `level`, `event`, `message`, and `timestamp` (RFC 3339 / ISO 8601 UTC).
- Use structured logging library (e.g., `structlog`) so fields are typed and filterable.

## 2. Error Tracking

- **Sentry** (or equivalent error tracker) for unhandled exceptions and crashes, with breadcrumbs and release/deploy metadata.
- Errors are enriched with `workspace_id`, `user_id`, `trace_id` (but **not** tokens or PII).
- Alert on new/regressed error types.

## 3. Webhook Logs

- Log inbound Meta webhook events: `object`, `entry[].id` (Page ID), event type, and signature-verification result — **at a safe, non-PII level** (do not log the full message body; see "Never log" below).
- Record `webhook_latency` (time from receipt to ack) and `webhook_received_at`.
- Log signature-verification **failures** explicitly (they indicate spoofing/forgery or config drift).

## 4. AI Execution Logs

- Every AI tool invocation is recorded in `ai_action_logs` with: instruction ID, intent, tools chosen, `permission_level`, RBAC key checked, confirmation status (approve/cancel), final result/summary, and latency.
- Log tool **arguments** in a redacted form (IDs, counts, flags) — never raw message bodies or tokens (see below).
- Capture `ai_tool_call_count` and `ai_tool_latency` per instruction for trends and cost/correctness analysis.

## 5. Automation Execution Logs

- Per automation run: trigger event, evaluated conditions, chosen branch/actions, outcomes (success/failure), target IDs/counts, and timestamps.
- Log why an action was **skipped** (e.g., recipient outside 24-hour window, no eligible tag) — these are privacy/policy-critical and must be auditable.

## 6. Campaign Logs

- Per campaign send: recipient count, queue counts, sent/attempted, delivered/read/replied aggregates, failure reasons, and rate-limit/backoff events.
- Log eligibility-rejection counts separately (ineligible vs. error) so policy compliance is verifiable.

## 7. Metrics

Instrument with a metrics library (Prometheus + Grafana recommended). Key metrics:

| Metric | Purpose |
| --- | --- |
| API request count / error rate | Track traffic and failure ratio |
| API response time (p50/p95/p99) | Detect latency regressions |
| Queue depth (Celery) | Detect backlog / starvation |
| Send success / failure count | Messaging health |
| Send latency (queue → delivered) | Delivery performance |
| Webhook receipt latency + verif.-failure | Inbound health + security |
| AI tool call count / latency | Assistant performance & cost |
| Automation run count / failure | Automation health |
| DB pool utilization / Redis latency | Infra backpressure |
| Token reauthorization/reconnect rate | Meta integration health |

## 8. Health Checks

- **`/healthz`** — liveness: process is up and not deadlocked.
- **`/readyz`** — readiness: dependencies reachable (DB, Redis, Celery broker) before accepting traffic.
- Celery worker heartbeat and queue-length surfaced via the same metrics.

## 9. Alerting

Alert with defined thresholds (PagerDuty / Opsgenie / Grafana alerting):

| Condition | Threshold (example) |
| --- | --- |
| API 5xx error rate | > 1% over 5 min |
| API p95 latency | > 1s over 5 min |
| Celery queue depth | > N backlog for 5 min |
| Send failure rate | > 5% over 10 min |
| Webhook verif. failures | any unexpected spike |
| Token reauth/reconnect spike | anomalous increase |
| Error tracker new/regressed | any new error type |

Include runbooks linking alerts to the relevant doc (`13-meta-integration.md` for Meta errors, `19-ai-assistant.md` for AI failures, this doc for metrics).

## 10. Performance Monitoring (APM)

- APM (Sentry Performance / OpenTelemetry tracing) to attribute latency to spans: HTTP endpoint → service → DB/Redis/Meta call.
- Trace the full path of a message send (API → queue → Celery → Meta) and of a webhook event (webhook → processor → DB).
- Flag slow DB queries via the ORM/db instrumentation.

## 11. Tooling (MVP-pragmatic)

| Concern | Recommendation |
| --- | --- |
| Structured logging | `structlog` (Python) → JSON stdout |
| Metrics | Prometheus client + Grafana (start minimal) |
| Error tracking | Sentry |
| APM/tracing | OpenTelemetry (incremental) / Sentry Performance |
| Log aggregation | Loki or a hosted log platform (start with what's already available) |
| Alerting | Grafana Alerting or PagerDuty |

Keep the MVP footprint small: JSON logs + Sentry + a handful of Prometheus counters/gauges first; expand APM and full dashboards as traffic grows.

---

## 12. Logging Policy

### MUST be logged

- Request/response metadata: method, path, status, latency, `request_id`, `trace_id`, `workspace_id`, `user_id`.
- Auth events: login, logout, password reset, token refresh/rotation (session ID, not tokens).
- Meta webhook metadata: Page ID, event type, signature result (no bodies).
- Send outcomes: Page ID, recipient PSID hash (not raw PSID if policy requires), `messaging_type`/`tag`, result/success/failure, error code.
- AI/automation/campaign action summaries (IDs, counts, flags, results).
- Errors/exceptions with stack traces (sanitized).

### MUST NEVER be logged

- **Secrets** — Meta App Secret, Page/User Access Tokens, JWT/refresh tokens, KEK/DEK keys, DB/Redis/AI provider credentials.
- **PII / message contents** — conversation message **bodies**, contact names/emails/phone numbers, PSIDs in raw (unhashed) form where avoidable, and any CRM PII fields.
- Full customer data payloads, prompt/LLM completion contents (unless redacted to IDs/counts for debugging).

### Redaction / masking

Centralize a redactor that masks matched patterns (tokens, emails, phones, message bodies) before a log line hits stdout. Where message *content* is legitimately needed for debugging, log only a redacted/truncated form (e.g., first N chars, or a hash), and only in a debug channel gated off in production by default.

---

## 13. Log Field Table

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `timestamp` | RFC3339 UTC | always | |
| `level` | enum | always | debug/info/warn/error |
| `service` | string | always | e.g., `api`, `worker` |
| `event` | string | always | stable event name |
| `message` | string | always | human-readable, no secrets/PII |
| `trace_id` | string | always | end-to-end correlation |
| `span_id` | string | when tracing | |
| `request_id` | string | on HTTP | |
| `workspace_id` | uuid | when known | |
| `user_id` / `actor` | uuid | when known | |
| `page_id` | string | on Meta ops | |
| `event_type` | string | webhooks/automation | e.g., `messages`, delivery |
| `result` | string | on outcome | success/failure/skipped |
| `error_code` | string | on error | e.g., Meta code 190 |
| `latency_ms` | int | on timed ops | |
| `resource_type` / `resource_id` | string/uuid | on CRUD | no PII |
