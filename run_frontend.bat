@echo off
title BD Railway - Next.js Frontend
echo ============================================================
echo Starting Bangladesh Railway Next.js Frontend
echo ============================================================
cd /d "%~dp0frontend"

if not exist node_modules (
    echo Installing npm dependencies...
    call npm.cmd install
)

echo Starting Next.js Dev Server on http://localhost:3000 ...
if exist node_modules\.bin\next.cmd (
    call node_modules\.bin\next.cmd dev
) else (
    node node_modules\next\dist\bin\next dev
)
pause
