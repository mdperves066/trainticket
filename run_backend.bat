@echo off
title BD Railway Ticket Monitor - Backend
echo ============================================================
echo Starting BD Railway Ticket Monitor Backend API
echo Official Source: https://eticket.railway.gov.bd/
echo ============================================================
cd /d "%~dp0backend"

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Checking backend dependencies...
pip install -r requirements.txt --quiet

echo Starting FastAPI / Uvicorn Server on http://localhost:8000 ...
uvicorn main:app --reload --host 127.0.0.1 --port 8000
pause
