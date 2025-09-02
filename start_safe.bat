@echo off
chcp 65001 >nul 2>&1
REM AE Claude Max v3.0 - Quick Start
REM Updated: 2025-09-02

echo ================================================
echo    AE Claude Max v3.0 - Enhanced Drop Zones
echo ================================================
echo.

cd /d C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project

echo [1/3] Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [!] Virtual environment activation failed.
    echo [!] Running with system Python instead...
    set PYTHON_CMD=py
) else (
    echo [OK] Virtual environment activated.
    set PYTHON_CMD=venv\Scripts\python.exe
)
echo.

echo [2/3] Checking environment...
%PYTHON_CMD% run_verify.py
if errorlevel 1 (
    echo [!] Environment verification failed.
    echo [!] Please check the error messages above.
    pause
    exit /b 1
)
echo.

echo [3/3] Starting main system...
echo.
echo Drop Zones are ready at:
echo   - drops\ae_vibe        : Natural language to ExtendScript
echo   - drops\video_motion   : Video analysis to AE templates  
echo   - drops\batch_ops      : Batch operations from CSV/JSON
echo   - drops\template_learning : Learn from AEP files
echo.
echo Starting file watcher...
echo.

REM Run the new v3 system
%PYTHON_CMD% sfs_enhanced_ae_dropzones_v3.py

pause
