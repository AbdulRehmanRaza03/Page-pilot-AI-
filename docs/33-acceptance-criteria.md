# 33 — Acceptance Criteria (Measurable, Per Module)

Measurable, checkable acceptance criteria for every major module. Each criterion is a verifiable statement ("User can…", "…not exposed to client"). These map to the features and phases in `32-development-phases.md` and the PRD in `02-product-requirements.md`.

Cross-references use filenames only.

## 1. Facebook Page Connection

- [ ] **AC-1.1** A user with `pages.connect` can initiate Facebook OAuth from the UI.
- [ ] **AC-1.2** The OAuth callback validates `state` against the server-side store and rejects mismatches (no CSRF).
- [ ] **AC-1.3** The short-lived user token is exchanged for a long-lived token **server-side only**.
- [ ] **AC-1.4** The user can list all Pages returned by `/me/accounts` and select which to connect.
- [ ] **AC-1.5** Each connected Page shows its status (`connected` / `reconnecting` / `error`).
- [ ] **AC-1.6** Page access tokens are stored encrypted at rest and **never exposed to the client** (asserted in API responses and frontend state).
- [ ] **AC-1.7** A user can disconnect a Page; disconnect clears the associated token records.
- [ ] **AC-1.8** On Meta error code `190`/`10`, the Page is marked invalid and the UI surfaces a "reconnect" prompt.
- [ ] **AC-1.9** Required MVP permissions (`pages_show_list`, `pages_messaging`, `pages_manage_metadata`, `pages_read_engagement`) are the only ones requested (see `13-meta-integration.md`).

## 2. Inbox (Unified)

- [ ] **AC-2.1** Conversations from all connected Pages appear in a single inbox list.
- [ ] **AC-2.2** A new inbound message appears in the inbox in real time (< 2s) without manual refresh.
- [ ] **AC-2.3** The user can filter by Page, read/unread, assignee, status, and label.
- [ ] **AC-2.4** The user can search message contents and contact name.
- [ ] **AC-2.5** The user can assign/unassign a conversation to a member.
- [ ] **AC-2.6** Conversation status lifecycle (Open/Pending/Resolved/Awaiting-reply) is observable and changeable.
- [ ] **AC-2.7** The customer contact and their history render in a sidebar within the conversation.
- [ ] **AC-2.8** An `Agent` role sees only assigned conversations unless granted `conversations.read_all` (row-level scoping, see `22-auth-rbac.md`).
- [ ] **AC-2.9** Message bodies render as text and cannot execute HTML (XSS-safe).
- [ ] **AC-2.10** Inbox list render p95 < 200ms (NFR-1).

## 3. Contacts & Leads (CRM)

- [ ] **AC-3.1** A contact is auto-created for each new PSID on first message — **exactly once** (idempotent).
- [ ] **AC-3.2** Contacts are unique per `(workspace_id, psid)`, including under soft-delete (filtered unique index).
- [ ] **AC-3.3** The user can move a lead through statuses New/Qualified/Contacted/Won/Lost.
- [ ] **AC-3.4** Lead score is computed from deterministic rules and updates as signals arrive.
- [ ] **AC-3.5** The user can add tags/labels and notes to a contact.
- [ ] **AC-3.6** Product-interest attribution is captured and filterable.
- [ ] **AC-3.7** The user can search, filter, and segment contacts.
- [ ] **AC-3.8** A contact's full conversation history is viewable from the contact record.
- [ ] **AC-3.9** `contacts.export` is restricted to Owner/Admin (per `22-auth-rbac.md`).

## 4. Messaging

- [ ] **AC-4.1** The user can send a one-to-one message as `RESPONSE` within the 24-hour window.
- [ ] **AC-4.2** `UPDATE` messages are only sent within the open window.
- [ ] **AC-4.3** `TAGGED` messages require a valid, eligible, non-promotional tag and are only used outside the window per `13-meta-integration.md`.
- [ ] **AC-4.4** A send outside the 24-hour window without an eligible tag is **blocked** and surfaced with an honest error (never sent).
- [ ] **AC-4.5** Delivery and read state are tracked via `message_deliveries` / `message_reads` and shown in the UI.
- [ ] **AC-4.6** Messages record their `messaging_type` and `tag` for audit/compliance.
- [ ] **AC-4.7** Send failures are surfaced; transient errors (e.g., `613`) retry with backoff; permanent errors (`551`/`1545041`) are marked and not retried.
- [ ] **AC-4.8** The user can create, edit, delete, and insert message templates (with variables).

## 5. Campaigns

- [ ] **AC-5.1** The user with `campaigns.send` can create a campaign (name, template, audience segment, schedule).
- [ ] **AC-5.2** Campaign recipients originate from an existing eligible audience (no arbitrary/cold PSID lists).
- [ ] **AC-5.3** An eligibility check runs before send; ineligible recipients are **skipped** (not sent), recorded separately.
- [ ] **AC-5.4** Campaigns queue and deliver; delivered/failed/skipped counts are tracked per recipient.
- [ ] **AC-5.5** The user can cancel a campaign and the queue ceases sending.
- [ ] **AC-5.6** Campaign performance (delivered/read/replied, failure reasons) is viewable.

## 6. Automation

- [ ] **AC-6.1** The user can build a trigger → conditions → actions automation in the builder.
- [ ] **AC-6.2** Triggers fire on the correct event (new message/conversation/intent).
- [ ] **AC-6.3** Conditions evaluate (intent/label/score/keyword) correctly; missing data evaluates safely without erroring.
- [ ] **AC-6.4** Actions (label, status, assign, draft, send) execute in order, respecting delays and branches.
- [ ] **AC-6.5** A send action re-checks window/tag; ineligible recipients are skipped, not sent.
- [ ] **AC-6.6** The user can enable/disable an automation; a disabled automation never runs.
- [ ] **AC-6.7** Execution history and step logs are viewable (`automation_executions`, `automation_execution_steps`).
- [ ] **AC-6.8** Test mode does not emit external sends.

## 7. AI Assistant

- [ ] **AC-7.1** The assistant can answer a READ question (search/summarize/filter) grounded in the workspace's data.
- [ ] **AC-7.2** READ answers cite their sources (contact/conversation IDs) so they are checkable.
- [ ] **AC-7.3** The assistant can produce a PREPARE result (draft message/campaign/automation) shown as a preview with no external effect.
- [ ] **AC-7.4** Every action is classified READ/PREPARE/WRITE/EXTERNAL per `19-ai-assistant.md`.
- [ ] **AC-7.5** **EXTERNAL actions always require explicit user confirmation** (Approve/Cancel/Edit) with a "what will happen" summary.
- [ ] **AC-7.6** WRITE actions require confirmation for bulk/irreversible changes.
- [ ] **AC-7.7** The assistant can only invoke allowlisted tools; unknown tools are refused.
- [ ] **AC-7.8** The assistant never issues raw SQL or raw Meta API calls.
- [ ] **AC-7.9** Tenant + RBAC + Meta policy are re-validated at the service layer independent of the model.
- [ ] **AC-7.10** Every tool call is recorded in `ai_actions`/`ai_action_logs`.
- [ ] **AC-7.11** The model receives only minimal, workspace-scoped context (no cross-tenant data).
- [ ] **AC-7.12** Tool execution is bounded (max N calls + timeout).

## 8. Team & RBAC

- [ ] **AC-8.1** Owner/Admin can invite members; invitations are single-use and expiring.
- [ ] **AC-8.2** The four roles (Owner/Admin/Member/Agent) map to the correct permission keys per `22-auth-rbac.md`.
- [ ] **AC-8.3** Every API endpoint enforces its required permission key server-side; unauthorized requests return `403`.
- [ ] **AC-8.4** Roles are resolved server-side from the session, never trusted from the client.
- [ ] **AC-8.5** A request for a foreign resource ID returns `404` (not `403`, to hide existence).
- [ ] **AC-8.6** An `Agent` cannot send campaigns or manage automations/configurations.
- [ ] **AC-8.7** Owner cannot be removed by a non-owner; at least one owner persists.

## 9. Analytics

- [ ] **AC-9.1** Dashboard shows connected Pages, active workspaces, conversations, response time, leads, and messages (see `32-product-analytics.md`).
- [ ] **AC-9.2** Metrics are correct and match underlying data (aggregation verified).
- [ ] **AC-9.3** Per-Page and per-agent breakdowns are available.
- [ ] **AC-9.4** Campaign and automation performance metrics are available.
- [ ] **AC-9.5** Analytics access requires `analytics.read`; rollups are workspace-scoped (no cross-tenant).

## 10. Security

- [ ] **AC-10.1** Meta tokens (user/page) are stored encrypted at rest (envelope encryption) and never appear in responses, logs, or the frontend.
- [ ] **AC-10.2** Webhook `X-Hub-Signature-256` is verified before processing; invalid/foreign events are rejected.
- [ ] **AC-10.3** All SQL is parameterized; no string-interpolated SQL.
- [ ] **AC-10.4** User content (messages, names, template text) is rendered escaped/sanitized (no XSS).
- [ ] **AC-10.5** Auth endpoints are rate-limited; bruteforce is slowed; lockout after repeated failures.
- [ ] **AC-10.6** Expired/revoked tokens are rejected; reuse of a rotated refresh token revokes the session.
- [ ] **AC-10.7** Redis cache keys, queue names, and storage keys are tenant-namespaced.
- [ ] **AC-10.8** Audit logs are append-only and capture auth, member/role, Page, and all AI actions.
- [ ] **AC-10.9** No secrets or PII appear in logs (redaction verified) — see `27-observability.md`.
- [ ] **AC-10.10** Dependency scan reports no known-critical CVEs.

## 11. Cross-Cutting (apply to all modules)

- [ ] **AC-X.1** Every tenant-scoped table row carries `workspace_id`; every query filters by it.
- [ ] **AC-X.2** Automated negative tests prove zero cross-tenant reads/writes.
- [ ] **AC-X.3** All changes include unit + integration + API tests per `26-testing.md`.
- [ ] **AC-X.4** Relevant documentation (`11-database-architecture.md`, `12-api-architecture.md`, etc.) is updated.
- [ ] **AC-X.5** No policy bypass: the platform honors the 24-hour window, `messaging_type`, and message tags at all times.
