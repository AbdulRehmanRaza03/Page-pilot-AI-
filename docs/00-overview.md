# 00 — Overview, Executive Summary & Navigation

## 1. Executive Summary

**PagePilot** is a multi-tenant SaaS platform that lets businesses connect multiple Facebook Pages and manage all of their Messenger communication, customers, leads, follow-ups, campaigns, automations, and analytics from one dashboard. Its defining differentiator is a **natural-language AI assistant** that understands business instructions, inspects connected data, determines what is permitted, and executes workflows — always through controlled tools and with explicit confirmation for consequential actions.

The product is inspired by the *category* defined by tools like PageInteract (centralized Facebook Page management and automation), but it is an **original product**: its own architecture, UI/UX, branding, workflows, and — critically — a much stronger AI-assistant and safety model.

### Core Value Proposition

**"One workspace for every Facebook conversation, lead, and automation — controlled in plain English."**

Businesses stop switching between inboxes, stop copying/pasting replies, stop losing leads in chat history, and start running their customer communication like a proper pipeline. The AI assistant makes the platform usable by non-technical business owners while remaining powerful for advanced operators.

### Why This Exists

Messenger is where customers *actually* reach SMBs, but the native Facebook experience does not scale across Pages, teams, campaigns, or automation. Existing tools are either (a) single-Page chat tools, (b) purely message-broadcasting spam engines, or (c) complex marketing suites. PagePilot sits deliberately in the gap: a **communication + lead + automation** platform that respects Meta policies (24-hour window, messaging types, message tags, app review) while dramatically reducing manual work.

## 2. Document Navigation

| File | Contents |
| --- | --- |
| `01-problem-solution.md` | Real-world problems, impact, workaround, limitation, solution |
| `02-product-requirements.md` | Full PRD (functional + non-functional) |
| `03-personas-use-cases.md` | Target user personas |
| `04-feature-specification.md` | Feature map & product modules |
| `05-user-flows.md` | End-to-end user flows |
| `06-ui-ux-specification.md` | Screen-by-screen UX/UI spec |
| `07-system-architecture.md` | High-level system design |
| `08-tech-stack.md` | Technology choices + rationale |
| `09-frontend-architecture.md` | Frontend structure & components |
| `10-backend-architecture.md` | Modular monolith design & folders |
| `11-database-architecture.md` | PostgreSQL schema, ERD, indexes, migrations |
| `12-api-architecture.md` | REST API endpoints, auth, pagination |
| `13-meta-integration.md` | **Meta APIs, permissions, tokens, policies (authoritative)** |
| `14-webhook-architecture.md` | Webhook ingestion, validation, idempotency |
| `15-messaging-engine.md` | Message processing pipeline, delivery, retries |
| `16-lead-crm.md` | Contacts, leads, segmentation, scoring |
| `17-campaign-system.md` | Compliant campaign design |
| `18-automation-engine.md` | Trigger → Conditions → Actions engine |
| `19-ai-assistant.md` | AI assistant architecture + safety model |
| `20-ai-tools.md` | Controlled AI tool definitions |
| `21-knowledge-base.md` | Business knowledge & optional RAG |
| `22-auth-rbac.md` | Authentication & role-based access control |
| `23-security.md` | Production security design |
| `24-real-time.md` | Real-time inbox architecture |
| `25-background-jobs.md` | Async processing design |
| `26-testing.md` | Testing strategy |
| `27-observability.md` | Logging, metrics, alerting |
| `28-deployment.md` | Infrastructure & deployment |
| `29-environments.md` | LOCAL/DEV/STAGING/PROD config |
| `30-git-workflow.md` | Branching & delivery workflow |
| `31-mvp.md` | MVP vs V1 vs Future scope |
| `32-development-phases.md` | Sequential build phases with acceptance criteria |
| `33-acceptance-criteria.md` | Measurable acceptance criteria per module |
| `34-risks.md` | Risk register |
| `35-future-roadmap.md` | Future features & open questions |
| `37-product-analytics.md` | Product & platform analytics metrics |

## 3. Recommended Reading Order

For a **developer about to implement**, read in this order:

1. `07-system-architecture.md` (the big picture)
2. `13-meta-integration.md` (the compliance foundation — non-negotiable)
3. `10-backend-architecture.md` + `11-database-architecture.md` + `12-api-architecture.md`
4. `19-ai-assistant.md` + `20-ai-tools.md` (the differentiator + safety model)
5. `31-mvp.md` + `32-development-phases.md` (what to build, in what order)

For a **product stakeholder**, read: `01`, `02`, `03`, `04`, `05`, `06`, `31`, `35`.

## 4. Product Positioning Statement

> For businesses and teams that rely on Facebook Messenger to acquire and serve customers, **PagePilot** is a communication, lead-management, and automation platform that unifies every Page into one workspace and lets a natural-language AI assistant inspect and act on that data safely. Unlike single-chat tools or spam broadcasters, **PagePilot** respects Meta's messaging policies and permission boundaries, gives teams structured lead pipelines, and provides full auditability of every automated or AI-initiated action.

## 5. Non-Negotiable Constraints

These constraints are invariant across every phase and design decision:

1. **No restriction bypassing.** The platform never circumvents the 24-hour messaging window, messaging-type rules, message-tag use cases, or any Meta policy. Where a capability is policy-dependent, it is surfaced honestly to the user (e.g., "this message requires the HUMAN_AGENT tag" or "outside window — not allowed").
2. **Tokens never reach the client.** Meta user/page tokens are stored server-side, encrypted at rest, and only ever used in server-to-server calls.
3. **AI = controlled tools.** The AI assistant never issues raw database queries or raw Meta calls. It only invokes an allowlisted tool surface, each tool enforcing auth/isolation/validation.
4. **Tenant isolation is absolute.** Every query is scoped by `workspace_id`; cross-tenant access is a critical-severity bug, not a feature.
5. **MVP simplicity.** No microservices, no vector DB, no event bus, no Kubernetes for MVP (see `08`, `25`, `28`).
