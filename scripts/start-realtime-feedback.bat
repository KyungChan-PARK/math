@echo off
echo ====================================
echo Starting Real-time Gesture Feedback System
echo ====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    exit /b 1
)

echo [1/3] Installing Node.js dependencies...
cd gesture-service
call npm install
cd ..
echo.

echo [2/3] Starting WebSocket server...
start "Gesture WebSocket Server" cmd /k "cd gesture-service ; node server-claude-integrated.js"
timeout /t 3 >nul
echo.

echo [3/3] Starting MediaPipe gesture bridge...
start "MediaPipe Gesture Bridge" cmd /k "python realtime-gesture-bridge.py"
timeout /t 2 >nul
echo.

echo ====================================
echo System started successfully!
echo ====================================
echo.
echo Services running:
echo - WebSocket Server: ws://localhost:9001
echo - MediaPipe Bridge: Processing camera input
echo.
echo Open test-realtime-feedback.html in your browser to test
echo Press Ctrl+C in each window to stop services
echo.
pause
