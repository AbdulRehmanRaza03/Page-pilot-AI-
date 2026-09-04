<p align="center">
  <h1 align="center">PagePilot</h1>
  <p align="center">
    AI-powered Facebook Page communication, lead management, and automation platform.
  </p>
</p>

---

## Overview

**PagePilot** is a multi-tenant SaaS platform that lets businesses connect multiple **Facebook Pages** and manage all their Messenger communication from one unified dashboard:

- 💬 **Unified Inbox** — every conversation across every Page in one place
- 👥 **Contacts & Leads CRM** — auto-captured leads with scoring, tags, and segmentation
- ⚡ **Automation Engine** — trigger → conditions → actions visual workflows
- 📣 **Compliant Campaigns** — audience messaging that respects Meta's 24-hour window and message tags
- 🤖 **AI Assistant** — a *natural-language* business automation assistant (read, search, summarize, draft, and — with confirmation — send/start workflows) that never bypasses Meta policies

> **Status:** Active development (MVP). Phase 0–5 complete (documentation, dev environment, auth, database, Meta OAuth + Page connection).

---

## Project Structure

```
FB Automate project/
├── docs/          # Complete product & system architecture (36 files)
├── backend/       # FastAPI modular monolith (Python 3.12)
│   └── src/app/
│       ├── core/       # config, security, db, errors
│       ├── models/     # SQLAlchemy ORM (33 tables)
│       ├── schemas/    # Pydantic schemas
│       ├── modules/    # auth, facebook (and more)
│       ├── services/   # Meta client, encryption
│       └── workers/    # Celery tasks
├── frontend/      # Next.js 15 + React 19 + TypeScript + Tailwind
├── docker-compose.yml
└── README.md
```

---

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 15 · React 19 · TypeScript · Tailwind CSS · TanStack Query |
| Backend | Python 3.12 · FastAPI · SQLAlchemy 2.0 (async) · Pydantic v2 |
| Database | PostgreSQL 16 (SQLite for local demo) |
| Cache/Queue | Redis · Celery |
| AI | LLM with structured outputs + tool calling (provider-configurable) |

---

## Current Feature Status

| Feature | Status |
| --- | --- |
| Auth (register / login / refresh / me) | ✅ Done |
| RBAC (roles + permissions) | ✅ Done |
| Database foundation (33 tables) | ✅ Done |
| Meta OAuth + Page connect/disconnect | ✅ Done |
| Webhooks (message receive) | 🔜 Next |
| Messenger send/reply | 🔜 Next |
| Unified Inbox / CRM / Campaigns / Automation | ⬜ Planned |
| AI Assistant | ⬜ Planned |

---

## Getting Started

See [DEVELOPMENT.md](./DEVELOPMENT.md) and [docs/00-overview.md](./docs/00-overview.md).

### Backend (PowerShell)

```powershell
cd "FB Automate project"
.venv\Scripts\python.exe -m venv .venv   # first time only
.venv\Scripts\pip install -e "backend[dev]"
$env:PYTHONPATH = "backend/src"
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Then open `http://127.0.0.1:8000/docs` for the interactive API.

### Frontend (PowerShell)

```powershell
cd "FB Automate project/frontend"
npm install
npm run dev
```

Then open `http://127.0.0.1:3000`.

---

## Configuration

Copy `backend/.env.example` → `backend/.env` and set:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres/Supabase URL (or `sqlite+aiosqlite:///./pagepilot.db` for local demo) |
| `META_APP_ID` / `META_APP_SECRET` | Facebook Developer App credentials |
| `LLM_API_KEY` | AI provider key (Phase 13+) |
| `SECRET_KEY` | JWT signing secret |

**Never commit `.env` or secrets.**

---

## Tests

```powershell
$env:PYTHONPATH = "backend/src"
.venv\Scripts\python.exe -m pytest backend/tests -q
```

---

## Documentation

The complete product specification and system architecture live in [`/docs`](./docs). Start with [`docs/00-overview.md`](./docs/00-overview.md).

## License

Proprietary. All rights reserved.
