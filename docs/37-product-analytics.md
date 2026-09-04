# 32 — Product & Platform Analytics

Metrics definitions for PagePilot: what we measure, how each is computed, and where it surfaces. These power the analytics module (Phase 15 in `32-development-phases.md`) and inform product decisions. Each metric is workspace-scoped unless stated otherwise; all aggregations respect tenant isolation (`22-auth-rbac.md`, `23-security.md`).

> **Numbering note:** this file intentionally uses "32" to sit beside `32-development-phases.md` in the navigation; it is a distinct document (product/analytics metrics vs. build phases).

## 1. Metric Taxonomy

| Category | Metrics |
| --- | --- |
| Adoption & engagement | Connected Pages, Active workspaces, Workspace seat count |
| Inbox & conversations | Conversations (total/new/active), Messages, Response time, Resolution |
| Leads & CRM | Leads created, Qualified leads, Lead conversion |
| Messaging | Messages sent/delivered/failed, Messaging eligibility skips |
| Automation | Automation executions, Automation actions fired, Automation send-skips |
| Campaigns | Campaign sends, Delivered/Read/Replied rates, Campaign failures |
| AI | AI actions (by class), AI confirmation rate, AI adoption, AI cost |
| Conversion & outcomes | Lead conversion ratio, Replied→Qualified conversion |
| Failure & health | Failed messages, Webhook failures, Token reconnects |

## 2. Metric Definitions

### 2.1 Connected Pages

- **Definition:** Number of Facebook Pages connected to a workspace (status `connected`).
- **Computation:** `COUNT(facebook_pages WHERE status = 'connected' AND workspace_id = w)`.
- **Surfaces:** Admin "Settings → Pages", workspace overview, product-level adoption dashboard.

### 2.2 Active Workspaces

- **Definition:** Workspaces with ≥1 meaningful activity in a period (user action, message received/sent, automation/AI run).
- **Computation:** `COUNT(DISTINCT workspace_id)` from an activity events/messages join for the period (daily/weekly/monthly); DAU/WAU derivable.
- **Surfaces:** Product-level growth dashboard (admin-only), investor/reporting.

### 2.3 Conversations

- **Definition:** Total / new / active conversations in a period; a conversation is a Messenger thread bound to a contact + Page.
- **Computation:** `COUNT(conversations WHERE workspace_id = w [AND created_at in period])`; "active" = `last_message_at` within period.
- **Surfaces:** Analytics dashboard, inbox summary.

### 2.4 Messages

- **Definition:** Total inbound + outbound messages in a period.
- **Computation:** `COUNT(messages WHERE workspace_id = w AND created_at in period)`, split by `direction`.
- **Surfaces:** Analytics dashboard, per-Page breakdown.

### 2.5 Response Time

- **Definition:** Time from an inbound customer message to the first business reply (per conversation, then aggregated).
- **Computation:** For each inbound message that precedes a first outbound reply, `min(outbound.created_at) - inbound.created_at`; report median/p95.
- **Surfaces:** Analytics dashboard (median + p95), per-agent SLA view.

### 2.6 Leads Created

- **Definition:** Number of contacts that entered the lead pipeline (any non-null `lead_status`) in a period.
- **Computation:** `COUNT(contacts WHERE workspace_id = w AND lead_status IS NOT NULL AND lead_created_at in period)` (track a `lead_created_at`/status-change event via `contact_events`).
- **Surfaces:** Leads/CRM board, analytics dashboard.

### 2.7 Qualified Leads

- **Definition:** Leads with `lead_status` in `{Qualified}` (or `lead_score` above a workspace threshold) in a period.
- **Computation:** `COUNT(contacts WHERE lead_status = 'Qualified' [or lead_score >= threshold] AND workspace_id = w AND transition in period)`.
- **Surfaces:** Leads board, analytics dashboard, AI-assisted lead queries.

### 2.8 Lead Conversion

- **Definition:** Proportion of leads that reach `Won` (converted) within a period.
- **Computation:** `COUNT(leads → Won) / COUNT(leads created)` over a cohort (e.g., leads created in window T, converted by T+Δ).
- **Surfaces:** Analytics dashboard, funnel view.

### 2.9 Messages Sent / Delivered / Failed

- **Definition:** Outbound message lifecycle counts.
- **Computation:** `messages where direction = 'outbound'` and `message_events`/`outbound_jobs` statuses: sent (queued→accepted), delivered (`message_deliveries`), failed (`failed`/`permanent_fail`).
- **Surfaces:** Analytics dashboard, campaign/automation views, messaging health alerts.

### 2.10 Automation Executions

- **Definition:** Number of automation runs in a period.
- **Computation:** `COUNT(automation_executions WHERE workspace_id = w AND started_at in period)`.
- **Surfaces:** Automation list, analytics dashboard.

### 2.11 Automation Actions Fired

- **Definition:** Number of actions executed across automations (by action type).
- **Computation:** `COUNT(automation_execution_steps WHERE status = 'success')` grouped by action type.
- **Surfaces:** Automation analytics, execution log.

### 2.12 Campaign Performance

- **Definition:** Per-campaign sends, delivered, read, replied, failed/skipped.
- **Computation:** `campaign_recipients` statuses: `sent`, `delivered`, `read`, `replied`, `failed`, `skipped`; ratios over `queued`.
- **Surfaces:** Campaign analytics, analytics dashboard.

### 2.13 AI Actions (by class)

- **Definition:** Count of AI tool invocations split by class (READ/PREPARE/WRITE/EXTERNAL) and tool.
- **Computation:** `COUNT(ai_actions)` grouped by `permission_level` + `tool_name`; from `ai_action_logs` for executed vs. planned.
- **Surfaces:** AI assistant history, product-level AI adoption dashboard.

### 2.14 AI Confirmation Rate

- **Definition:** Proportion of EXTERNAL (and bulk WRITE) actions that the user explicitly approved.
- **Computation:** `COUNT(ai_actions approved) / COUNT(ai_actions requiring confirmation)`.
- **Surfaces:** AI analytics, security/audit reporting.

### 2.15 AI Adoption / Cost

- **Definition:** Number of distinct users/workspaces using AI, plus estimated provider cost.
- **Computation:** `COUNT(DISTINCT user_id/workspace_id)` using AI per period; cost from token usage (if tracked) or per-action estimates.
- **Surfaces:** Product-level adoption + cost guardrail dashboard.

### 2.16 Failed Messages (health)

- **Definition:** Outbound messages that failed (transient or permanent), with reasons.
- **Computation:** `outbound_jobs/message_events WHERE status = 'failed'/'permanent_fail'` grouped by `error_code`.
- **Surfaces:** Messaging health dashboards + alerts (`27-observability.md`).

## 3. Metric Computation Notes

- **Source of truth:** PostgreSQL (`11-database-architecture.md`) with on-demand aggregations at MVP scale; introduce materialized views/nightly rollups only if query latency grows.
- **Time-bucketing:** Periods = daily/weekly/monthly; UTC days. Snapshots for trending use a `metrics`/rollup table when added.
- **Tenant scoping:** every count filters `workspace_id`; rolling platform-level metrics are aggregated only in an admin context (never exposed across tenants).
- **Idempotency:** metrics derived from deduplicated events (`webhook_events.meta_event_id`, `message_events` unique) to avoid double-counting.
- **Eligibility skips:** "ineligible skipped" recipients (outside window / no tag) are counted **separately** from failures, so compliance vs. technical-health are distinguishable (see `18-automation-engine.md`, `17-campaign-system.md`).

## 4. Where Metrics Surface

| Metric group | Primary surface |
| --- | --- |
| Adoption (Pages, workspaces, seats) | Admin/workspace settings + product growth dashboard |
| Inbox (conversations, messages, response time) | Analytics dashboard + inbox summary |
| Leads (created, qualified, conversion) | Leads/CRM board + analytics funnel |
| Messaging (sent/delivered/failed, skips) | Messaging health + analytics |
| Automation (executions, actions) | Automation list + analytics |
| Campaign (performance, rates) | Campaign analytics |
| AI (actions, confirmation, adoption) | AI assistant history + analytics |
| Failure/health (failed messages, webhooks, reconnects) | Alerts + runbooks (`27-observability.md`) |

## 5. Success Metrics (North Star — see `02-product-requirements.md`)

- Connected Pages per workspace; active workspaces (DAU/WAU).
- Conversations/day; median/p95 first-response time.
- Leads created; qualified lead rate; lead→won conversion.
- AI actions executed and confirmation rate.
- Automation executions; campaign delivered/failed rates.
- User retention (D7/D30).

These top-level metrics gate product decisions and tie directly to the phased build in `32-development-phases.md`.
