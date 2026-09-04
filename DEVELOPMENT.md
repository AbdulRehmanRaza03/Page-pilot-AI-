# PagePilot — Development Environment Setup

This guide covers **Phase 1**: repository and local development environment.

## Prerequisites

- Python 3.12+ (use `py` on Windows)
- Node.js 20+ and npm
- Git
- PostgreSQL 16 (local install) and Redis

## Backend Setup

```bash
cd backend
py -m venv .venv
# Windows (Git Bash/sh):
.venv/Scripts/activate
# or (bash):
source .venv/bin/activate

pip install -e ".[dev]"
cp .env.example .env
# edit .env with your DB/Redis/Meta/LLM values

# Run migrations
alembic upgrade head

# Run the API
uvicorn app.main:app --reload
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Notes

- Docker is optional; run PostgreSQL + Redis natively if Docker is unavailable.
- Never commit `.env` files. Use `.env.example` as the template.
