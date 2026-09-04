# 23 — Security

Production-grade security design for PagePilot. Authentication and RBAC are covered in `22-auth-rbac.md`; this document focuses on the security controls applied at every layer and the specific risks of a Meta-integrated messaging platform.

## 1. Authentication & Authorization

- See `22-auth-rbac.md` for email/password auth, JWT access + refresh tokens (rotation, revocation), and RBAC.
- **App auth** = email/password. **Meta OAuth** = Page connection only.

## 2. RBAC

- Server-side, per-request enforcement via FastAPI dependencies (`require("campaigns.send")`).
- Four roles (Owner, Admin, Member, Agent) mapped to a permission-key matrix.
- Row-level scoping for `Agent` (assigned conversations only).
- Never trust client-supplied roles. Roles are resolved from server state for the authenticated session.

## 3. Workspace Isolation (Tenant Scoping at Every Layer)

- **Primary key constraint:** every domain table carries `workspace_id`; it is part of secondary indexes and (where possible) included in unique constraints to prevent cross-tenant collisions.
- **Repository/queries:** all reads and writes are filtered by `workspace_id`, injected from the authenticated session's `wid` — never from request params the user controls.
- **Background workers (Celery):** every task carries `workspace_id` and is re-validated against the job's originating tenant before executing; tasks never accept a raw tenant ID from a message body alone.
- **Caching (Redis):** keys are namespaced by tenant (e.g., `ws:{wid}:...`) to prevent cache confusion.
- **File/object storage:** any stored media/attachments are keyed under `ws/{wid}/...` with per-tenant access checks, not a globally guessable path.
- **AI context selection:** only the current workspace's data is ever passed to the model (see `19-ai-assistant.md`).

## 4. OAuth Security (Meta Page Connection)

- **State / CSRF:** generate a cryptographically random `state`, bind it to the user's session/server-side store, and validate it on the OAuth callback before processing the code.
- **Code exchange:** exchange the authorization code (not tokens) server-side; store the redirect URI deterministic; use PKCE where supported.
- **Server-side only:** exchange short-lived user token → long-lived token → Page tokens entirely server-side. **Never** send Meta tokens to the frontend.
- **Callback validation:** pin the `redirect_uri`, validate it matches exactly, and ensure the callback is HTTPS-only.

## 5. Token Encryption at Rest (Envelope Encryption)

Access tokens (Meta User/Page tokens and any provider secrets) are stored **encrypted at rest** using envelope encryption:

1. **Data Encryption Keys (DEKs)** — a per-tenant (or per-token-set) DEK encrypts the plaintext with AES-256-GCM (authenticated encryption; nonce per record).
2. **Key Encryption Key (KEK)** — the DEK is wrapped by a KEK stored in a KMS/HSM (cloud KMS or managed secret store). The KEK never leaves the KMS.
3. **Rotation** — DEKs and KEKs are rotated on a schedule and on personnel/compromise events. Old ciphertext is re-wrapped on read.
4. Only the ciphertext + wrapped DEK are stored in the database; plaintext tokens exist only transiently in the process that needs them.

## 6. Secrets Management

- All secrets (Meta App Secret, DB credentials, Redis password, Celery broker creds, JWT signing keys, third-party API keys, AI provider keys) live in a **secrets manager** (e.g., AWS Secrets Manager / HashiCorp Vault / equivalent), referenced by the environment — not committed to source control, not in `.env` files.
- Per-environment separation (dev/staging/prod) and least-privilege IAM for secret access.
- Secrets are loaded at boot and never logged or included in exception messages.

## 7. API Security

- **Rate limiting** — per-IP (e.g., on auth endpoints to slow brute-force) and per-user/per-token (on all APIs), with Redis-backed sliding windows. Higher limits for the internal/whitelisted paths.
- **Input validation** — all inputs validated with Pydantic schemas (strict types, length caps, allowed enums, validation of IDs). Unknown fields rejected. Message/payload sizes bounded.
- **HTTPS everywhere** — TLS termination with modern ciphers; HSTS enabled.
- **Output encoding** — API responses are JSON; no raw HTML is reflected from user input.
- **CORS** — strict allowlist of origins; credentials only for trusted origins.

## 8. Injection & XSS Prevention

- **SQL injection** — use an ORM (SQLAlchemy) with parameterized queries exclusively; never string-interpolate SQL. Any raw SQL must use bound parameters only.
- **XSS** — the frontend renders user content via a framework that escapes by default (React). No `dangerouslySetInnerHTML` with unsanitized input. Message bodies, names, and Page metadata are treated as untrusted and rendered as text (or sanitized).
- **Command injection** — never shell out to build commands from user input; avoid subprocess use or strictly pass argument arrays.

## 9. CSRF Considerations

- The primary API is an SPA/headless client using **bearer tokens** (not cookies) and CORS allowlisting, so CSRF surface is minimal.
- Any **cookie-based** auth (e.g., first-party session for the web app) uses **SameSite=Lax/Strict** + CSRF tokens for state-changing requests, or a `__Host-` prefixed cookie.
- The **Meta webhook callback** and OAuth callback are signed/state-validated rather than relying on cookies.

## 10. Secure Cookies

Where cookies are used (refresh-token cookie, session cookie):

- `HttpOnly`, `Secure`, `SameSite=Strict` (or `Lax` where needed).
- `__Host-` prefix to bind domain+path+secure.
- Short path scope and explicit `Max-Age`.

Prefer keeping refresh tokens out of cookies where the client is a native/mobile app (secure storage there).

## 11. Webhook Signature Verification (Meta)

- Meta signs Messenger webhook payloads with `X-Hub-Signature-256` = HMAC-SHA256 of the raw body using the app secret.
- **Verify the signature before any payload processing**: compute `sha256(app_secret, raw_body)`, compare (constant-time) with the header.
- Support replay/`sha1` only if needed for legacy, but require `sha256`.
- Verify the **Verify Token** during the webhook subscription handshake (`hub.verify_token`).
- Ensure the raw (unmodified) body is the exact bytes that were signed — disable body parsers that alter bytes before verification.
- Reject events with `object != "page"` or unrecognized `entry[].id` (not one of our connected Pages) to drop spoofed/foreign events.

## 12. Audit Logs

Immutable, append-only audit logs capturing: auth events (login, logout, reset, refresh-rotate), member/role changes, Page connect/disconnect, permission changes, and **all AI actions** (see `ai_action_logs`). Fields include timestamp, actor, workspace, action, target, result, and request correlation ID. Stored in a tamper-evident store and retained per policy.

## 13. Data Encryption

- **In transit:** TLS 1.2+ everywhere.
- **At rest:** DB storage encryption (managed), plus application-layer envelope encryption for tokens (section 5) and any PII fields that merit field-level encryption.

## 14. Data Retention & Deletion

- Define retention periods per data class (conversation history, CRM records, audit logs, AI logs) per policy/legal requirements.
- **Right to erasure / account deletion:** hard-delete or anonymize user/workspace data on request; purge associated Page tokens and audit trail as allowed.
- Token records deleted on Page disconnect.

## 15. Privacy / GDPR Considerations

- **Legal basis & consent:** Messenger contacts are on Meta's platform; PagePilot must respect Meta policies and applicable privacy law. Store only what's necessary; honor opt-out and erasure.
- **Data subject requests:** export/delete mechanisms.
- **Data minimization:** don't over-collect (avoid unnecessary `email`/insights scopes; use `public_profile` only where needed).
- **Cross-border / processors:** document AI provider and hosting as sub-processors; enable data-residency options if required.
- **Privacy notice:** disclose AI-assisted/automated interaction where required (see `13-meta-integration.md` auto-disclosure).
- **LLM data:** never send more than the minimal workspace/context to the model; exclude unrelated tenants' and unrelated customers' data (see `19-ai-assistant.md` "context selection").

## 16. AI Action Permissions

- Every AI tool declares `permission_level` (READ/PREPARE/WRITE/EXTERNAL) + `required_permission` RBAC key + confirmation policy (see `20-ai-tools.md`).
- Enforcement is at the **service layer**, re-validating RBAC + tenant + Meta policy even when the model requests an action.
- `EXTERNAL` always requires user confirmation; `WRITE` requires confirmation for bulk/irreversible changes.
- All AI tool calls are logged with args/results in `ai_action_logs` (masking secrets/PII per observability rules in `27-observability.md`).

---

## Security Controls Checklist

- [ ] Email verification, password reset, and lockout implemented.
- [ ] JWT access + refresh tokens with rotation and revocation.
- [ ] RBAC enforced server-side with row-level scoping for `Agent`.
- [ ] Tenant scoping (`workspace_id`) at DB, cache, queue, and storage layers.
- [ ] Meta tokens never served to the frontend; OAuth `state` + server-side code exchange.
- [ ] Envelope encryption (DEK/KEK) for tokens at rest; DEK/KEK rotation.
- [ ] Secrets in a secrets manager; nothing committed to source control.
- [ ] Rate limiting (per-IP + per-user) and strict input validation.
- [ ] Parameterized SQL only; output escaped/sanitized (no XSS).
- [ ] Secure cookies (`HttpOnly`/`Secure`/`SameSite`) where used.
- [ ] Meta webhook `X-Hub-Signature-256` verified before processing.
- [ ] Immutable audit logs, including all AI actions.
- [ ] TLS in transit + encryption at rest.
- [ ] Data retention/erasure and GDPR mechanisms defined.
- [ ] AI EXTERNAL always confirmed; actions re-validated server-side.
- [ ] No secrets/PII in logs (see `27-observability.md`).

---

## Note on Threat Modeling

PagePilot's highest-value assets are **Page access tokens**, **message/CRM PII**, and the **ability to send on behalf of customers' Pages**. Primary threats to model:

1. **Token exfiltration** (client, logs, DB breach) → mitigated by never exposing to frontend, envelope encryption, and no-log rules.
2. **Cross-tenant data access** (IDOR, mis-scoped queries) → mitigated by tenant scoping at every layer and 404-on-foreign-ID.
3. **Unauthorized/automated sends** (AI or API abuse) → mitigated by RBAC + EXTERNAL confirmation + Meta window/tag enforcement at the send service.
4. **Webhook spoofing/forgery** → mitigated by signature verification.
5. **Privilege escalation** (agent → admin, or model overreach) → mitigated by server-side role resolution and service-layer rechecks.

Revisit the model after each module addition (especially Campaigns/Automation, which expand the send surface).
