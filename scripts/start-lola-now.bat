@echo off
cls
echo ========================================================
echo     LOLA Math Platform - Quick Start
echo     Touch-Only Mode (No MediaPipe Required)
echo ========================================================
echo.

cd /d C:\palantir\math

REM Quick launch without MediaPipe installation
set PYTHON_EXE=venv311\Scripts\python.exe

echo [1/3] Starting LOLA Physics Server...
start "LOLA Server" /min %PYTHON_EXE% src\lola-integration\lola-server.py

echo [2/3] Starting Gesture Controller...  
start "Gesture Controller" /min %PYTHON_EXE% src\lola-integration\gesture_physics_controller.py

echo [3/3] Opening browser...
timeout /t 3 >nul
start http://localhost:3000

echo.
echo ========================================================
echo Starting React App...
echo ========================================================
npm start