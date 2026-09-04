# 20 — AI Tools (Controlled Surface)

## 1. Principle

The AI assistant may **only** call the tools defined here. Each tool is a thin, typed wrapper around an existing internal **service** (not a DB access). Tools enforce tenancy, RBAC, validation, and policy. The model's role is to *propose* arguments; the backend controls everything downstream.

### Invocation chain
```
AI model → tool call (name + args)
   → ToolRegistry.lookup(name)
   → Authorization (permission_level + RBAC key)
   → Validation (Pydantic schema)
   → Service call (scoped by workspace_id)
   → Result (structured) → back to model
```

## 2. Tool Catalog

### READ (no confirmation)

| Tool | Purpose | RBAC |
| --- | --- | --- |
| `search_contacts` | Find contacts by name/tag/status/score/product interest | `contacts.read` |
| `search_conversations` | Find conversations by keyword/status/assignee | `conversations.read` |
| `get_conversation` | Fetch one conversation + messages | `conversations.read` |
| `get_contact` | Fetch contact + history | `contacts.read` |
| `get_page` | Fetch connected Page meta | `pages.read` |
| `get_campaign` | Fetch a campaign | `campaigns.read` |
| `get_automation` | Fetch an automation | `automation.read` |
| `get_analytics` | Fetch dashboard metrics | `analytics.read` |
| `summarize_conversation` | LLM summary of a conversation | `conversations.read` |

### PREPARE (preview only)

| Tool | Purpose | RBAC |
| --- | --- | --- |
| `draft_message` | Compose a message ready to review/send | `messaging.compose` |
| `create_campaign` (draft) | Build a campaign object (not started) | `campaigns.create` |
| `create_automation` (draft) | Build an automation (not enabled) | `automation.create` |
| `create_audience` | Build/save a segment from filters | `contacts.read` |

### WRITE (apply changes; confirm for bulk)

| Tool | Purpose | RBAC | Confirmation |
| --- | --- | --- | --- |
| `add_label` | Apply a label to contact(s)/conversation(s) | `contacts.write` | bulk-only |
| `update_lead` | Change lead status/score | `contacts.write` | bulk/irreversible |
| `assign_conversation` | Assign a conversation to a member | `conversations.assign` | no (soft) |
| `add_note` | Add a note to a contact/conversation | `contacts.write` | no |

### EXTERNAL (always confirm)

| Tool | Purpose | RBAC | Confirmation |
| --- | --- | --- | --- |
| `send_message` | Send one message (RESPONSE within window or valid tag) | `messaging.send` | Always |
| `start_campaign` | Queue + begin campaign sends | `campaigns.send` | Always (recipient summary) |
| `enable_automation` | Activate an automation | `automation.manage` | Always |

## 3. Tool Schema Shape (per tool)

Each tool exposes a JSON schema (name, description, parameters) for the model, plus internal metadata:

```json
{
  "name": "send_message",
  "description": "Send a message to a contact. Requires a valid open 24h window or eligible tag.",
  "permission_level": "EXTERNAL",
  "required_permission": "messaging.send",
  "confirmation": "always",
  "parameters": {
    "conversation_id": "uuid",
    "text": "string",
    "messaging_type": "RESPONSE",
    "tag": null
  }
}
```

## 4. Anti-abuse & Policy Invariants

- `send_message` re-checks eligibility server-side: recipient must exist, have an open window (or valid eligible tag), and Page token valid. Any violation returns a structured refusal.
- No tool exposes raw PSID lists for arbitrary cold outreach; campaign targets must originate from an existing eligible audience.
- All tool calls produce `ai_actions` + `ai_action_logs` rows for audit.

## 5. Structuring & Observability

- **Structured outputs** for the final assistant answer: `{ summary, actions_taken[], failures[], needs_followup }`.
- **Tool calling** via the LLM provider's function-calling (or JSON mode) — see `08-tech-stack.md`.
- Every tool call traced (trace ID) for debugging and AI observability.
