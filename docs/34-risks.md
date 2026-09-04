# 34 — Risk Register

Risk register for PagePilot. Each risk has **Probability**, **Impact**, **Mitigation** (reduce likelihood/impact), and **Contingency** (what we do if it materializes). Ratings use High / Medium / Low.

## 1. Meta API Changes

- **Probability:** High — Meta deprecates/changes Graph API, Permissions, versions, or message-tag lists frequently (see `13-meta-integration.md`).
- **Impact:** High — breaking changes can halt messaging, webhooks, or OAuth.
- **Mitigation:** Pin `META_API_VERSION`; isolate all Meta calls behind a `MetaClient` seam; contract tests via `respx`; subscribe to Meta changelog; treat `13-meta-integration.md` as a living doc with "Verify-before-launch" flags.
- **Contingency:** Feature-flag/disable affected capability; hotfix to new API version/endpoint on a `hotfix/*` branch; run the re-verified tag/version list before each release.

## 2. App Review Delays / Rejections

- **Probability:** Medium-High — `pages_messaging` and other permissions require App Review + (possibly) Business Verification.
- **Impact:** High — blocks Live-mode launch for non-tester users.
- **Mitigation:** Request only MVP permissions; prepare screencasts/use-case docs early; test fully in Development mode; keep a clean separation of environments/apps.
- **Contingency:** Launch with app-admins/whitelisted testers while review is pending; iterate on the submission; maintain a manual "connector" fallback for early adopters.

## 3. Messaging Restrictions (24-hr window / tags)

- **Probability:** High — outbound sends are tightly constrained by the window + tag rules.
- **Impact:** Medium-High — messages are blocked; user expectation of "send anytime" is unmet.
- **Mitigation:** Enforce eligibility at the send service; honest, in-UI messaging ("outside window, no eligible tag"); design automation to skip ineligible recipients.
- **Contingency:** Surface a clear "eligible when…" explanation; recommend human follow-up within window; provide templates for in-window responses.

## 4. Rate Limits

- **Probability:** High — Messenger Send API (300/s) and platform limits can throttle bursts.
- **Impact:** Medium — delayed/failed sends under campaign fan-out or automation spikes.
- **Mitigation:** Queue + throttle sends below limits; respect `X-App-Usage`/`X-Business-Use-Case-Usage`; backoff with jitter on `4/17/32/613`.
- **Contingency:** Slow/retry queues; alert on queue depth; pause non-critical campaign sends until limits clear.

## 5. Token Expiry / Revocation

- **Probability:** High — Page/user tokens expire early or are revoked (password change, permission revoke).
- **Impact:** High — Pages stop sending/receiving until reauthorized.
- **Mitigation:** Track `expires_at`; proactive reauthorization checks; handle `190`/`10` by marking invalid; notify user to reconnect.
- **Contingency:** Automated "reconnect" prompts + email; degrade to read-only status for affected Pages; treat as a first-class support runbook.

## 6. Webhook Reliability (drops, retries, ordering)

- **Probability:** Medium — network failures, Meta retries, or payload ordering issues.
- **Impact:** High — missed/duplicated messages.
- **Mitigation:** Ack before processing; idempotency via `meta_event_id`; signature verification; durable queue; handshake tests; monitor webhook latency.
- **Contingency:** Backfill via Conversations API (`GET /{page-id}/conversations`); replay from `webhook_events`; alert on signature failures.

## 7. AI Hallucination

- **Probability:** Medium — LLM produces plausible but false content.
- **Impact:** Medium-High — wrong summaries/replies erode trust; potentially harmful actions.
- **Mitigation:** Tool-only execution (no freeform DB/Meta); structured outputs; grounding with cited sources; strict schemas; bounded loops; context selection (no over-send).
- **Contingency:** Disable AI assistant; fall back to manual workflows; strengthen prompt/schema constraints; add fact-checking step for summaries.

## 8. Unauthorized AI Actions

- **Probability:** Medium — model proposes disallowed/overreaching action.
- **Impact:** High — sending to wrong recipients or taking irreversible action.
- **Mitigation:** READ/PREPARE/WRITE/EXTERNAL classification; **EXTERNAL always confirmed**; RBAC + tenant + policy re-validated server-side; only allowlisted tools; full `ai_action_logs` audit.
- **Contingency:** Kill-switch for AI EXTERNAL capability; require 2-step approval; revoke AI permissions by role.

## 9. Data Leakage (PII / message content)

- **Probability:** Medium — logs, LLM context, or client exposure.
- **Impact:** High — privacy/GDPR violation, trust loss.
- **Mitigation:** No secrets/PII in logs (redaction); minimal LLM context; encryption at rest + in transit; context selection scoped to workspace.
- **Contingency:** Incident response: purge affected logs/DB, rotate secrets, notify per policy; add log redaction rules.

## 10. Multi-Tenant Isolation Failure

- **Probability:** Low-Medium — a query/route mis-scoped.
- **Impact:** Critical — cross-tenant data access/actions.
- **Mitigation:** `workspace_id` on every table + filter; service-layer recheck; foreign-ID → 404; automated negative tests; cache/queue/storage tenant namespacing.
- **Contingency:** Automated cross-tenant test gates; immediate hotfix + audit; disable affected module.

## 11. Scaling (spikes in messages/workers)

- **Probability:** Medium — viral campaigns or many active workspaces.
- **Impact:** Medium — latency, queue backlog.
- **Mitigation:** Stateless API (horizontal scale); independent worker scaling; modular monolith (extract later); indexes + pagination; Redis pub/sub.
- **Contingency:** Scale workers/web instances; move to dedicated search (pg_trgm → engine); extract messaging service if queue isolation demands.

## 12. Message Delivery Failures

- **Probability:** Medium — recipient blocked/unavailable, provider errors.
- **Impact:** Medium-High — messages lost/not delivered.
- **Mitigation:** Delivery/read tracking; error mapping + retry policy; mark permanent failures (`551/1545041`) non-retryable.
- **Contingency:** Surface delivery state honestly; alert on high send-failure rate; manual follow-up runbooks.

## 13. Infrastructure Costs

- **Probability:** Medium — LLM + managed services scale with usage.
- **Impact:** Medium — margin erosion.
- **Mitigation:** MVP-pragmatic hosting (`28-deployment.md`); cache LLM calls where safe; monitor AI token/cost; metered usage tables ready for billing (see `35-future-roadmap.md`).
- **Contingency:** Reduce LLM model tier; add tiered pricing/limits; throttle non-essential AI.

## 14. (Supplementary) App Secret / Token Exfiltration

- **Probability:** Low — secrets manager + encryption + no-log rules.
- **Impact:** Critical — full Page impersonation.
- **Mitigation:** Envelope encryption (DEK/KEK in KMS); secrets in manager; no secrets in code/logs; rotation; least-privilege.
- **Contingency:** Rotate Meta app secret + all tokens immediately; revoke sessions; forensic audit; notify affected users.

---

## Summary Matrix

| # | Risk | Probability | Impact |
| --- | --- | --- | --- |
| 1 | Meta API changes | High | High |
| 2 | App review delays | Med-High | High |
| 3 | Messaging restrictions | High | Med-High |
| 4 | Rate limits | High | Medium |
| 5 | Token expiry/revocation | High | High |
| 6 | Webhook reliability | Medium | High |
| 7 | AI hallucination | Medium | Med-High |
| 8 | Unauthorized AI actions | Medium | High |
| 9 | Data leakage | Medium | High |
| 10 | Multi-tenant isolation | Low-Med | Critical |
| 11 | Scaling | Medium | Medium |
| 12 | Delivery failures | Medium | Med-High |
| 13 | Infrastructure costs | Medium | Medium |
| 14 | Secret/token exfiltration | Low | Critical |
