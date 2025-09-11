@echo off
chcp 65001 >nul 2>&1
echo ========================================
echo   MATH LEARNING PLATFORM LAUNCHER v4.2
echo   Unified Execution Script - FIXED
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
echo [5] Install Required Packages
echo [6] Kill All Processes
echo [7] Python 3.11 Environment
echo [8] Open Documentation
echo [9] Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto intent
if "%choice%"=="2" goto physics
if "%choice%"=="3" goto full
if "%choice%"=="4" goto status
if "%choice%"=="5" goto install
if "%choice%"=="6" goto killall
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
start "LOLA Intent" cmd /c "venv311\Scripts\python.exe src\lola-integration\lola_math_intent_system.py"
timeout /t 3 >nul
start "" "C:\palantir\math\lola-math-intent.html"
echo.
echo System started! Check the opened browser window.
pause
goto menu

:physics
echo.
echo Starting LOLA Physics Platform...
cd /d "C:\palantir\math"
echo [INFO] Installing required packages first...
venv311\Scripts\python.exe -m pip install fastapi uvicorn websockets --quiet
start "LOLA Physics" cmd /c "venv311\Scripts\python.exe src\lola-integration\lola-server-8090.py"
timeout /t 3 >nul
start "" "C:\palantir\math\lola-platform.html"
echo.
echo System started! Check the opened browser window.
pause
goto menu

:full
echo.
echo Starting Full System...
cd /d "C:\palantir\math"
echo.
echo [1/3] Starting LOLA Intent Learning...
start "LOLA Intent" cmd /c "venv311\Scripts\python.exe src\lola-integration\lola_math_intent_system.py"
timeout /t 2 >nul
echo [2/3] Starting LOLA Physics...
start "LOLA Physics" cmd /c "venv311\Scripts\python.exe src\lola-integration\lola-server-8090.py"
timeout /t 3 >nul
echo [3/3] Opening web interfaces...
start "" "C:\palantir\math\lola-math-intent.html"
start "" "C:\palantir\math\lola-platform.html"
echo.
echo Both systems started! Check the opened browser windows.
pause
goto menu

:status
echo.
echo Checking system status...
echo.
echo Python environments:
if exist venv311\Scripts\python.exe (
    echo [OK] venv311 found
    venv311\Scripts\python.exe --version
) else (
    echo [X] venv311 not found
)
echo.
echo Checking ports:
netstat -an | findstr :8092 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 8092 (Intent Learning) - ACTIVE
) else (
    echo [X] Port 8092 (Intent Learning) - NOT ACTIVE
)
netstat -an | findstr :8090 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Port 8090 (Physics) - ACTIVE
) else (
    echo [X] Port 8090 (Physics) - NOT ACTIVE
)
echo.
pause
goto menu

:install
echo.
echo Installing required packages...
cd /d "C:\palantir\math"
echo.
echo Installing for LOLA Intent Learning...
venv311\Scripts\python.exe -m pip install numpy scikit-learn scipy
echo.
echo Installing for LOLA Physics...
venv311\Scripts\python.exe -m pip install fastapi uvicorn websockets
echo.
echo Installation complete!
pause
goto menu

:killall
echo.
echo Killing all Python and CMD processes...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM cmd.exe 2>nul
echo.
echo All processes terminated.
pause
goto menu

:python
echo.
echo Activating Python 3.11 environment...
cd /d "C:\palantir\math"
call venv311\Scripts\activate.bat
echo Python environment activated!
python --version
cmd /k
goto menu

:docs
echo.
echo Opening documentation...
cd /d "C:\palantir\math"
if exist README.md start "" "README.md"
if exist PROJECT_STATUS_LATEST.md start "" "PROJECT_STATUS_LATEST.md"
if exist AI_AGENTS_SYSTEM.md start "" "AI_AGENTS_SYSTEM.md"
pause
goto menu

:exit
echo.
echo Cleaning up...
taskkill /F /IM python.exe 2>nul
echo Thank you for using Math Learning Platform!
timeout /t 2 /nobreak >nul
exit /b 0
