@echo off
cls
echo LOLA Math Platform Launcher
echo.

cd /d C:\palantir\math

echo Starting LOLA Server...
start /min cmd /c "venv311\Scripts\python.exe src\lola-integration\lola-server.py"

timeout /t 2 >nul

echo Starting Gesture Controller...
start /min cmd /c "venv311\Scripts\python.exe src\lola-integration\gesture_physics_controller.py"

timeout /t 2 >nul

echo Opening browser...
start http://localhost:3000

echo.
echo Starting React app...
npm start