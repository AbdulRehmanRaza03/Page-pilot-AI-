# 12 — API Architecture

This document specifies the REST API for PagePilot's backend (FastAPI). It defines cross-cutting conventions and then enumerates endpoints grouped by module, with RBAC requirements.

Companion documents: `08-tech-stack.md` (stack), `09-frontend-architecture.md` (client), `21-knowledge-base.md` (KB surfaces). Backend modules: `auth`, `workspaces`, `facebook`, `pages`, `webhooks`, `messaging`, `conversations`, `contacts`, `campaigns`, `automation`, `ai`, `analytics`, `notifications`.

---

## 1. Global Conventions

### Base path

```
/api/v1
```

### Auth

- **Bearer JWT** in `Authorization: Bearer <token>`.
- Access token (short-lived) + refresh token (long-lived) returned from login.
- Workspace context: either a path param (`/w/{workspaceId}`) or `X-Workspace-Id` header, depending on endpoint. The server validates membership + permission.

### Content negotiation

- Requests: `application/json` (except multipart file uploads).
- Responses: `application/json`. UTF-8. ISO 8601 UTC timestamps (`2024-01-01T00:00:00Z`).

### Versioning

- URL-based major version (`/api/v1`). Breaking changes bump the major version; additive changes stay in `v1`.

### Error envelope

All non-2xx responses use a consistent envelope:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Conversation not found",
    "details": { "conversationId": "c_123" }
  }
}
```

- `code`: stable, machine-readable (kebab/snake). `message`: human-readable. `details`: optional object (field errors, identifiers).

### Pagination (cursor-based)

- **Cursor-based** pagination to remain correct under insert-heavy lists (inbox, messages).
- Query: `?cursor=<opaque>` and `?limit=<int>` (default 25, max 100).
- Response envelope:

```json
{
  "data": [ ... ],
  "pagination": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

### Filtering / sorting / search

- Filtering: `?filter[status]=open` or `?status=open` (module-consistent per resource).
- Sorting: `?sort=-createdAt` (`-` = descending).
- Search: `?q=text` (full-text over the resource's searchable fields).

### Rate limiting

- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- `429 Too Many Requests` when exceeded. Limits are per-user/per-tenant and documented per module where relevant.

---

## 2. RBAC Permission Keys

Permissions are workspace-scoped. Backend enforces; frontend mirrors (see `09-frontend-architecture.md`).

| Module | Permission keys |
| ------ | --------------- |
| users | `users.read`, `users.manage` |
| workspaces | `workspaces.read`, `workspaces.manage` |
| members/roles | `members.read`, `members.manage` |
| facebook/pages | `pages.read`, `pages.manage`, `pages.connect` |
| conversations | `conversations.read`, `conversations.assign`, `conversations.manage` |
| messaging | `messaging.send`, `messaging.read` |
| contacts | `contacts.read`, `contacts.write`, `contacts.manage` |
| labels | `labels.read`, `labels.manage` |
| campaigns | `campaigns.read`, `campaigns.send`, `campaigns.manage` |
| automations | `automation.read`, `automation.manage` |
| analytics | `analytics.read` |
| ai | `ai.read`, `ai.manage` |
| notifications | `notifications.read` |

---

## 3. Endpoints by Module

### auth

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `POST /auth/register` | Create account | Public | `email`, `password`, `name` | `user`, tokens | `VALIDATION_ERROR` |
| `POST /auth/login` | Authenticate | Public | `email`, `password` | `accessToken`, `refreshToken`, `user` | `INVALID_CREDENTIALS` |
| `POST /auth/refresh` | Rotate token | Public (refresh token) | `refreshToken` | `accessToken` | `INVALID_TOKEN` |
| `POST /auth/logout` | Invalidate token | Authenticated | — | `204` | — |
| `GET /auth/me` | Current user + memberships + permissions | Authenticated | — | `user`, `workspaces[]`, `permissions[]` | — |

### users

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `GET /users/me` | Profile | Authenticated | — | `user` | — |
| `PATCH /users/me` | Update profile | Authenticated | `name`, `avatar`, `timezone` | `user` | `VALIDATION_ERROR` |
| `GET /w/{workspaceId}/users` | List members | `users.read` | filters/sort | `users[]` | `FORBIDDEN` |

### workspaces

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `POST /workspaces` | Create workspace | Authenticated | `name` | `workspace` | `VALIDATION_ERROR` |
| `GET /workspaces` | List my workspaces | Authenticated | — | `workspaces[]` | — |
| `GET /w/{workspaceId}` | Workspace detail | `workspaces.read` | — | `workspace` | `FORBIDDEN`, `NOT_FOUND` |
| `PATCH /w/{workspaceId}` | Update workspace | `workspaces.manage` | `name`, `settings` | `workspace` | `FORBIDDEN` |

### members / roles

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `GET /w/{workspaceId}/members` | List members + roles | `members.read` | — | `members[]` | `FORBIDDEN` |
| `POST /w/{workspaceId}/members` | Invite member | `members.manage` | `email`, `roleId` | `member` | `VALIDATION_ERROR`, `FORBIDDEN` |
| `PATCH /w/{workspaceId}/members/{memberId}` | Change role | `members.manage` | `roleId` | `member` | `FORBIDDEN`, `NOT_FOUND` |
| `DELETE /w/{workspaceId}/members/{memberId}` | Remove member | `members.manage` | — | `204` | `FORBIDDEN` |
| `GET /w/{workspaceId}/roles` | List roles | `members.read` | — | `roles[]` | `FORBIDDEN` |

### facebook / pages

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `POST /w/{workspaceId}/facebook/connect` | Initiate Page connection (OAuth) | `pages.connect` | `redirectUrl` | `authorizeUrl` | `FORBIDDEN` |
| `GET /w/{workspaceId}/facebook/callback` | OAuth callback → save token + pages | Public (state-verified) | `code`, `state` | redirect | `INVALID_STATE` |
| `GET /w/{workspaceId}/pages` | List connected pages | `pages.read` | — | `pages[]` | `FORBIDDEN` |
| `POST /w/{workspaceId}/pages/{pageId}/subscribe` | Subscribe to webhooks | `pages.manage` | — | `page` | `UPSTREAM_ERROR` |
| `PATCH /w/{workspaceId}/pages/{pageId}` | Update page metadata/settings | `pages.manage` | `metadata` | `page` | `FORBIDDEN`, `NOT_FOUND` |
| `DELETE /w/{workspaceId}/pages/{pageId}` | Disconnect page | `pages.manage` | — | `204` | `FORBIDDEN` |

**Meta MVP permissions** surfaced during connect: `pages_show_list`, `pages_messaging`, `pages_manage_metadata`, `pages_read_engagement`.

### webhooks

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `POST /webhooks/meta` | Receive Meta webhook events | Meta signature (`X-Hub-Signature-256`) | `object`, `entry[]` | `200` | `INVALID_SIGNATURE` |
| `GET /webhooks/meta` | Webhook verification (hub challenge) | Meta | `hub.verify_token`, `hub.challenge` | `hub.challenge` | `VERIFICATION_FAILED` |

*(These are server-to-server; not user-facing.)*

### conversations

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `GET /w/{workspaceId}/conversations` | List/filter inbox | `conversations.read` | filters, `status`, `assigneeId`, `labelIds`, cursor | `conversations[]` + pagination | `FORBIDDEN` |
| `GET /w/{workspaceId}/conversations/{id}` | Conversation detail | `conversations.read` | — | `conversation`, `messages[]` | `NOT_FOUND`, `FORBIDDEN` |
| `PATCH /w/{workspaceId}/conversations/{id}` | Update status/labels/assignee | `conversations.manage` | `status`, `labelIds`, `assigneeId` | `conversation` | `FORBIDDEN`, `NOT_FOUND` |
| `POST /w/{workspaceId}/conversations/{id}/assign` | Assign to member | `conversations.assign` | `assigneeId` | `conversation` | `FORBIDDEN` |
| `POST /w/{workspaceId}/conversations/{id}/close` | Mark resolved | `conversations.manage` | — | `conversation` | `FORBIDDEN` |

### messages

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `GET /w/{workspaceId}/conversations/{id}/messages` | List messages (cursor) | `messaging.read` | cursor | `messages[]` + pagination | `FORBIDDEN` |
| `POST /w/{workspaceId}/conversations/{id}/messages` | Send message | `messaging.send` | `text`, `attachments[]` | `message` | `FORBIDDEN`, `RATE_LIMITED` |
| `POST /w/{workspaceId}/conversations/{id}/messages/{messageId}/seen` | Mark seen/read receipt | `messaging.read` | — | `204` | `NOT_FOUND` |

### contacts / leads

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `GET /w/{workspaceId}/contacts` | List contacts/leads | `contacts.read` | filters, `q`, `labelIds`, cursor | `contacts[]` + pagination | `FORBIDDEN` |
| `GET /w/{workspaceId}/contacts/{id}` | Contact detail | `contacts.read` | — | `contact`, `conversations[]` | `NOT_FOUND` |
| `POST /w/{workspaceId}/contacts` | Create contact | `contacts.write` | `name`, `handle`, `fields` | `contact` | `VALIDATION_ERROR`, `FORBIDDEN` |
| `PATCH /w/{workspaceId}/contacts/{id}` | Update contact/lead | `contacts.write` | `fields`, `stage` | `contact` | `FORBIDDEN`, `NOT_FOUND` |
| `DELETE /w/{workspaceId}/contacts/{id}` | Delete contact | `contacts.manage` | — | `204` | `FORBIDDEN` |
| `POST /w/{workspaceId}/contacts/{id}/labels` | Attach labels | `contacts.write` | `labelIds[]` | `contact` | `FORBIDDEN` |

### labels

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `GET /w/{workspaceId}/labels` | List labels | `labels.read` | — | `labels[]` | `FORBIDDEN` |
| `POST /w/{workspaceId}/labels` | Create label | `labels.manage` | `name`, `color` | `label` | `VALIDATION_ERROR`, `FORBIDDEN` |
| `PATCH /w/{workspaceId}/labels/{id}` | Update label | `labels.manage` | `name`, `color` | `label` | `FORBIDDEN`, `NOT_FOUND` |
| `DELETE /w/{workspaceId}/labels/{id}` | Delete label | `labels.manage` | — | `204` | `FORBIDDEN` |

### campaigns

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `GET /w/{workspaceId}/campaigns` | List campaigns | `campaigns.read` | filters, cursor | `campaigns[]` + pagination | `FORBIDDEN` |
| `POST /w/{workspaceId}/campaigns` | Create campaign | `campaigns.manage` | `name`, `messageTemplate`, `audience` | `campaign` | `VALIDATION_ERROR` |
| `GET /w/{workspaceId}/campaigns/{id}` | Campaign detail | `campaigns.read` | — | `campaign` | `NOT_FOUND` |
| `PATCH /w/{workspaceId}/campaigns/{id}` | Update campaign | `campaigns.manage` | partial fields | `campaign` | `FORBIDDEN` |
| `POST /w/{workspaceId}/campaigns/{id}/send` | Send campaign | `campaigns.send` | `audience` (optional override) | `campaignRun` | `FORBIDDEN`, `RATE_LIMITED` |
| `POST /w/{workspaceId}/campaigns/{id}/cancel` | Cancel run | `campaigns.send` | — | `campaignRun` | `FORBIDDEN` |
| `GET /w/{workspaceId}/campaigns/{id}/runs` | List runs + status | `campaigns.read` | — | `runs[]` | `FORBIDDEN` |

### automations

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `GET /w/{workspaceId}/automations` | List automations | `automation.read` | — | `automations[]` | `FORBIDDEN` |
| `POST /w/{workspaceId}/automations` | Create automation | `automation.manage` | `trigger`, `conditions`, `actions` | `automation` | `VALIDATION_ERROR` |
| `PATCH /w/{workspaceId}/automations/{id}` | Update automation | `automation.manage` | partial fields | `automation` | `FORBIDDEN` |
| `POST /w/{workspaceId}/automations/{id}/toggle` | Enable/disable | `automation.manage` | `enabled` | `automation` | `FORBIDDEN` |
| `DELETE /w/{workspaceId}/automations/{id}` | Delete automation | `automation.manage` | — | `204` | `FORBIDDEN` |

### analytics

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `GET /w/{workspaceId}/analytics/overview` | Key metrics | `analytics.read` | `from`, `to` | `metrics{}` | `FORBIDDEN` |
| `GET /w/{workspaceId}/analytics/conversations` | Conversation volume/response metrics | `analytics.read` | `from`, `to`, `groupBy` | `series[]` | `FORBIDDEN` |
| `GET /w/{workspaceId}/analytics/campaigns` | Campaign performance | `analytics.read` | `from`, `to` | `series[]` | `FORBIDDEN` |
| `GET /w/{workspaceId}/analytics/export` | Export report (CSV) | `analytics.read` | filters | file | `FORBIDDEN` |

### ai

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `POST /w/{workspaceId}/ai/draft` | Get AI-drafted reply suggestion (PREPARE) | `ai.read` | `conversationId`, `context` | `draft` | `FORBIDDEN` |
| `POST /w/{workspaceId}/ai/assistant` | Run assistant (READ/PREPARE/WRITE) | `ai.read` | `conversationId`, `instruction` | `actions[]`, `draft?` | `FORBIDDEN` |
| `POST /w/{workspaceId}/ai/assistant/confirm` | Confirm EXTERNAL action | `ai.manage` | `actionId`, `confirm=true` | `actionResult` | `FORBIDDEN`, `EXPIRED` |
| `GET /w/{workspaceId}/ai/runs` | List assistant runs | `ai.read` | cursor | `runs[]` | `FORBIDDEN` |
| `GET /w/{workspaceId}/ai/runs/{id}` | Run detail + tool-call trace | `ai.read` | — | `run`, `toolCalls[]` | `NOT_FOUND` |

> The assistant operates a **controlled tool surface** using action classes `READ`, `PREPARE`, `WRITE`, and `EXTERNAL`. `EXTERNAL` always requires explicit confirmation via `confirm` before execution.

### notifications

| Method + Path | Purpose | Auth | Key request | Key response | Errors |
| ------------- | ------- | ---- | ----------- | ----------- | ------ |
| `GET /w/{workspaceId}/notifications` | List notifications | `notifications.read` | cursor, `unreadOnly` | `notifications[]` | `FORBIDDEN` |
| `POST /w/{workspaceId}/notifications/read` | Mark all read | `notifications.read` | — | `204` | `FORBIDDEN` |
| `GET /w/{workspaceId}/notifications/ws` | (WebSocket) real-time stream | `notifications.read` | — | events | `FORBIDDEN` |

---

## 4. Cross-cutting notes

- All `WRITE`/`EXTERNAL` actions on behalf of the AI (`ai/assistant`, `ai/assistant/confirm`) are logged to the audit trail.
- Meta-facing calls (sending messages via Send API) are performed server-side by Celery workers; the REST API only orchestrates and reports status.
- Endpoints that proxy to Meta return `UPSTREAM_ERROR` (5xx) with upstream details sanitized in `details`.
