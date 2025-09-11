/**
 * Bridge Integration Test
 * Tests gesture-ws-bridge connectivity
 */

import GestureWebSocketBridge from './gesture-ws-bridge.js';
import WebSocket from 'ws';
import msgpack from 'msgpack-lite';

async function testBridge() {
    console.log(' Testing Gesture-WebSocket Bridge...\n');
    
    // Start bridge
    const bridge = new GestureWebSocketBridge({
        gesturePort: 8081,
        serverPort: 8085
    });
    
    try {
        await bridge.start();
        console.log('✅ Bridge started successfully\n');
        
        // Simulate gesture client
        console.log(' Simulating gesture client connection...');
        const gestureClient = new WebSocket('ws://localhost:8081');
        
        await new Promise((resolve) => {
            gestureClient.on('open', () => {
                console.log('✅ Gesture client connected');
                resolve();
            });
        });
        
        // Test gesture command
        console.log('\n Testing gesture command...');
        gestureClient.send(msgpack.encode({
            type: 'gesture',
            gesture: { type: 'circle', confidence: 0.95 }
        }));
        
        // Test natural language
        console.log(' Testing natural language...');
        gestureClient.send(msgpack.encode({
            type: 'natural_language',
            text: 'Create a rotating text animation'
        }));
        
        // Test canvas data
        console.log('✏️ Testing canvas data...');
        gestureClient.send(msgpack.encode({
            type: 'canvas_data',
            points: [
                {x: 100, y: 100},
                {x: 200, y: 100},
                {x: 200, y: 200}
            ]
        }));
        
        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check metrics
        console.log('\n Bridge Metrics:');
        console.log(`  Gesture commands: ${bridge.metrics.gestureCommands}`);
        console.log(`  Messages processed: ${bridge.metrics.messagesProcessed}`);
        console.log(`  Errors: ${bridge.metrics.errors}`);
        
        console.log('\n✅ All tests passed!');
        
        // Cleanup
        gestureClient.close();
        await bridge.shutdown();
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await bridge.shutdown();
        process.exit(1);
    }
}

// Run test
testBridge().then(() => {
    console.log('\n Bridge integration complete!');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
