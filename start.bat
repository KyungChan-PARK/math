@echo off
title Enhanced AE Drop Zones - Claude Max System
color 0A

echo ========================================
echo  Enhanced AE Drop Zones System
echo  Claude Max Optimized (Opus 4.1 + Sonnet 4)
echo  Version 1.0.0 - 2025.09.01
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.11+ from python.org
    pause
    exit /b 1
)

REM Check if API key is set
if "%ANTHROPIC_API_KEY%"=="" (
    echo [WARNING] ANTHROPIC_API_KEY not set
    echo.
    set /p API_KEY="Enter your Claude API Key: "
    set ANTHROPIC_API_KEY=%API_KEY%
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements if needed
pip show anthropic >nul 2>&1
if errorlevel 1 (
    echo Installing required packages...
    pip install -r requirements.txt
    echo.
)

REM Start the system
echo.
echo Starting Enhanced AE Drop Zones System...
echo ========================================
echo.
python sfs_enhanced_ae_dropzones.py

REM Deactivate on exit
deactivate
pause