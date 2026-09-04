# PagePilot — AI-Powered Facebook Page Communication, Lead Management & Automation Platform

**PagePilot** is a production-grade SaaS platform that centralizes communication across multiple Facebook Pages. Businesses connect their Pages once, then manage Messenger conversations, customers, leads, follow-ups, campaigns, and automations from a single modern dashboard — all orchestrated by an AI-powered natural-language business automation assistant.

> **Status:** Phase 0 — Product Documentation & Architecture (complete). No application code has been written yet. Implementation begins only after this documentation is reviewed and approved.

---

## What It Does

| Problem | Solution |
| --- | --- |
| Switching between many Facebook inboxes | One unified inbox for all connected Pages |
| Missed / slow customer replies | Real-time inbox + AI drafting + automation |
| Repetitive questions answered manually | AI responses + reusable templates + automations |
| Leads buried in chat history | Structured CRM with scoring, tags, status |
| Campaigns sent manually one-by-one | Compliant queued campaigns with delivery tracking |
| Disconnected tooling | One workspace: Pages, inbox, CRM, campaigns, automation, analytics |
| No natural-language control | AI assistant that *understands and executes* business workflows safely |

---

## Key Principles

1. **API-first** — every capability is a versioned REST API consumed by the web client.
2. **Modular monolith** — clear domain modules, single deployable service for MVP.
3. **Multi-tenant by design** — strict workspace isolation at every layer.
4. **Secure by default** — Meta tokens never reach the browser; all secrets encrypted at rest.
5. **Official Meta APIs only** — no restriction bypassing, no spam, no unsupported capabilities.
6. **AI actions go through controlled tools** — the assistant never touches the database directly.
7. **Consequential actions require confirmation** — an explicit permission model gates every external action.
8. **Observable** — webhooks, automations, campaigns, and AI actions are all fully logged.
9. **MVP stays simple** — complexity added only when a business need justifies it.
10. **Documentation is source of truth** — kept synchronized with implementation.

---

## Documentation Index

Full architecture lives in [`/docs`](./docs). See [`docs/00-overview.md`](./docs/00-overview.md) for the entry point and navigation.

## Getting Started

1. Read [`docs/00-overview.md`](./docs/00-overview.md) → Executive Summary & Vision.
2. Read [`docs/13-meta-integration.md`](./docs/13-meta-integration.md) → the single source of truth for Meta compliance.
3. Read [`docs/35-future-roadmap.md`](./docs/35-future-roadmap.md) → MVP vs V1 vs Future scope.
4. Review the full documentation, then approve to begin Phase 1 (repository & dev environment).

## License

Proprietary. All rights reserved.
