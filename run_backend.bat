@echo off
title BD Railway - Backend API
echo ============================================================
echo Starting Bangladesh Railway FastAPI Backend Server
echo ============================================================
cd /d "%~dp0backend"

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Checking dependencies...
pip install -r requirements.txt --quiet

echo Seeding database with initial stations, trains and routes...
python seed.py

echo Starting Uvicorn Server on http://localhost:8000 ...
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
