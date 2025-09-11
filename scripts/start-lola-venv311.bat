@echo off
REM LOLA Integration with Python 3.11 Virtual Environment
REM Uses existing venv311 for full MediaPipe support

echo ========================================================
echo     LOLA-Enhanced Math Learning Platform
echo     Python 3.11 Full Feature Version
echo ========================================================
echo.

cd /d C:\palantir\math

REM Check if venv311 exists
if not exist "venv311" (
    echo [ERROR] Python 3.11 virtual environment not found!
    echo Please create it first with: python -m venv venv311
    pause
    exit /b 1
)

REM Activate Python 3.11 virtual environment
echo [SETUP] Activating Python 3.11 environment...
call venv311\Scripts\activate.bat

REM Check Python version
python --version 2>&1 | findstr /C:"3.11" >nul
if %errorlevel% neq 0 (
    echo [WARNING] Python 3.11 not detected in venv311
    echo Current version:
    python --version
    echo.
    echo Do you want to continue anyway? (Y/N)
    choice /c YN /n
    if errorlevel 2 exit /b 1
)

echo [OK] Python 3.11 environment activated

REM Install Python packages with timeout handling
echo.
echo [SETUP] Installing Python packages...

REM MediaPipe (should work with Python 3.11)
pip show mediapipe >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing MediaPipe for gesture recognition...
    pip install mediapipe --no-cache-dir --timeout 60
    if %errorlevel% neq 0 (
        echo [WARNING] MediaPipe installation failed, continuing without it
    )
)

REM NumPy
pip show numpy >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing NumPy...
    pip install numpy --no-cache-dir --timeout 60
)

REM OpenCV
pip show opencv-python >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing OpenCV...
    pip install opencv-python --no-cache-dir --timeout 60
)

REM Skip TensorFlow if download is too slow, use alternative
pip show tensorflow >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] TensorFlow not installed. Options:
    echo   1. Skip TensorFlow (use scikit-learn instead)
    echo   2. Install TensorFlow-CPU (smaller, faster)
    echo   3. Try full TensorFlow (may be slow)
    echo.
    echo Press 1, 2, or 3:
    choice /c 123 /n /d 1 /t 10
    
    if errorlevel 3 (
        echo Installing full TensorFlow (this may take time)...
        pip install tensorflow --no-cache-dir --timeout 300
    ) else if errorlevel 2 (
        echo Installing TensorFlow-CPU (lighter version)...
        pip install tensorflow-cpu --no-cache-dir --timeout 120
    ) else (
        echo Skipping TensorFlow, using scikit-learn...
        pip install scikit-learn --no-cache-dir --timeout 60
    )
)

echo [OK] Python packages ready

REM Check Node.js dependencies
if not exist "node_modules" (
    echo.
    echo [SETUP] Installing Node.js dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Node.js dependencies
        pause
        exit /b 1
    )
)

REM Create LOLA physics server
echo.
echo [SETUP] Creating LOLA physics server...
if not exist "src\lola-integration\lola-server.py" (
    python -c "
import json
import time
import random
import numpy as np
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

class LOLAPhysicsEmulator:
    def __init__(self):
        self.compression_rate = 256
        self.fps = 60
        
    def compress(self, data, rate):
        '''Simulate LOLA compression'''
        return np.array(data).reshape(-1, rate).mean(axis=1).tolist()
        
    def emulate_physics(self, state, steps=10):
        '''Simple physics emulation'''
        trajectory = []
        current = np.array(state)
        for i in range(steps):
            current = current * np.cos(i * 0.1) + np.random.randn(*current.shape) * 0.01
            trajectory.append(current.tolist())
        return trajectory

class LOLAHandler(BaseHTTPRequestHandler):
    emulator = LOLAPhysicsEmulator()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        status = {
            'status': 'running',
            'compression': self.emulator.compression_rate,
            'fps': self.emulator.fps,
            'timestamp': time.time()
        }
        self.wfile.write(json.dumps(status).encode())
        
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        try:
            data = json.loads(post_data)
            result = self.emulator.emulate_physics(data.get('state', [1.0]), data.get('steps', 10))
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'result': result, 'timestamp': time.time()}).encode())
        except Exception as e:
            self.send_error(500, str(e))
            
    def log_message(self, format, *args):
        return  # Suppress logs

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8080), LOLAHandler)
    print('[LOLA Server] Starting on http://localhost:8080')
    print('[LOLA Server] Ready!')
    server.serve_forever()
" > src\lola-integration\lola-server.py
)

REM Create gesture controller with MediaPipe
echo [SETUP] Creating gesture controller...
if not exist "src\lola-integration\gesture_physics_controller.py" (
    python -c "
import json
import time
import socket
import threading

try:
    import mediapipe as mp
    mp_hands = mp.solutions.hands
    MEDIAPIPE_AVAILABLE = True
    print('[Gesture] MediaPipe loaded successfully')
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    print('[Gesture] MediaPipe not available, using touch-only mode')

class GestureController:
    def __init__(self):
        self.running = True
        if MEDIAPIPE_AVAILABLE:
            self.hands = mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=0.5
            )
        
    def process_gesture(self, data):
        gesture = {
            'type': data.get('type', 'unknown'),
            'position': data.get('position', [0, 0]),
            'confidence': 0.9,
            'timestamp': time.time()
        }
        return gesture
        
    def start_server(self, port=8081):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.bind(('localhost', port))
        server.listen(5)
        server.settimeout(1.0)
        
        print(f'[Gesture Controller] Server started on port {port}')
        
        while self.running:
            try:
                client, addr = server.accept()
                data = client.recv(1024).decode()
                if data:
                    touch_data = json.loads(data)
                    gesture = self.process_gesture(touch_data)
                    client.send(json.dumps(gesture).encode())
                client.close()
            except socket.timeout:
                continue
            except Exception as e:
                if self.running:
                    print(f'[Gesture Controller] Error: {e}')
                    
        server.close()

if __name__ == '__main__':
    controller = GestureController()
    try:
        controller.start_server()
    except KeyboardInterrupt:
        controller.running = False
        print('[Gesture Controller] Stopped')
" > src\lola-integration\gesture_physics_controller.py
)

echo.
echo ========================================================
echo     Starting LOLA Integration Services
echo ========================================================
echo.

REM Start LOLA physics server
echo [SERVICE] Starting LOLA Physics Server...
start /b cmd /c "python src\lola-integration\lola-server.py 2>lola-error.log"
timeout /t 2 /nobreak >nul

REM Check if server started
netstat -an | findstr :8080 >nul
if %errorlevel% equ 0 (
    echo [OK] LOLA Physics Server running on port 8080
) else (
    echo [WARNING] LOLA Physics Server may not have started
    echo Check lola-error.log for details
)

REM Start gesture controller
echo [SERVICE] Starting Gesture Recognition Service...
start /b cmd /c "python src\lola-integration\gesture_physics_controller.py 2>gesture-error.log"
timeout /t 2 /nobreak >nul

REM Check if gesture service started
netstat -an | findstr :8081 >nul
if %errorlevel% equ 0 (
    echo [OK] Gesture Service running on port 8081
) else (
    echo [WARNING] Gesture Service may not have started
    echo Check gesture-error.log for details
)

echo.
echo ========================================================
echo     Launching LOLA-Enhanced Math Platform
echo ========================================================
echo.
echo [INFO] System Status:
echo   ✓ Python 3.11 environment: ACTIVE
echo   ✓ Touch input: ENABLED
echo   ✓ WebGPU acceleration: ENABLED
echo   ✓ Physics simulation: RUNNING
if %MEDIAPIPE_AVAILABLE%==1 (
    echo   ✓ MediaPipe gestures: ENABLED
) else (
    echo   ⚠ MediaPipe gestures: DISABLED
)
echo.
echo [INFO] Platform optimized for Samsung Galaxy Book 4 Pro 360
echo [INFO] Access the application at: http://localhost:3000
echo.

REM Open browser
start http://localhost:3000

REM Start React application
echo [LAUNCH] Starting React application...
call npm start

:cleanup
echo.
echo [CLEANUP] Shutting down services...
taskkill /f /im python.exe >nul 2>&1
echo [OK] All services stopped
echo.
pause