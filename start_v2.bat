@echo off
title AE Automation v2.0 - Complete Rewrite
color 0B

cls
echo ============================================
echo    AE AUTOMATION v2.0 - AGENT ARCHITECTURE
echo ============================================
echo  Complete Rewrite with IndyDevDan Patterns
echo  Powered by Claude Opus 4.1 + Sonnet 4
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.11+ from python.org
    pause
    exit /b 1
)

REM Check API Key
if "%ANTHROPIC_API_KEY%"=="" (
    echo [INFO] Loading API key from .env file...
    REM The python script will load it from .env
)

echo [1] Installing/Updating dependencies...
pip install -q anthropic python-dotenv pyyaml rich watchdog

echo.
echo [2] Creating directory structure...
mkdir drops\ae_vibe 2>nul
mkdir drops\motion 2>nul
mkdir drops\batch 2>nul
mkdir drops\templates 2>nul
mkdir outputs 2>nul
mkdir cache 2>nul
mkdir agents\generated 2>nul

echo.
echo [3] Starting AE Automation v2.0...
echo ============================================
echo.

REM Run the main system
python ae_automation_v2.py

echo.
echo ============================================
echo System has been shut down.
pause