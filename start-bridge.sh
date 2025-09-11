#!/bin/bash
# Start Gesture-WebSocket Bridge

echo " Starting Gesture-WebSocket Bridge..."
echo "================================"

# Set working directory
cd /c/palantir/math

# Check if main server is running
echo "Checking main server..."
nc -zv localhost 8085 2>/dev/null
if [ $? -ne 0 ]; then
    echo "️  Main server not running on port 8085"
    echo "Starting main server first..."
    node server/index.js &
    SERVER_PID=$!
    sleep 3
fi

# Start bridge
echo "Starting bridge..."
node server/gesture-ws-bridge.js &
BRIDGE_PID=$!

echo "✅ Bridge started with PID: $BRIDGE_PID"
echo ""
echo "Ports:"
echo "  Gesture Server: 8081"
echo "  Main Server: 8085"
echo ""
echo "Press Ctrl+C to stop"

# Wait for interrupt
wait $BRIDGE_PID
