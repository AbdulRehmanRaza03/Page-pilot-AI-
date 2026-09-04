# 18 — Automation Engine (Trigger → Conditions → Actions)

> **Scope.** The visual, node-graph automation system: data model, execution semantics, delays, retry/idempotency, and the strict eligibility + opt-in rules governing any auto-send. AI action classification is referenced from `19-ai-assistant.md` and `20-ai-tools.md`; Meta send rules from `15-messaging-engine.md`.

---

## 1. Concept: A Typed Node Graph

An automation is a directed graph of typed nodes that flows **Trigger → Conditions → Actions → (delay/branch) → …**. It is built in a visual builder and stored as `automation_nodes`.

```
[Trigger: new conversation]
        │
        ▼
[Condition: intent == "buying"]
        │ yes
        ▼
[Action: classify lead (AI)]
        │
        ▼
[Action: assign label "hot-lead"]
        │
        ▼
[Action: generate response (AI)]
        │
        ▼
[Action: send permitted response]   ← opt-in + eligibility re-check
```

---

## 2. Data Model

Aligned with `11-database-architecture.md`:

- `automations` — `workspace_id`, `name`, `enabled`, `created_by`, timestamps.
- `automation_nodes` — `automation_id`, `type`, `config` JSONB, `next_node_ids` JSONB/array, `position`. One table stores all node types.
- `automation_executions` — `automation_id`, `workspace_id`, `conversation_id`, `trigger_event_id`, `status`, timestamps, `result` JSONB.
- `automation_execution_steps` — `execution_id`, `node_id`, `status`, `input`/`output` JSONB, `error`, `created_at`.

### Node types

| Type | Meaning | `config` examples |
| --- | --- | --- |
| `trigger` | Entry point; matched against a normalized event | event type (`inbound_message`, `postback`), filters |
| `condition` | Branch / predicate gate | field + operator + value (intent, score, label, window) |
| `action` | Mutating step | set `lead_status`, assign label, add note, generate response, **send** |
| `delay` | Time-based pause before continuing | duration ("wait 1 hour"), unit |
| `branch` | Multi-way split (or any/all) | ordered branches with their own conditions |
| `ai` (or classified action) | Invoke AI with a classified action scope (`READ`/`PREPARE`/`WRITE`/`EXTERNAL`) | intent detect, extract, classify lead, draft |

`trigger` and the top of the graph are `enabled`-gated; a disabled automation is never matched.

---

## 3. Variables & Templates

- Nodes can read **event context** (PSID, Page ID, message body, event type) and **contact/conversation context** (lead status, score, labels).
- Outputs of upstream nodes (AI intent, extracted fields, generated text) become **variables** referenced by downstream nodes via templating (e.g., `{{ ai.intent }}`, `{{ ai.response }}`).
- Message templates support variable interpolation with a fallback on missing values.

---

## 4. Test Mode

- An automation can run in **test mode** against a sandbox/historical event: it executes the graph but **suppresses all external effects** (no sends, no Meta API calls), recording the would-be outputs and a dry-run trace.
- Test mode is essential to validate branching and to confirm a `send` action *would* have been blocked by the eligibility gate.

---

## 5. Execution Semantics

1. **Match** — a normalized event is checked against all enabled automations' `trigger` nodes.
2. **Spawn execution** — create `automation_executions` (one per matching automation per event), status `running`.
3. **Traverse the graph** topologically; for each node create an `automation_execution_steps` row with `input` (upstream variables) and `output`.
4. **Conditions/branches** evaluate to choose the active `next_node_ids`; other branches are recorded as skipped.
5. **Actions** execute their side effects.
6. **Delay** nodes **pause execution** (see section 6).
7. On completion/failure, finalize `automation_executions.status` (`completed` / `failed`) with a `result`.

Executions are **deterministic given input**, but side effects (sends, AI calls) are the only non-idempotent parts and are guarded (sections 7–8).

---

## 6. Delays

- A `delay` node schedules the **remainder** of the execution to resume later via a scheduler (Celery beat + Redis-delayed task), with `scheduled_for`-style timing.
- Delays are stored so a worker restart does not lose the pending path.
- On resume, the graph continues from the node(s) after the delay; a resume re-loads the execution state from the `automation_execution_steps` history.

---

## 7. Retry & Idempotency

- **Transient step failure** (e.g., AI call timed out, DB hiccup) retries the step with bounded backoff before failing the execution.
- **Idempotency** is enforced per side effect:
  - Sends → guarded by `outbound_jobs` + unique message/meta IDs (`15-messaging-engine.md`).
  - CRM writes (label/status/note) → upsert semantics keyed on the step's dedup key so a re-run of a step does not double-apply.
  - Each `automation_execution_steps` records a stable `node_id` + execution id, so retries target the same logical step.
- A **completed step is not re-run** on execution resume/replay.

---

## 8. The Two Hard Rules for Auto-Send

1. **Any auto-send action re-checks Meta eligibility at execution time** (24h window and/or valid tag — exactly the gate in `15-messaging-engine.md`). The automation's "intended" send is *not* sufficient; the final send passes the same eligibility gate as every message. If ineligible, the step records `skipped/ineligible` with an honest reason and continues (or branches accordingly).

2. **Auto-send is opt-in per automation.** An automation only sends automatically if it has an explicitly enabled send action (and the Page/bot is configured for it). By default, automations generate **drafts** that a human reviews ("human-in-the-loop"), aligning with the **hybrid** bot classification in `13-meta-integration.md` (avoiding the strict 30s automated-bot responsiveness rule).

Both rules are non-negotiable and surfaced in the builder UI (an "auto-send" toggle + a required eligibility note).

---

## 9. AI Action Classification

Where a node invokes AI, the action is **classified** by scope (`20-ai-tools.md`, `19-ai-assistant.md`):

| Class | Meaning | Example in automation |
| --- | --- | --- |
| `READ` | Inspect-only (no side effects) | Detect intent, summarize conversation, filter |
| `PREPARE` | Produce a draft/plan for review | Generate a suggested response (human-in-the-loop) |
| `WRITE` | Mutate internal state (guarded) | Classify lead, assign label/status |
| `EXTERNAL` | Call an outside service | (requires explicit tool + confirmation; applied only via checked `WRITE`/send paths) |

Auto-send maps to an `EXTERNAL`-ish boundary but is strictly gated by the send engine and opt-in rule (section 8). `WRITE` side effects are idempotent and audited.

---

## 10. Execution History, Logs & Error Handling

- **History:** every execution and its steps are stored (`automation_executions`, `automation_execution_steps`) and viewable per automation with inputs/outputs and timing.
- **Logs:** structured step logs capture node type, outcome, latency, and errors (no personal message content at verbose levels).
- **Error handling:** a failed step transitions the execution to `failed` (or an error branch if defined); failures are surfaced in the builder/ops surfaces and are retryable from the execution history where safe.

---

## 11. Example Automations

1. **Lead triage:** `new conversation` → `detect intent` → (branch) if buying → `classify as qualified` → `add label "hot-lead"` → `generate response` → `send permitted response` (opt-in).
2. **Stale follow-up:** `delay 3 days after last reply` → condition `no reply` → `generate gentle follow-up` → send within window/tag if eligible.
3. **Support routing:** `inbound message` → AI classifies topic → `assign label` + notify agent (no auto-send).
