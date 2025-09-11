/**
 * Worker Handler for WebSocket Processing
 * Each worker handles WebSocket connections independently
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import msgpack from 'msgpack-lite';
import cors from 'cors';
import http from 'http';

class WorkerHandler {
    constructor(config) {
        this.config = config;
        this.app = express();
        this.connections = new Set();
        this.messageCount = 0;
        this.lastReportTime = Date.now();
        
        // Middleware
        this.app.use(cors());
        this.app.use(express.json());
        
        // Metrics
        this.metrics = {
            connections: 0,
            messages: 0,
            messagesPerSecond: 0
        };
    }
    
    start() {
        // Create HTTP server without binding to specific port
        const server = http.createServer(this.app);
        
        // WebSocket server
        this.wss = new WebSocketServer({ 
            server,
            perMessageDeflate: false, // Disable compression for speed
            maxPayload: 10 * 1024 * 1024 // 10MB
        });
        
        // Handle sticky session connections from master
        process.on('message', (msg, socket) => {
            if (msg === 'sticky-session:connection' && socket) {
                // Emulate connection event
                server.emit('connection', socket);
                
                // Resume the socket 
                if (socket && typeof socket.resume === 'function') {
                    socket.resume();
                }
            }
        });
        
        this.setupWebSocketHandlers();
        this.setupRoutes();
        this.startMetricsReporting();
        
        console.log(`Worker ${process.pid} ready`);
    }
    setupWebSocketHandlers() {
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            this.connections.add(ws);
            this.metrics.connections = this.connections.size;
            
            // Send welcome message
            const welcome = this.config.MESSAGE_PACK 
                ? msgpack.encode({ type: 'welcome', id: clientId, worker: process.pid })
                : JSON.stringify({ type: 'welcome', id: clientId, worker: process.pid });
            
            ws.send(welcome);
            
            // Handle messages
            ws.on('message', (data) => {
                this.handleMessage(ws, data);
            });
            
            // Handle close
            ws.on('close', () => {
                this.connections.delete(ws);
                this.metrics.connections = this.connections.size;
            });
            
            // Handle error
            ws.on('error', (error) => {
                console.error(`WebSocket error: ${error.message}`);
            });
            
            // Heartbeat
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });
        });
        
        // Heartbeat interval
        setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, this.config.HEARTBEAT_INTERVAL);
    }
    handleMessage(ws, data) {
        this.messageCount++;
        this.metrics.messages++;
        
        try {
            const message = this.config.MESSAGE_PACK 
                ? msgpack.decode(data)
                : JSON.parse(data);
            
            // Process different message types
            let response;
            switch (message.type) {
                case 'math':
                    response = this.processMathMessage(message);
                    break;
                case 'gesture':
                    response = this.processGestureMessage(message);
                    break;
                case 'ping':
                    response = { type: 'pong', timestamp: Date.now() };
                    break;
                default:
                    response = { type: 'echo', data: message };
            }
            
            // Send response
            const encoded = this.config.MESSAGE_PACK 
                ? msgpack.encode(response)
                : JSON.stringify(response);
            
            ws.send(encoded);
            
            // Broadcast to all connections if needed
            if (message.broadcast) {
                this.broadcast(encoded, ws);
            }
            
        } catch (error) {
            console.error('Message processing error:', error);
            ws.send(JSON.stringify({ type: 'error', message: error.message }));
        }
    }
    
    processMathMessage(message) {
        return {
            type: 'math_result',
            expression: message.data,
            result: 'Processed by Worker ' + process.pid,
            timestamp: Date.now()
        };
    }
    
    processGestureMessage(message) {
        return {
            type: 'gesture_result',
            gesture: message.data,
            interpretation: 'Gesture processed',
            timestamp: Date.now()
        };
    }
    
    broadcast(message, excludeWs) {
        this.wss.clients.forEach((client) => {
            if (client !== excludeWs && client.readyState === 1) {
                client.send(message);
            }
        });
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                worker: process.pid,
                connections: this.connections.size,
                messages: this.messageCount,
                messagesPerSecond: this.metrics.messagesPerSecond
            });
        });
        
        // Process endpoint
        this.app.post('/process', (req, res) => {
            const { type, data } = req.body;
            
            let result;
            if (type === 'math') {
                result = this.processMathMessage({ type, data });
            } else if (type === 'gesture') {
                result = this.processGestureMessage({ type, data });
            } else {
                result = { type: 'unknown', data };
            }
            
            res.json(result);
        });
    }
    
    startMetricsReporting() {
        // Report to master every 2 seconds
        setInterval(() => {
            const now = Date.now();
            const elapsed = (now - this.lastReportTime) / 1000;
            
            this.metrics.messagesPerSecond = Math.round(
                (this.messageCount - this.metrics.messages) / elapsed
            );
            
            // Send metrics to master
            if (process.send) {
                process.send({
                    type: 'metrics',
                    data: {
                        connections: this.connections.size,
                        messages: this.messageCount,
                        messagesPerSecond: this.metrics.messagesPerSecond
                    }
                });
            }
            
            this.lastReportTime = now;
        }, 2000);
    }
    
    generateClientId() {
        return `client-${process.pid}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

export { WorkerHandler };