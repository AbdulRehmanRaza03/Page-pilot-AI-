# 30 — Git Workflow & Delivery Process

Branching, commit, PR, and CI conventions for PagePilot. This is a simple, fast-shipping workflow appropriate for a modular monolith built by a small team — deliberately avoiding over-process for MVP.

## 1. Branching Model

Trunk-based with short-lived branches and protected `main`. No long-lived release branches in MVP.

| Branch | Purpose | Protected? | Deploys to |
| --- | --- | --- | --- |
| `main` | Production-ready, always releasable | Yes | PRODUCTION (see `28-deployment.md`) |
| `develop` | Integration branch (primary work target) | Yes | STAGING |
| `feature/*` | New functionality | No | — (local/feature env) |
| `fix/*` | Non-urgent bug fixes → `develop` | No | — |
| `hotfix/*` | Urgent production fixes → `main` | No | PRODUCTION (fast-track) |

```
main ───────────────────────────────●▲────────────────────●──
                                     │                    │
develop ───────●────────●──────────▲─┴────●──────────────▲┴─
               │        │          │       │              │
feature/foo ───┘        │          │   feature/bar ───────┘
                        │          │
feature/baz ────────────┘          │
                                   │
                            hotfix/urgent ──► main ──► backmerge to develop
```

### Rules

- `main` is always deployable; only merged from `develop` (or `hotfix/*`).
- `develop` receives feature/fix merges via pull requests only (no direct push).
- `hotfix/*` branches from `main`, fixes forward, merges to `main` **and** back into `develop` (backmerge) to prevent drift.
- Branch names use hyphens: `feature/page-oauth`, `fix/message-idempotency`, `hotfix/token-refresh`.

## 2. Feature Lifecycle

Each feature goes through these stages. A feature is "done" only when all gates pass.

```
1. Implementation ──► 2. Tests ──► 3. Docs ──► 4. Commit ──► 5. Verification (CI + review) ──► merge
```

### 1. Implementation
- Build within the relevant module per `10-backend-architecture.md`.
- Scope changes to the feature; do not bundle unrelated refactors.
- Respect tenancy (`workspace_id`) and RBAC conventions from `23-security.md`/`22-auth-rbac.md`.

### 2. Tests
- Add/adjust unit, integration, and API tests per `26-testing.md`.
- For Meta/AI changes, include policy- and safety-contract tests (window/tag, EXTERNAL confirmation).
- Acknowledge webhook idempotency for any inbound-event change.

### 3. Docs
- Update the numbered doc that owns the behavior (e.g., `13-meta-integration.md`, `19-ai-assistant.md`, `11-database-architecture.md`).
- For schema changes, reflect in `11-database-architecture.md`; for endpoints, `12-api-architecture.md`.

### 4. Commit
- Small, atomic commits following the style in section 4.
- Do not commit secrets, `.env` values, or build artifacts (see `.gitignore` in section 7).

### 5. Verification
- Open a PR against `develop` (or `main` for hotfix).
- CI must be green (section 8).
- Meet the PR checklist (section 6).
- At least one reviewer approves.
- Squash-merge to keep history linear and clean.

## 3. Pull Request Requirements

A PR is **not mergeable** until:

- [ ] CI checks pass (lint, unit, integration/API, frontend, security, coverage gate).
- [ ] Tests added/updated and described; policy/safety tests present for Meta/AI changes.
- [ ] Relevant docs updated (link to the doc in the PR body).
- [ ] No secrets or credentials in the diff.
- [ ] Tenant-scoping reviewed (a reviewer explicitly checks for cross-tenant risk).
- [ ] Migration is Alembic-ordered, backward-compatible (or a flag/rollback is provided).
- [ ] Feature flag/verification described if the change is behavior-altering.
- [ ] At least one approval from a maintainer.

**PR body template (concise):**
```
## What
## Why
## Tests
## Docs updated
## Security review notes (tenancy / RBAC / Meta policy / AI safety)
## Rollback / migration notes
```

## 4. Commit Style

Conventional Commits, imperative mood, ≤ 50-char subject, wrapped body at 72 chars, body only when it adds useful context.

```
feat: connect Facebook Pages via OAuth

Adds the Facebook Login-for-Business flow, /me/accounts token
collection, and encrypted Page-token storage. Tokens never reach
the client (see 23-security.md).
```

| Type | When |
| --- | --- |
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `refactor` | No behavior change |
| `perf` | Performance change |
| `test` | Tests only |
| `docs` | Documentation only |
| `chore` | Build/deps/CI, no product code |
| `security` | Security-hardening changes |

Scope (optional) is the module, e.g. `feat(automation): ...`, `fix(webhook): ...`.

## 5. CI Checks

Run on every PR and on merge to `develop`/`main`. Details per `26-testing.md`.

| Check | Gate |
| --- | --- |
| Lint (ruff + prettier/eslint) | Blocking |
| Format check | Blocking |
| Unit tests | Blocking |
| Integration/API tests (Testcontainers) | Blocking |
| Frontend unit + Playwright smoke | Blocking |
| Security scan (bandit, pip-audit, npm audit, secret leak) | Blocking |
| Coverage (critical modules) | Blocking on regression |

## 6. Review Focus Areas

- **Tenant isolation** — is every new query scoped by `workspace_id`? Foreign-ID → 404?
- **RBAC** — is the new endpoint/feature protected by the correct permission key?
- **Meta policy** — does a send change honor window/type/tag? (send-eligibility test present)
- **AI safety** — does any AI change bypass action classification or confirmation?
- **Secrets** — no token/secret in code, logs, or fixtures.
- **Migrations** — backward-compatible? rollback documented?

## 7. Repository Hygiene

- `.gitignore` excludes `.env*`, secrets, keys, logs, `node_modules`, caches, `dist`/build output, and local databases.
- Secrets live only in a secrets manager per `23-security.md` / `29-environments.md`.
- Pre-commit hooks (optional) run format + lint + secret scan locally.

## 8. Release / Merge

1. Team works on `feature/*`/`fix/*` → PRs into `develop`.
2. `develop` is continuously deployed to STAGING.
3. When a release candidate is verified, open a **release PR** `develop → main`.
4. Merge to `main` → tagged with semver (e.g., `v0.4.0`) → deploy to PRODUCTION.
5. Hotfixes: `hotfix/*` → PR → merge to `main` (tag + deploy) → open backmerge PR `main → develop`.

Tags follow `v{major}.{minor}.{patch}`. Pre-1.0, `0.x` versions indicate no stability guarantee.

## 9. Review Cadence

- PRs are small and frequent (ideally < 400 changed lines) to keep review fast and merges unblocked.
- Aim for review within one business day for `feature`/`fix`, and immediately for `hotfix`.
- Stale PRs (> 3 days without progress) are flagged.
