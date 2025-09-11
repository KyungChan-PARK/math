/**
 * Simple WebSocket connection test
 */

import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8085');

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    
    // Send test message
    ws.send(JSON.stringify({
        type: 'ping',
        data: 'test'
    }));
});

ws.on('message', (data) => {
    console.log(' Received:', data.toString());
    ws.close();
});

ws.on('error', (error) => {
    console.error('❌ Error:', error.message);
});

ws.on('close', () => {
    console.log(' Connection closed');
    process.exit(0);
});

setTimeout(() => {
    console.log('⏱️ Timeout - closing connection');
    ws.close();
    process.exit(1);
}, 5000);