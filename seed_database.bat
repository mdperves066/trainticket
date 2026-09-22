@echo off
title BD Railway - Database Seeder
cd /d "%~dp0backend"
if exist venv\Scripts\python.exe (
    venv\Scripts\python.exe seed.py
) else (
    python seed.py
)
echo Database seeding finished.
pause
