@echo off
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
    echo [!] Make sure venv directory exists.
    pause
    exit /b 1
)
echo [OK] Virtual environment activated.
echo.

echo [2/3] Checking environment...
venv\Scripts\python.exe verify_environment.py
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
echo   - drops\ae_vibe        (Natural language to ExtendScript)
echo   - drops\video_motion   (Video analysis to AE templates)
echo   - drops\batch_ops      (Batch operations from CSV/JSON)
echo   - drops\template_learning (Learn from AEP files)
echo.
echo Starting file watcher...
echo.

REM Run the main system
venv\Scripts\python.exe sfs_enhanced_ae_dropzones.py

pause
