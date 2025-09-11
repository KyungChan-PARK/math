/**
 * WebSocket Performance Benchmark Tool
 * Tests the cluster WebSocket server performance
 */

import WebSocket from 'ws';
import msgpack from 'msgpack-lite';

class WebSocketBenchmark {
    constructor(config = {}) {
        this.config = {
            url: config.url || 'ws://localhost:8085',
            clients: config.clients || 100,
            messagesPerClient: config.messagesPerClient || 100,
            messageInterval: config.messageInterval || 10, // ms
            useMsgPack: config.useMsgPack || true
        };
        
        this.clients = [];
        this.metrics = {
            connected: 0,
            messagesSent: 0,
            messagesReceived: 0,
            errors: 0,
            startTime: null,
            endTime: null
        };
    }
    
    async run() {
        console.log(' WebSocket Benchmark Starting...');
        console.log(` Configuration:`);
        console.log(`   URL: ${this.config.url}`);
        console.log(`   Clients: ${this.config.clients}`);
        console.log(`   Messages per client: ${this.config.messagesPerClient}`);
        console.log(`   Total messages: ${this.config.clients * this.config.messagesPerClient}`);
        console.log(`   Message format: ${this.config.useMsgPack ? 'MessagePack' : 'JSON'}\n`);
        
        this.metrics.startTime = Date.now();
        
        // Create all client connections
        await this.createClients();
        
        // Wait for all connections
        await this.waitForConnections();
        
        // Start sending messages
        await this.startMessaging();
        
        // Wait for completion
        await this.waitForCompletion();
        
        // Report results
        this.reportResults();
        
        // Cleanup
        this.cleanup();
    }
    async createClients() {
        const promises = [];
        
        for (let i = 0; i < this.config.clients; i++) {
            promises.push(this.createClient(i));
        }
        
        await Promise.all(promises);
    }
    
    createClient(id) {
        return new Promise((resolve) => {
            const ws = new WebSocket(this.config.url);
            
            ws.on('open', () => {
                this.metrics.connected++;
                ws.clientId = id;
                ws.messagesReceived = 0;
                this.clients.push(ws);
                resolve();
            });
            
            ws.on('message', (data) => {
                this.metrics.messagesReceived++;
                ws.messagesReceived++;
            });
            
            ws.on('error', (error) => {
                this.metrics.errors++;
                console.error(`Client ${id} error:`, error.message);
            });
        });
    }
    
    async waitForConnections() {
        const timeout = 10000; // 10 seconds
        const startTime = Date.now();
        
        while (this.metrics.connected < this.config.clients) {
            if (Date.now() - startTime > timeout) {
                console.log(`️  Timeout: Only ${this.metrics.connected}/${this.config.clients} clients connected`);
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`✅ ${this.metrics.connected} clients connected\n`);
    }
    async startMessaging() {
        console.log(' Starting message transmission...\n');
        
        const promises = this.clients.map((client, index) => {
            return this.sendMessages(client, index);
        });
        
        await Promise.all(promises);
    }
    
    sendMessages(ws, clientId) {
        return new Promise((resolve) => {
            let messageCount = 0;
            
            const interval = setInterval(() => {
                if (messageCount >= this.config.messagesPerClient) {
                    clearInterval(interval);
                    resolve();
                    return;
                }
                
                const message = {
                    type: 'math',
                    data: `${clientId}-${messageCount}`,
                    timestamp: Date.now()
                };
                
                const encoded = this.config.useMsgPack 
                    ? msgpack.encode(message)
                    : JSON.stringify(message);
                
                ws.send(encoded);
                this.metrics.messagesSent++;
                messageCount++;
                
            }, this.config.messageInterval);
        });
    }
    
    async waitForCompletion() {
        const timeout = 60000; // 60 seconds
        const startTime = Date.now();
        const expectedMessages = this.config.clients * this.config.messagesPerClient;
        
        while (this.metrics.messagesReceived < expectedMessages) {
            if (Date.now() - startTime > timeout) {
                console.log(`️  Timeout: Received ${this.metrics.messagesReceived}/${expectedMessages} messages`);
                break;
            }
            
            // Progress update
            const progress = Math.round((this.metrics.messagesReceived / expectedMessages) * 100);
            process.stdout.write(`\r Progress: ${progress}% (${this.metrics.messagesReceived}/${expectedMessages})`);
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.metrics.endTime = Date.now();
        console.log('\n');
    }
    reportResults() {
        const duration = (this.metrics.endTime - this.metrics.startTime) / 1000;
        const messagesPerSecond = Math.round(this.metrics.messagesReceived / duration);
        const successRate = ((this.metrics.messagesReceived / this.metrics.messagesSent) * 100).toFixed(2);
        
        console.log('━'.repeat(60));
        console.log(' BENCHMARK RESULTS');
        console.log('━'.repeat(60));
        console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
        console.log(` Clients: ${this.metrics.connected}`);
        console.log(` Messages Sent: ${this.metrics.messagesSent}`);
        console.log(` Messages Received: ${this.metrics.messagesReceived}`);
        console.log(`✅ Success Rate: ${successRate}%`);
        console.log(`️  Errors: ${this.metrics.errors}`);
        console.log('━'.repeat(60));
        console.log(` Messages/Second: ${messagesPerSecond}`);
        console.log(` Target: 850 msg/sec`);
        console.log(` Performance: ${Math.round((messagesPerSecond / 850) * 100)}%`);
        console.log('━'.repeat(60));
        
        if (messagesPerSecond >= 850) {
            console.log('\n SUCCESS! Target of 850 msg/sec achieved!');
        } else {
            console.log(`\n Performance gap: ${850 - messagesPerSecond} msg/sec needed`);
        }
    }
    
    cleanup() {
        this.clients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });
        console.log('\n✅ Cleanup complete');
    }
}

// Run benchmark if executed directly
if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    const benchmark = new WebSocketBenchmark({
        url: 'ws://localhost:8085',
        clients: 100,
        messagesPerClient: 100,
        messageInterval: 10,
        useMsgPack: true
    });
    
    benchmark.run().catch(console.error);
}

export { WebSocketBenchmark };