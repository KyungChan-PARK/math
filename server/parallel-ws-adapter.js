/**
 * 4x Optimized WebSocket with Worker Threads
 */
import msgpack from 'msgpack-lite';
import { WebSocketServer } from 'ws';
import WorkerPool from './worker-pool.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class ParallelWSAdapter {
    constructor(config) {
        this.config = {
            ...config,
            compression: false,
            maxPayload: 10485760,
            workerPoolSize: 4
        };
        
        this.connections = new Map();
        this.metrics = {
            messagesSent: 0,
            messagesReceived: 0,
            startTime: Date.now()
        };
    }

    async start() {
        // Initialize worker pool
        this.workerPool = new WorkerPool(
            join(__dirname, 'message-worker.js'),
            this.config.workerPoolSize
        );
        await this.workerPool.initialize();
        
        // Start WebSocket server
        this.wss = new WebSocketServer({
            port: this.config.port,
            host: this.config.host,
            perMessageDeflate: false,
            maxPayload: this.config.maxPayload
        });

        this.wss.on('connection', (ws) => {
            const id = this.generateId();
            this.connections.set(id, ws);
            
            ws.on('message', async (data) => {
                this.metrics.messagesReceived++;
                
                // Process in worker thread
                const result = await this.workerPool.process(data);
                
                if (ws.readyState === 1) {
                    ws.send(result);
                    this.metrics.messagesSent++;
                }
            });
            
            ws.on('close', () => this.connections.delete(id));
        });

        console.log(` Parallel WebSocket: ${this.config.workerPoolSize} workers`);
        console.log(` Target: 400 msg/sec (4x improvement)`);
        
        this.startMetrics();
        return true;
    }

    startMetrics() {
        setInterval(() => {
            const uptime = (Date.now() - this.metrics.startTime) / 1000;
            const rate = (this.metrics.messagesSent + this.metrics.messagesReceived) / uptime;
            console.log(` Rate: ${rate.toFixed(0)} msg/sec | Progress: ${(rate/400*100).toFixed(1)}%`);
        }, 5000);
    }

    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
    }
}

export default ParallelWSAdapter;