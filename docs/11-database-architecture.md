# 11 — Database Architecture (PostgreSQL)

## 1. Choice & Rationale

**PostgreSQL 16** — single source of truth. Reasons: relational integrity (tenancy), JSONB for flexible payloads (message/event bodies, automation configs, AI tool params), full-text search (pg_trgm for contact/message search at MVP scale), row-level features, and broad ecosystem. A dedicated search engine (pgvector/Elasticsearch) is **not** required for MVP (see `21-knowledge-base.md`).

## 2. Conventions

- Primary keys: `BIGINT GENERATED ALWAYS AS IDENTITY` (or UUID for externally-facing IDs). We use **UUID (v7)** for entity IDs exposed via API (non-enumerable), and internal BIGINT identity for joins where beneficial. Simplicity: use `UUID` PKs throughout MVP; revisit if perf demands.
- Every tenant-scoped table has `workspace_id` (FK, NOT NULL) and a composite/covering index.
- Timestamps: `created_at`, `updated_at` (UTC, `timestamptz`).
- **Soft delete** via `deleted_at` (nullable `timestamptz`) on user-facing content tables; hard delete reserved for GDPR erase flows (documented).
- **Audit** via a dedicated `audit_logs` table (append-only) for all mutations (who, what, before/after, actor).
- Migrations via **Alembic**, ordered and reversible.

## 3. Entity Listing (analyzed & improved)

The prompt's initial list is refined below. Additions/removals justified inline.

### Core identity & tenancy
- `users`
- `workspaces`
- `workspace_members`
- `roles`
- `permissions`
- `role_permissions`
- `invitations` (added — pending member invites)
- `sessions` (added — refresh tokens/session tracking)

### Facebook / Meta
- `facebook_accounts` (the OAuth identity + long-lived token)
- `facebook_pages` (connected Page + encrypted Page token + status)
- `page_tokens` (token history/rotation + expiry — separated for lifecycle audit)

### Communication & CRM
- `contacts` (merge of "contact" + "lead" — a contact *is* a lead at MVP; see note)
- `contact_events` (added — source of truth for interest/score signals)
- `conversations`
- `messages`
- `message_events` (delivery/read/echo/error states)
- `labels`
- `contact_labels`
- `conversation_labels`
- `notes` (contact + conversation notes, polymorphic)

### Campaigns & automation
- `campaigns`
- `campaign_audiences` (saved segments)
- `campaign_recipients`
- `automations`
- `automation_nodes` (triggers/conditions/actions as nodes — replaces separate trigger/condition/action tables; see note)
- `automation_executions`
- `automation_execution_steps`

### AI
- `ai_sessions`
- `ai_messages`
- `ai_actions` (planned/in-progress tool calls)
- `ai_action_logs` (execution results)

### Platform & operations
- `webhook_events` (raw + normalized Meta webhooks; idempotency)
- `outbound_jobs` (added — queue intent for sends/campaign items; worker lease)
- `notifications`
- `audit_logs`
- `subscriptions`
- `usage_records`
- `knowledge_bases` + `knowledge_entries` (added — optional KB; see `21`)

### Design notes on the prompt's list
- **`roles` & `permissions`** are kept as data (RBAC tables) rather than hard-coded, to allow per-workspace role customization later. MVP seeds a fixed set.
- **Contacts vs Leads:** At MVP a single `contacts` table with a `lead_status`, `lead_score`, and `is_lead` (or status ∈ {lead stages}) is simpler and sufficient. A separate `leads` table adds join complexity without MVP value. Documented so it can be split later if lead objects diverge.
- **Automation graph:** Rather than `automation_triggers` / `conditions` / `actions` as three tables, a single `automation_nodes` table stores a typed graph (node `type`, `config` JSONB, `next_node_ids`). This supports arbitrary branching/delays with one model. Trigger node references the event type; condition/action nodes hold typed config. Kept flexible and simple.
- **`message_events`** stores lifecycle deltas (sent/delivered/read/failed/error) keyed by Meta event/message IDs for idempotent state updates.
- **`outbound_jobs`** decouples "we intend to send" from "Meta accepted/rejected", enabling retry + observability + campaign fan-out without blocking.

## 4. Key Relationships (textual ERD)

```
users 1─n workspace_members n─1 workspaces
users 1─n sessions
users 1─n facebook_accounts          (a user may re-auth; accounts revocable)
workspace_members n─1 roles
roles n─n permissions                (via role_permissions)
workspaces 1─n invitations

facebook_accounts 1─n facebook_pages (pages authorized by that account)
facebook_pages 1─n page_tokens
workspaces 1─n facebook_pages         (connected pages belong to a workspace)

workspaces 1─n contacts
workspaces 1─n conversations
conversations n─1 facebook_pages
conversations n─1 contacts            (the customer)
conversations 1─n messages
messages 1─n message_events
contacts 1─n contact_events
labels n─n contacts                   (contact_labels)
labels n─n conversations              (conversation_labels)
contacts 1─n notes; conversations 1─n notes

workspaces 1─n campaigns
campaigns 1─n campaign_recipients n─1 contacts
campaign_audiences (saved segments) 1─n campaigns (optional)

workspaces 1─n automations
automations 1─n automation_nodes
automations 1─n automation_executions 1─n automation_execution_steps

workspaces 1─n ai_sessions 1─n ai_messages
ai_sessions 1─n ai_actions 1─n ai_action_logs

workspaces 1─n webhook_events
workspaces 1─n outbound_jobs
workspaces 1─n knowledge_bases 1─n knowledge_entries
workspaces 1─n subscriptions 1─n usage_records
```

## 5. Column Specification (core tables)

### users
| col | type | notes |
| --- | --- | --- |
| id | uuid PK | |
| email | text UNIQUE NOT NULL | lowercased |
| password_hash | text NOT NULL | argon2 |
| full_name | text | |
| email_verified_at | timestamptz NULL | |
| created_at, updated_at, deleted_at | timestamptz | |

### workspaces
`id`, `name`, `slug` (unique), `owner_id` → users, `created_at`, `updated_at`, `deleted_at`.

### workspace_members
`id`, `workspace_id` FK, `user_id` FK, `role_id` FK, `created_at`. UNIQUE(`workspace_id`,`user_id`).

### roles / permissions / role_permissions
`roles(id, workspace_id NULL for system roles, name, created_at)`, `permissions(id, key UNIQUE (e.g. "conversations.assign"))`, `role_permissions(role_id, permission_id)`.

### facebook_accounts
`id`, `user_id` FK, `facebook_user_id`, `long_lived_token_enc` (encrypted), `token_expires_at`, `created_at`, `revoked_at`.

### facebook_pages
`id`, `workspace_id` FK, `facebook_account_id` FK, `page_id` (Meta ID) UNIQUE, `name`, `category`, `picture_url`, `status` (connected/reconnecting/error), `tasks` JSONB, `created_at`, `updated_at`, `disconnected_at`. UNIQUE(`workspace_id`,`page_id`).

### page_tokens
`id`, `facebook_page_id` FK, `token_enc`, `expires_at`, `scopes` JSONB, `created_at`, `invalidated_at`.

### contacts
`id`, `workspace_id` FK, `page_id` FK (source Page), `psid`, `name`, `profile_url`, `lead_status` enum, `lead_score` int default 0, `product_interests` JSONB/array, `last_interaction_at`, `created_at`, `updated_at`, `deleted_at`. UNIQUE(`workspace_id`,`psid`).

### conversations
`id`, `workspace_id` FK, `page_id` FK, `contact_id` FK, `status` enum (open/pending/resolved/awaiting_reply), `assigned_to` → users NULL, `subject`, `last_message_at`, `unread_count`, `created_at`, `updated_at`, `deleted_at`.

### messages
`id`, `conversation_id` FK, `workspace_id` FK (denormalized for isolation + fast queries), `direction` (inbound/outbound), `sender_type` (human/ai/automation), `type` (text/attachment/etc.), `body` text, `meta_message_id` UNIQUE, `attachments` JSONB, `created_at`, `deleted_at`.

### message_events
`id`, `message_id` FK, `event_type` (sent/delivered/read/failed), `meta_event_id`, `error_code`, `error_message`, `occurred_at`. UNIQUE(`message_id`,`event_type`,`meta_event_id`).

### webhook_events
`id`, `workspace_id` FK, `page_id` FK, `object`, `event_type`, `meta_event_id` UNIQUE, `payload` JSONB, `signature_valid` bool, `processed_at`, `error`, `created_at`. (Idempotency key: `meta_event_id`.)

### outbound_jobs
`id`, `workspace_id` FK, `job_type` (direct_send/campaign_item), `message_id` FK NULL, `campaign_recipient_id` FK NULL, `recipient_psid`, `messaging_type`, `tag`, `payload` JSONB, `status` (queued/sending/sent/failed/permanent_fail), `attempts` int, `scheduled_for`, `locked_at`, `created_at`, `error`.

### campaigns / campaign_recipients
`campaigns(id, workspace_id, name, status, message_template, schedule_at, created_by, created_at)`
`campaign_recipients(id, campaign_id, contact_id, status(pending/queued/sent/failed/skipped), eligibility(JSONB), sent_at, error)`.

### automations / automation_nodes / executions
`automations(id, workspace_id, name, enabled, created_by, created_at)`
`automation_nodes(id, automation_id, type(trigger/condition/action/delay/branch), config JSONB, next_node_ids JSONB/array, position)`
`automation_executions(id, automation_id, workspace_id, conversation_id, trigger_event_id, status, started_at, finished_at, result JSONB)`
`automation_execution_steps(id, execution_id, node_id, status, input JSONB, output JSONB, error, created_at)`.

### ai_*
`ai_sessions(id, workspace_id, user_id, title, created_at)`
`ai_messages(id, session_id, role, content, tool_calls JSONB, created_at)`
`ai_actions(id, session_id, tool_name, args JSONB, permission_level, needs_confirmation bool, status, created_at)`
`ai_action_logs(id, ai_action_id, result JSONB, error, executed_at)`.

### audit_logs
`id`, `workspace_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `before` JSONB, `after` JSONB, `ip`, `created_at`. Append-only.

### subscriptions / usage_records
`subscriptions(id, workspace_id, plan, status, current_period_start/end, stripe_customer_id, created_at)`
`usage_records(id, workspace_id, metric, value, period, recorded_at)` (architecture-ready; not billed in MVP).

### knowledge_bases / knowledge_entries
`knowledge_bases(id, workspace_id, name, created_at)`
`knowledge_entries(id, knowledge_base_id, workspace_id, title, content, source, embedding vector NULL (future), created_at)`.

## 6. Indexes (key)

- All FKs indexed.
- `workspace_id` composite indexes on every tenant table's hot columns, e.g. `conversations(workspace_id, status, last_message_at DESC)`, `contacts(workspace_id, lead_status)`, `messages(conversation_id, created_at)`.
- `messages(workspace_id, created_at)` for inbox aggregation.
- `webhook_events(workspace_id, meta_event_id)` unique for idempotency.
- `contacts(workspace_id, psid)` unique.
- `messages(workspace_id)` where full-text search: GIN trigram index (`pg_trgm`) on `body` for MVP search; upgrade to a search engine only if volume demands.

## 7. Constraints & Data Integrity

- `UNIQUE` where noted; `CHECK` on enums; `NOT NULL` on tenant FKs; `ON DELETE` rules documented (mostly `RESTRICT` for parent, `CASCADE` for child denormalized rows with explicit re-derivation and audit).
- Soft delete via `deleted_at` + filtered unique indexes where uniqueness must survive soft-delete (e.g., contacts per psid) using `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`.

## 8. Audit, Retention & Migration

- **Audit:** `audit_logs` captures every mutation (actor, action, entity, before/after, IP).
- **Retention:** configure per policy — e.g., keep message bodies per user settings; retain webhook payloads N days (then archive); hard-erase on subject data request.
- **Migration strategy:** Alembic ordered migrations; backward-compatible additive migrations preferred; feature flags for destructive changes; rollback drill in staging before prod.
