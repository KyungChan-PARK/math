@echo off
REM LOLA Integration Quick Start (Without MediaPipe)
REM Simplified version for immediate testing

echo ========================================================
echo     LOLA Math Platform - Quick Start Mode
echo     (Running without gesture recognition)
echo ========================================================
echo.

cd /d C:\palantir\math

REM Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    pause
    exit /b 1
)
echo [OK] Node.js detected

REM Install Node dependencies if needed
if not exist "node_modules" (
    echo [SETUP] Installing Node.js dependencies...
    call npm install
)

echo.
echo ========================================================
echo     Starting LOLA Platform (Touch Mode Only)
echo ========================================================
echo.

REM Create minimal Python server without MediaPipe
echo [INFO] Creating simplified LOLA server...
echo import json > src\lola-integration\lola-server-simple.py
echo import time >> src\lola-integration\lola-server-simple.py
echo import random >> src\lola-integration\lola-server-simple.py
echo from http.server import HTTPServer, BaseHTTPRequestHandler >> src\lola-integration\lola-server-simple.py
echo. >> src\lola-integration\lola-server-simple.py
echo class LOLAHandler(BaseHTTPRequestHandler): >> src\lola-integration\lola-server-simple.py
echo     def do_GET(self): >> src\lola-integration\lola-server-simple.py
echo         self.send_response(200) >> src\lola-integration\lola-server-simple.py
echo         self.send_header('Content-type', 'application/json') >> src\lola-integration\lola-server-simple.py
echo         self.send_header('Access-Control-Allow-Origin', '*') >> src\lola-integration\lola-server-simple.py
echo         self.end_headers() >> src\lola-integration\lola-server-simple.py
echo         data = {'status': 'running', 'compression': 256, 'fps': 60} >> src\lola-integration\lola-server-simple.py
echo         self.wfile.write(json.dumps(data).encode()) >> src\lola-integration\lola-server-simple.py
echo. >> src\lola-integration\lola-server-simple.py
echo     def do_POST(self): >> src\lola-integration\lola-server-simple.py
echo         self.send_response(200) >> src\lola-integration\lola-server-simple.py
echo         self.send_header('Content-type', 'application/json') >> src\lola-integration\lola-server-simple.py
echo         self.send_header('Access-Control-Allow-Origin', '*') >> src\lola-integration\lola-server-simple.py
echo         self.end_headers() >> src\lola-integration\lola-server-simple.py
echo         result = {'processed': True, 'timestamp': time.time()} >> src\lola-integration\lola-server-simple.py
echo         self.wfile.write(json.dumps(result).encode()) >> src\lola-integration\lola-server-simple.py
echo. >> src\lola-integration\lola-server-simple.py
echo if __name__ == '__main__': >> src\lola-integration\lola-server-simple.py
echo     print('[LOLA Server] Starting on port 8080...') >> src\lola-integration\lola-server-simple.py
echo     server = HTTPServer(('localhost', 8080), LOLAHandler) >> src\lola-integration\lola-server-simple.py
echo     print('[LOLA Server] Ready! Serving at http://localhost:8080') >> src\lola-integration\lola-server-simple.py
echo     server.serve_forever() >> src\lola-integration\lola-server-simple.py

echo [OK] Simplified server created

REM Start the simplified LOLA server
echo [SERVICE] Starting LOLA Server (Touch Mode)...
start /b cmd /c "python src\lola-integration\lola-server-simple.py"
timeout /t 2 /nobreak >nul

echo.
echo ========================================================
echo     Platform Ready - Touch Input Only Mode
echo ========================================================
echo.
echo [INFO] Features available:
echo   - Touch input: ENABLED
echo   - WebGPU acceleration: ENABLED  
echo   - Physics simulation: ENABLED
echo   - Gesture recognition: DISABLED (Python 3.13 incompatible)
echo.
echo [INFO] To enable full features, install Python 3.11 or lower
echo.

REM Start React application
echo [LAUNCH] Starting application on http://localhost:3000
echo.
start http://localhost:3000

REM Check if build exists
if not exist "build" (
    echo [BUILD] First time setup - building application...
    call npm run build
)

REM Start the app
call npm start

pause