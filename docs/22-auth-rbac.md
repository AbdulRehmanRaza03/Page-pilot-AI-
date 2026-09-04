# 22 — Authentication & Role-Based Access Control

## 1. Authentication

### 1.1 App Auth vs. Meta OAuth (critical distinction)

| Concern | App authentication | Meta OAuth (Facebook Login) |
| --- | --- | --- |
| Purpose | Identify & authenticate a PagePilot **user** | Authorize PagePilot to **act on the user's Facebook Pages** |
| Credential | Email + password | Meta User Token → Page Access Token |
| Result | A PagePilot session (JWT) | Connected Pages + Page tokens (stored, encrypted) |
| Expiry/refresh | Refresh-token rotation | Meta token lifecycle (see `13-meta-integration.md`) |

**PagePilot's own authentication is email + password.** Facebook Login (OAuth) is *only* used to connect Facebook Pages; it is never how a user logs into PagePilot. Do not conflate the two flows in code or docs.

### 1.2 Endpoints & flows

- **Registration** — email + password → create `users` row + initial `workspaces` row (owner role). Emits a verification email.
- **Email verification** — single-use, expiring, hashed token (magic link). Account is `unverified` and functionally limited until verified.
- **Login** — verify credentials → issue access + refresh token pair.
- **Logout** — revoke the refresh token server-side; clear client tokens.
- **Password reset** — request → email with one-time, expiring, hashed reset token → set new password (rotates/revokes existing sessions).
- **Password policy** — minimum length (e.g., ≥ 8–12 chars), optional common/breached-password check, account lockout/friction after N failed attempts.

### 1.3 Session management

- **Access token** — short-lived JWT (e.g., 15 min). Contains `sub` (user id), `wid` (current workspace id), `roles` (scoped permissions for that workspace), and a `sid` (session id) for revocation support.
- **Refresh token** — long-lived, opaque, stored hashed server-side (never in the JWT, never in the client-accessible storage logs). Bound to `(user, session, device)`.
- **Rotation** — each `refresh` grants a new refresh token and invalidates the previous one. Reuse of an already-rotated token implies theft → revoke the whole session.
- **Revocation** — sessions can be revoked by user (logout/change password), by admin (deactivate user), or by the system (suspicious activity). Because tokens carry a `sid`, access tokens can be rejected for revoked sessions without a DB round trip on every check (or via a short-TTL denylist).
- **Idle/absolute expiry** — sessions expire after inactivity and hard-cap lifetime.

### 1.4 OAuth (Meta) — where appropriate

OAuth/OpenID is appropriate only for the **Meta Page-connection flow** and any *future* app-user SSO (Google/Microsoft). For app-user auth, email/password is the canonical path. Meta OAuth security (state/CSRF, token handling) is detailed in `23-security.md` and `13-meta-integration.md`.

---

## 2. Roles

Four roles per workspace:

| Role | Semantics |
| --- | --- |
| **Owner** | Full control including billing, member management, and workspace deletion. There is ≥1 owner per workspace. |
| **Admin** | Manage Pages, campaigns, automations, CRM data, and members (except removing owners). |
| **Member** | Operate day-to-day (inbox, messaging, CRM, campaigns) but cannot change billing/members or manage automations. |
| **Agent** | Narrow, front-line scope: view assigned conversations, reply, and view leads. Cannot send campaigns or manage automations/configuration. |

A user may hold different roles in different workspaces. Roles are resolved per workspace; a session bound to `wid` carries the effective permission set for that workspace.

### Role → permission mapping

Below, `✓` = granted by default, `—` = not granted. Owners/Admins can further restrict Members/Agents on a per-permission basis (deny-by-default subsections).

| Permission key | Owner | Admin | Member | Agent |
| --- | --- | --- | --- | --- |
| **Workspace** | | | | |
| `workspace.read` | ✓ | ✓ | ✓ | ✓ |
| `workspace.write` | ✓ | ✓ | — | — |
| `workspace.members.manage` | ✓ | ✓ | — | — |
| `workspace.billing` | ✓ | — | — | — |
| **Pages** | | | | |
| `pages.connect` | ✓ | ✓ | — | — |
| `pages.read` | ✓ | ✓ | ✓ | ✓ |
| `pages.manage` | ✓ | ✓ | — | — |
| **Inbox / Conversations** | | | | |
| `conversations.read` | ✓ | ✓ | ✓ | ✓ (scoped) |
| `conversations.read_all` | ✓ | ✓ | ✓ | — |
| `conversations.assign` | ✓ | ✓ | ✓ | — |
| `conversations.admin` (status, bulk, labels, snooze) | ✓ | ✓ | ✓ | — |
| **Messaging** | | | | |
| `messaging.send` | ✓ | ✓ | ✓ | ✓ (assigned only) |
| `messaging.send_all` | ✓ | ✓ | ✓ | — |
| **CRM / Contacts & Leads** | | | | |
| `contacts.read` | ✓ | ✓ | ✓ | ✓ (scoped) |
| `contacts.write` | ✓ | ✓ | ✓ | — |
| `contacts.export` | ✓ | ✓ | — | — |
| **Campaigns** | | | | |
| `campaigns.read` | ✓ | ✓ | ✓ | — |
| `campaigns.write` | ✓ | ✓ | ✓ | — |
| `campaigns.send` | ✓ | ✓ | ✓ | — |
| `campaigns.admin` | ✓ | ✓ | — | — |
| **Automation** | | | | |
| `automation.read` | ✓ | ✓ | — | — |
| `automation.manage` | ✓ | ✓ | — | — |
| **AI Assistant** | | | | |
| `ai.read` | ✓ | ✓ | ✓ | ✓ |
| `ai.prepare` | ✓ | ✓ | ✓ | ✓ |
| `ai.write` | ✓ | ✓ | ✓ | — |
| `ai.external` | ✓ | ✓ | ✓ | — |
| **Audit** | | | | |
| `audit.read` | ✓ | ✓ | — | — |

---

## 3. Permission Enforcement at the API Layer

RBAC is enforced server-side, per request, and is **never trusted from the client**. Model:

1. **Authentication middleware** validates the access token and attaches identity + `sid` + `wid`.
2. **Session check** rejects requests where the session is revoked/expired.
3. **Workspace resolution** — every resource query is scoped to `wid` (tenant). A request for an ID that does not belong to `wid` returns 404 (not 403, to hide existence).
4. **Authorization middleware** maps the route's required permission key (e.g., `conversations.assign`) against the effective permission set derived from the user's role for that workspace.
5. **Row-level/field-level scoping** for `Agent` role — e.g., `conversations.read` is limited to assigned conversations via a query filter, not a wholesale grant.
6. **Service-layer recheck** — mutations re-assert tenant + permission at the service boundary (defense in depth) so a buggy route can't leak across tenants.

FastAPI implementation sketch: a dependency `require("campaigns.send")` that raises `403` unless the caller's resolved permissions include the key; a dependency `current_workspace` provides the tenant scope injected into every repository call.

### Interaction with the AI Assistant

The assistant classifies each action as **READ / PREPARE / WRITE / EXTERNAL** (see `19-ai-assistant.md`). These classes map onto RBAC keys:

| AI class | Required RBAC key(s) | Confirmation |
| --- | --- | --- |
| READ | `ai.read` **and** the underlying resource's `*.read` | none |
| PREPARE | `ai.prepare` **and** relevant `*.write`/`*.read` for the draft | preview shown |
| WRITE | `ai.write` **and** the target resource's `*.write`/`*.assign` | bulk/irreversible |
| EXTERNAL | `ai.external` **and** `messaging.send` / `campaigns.send` / `automation.manage` | **always** |

The assistant cannot grant more than the underlying module permission allows. Even if the model emits an `EXTERNAL` action, the service layer still re-validates the concrete RBAC key (e.g., `campaigns.send`) and Meta policy eligibility before executing. A mismatch is refused and surfaced to the user.

---

## 4. Workspace Isolation

- **Tenancy model** — every domain entity (`pages`, `conversations`, `contacts`, `leads`, `campaigns`, `automations`, `ai_action_logs`) carries `workspace_id`.
- **Scope enforcement** — repository queries always filter by `workspace_id`; cross-tenant joins are impossible by construction.
- **Tokens are Page-scoped, not global** — stored Page tokens are associated with a workspace, never shared across workspaces.
- **No cross-workspace reads** — search, lists, counts, and AI context selection are all workspace-bounded (see `23-security.md` for the full isolation note).
- **Ownership of Page tokens** — connecting a Page into a workspace asserts the connector has that role-level permission and marks the Page/workspace binding; the same Page may not be double-bound without explicit re-connection.
