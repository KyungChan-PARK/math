/**
 * Optimized WebSocket Server for AE Claude Max v3.4.0
 * Fallback implementation with performance optimizations
 * Target: Maximize ws library performance
 */

import { WebSocketServer } from 'ws';
import NLPEngine from './nlp-engine.js';
import ScriptGenerator from './script-generator.js';
import AEBridge from './ae-bridge.js';

class OptimizedWebSocketServer {
    constructor(port = 8080) {
        this.port = port;
        this.connections = new Map();
        this.messageQueue = [];
        this.processingBatch = false;
        
        // Core components
        this.nlpEngine = new NLPEngine();
        this.scriptGenerator = new ScriptGenerator();
        this.aeBridge = new AEBridge({
            port: process.env.AE_PORT || 9000,
            host: process.env.AE_HOST || 'localhost'
        });
        
        // Performance optimizations
        this.batchSize = 10;
        this.batchInterval = 10; // ms
        
        this.metrics = {
            messagesProcessed: 0,
            startTime: Date.now()
        };
    }
    
    start() {
        this.wss = new WebSocketServer({ 
            port: this.port,
            perMessageDeflate: false, // Disable compression for speed
            maxPayload: 100 * 1024
        });
        
        this.wss.on('connection', (ws) => {
            const clientId = this.generateClientId();
            
            this.connections.set(clientId, {
                socket: ws,
                connectedAt: Date.now()
            });
            
            ws.send(JSON.stringify({
                type: 'CONNECTED',
                clientId: clientId,
                version: '3.4.0'
            }));
            
            ws.on('message', (data) => {
                this.queueMessage(clientId, data);
            });
            
            ws.on('close', () => {
                this.connections.delete(clientId);
            });
        });
        
        // Start batch processor
        this.startBatchProcessor();
        
        console.log(` Optimized WebSocket server on port ${this.port}`);
        console.log(` Using ws with optimizations`);
        this.startMetricsReporting();
    }
    
    queueMessage(clientId, data) {
        this.messageQueue.push({ clientId, data, timestamp: Date.now() });
        
        if (!this.processingBatch && this.messageQueue.length >= this.batchSize) {
            this.processBatch();
        }
    }
    
    async processBatch() {
        if (this.processingBatch || this.messageQueue.length === 0) return;
        
        this.processingBatch = true;
        const batch = this.messageQueue.splice(0, this.batchSize);
        
        await Promise.all(batch.map(item => this.processMessage(item)));
        
        this.metrics.messagesProcessed += batch.length;
        this.processingBatch = false;
    }
    
    async processMessage({ clientId, data }) {
        try {
            const message = JSON.parse(data);
            const client = this.connections.get(clientId);
            
            if (!client) return;
            
            if (message.type === 'NATURAL_LANGUAGE') {
                const parsed = await this.nlpEngine.parse(message.payload.text);
                const script = this.scriptGenerator.generate(parsed);
                const result = await this.aeBridge.execute(script);
                
                client.socket.send(JSON.stringify({
                    type: 'NL_RESULT',
                    success: result.success,
                    message: result.message
                }));
            }
        } catch (error) {
            console.error('Process error:', error);
        }
    }
    
    startBatchProcessor() {
        setInterval(() => {
            if (this.messageQueue.length > 0) {
                this.processBatch();
            }
        }, this.batchInterval);
    }
    
    startMetricsReporting() {
        setInterval(() => {
            const uptime = (Date.now() - this.metrics.startTime) / 1000;
            const throughput = this.metrics.messagesProcessed / uptime;
            console.log(` Throughput: ${throughput.toFixed(1)} msg/sec | Clients: ${this.connections.size}`);
        }, 10000);
    }
    
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

const server = new OptimizedWebSocketServer(process.env.WS_PORT || 8080);
server.start();

export default OptimizedWebSocketServer;
