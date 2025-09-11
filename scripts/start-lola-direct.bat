@echo off
cls
echo ========================================
echo    LOLA Direct Launch
echo ========================================
echo.

cd C:\palantir\math

REM Directly use venv311 Python
echo Starting LOLA Server...
start "LOLA Server" venv311\Scripts\python.exe src\lola-integration\lola-server.py

echo Starting Gesture Controller...
start "Gesture Controller" venv311\Scripts\python.exe src\lola-integration\gesture_physics_controller.py

echo.
echo Servers starting...
timeout /t 3

echo Opening browser...
start http://localhost:3000

echo.
echo Starting React app...
npm start