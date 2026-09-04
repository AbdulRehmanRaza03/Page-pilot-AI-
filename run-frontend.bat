@echo off
echo ==============================================
echo  PagePilot Frontend  -  http://127.0.0.1:3000
echo ==============================================
cd /d "%~dp0frontend"
call npm run dev
