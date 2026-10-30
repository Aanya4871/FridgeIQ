@echo off
title AI Refrigerator Manager Launcher
echo ========================================================
echo Starting AI Refrigerator Manager...
echo ========================================================

set PATH=C:\Users\Aanya Srivastava\.nodejs;%PATH%

echo [1/2] Starting Backend Server (FastAPI)...
start "Refrigerator Backend" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend App (Vite React)...
start "Refrigerator Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1 --port 5173"

timeout /t 3 /nobreak >nul
echo.
echo ========================================================
echo Application is running!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo ========================================================
start http://localhost:5173
pause
