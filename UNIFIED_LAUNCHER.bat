@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   MATH LEARNING PLATFORM LAUNCHER v4.2
echo   Unified Execution Script
echo ========================================
echo.

:menu
cls
echo ========================================
echo   MATH LEARNING PLATFORM LAUNCHER v4.2
echo ========================================
echo.
echo Choose an option:
echo.
echo [1] LOLA Intent Learning System (NEW)
echo [2] LOLA Physics Platform
echo [3] Full System (Intent + Physics)
echo [4] Check System Status
echo [5] Run Tests
echo [6] View Dashboard
echo [7] Python 3.11 Environment
echo [8] Open Documentation
echo [9] Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto intent
if "%choice%"=="2" goto physics
if "%choice%"=="3" goto full
if "%choice%"=="4" goto status
if "%choice%"=="5" goto tests
if "%choice%"=="6" goto dashboard
if "%choice%"=="7" goto python
if "%choice%"=="8" goto docs
if "%choice%"=="9" goto exit

echo Invalid choice. Please try again.
pause
goto menu

:intent
echo.
echo Starting LOLA Intent Learning System...
cd /d "C:\palantir\math"
call start-lola-intent.bat
pause
goto menu

:physics
echo.
echo Starting LOLA Physics Platform...
cd /d "C:\palantir\math"
call start-lola-final.bat
pause
goto menu

:full
echo.
echo Starting Full System...
cd /d "C:\palantir\math"
start /b start-lola-intent.bat
timeout /t 2 /nobreak >nul
start /b start-lola-final.bat
echo.
echo Both systems are starting...
echo Opening web interfaces in 5 seconds...
timeout /t 5 /nobreak >nul
start "" "%CD%\lola-math-intent.html"
start "" "%CD%\lola-platform.html"
pause
goto menu

:status
echo.
echo Checking system status...
cd /d "C:\palantir\math"
if exist check-lola-status.bat (
    call check-lola-status.bat
) else (
    echo Status check script not found.
    echo Checking ports manually...
    netstat -an | findstr :8092
    netstat -an | findstr :8090
    netstat -an | findstr :8081
)
pause
goto menu

:tests
echo.
echo Running tests...
cd /d "C:\palantir\math"
if exist test-lola-components.bat (
    call test-lola-components.bat
) else (
    echo Test script not found.
    echo Running npm test instead...
    npm test
)
pause
goto menu

:dashboard
echo.
echo Opening System Dashboard...
cd /d "C:\palantir\math"
if exist SYSTEM_INTEGRATION_DASHBOARD.md (
    start "" "SYSTEM_INTEGRATION_DASHBOARD.md"
) else (
    echo Dashboard file not found.
)
pause
goto menu

:python
echo.
echo Activating Python 3.11 environment...
cd /d "C:\palantir\math"
if exist venv311\Scripts\activate.bat (
    call venv311\Scripts\activate.bat
    echo Python environment activated!
    python --version
    cmd /k
) else (
    echo Python environment not found.
)
goto menu

:docs
echo.
echo Opening documentation...
cd /d "C:\palantir\math"
if exist README.md start "" "README.md"
if exist DOCUMENTATION_INDEX.md start "" "DOCUMENTATION_INDEX.md"
if exist PROJECT_STATUS_LATEST.md start "" "PROJECT_STATUS_LATEST.md"
pause
goto menu

:exit
echo.
echo Thank you for using Math Learning Platform!
echo Shutting down...
timeout /t 2 /nobreak >nul
exit /b 0
