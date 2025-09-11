@echo on
REM LOLA Integration - Simple Version with Debug
REM Shows all commands for debugging

echo.
echo ========================================
echo    LOLA Math Platform Launcher
echo    Python 3.11 Version with Debug
echo ========================================
echo.

cd /d C:\palantir\math
echo Current directory: %cd%
echo.

REM Check venv311
if exist "venv311" (
    echo [OK] Found venv311 directory
) else (
    echo [ERROR] venv311 not found!
    echo Please create it with: python -m venv venv311
    pause
    exit /b 1
)

REM Activate venv311
echo.
echo Activating Python 3.11 environment...
call venv311\Scripts\activate.bat

REM Show Python version
echo.
echo Python version:
python --version

REM Install minimal packages
echo.
echo Installing required packages...
pip install numpy --quiet
pip install opencv-python --quiet

REM Try to install MediaPipe (may fail on Python 3.13)
echo.
echo Trying to install MediaPipe...
pip install mediapipe --quiet 2>nul
if %errorlevel% equ 0 (
    echo [OK] MediaPipe installed
) else (
    echo [WARNING] MediaPipe not available
)

REM Start LOLA server
echo.
echo Starting LOLA Physics Server...
start /min cmd /c "python src\lola-integration\lola-server.py"
timeout /t 2 >nul

REM Start gesture controller
echo.
echo Starting Gesture Controller...
start /min cmd /c "python src\lola-integration\gesture_physics_controller.py"
timeout /t 2 >nul

REM Check if servers are running
echo.
echo Checking services...
netstat -an | findstr :8080 >nul
if %errorlevel% equ 0 (
    echo [OK] LOLA Server is running on port 8080
) else (
    echo [WARNING] LOLA Server may not be running
)

netstat -an | findstr :8081 >nul
if %errorlevel% equ 0 (
    echo [OK] Gesture Controller is running on port 8081
) else (
    echo [WARNING] Gesture Controller may not be running
)

REM Open browser
echo.
echo Opening browser...
start http://localhost:3000

REM Start React app
echo.
echo Starting React application...
echo.
npm start

pause