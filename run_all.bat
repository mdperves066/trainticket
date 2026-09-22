@echo off
title BD Railway Ticket Monitor - Runner
echo ============================================================
echo Bangladesh Railway E-Ticket Availability Monitoring Assistant
echo Official Source: https://eticket.railway.gov.bd/
echo ============================================================

:: 1. Verify Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH! Please install Python 3.10+.
    pause
    exit /b 1
)
echo [OK] Python detected.

:: 2. Verify Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH! Please install Node.js 18+.
    pause
    exit /b 1
)
echo [OK] Node.js detected.

:: 3. Setup Backend Environment
echo.
echo Setting up Python Backend Virtual Environment...
cd /d "%~dp0backend"
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing/verifying backend dependencies...
pip install -r requirements.txt --quiet

:: 4. Setup Frontend Environment
echo.
echo Verifying Frontend Dependencies...
cd /d "%~dp0frontend"
if not exist node_modules (
    echo Installing npm packages...
    call npm.cmd install
)

:: 5. Launch Backend Server in new window
echo.
echo Starting Backend API Server (Port 8000)...
start "BD Railway - Backend API" cmd /c "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && uvicorn main:app --reload --host 127.0.0.1 --port 8000"

:: 6. Launch Frontend Dev Server in new window
echo Starting Frontend Web Dashboard (Port 3000)...
start "BD Railway - Frontend UI" cmd /c "cd /d "%~dp0frontend" && if exist node_modules\.bin\next.cmd (call node_modules\.bin\next.cmd dev) else (node node_modules\next\dist\bin\next dev)"

:: 7. Summary of URLs and open browser
echo.
echo ============================================================
echo   ALL SERVICES STARTED SUCCESSFULLY!
echo ============================================================
echo   Web Dashboard:  http://localhost:3000
echo   Backend API:    http://localhost:8000
echo   API Docs:       http://localhost:8000/docs
echo   Health Check:   http://localhost:8000/health
echo ============================================================
echo.
echo Opening browser dashboard...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo Both servers are running in separate terminal windows.
echo Keep this window open or close it when done.
pause
