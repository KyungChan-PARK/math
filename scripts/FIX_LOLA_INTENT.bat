@echo off
cls
echo ========================================
echo   LOLA Intent Learning - Quick Fix
echo ========================================
echo.

cd /d C:\palantir\math

echo [1] Checking server status...
netstat -an | findstr :8092 >nul
if %errorlevel% equ 0 (
    echo [OK] Server is running on port 8092
    echo.
    echo [2] Testing server response...
    curl -X GET http://localhost:8092/status
    echo.
    echo [3] Getting current suggestion...
    curl -X GET http://localhost:8092/suggestion
) else (
    echo [!] Server is NOT running
    echo.
    echo [2] Starting LOLA Intent Learning Server...
    start "LOLA Intent Server" cmd /c "venv311\Scripts\python.exe src\lola-integration\lola_math_intent_system.py"
    timeout /t 5 >nul
    echo [OK] Server started
)

echo.
echo ========================================
echo   To get suggestion manually:
echo ========================================
echo.
echo 1. Open browser console (F12)
echo 2. Run this command:
echo    fetch('http://localhost:8092/suggestion').then(r=^>r.json()).then(console.log)
echo.
echo Or try submitting one more attempt (12th) to trigger suggestion
echo.
pause
