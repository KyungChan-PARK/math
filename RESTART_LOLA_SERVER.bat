@echo off
cls
echo ========================================
echo   LOLA Intent Learning - Server Restart
echo ========================================
echo.

cd /d C:\palantir\math

echo [1] Stopping existing server...
taskkill /F /FI "WINDOWTITLE eq LOLA Math Intent*" 2>nul
taskkill /F /FI "WINDOWTITLE eq LOLA Intent Server*" 2>nul
timeout /t 2 >nul

echo.
echo [2] Starting updated server...
echo    - Now analyzes after EVERY attempt (5+)
echo    - Fixed suggestion generation
echo.

start "LOLA Intent Server" cmd /k "venv311\Scripts\python.exe src\lola-integration\lola_math_intent_system.py"

timeout /t 5 >nul

echo.
echo [3] Checking server status...
netstat -an | findstr :8092 >nul
if %errorlevel% equ 0 (
    echo [OK] Server running on port 8092
) else (
    echo [!] Server may not have started properly
)

echo.
echo ========================================
echo   Next Steps:
echo ========================================
echo.
echo 1. Open lola-math-intent.html in browser
echo.
echo 2. Since you already have 11 attempts, submit ONE more
echo    to trigger the suggestion (will be 12th attempt)
echo.
echo 3. OR run this in browser console (F12):
echo    - Copy all content from manual-suggestion.js
echo    - Paste in console and press Enter
echo.
echo The suggestion should appear in "LOLA's Understanding" canvas!
echo.
pause
