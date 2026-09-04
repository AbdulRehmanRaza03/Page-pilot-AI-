# 02 — Product Requirements Document (PRD)

## 1. Product Definition

**PagePilot** is a multi-tenant, web-based SaaS. A user registers, creates a **Workspace**, connects one or more **Facebook Pages**, and then manages:
- Messenger **conversations** (unified inbox)
- **Contacts & leads** (CRM)
- **Messages** (one-to-one, templates, AI-assisted)
- **Campaigns** (compliant audience messaging)
- **Automations** (trigger → conditions → actions)
- **Analytics** (response time, leads, campaign delivery)
- **Team** (roles & permissions)
- **AI assistant** (natural-language operations)

## 2. Goals & Non-Goals

### Goals
- G1: Connect pages and receive/store messages reliably.
- G2: Provide a real-time unified inbox usable by non-technical users.
- G3: Provide a CRM/lead pipeline derived automatically from conversations.
- G4: Enable compliant, trackable campaigns and automations.
- G5: Deliver a safe, genuinely useful AI assistant.
- G6: Enforce strict multi-tenant isolation and security.
- G7: Ship a deployable MVP fast, with architecture that scales later.

### Non-Goals (MVP) — see `31-mvp.md`
- No payments/billing (architecture-ready only).
- No microservices, Kubernetes, event bus, or vector DB.
- No WhatsApp, Instagram DM, or non-Messenger channels (architecture allows later).
- No paid/marketing messages, sponsored messages, or one-time notifications (future).
- No multi-language UI localization (architecture-ready only).
- No native mobile app (responsive web only).

## 3. Functional Requirements

### FR-A — Authentication (`22-auth-rbac.md`)
- FR-A1 Register with email + password.
- FR-A2 Login / logout.
- FR-A3 Email verification.
- FR-A4 Password reset.
- FR-A5 Session management (refresh + access tokens).

### FR-B — Workspace (`22`)
- FR-B1 Create/rename workspace.
- FR-B2 Invite/manage members.
- FR-B3 Assign roles (Owner, Admin, Member, Agent — extensible).
- FR-B4 Show subscription/usage (placeholders in MVP).

### FR-C — Page Management (`13`)
- FR-C1 Initiate Facebook OAuth (Facebook Login for Business).
- FR-C2 Retrieve and list authorized Pages (`pages_show_list` + `/me/accounts`).
- FR-C3 Select/connect Pages to a workspace.
- FR-C4 Disconnect a Page.
- FR-C5 Show Page connection status + token validity.
- FR-C6 Handle reauthorization and token refresh.
- FR-C7 Store Page access tokens encrypted server-side; never expose to client.

### FR-D — Inbox (`06`, `15`)
- FR-D1 Aggregate conversations across connected Pages.
- FR-D2 Real-time updates (new message → appears without refresh).
- FR-D3 Search + filters (Page, read/unread, assigned, label, status).
- FR-D4 Assign/unassign conversation to a member.
- FR-D5 Conversation status lifecycle (Open / Pending / Resolved / Awaiting-reply).
- FR-D6 Customer profile sidebar within conversation.
- FR-D7 Notes + labels on a conversation.
- FR-D8 AI-suggested replies.

### FR-E — Contacts & Leads (`16`)
- FR-E1 Auto-create contact per PSID on first message.
- FR-E2 Lead status pipeline (New / Qualified / Contacted / Won / Lost).
- FR-E3 Tags + custom labels.
- FR-E4 Lead score (rule-based).
- FR-E5 Product interest attribution.
- FR-E6 Search/filter/segment.
- FR-E7 Conversation history per contact.

### FR-F — Messaging (`15`)
- FR-F1 Send one-to-one message (RESPONSE within window).
- FR-F2 Message templates (CRUD).
- FR-F3 Send attachments where supported.
- FR-F4 Track delivery + read status (`message_deliveries`, `message_reads`).
- FR-F5 Surface delivery failures + retry strategy.
- FR-F6 Enforce messaging-type + window rules (never send outside window without a valid tag).

### FR-G — Campaigns (`17`)
- FR-G1 Create campaign (name, template, audience, schedule).
- FR-G2 Audience selection via segmentation.
- FR-G3 Eligibility check (24h window / tag availability).
- FR-G4 Queue + deliver messages.
- FR-G5 Track delivered/failed; retry logic.
- FR-G6 Cancel a campaign.
- FR-G7 Campaign analytics.

### FR-H — Automation (`18`)
- FR-H1 Visual builder: Trigger → Conditions → Actions.
- FR-H2 Triggers (new conversation, new message, intent detected).
- FR-H3 Conditions (intent, label, score, keyword).
- FR-H4 Actions (label, status, assign, draft, send permitted reply, follow-up).
- FR-H5 Delays, branching, variables, templates.
- FR-H6 Enable/disable, execution history, logs, error handling, test mode.

### FR-I — AI Assistant (`19`, `20`)
- FR-I1 Natural-language instruction → intent + plan.
- FR-I2 Read/search/summarize/filter actions.
- FR-I3 Prepare actions (draft, campaign, automation, audience).
- FR-I4 Write actions (label, status, assign).
- FR-I5 External actions (send, start campaign, enable automation) — gated by confirmation.
- FR-I6 Explain results and report failures.
- FR-I7 Restricted to controlled tools; never direct DB/Meta access.

### FR-J — Analytics (`06`)
- FR-J1 Dashboard metrics (connected pages, conversations, response time, leads, etc.).
- FR-J2 Per-Page and per-agent breakdowns.
- FR-J3 Campaign/automation performance.

### FR-K — Team & RBAC (`22`)
- FR-K1 Role definitions + permission maps.
- FR-K2 Enforce permissions on every API endpoint.

## 4. Non-Functional Requirements

| # | Category | Requirement |
| --- | --- | --- |
| NFR-1 | Performance | Inbox message render < 200ms p95; real-time push < 2s. |
| NFR-2 | Availability | MVP target 99.5%; webhook acknowledged in < 1s to avoid Meta retries. |
| NFR-3 | Security | OWASP baseline; tokens encrypted; HTTPS everywhere. |
| NFR-4 | Isolation | 100% workspace-scoped queries; zero cross-tenant reads. |
| NFR-5 | Observability | Structured logs; every webhook/AI/automation action traceable. |
| NFR-6 | Compliance | Meta policy adherence (window, types, tags); no bypass. |
| NFR-7 | Usability | Non-technical user can connect a Page and answer messages without docs. |
| NFR-8 | Accessibility | WCAG 2.1 AA target on core screens. |
| NFR-9 | Responsive | Desktop-first; usable on tablet/mobile browsers. |
| NFR-10 | Scalability | Modular monolith that can extract workers/services later. |

## 5. Success Metrics (`32` product analytics)

- Connected Pages per workspace; active workspaces (DAU/WAU).
- Conversations/day; median/max first-response time.
- Leads created; qualified lead rate; lead→won conversion.
- AI actions executed (and confirmation rate).
- Automation executions; campaign delivered/failed rates.
- User retention (D7/D30).
