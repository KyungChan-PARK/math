@echo on
REM Test LOLA Components Step by Step

echo ========================================
echo    LOLA Component Test
echo ========================================
echo.

cd /d C:\palantir\math

REM Step 1: Test Python environment
echo.
echo STEP 1: Testing Python environment
echo ----------------------------------------

if exist "venv311\Scripts\python.exe" (
    echo [OK] venv311 Python found
    venv311\Scripts\python.exe --version
) else if exist "venv\Scripts\python.exe" (
    echo [OK] venv Python found
    venv\Scripts\python.exe --version
    set PYTHON_EXE=venv\Scripts\python.exe
) else (
    echo [WARNING] Using system Python
    python --version
    set PYTHON_EXE=python
)

pause

REM Step 2: Test Python server files
echo.
echo STEP 2: Checking Python server files
echo ----------------------------------------

if exist "src\lola-integration\lola-server.py" (
    echo [OK] lola-server.py exists
) else (
    echo [ERROR] lola-server.py not found
)

if exist "src\lola-integration\gesture_physics_controller.py" (
    echo [OK] gesture_physics_controller.py exists
) else (
    echo [ERROR] gesture_physics_controller.py not found
)

pause

REM Step 3: Test LOLA server
echo.
echo STEP 3: Testing LOLA Server
echo ----------------------------------------
echo Starting LOLA server in new window...
echo (Close the server window to continue)
echo.

if exist "venv311\Scripts\python.exe" (
    venv311\Scripts\python.exe src\lola-integration\lola-server.py
) else (
    python src\lola-integration\lola-server.py
)

pause

REM Step 4: Test Node.js
echo.
echo STEP 4: Testing Node.js
echo ----------------------------------------

node --version
npm --version

if exist "node_modules" (
    echo [OK] node_modules exists
) else (
    echo [WARNING] node_modules not found
    echo Run: npm install
)

pause

REM Step 5: Test React app
echo.
echo STEP 5: Testing React App
echo ----------------------------------------
echo.

echo Available npm scripts:
npm run

echo.
echo To start the app, run: npm start
echo.

pause