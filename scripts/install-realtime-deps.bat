@echo off
echo ========================================
echo Installing Real-time Gesture Dependencies
echo ========================================
echo.

echo [1/2] Installing Python packages...
pip install -r requirements-realtime.txt
echo.

echo [2/2] Verifying installation...
python -c "import mediapipe; import cv2; import websockets; print('✅ All packages installed successfully!')"
echo.

echo Installation complete!
pause
