@echo off
cls
echo ========================================================
echo     LOLA Mathematical Intent Learning System
echo     Based on "Lost in Latent Space" by PolymathicAI
echo ========================================================
echo.

cd /d C:\palantir\math

echo [SETUP] Checking Python environment...
if exist "venv311\Scripts\python.exe" (
    set PYTHON_EXE=venv311\Scripts\python.exe
    echo [OK] Using Python 3.11 from venv311
) else if exist "venv\Scripts\python.exe" (
    set PYTHON_EXE=venv\Scripts\python.exe
    echo [OK] Using Python from venv
) else (
    set PYTHON_EXE=python
    echo [INFO] Using system Python
)

echo.
echo [SETUP] Installing required packages...
%PYTHON_EXE% -m pip install numpy scikit-learn scipy --quiet 2>nul

echo.
echo ========================================================
echo     Starting LOLA Mathematical Intent Learning
echo ========================================================
echo.

REM Start LOLA Math Intent Server
echo [1/2] Starting LOLA Math Intent Server (port 8092)...
start "LOLA Math Intent" /min cmd /c "%PYTHON_EXE% src\lola-integration\lola_math_intent_system.py"

timeout /t 3 >nul

REM Check if server is running
netstat -an | findstr :8092 >nul
if %errorlevel% equ 0 (
    echo [OK] LOLA Math Intent Server running on port 8092
) else (
    echo [WARNING] Server may not have started properly
)

echo.
echo [2/2] Opening LOLA Math Interface...
echo.

REM Open the interface
start "" "C:\palantir\math\lola-math-intent.html"

echo.
echo ========================================================
echo     System Ready!
echo ========================================================
echo.
echo [INFO] LOLA Mathematical Intent Learning Features:
echo   - Latent space encoding (64 dimensions)
echo   - 256x compression rate
echo   - Learning from user attempts
echo   - Optimized suggestion after 5+ attempts
echo   - Support for all mathematical domains
echo   - 2D and 3D visualization
echo   - Gradient visualization for 3D surfaces
echo.
echo [USAGE] How to use:
echo   1. Select mathematical context (Geometry, Calculus, etc.)
echo   2. Draw your mathematical concept multiple times
echo   3. System learns your intent from attempts
echo   4. After 5+ attempts, see optimized suggestion
echo   5. Accept or reject suggestions to improve learning
echo.
echo [DATA] Learning data saved to:
echo   C:\palantir\math\lola_math_data\
echo.
echo Press any key to close this window...
echo.

pause >nul
exit /b 0
