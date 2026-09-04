# 16 — Contacts & Leads CRM

> **Scope.** How PagePilot turns Messenger conversations into a lightweight, MVP-pragmatic CRM: contact identity, lead lifecycle, tags/labels, notes, scoring, interest attribution, search, and segmentation. Entity details align with `11-database-architecture.md`; AI classification aligns with `19-ai-assistant.md` and `20-ai-tools.md`.

---

## 1. Design Principle: One Contact, One Lead

At MVP, a **contact *is* a lead**. We store everything in a single `contacts` table and express "lead-ness" through dedicated fields (`lead_status`, `lead_score`, `product_interests`) rather than a separate `leads` table.

### Why a separate `leads` table is deferred

- A contact and a lead have **nearly identical identity** (same PSID, same Page, same profile) — a separate table adds a 1:1 join with no MVP value.
- Lead information is best modeled as **state on the contact** (status, score, interests), not a distinct entity, until lead objects diverge significantly (e.g., Lead-Ads records with a different source/lifecycle).
- Splitting later is straightforward: promote `lead_*` columns into a `leads` table keyed by `contact_id` when the model clearly diverges. This is documented, not a migration landmine.

The `contacts` table (from `11-database-architecture.md`):

| Field | Purpose |
| --- | --- |
| `workspace_id`, `page_id` | Tenant + source Page (UNIQUE `workspace_id, psid`) |
| `psid` | Page-scoped Messenger ID |
| `name`, `profile_url` | Contact metadata |
| `lead_status` | enum: `new` / `qualified` / `contacted` / `won` / `lost` |
| `lead_score` | integer rule-based score |
| `product_interests` | JSONB/array of product ids/tags |
| `last_interaction_at` | For recency, window, and stale-lead detection |

---

## 2. Contact Auto-Creation

- On the **first inbound message** from a new PSID, the webhook/messaging pipeline auto-creates a `contacts` row with `lead_status = new`, `lead_score = 0`.
- **Source Page** is recorded (`page_id`) so a PSID that messages multiple Pages in the same workspace is tracked per Page (guarding against cross-Page id collisions).
- No outbound send occurs simply because a contact was auto-created — sends are gated by the 24h window/tag rules (`15-messaging-engine.md`).

---

## 3. Lead Status Pipeline

```
new ──► qualified ──► contacted ──► won
          │                │
          └──► lost        └──► lost
```

| Status | Meaning |
| --- | --- |
| `new` | Auto-created from first touch; not yet reviewed |
| `qualified` | Shows buying intent / matches ICP (via AI + rules) |
| `contacted` | Actively engaged / replied / being pursued |
| `won` | Became a customer / goal met |
| `lost` | Unqualified / disengaged / opted out |

Transitions are driven by:
- **Manual** agent changes in the UI.
- **AI classification** (intent/engagement) that proposes or auto-applies a status.
- **Automation actions** (`18-automation-engine.md`) that set status when conditions match.

---

## 4. Tags & Custom Labels

- Tags and labels are free-form, workspace-scoped `labels` joined to contacts via `contact_labels` (and to conversations via `conversation_labels`).
- Used for: product interest, lifecycle signals (`returning`, `vip`, `priced-sent`), campaign membership, risk flags (`do-not-contact`), and team routing.
- Labels are the primary **operational** currency; `lead_status` is the coarse lifecycle, labels/score are the granular signal.

---

## 5. Notes

- `notes` are polymorphic (contact or conversation), append-only, authored by human agents or the AI (marked `automated`).
- Notes capture context ("asked about shipping", "price-sensitive") that scoring and automation can read.

---

## 6. Source Page & Conversation History

- Every contact records its **source Page** (`page_id`).
- **Conversation history** is derived from `conversations` → `messages` (full transcript, inbound/outbound, `sender_type` human/ai/automation).
- The CRM surface joins contact → conversations → messages to show full context and power AI summarization.

---

## 7. Last Interaction & Recency

- `last_interaction_at` is updated on any inbound message (and optionally outbound touch).
- Powers: recency scoring, stale-lead automation ("follow up if no reply in 3 days"), segmentation (`last 30 days`), and helps determine messaging-window state.

---

## 8. Lead Score (Rule-Based)

`lead_score` is an integer computed from deterministic signals stored on `contact_events` + message/engagement facts. Signals (each contributes points):

| Signal | Example weight |
| --- | --- |
| Asked about price/product | +25 (strong intent) |
| Replied engagement (reciprocated) | +15 |
| Returning customer / previous `won` | +20 |
| Intent detection (AI: "buying", "urgent") | +30 |
| Visited / clicked a CTA (postback) | +10 |
| Long inactivity (stale) | −10 |

Scoring is **rule-based and transparent** (not a black-box ML model) so agents can audit *why* a lead scored a given number. The AI can *propose* score deltas via intent classification, but the rules remain deterministic.

---

## 9. Product Interest Attribution

- When a message mentions a product, or a CTA/postback references a product, the AI maps it to a product id/tag and appends to `product_interests`.
- Enables: "show me leads interested in X", product-targeted (in-window) messaging, and segmentation.

---

## 10. Search & Filtering

MVP search uses PostgreSQL with `pg_trgm` (trigram) indexes (see `11-database-architecture.md`) over:

- Name, PSID.
- Message bodies (contact transcript).
- Labels/tags/notes.

Filters: `lead_status`, `lead_score` ranges, labels, source Page, product interest, recency, assigned agent. Saved filter combos are **segments** (section 11).

---

## 11. Segmentation (Saved Audiences)

- A **saved segment** (`campaign_audiences`) is a named, persisted filter (status + score + labels + product interest + recency).
- Segments are reusable: they power the inbox view, automation targeting, and campaign audience selection (`17-campaign-system.md`).
- Segments are evaluated **at use time** (dynamic), not frozen, so a campaign runs against current contact state (with send-time eligibility still enforced per recipient).

---

## 12. Automation + AI Lead Classification

How automation and AI contribute (referenced, detailed in `18-automation-engine.md` and `19-ai-assistant.md`):

- **Trigger:** new message / new conversation / postback.
- **Condition:** e.g., intent ∈ {buying}, score ≥ threshold, label present.
- **AI step:** classify intent, extract product interest, propose lead status/score.
- **Action:** set `lead_status`, assign label, add note, or (opt-in) send a permitted reply.

The AI **reads and writes** CRM state through classified actions (`READ`/`WRITE`; see `20-ai-tools.md`), with any outbound message re-checking Meta eligibility (`15-messaging-engine.md`).

---

## 13. MVP Scope Note

- Single `contacts` table, rule-based scoring, `pg_trgm` search, saved segments.
- No separate leads table (see section 1), no ML scoring, no opportunity/pipeline stage modeling, no dedup/merge across accounts (later).
