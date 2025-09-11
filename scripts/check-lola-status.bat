@echo off
cls
echo ========================================
echo    LOLA System Status Check
echo ========================================
echo.

echo Checking Python installations...
echo --------------------------------

if exist "C:\palantir\math\venv311\Scripts\python.exe" (
    echo [OK] venv311 Python found:
    C:\palantir\math\venv311\Scripts\python.exe --version
) else (
    echo [X] venv311 not found
)

if exist "C:\palantir\math\venv\Scripts\python.exe" (
    echo [OK] venv Python found:
    C:\palantir\math\venv\Scripts\python.exe --version
) else (
    echo [X] venv not found
)

echo.
echo System Python:
python --version 2>nul || echo [X] Python not in PATH

echo.
echo Checking server files...
echo ------------------------

if exist "C:\palantir\math\src\lola-integration\lola-server.py" (
    echo [OK] lola-server.py exists
) else (
    echo [X] lola-server.py missing
)

if exist "C:\palantir\math\src\lola-integration\gesture_physics_controller.py" (
    echo [OK] gesture_physics_controller.py exists
) else (
    echo [X] gesture_physics_controller.py missing
)

echo.
echo Checking Node.js...
echo -------------------
node --version 2>nul || echo [X] Node.js not found
npm --version 2>nul || echo [X] npm not found

if exist "C:\palantir\math\node_modules" (
    echo [OK] node_modules exists
) else (
    echo [X] node_modules missing - run: npm install
)

echo.
echo Checking ports...
echo -----------------
netstat -an | findstr :8080 >nul
if %errorlevel% equ 0 (
    echo [!] Port 8080 is in use (LOLA Server port)
) else (
    echo [OK] Port 8080 is available
)

netstat -an | findstr :8081 >nul
if %errorlevel% equ 0 (
    echo [!] Port 8081 is in use (Gesture Controller port)
) else (
    echo [OK] Port 8081 is available
)

netstat -an | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo [!] Port 3000 is in use (React app port)
) else (
    echo [OK] Port 3000 is available
)

echo.
echo ========================================
echo    Status check complete
echo ========================================
echo.
pause