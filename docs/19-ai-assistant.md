# 19 — AI Assistant Architecture

## 1. What the Assistant Is (and Isn't)

The AI assistant is a **business automation assistant**, not a coding agent, and not an unrestricted "do anything" agent. It:

- Understands a natural-language instruction in the context of one **Workspace**.
- Inspects connected business data (Pages, contacts, conversations, leads, campaigns).
- Determines what is **permitted** for the current user/role.
- Executes the workflow through a **bounded, allowlisted set of tools** (see `20-ai-tools.md`).
- Requests **confirmation** for consequential/external actions.
- Explains what it did and reports failures.

It **never**:
- Issues raw SQL or manipulates the database directly.
- Makes raw Meta API calls directly.
- Bypasses Meta messaging policies, the 24-hour window, or message tags.
- Acts outside the current user's RBAC permissions.
- Performs an external action without the required confirmation.

## 2. Execution Loop

```
User instruction
   → INTENT (classify request, extract entities)
   → PLAN   (choose one or more controlled tools, fill arguments)
   → PERMISSION (classify each action: READ / PREPARE / WRITE / EXTERNAL)
   → VALIDATION (tenant scope, RBAC, policy eligibility, input schema)
   → [CONFIRMATION] (for EXTERNAL and optionally WRITE actions)
   → EXECUTION (invoke tool → service → DB / Meta / queue)
   → RESULT (structured output)
   → EXPLANATION (plain-language summary of what happened / what failed)
```

## 3. Action Classification & Confirmation Rules

| Class | Examples | Confirmation required? | Notes |
| --- | --- | --- | --- |
| **READ** | search leads, search messages, summarize conversation, view analytics, get contact/page/campaign | No | Always scoped to workspace + user RBAC |
| **PREPARE** | prepare campaign, draft message, build automation, create audience/segment | Show **preview**; no external effect | User reviews before any send/start |
| **WRITE** | add label, update lead status, assign conversation, add note | Confirmation for bulk/irreversible; single-item soft writes may auto-apply with toast + undo | Reversible in most cases |
| **EXTERNAL** | send message, start campaign, enable automation | **Always require explicit confirmation** | Irreversible/outward effect; summary of recipients shown first |

### Confirmation UX requirements
- Show a concise **"what will happen"** summary (recipient count, affected entities, target Page, message preview, timeframe).
- For sends: show messaging-type/window eligibility; if any recipient is ineligible, exclude or flag them (never silently send anyway).
- Provide **Approve / Cancel** (and "Edit" where applicable).
- Confirmation is audited (`ai_action_logs`).

## 4. Capabilities (mapped examples)

| User says | Intent → Tool(s) | Class |
| --- | --- | --- |
| "Open ABC Clothing and find customers who asked about tracksuits but haven't purchased" | page resolve → search_conversations/contacts → filter by product interest + lead status | READ |
| "Show me today's hot leads" | search_contacts (score/status window) | READ |
| "Summarize my unread conversations" | get_conversation + summarize | READ |
| "Which leads haven't received a reply?" | search + filter by last reply | READ |
| "Create a follow-up workflow for these leads" | create_automation (draft) | PREPARE |
| "Reply to this customer professionally" | draft_message | PREPARE |
| "Prepare a campaign for these eligible contacts" | create_campaign (draft) + eligibility check | PREPARE |
| "Send the new collection message to all eligible leads from this campaign" | start_campaign / queue sends | EXTERNAL (confirm) |

## 5. Permission Model on Tools

Every tool declares:
- `permission_level` (READ/PREPARE/WRITE/EXTERNAL).
- `required_permission` (RBAC key, e.g. `campaigns.send`, `conversations.assign`).
- `confirmation` policy (always / bulk-only / never).

At execution time, the orchestrator checks **both** the assistant's declared classification **and** the user's RBAC privileges, and **and** Meta policy/eligibility for any external send. Any mismatch → tool refused, reason returned to the model + user.

## 6. Guardrails Against Hallucination & Overreach

1. **Tool-only execution** — the model proposes tool calls; only allowed tools run.
2. **Strict schemas** — tool inputs are Pydantic-validated; malformed → error returned to model to retry with a bounded retry count.
3. **Tenant + RBAC enforcement at the service layer** (not trusted from the model).
4. **Policy enforcement at the send service** (window/tag checks) regardless of what the model asks.
5. **Bounded loops** — max N tool calls per instruction; timeout per turn.
6. **Structured outputs** — final answer uses a schema (summary + actions taken + failures).
7. **Confidence/grounding** — replies that summarize data cite the retrieved sources (contact/conversation IDs) so answers are checkable.
8. **Observability** — every tool call logged with args/results (`ai_action_logs`).

## 7. Context Selection (Do Not Over-Send) — see `20` & `22`

Only send to the model: current workspace metadata, user role/permissions, the active conversation/contact (when relevant), the tool schemas, and the retrieved results. Use **retrieval/context selection** — never dump the whole DB or all conversations into the prompt.

## 8. Failure Reporting

- Tool runtime error → surfaced with a human-readable explanation + suggested next step.
- Meta API error (e.g., window closed, token expired) → mapped to a friendly message (see `34`).
- Confirmation declined → assistant reports "cancelled, nothing sent."
