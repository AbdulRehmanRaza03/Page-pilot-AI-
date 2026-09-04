# 08 — Technology Stack

This document defines the complete technology stack for PagePilot and, critically, **the reason** behind each choice. A guiding principle for this project is:

> Do not add technology merely because it is popular. Every dependency must earn its place by solving a concrete problem we actually have (or will predictably have within the first few months).

Where a commonly-used tool is *not* selected, a "Rejected alternatives" note explains why.

---

## 1. Frontend

### Framework: Next.js (App Router)

**Choice:** Next.js 14+ with the App Router.

**Justification:**

- **Server Components + streaming** reduce the amount of JavaScript sent to the browser for mostly-read dashboards (inbox, campaigns, analytics).
- **File-system routing** maps cleanly onto our multi-tenant feature surface (`/w/{workspace}/...`), keeping navigation predictable.
- **Single deployable unit** — API routes can host small edge concerns (webhook signature re-proxying, cron triggers) without spinning up a second service.
- **Built-in auth/middleware** hook lets us gate routes and mirror tenant context at the edge.

**Rejected alternatives:**

- *Vite + SPA (React Router):* faster cold start, but we lose server-side rendering, streaming, and unified routing. The dashboard's initial-load experience matters for a SaaS product; not worth the cost.
- *Remix:* excellent, but the ecosystem docs/talent pool and our team's existing Next.js familiarity tilt the balance to Next.js.

### React 18+ / TypeScript

**Choice:** React 18 (concurrent features) and TypeScript in strict mode throughout.

**Justification:**

- React 18's concurrent rendering and `Suspense` underpin the loading/error UX documented in `09-frontend-architecture.md`.
- TypeScript is non-negotiable: we share API types across frontend and backend (see `12-api-architecture.md`), and strict typing is the cheapest safeguard against API contract drift. We generate/export shared types from the backend's Pydantic schemas.

### Styling: Tailwind CSS

**Choice:** Tailwind CSS with a central design-token layer.

**Justification:**

- Consistency at scale: spacing, color, and typography tokens live in one place and are enforced by the compiler.
- Minimal CSS-in-JS runtime cost; Tailwind produces a small, cacheable static stylesheet.
- Plays well with server components (no runtime necessary).

**Rejected alternatives:**

- *CSS Modules:* fine, but requires more discipline to keep tokens consistent and grow slowly into inconsistency across a larger team.
- *CSS-in-JS (styled-components/emotion):* avoids context-switching but adds runtime cost and complicates server-component rendering.

### Component library

**Choice:** Build our own UI primitives on top of **[Radix UI primitives](https://www.radix-ui.com/) + Headless UI**, styled with Tailwind, and assembled into a small internal library (`frontend/src/components/ui`).

**Justification:**

- Radix/Headless UI give us accessible, unstyled primitives (dialog, menu, select, tabs, tooltip) without imposing a visual identity.
- We control the visual language through design tokens, which is essential for a product that will brand itself distinctly and iterate rapidly.
- Avoiding a full opinionated kit (e.g. Material) prevents fighting against a foreign design system.

**Note:** Building our own primitives **is acceptable here** because (a) we start from Radix rather than from scratch, and (b) accessibility and behavior are already provided. We are styling and composing, not re-implementing a component library.

**Rejected alternatives:**

- *MUI / Chakra / Ant:* move faster initially but lock us into a look and a rewrite later. Given we already need tight brand control, the lock-in cost exceeds the initial speed gain.

### Server data fetching: TanStack Query (React Query)

**Choice:** TanStack Query v5.

**Justification:**

- Declarative, cache-first data layer with built-in loading/error/refetch state machines — this directly implements the loading/error patterns in `09-frontend-architecture.md`.
- Normalizes paginated/infinite inbox and conversation lists, optimistic updates for message sending, and invalidation strategy per query key (per workspace, per resource).
- Cuts out a huge class of hand-rolled `useEffect` data-fetch bugs.

### State management (client state)

**Choice:** Server state in TanStack Query; **local UI state** in React state + a tiny Zustand store for app-level concerns (active workspace, theme, sidebar, draft drafts).

**Justification:**

- The **vast majority** of our state is server cache → belongs in TanStack Query.
- Zustand is chosen for the small remaining global client state because it's minimal and works outside React (e.g. in event handlers / a fetch middleware).

**Rejected alternatives:**

- *Redux / Redux Toolkit:* heavy ceremony for what is now mostly `useQuery`. We keep it out.
- *Jotai/Recoil:* fine, but Zustand's simpler mental model is sufficient for our handful of global client flags.

### Forms + validation: React Hook Form + Zod

**Choice:** React Hook Form (RHF) with Zod resolvers.

**Justification:**

- RHF minimizes re-renders on large forms (campaign builder, contact editor).
- Zod gives us a single schema definition shared between client validation and backend Pydantic schemas (via JSON schema where practical), keeping validation rules in one conceptual place.

### API layer

**Choice:** A hand-written, typed API client generated from the backend's OpenAPI schema (`openapi.json`) plus TanStack Query hooks.

**Details** live in `09-frontend-architecture.md`. The key stack decision is: **typed client + generated types** rather than untyped `fetch` calls.

---

## 2. Backend

### Language/runtime: Python 3.12

**Choice:** Python 3.12.

**Justification:**

- Team proficiency and the mature async + LLM ecosystem (`openai`, `anthropic`, `langchain`/`pydantic-ai` if used).
- FastAPI + async support is first-class.
- 3.12's performance improvements (faster startup, improved type hints via `Self`, etc.) are useful.

### Web framework: FastAPI

**Choice:** FastAPI.

**Justification:**

- First-class async support (delegating to `asyncpg`, Redis, and Celery's async patterns).
- Automatic OpenAPI generation → feeds our typed frontend client and API docs.
- Pydantic v2 integration gives request/response validation for free.

### ORM: SQLAlchemy 2.0 (async)

**Choice:** SQLAlchemy 2.0 with the async engine (`sqlalchemy.ext.asyncio`) and its `asyncpg` driver.

**Justification:**

- Explicit, mature, and the de-facto standard; 2.0's `select()` API is clean.
- Async keeps FastAPI handlers non-blocking during DB I/O.

**Rejected alternatives:**

- *Raw asyncpg:* more control but we'd reimplement identity mapping and migrations support.
- *Tortoise/ORM:* nice but smaller community and weaker migration story.

### Migrations: Alembic

**Choice:** Alembic (async-compatible).

**Justification:** We version the schema explicitly. Multi-tenant schema evolution requires auditable migrations.

### Validation/serialization: Pydantic v2

**Choice:** Pydantic v2 (Rust core).

**Justification:**

- Fast (Rust-backed), used for request/response models, config, and — importantly — **shared schema generation** that the frontend consumes as TypeScript types.

### Database: PostgreSQL 16

**Choice:** PostgreSQL 16.

**Justification:**

- Relational authority for accounts, workspaces, memberships, conversations, contacts, campaigns.
- `JSONB` for flexible metadata (Facebook payloads) without a separate document store.
- Future-ready for `pgvector` when/if RAG becomes necessary (see `21-knowledge-base.md`).
- Strong native support for row-level security and partial indexes if we later shard by tenant.

**Rejected alternatives:**

- *Single MySQL:* viable, but Postgres's JSONB, window functions, and `pgvector` path make it the safer default for this product.

### Cache/broker/queue: Redis + Celery

**Choice:** Redis 7 as cache and Celery as the task queue.

**Justification:**

- Redis: caching hot reads (conversation lists, analytics aggregates), rate-limiting counters, and Celery's broker/result backend.
- Celery: asynchronous, retriable work — Facebook webhook ingestion, campaign sends, AI assistant runs, notification fanout.

**Rejected alternatives:**

- *RabbitMQ as broker:* more moving parts; Redis satisfies our durability/throughput needs and is already present as a cache.
- *Dramatiq/Arq:* lighter, but Celery's ecosystem (retries, monitoring, Django/FastAPI integration) outweighs it.

---

## 3. AI

### LLM provider

**Choice:** Abstract behind a provider interface with **two first-class implementations**: a hosted provider (OpenAI or Anthropic) and an **open-weight self-hosted** option (e.g. Llama 3.x / Qwen via vLLM or Ollama behind an OpenAI-compatible endpoint).

**Justification & guidance:**

- The abstraction (single `LLMClient` interface: `chat`, `stream`, `tool_call`) lets us start with a hosted model and fall back to self-hosted for cost/privacy later without touching business logic.
- **Recommendation for MVP:** start with a **hosted provider** (OpenAI or Anthropic) for reliability and support for structured outputs/tool calling; keep the open-weight path as a documented escape hatch.
- The decision between OpenAI vs Anthropic is a product/legal call (data privacy, cost, rate limits), **not** an engineering lock-in — the interface isolates it.

### Structured outputs

**Choice:** Use provider-native **structured output / JSON mode** (e.g. OpenAI's `response_format`, Anthropic's tool-based JSON) to enforce the assistant's tool-call schemas and parsed classifications.

**Justification:** The assistant's `READ/PREPARE/WRITE/EXTERNAL` action surface (see `ai` module) depends on reliable, schema-valid predictions. Structured outputs eliminate fragile prompt-only JSON parsing.

### Tool / function calling

**Choice:** Provider-native function calling bound to a **controlled tool surface** (whitelisted action classes). No arbitrary code execution.

**Justification:** Safety and auditability. The assistant may only call tools we explicitly register, and `EXTERNAL` actions **always** require user confirmation before execution.

### Embeddings + vector DB (defer — see `21-knowledge-base.md`)

**Guidance:**
- **Do NOT add a vector database for MVP.** The knowledge base is small and highly structured; keyword/structured lookup is faster to ship and easier to reason about.
- **When to add:** only once KB entry count, retrieval quality, or query complexity makes keyword search insufficient. At that point, add `pgvector` (an extension to the existing Postgres) rather than a standalone vector service.
- **Evaluate embeddings** (OpenAI `text-embedding-*`, Cohere, or open-weight) only alongside that decision — not before.

### RAG evaluation

**Guidance:** If/when RAG is introduced, we will add an **eval harness** measuring groundedness, relevance, and citation accuracy against a golden set of KB Q&A pairs. No RAG ships without a measurable quality gate.

### AI observability

**Choice:** Structured tracing of every assistant run — model, prompt version, tool calls, tokens, latency, and user feedback. Use an open standard (OpenTelemetry spans) and a lightweight store, optionally a purpose-built tool (Langfuse/LangSmith) if budget allows.

**Justification:** AI behavior must be debuggable and cost-measurable. Tool-call logs double as our audit trail for `EXTERNAL` confirmations.

---

## 4. Consolidated Stack Table

| Layer          | Technology                                             | Why (summary)                                             |
| -------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| **Frontend**   | Next.js 14 (App Router), React 18, TypeScript (strict) | SSR/streaming, safety, shared types                        |
| Styling        | Tailwind CSS + design tokens                           | Consistency, small runtime                                 |
| UI primitives  | Radix UI / Headless UI + internal `ui` library         | Accessibility + brand control                              |
| Data fetching  | TanStack Query v5                                      | Server-state cache, loading/error handling                 |
| Client state   | Zustand (minimal)                                      | App-level flags only; server state stays in Query          |
| Forms          | React Hook Form + Zod                                  | Performance + shared validation                            |
| API client     | Generated typed client (OpenAPI) + Query hooks         | Contract safety                                            |
| **Backend**    | Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2 | Async, typed, migrations                                  |
| Database       | PostgreSQL 16                                          | Relational + JSONB + pgvector path                         |
| Cache/queue    | Redis 7 + Celery                                       | Caching, rate-limit, async tasks                           |
| **AI**         | Provider-abstracted LLM (OpenAI/Anthropic first) + structured outputs + controlled tools | Safety, swap-ability                                 |
| Vector/RAG     | **Deferred** (keyword lookup first; `pgvector` later)  | Avoid premature complexity                                 |
| Observability  | OpenTelemetry (esp. for AI runs)                       | Debuggability + cost tracking                              |
