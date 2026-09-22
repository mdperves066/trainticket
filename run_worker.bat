@echo off
title BD Railway - Official Browser Session Setup
echo ============================================================
echo Bangladesh Railway Official Account - Browser Session Setup
echo Official Portal: https://eticket.railway.gov.bd/
echo ============================================================
cd /d "%~dp0backend"

if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

python launch_browser.py
pause
