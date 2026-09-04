# 13 — Meta / Facebook Integration (Authoritative Reference)

> **Source authority.** This document reflects Meta's official documentation as of the research date (Messenger Platform, Pages API, Graph API, Permissions Reference, Access Token docs, Messenger Platform & IG Messaging API policy, Rate Limits). Where Meta's own docs are ambiguous or subject to change, it is flagged as an **Assumption** or **Verify-before-launch**. Never build around a restriction; design *within* it.

---

## 1. Overall Connection Flow

The canonical flow (from Pages API "How It Works"):

```
App User (business)
   └─ Facebook Login for Business (OAuth) ──► User Access Token
          └─ GET /me/accounts ──► list of Pages + Page Access Tokens (per Page)
                 └─ capture Page ID + Page Access Token
                        └─ Graph API calls on behalf of that Page
                        └─ subscribe to Webhooks for messaging events
```

Key facts:
- Page Access Tokens are **unique per (Page, app User, app)** and **expire**.
- The app user **must own or be able to perform a Task on the Page** to obtain its token.
- `pages_show_list` is the base permission to list managed Pages. `pages_messaging` is required to manage/send Messenger conversations.

---

## 2. Meta Developer App Setup

1. Create a Meta App (type: **Business**).
2. Add the products/permissions needed (below).
3. Configure **Facebook Login** (with "Login for Business" when targeting business clients).
4. Configure **Webhooks** (subscription + callback URL + Verify Token).
5. In **Development Mode**, only App Roles can test. Test thoroughly.
6. To go live: complete **App Review** for each required permission/feature, and (if required) **Business Verification** (required for Advanced Access and some permissions).

### App modes
- **Development mode** — no App Review needed to test with app admins/roles/testers.
- **Live mode** — requires App Review approvals for permissions/features used by non-role users.

> **Assumption:** The exact UI labels/flow in the App Dashboard change over time. Always re-check `developers.facebook.com` when configuring.

---

## 3. Required Permissions & Classification

Classification legend:
- **AVAILABLE** — usable with standard/development access, no review (with app roles in dev).
- **REQUIRES USER AUTHORIZATION** — granted by the end user during login.
- **REQUIRES APP REVIEW** — needs approval to use in Live mode with non-role users.
- **REQUIRES ADDITIONAL APPROVAL / ELIGIBILITY** — special business/feature eligibility.
- **RESTRICTED** — limited use cases / requires special access.
- **NOT AVAILABLE** — we do not use it (wrong channel/capability) or unsupported.

| Permission | Purpose (our use) | Dependencies | Classification |
| --- | --- | --- | --- |
| `public_profile` | Basic identity during login | none | AVAILABLE |
| `email` | Optional: read email (login convenience) | none | REQUIRES USER AUTHORIZATION + APP REVIEW |
| `pages_show_list` | List Pages a user manages | none | REQUIRES USER AUTHORIZATION + APP REVIEW |
| `pages_read_engagement` | Read Page content/metadata/insights | `pages_show_list` | REQUIRES USER AUTHORIZATION + APP REVIEW |
| `pages_manage_metadata` | Subscribe webhooks, update Page settings | `pages_show_list` | REQUIRES USER AUTHORIZATION + APP REVIEW |
| `pages_messaging` | **Manage/access Page conversations & send messages** | `pages_manage_metadata`, `pages_show_list` | REQUIRES USER AUTHORIZATION + APP REVIEW |
| `pages_user_locale` | (Optional) Customer locale for localized replies | none | REQUIRES APP REVIEW |
| `pages_user_timezone` | (Optional) Avoid messaging at bad hours | none | REQUIRES APP REVIEW |
| `pages_user_gender` | (Optional) Pronoun/pronoun handling | none | REQUIRES APP REVIEW |
| `read_insights` | Page insights for analytics | `pages_read_engagement`, `pages_show_list` | REQUIRES USER AUTHORIZATION + APP REVIEW |
| `business_management` | (Optional/future) Business Manager assets | `pages_read_engagement`, `pages_show_list` | REQUIRES APP REVIEW |
| `leads_retrieval` | (Future) Lead Ads retrieval | several (ads + pages) | REQUIRES ADDITIONAL APPROVAL |
| `marketing_messages_messenger` | (Future) Marketing Messages | `ads_management`, `pages_messaging` | REQUIRES ADDITIONAL ELIGIBILITY |
| `pages_utility_messaging` | (Future) Utility messages/templates | none | REQUIRES APP REVIEW |
| `pages_manage_posts` | (Future) Publish Posts | `pages_read_engagement`+ | REQUIRES APP REVIEW |
| Instagram messaging perms | (Non-MVP) IG DMs | — | NOT AVAILABLE (out of scope) |

**MVP permission set:** `pages_show_list`, `pages_messaging`, `pages_manage_metadata`, `pages_read_engagement`. Optionally `email` and `read_insights`. Everything else is future scope.

> **Note:** Selecting unneeded permissions is a common App Review rejection reason. We request *only* what MVP needs.

---

## 4. Access Tokens

### Token types (from Access Tokens doc)

| Type | Use | Lifespan |
| --- | --- | --- |
| User Access Token | OAuth login; exchanged for Page tokens | short (1–2h) or long-lived (~60 days) |
| Page Access Token | Act on behalf of a Page (send/receive) | expiring (see below) |
| App Access Token | App-level settings only | n/a |
| System User Token | Automated actions without user re-auth | long-lived (Marketing API Standard Access) |

### Lifecycle & refresh
- Web login yields a **short-lived** user token (1–2h). Exchange for **long-lived** (~60d) server-side with app secret.
- Do **not** depend on lifetimes; tokens can expire early or be invalidated (password change, permission revocation, app review changes).
- Page tokens are derived from user tokens; when the underlying user token expires/revokes, Page access breaks → reauthorization needed.
- Meta may require re-grant if a permission is unused ~90 days.

### Our token strategy
1. Receive short-lived user token at OAuth callback.
2. Server-side: exchange for long-lived user token.
3. Server-side: `GET /me/accounts` → collect each Page's `id`, `name`, `tasks`, and Page access token.
4. **Store encrypted at rest** (envelope encryption; see `23-security.md`). Never in the client, never in logs.
5. Track `expires_at` and validity; run a proactive reauthorization check and surface "reconnect" when stale.
6. On any `190` (expired) or `10` (permissions) error → mark token invalid, notify user to reconnect.

> **Assumption:** Page access token absolute expiration behavior (some Page tokens historically long-lived/never-expire for certain app types) is not fully documented. We store `expires_at` when Meta returns it and treat absence as "monitor proactively."

---

## 5. Pages API Endpoints We Use

- `POST /oauth/access_token` — exchange short→long-lived user token.
- `GET /me/accounts` — list authorized Pages + tokens + tasks.
- `GET /{page-id}` — Page metadata (name, category, picture).
- `GET /{page-id}/conversations` + fields — (Messenger) list conversations (used to backfill/sync; primary ingestion is webhooks).

All subject to **rate limits** (below).

---

## 6. Messenger Platform — Sending Messages

### Endpoint
`POST /{page-id}/messages` (Graph API). Required: Page access token, recipient PSID, `messaging_type`, message content.

### `messaging_type` values
- `RESPONSE` — reply to a received message; promotional allowed; **within 24h window**.
- `UPDATE` — proactive, still **within 24h window**.
- `TAGGED` — outside window; requires a valid Message Tag; **non-promotional** only.
- (Future) `MARKETING`, utility messages, one-time notification, sponsored messages.

### The 24-hour Standard Messaging Window (critical)
- A person's message (or other listed actions) **opens a 24-hour window** during which the business may send messages (including promotional).
- After the window closes, sending requires a **Message Tag** (approved use case, non-promotional) — otherwise the send will fail.
- Window-opening actions include: sending a message, clicking Get Started / CTA, Click-to-Messenger ad then message, plugin message, reacting to a message, commenting on a post, posting a visitor post, clicking m.me link with `ref`.

### Message Tags (for outside-window sends)
Examples of supported tags (verify current list before launch): `CONFIRMED_EVENT_UPDATE`, `ACCOUNT_UPDATE`, `POST_PURCHASE_UPDATE`, `HUMAN_AGENT` (manual reply within 7 days), and others. Tags are **non-promotional** and restricted to their use case.

> **Important (dated change):** Effective April 27, 2026, tags `CONFIRMED_EVENT_UPDATE`, `ACCOUNT_UPDATE`, and `POST_PURCHASE_UPDATE` return error code 100 (per current docs). This is a moving target — **always re-check the supported tag list before each release.**

### Recipient ID
- **PSID** (Page-scoped ID) — the only ID we use for Messenger messaging. App-scoped User IDs do **not** work for Messenger.

### Delivery & read tracking
- `message_deliveries`, `message_reads`, `messaging_seen` webhooks inform sent/delivered/read state.

### Error handling (common codes)

| Code | Meaning | Our response |
| --- | --- | --- |
| 10 | Permissions error | Verify `pages_messaging` + valid token; surface as "Page needs reconnection" |
| 100 | Invalid parameter | Validation bug — fix payload, log |
| 190 | Access token expired | Mark token invalid, request re-auth |
| 551 / 1545041 | Person unavailable (blocked/deactivated) | Mark recipient unavailable; no retry |
| 613 | Rate limit exceeded | Backoff + retry with jitter |

---

## 7. Webhooks (Messenger events) — see `14-webhook-architecture.md`

Subscribe to `messages`, `message_deliveries`, `message_reads`, `messaging_seen`, `message_echoes` (and `messaging_postbacks` for menus/buttons). Event payload uses `object: "page"`, `entry[].id` (Page ID), `entry[].messaging[]`.

---

## 8. Rate Limits (from Rate Limits doc)

**Messenger Platform** (per Page):
- Send API: **300 calls/sec** per Page (text/links/reactions/stickers); **10 calls/sec** for audio/video; may also be limited per-thread.
- Conversations API: **2 calls/sec** per Page.
- Overall rolling 24h: `200 × Engaged Users`.
- Pages API (Page/system token): `4800 × Engaged Users` per 24h.
- Platform (app/user token): `200 × Daily Active Users` per hour.

**Our mitigation:** queue and throttle sends to stay well under 300/s; cache conversations; respect `X-App-Usage` / `X-Business-Use-Case-Usage` headers; on codes `4/17/32/613/80001/80006`, back off with jitter (see `15-messaging-engine.md`).

---

## 9. App Review & Production Requirements

- **App Review** required for Advanced Access to permissions before Live mode with non-role users.
- **Business Verification** required for Advanced Access and certain features.
- Provide use-case descriptions + **screencasts** demonstrating the login flow and the exact capability (e.g., sending a message and showing it in the Messenger client).
- **Messaging policies** to honor: standard messaging (24h), message tags (approved use cases only), one-time notification, private replies (7 days), sponsored messages (out of scope), responsiveness (hybrid/manual bots — respond within 30s for "automated" classification; we target the **hybrid/human** bot classification).
- **Automation disclosure:** where required by law (e.g., CA, DE) or best practice, disclose automated interaction ("You are talking to an automated assistant").

### Bot classification
We design PagePilot to be classified as **hybrid** (AI-assisted + human agents), not fully automated. This sidesteps the strict 30-second automated-bot responsiveness rule while still providing AI drafts and automation. Automation that auto-sends will be **opt-in per automation** and disclosed.

---

## 10. Policy Classification Matrix (what we can/can't do)

| Capability | Classification |
| --- | --- |
| Send a reply to a received message (within 24h, RESPONSE) | AVAILABLE (`pages_messaging`) |
| Send proactive update within 24h (UPDATE) | AVAILABLE (`pages_messaging`) |
| Send outside 24h with a valid tag (non-promotional) | AVAILABLE (tag); requires `pages_messaging` |
| Send promotional outside 24h | RESTRICTED (advertiser-only: Sponsored/Marketing Messages) |
| Schedule future sends without checking window/tag | NOT AVAILABLE (must validate eligibility at send time) |
| Cold message a user who never contacted the Page | NOT AVAILABLE (conversation must be initiated by user) |
| Mass-broadcast to arbitrary PSIDs | RESTRICTED / policy-gated (campaigns only to eligible, opted/history contacts) |
| Retrieve lead-ads leads | REQUIRES ADDITIONAL APPROVAL (`leads_retrieval`) |
| Read private user data beyond messaging | REQUIRES APP REVIEW + specific permissions |
| Bypass 24h window | NOT AVAILABLE (prohibited by design) |

---

## 11. Compliance-by-design rules

1. Every outbound message records its `messaging_type` and `tag` (if any) and passes a **window/tag eligibility check before send**.
2. Never send a `TAGGED` message with promotional content.
3. Never send to a PSID who has not had a conversation with the Page.
4. Surface honest errors: "This contact is outside the 24-hour window and no eligible tag is available — message not sent."
5. Track reauthorization proactively and notify on expired/revoked tokens.
6. Keep Page tokens encrypted; rotate/refetch on reauth.

---

## 12. Open Questions / Verify Before Launch

- Exact current Supported Message Tag list (changes frequently; re-check `send-messages` + policy docs).
- Page token absolute expiry semantics per app type (verify empirically during Phase 4).
- Whether `read_insights` is needed for MVP analytics or if platform-side counters suffice (start MVP without it to reduce review surface).
- App Review screencast requirements for `pages_messaging` (re-read before submission).
