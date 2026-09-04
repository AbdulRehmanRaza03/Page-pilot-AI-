#!/bin/sh
# Start the PagePilot backend (FastAPI) on http://127.0.0.1:8000
cd "$(dirname "$0")"
PYTHONPATH=backend/src .venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
