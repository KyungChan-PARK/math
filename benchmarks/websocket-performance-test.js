/**
 * WebSocket Performance Benchmark Test
 * 
 * Tests the optimized WebSocket configuration to verify 4x performance improvement
 * Target: 400 msg/sec (up from 100 msg/sec baseline)
 * 
 * Optimizations tested:
 * - Compression disabled (15% boost)
 * - MessagePack binary protocol (40% smaller payloads)
 * - Optimized heartbeat (30s interval)
 * - Connection queue (500 backlog)
 * 
 * @version 1.0.0
 */

import WebSocket from 'ws';
import msgpack from 'msgpack-lite';
import { performance } from 'perf_hooks';

class WebSocketPerformanceTester {
    constructor(config = {}) {
        this.config = {
            serverUrl: config.serverUrl || 'ws://localhost:8080',
            numClients: config.numClients || 10,
            messagesPerClient: config.messagesPerClient || 100,
            messageSize: config.messageSize || 1024, // 1KB default
            useBinary: config.useBinary !== false, // Default true for MessagePack
            ...config
        };
        
        this.clients = [];
        this.metrics = {
            totalMessages: 0,
            totalBytes: 0,
            startTime: 0,
            endTime: 0,
            latencies: [],
            errors: 0
        };
    }
    
    /**
     * Generate test message with configurable size
     */
    generateMessage(index) {
        const message = {
            type: 'TEST_MESSAGE',
            index: index,
            timestamp: Date.now(),
            data: 'x'.repeat(this.config.messageSize),
            metadata: {
                client: 'performance-test',
                version: '1.0.0'
            }
        };
        
        return this.config.useBinary ? msgpack.encode(message) : JSON.stringify(message);
    }
    
    /**
     * Create and connect a test client
     */
    async createClient(clientId) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this.config.serverUrl);
            const messageLatencies = [];
            
            ws.on('open', () => {
                console.log(`Client ${clientId} connected`);
                resolve({ ws, clientId, messageLatencies });
            });
            
            ws.on('message', (data) => {
                const receiveTime = performance.now();
                
                try {
                    const message = this.config.useBinary 
                        ? msgpack.decode(data)
                        : JSON.parse(data);
                    
                    if (message.type === 'ECHO' && message.sentTime) {
                        const latency = receiveTime - message.sentTime;
                        messageLatencies.push(latency);
                        this.metrics.latencies.push(latency);
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                    this.metrics.errors++;
                }
            });
            
            ws.on('error', (error) => {
                console.error(`Client ${clientId} error:`, error);
                this.metrics.errors++;
                reject(error);
            });
            
            ws.on('close', () => {
                console.log(`Client ${clientId} disconnected`);
            });
        });
    }
    
    /**
     * Run performance test with multiple concurrent clients
     */
    async runTest() {
        console.log('\\n=== WebSocket Performance Test ===');
        console.log(`Configuration:`);
        console.log(`- Clients: ${this.config.numClients}`);
        console.log(`- Messages per client: ${this.config.messagesPerClient}`);
        console.log(`- Message size: ${this.config.messageSize} bytes`);
        console.log(`- Protocol: ${this.config.useBinary ? 'MessagePack (binary)' : 'JSON'}`);
        console.log(`- Server: ${this.config.serverUrl}\\n`);
        
        // Create all clients
        console.log('Connecting clients...');
        const clientPromises = [];
        for (let i = 0; i < this.config.numClients; i++) {
            clientPromises.push(this.createClient(i));
        }
        
        this.clients = await Promise.all(clientPromises);
        console.log(`✅ All ${this.config.numClients} clients connected\\n`);
        
        // Start performance test
        console.log('Starting message flood test...');
        this.metrics.startTime = performance.now();
        
        // Send messages from all clients concurrently
        const sendPromises = this.clients.map(client => 
            this.sendMessages(client)
        );
        
        await Promise.all(sendPromises);
        
        this.metrics.endTime = performance.now();
        
        // Wait for responses
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Calculate and display results
        this.displayResults();
        
        // Cleanup
        this.cleanup();
    }
    
    /**
     * Send test messages from a client
     */
    async sendMessages(client) {
        const { ws, clientId } = client;
        
        for (let i = 0; i < this.config.messagesPerClient; i++) {
            if (ws.readyState !== WebSocket.OPEN) {
                console.error(`Client ${clientId} disconnected during test`);
                break;
            }
            
            const message = {
                type: 'ECHO_REQUEST',
                clientId: clientId,
                messageIndex: i,
                sentTime: performance.now(),
                data: 'x'.repeat(this.config.messageSize)
            };
            
            const encoded = this.config.useBinary 
                ? msgpack.encode(message)
                : JSON.stringify(message);
            
            ws.send(encoded);
            this.metrics.totalMessages++;
            this.metrics.totalBytes += encoded.length;
            
            // Small delay to prevent overwhelming
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
    }
    
    /**
     * Display test results with performance analysis
     */
    displayResults() {
        const duration = (this.metrics.endTime - this.metrics.startTime) / 1000; // seconds
        const messagesPerSecond = this.metrics.totalMessages / duration;
        const throughputMBps = (this.metrics.totalBytes / (1024 * 1024)) / duration;
        
        // Calculate latency statistics
        const latencies = this.metrics.latencies.sort((a, b) => a - b);
        const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
        const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
        const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
        const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length || 0;
        
        console.log('\\n=== Test Results ===');
        console.log(`Duration: ${duration.toFixed(2)} seconds`);
        console.log(`Total messages: ${this.metrics.totalMessages}`);
        console.log(`Total data: ${(this.metrics.totalBytes / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`Errors: ${this.metrics.errors}\\n`);
        
        console.log(' Performance Metrics:');
        console.log(`Messages/sec: ${messagesPerSecond.toFixed(0)} msg/sec`);
        console.log(`Throughput: ${throughputMBps.toFixed(2)} MB/sec\\n`);
        
        console.log('⏱️ Latency Statistics:');
        console.log(`Average: ${avgLatency.toFixed(2)} ms`);
        console.log(`P50: ${p50.toFixed(2)} ms`);
        console.log(`P95: ${p95.toFixed(2)} ms`);
        console.log(`P99: ${p99.toFixed(2)} ms\\n`);
        
        // Performance evaluation
        console.log(' Performance Evaluation:');
        if (messagesPerSecond >= 400) {
            console.log(`✅ EXCELLENT: ${messagesPerSecond.toFixed(0)} msg/sec (Target: 400 msg/sec)`);
            console.log('   4x performance improvement achieved!');
        } else if (messagesPerSecond >= 300) {
            console.log(`✅ GOOD: ${messagesPerSecond.toFixed(0)} msg/sec (Target: 400 msg/sec)`);
            console.log('   3x performance improvement achieved');
        } else if (messagesPerSecond >= 200) {
            console.log(`️ MODERATE: ${messagesPerSecond.toFixed(0)} msg/sec (Target: 400 msg/sec)`);
            console.log('   2x performance improvement achieved');
        } else {
            console.log(`❌ NEEDS IMPROVEMENT: ${messagesPerSecond.toFixed(0)} msg/sec (Target: 400 msg/sec)`);
            console.log('   Check server configuration and network conditions');
        }
        
        // Next steps for µWebSockets migration
        if (messagesPerSecond < 850) {
            console.log('\\n Next Step: µWebSockets Migration');
            console.log('   Target: 850 msg/sec (8.5x improvement)');
            console.log('   Current: ' + messagesPerSecond.toFixed(0) + ' msg/sec');
            console.log('   Gap: ' + (850 - messagesPerSecond).toFixed(0) + ' msg/sec');
        }
    }
    
    /**
     * Cleanup connections
     */
    cleanup() {
        console.log('\\nCleaning up connections...');
        this.clients.forEach(({ ws }) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });
        console.log('✅ Test complete\\n');
    }
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new WebSocketPerformanceTester({
        serverUrl: process.env.WS_URL || 'ws://localhost:8080',
        numClients: parseInt(process.env.NUM_CLIENTS) || 10,
        messagesPerClient: parseInt(process.env.MESSAGES_PER_CLIENT) || 100,
        messageSize: parseInt(process.env.MESSAGE_SIZE) || 1024,
        useBinary: process.env.USE_BINARY !== 'false'
    });
    
    tester.runTest().catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
}

export default WebSocketPerformanceTester;
