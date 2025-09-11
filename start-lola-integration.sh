#!/bin/bash
# LOLA Integration Launch Script
# For Samsung Galaxy Book 4 Pro 360 Touch

echo "🚀 Starting LOLA-Enhanced Math Learning Platform..."
echo "================================================"

# Check Node.js version
NODE_VERSION=$(node -v)
echo "✓ Node.js version: $NODE_VERSION"

# Check Python version
PYTHON_VERSION=$(python --version 2>&1)
echo "✓ Python version: $PYTHON_VERSION"

# Set environment variables
export NODE_ENV=production
export LOLA_MODE=integrated
export WEBGPU_ENABLED=true
export TOUCH_MODE=hybrid
export GESTURE_RECOGNITION=true

# Navigate to project directory
cd /c/palantir/math

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python -m venv venv
fi

# Activate Python environment
source venv/Scripts/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -q mediapipe tensorflow numpy opencv-python

# Start LOLA server
echo "🔬 Starting LOLA Physics Server..."
python src/lola-integration/lola-server.py &
LOLA_PID=$!
echo "✓ LOLA Server started (PID: $LOLA_PID)"

# Start gesture recognition service
echo "🖐️ Starting Gesture Recognition Service..."
python src/lola-integration/gesture_physics_controller.py &
GESTURE_PID=$!
echo "✓ Gesture Service started (PID: $GESTURE_PID)"

# Build React application
echo "⚛️ Building React application..."
npm run build:lola

# Start the main application
echo "🎯 Launching Main Application..."
npm run start:lola

# Cleanup function
cleanup() {
    echo "🛑 Shutting down services..."
    kill $LOLA_PID 2>/dev/null
    kill $GESTURE_PID 2>/dev/null
    echo "✓ All services stopped"
    exit 0
}

# Set up cleanup on exit
trap cleanup EXIT INT TERM

# Keep script running
wait