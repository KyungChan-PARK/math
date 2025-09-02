@echo off
title AE Claude Max Enhanced v3.1 - Advanced Orchestration System
color 0A

echo ================================================================================
echo                    AE CLAUDE MAX ENHANCED v3.1
echo                   Advanced Orchestration System
echo ================================================================================
echo.
echo Features:
echo   [HOOKS]      Advanced lifecycle control (pre/post/session)
echo   [AGENTS]     4 specialized Sub-agents for AE workflows
echo   [MONITOR]    Hot folder with debouncing and pipelines
echo   [QUEUE]      Intelligent render queue management
echo   [BACKUP]     Automatic backup for critical operations
echo   [ROUTING]    Smart Opus 4.1 / Sonnet 4 routing
echo ================================================================================
echo.

REM Set project root
set PROJECT_ROOT=C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project
cd /d "%PROJECT_ROOT%"

REM Check Python
echo [1/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.11+
    pause
    exit /b 1
)
echo [OK] Python found

REM Check virtual environment
echo [2/6] Checking virtual environment...
if not exist "venv\Scripts\python.exe" (
    echo [WARNING] Virtual environment not found. Creating...
    python -m venv venv
)
echo [OK] Virtual environment ready

REM Activate virtual environment
echo [3/6] Activating virtual environment...
call venv\Scripts\activate.bat
echo [OK] Virtual environment activated

REM Check API key
echo [4/6] Checking API configuration...
if not exist ".env" (
    echo [WARNING] .env file not found
    echo.
    echo Please create .env file with:
    echo ANTHROPIC_API_KEY=your_key_here
    echo.
    pause
    exit /b 1
)
echo [OK] Configuration found

REM Start components
echo.
echo ================================================================================
echo                         STARTING COMPONENTS
echo ================================================================================
echo.

REM Start hot folder monitor in background
echo [5/6] Starting hot folder monitor...
start /B python ae_hot_folder_monitor.py
echo [OK] Hot folder monitor active

REM Start main system
echo [6/6] Starting main drop zone system...
echo.
echo ================================================================================
echo                         SYSTEM READY
echo ================================================================================
echo.
echo Drop zones active:
echo   - AE Vibe Zone:       drops\ae_vibe\       (Natural language to ExtendScript)
echo   - Video Motion:       drops\video_motion\  (Video analysis and templates)
echo   - Batch Operations:   drops\batch_ops\     (CSV/JSON batch processing)
echo   - Template Learning:  drops\template_learning\ (Pattern learning)
echo.
echo Hot folders active:
echo   - Incoming Assets:    watch\incoming\      (Media import pipeline)
echo   - Render Queue:       watch\render\        (Project render automation)
echo   - Scripts:           watch\scripts\        (ExtendScript execution)
echo.
echo Claude Code Hooks active:
echo   - session_start:     Auto-loads project context
echo   - pre_tool_use:      Validates and secures operations
echo   - post_tool_use:     Triggers quality checks and automation
echo.
echo Sub-agents available:
echo   - ae-asset-processor:      Media validation and optimization
echo   - ae-render-optimizer:     Render queue management
echo   - ae-composition-builder:  Composition creation and management
echo   - ae-delivery-automation:  Output formatting and distribution
echo.
echo ================================================================================
echo.

REM Run main system
python sfs_enhanced_ae_dropzones_v3.py

REM Cleanup on exit
echo.
echo ================================================================================
echo                         SHUTTING DOWN
echo ================================================================================
echo.
echo Stopping components...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq ae_hot_folder_monitor.py*" >nul 2>&1
echo.
echo System shut down successfully.
pause