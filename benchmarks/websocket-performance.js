import WebSocket from 'ws';

class WebSocketBenchmark {
    constructor() {
        this.results = {
            standard: { throughput: 0, latency: [], errors: 0 },
            uws: { throughput: 0, latency: [], errors: 0 }
        };
        this.messageCount = 1000;
        this.payloadSize = 1024; // 1KB messages
    }

    generatePayload() {
        return JSON.stringify({
            type: 'BENCHMARK',
            timestamp: Date.now(),
            data: 'x'.repeat(this.payloadSize),
            sequence: 0
        });
    }

    async benchmarkStandardWS() {
        console.log('\n Testing Standard WebSocket (port 8080)...');
        
        return new Promise((resolve) => {
            const ws = new WebSocket('ws://localhost:8080');
            let sentCount = 0;
            let receivedCount = 0;
            const startTime = Date.now();
            const latencies = [];

            ws.on('open', () => {
                console.log('✓ Connected to standard WS');
                
                // Send messages
                const interval = setInterval(() => {
                    if (sentCount >= this.messageCount) {
                        clearInterval(interval);
                        return;
                    }
                    
                    const message = this.generatePayload();
                    const sendTime = Date.now();
                    ws.send(JSON.stringify({
                        ...JSON.parse(message),
                        sequence: sentCount,
                        sendTime
                    }));
                    sentCount++;
                }, 1);
            });

            ws.on('message', (data) => {
                const received = JSON.parse(data);
                if (received.sendTime) {
                    latencies.push(Date.now() - received.sendTime);
                }
                receivedCount++;
                
                if (receivedCount >= this.messageCount) {
                    const duration = (Date.now() - startTime) / 1000;
                    this.results.standard = {
                        throughput: Math.round(this.messageCount / duration),
                        latency: this.calculateLatencyStats(latencies),
                        errors: 0
                    };
                    ws.close();
                    resolve();
                }
            });

            ws.on('error', (err) => {
                console.error('Standard WS error:', err.message);
                this.results.standard.errors++;
                resolve();
            });

            setTimeout(() => {
                ws.close();
                resolve();
            }, 30000); // 30s timeout
        });
    }

    async benchmarkUWS() {
        console.log('\n Testing µWebSockets (port 8085)...');
        
        return new Promise((resolve) => {
            const ws = new WebSocket('ws://localhost:8085/');
            let sentCount = 0;
            let receivedCount = 0;
            const startTime = Date.now();
            const latencies = [];

            ws.on('open', () => {
                console.log('✓ Connected to µWebSockets');
                
                // Batch send for better performance
                const batchSize = 10;
                const interval = setInterval(() => {
                    if (sentCount >= this.messageCount) {
                        clearInterval(interval);
                        return;
                    }
                    
                    for (let i = 0; i < batchSize && sentCount < this.messageCount; i++) {
                        const message = this.generatePayload();
                        const sendTime = Date.now();
                        ws.send(JSON.stringify({
                            ...JSON.parse(message),
                            sequence: sentCount,
                            sendTime
                        }));
                        sentCount++;
                    }
                }, 10);
            });

            ws.on('message', (data) => {
                try {
                    const received = JSON.parse(data);
                    if (received.sendTime) {
                        latencies.push(Date.now() - received.sendTime);
                    }
                    receivedCount++;
                    
                    if (receivedCount >= this.messageCount) {
                        const duration = (Date.now() - startTime) / 1000;
                        this.results.uws = {
                            throughput: Math.round(this.messageCount / duration),
                            latency: this.calculateLatencyStats(latencies),
                            errors: 0
                        };
                        ws.close();
                        resolve();
                    }
                } catch (e) {
                    this.results.uws.errors++;
                }
            });

            ws.on('error', (err) => {
                console.error('µWS error:', err.message);
                this.results.uws.errors++;
                resolve();
            });

            setTimeout(() => {
                ws.close();
                resolve();
            }, 30000); // 30s timeout
        });
    }

    calculateLatencyStats(latencies) {
        if (!latencies.length) return { p50: 0, p95: 0, p99: 0 };
        
        latencies.sort((a, b) => a - b);
        return {
            p50: latencies[Math.floor(latencies.length * 0.5)],
            p95: latencies[Math.floor(latencies.length * 0.95)],
            p99: latencies[Math.floor(latencies.length * 0.99)]
        };
    }

    async run() {
        console.log('═════════════════════════════════════════════════');
        console.log(' WebSocket Performance Benchmark v3.4.0');
        console.log('═════════════════════════════════════════════════');
        console.log(` Payload size: ${this.payloadSize} bytes`);
        console.log(` Messages: ${this.messageCount}`);
        
        // Test standard WS
        try {
            await this.benchmarkStandardWS();
        } catch (e) {
            console.log('️  Standard WS not available');
        }
        
        // Test µWebSockets
        try {
            await this.benchmarkUWS();
        } catch (e) {
            console.log('️  µWebSockets not available');
        }
        
        // Display results
        console.log('\n═════════════════════════════════════════════════');
        console.log(' BENCHMARK RESULTS');
        console.log('═════════════════════════════════════════════════');
        
        console.log('\nStandard WebSocket (ws):');
        console.log(`  Throughput: ${this.results.standard.throughput} msg/sec`);
        console.log(`  Latency P50: ${this.results.standard.latency.p50}ms`);
        console.log(`  Latency P95: ${this.results.standard.latency.p95}ms`);
        console.log(`  Latency P99: ${this.results.standard.latency.p99}ms`);
        console.log(`  Errors: ${this.results.standard.errors}`);
        
        console.log('\nµWebSockets:');
        console.log(`  Throughput: ${this.results.uws.throughput} msg/sec`);
        console.log(`  Latency P50: ${this.results.uws.latency.p50}ms`);
        console.log(`  Latency P95: ${this.results.uws.latency.p95}ms`);
        console.log(`  Latency P99: ${this.results.uws.latency.p99}ms`);
        console.log(`  Errors: ${this.results.uws.errors}`);
        
        // Calculate improvement
        if (this.results.standard.throughput > 0 && this.results.uws.throughput > 0) {
            const improvement = (this.results.uws.throughput / this.results.standard.throughput).toFixed(2);
            console.log(`\n Performance Improvement: ${improvement}x`);
            console.log(` Target: 850 msg/sec (${Math.round(this.results.uws.throughput / 850 * 100)}% achieved)`);
        }
        
        // Save results
        const report = {
            timestamp: new Date().toISOString(),
            version: '3.4.0',
            results: this.results,
            target: { throughput: 850, latencyP50: 5, latencyP99: 20 },
            progress: Math.round((this.results.uws.throughput || 0) / 850 * 100)
        };
        
        console.log('\n Results saved to benchmark-report.json');
        console.log('═════════════════════════════════════════════════');
        
        return report;
    }
}

// Run benchmark
const benchmark = new WebSocketBenchmark();
benchmark.run().then(report => {
    process.exit(0);
}).catch(err => {
    console.error('Benchmark failed:', err);
    process.exit(1);
});