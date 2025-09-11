/**
 * Simple WebSocket Echo Server for Testing
 * Real-time Gesture Feedback System
 */

const uWS = require('uWebSockets.js');
const port = 9001;

console.log('Starting Simple WebSocket Server...');

const app = uWS.App({})
  .ws('/*', {
    compression: 0,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 120,
    
    open: (ws) => {
      console.log('✅ Client connected');
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        timestamp: Date.now()
      }));
    },
    
    message: (ws, message, isBinary) => {
      const decoder = new TextDecoder();
      const data = JSON.parse(decoder.decode(message));
      
      console.log(` Received gesture: ${data.gesture} (confidence: ${data.confidence?.toFixed(2)})`);
      
      // Echo back with action
      const response = {
        type: 'feedback',
        gesture: data.gesture,
        action: getActionForGesture(data.gesture),
        timestamp: Date.now(),
        latency: Date.now() - data.timestamp
      };
      
      ws.send(JSON.stringify(response));
    },
    
    drain: (ws) => {
      console.log('WebSocket backpressure: ' + ws.getBufferedAmount());
    },
    
    close: (ws, code, message) => {
      console.log('❌ Client disconnected');
    }
  })
  .listen(port, (token) => {
    if (token) {
      console.log(`✅ WebSocket server listening on ws://localhost:${port}`);
    } else {
      console.log(`❌ Failed to listen on port ${port}`);
    }
  });

function getActionForGesture(gesture) {
  const actions = {
    'PINCH': 'Scale graph by factor',
    'SPREAD': 'Adjust angle to degrees',
    'GRAB': 'Move object to position',
    'POINT': 'Select vertex at coordinates',
    'DRAW': 'Create shape with path'
  };
  return actions[gesture] || 'No action';
}

console.log('Server ready for connections...');
