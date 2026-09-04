# 28 — Deployment & Infrastructure

Production infrastructure recommendation for PagePilot, optimized for reliability, cost, simplicity, scalability, and developer productivity at MVP scale. Deliberately **pragmatic** — no Kubernetes, no microservices, no over-engineering.

## 1. Constraints & Goals

- Modular monolith backend (FastAPI) + Next.js frontend (see `07-system-architecture.md`, `10-backend-architecture.md`).
- PostgreSQL (system of record), Redis (cache/broker/pub-sub), Celery (workers) — see `11-database-architecture.md`, `25-background-jobs.md`.
- Webhooks must be publicly reachable over HTTPS with a stable URL (Meta) — see `13-meta-integration.md`, `14-webhook-architecture.md`.
- Availability target 99.5% MVP; webhook ack < 1s (NFR-2).
- Multi-tenant isolation and secrets security (see `23-security.md`, `29-environments.md`).

## 2. High-Level Topology

```
Internet ──► DNS (domain) ──► TLS ──► Reverse proxy / load balancer
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                    ▼                    ▼
             Next.js frontend      FastAPI API          Meta webhook path
                    │                    │                 (same API host)
                    └────────┬───────────┘
                             ▼
                  PostgreSQL  ·  Redis
                             │
                             ▼
                       Celery workers
                             │
                       ┌─────┴─────┐
                       ▼           ▼
                   Meta Graph   LLM provider
                   (outbound)   (outbound)
```

## 3. Option Evaluation

Evaluation dimensions: **Reliability** (R), **Cost** (C), **Simplicity** (S), **Scalability** (Sc), **Developer Productivity** (D).

### Backend + Frontend hosting

| Option | R | C | S | Sc | D | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Single VPS (Docker Compose, e.g., Hetzner/DigitalOcean) | Medium | Low | High | Low | Medium | Full control, manual TLS/backups/monitoring; scaling = manual |
| Container host (Fly.io, Render, Railway) | High | Medium | High | Medium | High | Reverse proxy + TLS built-in, easy multi-region, pay-as-you-go |
| Managed PaaS (Render/Railway/Fly) with managed DB/Redis | High | Medium | High | Medium-High | High | Least ops; attach managed Postgres/Redis |
| AWS/GCP primitives (ECS Fargate + RDS + ElastiCache) | High | Higher | Lower | High | Medium | More ops/config for MVP than needed |
| Kubernetes (EKS/GKE/k3s) | High | High | Low | High | Low | **Over-engineering for MVP — excluded** |

### Database

| Option | Notes |
| --- | --- |
| Managed PostgreSQL (Render/Railway/Neon/AWS RDS/Cloud SQL) | **Recommended.** Automated backups, PITR, encryption at rest, easy pool scaling |
| Self-hosted Postgres in a container on the VPS | Cheaper, but you own backups/replication/HA |

### Redis

| Option | Notes |
| --- | --- |
| Managed Redis (Render/Railway/Upstash/Railway/vendor) | **Recommended.** TLS + auth/ACL, persistence, no ops |
| Self-hosted Redis (VPS container) | Cheaper; you own persistence/HA |

### Workers (Celery)

- Run Celery workers as a **separate long-running process/container** alongside the API, sharing the same image + env (broker = Redis). Scaling = increase worker replicas; prioritize queue-based scaling later.

### Object storage (message attachments — future)

- **S3-compatible** object storage (AWS S3/Cloudflare R2/Backblaze B2) for media. Keys under `ws/{wid}/...` for tenant isolation (see `23-security.md`). Not MVP-blocking; add when attachments ship.

## 4. Recommended MVP Setup

**Primary recommendation: a managed container PaaS** (Render, Railway, or Fly.io) with managed Postgres + managed Redis. This is the best balance of reliability/cost/simplicity/developer productivity.

| Component | Recommendation | Rationale |
| --- | --- | --- |
| Frontend (Next.js) | PaaS web service (container/static-hybrid) | Built-in TLS + CDN/edge, zero-config deploy |
| Backend (FastAPI) | PaaS web service (Docker image) | Auto TLS, health checks, rolling deploys |
| Workers (Celery) | PaaS worker service (same image, worker command) | Scales independently, no extra infra |
| PostgreSQL | Managed Postgres (PaaS-managed) | Backups, PITR, encryption, connection pooling |
| Redis | Managed Redis (PaaS-managed or Upstash) | TLS + auth, pub/sub + broker |
| Object storage | S3-compatible (add when attachments need it) | Cheap, tenant-keyed paths |
| Domain + SSL | PaaS-managed DNS or your registrar + PaaS auto-TLS | Forced HTTPS, HSTS, modern ciphers |
| Monitoring | Sentry (errors) + Prometheus/Grafana (or vendor metrics) + health checks | See `27-observability.md` |

**Fallback (cost-optimized MVP): single VPS with Docker Compose.** A 2–4 GB VPS (Hetzner/DigitalOcean) with Traefik/Caddy for TLS, Postgres + Redis in containers, API + worker + frontend containers, and a cron'd backup job. Acceptable for a controlled early launch, but you own backups, monitoring, and scaling. Use managed DB/Redis if the budget allows.

### Why not Kubernetes or microservices

- MVP does not need the operational surface of Kubernetes; the modular monolith can extract workers/services later if warranted (see `07-system-architecture.md` section 1, `25-background-jobs.md`).
- Managed PaaS/managed services already provide the reliability (TLS, health checks, backups, auto-restart) Kubernetes would otherwise be standing up to solve.

## 5. Webhooks & Networking

- **Public, stable HTTPS URL** for `META_WEBHOOK_URL` (e.g., `https://api.pagepilot.dev/webhooks/meta`) — must match the Meta app config; pinned and pinned URI (see `23-security.md` section 4).
- **Ack fast:** the webhook handler validates, enqueues, and returns `200` before heavy processing (see `14-webhook-architecture.md`). This keeps Meta from retrying.
- **Signature verification** (`X-Hub-Signature-256`) before processing.
- **Health checks:** `/healthz` (liveness) and `/readyz` (readiness) surface dependency status to the PaaS load balancer.
- **Rate limits** at the edge (reverse proxy) and in-app (per-IP/per-user) — see `23-security.md` section 7.

## 6. Domain & SSL

| Concern | Recommendation |
| --- | --- |
| Domain | One primary domain; subdomains e.g. `app.pagepilot.dev` (frontend), `api.pagepilot.dev` (backend + webhook) |
| SSL/TLS | PaaS-managed Let's Encrypt or equivalent; TLS 1.2+ |
| HSTS | Enabled |
| WWW/apex redirects | Canonical redirect to the primary origin |
| Certificate renewal | Automatic (PaaS) |

## 7. Secrets & Configuration at Deploy

- All secrets from the secrets manager, injected as environment variables at deploy (see `29-environments.md`).
- No secrets in images or code; `.env` not committed.
- Envelope encryption (DEK/KEK) for Meta tokens — KEK in KMS (see `23-security.md` section 5).

## 8. Monitoring & Alerting (deployment-time)

- Sentry DSN for errors; Prometheus metrics endpoint scraped by Grafana (or vendor metrics).
- Alerts: API 5xx > 1%, p95 latency, queue depth, send-failure rate, webhook verification failures, token reauth spikes (see `27-observability.md`).
- Logs: JSON stdout, aggregated (Loki or vendor).

## 9. Backups & Recovery

- **Postgres:** managed automated backups + PITR; schedule weekly restore drill in staging.
- **Redis:** persistence/backup if used for durable state (primarily cache/broker — short-lived; rely on Postgres as source of truth).
- **Object storage:** bucket versioning if attachments hold customer data.
- **Secrets:** secrets-manager versioning; no plaintext in config.

## 10. Scaling Path (when traffic grows — later)

1. Scale API/web frontends horizontally behind the PaaS LB (stateless).
2. Scale Celery workers independently (replicas) and tune concurrency.
3. Move to dedicated/managed search if FTS volume outgrows `pg_trgm` (see `11-database-architecture.md`).
4. Add CDN/edge caching for the frontend.
5. Consider extracting the messaging/automation worker into its own service only if queue isolation demands it — not until metrics justify it.
6. (Optional, much later) evaluate ECS Fargate/Kubernetes only after the monolith's scaling limits are actually observed.

## 11. Deployment Process (summary)

| Step | Action |
| --- | --- |
| 1 | CI builds + tests image (see `30-git-workflow.md`) |
| 2 | Merge to `main` → tag → build production image |
| 3 | Run Alembic migrations (backward-compatible; rollback available) |
| 4 | Rolling deploy API + workers, then frontend |
| 5 | Run health checks; watch errors/metrics/alerts |
| 6 | Smoke-test critical E2E journeys (see `26-testing.md` section 13) |

## 12. Concrete MVP Bill-of-Resources (indicative)

| Component | Spec (indicative) |
| --- | --- |
| Frontend service | 1 instance (scale to 2+ on load) |
| API service | 1 instance, 512MB–1GB (scale horizontally) |
| Worker service | 1–2 instances |
| PostgreSQL | Small managed (1 vCPU / 2GB, scale as needed) |
| Redis | Small managed (cache + broker) |
| Object storage | On-demand (defer until attachments) |
| Monitoring | Sentry (free tier) + Grafana/Prometheus or vendor metrics (start minimal) |

## 13. Decision Summary

> **Use a managed container PaaS (Render/Railway/Fly.io) + managed PostgreSQL + managed Redis, with the frontend and backend as two web services and Celery as a worker service.** It provides production-grade TLS, health checks, backups, and rolling deploys with minimal ops, at a cost acceptable for MVP, and a clean scaling path. **Single-VPS + Docker Compose is an acceptable cost-reduction fallback** if the operating budget is tight, accepting that backups/monitoring/scaling become the team's responsibility.
