/**
 * WebSocket Bridge - Platform Abstraction Layer
 * 
 * This is the foundation of our migration strategy from ws to µWebSockets.
 * It provides a unified interface that allows seamless switching between WebSocket implementations.
 * 
 * Architecture Pattern: Bridge/Adapter Pattern
 * - Decouples abstraction from implementation
 * - Allows runtime switching between ws and µWebSockets
 * - Maintains consistent API regardless of underlying library
 * 
 * Performance Targets:
 * - ws mode: 100-200 msg/sec (current baseline)
 * - µWebSockets mode: 850+ msg/sec (8.5x improvement)
 * 
 * @module WebSocketBridge
 * @version 2.0.0
 */

import WSAdapter from '../bridges/ws-adapter.js';
import UWSAdapter from '../bridges/uws-adapter.js';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'websocket-bridge' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

export default class WebSocketBridge {
    /**
     * Initialize the WebSocket Bridge
     * @param {Object} config - Configuration options
     * @param {string} config.implementation - 'ws' | 'uws' | 'auto'
     * @param {number} config.port - Port to listen on
     * @param {string} config.host - Host to bind to
     * @param {number} config.maxPayload - Maximum message size
     * @param {boolean} config.compression - Enable compression
     */
    constructor(config = {}) {
        this.config = {
            implementation: config.implementation || 'auto',
            port: config.port || 8080,
            host: config.host || 'localhost',
            maxPayload: config.maxPayload || 100 * 1024, // 100KB default
            compression: config.compression !== false,
            heartbeatInterval: config.heartbeatInterval || 30000,
            ...config
        };
        
        this.adapter = null;
        this.connections = new Map();
        this.messageHandlers = new Map();
        this.eventListeners = new Map();
        
        // Performance metrics
        this.metrics = {
            messagesProcessed: 0,
            bytesTransferred: 0,
            errors: 0,
            connections: 0,
            startTime: Date.now(),
            latencySum: 0,
            latencyCount: 0
        };
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
    }
    
    /**
     * Initialize the appropriate WebSocket adapter
     */
    async initialize() {
        logger.info('🌐 Initializing WebSocket Bridge', {
            implementation: this.config.implementation,
            port: this.config.port
        });
        
        // Select adapter based on configuration
        const AdapterClass = this.selectAdapter();
        this.adapter = new AdapterClass(this.config);
        
        // Initialize the adapter
        const success = await this.adapter.initialize(this);
        
        if (!success) {
            logger.error('Failed to initialize WebSocket adapter');
            throw new Error('WebSocket initialization failed');
        }
        
        logger.info(`✅ WebSocket Bridge initialized with ${this.config.implementation} adapter`);
        console.log(`🌐 WebSocket server started on ${this.config.host}:${this.config.port}`);
        console.log(`📊 Using ${this.config.implementation} implementation`);
        
        return true;
    }
    
    /**
     * Select the appropriate adapter based on configuration
     */
    selectAdapter() {
        if (this.config.implementation === 'uws') {
            try {
                return UWSAdapter;
            } catch (error) {
                logger.warn('µWebSockets not available, falling back to ws');
                return WSAdapter;
            }
        }
        
        if (this.config.implementation === 'ws') {
            return WSAdapter;
        }
        
        // Auto mode: try µWebSockets first, fall back to ws
        if (this.config.implementation === 'auto') {
            try {
                // Try to use µWebSockets for better performance
                return UWSAdapter;
            } catch (error) {
                logger.info('µWebSockets not available, using ws adapter');
                return WSAdapter;
            }
        }
        
        return WSAdapter;
    }
    
    /**
     * Handle new WebSocket connection
     */
    handleConnection(connectionId, ws, metadata = {}) {
        this.connections.set(connectionId, {
            ws: ws,
            metadata: metadata,
            connectedAt: Date.now(),
            messagesReceived: 0,
            messagesSent: 0
        });
        
        this.metrics.connections++;
        
        logger.info(`New connection: ${connectionId}`, { metadata });
        console.log(`👤 New connection: ${connectionId} (Total: ${this.connections.size})`);
        
        // Emit connection event
        this.emit('connection', { connectionId, metadata });
    }
    
    /**
     * Handle WebSocket disconnection
     */
    handleDisconnection(connectionId, code, reason) {
        const connection = this.connections.get(connectionId);
        
        if (connection) {
            const duration = Date.now() - connection.connectedAt;
            logger.info(`Connection closed: ${connectionId}`, {
                code,
                reason,
                duration,
                messagesReceived: connection.messagesReceived,
                messagesSent: connection.messagesSent
            });
        }
        
        this.connections.delete(connectionId);
        this.metrics.connections--;
        
        console.log(`👤 Disconnection: ${connectionId} (Remaining: ${this.connections.size})`);
        
        // Emit disconnection event
        this.emit('disconnection', { connectionId, code, reason });
    }
    
    /**
     * Send a message to a specific client
     */
    async send(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            console.warn(`Connection ${connectionId} not found`);
            return false;
        }
        
        const startTime = Date.now();
        
        try {
            // Serialize the data
            const message = JSON.stringify(data);
            const messageSize = Buffer.byteLength(message);
            
            // Check message size limit
            if (messageSize > this.config.maxPayload) {
                throw new Error(`Message size ${messageSize} exceeds max payload ${this.config.maxPayload}`);
            }
            
            // Send through adapter - pass the actual WebSocket object
            await this.adapter.send(connection.ws || connection, message);
            
            // Update metrics
            this.metrics.messagesProcessed++;
            this.metrics.bytesTransferred += messageSize;
            
            // Track latency
            const latency = Date.now() - startTime;
            this.metrics.latencySum += latency;
            this.metrics.latencyCount++;
            
            return true;
        } catch (error) {
            console.error(`Failed to send message to ${connectionId}:`, error);
            this.metrics.errors++;
            return false;
        }
    }
    
    /**
     * Broadcast a message to all connected clients
     */
    async broadcast(data, excludeConnectionId = null) {
        const message = JSON.stringify(data);
        const promises = [];
        
        for (const [connectionId, connection] of this.connections) {
            if (connectionId !== excludeConnectionId) {
                promises.push(this.send(connectionId, data));
            }
        }
        
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
        const failed = results.filter(r => r.status === 'rejected' || !r.value).length;
        
        logger.info(`Broadcast complete: ${successful} successful, ${failed} failed`);
        
        return { successful, failed };
    }
    
    /**
     * Handle incoming message from a client
     */
    async handleMessage(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            logger.warn(`Received message from unknown connection: ${connectionId}`);
            return;
        }
        
        connection.messagesReceived++;
        
        try {
            const message = JSON.parse(data);
            
            // Log the message type
            logger.debug(`Message received from ${connectionId}:`, {
                type: message.type,
                payloadSize: data.length
            });
            
            // Emit message event
            await this.emit('message', {
                connectionId,
                message,
                connection
            });
            
            // Handle specific message types if handlers are registered
            if (this.messageHandlers.has(message.type)) {
                const handler = this.messageHandlers.get(message.type);
                await handler(connectionId, message, connection);
            }
        } catch (error) {
            logger.error(`Error handling message from ${connectionId}:`, error);
            this.metrics.errors++;
            
            // Send error response
            await this.send(connectionId, {
                type: 'ERROR',
                error: 'Invalid message format',
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Register a message handler for a specific message type
     */
    onMessage(type, handler) {
        this.messageHandlers.set(type, handler);
    }
    
    /**
     * Register an event listener
     */
    on(event, listener) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(listener);
    }
    
    /**
     * Emit an event to all listeners
     */
    async emit(event, data) {
        if (!this.eventListeners.has(event)) {
            return;
        }
        
        const listeners = this.eventListeners.get(event);
        const promises = listeners.map(listener => listener(data));
        await Promise.all(promises);
    }
    
    /**
     * Get current performance metrics
     */
    getMetrics() {
        const uptime = (Date.now() - this.metrics.startTime) / 1000;
        const avgLatency = this.metrics.latencyCount > 0 
            ? this.metrics.latencySum / this.metrics.latencyCount 
            : 0;
        
        return {
            implementation: this.config.implementation,
            uptime: `${Math.floor(uptime)}s`,
            connections: this.connections.size,
            messagesPerSecond: (this.metrics.messagesProcessed / uptime).toFixed(2),
            bytesTransferred: this.metrics.bytesTransferred,
            averageLatency: `${avgLatency.toFixed(2)}ms`,
            errorRate: `${((this.metrics.errors / Math.max(1, this.metrics.messagesProcessed)) * 100).toFixed(2)}%`
        };
    }
    
    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            const metrics = this.getMetrics();
            console.log('📊 Performance Metrics:', {
                implementation: metrics.implementation,
                msgPerSec: metrics.messagesPerSecond,
                avgLatency: metrics.averageLatency,
                connections: metrics.connections,
                errorRate: metrics.errorRate
            });
        }, 30000); // Every 30 seconds
    }
    
    /**
     * Gracefully shutdown the WebSocket server
     */
    async shutdown() {
        logger.info('Shutting down WebSocket Bridge...');
        
        // Notify all clients
        await this.broadcast({
            type: 'SERVER_SHUTDOWN',
            message: 'Server is shutting down',
            timestamp: Date.now()
        });
        
        // Close all connections
        for (const [connectionId, connection] of this.connections) {
            await this.adapter.close(connection.ws);
        }
        
        // Shutdown adapter
        if (this.adapter && this.adapter.shutdown) {
            await this.adapter.shutdown();
        }
        
        this.connections.clear();
        this.messageHandlers.clear();
        this.eventListeners.clear();
        
        logger.info('WebSocket Bridge shutdown complete');
    }
}
