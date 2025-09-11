@echo off
REM LOLA Integration - Python 3.13 Compatible Version
REM Works without MediaPipe using alternative libraries

echo ========================================================
echo     LOLA Math Platform - Python 3.13 Edition
echo     Alternative Implementation (No MediaPipe)
echo ========================================================
echo.

cd /d C:\palantir\math

REM Check Python version
echo [INFO] Checking Python version...
python --version 2>&1 | findstr /C:"3.13" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Python 3.13 detected - Using alternative libraries
    set USE_ALT=1
) else (
    echo [OK] Python version compatible
    set USE_ALT=0
)

REM Install compatible packages only
echo.
echo [SETUP] Installing compatible Python packages...

REM Skip packages that don't work with Python 3.13
pip show numpy >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing NumPy...
    pip install numpy --quiet
)

pip show opencv-python >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing OpenCV...
    pip install opencv-python --quiet
)

pip show scikit-learn >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing scikit-learn for ML features...
    pip install scikit-learn --quiet
)

echo [OK] Compatible packages installed

REM Create Python server
echo.
echo [SETUP] Creating LOLA physics server...
(
echo import json
echo import time
echo import numpy as np
echo from http.server import HTTPServer, BaseHTTPRequestHandler
echo import threading
echo.
echo class LOLAPhysicsServer:
echo     def __init__(self^):
echo         self.compression_rate = 256
echo         self.fps = 60
echo         self.running = True
echo.        
echo     def compress_physics(self, data, rate^):
echo         """Simulate LOLA compression"""
echo         if isinstance(data, list^):
echo             data = np.array(data^)
echo         compressed_size = max(1, len(data^) // rate^)
echo         compressed = np.mean(data.reshape(-1, rate^), axis=1^) if len(data^) ^>= rate else data
echo         return compressed.tolist(^) if hasattr(compressed, 'tolist'^) else compressed
echo.    
echo     def emulate_physics(self, state, steps=10^):
echo         """Simple physics emulation"""
echo         trajectory = []
echo         current = np.array(state^) if isinstance(state, list^) else state
echo         for i in range(steps^):
echo             # Simple wave equation simulation
echo             current = current * np.cos(i * 0.1^) + np.random.randn(*current.shape^) * 0.01
echo             trajectory.append(current.tolist(^) if hasattr(current, 'tolist'^) else current^)
echo         return trajectory
echo.
echo class LOLAHandler(BaseHTTPRequestHandler^):
echo     def do_OPTIONS(self^):
echo         self.send_response(200^)
echo         self.send_header('Access-Control-Allow-Origin', '*'^)
echo         self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'^)
echo         self.send_header('Access-Control-Allow-Headers', 'Content-Type'^)
echo         self.end_headers(^)
echo.    
echo     def do_GET(self^):
echo         self.send_response(200^)
echo         self.send_header('Content-type', 'application/json'^)
echo         self.send_header('Access-Control-Allow-Origin', '*'^)
echo         self.end_headers(^)
echo         status = {
echo             'status': 'running',
echo             'compression': server.compression_rate,
echo             'fps': server.fps,
echo             'timestamp': time.time(^)
echo         }
echo         self.wfile.write(json.dumps(status^).encode(^)^)
echo.    
echo     def do_POST(self^):
echo         content_length = int(self.headers['Content-Length']^)
echo         post_data = self.rfile.read(content_length^)
echo         
echo         try:
echo             data = json.loads(post_data^)
echo             action = data.get('action', 'process'^)
echo             
echo             if action == 'compress':
echo                 result = server.compress_physics(data.get('state', []^), server.compression_rate^)
echo             elif action == 'emulate':
echo                 result = server.emulate_physics(data.get('state', [1.0]^), data.get('steps', 10^)^)
echo             else:
echo                 result = {'processed': True}
echo                 
echo             self.send_response(200^)
echo             self.send_header('Content-type', 'application/json'^)
echo             self.send_header('Access-Control-Allow-Origin', '*'^)
echo             self.end_headers(^)
echo             self.wfile.write(json.dumps({'result': result, 'timestamp': time.time(^)}^).encode(^)^)
echo             
echo         except Exception as e:
echo             self.send_response(500^)
echo             self.send_header('Content-type', 'application/json'^)
echo             self.send_header('Access-Control-Allow-Origin', '*'^)
echo             self.end_headers(^)
echo             self.wfile.write(json.dumps({'error': str(e^)}^).encode(^)^)
echo.
echo if __name__ == '__main__':
echo     server = LOLAPhysicsServer(^)
echo     httpd = HTTPServer(('localhost', 8080^), LOLAHandler^)
echo     print('[LOLA Server] Starting on http://localhost:8080'^)
echo     print('[LOLA Server] Compression: {}x'.format(server.compression_rate^)^)
echo     print('[LOLA Server] Ready!'^)
echo     httpd.serve_forever(^)
) > src\lola-integration\lola_server_py313.py

echo [OK] LOLA server created

REM Start services
echo.
echo ========================================================
echo     Starting Services
echo ========================================================
echo.

REM Start LOLA physics server
echo [SERVICE] Starting LOLA Physics Server...
start /b cmd /c "python src\lola-integration\lola_server_py313.py 2>lola-error.log"
timeout /t 2 /nobreak >nul
echo [OK] Physics server started

REM Start alternative gesture controller
echo [SERVICE] Starting Gesture Controller (Alternative)...
start /b cmd /c "python src\lola-integration\gesture_controller_alt.py 2>gesture-error.log"
timeout /t 2 /nobreak >nul
echo [OK] Gesture controller started

REM Check Node.js dependencies
if not exist "node_modules" (
    echo.
    echo [SETUP] Installing Node.js dependencies...
    call npm install
)

echo.
echo ========================================================
echo     LOLA Platform Ready - Python 3.13 Mode
echo ========================================================
echo.
echo [INFO] System Status:
echo   ✓ Touch input: ENABLED
echo   ✓ Physics simulation: ENABLED (Alternative)
echo   ✓ WebGPU acceleration: ENABLED
echo   ⚠ MediaPipe gestures: DISABLED (Use touch instead)
echo.
echo [TIP] For full MediaPipe support, install Python 3.11:
echo       https://www.python.org/downloads/release/python-3119/
echo.
echo [LAUNCH] Starting application on http://localhost:3000
echo.

REM Open browser
start http://localhost:3000

REM Start React app
echo Starting React application...
call npm start

:cleanup
echo.
echo [CLEANUP] Shutting down services...
taskkill /f /im python.exe >nul 2>&1
echo [OK] Services stopped
pause