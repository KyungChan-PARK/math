@echo off
REM Direct execution commands for Math Learning Platform

echo Starting LOLA Intent Learning System...
echo.

cd /d C:\palantir\math

REM Activate Python environment
call venv311\Scripts\activate.bat

REM Start LOLA Intent server
start "LOLA Intent Server" python src\lola-integration\lola_math_intent_system.py

echo.
echo Server starting on port 8092...
echo.
timeout /t 5

REM Open browser
start "" "file:///C:/palantir/math/lola-math-intent.html"

echo.
echo LOLA Intent Learning System is ready!
echo.
echo Press any key to stop the server...
pause >nul

REM Server will continue running until you close its window
echo.
echo To stop the server, close the "LOLA Intent Server" window.
echo.
pause
