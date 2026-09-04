# 17 — Campaign System (Compliant Messaging)

> **Scope.** How PagePilot schedules and delivers bulk-but-compliant outreach to an audience, and — critically — how it stays within Meta's Standard Messaging policy. This is **not** an arbitrary "broadcast to anyone" feature. Meta constraints (24h window, tags, marketing vs. sponsored messages) are authoritative in `13-meta-integration.md`.

---

## 1. What a Campaign Is (and Is Not)

A **campaign** is a scheduled, audience-targeted, templated send of messages to **eligible** contacts.

A campaign is **not**:
- A cold blast to arbitrary PSIDs.
- A way to send promotional messages to users outside the 24-hour window.
- A Marketing Messages / Sponsored Messages blast (that requires advertiser eligibility and is **out of scope for MVP**).

---

## 2. The Policy Boundary (Read First)

Meta's Standard Messaging rules define exactly what a campaign may do:

| Scenario | Allowed? | Mechanism |
| --- | --- | --- |
| Send to a contact **within** their 24h window (any content, incl. promotional) | ✅ | `RESPONSE`/`UPDATE` |
| Send to a contact **outside** the window with a **valid Message Tag** (non-promotional) | ✅ | `TAGGED` |
| Send **promotional** content outside the window | ❌ | Prohibited under Standard Messaging |
| Cold-message a PSID who never messaged the Page | ❌ | Prohibited (conversation must be user-initiated) |
| True out-of-window promotional blast to a list | ❌ under MVP | Requires **Marketing Messages / Sponsored Messages** (advertiser-only, eligibility-gated) |

> **Key design stance:** a campaign's sends **check the 24-hour window and/or a valid tag at send time for each recipient**, and **honestly surface** anyone who is ineligible rather than silently skip or (worse) attempt a policy-violating send.

---

## 3. Campaign Creation Flow

1. **Define the campaign** (name, goal, message template, schedule).
2. **Select audience** via a saved segment (`campaign_audiences`; see `16-lead-crm.md`) — e.g., "leads interested in X, contacted in last 7 days" — **or** an explicit narrowed set of already-conversation contacts.
3. **Compose message template** (with personalization variables where supported).
4. **Set schedule** (send now / send at time).
5. **Preview eligibility** — the system previews how many recipients are currently in-window vs. would need a tag (informational).
6. **Activate** — recipients are materialized into `campaign_recipients`, then fanned out as `outbound_jobs` (type `campaign_item`) with `scheduled_for`.

---

## 4. Audience Selection via Segmentation

- Audiences come from **segments** (saved filters) — they are **dynamic**, evaluated against current contact/segment state.
- Segment → campaign resolution produces candidate `contacts`, each becoming a `campaign_recipients` row with an initial `status = pending`.
- Because segments are dynamic, the campaign always targets **present reality**, but the final arbiter is the **send-time eligibility gate** (section 5), which is authoritative regardless of segment state.

---

## 5. Send-Time Eligibility (Per Recipient)

At fan-out (and re-checked at execution), each recipient is classified:

1. **In 24h window** (recent inbound interaction) → **eligible**, send with `RESPONSE`/`UPDATE`.
2. **Outside window + valid non-promotional tag** (if the campaign is tagged/non-promotional) → **eligible**, send `TAGGED`.
3. **Outside window, no eligible tag** (or promotional content outside window) → **ineligible/skipped**, honest reason recorded.
4. **Blocked/deactivated PSID** → **skipped** (permanent), no retry.

Each `campaign_recipients` row stores an `eligibility` JSONB capturing the check result and reason (`in_window`, `tagged`, `out_of_window`, `promotional_out_of_window`, `unavailable`, etc.).

---

## 6. Queueing & Delivery

- Eligible recipients → `outbound_jobs` (`job_type = campaign_item`, `scheduled_for`) → drained by the send worker.
- The send worker enforces per-Page rate limiting (300/s) and per-recipient retry policy (`15-messaging-engine.md`).
- Each recipient transitions `pending → queued → sent / failed / skipped`.

---

## 7. Failed Messages & Retry

- Transient failures (`613`, etc.) → retry with exponential backoff + jitter (bounded).
- Permanent failures (`100`, `190`, `551`) → `failed`/`permanent_fail`, recorded reason, **no blind retry**.
- Failed recipients are surfaced on the campaign detail page with the reason, and can be manually re-targeted.

---

## 8. Honest Surfacing of Skipped / Ineligible Recipients

- A campaign always shows a **breakdown**: `sent`, `failed`, `skipped` (with sub-reasons), and `pending`.
- Reasons are human-readable and honest, e.g.:
  - "Outside 24-hour messaging window; no eligible tag."
  - "Promotional content cannot be sent outside the window."
  - "Contact no longer available (blocked)."
- **No recipient is silently dropped.** Every non-sent recipient has a recorded, viewable reason.

---

## 9. Cancellation

- A campaign can be **cancelled** any time before/while sending.
- Cancellation marks pending/queued `campaign_recipients` and `outbound_jobs` as `cancelled` and stops the worker from draining them.
- Already-sent messages are not retracted (Messenger has no recall) — cancellation only prevents *future* sends.
- A "pause" is the softer sibling that stops new sends but may be resumed.

---

## 10. Campaign Analytics

Per campaign (and aggregate):

- **Reach & delivery:** total, sent, delivered, read (from `message_events` via `message_deliveries`/`message_reads`).
- **Eligibility funnel:** candidate → eligible → sent → delivered → read.
- **Engagement:** replies, postback/CTA clicks, leads generated (status changes to `qualified`/`won` attributed to the campaign).
- **Outcome:** contacts whose `lead_status` advanced or who completed a goal during the campaign window.

---

## 11. Explicit Out-of-Scope (for MVP)

- **Marketing Messages / Sponsored Messages** (promotional blasts outside the window) — requires advertiser eligibility, `marketing_messages_messenger`, and `ads_management` approval. **Deferred.**
- Cold-messaging non-contact PSIDs — prohibited; not built.
- One-time notifications (`pages_utility_messaging`) — deferred.

The campaign system exists to send **compliant**, window/tag-aware messages to **existing conversations**, and to make eligibility transparent.
