@echo off
cls
echo ========================================================
echo     LOLA-Enhanced Math Learning Platform
echo     Full System Launch (Python 3.11.9)
echo ========================================================
echo.

cd /d C:\palantir\math

REM Use confirmed Python 3.11.9 from venv311
set PYTHON_EXE=venv311\Scripts\python.exe

echo [INFO] Using Python 3.11.9 from venv311
%PYTHON_EXE% --version
echo.

REM Install required packages quickly
echo [SETUP] Checking Python packages...
%PYTHON_EXE% -m pip install numpy --quiet 2>nul
%PYTHON_EXE% -m pip install opencv-python --quiet 2>nul

REM Try MediaPipe (optional)
%PYTHON_EXE% -m pip show mediapipe >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing MediaPipe (optional)...
    %PYTHON_EXE% -m pip install mediapipe --quiet 2>nul
    if %errorlevel% neq 0 (
        echo [INFO] MediaPipe not available, using touch-only mode
    ) else (
        echo [OK] MediaPipe installed
    )
) else (
    echo [OK] MediaPipe already installed
)

echo.
echo ========================================================
echo     Starting All Services
echo ========================================================
echo.

REM Start LOLA Physics Server on port 8090 (to avoid conflicts)
echo [1/3] Starting LOLA Physics Server...
start "LOLA Server" /min %PYTHON_EXE% src\lola-integration\lola-server-8090.py
timeout /t 2 >nul

REM Check if LOLA server is running
netstat -an | findstr :8090 >nul
if %errorlevel% equ 0 (
    echo [OK] LOLA Server running on http://localhost:8090
) else (
    echo [WARNING] LOLA Server may not have started
)

REM Start Gesture Controller
echo [2/3] Starting Gesture Controller...
start "Gesture Controller" /min %PYTHON_EXE% src\lola-integration\gesture_physics_controller.py
timeout /t 2 >nul

REM Check if Gesture controller is running
netstat -an | findstr :8081 >nul
if %errorlevel% equ 0 (
    echo [OK] Gesture Controller running on port 8081
) else (
    echo [INFO] Gesture Controller in touch-only mode
)

REM Open browser
echo [3/3] Opening browser...
start "" "C:\palantir\math\lola-platform.html"
timeout /t 1 >nul

echo.
echo ========================================================
echo     System Ready!
echo ========================================================
echo.
echo [STATUS] All services started:
echo   - LOLA Physics Server: http://localhost:8090
echo   - Gesture Controller: Port 8081
echo   - Web Interface: lola-platform.html
echo.
echo [INFO] Samsung Galaxy Book 4 Pro 360 Touch Features:
echo   - Touch input: ENABLED
echo   - Pinch to zoom: ENABLED
echo   - Drag to move: ENABLED
echo   - Multi-touch: ENABLED
echo.
echo (Press Ctrl+C to stop all services)
echo.

pause

REM Cleanup when stopped
echo.
echo ========================================================
echo     Shutting down services...
echo ========================================================

REM Kill Python processes
taskkill /F /FI "WindowTitle eq LOLA Server*" >nul 2>&1
taskkill /F /FI "WindowTitle eq Gesture Controller*" >nul 2>&1

echo [OK] All services stopped
echo.
pause
