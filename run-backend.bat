@echo off
echo ==============================================
echo  PagePilot Backend  -  http://127.0.0.1:8000
echo ==============================================
cd /d "%~dp0"
set PYTHONPATH=backend\src
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
