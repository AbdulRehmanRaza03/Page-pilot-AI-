# 04 — Feature Specification

## Product Modules Overview

PagePilot is organized into nine product modules, each mapping to a coherent set of capabilities. Modules are deliberately independent: a customer can adopt the Unified Inbox before using Campaigns, and can use the AI Assistant without enabling every Automation feature. Modules A–C are the foundation (identity, tenant, and connected Pages) on which D–I depend.

Each feature below is prioritized using three tiers:

- **MVP** — must ship for the first usable release.
- **V1** — high value, ship in the next iteration(s).
- **Future** — roadmap; not required for launch.

---

## A) Authentication

Identity and session for PagePilot users and workspaces. See `22-auth-rbac.md`.

| Feature | Description | Priority |
| --- | --- | --- |
| Email/password registration | Sign up with email + password; creates a user and an initial Workspace | MVP |
| Email verification | Verify ownership of the email via magic link/token before full access | MVP |
| Login / logout | Authenticate; destroys the session on logout | MVP |
| Password reset | Request-reset token flow (expiring, single-use, hashed) | MVP |
| Password policy | Minimum length, breach-list checks (optional), lockout after repeated failures | MVP |
| Session management | JWT access + refresh tokens with rotation and revocation | MVP |
| OAuth (Meta / Facebook Login) | Used **only to connect Facebook Pages**, not for app user auth | MVP |
| SSO / social login | Google/Microsoft login for app users (if desired later) | Future |
| MFA (TOTP) | Two-factor authentication on user accounts | V1 |
| Account management | Profile, change password, deactivate account, data export | V1 |

> **Clarification.** PagePilot's *own* authentication is **email + password**. Facebook Login (OAuth) is *not* how users log into PagePilot — it is the OAuth handshake that grants PagePilot access to the user's Facebook Pages (see `13-meta-integration.md`).

---

## B) Workspace

Multi-tenant organization boundary. Every Page, contact, conversation, campaign, and automation belongs to exactly one Workspace. See `22-auth-rbac.md` for isolation.

| Feature | Description | Priority |
| --- | --- | --- |
| Workspace creation | A user can own/create one or more workspaces | MVP |
| Workspace membership | Invite users by role (Owner, Admin, Member, Agent) | MVP |
| Roles & permissions | RBAC enforced per workspace; permission matrix in `22-auth-rbac.md` | MVP |
| Workspace settings | Name, branding, timezone, language | MVP |
| Workspace billing/plan | Subscription plan and seat count (if monetized) | V1 |
| Workspace audit view | Who did what/recent activity within the workspace | V1 |
| Cross-workspace switching | A user belongs to multiple workspaces and can switch | V1 |

---

## C) Facebook Page Management

Connect, authorize, and monitor the Facebook Pages that drive the product.

> **Meta dependency.** Page connection requires Facebook Login for Business (OAuth) and the MVP permission set: `pages_show_list`, `pages_messaging`, `pages_manage_metadata`, `pages_read_engagement`. Live use by non-role users requires **App Review** and possibly **Business Verification**. See `13-meta-integration.md`.

| Feature | Description | Priority |
| --- | --- | --- |
| Connect a Page | OAuth flow → list managed Pages via `GET /me/accounts` → select Pages | MVP |
| Multi-Page connection | Connect multiple Pages to one workspace | MVP |
| Page metadata sync | Name, category, picture, timezone from Graph API | MVP |
| Token lifecycle | Encrypt tokens at rest; track expiry; proactive reauthorization prompts | MVP |
| Disconnect Page | Revoke/remove a Page and invalidate stored tokens | MVP |
| Page health status | Detect expired/revoked tokens (Meta error 190/10) and flag reconnect | MVP |
| Page permissions display | Show which Meta permissions are currently granted | MVP |
| Webhook subscription | Subscribe/unsubscribe per Page (`pages_manage_metadata`) | MVP |
| Page insights | Read page-level analytics (`read_insights`) as a dashboard | V1 |
| Page listing & grouping | Organize Pages into groups/tags for routing | V1 |
| Multi-location/brand mapping | Map Pages to business locations/brands | Future |

---

## D) Unified Inbox

One inbox aggregating Messenger conversations across all connected Pages.

| Feature | Description | Priority |
| --- | --- | --- |
| Conversation list | Unified list of conversations across Pages, sort/filter/search | MVP |
| Conversation thread view | Read full thread history per conversation | MVP |
| Real-time intake | Ingest messages via webhooks (messages, echoes, deliveries, reads) | MVP |
| Message read state | Track seen/read/unread per conversation | MVP |
| Assignment | Assign a conversation to a specific agent | MVP |
| Internal notes | Private notes on a conversation (not sent to the customer) | MVP |
| Status / snooze | Conversation status (open, pending, closed) and snooze | MVP |
| Canned responses | Reusable reply snippets / quick replies | V1 |
| Conversation labels | Tag conversations (e.g., "priority", "lead", "support") | V1 |
| Bulk actions | Batch assign/close/label selected conversations | V1 |
| Typing indicator / presence | Show when an agent is viewing or typing | Future |
| Collision detection | Prevent two agents from replying to the same thread simultaneously | Future |

---

## E) Contacts & Leads CRM

A CRM of people and leads derived from Messenger conversations and campaigns.

| Feature | Description | Priority |
| --- | --- | --- |
| Contact profile | Identity keyed by PSID, with name, picture, locale, timezone | MVP |
| Contact fields | Custom fields/attributes for each contact | MVP |
| Lead record | A contact + pipeline stage + source + score | MVP |
| Lead status / pipeline | Stages (new, contacted, qualified, won, lost) | MVP |
| Segmentation | Build saved segments/audiences by attributes and activity | V1 |
| Lead scoring | Score leads by engagement signals | V1 |
| Tags & lists | Organize contacts into tags/lists | MVP |
| Contact timeline | Chronological history of interactions with that contact | V1 |
| Import/export contacts | CSV import / export (with consent/legal wiring) | V1 |
| Deduplication | Merge duplicate contact records | V1 |
| Custom objects | Extend CRM with custom entity types | Future |

---

## F) Messaging

Outbound messaging to contacts through Messenger.

> **Meta dependency.** Sending is governed by the **24-hour standard messaging window** and **Message Tags**. Only `RESPONSE`/`UPDATE` are available in-window; outside the window requires an approved, non-promotional Message Tag. Promotional or mass sends are restricted. See `13-meta-integration.md` for the full policy matrix.

| Feature | Description | Priority |
| --- | --- | --- |
| Manual reply | Agent replies to a conversation (RESPONSE, in-window) | MVP |
| Rich media | Send text, images, attachments, quick replies, buttons | MVP |
| Window/tag eligibility check | Pre-send validation of messaging window and eligible tag | MVP |
| Drafting & templates | Save and reuse message templates | MVP |
| Message scheduling | Schedule sends subject to window/tag validation at send time | V1 |
| Message tags | Apply approved tags for outside-window sends (non-promotional) | V1 |
| Delivery/read tracking | Map `message_deliveries`, `message_reads` to sent state | V1 |
| Broadcast / campaign send | Send to an eligible audience (policy-gated) | V1 |
| Marketing messages | Promotional sends via Marketing Messages (advertiser eligibility) | Future |
| One-time notification | Send with one-time notification opt-in | Future |

---

## G) Campaigns

Bulk, targeted outreach and follow-up campaigns.

> **Meta dependency.** Campaigns that send messages must respect the same 24-hour window / Message Tag rules and cannot cold-message users who never messaged the Page. **Marketing Messages** (promotional bulk) require advertiser eligibility and specific permissions (e.g., `marketing_messages_messenger`, `ads_management`). Broadcasts must target eligible (history/opted) contacts only. See `13-meta-integration.md`.

| Feature | Description | Priority |
| --- | --- | --- |
| Campaign definition | Name, message template, target audience/segment | V1 |
| Audience selection | Target saved segments or ad-hoc filters | V1 |
| Eligibility validation | Pre-send check that each recipient is in-window/eligible | V1 |
| Scheduling | Schedule campaign start time/date | V1 |
| Campaign launch | Start sends (queued, throttled per Meta rate limits) | V1 |
| Campaign analytics | Sent/delivered/read/replied counts, opt-out | V1 |
| A/B test variants | Test multiple message variants | Future |
| Drip / sequences | Multi-message sequences over time | Future |
| Lead-ads retrieval | Pull leads from Lead Ads (requires `leads_retrieval` + approval) | Future |
| Marketing Messages | Promotional campaigns to opted contacts (advertiser-only) | Future |

---

## H) Automation Engine

Rules and workflows that trigger actions automatically from events.

> **Meta dependency.** Any automation that auto-sends is subject to the 24-hour window and Message Tags, and must adhere to Messenger Platform policy. PagePilot is positioned as a **hybrid** bot (AI-assisted + human agents) to avoid fully-automated classification constraints; automatic sends are opt-in per automation and disclosed. See `13-meta-integration.md`.

| Feature | Description | Priority |
| --- | --- | --- |
| Event triggers | Trigger on new message, keyword, lead status change, schedule | V1 |
| Conditions | Filter by contact attributes, window eligibility, labels | V1 |
| Actions | Send message, assign conversation, add label/tag, update lead, add note | V1 |
| Automation builder | Visual or natural-language builder for workflows | V1 |
| Auto-responder | Conditionally auto-send an in-window reply (opt-in, disclosed) | V1 |
| Lead routing rules | Route conversations to agents by keyword/Page | V1 |
| Follow-up sequences | Automated follow-ups within eligibility limits | V1 |
| Enabling/disabling | Enable, pause, edit, duplicate automations | V1 |
| Execution logs | Per-run logs of triggers, conditions, actions, outcomes | V1 |
| Delay/timer nodes | Wait steps between actions (window-aware) | Future |
| Integrations (webhooks/Zapier) | Emit events to external systems | Future |

---

## I) AI Assistant

Safe natural-language assistant that operates the above modules via a bounded, allowlisted toolset. See `19-ai-assistant.md` and `20-ai-tools.md`.

> **Meta dependency.** The assistant inherits the same Meta constraints as Messaging, Campaigns, and Automation. It never bypasses the 24-hour window, Message Tags, or policies; every external send re-checks eligibility at execution time.

| Feature | Description | Priority |
| --- | --- | --- |
| Natural-language chat | Conversational UI scoped to the current workspace | MVP |
| READ actions | Search leads/conversations, summarize threads, view analytics | MVP |
| PREPARE actions | Draft messages, prepare campaigns/automations, build segments | MVP |
| WRITE actions | Add labels, update lead status, assign conversation, add note | V1 |
| EXTERNAL actions | Send message, start campaign, enable automation (always confirmed) | V1 |
| Permission enforcement | Every tool bound to RBAC + workspace scope | MVP |
| Confirmation UX | Preview + Approve/Cancel/Edit for consequential actions | MVP |
| Action audit log | Log every AI tool call (`ai_action_logs`) | MVP |
| Context selection | Only send relevant workspace/data to the model (privacy) | MVP |
| Grounded summaries | Citations to retrieved contact/conversation IDs | V1 |
| Failure reporting | Human-readable errors + next steps for Meta/policy failures | V1 |

---

## Priority Rollup

| Module | MVP scope (core) | Deferred to V1/Future |
| --- | --- | --- |
| Authentication | email/password, verify, reset, sessions, Meta OAuth (for Pages) | MFA, SSO |
| Workspace | create, members, roles, settings | billing, audit view |
| Page Management | connect, sync, token lifecycle, health, webhooks | insights, grouping |
| Unified Inbox | list, thread, intake, read, assign, notes, status | snippets, labels, bulk, collision |
| CRM | profile, lead, status, tags/lists | score, segments, timeline |
| Messaging | reply, rich media, eligibility, templates | scheduling, tags, broadcast |
| Campaigns | — (introduced V1) | full module (V1+), marketing (Future) |
| Automation | — (introduced V1) | full module (V1+) |
| AI Assistant | READ + PREPARE, enforcement, audit | WRITE/EXTERNAL, grounded summaries |

> Campaigns and Automation are intentionally V1 introductions: they add the most Meta policy surface (24-hour window, Message Tags, Marketing Messages eligibility, automated-interaction disclosure). The MVP ship focuses on the inbox + CRM + a read/draft AI so the policy-critical send surfaces are hardened before bulk/automated send is added.
