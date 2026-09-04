# 21 — Knowledge Base

This document specifies the **optional business knowledge base (KB)** that lets PagePilot's AI answer customers accurately — using the business's own facts (products, FAQs, pricing, shipping, return policy, hours, services) rather than hallucinating.

Companion documents: `08-tech-stack.md` (AI stack), `12-api-architecture.md` (API endpoints), `09-frontend-architecture.md` (KB management UI).

---

## 1. What the Knowledge Base is

A **tenant-scoped store of structured business facts** that the AI assistant may retrieve when drafting replies. It is the grounding source that makes AI answers trustworthy and attributable.

Example entry types:

- **Products / services** — name, description, price, variants, availability.
- **FAQs** — question/answer pairs.
- **Policies** — shipping, returns, refunds, privacy.
- **Business info** — hours, location, contact methods.
- **Pricing** — plans, discounts, terms.

Each entry belongs to a `knowledge_base` (per workspace), is authored/curated by workspace users, and is retrieved at AI response time.

---

## 2. Data Model

Two core tables:

### `knowledge_bases`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `workspace_id` | uuid FK | Tenant scope |
| `name` | text | Display name |
| `enabled` | boolean | Master switch for AI usage |
| `created_at` / `updated_at` | timestamptz | |

### `knowledge_entries`

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | uuid | PK |
| `knowledge_base_id` | uuid FK | |
| `type` | enum | `product`, `faq`, `policy`, `pricing`, `business_info`, `service` |
| `title` | text | Short label |
| `content` | text | The authoritative text |
| `keywords` | text[] | Curated tags for structured lookup |
| `structured` | jsonb | Optional typed fields (e.g. `price`, `sku`, `shipping_days`) |
| `status` | enum | `draft` → `published` → `archived` |
| `created_by` | uuid FK | Author |
| `created_at` / `updated_at` | timestamptz | |

**Design intent:** `title` + `keywords` + `structured` are the **lookup** layer; `content` is the **grounding text** the AI cites.

---

## 3. Entry Creation & Curation

- Users create entries via the KB management UI (`09-frontend-architecture.md`, `/w/[workspaceId]/knowledge-base`).
- Entries start as `draft` and must be `published` to be used by the AI.
- **Curated keywords** are optional but recommended: they directly improve retrieval without any ML.
- Authors can attach `structured` data for entries like pricing (so the AI can reason over numbers rather than parse prose).
- Workspace admins can `disable` the whole KB to make the AI assistant answer without business facts.

**Permissions:** KB management is gated by `ai.manage` (see `12-api-architecture.md`).

---

## 4. How the AI Retrieves Entries (at response time)

At reply time the assistant (see `ai` module) runs this pipeline:

1. The user's message is classified (intent, e.g. "shipping question", "pricing question").
2. The assistant issues a `READ` action to the KB tool to fetch relevant entries.
3. Only the **matched entries** are injected into the model context as grounding, alongside the conversation.
4. The model drafts an answer citing the grounded entries.

**Retrieval strategy (MVP):** keyword/structured lookup.

- Match `keywords` + `title` against the user's message (token overlap, synonym table).
- Use `type` to route intents (pricing → `pricing`/`product` entries; returns → `policy` entries).
- Prioritize `structured` fields for factual, non-prose answers (e.g. price).

---

## 5. Is RAG / Vector Search Necessary? (Honest answer)

**Not at MVP, and probably not for a while. Here is the reasoning:**

- Businesses in our MVP typically have **tens to hundreds** of entries. Keyword/structured lookup is fast, deterministic, debuggable, and cheap.
- Vector search shines at scale and with fuzzy semantic queries — problems that don't exist at this volume.
- RAG adds real costs: embeddings, a vector store, an eval harness, and new failure modes (irrelevant retrieval, drift, hallucinated-but-plausible context).

**Recommendation — defer:**

1. **Stage 1 (MVP):** keyword/structured lookup only. No embeddings, no vector DB.
2. **Stage 2 (volume/queries justify):** add `pgvector` (a Postgres extension — no new service) and embeddings for **dense retrieval**, kept **behind the existing retrieval interface** so callers don't change.
3. **Stage 3 (only if needed):** hybrid (keyword + vector) retrieval and formal RAG eval.

**Trigger to move to Stage 2:** entry counts grow into the thousands, or admins report the AI frequently "not finding" relevant entries.

This judgment is deliberately conservative and mirrors the guidance in `08-tech-stack.md`: no vector DB for MVP.

---

## 6. Grounding & Citation Requirements

Because the business depends on AI answers being *correct*, we impose **grounding rules**:

- The AI may answer **only from** retrieved KB entries (and the conversation) — not from its parametric memory for business facts.
- Every factual claim the AI makes that originates from the KB **must cite its source entry** (e.g. "Per our return policy: ...").
- If no relevant entry is found, the AI **must not invent** a policy — it responds with a neutral fallback and flags a human agent (or asks the business to add the entry).
- Drafts citing KB content are visually tagged as "grounded" in the UI so agents can trust (or override) them.

---

## 7. How Automations Use the KB

The automation engine (see `12-api-architecture.md`, `automations`) can answer common intents with the KB:

- **Intent → Entry mapping:** an automation rule can watch for a detected intent (e.g. "shipping ETA") and, when matched, fetch the corresponding KB entry and auto-reply using a templated message that embeds the ground-truth content.
- **Answer confidence:** automations only auto-respond when a **high-confidence, single** entry matches; otherwise they escalate to a human or invoke the AI assistant's `PREPARE` (draft) mode.
- **KB as template source:** pricing/FAQ answers stay consistent because they originate from the KB rather than hardcoded automation messages.

---

## 8. Tradeoffs (summary)

| Approach | Pros | Cons | Verdict |
| -------- | ---- | ---- | ------- |
| Keyword/structured lookup | Simple, deterministic, debuggable, free | Misses fuzzy/semantic matches | **Stage 1 (MVP)** |
| `pgvector` + embeddings | Semantic recall at scale, stays in Postgres | Cost, embedding drift, eval burden | **Stage 2 (later)** |
| Dedicated vector DB (Pinecone/Weaviate/Qdrant) | Max recall at huge scale | New infra, ops, cost | **Avoid unless volume truly demands** |

The deliberate bias: **ship the grounded, deterministic KB first; add retrieval sophistication only when measured outcomes justify it.**
