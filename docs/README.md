# PagePilot — Documentation

Complete product specification and system architecture. This folder is the **source of truth** for how PagePilot is designed and built.

## Navigation

| # | File | Contents |
| --- | --- | --- |
| 00 | `00-overview.md` | Executive summary, vision, navigation, constraints |
| 01 | `01-problem-solution.md` | Problems → impact → workaround → limitation → solution |
| 02 | `02-product-requirements.md` | Full PRD (functional + non-functional) |
| 03 | `03-personas-use-cases.md` | Target personas + use cases |
| 04 | `04-feature-specification.md` | Feature map by module (MVP/V1/Future) |
| 05 | `05-user-flows.md` | End-to-end user flows |
| 06 | `06-ui-ux-specification.md` | Screen-by-screen UI/UX spec |
| 07 | `07-system-architecture.md` | High-level system design |
| 08 | `08-tech-stack.md` | Technology choices + rationale |
| 09 | `09-frontend-architecture.md` | Frontend structure |
| 10 | `10-backend-architecture.md` | Modular monolith design |
| 11 | `11-database-architecture.md` | PostgreSQL schema + ERD |
| 12 | `12-api-architecture.md` | REST API endpoints |
| 13 | `13-meta-integration.md` | **Meta APIs, permissions, tokens, policies** |
| 14 | `14-webhook-architecture.md` | Webhook ingestion |
| 15 | `15-messaging-engine.md` | Message processing + send engine |
| 16 | `16-lead-crm.md` | Contacts & leads CRM |
| 17 | `17-campaign-system.md` | Compliant campaigns |
| 18 | `18-automation-engine.md` | Trigger → conditions → actions |
| 19 | `19-ai-assistant.md` | AI assistant + safety model |
| 20 | `20-ai-tools.md` | Controlled AI tool surface |
| 21 | `21-knowledge-base.md` | Business knowledge + RAG |
| 22 | `22-auth-rbac.md` | Auth + role-based access control |
| 23 | `23-security.md` | Production security |
| 24 | `24-real-time.md` | Real-time inbox architecture |
| 25 | `25-background-jobs.md` | Async processing |
| 26 | `26-testing.md` | Testing strategy |
| 27 | `27-observability.md` | Logging, metrics, alerting |
| 28 | `28-deployment.md` | Infrastructure & deployment |
| 29 | `29-environments.md` | Environments config |
| 30 | `30-git-workflow.md` | Branching & delivery |
| 31 | `31-mvp.md` | MVP vs V1 vs Future |
| 32 | `32-development-phases.md` | Phases 0–19 |
| 33 | `33-acceptance-criteria.md` | Per-module acceptance criteria |
| 34 | `34-risks.md` | Risk register |
| 35 | `35-future-roadmap.md` | Future features & open questions |
| 37 | `37-product-analytics.md` | Product analytics metrics |

## Recommended Reading Order

**Developer (about to implement):**
`07` → `13` → `10`+`11`+`12` → `19`+`20` → `31`+`32`

**Product stakeholder:**
`01` → `02` → `03` → `04` → `05` → `06` → `31` → `35`
