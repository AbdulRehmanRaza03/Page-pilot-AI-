# 35 — Future Roadmap, Open Questions & Non-Goals

Post-MVP direction for PagePilot: future features, explicit non-goals, and open questions to resolve before committing to each extension. This is a living document; review and reprioritize against `32-product-analytics.md` and `34-risks.md`.

## 1. Future Features

### 1.1 Additional Channels

| Feature | Description | Notes / dependencies |
| --- | --- | --- |
| **WhatsApp Business messaging** | Ingest/send WhatsApp messages, unified with Messenger in one inbox | Requires WhatsApp Cloud API, separate app review + phone-number setup; new permissions |
| **Instagram Direct (Messenger)** | IG DMs via the Messenger platform | Requires IG-linked Pages + `instagram_manage_messages`-style permissions (see `13-meta-integration.md`) |
| **Multi-channel inbox abstraction** | Generalize conversation/message model so channels are pluggable | Depends on the channel-agnostic inbox groundwork (phase 8) |

### 1.2 Marketing & Sponsored Messages

| Feature | Description | Notes |
| --- | --- | --- |
| **Marketing Messages** | Send promotional content to opt-in recipients | Requires `marketing_messages_messenger` + ads eligibility; strict opt-in rules |
| **Sponsored Messages** | Paid reach to existing contacts | Ads-policy dependent; not part of standard messaging |
| **One-time notifications / utility messages** | Request opt-in and send follow-ups | Additional permissions (`pages_utility_messaging`); review required |

### 1.3 Billing & Monetization

| Feature | Description | Notes |
| --- | --- | --- |
| **Subscriptions / plans** | Tiered pricing (per workspace, per Page, or per seat) via Stripe | `subscriptions`/`usage_records` tables already modeled in `11-database-architecture.md` |
| **Usage metering** | Track messages/AI actions/automations for billing + limits | Depends on `usage_records` + analytics |
| **Free/trial + limits** | Trial handling and soft limits to convert | Aligns with infrastructure-cost control (`34-risks.md` #13) |

### 1.4 Knowledge Base with Vector / RAG

| Feature | Description | Notes |
| --- | --- | --- |
| **Business knowledge base** | Store FAQs/product info/knowledge entries | `knowledge_bases`/`knowledge_entries` modeled; `21-knowledge-base.md` |
| **Vector embeddings + RAG** | Retrieve-relevant-context to ground AI replies in KB | Requires a vector store (`pgvector` or external) — deferred from MVP by design |
| **Grounded customer replies** | AI replies cite KB + conversation context | Builds on Phase 14 (AI customer response) + RAG |

### 1.5 Advanced AI

| Feature | Description | Notes |
| --- | --- | --- |
| **Autonomous (supervised) assistants** | Longer multi-step workflows with richer confirmation UX | Extends `19-ai-assistant.md` classification model |
| **Multi-turn refined plans** | Iterative plan-execute with user course-correction | More complex orchestrator; bounded loops already modeled |
| **AI analytics insight** | Natural-language questions over analytics ("which campaigns drove leads?") | `get_analytics` tool + text-to-metric mapping |
| **Sentiment / intent enrichment** | Auto-tag conversations by intent/sentiment | Useful for automations + lead scoring |

### 1.6 Platform Maturity

| Feature | Description |
| --- | --- |
| **Public API + webhooks out** | Programmatic access for integrators |
| **Real-time presence** | Team presence + typing indicators in the inbox |
| **Advanced search engine** | Replace `pg_trgm` with dedicated search at volume |
| **Custom roles** | Per-workspace role/permission editing (beyond the seeded four roles) |
| **Data export / residency** | Advanced export, retention, and data-residency options |

## 2. Non-Goals (Explicit)

These are **out of scope** by design, at least for the foreseeable future. Revisit only with strong user demand and a clear business case.

- **Cold outreach / mass broadcast to arbitrary PSIDs** — prohibited by Meta policy; PagePilot will not build spam engines (see `13-meta-integration.md`).
- **Restriction bypassing** — never circumvent the 24-hour window, messaging-type rules, or message tags.
- **Microservices / Kubernetes / event bus / vector DB for MVP** — modular monolith suffices (see `07-system-architecture.md`, `28-deployment.md`).
- **A separate mobile app** — responsive web is the MVP (and likely long-term) target.
- **Native email/SMS/other non-Meta channels** — PagePilot is Facebook-first; other channels only via the Messenger/WhatsApp/IG family.
- **Building a general-purpose (unrestricted) AI agent** — the assistant is a bounded business-automation assistant with a controlled tool surface, not an open agent.
- **Reselling Meta Ads or ad management** — out of scope; PagePilot is communication/lead/automation, not an ads tool.
- **Full marketing-automation suite** (custom objects, infinite pipelines, email journeys) — remain focused on Messenger-led conversation/lead workflows.

## 3. Open Questions

1. **Message-tag evolution** — which Message Tags remain available (e.g., the April 2026 changes flagged in `13-meta-integration.md`)? Re-verify the supported list before each release.
2. **`read_insights` for MVP analytics** — can `pages_read_engagement` alone cover analytics, or is `read_insights` required? (Start without it to reduce review surface.)
3. **WhatsApp vs Instagram priority** — which second channel has the most urgent demand from target customers? Determines next channel investment.
4. **RAG vector store choice** — `pgvector` (stay on Postgres) vs. a managed vector index? Decision deferred until KB is in scope.
5. **Billing model** — per-workspace vs. per-seat vs. per-Page (or hybrid)? Pricing model must be decided before Billing features.
6. **AI cost guardrail** — acceptable per-workspace LLM cost ceiling and how to enforce (model tier, caching, limits)? Ties to `34-risks.md` #13.
7. **Retention/erasure policy** — concrete retention windows and GDPR erasure mechanics across conversations, CRM, and AI logs?
8. **Bot classification posture** — remain "hybrid" (human-assisted) or pursue "automated" classification (with its stricter 30s-responsiveness rule) for specific use cases?
9. **Supported regions/data residency** — whether AI provider hosting and data residency constraints must be surfaced per customer.
10. **Externally-facing public API** — is there real integrator demand, or is the dashboard the only interface for the medium term?
