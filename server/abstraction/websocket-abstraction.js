/**
 * WebSocket Abstraction Layer for AE Claude Max v3.3.0
 * 
 * This abstraction layer is critical for our platform migration strategy.
 * It allows us to switch between different WebSocket implementations (ws vs µWebSockets)
 * without changing any of our application code.
 * 
 * Think of this like a universal remote control that can work with different TV brands.
 * Our application doesn't need to know which WebSocket library we're using underneath.
 * 
 * Migration Path:
 * 1. Current: Using 'ws' library (100 msg/sec)
 * 2. Target: µWebSockets (850 msg/sec - 8.5x improvement)
 * 3. Future: WebSocketStream API (when browser support improves)
 */

import { EventEmitter } from 'events';
import dotenv from 'dotenv';

dotenv.config();

// Performance metrics tracking for migration validation
class PerformanceMetrics {
    constructor() {
        this.messagesProcessed = 0;
        this.startTime = Date.now();
        this.latencyHistogram = new Array(1000).fill(0);
        this.targetThroughput = 850; // µWebSockets target
        this.currentThroughput = 0;
    }

    recordMessage(latency) {
        this.messagesProcessed++;
        const bucket = Math.min(Math.floor(latency), 999);
        this.latencyHistogram[bucket]++;
        this.updateThroughput();
    }

    updateThroughput() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.currentThroughput = this.messagesProcessed / elapsed;
    }

    getMetrics() {
        return {
            messagesPerSecond: this.currentThroughput,
            totalMessages: this.messagesProcessed,
            targetAchieved: this.currentThroughput >= this.targetThroughput,
            performanceRatio: this.currentThroughput / this.targetThroughput
        };
    }
}

/**
 * Abstract WebSocket Interface
 * All WebSocket implementations must follow this interface
 */
export class WebSocketAbstraction extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            port: config.port || 8080,
            host: config.host || 'localhost',
            implementation: config.implementation || 'auto', // 'ws', 'uws', or 'auto'
            maxPayloadLength: config.maxPayloadLength || 100 * 1024, // 100KB
            compressionEnabled: config.compressionEnabled !== false,
            ...config
        };
        
        this.metrics = new PerformanceMetrics();
        this.connections = new Map();
        this.implementation = null;
    }

    /**
     * Automatically detect and use the best available WebSocket implementation
     */
    async initialize() {
        const implementation = this.config.implementation;
        
        if (implementation === 'auto') {
            // Try µWebSockets first (fastest), fall back to ws if not available
            try {
                await this.initializeUWebSockets();
                console.log('✅ Using µWebSockets (8.5x performance mode)');
            } catch (error) {
                console.log('⚠️ µWebSockets not available, falling back to ws library');
                await this.initializeWS();
            }
        } else if (implementation === 'uws') {
            await this.initializeUWebSockets();
        } else {
            await this.initializeWS();
        }
        
        this.setupMetricsReporting();
    }

    /**
     * Initialize with standard ws library (current implementation)
     */
    async initializeWS() {
        const { default: WebSocket } = await import('ws');
        const { createServer } = await import('http');
        
        this.implementation = 'ws';
        const server = createServer();
        this.wss = new WebSocket.Server({ server });
        
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            this.handleConnection(ws, clientId, req);
        });
        
        server.listen(this.config.port, () => {
            console.log(`WebSocket server (ws) running on port ${this.config.port}`);
        });
    }

    /**
     * Initialize with µWebSockets (target implementation for 8.5x performance)
     */
    async initializeUWebSockets() {
        const uWS = await import('uWebSockets.js');
        
        this.implementation = 'uws';
        this.app = uWS.App({});
        
        this.app.ws('/realtime', {
            compression: this.config.compressionEnabled ? uWS.SHARED_COMPRESSOR : 0,
            maxPayloadLength: this.config.maxPayloadLength,
            
            open: (ws) => {
                const clientId = this.generateClientId();
                ws.clientId = clientId;
                this.handleConnection(ws, clientId);
            },
            
            message: (ws, message, isBinary) => {
                const startTime = Date.now();
                this.handleMessage(ws, message, isBinary);
                this.metrics.recordMessage(Date.now() - startTime);
            },
            
            close: (ws, code, message) => {
                this.handleDisconnection(ws.clientId, code);
            }
        });
        
        this.app.listen(this.config.port, (token) => {
            if (token) {
                console.log(`µWebSocket server running on port ${this.config.port}`);
            } else {
                throw new Error('Failed to start µWebSocket server');
            }
        });
    }

    /**
     * Unified connection handler for both implementations
     */
    handleConnection(socket, clientId, req = null) {
        const client = {
            id: clientId,
            socket: socket,
            implementation: this.implementation,
            connectedAt: Date.now(),
            messageBuffer: [],
            subscriptions: new Set()
        };
        
        this.connections.set(clientId, client);
        
        // Unified event handling
        if (this.implementation === 'ws') {
            socket.on('message', (data) => {
                const startTime = Date.now();
                this.handleMessage(socket, data, false);
                this.metrics.recordMessage(Date.now() - startTime);
            });
            
            socket.on('close', (code) => {
                this.handleDisconnection(clientId, code);
            });
            
            socket.on('error', (error) => {
                this.handleError(clientId, error);
            });
        }
        
        // Send welcome message
        this.send(clientId, {
            type: 'CONNECTED',
            clientId: clientId,
            serverTime: Date.now(),
            implementation: this.implementation,
            performanceMode: this.implementation === 'uws' ? 'HIGH_PERFORMANCE' : 'STANDARD'
        });
        
        this.emit('connection', client);
    }

    /**
     * Unified message handler
     */
    handleMessage(socket, message, isBinary) {
        try {
            const data = isBinary ? 
                this.parseBinaryMessage(message) : 
                this.parseTextMessage(message);
            
            const clientId = this.implementation === 'uws' ? 
                socket.clientId : 
                this.findClientIdBySocket(socket);
            
            this.emit('message', {
                clientId: clientId,
                data: data,
                timestamp: Date.now()
            });
        } catch (error) {
            this.handleError(socket.clientId || null, error);
        }
    }

    /**
     * Send message to specific client (abstracted)
     */
    send(clientId, data) {
        const client = this.connections.get(clientId);
        if (!client) return false;
        
        const message = JSON.stringify(data);
        
        if (this.implementation === 'uws') {
            // µWebSockets send method
            const compressed = message.length > 1024 && this.config.compressionEnabled;
            return client.socket.send(message, false, compressed);
        } else {
            // ws library send method
            if (client.socket.readyState === 1) { // WebSocket.OPEN
                client.socket.send(message);
                return true;
            }
            return false;
        }
    }

    /**
     * Broadcast to all connected clients
     */
    broadcast(data, excludeClientId = null) {
        const message = JSON.stringify(data);
        let sent = 0;
        
        this.connections.forEach((client, clientId) => {
            if (clientId !== excludeClientId) {
                if (this.send(clientId, data)) {
                    sent++;
                }
            }
        });
        
        return sent;
    }

    /**
     * Performance metrics reporting
     */
    setupMetricsReporting() {
        setInterval(() => {
            const metrics = this.metrics.getMetrics();
            console.log(`📊 WebSocket Performance: ${metrics.messagesPerSecond.toFixed(2)} msg/sec`);
            console.log(`   Target Progress: ${(metrics.performanceRatio * 100).toFixed(1)}% of µWebSockets goal`);
            
            if (metrics.targetAchieved) {
                console.log('🎯 Performance target achieved! Ready for production.');
            }
        }, 10000); // Report every 10 seconds
    }

    // Utility methods
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    findClientIdBySocket(socket) {
        for (const [clientId, client] of this.connections) {
            if (client.socket === socket) {
                return clientId;
            }
        }
        return null;
    }

    parseTextMessage(message) {
        return JSON.parse(message.toString());
    }

    parseBinaryMessage(message) {
        // Implementation for binary message parsing
        return JSON.parse(Buffer.from(message).toString());
    }

    handleDisconnection(clientId, code) {
        const client = this.connections.get(clientId);
        if (client) {
            this.connections.delete(clientId);
            this.emit('disconnection', { clientId, code });
        }
    }

    handleError(clientId, error) {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.emit('error', { clientId, error });
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('Shutting down WebSocket server...');
        
        // Close all connections
        this.connections.forEach((client) => {
            if (this.implementation === 'ws') {
                client.socket.close();
            } else if (this.implementation === 'uws') {
                client.socket.close();
            }
        });
        
        // Clear connections
        this.connections.clear();
        
        // Stop metrics reporting
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        
        console.log('WebSocket server shutdown complete.');
    }
}

export default WebSocketAbstraction;