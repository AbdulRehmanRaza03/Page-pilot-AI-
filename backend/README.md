# PagePilot — Backend

FastAPI modular monolith. See `docs/10-backend-architecture.md`.

## Quick start

```bash
py -m venv .venv
.venv/Scripts/activate
pip install -e ".[dev]"
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```
