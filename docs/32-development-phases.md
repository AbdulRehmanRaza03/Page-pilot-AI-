# 32 — Development Phases

Sequential build phases for PagePilot, Phase 0 through Phase 19. Each phase is a self-contained, verifiable increment that builds on the prior phases. A phase is "done" when its **Acceptance Criteria** and **Manual Verification** pass and its **Deployment Requirements** are satisfied.

Each phase documents: **Objective, Dependencies, Features, Files/modules, Database changes, API changes, Frontend changes, Backend changes, Tests, Security checks, Manual verification, Acceptance criteria, Deployment requirements, Rollback strategy.**

Cross-references use filenames only (e.g., `13-meta-integration.md`).

---
---

## PHASE 0 — Documentation

### Objective
Establish a complete, consistent planning/SDLC foundation so every subsequent phase has authoritative reference material.

### Dependencies
None.

### Features
- Produce the full documentation set (`00` through `35`) covering architecture, product, Meta integration, AI, testing, deployment, environments, git, MVP scope, phases, acceptance criteria, risks, and roadmap.

### Files/modules
- `docs/*.md` (all numbered files).

### Database changes
None.

### API changes
None.

### Frontend changes
None.

### Backend changes
None.

### Tests
- Review pass: cross-references resolve to real filenames; terminology consistent (action classes READ/PREPARE/WRITE/EXTERNAL; MVP permissions; 24-hour window + `messaging_type`).

### Security checks
- No secrets in docs; no real credentials/example tokens that could be mistaken for live values.

### Manual verification
- A developer can read the recommended order (from `00-overview.md`) and understand the build path without ambiguity.

### Acceptance criteria
- All listed docs exist and are internally consistent.
- Meta policy facts are correct per `13-meta-integration.md`.

### Deployment requirements
None.

### Rollback strategy
N/A (docs only).

---
---

## PHASE 1 — Repository & Development Environment

### Objective
Stand up the repository, local dev environment, and CI so the team can build, test, and iterate.

### Dependencies
Phase 0.

### Features
- Repo initialized with backend (FastAPI, modular monolith) and frontend (Next.js) skeletons.
- Local services: PostgreSQL, Redis, Celery worker, API, frontend (via Docker Compose and/or local install).
- Linting, formatting, and a baseline CI pipeline (see `30-git-workflow.md`).

### Files/modules
- `backend/` (FastAPI app skeleton, config, health endpoints), `frontend/` (Next.js app), `docker-compose.yml`, `.gitignore`, CI config, `pyproject.toml`/`requirements`, `package.json`.

### Database changes
- Alembic initialized; empty baseline migration.

### API changes
- `GET /healthz`, `GET /readyz`.

### Frontend changes
- Next.js app boots; basic layout + routing shell.

### Backend changes
- Config/env loading (`29-environments.md`), structured logging (`structlog`), health checks wiring.

### Tests
- A smoke unit test, a CI integration test (Testcontainers Postgres/Redis) proving the toolchain, and frontend boot test (see `26-testing.md`).

### Security checks
- `.gitignore` excludes `.env*`, secrets, logs, output; CI secret-leak scanner enabled.

### Manual verification
- `docker compose up` (or local) brings up API + frontend; `/healthz` and `/readyz` return 200.

### Acceptance criteria
- A new developer can clone and run locally with ≤ 3 commands.
- CI runs lint + tests and reports status.
- No secrets are committed.

### Deployment requirements
None.

### Rollback strategy
N/A (scaffolding).

---
---

## PHASE 2 — Authentication & Workspace

### Objective
Implement app authentication (email/password) and workspace/multi-tenant foundation.

### Dependencies
Phase 1.

### Features
- Register, email verification, login/logout, password reset, session management (JWT access + refresh with rotation/revocation).
- Workspace creation + membership + roles (Owner/Admin/Member/Agent) seeded.

### Files/modules
- `backend/app/auth/`, `backend/app/workspaces/`, `frontend/app/(auth)/`, `frontend/app/workspace/`; modules per `22-auth-rbac.md`.

### Database changes
- `users`, `workspaces`, `workspace_members`, `roles`, `permissions`, `role_permissions`, `invitations`, `sessions`.

### API changes
- Auth: `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`.
- Workspaces: `GET/POST /workspaces`, `GET/PATCH /workspaces/{id}`, members + invites endpoints.

### Frontend changes
- Registration/login/reset/verify screens; workspace switcher/create; session handling (token storage, refresh on 401).

### Backend changes
- Password hashing (argon2), JWT issue/verify, refresh-token rotation, email sending (SMTP), RBAC resolution + `require(permission)` dependency, tenant context injection.

### Tests
- Unit (password, token), integration (DB), API (auth flows, RBAC matrix, tenant isolation) — see `26-testing.md`.

### Security checks
- Tokens opaque/rotated; sessions revocable; no secrets in logs/responses; rate-limit auth endpoints; password policy.

### Manual verification
- Register → verify → login → logout → reset; create workspace; switch workspaces.

### Acceptance criteria
- User can register, verify, login, and create/switch workspaces.
- Invalid/revoked tokens rejected; foreign workspace IDs return 404.
- Role seed data correct per `22-auth-rbac.md`.

### Deployment requirements
- Email provider creds configured (`29-environments.md`).

### Rollback strategy
- Reversible Alembic migration; feature gated to avoid breaking existing sessions.

---
---

## PHASE 3 — Database

### Objective
Finalize the core schema, migrations, and data-access layer so all later phases build on a stable, tenant-scoped foundation.

### Dependencies
Phase 2.

### Features
- Full core schema (identity, Meta, CRM/conversations, automation, AI, ops tables) per `11-database-architecture.md`.
- Repository/data-access layer with tenant scoping (`workspace_id`) everywhere.
- Alembic ordered, reversible migrations.

### Files/modules
- `backend/app/db/` (models, repositories, migrations).

### Database changes
- All tables in `11-database-architecture.md` section 3–5 (contacts, conversations, messages, webhook_events, automations, ai_*, audit_logs, etc.), plus indexes/constraints.

### API changes
None user-facing (foundational).

### Frontend changes
None.

### Backend changes
- Repository pattern with injected tenant scope; soft-delete + filtered unique indexes.

### Tests
- Migration apply/rollback; repository CRUD + tenant isolation; constant/constraint tests (see `26-testing.md`).

### Security checks
- Every tenant table has `workspace_id` + index; repositories always filter by it; no raw string-interpolated SQL.

### Manual verification
- Inspect schema; run `upgrade head` cleanly; confirm a cross-tenant query returns nothing.

### Acceptance criteria
- `upgrade head` applies clean; all core tables + indexes present.
- Repository tests assert zero cross-tenant reads/writes.

### Deployment requirements
- Migration runner wired into deploy (`28-deployment.md`).

### Rollback strategy
- Backward-compatible additive migrations; `alembic downgrade` verified in staging.

---
---

## PHASE 4 — Meta App & OAuth Setup

### Objective
Configure the Meta Business app, OAuth flow, and token handling so Pages can be connected.

### Dependencies
Phases 2–3.

### Features
- Facebook Login for Business OAuth; server-side short→long-lived token exchange; `/me/accounts` page/token collection; encrypted token storage.

### Files/modules
- `backend/app/integrations/meta/` (OAuth, token service, encryption), Meta webhook/OAuth callback routes.

### Database changes
- `facebook_accounts`, `facebook_pages`, `page_tokens` (token history/rotation/expiry).

### API changes
- `GET /meta/oauth/authorize` (redirect), `GET /meta/oauth/callback`, `GET /meta/pages`.

### Frontend changes
- "Connect Page" button initiating OAuth; connection status display.

### Backend changes
- Meta client (`respx`-testable), envelope encryption (DEK/KEK), token persistence + validity tracking.

### Tests
- OAuth state/CSRF validation; token exchange (respx); `/me/accounts` parsing; token-encryption round trip; "token never returned to client" assertion (see `26-testing.md`).

### Security checks
- `state`/CSRF + pinned redirect URI; server-side code/token exchange only; tokens encrypted at rest; never in responses/logs (see `23-security.md`).

### Manual verification
- In Meta Development mode, connect a real Page as an app tester and confirm listed Pages appear.

### Acceptance criteria
- A tester can complete OAuth and list authorized Pages.
- Page tokens are stored encrypted and never serialized to the client.

### Deployment requirements
- `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN`, `META_REDIRECT_URI`, and KMS/KEK refs configured (separate Meta app per env).

### Rollback strategy
- Revoke/reissue Meta app settings; roll back token-table migration/encryption changes; reauth flows degraded gracefully (mark Pages "reconnect").

---
---

## PHASE 5 — Page Connection

### Objective
Let a user select, connect, manage, and disconnect Facebook Pages within a workspace.

### Dependencies
Phase 4.

### Features
- Connect selected Pages to a workspace; Page status (connected/reconnecting/error); disconnect; token validity/reconnect surfacing.

### Files/modules
- `backend/app/pages/`, `frontend/app/pages/`.

### Database changes
- Wire `facebook_pages` into workspace relationships; add status fields/indexes (if not already).

### API changes
- `GET/POST/DELETE /workspaces/{id}/pages`, `GET /workspaces/{id}/pages/{page_id}` (status/token validity).

### Frontend changes
- Page list, connect flow, status badges, disconnect action.

### Backend changes
- Page service (connect/disconnect/status), reauthorization check (proactive validity on `190`/`10`).

### Tests
- Connect/disconnect; status transitions; duplicate-connection prevention; token expiry surfacing.

### Security checks
- Connecting a Page requires `pages.connect`; token never exposed; disconnect revokes/clears token records.

### Manual verification
- Connect a Page → see it listed with status → disconnect → token removed.

### Acceptance criteria
- User can connect/disconnect Pages; status and token validity visible; duplicate binds prevented.

### Deployment requirements
- Meta app Live-ish/dev configuration aligned with target env.

### Rollback strategy
- Disconnect + reconnect; revert auth/token changes gracefully.

---
---

## PHASE 6 — Webhook Infrastructure

### Objective
Build reliable, idempotent, verified ingestion of Meta webhook events.

### Dependencies
Phases 3–5.

### Features
- `X-Hub-Signature-256` verification; verify-token handshake; normalization; idempotency (`meta_event_id`); ack-before-process (enqueue).

### Files/modules
- `backend/app/webhooks/` (router, verifier, normalizer, ingest task), `webhook_events` repository; Celery ingest task.

### Database changes
- `webhook_events` (raw + normalized, idempotency key), `outbound_jobs` prepared for later.

### API changes
- `GET /webhooks/meta` (verify handshake), `POST /webhooks/meta` (ingest).

### Frontend changes
None (foundational).

### Backend changes
- Signature verification (constant-time), normalization (object/page/event), queue enqueue + worker processing, realtime publish (Redis pub/sub) groundwork.

### Tests
- Verification accept/reject; unknown Page/object drop; duplicate `meta_event_id` idempotency; ack-before-process; contact auto-create exactly once (see `26-testing.md`).

### Security checks
- Verification required before any processing; foreign/spoofed events dropped; raw body used for HMAC (no body mutation).

### Manual verification
- Trigger Meta's webhook "Test" button or a manual signed payload; confirm event stored once and message appears (if handler wired).

### Acceptance criteria
- Valid events ingested exactly once; invalid/foreign events rejected; ack < 1s.

### Deployment requirements
- Public HTTPS `META_WEBHOOK_URL` reachable + configured in Meta app.

### Rollback strategy
- Disable webhook subscription; worker drained; revert handler/queue changes.

---
---

## PHASE 7 — Messenger Send/Receive

### Objective
Enable full outbound/inbound Messenger messaging with compliance enforcement.

### Dependencies
Phases 5–6.

### Features
- Inbound message normalization → conversation/message/contact.
- Outbound send (`POST /{page}/messages`) with `messaging_type` (RESPONSE/UPDATE/TAGGED) and tag handling; window/tag eligibility enforcement; delivery/read tracking; errors + retry.

### Files/modules
- `backend/app/messaging/` (send service, eligibility engine, message service), `backend/app/integrations/meta/messages.py`, `outbound_jobs` worker.

### Database changes
- `messages`, `message_events`, `outbound_jobs` wired; conversation/message indexes.

### API changes
- `POST /workspaces/{id}/conversations/{cid}/messages` (send), `GET .../messages` (history), delivery/read webhook updates.

### Frontend changes
- Conversation thread UI, message composer, send/reply, delivery/read indicators.

### Backend changes
- Eligibility service (window/tag), Meta send client, message lifecycle state machine, retry/backoff, error mapping (190/10/551/613).

### Tests
- Eligibility unit tests (window/tag/type); send via respx; error mapping; delivery/read event handling; retry/backoff (see `26-testing.md`).

### Security checks
- Never send outside window without a valid tag; never promotional TAGGED content; tokens/PSIDs not logged (see `13-meta-integration.md`, `27-observability.md`).

### Manual verification
- Receive a real message; reply within window (delivers); attempt outside-window send (blocked with honest error).

### Acceptance criteria
- Inbound messages stored to correct conversation/contact; outbound RESPONSE sent within window; outside-window send without tag blocked.

### Deployment requirements
- `pages_messaging` granted; Meta app Live mode (or dev testers) for send.

### Rollback strategy
- Pause send path; drain `outbound_jobs`; revert eligibility/message changes; re-enable after fix.

---
---

## PHASE 8 — Unified Inbox

### Objective
Deliver a real-time, aggregated inbox across connected Pages.

### Dependencies
Phases 5–7.

### Features
- Aggregate conversations; realtime update (WebSocket/polling); search + filters (Page/read/unread/assignee/status/label); status lifecycle; assignment; customer sidebar.

### Files/modules
- `backend/app/inbox/`, `backend/app/realtime/`, `frontend/app/inbox/`, `frontend/app/conversations/[id]/`.

### Database changes
- Conversation/message indexes for aggregation + search (trigram on `messages.body`).

### API changes
- `GET /workspaces/{id}/conversations` (filters/pagination), `PATCH .../conversations/{id}` (status/assign/labels), WS endpoint `/realtime`.

### Frontend changes
- Inbox list pane, conversation view, filters, assignment, status controls, realtime subscriptions, customer sidebar.

### Backend changes
- Conversation service, search/filter, realtime pub/sub (Redis), unread/status/labels, Agent row-scoping.

### Tests
- Aggregation across Pages; filters; assignment; realtime delivery; Agent scoping; search (trigram).

### Security checks
- Tenant + RBAC scoping; Agent sees only assigned (unless `conversations.read_all`); XSS-safe rendering of message bodies.

### Manual verification
- Open inbox, see multiple Pages' conversations, receive a new message (appears without refresh), filter/assign.

### Acceptance criteria
- Conversations from all connected Pages appear; new messages appear realtime (< 2s); filter/assign/status work; Agent scoping enforced.

### Deployment requirements
- Redis pub/sub configured; WebSocket/fallback path reachable.

### Rollback strategy
- Disable realtime (fall back to polling); revert inbox/filter changes.

---
---

## PHASE 9 — Contacts & Leads CRM

### Objective
Deliver the contact/lead pipeline derived from conversations.

### Dependencies
Phases 7–8.

### Features
- Auto-create contact per PSID; lead status pipeline (New/Qualified/Contacted/Won/Lost); lead score (rule-based); tags/labels; product-interest attribution; search/filter/segment; per-contact history.

### Files/modules
- `backend/app/crm/` (contacts, leads, scoring, segmentation), `frontend/app/contacts/`, `frontend/app/leads/`.

### Database changes
- `contacts` (status/score/interests), `contact_events`, `labels`, `contact_labels`, `notes`.

### API changes
- `GET/POST/PATCH /workspaces/{id}/contacts`, `PATCH .../contacts/{id}/lead-status`, labels, notes, segments.

### Frontend changes
- Contacts/leads list, contact detail + history, lead pipeline board, labels/notes, segment builder.

### Backend changes
- Contact/lead service, lead scoring, segmentation, interest attribution, notes/labels.

### Tests
- Auto-create on first message; scoring rules; segmentation filters; status transitions; history; tenant + RBAC scoping.

### Security checks
- `contacts.read`/`write`/`export` RBAC; tenant scoping; no PII in logs.

### Manual verification
- Receive a new message → contact auto-created; assign lead status/score; filter by product interest.

### Acceptance criteria
- Contact auto-created per PSID exactly once; lead pipeline + scoring + segments work; per-contact history accessible.

### Deployment requirements
None beyond existing.

### Rollback strategy
- Feature-flag CRM writes; revert scoring/segmentation changes.

---
---

## PHASE 10 — Message Templates

### Objective
Provide reusable message templates (with optional variables) for faster, consistent replies.

### Dependencies
Phases 7–8.

### Features
- Template CRUD, variables, search/categorization, insert-into-composer, AI draft friendly.

### Files/modules
- `backend/app/templates/`, `frontend/app/templates/`.

### Database changes
- `message_templates` (or reuse a generic content table; document in `11-database-architecture.md`).

### API changes
- `GET/POST/PATCH/DELETE /workspaces/{id}/templates`.

### Frontend changes
- Template list/form, variable editor, composer insertion.

### Backend changes
- Template service + variable interpolation.

### Tests
- CRUD, variable interpolation (valid + missing variable), tenant/RBAC scoping.

### Security checks
- RBAC (`messaging.compose`/related); XSS-safe rendering of template content.

### Manual verification
- Create a template with a variable, insert into a reply, verify it renders.

### Acceptance criteria
- Templates create/edit/delete; variables interpolate; composer insertion works.

### Deployment requirements
None beyond existing.

### Rollback strategy
- Revert template table/service; templates are non-destructive.

---
---

## PHASE 11 — Campaigns

### Objective
Enable compliant, audience-targeted campaigns with eligibility and delivery tracking.

### Dependencies
Phases 7, 9, 10.

### Features
- Campaign CRUD (name, template, audience segment, schedule); eligibility check (window/tag); queue + deliver; delivered/failed/retry; cancel; analytics.

### Files/modules
- `backend/app/campaigns/`, `frontend/app/campaigns/`.

### Database changes
- `campaigns`, `campaign_audiences`, `campaign_recipients`; reuse `outbound_jobs`.

### API changes
- `GET/POST/PATCH/DELETE /workspaces/{id}/campaigns`, `POST .../campaigns/{id}/send`, `POST .../campaigns/{id}/cancel`, recipient/stats endpoints.

### Frontend changes
- Campaign list/form, audience selector, schedule, send/cancel, campaign analytics views.

### Backend changes
- Campaign service, eligibility evaluation, queue fan-out worker, delivery/read aggregation, cancel.

### Tests
- Eligibility (ineligible skipped not sent); fan-out; deliver/fail/retry; cancel; no cold/PII-random sends; rate-limit/backoff.

### Security checks
- `campaigns.send` RBAC; target audience originates from existing eligible contacts only; no policy bypass.

### Manual verification
- Create a campaign to eligible contacts, send, verify delivered/failed/skipped stats.

### Acceptance criteria
- Campaigns send only to eligible contacts; stats tracked; cancel stops the queue.

### Deployment requirements
- Worker scaling for fan-out; monitoring of queue depth/send rate.

### Rollback strategy
- Cancel campaigns, drain queue, revert campaign/service changes.

---
---

## PHASE 12 — Automation

### Objective
Deliver the trigger → conditions → actions automation engine.

### Dependencies
Phases 7–9, 11.

### Features
- Visual/logical builder; triggers (new message/conversation/intent); conditions (intent/label/score/keyword); actions (label/status/assign/draft/send/delay); delays/branching/variables; enable/disable; execution history/logs; test mode.

### Files/modules
- `backend/app/automations/`, `frontend/app/automations/`.

### Database changes
- `automations`, `automation_nodes`, `automation_executions`, `automation_execution_steps`.

### API changes
- `GET/POST/PATCH/DELETE /workspaces/{id}/automations`, enable/disable, execution history.

### Frontend changes
- Automation builder UI, node list/editor, enable/disable, execution log viewer, test mode.

### Backend changes
- Automation engine (node graph execution), condition matchers, action dispatchers, send-action eligibility gating, Celery integration.

### Tests
- Trigger firing; condition eval; action order/delays/branches; send gated by eligibility; disabled never runs; history/logs; test mode no external sends.

### Security checks
- `automation.manage` RBAC; enabled automation sends re-check window/tag; AI/automation actions logged; no cross-tenant.

### Manual verification
- Build a "new message → label + draft reply" automation, trigger it, verify logs + draft.

### Acceptance criteria
- Automations run on triggers with correct conditions/actions; send actions skip ineligible recipients; execution history visible; disabled automations inert.

### Deployment requirements
- Worker availability; observability for automation logs.

### Rollback strategy
- Disable automations; drain executions; revert engine changes.

---
---

## PHASE 13 — AI Assistant

### Objective
Deliver the controlled, natural-language AI assistant with the READ/PREPARE/WRITE/EXTERNAL safety model.

### Dependencies
Phases 7–9, 11–12; `19-ai-assistant.md`, `20-ai-tools.md`.

### Features
- Instruction → intent/plan → controlled tools → explanation; READ/PREPARE/WRITE/EXTERNAL classification; EXTERNAL always confirmed; strict allowlist; tenant + RBAC + policy re-validation.

### Files/modules
- `backend/app/ai/` (orchestrator, tool registry, tools), `frontend/app/assistant/`.

### Database changes
- `ai_sessions`, `ai_messages`, `ai_actions`, `ai_action_logs`.

### API changes
- `POST /workspaces/{id}/ai/instructions` (run), `GET .../ai/sessions`, confirmation endpoints (`approve`/`cancel`).

### Frontend changes
- Assistant chat UI, "what will happen" confirmation cards (Approve/Cancel/Edit), action summaries.

### Backend changes
- Orchestrator loop, tool registry + Pydantic schemas, RBAC/tenant/policy enforcement at service layer, structured outputs, bounded loops/timeouts, logging.

### Tests
- Allowlist-only; class→RBAC; EXTERNAL always confirmed; service-layer re-validation independent of model; bounded loops; tool-arg validation; audit logging; deterministic fake-LLM (see `26-testing.md`).

### Security checks
- AI never issues raw DB/Meta calls; context selection minimal (no cross-tenant data to model); all tool calls logged; EXTERNAL gating.

### Manual verification
- Ask a READ question, draft a reply (PREPARE), then send (EXTERNAL requires confirmation).

### Acceptance criteria
- READ answers grounded in workspace data; PREPARE shows preview; EXTERNAL blocked until explicit confirmation; all actions audited.

### Deployment requirements
- `LLM_API_KEY`/provider configured (sandbox for lower envs).

### Rollback strategy
- Feature-flag AI off; revert orchestrator/tool changes; audit logs retained.

---
---

## PHASE 14 — AI Customer Response

### Objective
Provide grounded, inline AI-suggested customer replies in the inbox.

### Dependencies
Phases 7–8, 13.

### Features
- Inline "suggest reply" grounded in conversation context; draft-to-composer; human approves before send; disclosure wording (automated interaction) where required.

### Files/modules
- `backend/app/ai/reply.py` (suggest service), `frontend/app/inbox/` (suggest widget).

### Database changes
None (reuse ai_* and messages; may add a flag on messages for AI-drafted).

### API changes
- `POST .../conversations/{cid}/suggest-reply`.

### Frontend changes
- AI suggest button, draft preview, approve-into-composer.

### Backend changes
- Grounded summarization/reply service using conversation context only (context selection).

### Tests
- Grounded reply uses only that conversation; no cross-conversation/cross-tenant leakage; draft is PREPARE (no auto-send).

### Security checks
- No auto-send; human approval required; minimal context; no PII to logs.

### Manual verification
- Open a conversation, generate a suggested reply, review it, then send manually.

### Acceptance criteria
- AI suggests a grounded reply; nothing is sent without human approval; disclosure wording available.

### Deployment requirements
- LLM key; config for disclosure text.

### Rollback strategy
- Disable suggest endpoint; revert UI/service.

---
---

## PHASE 15 — Analytics

### Objective
Ship dashboards for platform + campaign/automation performance (metrics per `32-product-analytics.md`).

### Dependencies
Phases 8–9, 11–12.

### Features
- Dashboard metrics (connected Pages, active workspaces, conversations, response time, leads, messages); per-Page/per-agent breakdowns; campaign + automation performance.

### Files/modules
- `backend/app/analytics/`, `frontend/app/analytics/`.

### Database changes
- Aggregates/materialized views or precomputed metrics tables (optional); reuse existing tables for on-demand queries.

### API changes
- `GET /workspaces/{id}/analytics/*` (overview, per-page, per-agent, campaigns, automations).

### Frontend changes
- Analytics dashboard, charts, filters, per-Page/per-agent views.

### Backend changes
- Metrics query service, aggregations, caching (tenant-namespaced).

### Tests
- Aggregation correctness; per-Page/per-agent breakouts; caching isolation; empty-data handling.

### Security checks
- `analytics.read` RBAC; tenant scoping; no cross-tenant rollups.

### Manual verification
- View dashboard; filter by Page/agent; confirm numbers match source data.

### Acceptance criteria
- Aggregates match underlying data; per-Page/per-agent correct; caching tenant-scoped.

### Deployment requirements
- Optional metric views/migrations.

### Rollback strategy
- Disable analytics endpoints; drop aggregate views/tables.

---
---

## PHASE 16 — Team & RBAC Polish

### Objective
Complete team management and full RBAC enforcement, including Agent row-level scoping and invitations UX.

### Dependencies
Phase 2, 8–9.

### Features
- Invite/manage members; role assignment (Owner/Admin/Member/Agent); row-level scoping for Agent (assigned only); permission enforcement across every endpoint.

### Files/modules
- `backend/app/workspaces/` (members/invites), `backend/app/auth/` (RBAC), `frontend/app/settings/team/`.

### Database changes
None major (RBAC tables already exist; any adjustments documented in `11-database-architecture.md`).

### API changes
- Member list/add/remove/role; invitation send/accept/cancel; any missing RBAC-bound endpoints.

### Frontend changes
- Team management UI, invite flow, role picker, scoped inbox views for Agent.

### Backend changes
- Row-level scoping for Agent (`conversations.read` limited to assigned; `contacts.read` scoped); permission enforcement audit pass.

### Tests
- Full role-permission matrix; Agent scoping; invite lifecycle; permission-matrix regression tests.

### Security checks
- RBAC enforced server-side on every endpoint; Agent cannot read unrelated data; invites single-use/expiring.

### Manual verification
- Invite a member, set Agent role, confirm Agent only sees assigned conversations.

### Acceptance criteria
- All roles enforced per `22-auth-rbac.md`; Agent row-scoping correct; invite lifecycle works.

### Deployment requirements
None beyond existing.

### Rollback strategy
- Revert role/permission or scoping changes; revoke affected invites.

---
---

## PHASE 17 — Security Hardening

### Objective
Complete the security baseline and threat-model mitigations before production.

### Dependencies
All prior phases.

### Features
- Finalize envelope encryption, secrets management, webhook signature strictness, rate limiting, secure cookies, audit logs, retention/erasure, dependency scanning.

### Files/modules
- `backend/app/security/`, audit/retention modules, CI security gates.

### Database changes
- `audit_logs` finalized; retention configs; any field-level PII encryption.

### API changes
- Audit endpoints (`audit.read`), data export/erasure endpoints (privacy).

### Frontend changes
- Audit log viewer (admin); privacy/erasure settings.

### Backend changes
- Envelope encryption (DEK/KEK), secrets manager wiring, rate limiting, secure cookie config, export/erasure flows, log redaction.

### Tests
- Security tests (injection, XSS, token secrecy, revoked-token rejection, rate limit, cross-tenant negatives, dependency audit) — see `26-testing.md`.

### Security checks
- Full `23-security.md` checklist passes; no secrets/PII in logs; threat-model re-review.

### Manual verification
- Run a security review checklist; verify token encryption at rest; verify erasure.

### Acceptance criteria
- `23-security.md` checklist complete; dependency scan clean (known-critical); threat model mitigated.

### Deployment requirements
- KMS/KEK, secrets manager, audit/retention storage configured.

### Rollback strategy
- Disable aggressive rate limits if they cause issues; revert encryption/retention configs carefully (re-encrypt on revocation).

---
---

## PHASE 18 — Production Deployment

### Objective
Deploy the MVP to production with monitoring, backups, and SSL.

### Dependencies
Phases 0–17.

### Features
- Production infrastructure per `28-deployment.md`; migrations; monitoring/alerting; backups; domain/SSL; webhook URLs pinned.

### Files/modules
- Deployment config (`28-deployment.md`), CI/CD release pipeline (`30-git-workflow.md`).

### Database changes
- Production migrations applied.

### API changes
None (config-level).

### Frontend changes
- Production build + environment URLs/CORS.

### Backend changes
- Production env/secrets wiring; health/readiness; rate limits; error handling (no stack traces).

### Tests
- E2E smoke in staging; load test baseline (see `26-testing.md` section 15).

### Security checks
- TLS/HSTS; secrets from manager only; webhook URL HTTPS + pinned; Meta app Live + app-reviewed.

### Manual verification
- Full launch checklist: connect Page, receive, reply, automation, AI, analytics, team.

### Acceptance criteria
- Production live with SSL, backups, monitoring, alerts; critical E2E journeys pass.

### Deployment requirements
- All production secrets + Meta Live app + domain + monitoring.

### Rollback strategy
- Versioned rollback to previous release; migration downgrade (or forward-fix); DB backups/PITR.

---
---

## PHASE 19 — Monitoring & Scaling

### Objective
Instrument, observe, and prepare pagination for growth; establish runbooks and scaling path.

### Dependencies
Phase 18.

### Features
- Full observability (metrics, logs, traces, alerts per `27-observability.md`); queue/backpressure monitoring; scaling playbook; token-reauth monitoring.

### Files/modules
- Observability config, dashboards, runbooks.

### Database changes
None (optional metric retention tuning).

### API changes
None.

### Frontend changes
None.

### Backend changes
- Metrics instrumentation, APM/tracing, alert thresholds, health-check hardening.

### Tests
- Load tests; alert-threshold drills.

### Security checks
- Observability redaction auditing (no secrets/PII).

### Manual verification
- Trigger an alert condition; follow the runbook; verify scaling works.

### Acceptance criteria
- Dashboards + alerts live; runbooks exist for Meta errors, AI failures, queue backlog; scaling path validated.

### Deployment requirements
- Monitoring/alerting (Sentry, Prometheus/Grafana) configured.

### Rollback strategy
- Disable/adjust alerting; revert instrumentation.

---
---

## Phase Dependency Graph

```
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19
                                                          └──────────┬──────────┘
                                                     (13/14 can proceed once tools exist)
```
Some phases can partially overlap (e.g., 10 templates with 9 CRM; 14 AI reply with 13 assistant), but the sequential order above is the recommended critical path.
