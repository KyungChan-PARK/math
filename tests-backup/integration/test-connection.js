// Simple WebSocket connection test
import WebSocket from 'ws';

console.log('Testing WebSocket connection to localhost:8080...');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('✅ Connected successfully!');
    
    // Send a test message
    const testMessage = {
        type: 'ECHO_REQUEST',
        data: 'Hello Server',
        timestamp: Date.now()
    };
    
    console.log('Sending test message:', testMessage);
    ws.send(JSON.stringify(testMessage));
});

ws.on('message', (data) => {
    console.log('Received:', data.toString());
    ws.close();
});

ws.on('error', (error) => {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
});

ws.on('close', () => {
    console.log('Connection closed');
    process.exit(0);
});
