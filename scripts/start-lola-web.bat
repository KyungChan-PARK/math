@echo off
cls
echo ========================================
echo    LOLA Math Platform - Web Interface
echo ========================================
echo.

cd /d C:\palantir\math

REM Kill any existing processes on our ports
echo Cleaning up existing processes...
netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo Stopping existing web server on port 3001...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F >nul 2>&1
)

REM Start LOLA Physics Server on port 8090
echo Starting LOLA Physics Server (port 8090)...
start /min cmd /c "venv311\Scripts\python.exe src\lola-integration\lola-server-8090.py"

timeout /t 2 >nul

REM Start web server
echo Starting Web Interface (port 3001)...
node src\lola-web-server.js