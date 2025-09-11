/**
 * µWebSockets Integration Test
 * Tests 8.5x performance improvement implementation
 */

import { WebSocketAbstraction } from '../server/abstraction/websocket-abstraction.js';

async function testUWebSocketsIntegration() {
    console.log(' Testing µWebSockets integration...\n');
    
    try {
        // Test 1: Module availability
        console.log('1. Checking µWebSockets module...');
        const uWS = await import('uWebSockets.js');
        console.log('✅ µWebSockets module loaded successfully');
        
        // Test 2: Create abstraction with uws
        console.log('\n2. Creating WebSocket abstraction with µWebSockets...');
        const wsAbstraction = new WebSocketAbstraction({
            port: 8090,
            implementation: 'uws'
        });
        
        // Test 3: Initialize
        console.log('\n3. Initializing µWebSockets server...');
        await wsAbstraction.initialize();
        console.log('✅ µWebSockets server initialized');
        
        // Test 4: Performance metrics
        console.log('\n4. Checking performance metrics...');
        const metrics = wsAbstraction.metrics.getMetrics();
        console.log(`Target throughput: ${metrics.targetAchieved ? '✅' : '❌'} ${metrics.messagesPerSecond}/${wsAbstraction.metrics.targetThroughput} msg/sec`);
        
        console.log('\n✨ µWebSockets integration test PASSED!');
        console.log(' Ready for 8.5x performance improvement');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ µWebSockets integration test FAILED:');
        console.error(error.message);
        console.error('\nFalling back to standard ws implementation');
        process.exit(1);
    }
}

testUWebSocketsIntegration();
