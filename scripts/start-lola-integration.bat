@echo off
REM LOLA Integration Launch Script for Windows
REM For Samsung Galaxy Book 4 Pro 360 Touch

echo ========================================================
echo     LOLA-Enhanced Math Learning Platform Launcher
echo     Samsung Galaxy Book 4 Pro 360 Touch Optimized
echo ========================================================
echo.

REM Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js detected: 
node -v

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)
echo [OK] Python detected:
python --version

REM Set environment variables
set NODE_ENV=production
set LOLA_MODE=integrated
set WEBGPU_ENABLED=true
set TOUCH_MODE=hybrid
set GESTURE_RECOGNITION=true
set PYTHONPATH=%cd%\src\lola-integration

REM Navigate to project directory
cd /d C:\palantir\math

REM Check and install Node.js dependencies
if not exist "node_modules" (
    echo.
    echo [SETUP] Installing Node.js dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Node.js dependencies
        pause
        exit /b 1
    )
)

REM Check and create Python virtual environment
if not exist "venv" (
    echo.
    echo [SETUP] Creating Python virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate Python virtual environment
echo.
echo [SETUP] Activating Python environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo [SETUP] Checking Python dependencies...
pip show mediapipe >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing MediaPipe...
    pip install mediapipe
)

pip show tensorflow >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing TensorFlow...
    pip install tensorflow
)

pip show numpy >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing NumPy...
    pip install numpy
)

pip show opencv-python >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing OpenCV...
    pip install opencv-python
)

echo.
echo ========================================================
echo     Starting LOLA Integration Services
echo ========================================================
echo.

REM Start LOLA Physics Server
echo [SERVICE] Starting LOLA Physics Server...
start /b cmd /c "python src\lola-integration\lola-server.py 2>lola-error.log"
timeout /t 2 /nobreak >nul
echo [OK] LOLA Physics Server started

REM Start Gesture Recognition Service
echo [SERVICE] Starting Gesture Recognition Service...
start /b cmd /c "python src\lola-integration\gesture_physics_controller.py 2>gesture-error.log"
timeout /t 2 /nobreak >nul
echo [OK] Gesture Recognition Service started

REM Build React application with LOLA components
echo.
echo [BUILD] Building React application with LOLA integration...
if not exist "build" (
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed
        pause
        exit /b 1
    )
)

REM Start the main application
echo.
echo ========================================================
echo     Launching LOLA-Enhanced Math Platform
echo ========================================================
echo.
echo [INFO] Platform optimized for Samsung Galaxy Book 4 Pro 360
echo [INFO] Touch input: ENABLED
echo [INFO] WebGPU acceleration: ENABLED
echo [INFO] Gesture recognition: ENABLED
echo [INFO] Physics compression: 256x
echo.
echo [LAUNCH] Starting application on http://localhost:3000
echo.

REM Start React development server with LOLA components
start http://localhost:3000
call npm start

REM Cleanup on exit
:cleanup
echo.
echo [CLEANUP] Shutting down services...
taskkill /f /im python.exe >nul 2>&1
echo [OK] All services stopped
echo.
pause