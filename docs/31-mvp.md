# 31 — MVP vs V1 vs Advanced/Future Scope

Clear separation of scope boundaries. The MVP is intentionally narrow: connect a Page, receive messages, store conversations, provide a unified inbox, manage contacts/leads, send permitted responses, run basic automation, use the AI assistant, and deploy — nothing more.

## 1. Guiding Principle for MVP

Ship the smallest end-to-end loop that delivers the core value proposition ("one workspace for every Facebook conversation, lead, and automation") **reliably and compliantly**. Everything that is not on the path from *connect → receive → respond → manage → deploy* is deferred. Build to the architecture's seams so deferred features are additive, not rewrites.

MVP priorities, in order:
1. **Reliability** of message receive/store/deliver (webhooks, idempotency, delivery tracking).
2. **Compliance** (24-hour window, `messaging_type`, message tags, no bypass).
3. **Unified inbox** usable by a non-technical user.
4. **Basic CRM/lead** capture.
5. **Permitted outbound** messaging (RESPONSE/UPDATE/TAGGED).
6. **Basic automation** (trigger → conditions → actions).
7. **AI assistant** (READ/PREPARE/WRITE/EXTERNAL with confirmation).
8. **Deploy** to production.

## 2. MVP (Ship This)

### Connect Pages
- Facebook OAuth (Facebook Login for Business) → exchange tokens → list + connect Pages.
- MVP permissions: `pages_show_list`, `pages_messaging`, `pages_manage_metadata`, `pages_read_engagement`.
- Encrypted Page-token storage; never exposed to client; token validity/status surfaced.

### Receive & store messages
- Webhook ingestion with `X-Hub-Signature-256` verification and idempotency.
- Normalize events → conversations/messages/contact auto-creation (PSID → contact).

### Unified inbox
- Aggregate conversations across connected Pages.
- Real-time updates (WebSocket via Redis pub/sub; polling fallback).
- Search + filters (Page, read/unread, assignee, status, label).
- Status lifecycle (Open/Pending/Resolved/Awaiting-reply), assignment.

### Contacts & leads (CRM)
- Auto-create contact per PSID.
- Lead pipeline (New/Qualified/Contacted/Won/Lost), lead score (rule-based), tags/labels, product-interest attribution.
- Conversation history per contact.

### Messaging
- One-to-one send (RESPONSE within window; UPDATE; TAGGED with a valid tag).
- Message templates (CRUD), attachment support where feasible.
- Delivery/read tracking (`message_deliveries`, `message_reads`), failure surfacing + retry.
- Strict window/type/tag enforcement.

### Basic automation
- Trigger → Conditions → Actions (label/assign/draft/send-permitted-reply/delay).
- Enable/disable, execution history/logs, test mode.
- Send actions gated by eligibility; ineligible recipients skipped (not sent).

### AI assistant
- Natural-language instruction → classify → controlled tools.
- READ (search/summarize/filter), PREPARE (draft), WRITE (label/status/assign), EXTERNAL (send/campaign/automation) with **EXTERNAL always confirmed**.
- Strict allowlist, tenant + RBAC + policy re-validation at the service layer.

### Deploy
- Production deploy per `28-deployment.md`; monitoring/alerting per `27-observability.md`.

## 3. V1 (Immediately After MVP)

These are high-value but beyond the initial launch; ship in the first post-MVP iterations.

- **Campaigns** (compliant audience messaging): campaign CRUD, audience segments, eligibility checks, queue/deliver, analytics. *(Architecture for `campaigns`/`campaign_recipients`/`outbound_jobs` already exists.)*
- **Analytics dashboard** (connected Pages, conversations, response time, leads, campaign/automation performance).
- **Team & RBAC polish** — full Owner/Admin/Member/Agent enforcement, invitations UX, row-level scoping for `Agent`.
- **Richer messaging** — attachments/quick replies/buttons, message templates with variables.
- **AI customer reply assist** — inline AI-suggested replies in the inbox; AI drafts grounded in conversation context.
- **Lead export** and basic segmentation enhancements.

## 4. Advanced / Deferred (Explicitly Out of MVP and V1)

| Capability | Why deferred | Where it lands |
| --- | --- | --- |
| Payments / billing / subscriptions | Architecture (`subscriptions`, `usage_records`) ready; not needed for MVP validation | later (see `35-future-roadmap.md`) |
| WhatsApp / Instagram DM channels | Non-Messenger; separate permissions/review | future (see `35`) |
| Marketing / Sponsored Messages | Requires ads eligibility + `marketing_messages_messenger` | future (see `35`) |
| One-time notifications / utility messages | Additional permissions | future |
| Cold outreach / mass broadcast to arbitrary PSIDs | Policy-restricted/prohibited; not MVP | non-goal (see `35`) |
| Multi-language UI localization | Architecture-ready; not MVP | future |
| Knowledge base with vector/RAG | Needs vector store + embeddings; not MVP (see `21-knowledge-base.md`) | future (see `35`) |
| Full marketing/CRM suites (custom fields, infinite pipelines) | Over-scope | future / evaluation |
| Native mobile app | Responsive web suffices for MVP (see `02-product-requirements.md`) | future |
| Public API / webhooks-out for integrators | Not MVP | future |
| Advanced permission customization (per-workspace role editing) | Seed fixed roles first (see `22-auth-rbac.md`) | future |

## 5. Non-Goals (Persistent)

- **No restriction bypassing** — never circumvent the 24-hour window, messaging-type rules, or message tags.
- **No direct DB/Meta access for the AI** — controlled tools only.
- **No microservices/Kubernetes/event bus/vector DB for MVP** (see `07-system-architecture.md`, `28-deployment.md`).
- **No cross-tenant access** — isolation is absolute.

## 6. MVP Exit Criteria (a "done" MVP)

A minimal, verified set that every MVP feature must satisfy (detailed per phase in `32-development-phases.md` and per module in `33-acceptance-criteria.md`):

- [ ] A new user can register, verify email, create a workspace, and connect a Page in under ~5 minutes, without docs.
- [ ] Inbound Messenger messages are received, stored, deduplicated, and appear in the inbox near-real-time.
- [ ] A reply sent within the 24-hour window is delivered and its delivery/read state is tracked.
- [ ] Attempts to send outside the window without a valid tag are blocked and surfaced honestly.
- [ ] Contacts are auto-created and can be labeled/scored/assigned a lead status.
- [ ] A basic automation can be built, enabled, and is observable in execution logs.
- [ ] The AI assistant can answer a READ question, draft (PREPARE) a reply, and — only with explicit confirmation — send (EXTERNAL) a permitted message.
- [ ] Tenant isolation verified: no cross-tenant reads/writes; foreign IDs return 404.
- [ ] Meta tokens never appear in the client, responses, or logs.
- [ ] Production deploy + monitoring + backups are live.

## 7. Build Order

Follow `32-development-phases.md` Phase 0 → Phase 19. The MVP corresponds roughly to Phases 0–18 (through deploy), with analytics/campaigns/team polish sliding into V1.

| Scope | Phases |
| --- | --- |
| MVP | 0–14 (core), 17 (security), 18 (deploy) |
| V1 | 11 (campaigns), 15 (analytics), 16 (team/RBAC polish) |
| Advanced/Future | deferred items from section 4 |
