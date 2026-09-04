# 06 — UI/UX Specification

Reference: personas in `03-personas-use-cases.md`, flows in `05-user-flows.md`, AI model in `19-ai-assistant.md`.

---

## 1. Overall Navigation

### Sidebar (left, collapsible)

Primary navigation, grouped:

- **Workspace switcher** (top) — current workspace name, dropdown to switch.
- **Main:** Dashboard, Inbox, Pages, Leads, Campaigns, Automation, Analytics.
- **Manage:** Team, Settings.
- **Assistant:** AI Assistant (also a global entry point/panel).
- **Footer:** user account menu, environment/version.

### Top bar (across all authenticated screens)

- Current screen title (breadcrumb-free, single level).
- Global **AI Assistant** toggle (opens side panel).
- **Global search** (contacts, conversations, leads).
- **Unread/activity count** for inbox.
- **User avatar / account menu** (profile, workspace, logout).

### Design language

- **Type:** one sans-serif scale (display, heading, body, caption), legible at 14–16px body.
- **Color:** neutral grays for surfaces; a single primary accent for actions; semantic colors — success (green), warning (amber), danger (red), info (blue). Status chips reuse these.
- **Spacing:** 4px base unit; consistent component radii (8px), subtle borders, low-elevation shadows.
- **Components:** buttons (primary/secondary/ghost/destructive), inputs, selects, toggles, chips, tabs, tables, modals, toasts, tooltips, drawer/side panel.
- **Icons:** one consistent line-icon set.
- **Motion:** 150–250ms transitions; avoid motion that delays task completion.

### Shared state conventions (defined once, referenced per screen)

- **Empty:** muted illustration/icon + short title + one-line guidance + primary CTA.
- **Loading:** skeleton placeholders for layout, spinners only for inline/button actions.
- **Error:** inline banner or toast with plain-language message + recovery action (retry / link).
- **Success:** toast confirmation with optional undo where reversible.
- **Accessibility:** WCAG 2.1 AA; full keyboard traversal; visible focus; `aria-live` for dynamic regions; color never the sole indicator.
- **Responsive:** desktop-first; sidebar collapses to a drawer on tablet, bottom/overflow nav on mobile; data tables become stacked cards.

---

## 2. Screens

### /login

- **Purpose:** authenticate an existing user.
- **Layout:** centered card on a neutral background; brand mark; single column.
- **Components:** email field, password field (with show/hide), "Remember me", submit button, "Forgot password?" link, "Create account" link.
- **User actions:** submit credentials; recover password; navigate to register.
- **Empty state:** n/a.
- **Loading state:** submit button shows spinner and is disabled while authenticating.
- **Error state:** inline banner for invalid credentials or locked account.
- **Success state:** redirect to `/dashboard` (or `/onboarding` if first-time/no workspace).
- **Mobile behavior:** card fills width, comfortable tap targets.
- **Accessibility:** labels programmatically tied to inputs; focus lands on email on load.
- **Responsive behavior:** card max-width ~420px; scales to full-width on mobile.

### /register

- **Purpose:** create a new account.
- **Layout:** centered card mirroring login.
- **Components:** name, email, password (with strength hint), confirm password, terms/privacy checkboxes, submit, "Sign in" link.
- **User actions:** create account; go to login.
- **Empty state:** n/a.
- **Loading state:** submit disabled + spinner during account creation.
- **Error state:** field-level errors (mismatch, weak password, taken email) + inline summary.
- **Success state:** email-verification notice; link to resend; note that verification is required before full access.
- **Mobile behavior:** single-column, stacked, large inputs.
- **Accessibility:** error messages associated with fields via `aria-describedby`; announced via `aria-live`.
- **Responsive behavior:** max-width ~420px, fluid.

### /onboarding

- **Purpose:** guide a new user through workspace creation, Page connection, and core configuration (Flow 1 of `05-user-flows.md`).
- **Layout:** step-by-step wizard: left step list (or top stepper on mobile), right content panel.
- **Components:** workspace name field; Facebook OAuth connect button; Page multi-select list (from `/me/accounts`); business info form (name, timezone, default reply tone); messaging preferences (default `messaging_type` behavior, off-hours handling, auto-reply); optional AI knowledge textarea; "Finish" CTA.
- **User actions:** progress/back through steps; connect Facebook and grant permissions; select Pages; save config; skip optional steps.
- **Empty state:** no Pages authorized → explanation + "Connect Facebook" CTA.
- **Loading state:** spinner during OAuth redirect and Page list fetch.
- **Error state:** OAuth canceled/failed or permission denied → friendly explanation + retry.
- **Success state:** completion screen → redirect to `/dashboard`.
- **Mobile behavior:** stepper collapses to a single progress bar; steps stacked.
- **Accessibility:** current step announced; wizard is keyboard navigable.
- **Responsive behavior:** two-column ≥ tablet; single column on mobile.

### /dashboard

- **Purpose:** at-a-glance workspace health and activity for the connected Pages.
- **Layout:** metric cards row, then chart/activity regions.
- **Components:** metric cards (connected pages, conversations today, unread, first-response time, leads created); recent conversations list; recent leads; quick actions (connect Page, new campaign); AI assistant entry.
- **User actions:** navigate to inbox/leads/campaigns; start a new connection; open assistant.
- **Empty state:** no connected Pages → prominent "Connect your first Page" CTA.
- **Loading state:** skeleton cards while metrics load.
- **Error state:** per-card error with retry if an API fails.
- **Success state:** healthy data rendered; subtle updates on new events.
- **Mobile behavior:** metric cards stack; activity lists become card lists.
- **Accessibility:** data also available as text/summary, not only charts.
- **Responsive behavior:** multi-column grid → single column on mobile.

### /inbox

- **Purpose:** unified list of conversations across connected Pages.
- **Layout:** two-pane on desktop: conversation list (left) + selected conversation (right); single list on mobile.
- **Components:** search; filters (Page, read/unread, assigned, label, status); conversation list rows (contact, Page, snippet, timestamp, unread badge, assignee); selection.
- **User actions:** search/filter; open a conversation; assign/unassign; mark read; change status.
- **Empty state:** "No conversations" with guidance; per-filter empty state with "clear filters".
- **Loading state:** skeleton rows; real-time indicator.
- **Error state:** banner if the real-time stream disconnects, with reconnect.
- **Success state:** live updates without refresh.
- **Mobile behavior:** list only; tapping opens the conversation as a full screen.
- **Accessibility:** unread indicated by text/badge (not color only); list is keyboard-navigable.
- **Responsive behavior:** two-pane collapses to single pane below a breakpoint.

### /inbox/[conversation]

- **Purpose:** read and reply to a single conversation in full context.
- **Layout:** message thread (center/left) + customer profile sidebar (right) + compose (bottom).
- **Components:** message bubbles (inbound/outbound, timestamp, read receipt); compose box with messaging-type indicator and window status; AI-suggested reply and template picker; toolbar (assign, status, label, note); customer profile sidebar (contact, lead status, tags, history); attachment support.
- **User actions:** type/send; apply suggestion/template; assign; change status; add note/label; view/edit contact.
- **Empty state:** n/a (conversation always has messages).
- **Loading state:** skeleton for thread while history loads.
- **Error state:** send failure surfaced inline with retry; window-closed state disables send and explains why.
- **Success state:** message appends with delivery/read status.
- **Mobile behavior:** profile sidebar hidden behind a tab/drawer; compose pinned bottom.
- **Accessibility:** messages announced via `aria-live`; window status in text.
- **Responsive behavior:** sidebar becomes an overlay below desktop width.

### /pages

- **Purpose:** view and manage connected Facebook Pages.
- **Layout:** card grid or table of Pages.
- **Components:** Page cards (name, avatar, connection status, token validity, unread count); "Connect page" button; "Reauthorize" when needed; "Disconnect"; per-Page actions.
- **User actions:** connect new Page; reauthorize; disconnect; open Page settings.
- **Empty state:** "No Pages connected" + connect CTA.
- **Loading state:** skeleton cards while Page list loads.
- **Error state:** token-expiry/revoked shown as "Needs reauthorization"; banner for fetch failures.
- **Success state:** status flips to Active after connect/reauthorize (toast).
- **Mobile behavior:** cards stack; actions in an overflow menu.
- **Accessibility:** status conveyed with text label, not color alone.
- **Responsive behavior:** grid (3/2/1 columns) → single column.

### /leads

- **Purpose:** view and manage the lead pipeline.
- **Layout:** filterable table (or board grouped by stage).
- **Components:** search/filter/segment; lead table rows (name, Page/contact, status, score, tags, owner, last activity); stage selector/board view toggle; bulk actions.
- **User actions:** filter/search; open a lead; change stage; assign; tag; export.
- **Empty state:** "No leads yet" with guidance to connect a Page and answer messages.
- **Loading state:** skeleton table rows.
- **Error state:** banner on fetch failure with retry.
- **Success state:** stage changes reflected immediately with toast + undo.
- **Mobile behavior:** table becomes stacked cards; board becomes vertical list.
- **Accessibility:** status/stage in text labels; sortable headers exposed to screen readers.
- **Responsive behavior:** table → cards; board columns collapse vertically.

### /leads/[id]

- **Purpose:** view and edit a single lead in detail.
- **Layout:** header (contact identity + lead status/score/owner) + tabs (Overview, Conversation history, Activity).
- **Components:** contact fields; lead stage selector; tag editor; score breakdown; product-interest attribution; notes; conversation history; activity timeline.
- **User actions:** edit fields; change stage; add/remove tags; add note; open linked conversation.
- **Empty state:** n/a.
- **Loading state:** skeleton for detail sections.
- **Error state:** "Lead not found" empty/error state; per-section error with retry.
- **Success state:** save confirms with toast + undo.
- **Mobile behavior:** tabs become horizontal scroll; sections stacked.
- **Accessibility:** form labels tied to fields; timeline readable linearly.
- **Responsive behavior:** two-column detail → single column.

### /campaigns

- **Purpose:** list and manage campaigns.
- **Layout:** table or card list of campaigns.
- **Components:** campaign rows (name, audience, status [draft/scheduled/active/paused/completed/canceled], sent/failed counts, schedule); "New campaign" button; actions (view, edit, cancel).
- **User actions:** create; open; edit; cancel a campaign.
- **Empty state:** "No campaigns" + "New campaign" CTA.
- **Loading state:** skeleton rows.
- **Error state:** banner on fetch failure; per-campaign failure surfaced.
- **Success state:** status changes reflect with toast.
- **Mobile behavior:** rows become stacked cards.
- **Accessibility:** status as text badge; actions keyboard-accessible.
- **Responsive behavior:** table → cards.

### /campaigns/new

- **Purpose:** create a campaign (Flow 5 of `05-user-flows.md`).
- **Layout:** step wizard (Setup → Template → Audience → Review).
- **Components:** name; template picker/editor; audience segment selector; eligibility preview (eligible/ineligible counts); schedule (send now/later); cancel/save buttons.
- **User actions:** build campaign; run eligibility check; preview; schedule; save draft; launch.
- **Empty state:** no eligible contacts → warning + guidance to build audience.
- **Loading state:** spinner during eligibility computation.
- **Error state:** eligibility errors; missing template/audience flagged inline.
- **Success state:** launch (or draft save) confirms with summary + redirect to `/campaigns/[id]`.
- **Mobile behavior:** wizard stepper collapses; fields stack.
- **Accessibility:** eligibility breakdown in text; errors tied to fields.
- **Responsive behavior:** two-pane review → single column.

### /campaigns/[id]

- **Purpose:** view a campaign's configuration and delivery results.
- **Layout:** header (name, status, schedule, actions) + tabs (Overview, Deliveries, Analytics).
- **Components:** status/schedule; delivered/failed metrics; recipient breakdown; cancel/edit; delivery log; export.
- **User actions:** view results; edit; cancel; export.
- **Empty state:** no deliveries yet → status explanation.
- **Loading state:** skeleton for results.
- **Error state:** banner for partial/failed delivery with retry guidance.
- **Success state:** live-updated metrics.
- **Mobile behavior:** tabs horizontal scroll; metric cards stack.
- **Accessibility:** charts backed by textual data/summary.
- **Responsive behavior:** grid → single column.

### /automation

- **Purpose:** list and manage automations.
- **Layout:** card/table of automations.
- **Components:** automation rows (name, trigger, status enabled/disabled, last run, run count); "New automation" button; enable/disable toggle; view/edit.
- **User actions:** create; enable/disable; open; edit.
- **Empty state:** "No automations" + CTA.
- **Loading state:** skeleton rows.
- **Error state:** per-automation error flag (failed runs); banner on fetch failure.
- **Success state:** toggle reflects with toast.
- **Mobile behavior:** cards stack.
- **Accessibility:** enable/disable as labeled toggle, not color only.
- **Responsive behavior:** table → cards.

### /automation/new

- **Purpose:** build an automation in the visual builder (Flow 6 of `05-user-flows.md`).
- **Layout:** canvas builder with node panel (left) + canvas (center) + properties (right).
- **Components:** trigger selector; condition nodes; action nodes; delay/branch controls; variable/template editor; test mode; enable toggle; save.
- **User actions:** compose trigger→conditions→actions; configure; test; save; enable.
- **Empty state:** blank canvas with "Add trigger" prompt.
- **Loading state:** spinner while saving/testing.
- **Error state:** validation errors on node config; test failure details.
- **Success state:** test pass confirmation; save/enable toast.
- **Mobile behavior:** canvas degrades to a simplified list-based editor; properties become a sheet.
- **Accessibility:** nodes operable by keyboard; canvas provides a list fallback.
- **Responsive behavior:** three-pane → stacked/sheet layout on smaller screens.

### /analytics

- **Purpose:** view workspace and per-Page performance.
- **Layout:** filter bar (date range, Page, agent) + metric cards + charts + tables.
- **Components:** metrics (response time, conversations, leads, campaign delivery/engagement, automation runs); charts; per-Page/agent breakdown tables; export.
- **User actions:** filter; drill down; export.
- **Empty state:** no data for current filter → guidance + clear filters.
- **Loading state:** skeleton charts/cards.
- **Error state:** banner on fetch failure with retry.
- **Success state:** data rendered with interactive filters.
- **Mobile behavior:** charts stack; tables → cards.
- **Accessibility:** charts backed by accessible data tables/summaries.
- **Responsive behavior:** multi-column grid → single column.

### /team

- **Purpose:** manage workspace members and roles.
- **Layout:** member table/list + role legend.
- **Components:** member rows (name, email, role, status); invite member form; role selector (Owner/Admin/Member/Agent); remove/revoke actions.
- **User actions:** invite; assign/change role; remove member; resend invite.
- **Empty state:** only-owner state explanation; invite CTA.
- **Loading state:** skeleton rows.
- **Error state:** invite failure (invalid email, existing member) inline.
- **Success state:** invite/role change confirms with toast.
- **Mobile behavior:** rows → cards; invite form collapses.
- **Accessibility:** role conveyed with text; permission changes announced.
- **Responsive behavior:** table → cards.

### /settings

- **Purpose:** workspace and account configuration.
- **Layout:** grouped sections (Workspace, Business info, Messaging, Notifications, AI knowledge, Billing/usage placeholder, Account, Access).
- **Components:** forms for each section; toggles; save per section; timezone/default tone; off-hours handling; AI knowledge textarea; subscription/usage placeholder; logout/delete.
- **User actions:** edit/save settings; manage notifications; update AI knowledge; view usage.
- **Empty state:** n/a.
- **Loading state:** skeleton form controls; spinner on save.
- **Error state:** field validation; save failure banner.
- **Success state:** "Saved" toast per section.
- **Mobile behavior:** sections stacked with sticky section nav/horizontal tabs.
- **Accessibility:** labeled controls; grouped fieldsets with legends.
- **Responsive behavior:** two-column section/body → single column.

### /ai-assistant

- **Purpose:** run workflows via natural language with safe confirmation (Flow 7 of `05-user-flows.md`; model in `19-ai-assistant.md`).
- **Layout:** conversational panel: message thread (top) + input (bottom) + optional context/summary side panel.
- **Components:** instruction input; assistant message list (classification chips READ/PREPARE/WRITE/EXTERNAL); **confirmation card** (what-will-happen summary: recipients, target Page, message preview, eligibility) with **Approve / Cancel / Edit**; results summary; suggested follow-ups.
- **User actions:** type instruction; view preview; approve/cancel/edit external actions; undo soft writes.
- **Empty state:** greeting + example prompts; capability hints.
- **Loading state:** "working" indicator while classifying/planning.
- **Error state:** tool failure surfaced with explanation + suggested next step (per `19-ai-assistant.md`); declined confirmation → "cancelled, nothing sent."
- **Success state:** executed actions summarized; failures itemized; references to affected entities.
- **Mobile behavior:** full-screen; context panel hidden; confirmation card takes priority.
- **Accessibility:** results announced via `aria-live`; confirm/cancel are keyboard-focusable; classification and confirmation text (not icon-only).
- **Responsive behavior:** side panel → overlay below desktop width.
