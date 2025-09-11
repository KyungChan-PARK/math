@echo off
echo ========================================
echo  Neo4j + Real-time Gesture Integration
echo ========================================
echo.

REM Check if Neo4j is running
echo [1/4] Checking Neo4j status...
docker ps | findstr neo4j >nul
if errorlevel 1 (
    echo ERROR: Neo4j is not running!
    echo Please start Docker containers first.
    exit /b 1
)
echo ✓ Neo4j is running

REM Check Node.js
echo [2/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found!
    exit /b 1
)
echo ✓ Node.js installed

REM Start Neo4j integration
echo [3/4] Starting Neo4j Integration Server...
start /B node realtime-neo4j-integration.js
timeout /t 3 >nul

REM Start gesture bridge
echo [4/4] Starting Gesture Bridge...
start /B python realtime-gesture-bridge.py

echo.
echo ========================================
echo  System Started Successfully!
echo ========================================
echo.
echo Services running:
echo - Neo4j Integration: ws://localhost:8089
echo - Gesture Bridge: ws://localhost:8088
echo - Neo4j Database: bolt://localhost:7687
echo.
echo Press Ctrl+C to stop all services
echo.
pause >nul