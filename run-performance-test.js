#!/usr/bin/env node

/**
 * WebSocket Performance Test Runner
 * Runs the performance benchmark against the optimized WebSocket server
 */

import WebSocketPerformanceTester from './benchmarks/websocket-performance-test.js';

// Configuration for the test
const config = {
    serverUrl: process.env.WS_URL || 'ws://localhost:8080',
    numClients: parseInt(process.env.NUM_CLIENTS) || 10,
    messagesPerClient: parseInt(process.env.MESSAGES_PER_CLIENT) || 100,
    messageSize: parseInt(process.env.MESSAGE_SIZE) || 1024,
    useBinary: process.env.USE_BINARY !== 'false' // Default true for MessagePack
};

console.log('Starting WebSocket Performance Test...');
console.log('Server:', config.serverUrl);
console.log('Configuration:', config);

const tester = new WebSocketPerformanceTester(config);

tester.runTest()
    .then(() => {
        console.log('Test completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
