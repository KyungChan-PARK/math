/**
 * Gesture-WebSocket Integration Bridge
 * Created: 2025-01-26
 * Purpose: Full bidirectional communication between gesture-app and AE server
 */

import WebSocket, { WebSocketServer } from 'ws';
import msgpack from 'msgpack-lite';
import { EventEmitter } from 'events';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class GestureWebSocketBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            gesturePort: config.gesturePort || 8088,  // Changed from 8081 to avoid conflict
            serverPort: config.serverPort || 8085,
            reconnectDelay: config.reconnectDelay || 5000,
            heartbeatInterval: config.heartbeatInterval || 30000,
            messageQueueSize: config.messageQueueSize || 1000,
            enableCompression: false  // Disabled for performance
        };
        
        this.gestureWss = null;
        this.gestureClients = new Set();
        this.serverConnection = null;
        this.messageQueue = [];
        this.isConnected = false;
        this.metrics = {
            messagesProcessed: 0,
            gestureCommands: 0,
            errors: 0,
            latency: []
        };
    }
    
    /**
     * Initialize the bridge
     */
    async start() {
        console.log(' Starting Gesture-WebSocket Bridge...');
        
        // Start gesture WebSocket server
        await this.startGestureServer();
        
        // Connect to main AE server
        await this.connectToMainServer();
        
        // Setup heartbeat
        this.setupHeartbeat();
        
        // Setup message routing
        this.setupMessageRouting();
        
        console.log('✅ Bridge operational');
        return true;
    }
    
    /**
     * Start WebSocket server for gesture app
     */
    startGestureServer() {
        return new Promise((resolve, reject) => {
            try {
                this.gestureWss = new WebSocketServer({
                    port: this.config.gesturePort,
                    perMessageDeflate: false  // Disable compression
                });
                
                this.gestureWss.on('connection', (ws, req) => {
                    const clientId = this.generateClientId();
                    ws.clientId = clientId;
                    
                    console.log(` Gesture client connected: ${clientId}`);
                    this.gestureClients.add(ws);
                    
                    // Setup client handlers
                    ws.on('message', (data) => this.handleGestureMessage(ws, data));
                    ws.on('close', () => this.handleGestureDisconnect(ws));
                    ws.on('error', (err) => this.handleGestureError(ws, err));
                    
                    // Send welcome message
                    this.sendToGesture(ws, {
                        type: 'connected',
                        clientId: clientId,
                        bridge: 'active',
                        capabilities: ['gesture', 'natural-language', 'real-time']
                    });
                });
                
                this.gestureWss.on('listening', () => {
                    console.log(` Gesture server listening on port ${this.config.gesturePort}`);
                    resolve();
                });
                
                this.gestureWss.on('error', reject);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Connect to main After Effects server
     */
    connectToMainServer() {
        return new Promise((resolve, reject) => {
            const wsUrl = `ws://localhost:${this.config.serverPort}`;
            
            console.log(` Connecting to AE server at ${wsUrl}...`);
            
            this.serverConnection = new WebSocket(wsUrl);
            
            this.serverConnection.on('open', () => {
                console.log('✅ Connected to AE server');
                this.isConnected = true;
                
                // Identify as bridge
                this.sendToServer({
                    type: 'bridge_init',
                    source: 'gesture_bridge',
                    capabilities: ['gesture-recognition', 'motion-control']
                });
                
                resolve();
            });
            
            this.serverConnection.on('message', (data) => {
                this.handleServerMessage(data);
            });
            
            this.serverConnection.on('close', () => {
                console.log('️ AE server connection lost');
                this.isConnected = false;
                this.reconnectToServer();
            });
            
            this.serverConnection.on('error', (err) => {
                console.error('AE server error:', err);
                this.metrics.errors++;
                
                if (!this.isConnected) {
                    setTimeout(() => this.connectToMainServer(), this.config.reconnectDelay);
                }
            });
        });
    }
    
    /**
     * Handle messages from gesture clients
     */
    handleGestureMessage(ws, rawData) {
        const start = Date.now();
        
        try {
            // Decode message
            const data = this.decodeMessage(rawData);
            
            console.log(` Gesture command: ${data.type}`);
            this.metrics.gestureCommands++;
            
            // Route based on message type
            switch (data.type) {
                case 'gesture':
                    this.processGesture(data, ws);
                    break;
                    
                case 'natural_language':
                    this.processNaturalLanguage(data, ws);
                    break;
                    
                case 'canvas_data':
                    this.processCanvasData(data, ws);
                    break;
                    
                default:
                    // Forward to server
                    this.forwardToServer(data, ws.clientId);
            }
            
            // Track latency
            const latency = Date.now() - start;
            this.metrics.latency.push(latency);
            if (this.metrics.latency.length > 100) {
                this.metrics.latency.shift();
            }
            
        } catch (error) {
            console.error('Gesture message error:', error);
            this.sendError(ws, error.message);
        }
    }
    
    /**
     * Process gesture recognition data
     */
    processGesture(data, ws) {
        // Convert gesture to AE command
        const aeCommand = this.gestureToAECommand(data.gesture);
        
        // Send to AE server
        this.sendToServer({
            type: 'gesture_command',
            gesture: data.gesture,
            command: aeCommand,
            timestamp: Date.now(),
            clientId: ws.clientId
        });
        
        // Acknowledge to client
        this.sendToGesture(ws, {
            type: 'gesture_processed',
            gesture: data.gesture,
            status: 'sent_to_ae'
        });
    }
    
    /**
     * Convert gesture to After Effects command
     */
    gestureToAECommand(gesture) {
        const gestureMap = {
            'circle': {
                script: 'app.project.activeItem.layers.addSolid([1,1,1], "Circle", 100, 100, 1);',
                description: 'Add circular solid'
            },
            'line': {
                script: 'app.project.activeItem.layers.addShape();',
                description: 'Add line shape'
            },
            'swipe_right': {
                script: 'app.project.activeItem.time += 1;',
                description: 'Move timeline forward'
            },
            'swipe_left': {
                script: 'app.project.activeItem.time -= 1;',
                description: 'Move timeline backward'
            },
            'tap': {
                script: 'app.project.activeItem.layers[1].selected = true;',
                description: 'Select layer'
            },
            'pinch': {
                script: 'app.project.activeItem.layer(1).scale.setValue([50,50]);',
                description: 'Scale layer'
            }
        };
        
        return gestureMap[gesture.type] || gestureMap['tap'];
    }
    
    /**
     * Handle server messages
     */
    handleServerMessage(rawData) {
        try {
            const data = this.decodeMessage(rawData);
            
            // Route to appropriate gesture clients
            if (data.targetClient) {
                this.routeToGestureClient(data.targetClient, data);
            } else {
                // Broadcast to all gesture clients
                this.broadcastToGestures(data);
            }
            
        } catch (error) {
            console.error('Server message error:', error);
        }
    }
    
    /**
     * Setup message routing logic
     */
    setupMessageRouting() {
        // Process queued messages
        setInterval(() => {
            if (this.messageQueue.length > 0 && this.isConnected) {
                const batch = this.messageQueue.splice(0, 10);
                batch.forEach(msg => this.sendToServer(msg));
            }
        }, 100);
        
        // Report metrics
        setInterval(() => {
            const avgLatency = this.metrics.latency.length > 0 
                ? this.metrics.latency.reduce((a,b) => a+b, 0) / this.metrics.latency.length
                : 0;
                
            console.log(` Bridge Metrics:
                Messages: ${this.metrics.messagesProcessed}
                Gestures: ${this.metrics.gestureCommands}
                Avg Latency: ${avgLatency.toFixed(2)}ms
                Clients: ${this.gestureClients.size}
                Queue: ${this.messageQueue.length}`);
        }, 30000);
    }
    
    /**
     * Helper functions
     */
    sendToGesture(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(msgpack.encode(data));
        }
    }
    
    sendToServer(data) {
        if (this.isConnected && this.serverConnection.readyState === WebSocket.OPEN) {
            this.serverConnection.send(msgpack.encode(data));
            this.metrics.messagesProcessed++;
        } else {
            // Queue if not connected
            if (this.messageQueue.length < this.config.messageQueueSize) {
                this.messageQueue.push(data);
            }
        }
    }
    
    broadcastToGestures(data) {
        this.gestureClients.forEach(client => {
            this.sendToGesture(client, data);
        });
    }
    
    decodeMessage(data) {
        try {
            return msgpack.decode(Buffer.from(data));
        } catch {
            // Fallback to JSON
            return JSON.parse(data.toString());
        }
    }
    
    generateClientId() {
        return `gesture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    setupHeartbeat() {
        setInterval(() => {
            // Ping gesture clients
            this.gestureClients.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.ping();
                }
            });
            
            // Ping server
            if (this.serverConnection && this.serverConnection.readyState === WebSocket.OPEN) {
                this.serverConnection.ping();
            }
        }, this.config.heartbeatInterval);
    }
    
    reconnectToServer() {
        if (!this.isConnected) {
            console.log(' Attempting to reconnect to AE server...');
            setTimeout(() => this.connectToMainServer(), this.config.reconnectDelay);
        }
    }
    
    handleGestureDisconnect(ws) {
        console.log(` Gesture client disconnected: ${ws.clientId}`);
        this.gestureClients.delete(ws);
    }
    
    handleGestureError(ws, error) {
        console.error(`Gesture client error (${ws.clientId}):`, error);
        this.metrics.errors++;
    }
    
    sendError(ws, message) {
        this.sendToGesture(ws, {
            type: 'error',
            message: message,
            timestamp: Date.now()
        });
    }
    
    processNaturalLanguage(data, ws) {
        // Convert natural language to ExtendScript
        this.sendToServer({
            type: 'nlp_request',
            text: data.text,
            context: data.context,
            clientId: ws.clientId
        });
    }
    
    processCanvasData(data, ws) {
        // Process raw canvas drawing data
        const points = data.points;
        const gesture = this.recognizeGestureFromPoints(points);
        
        if (gesture) {
            this.processGesture({ gesture }, ws);
        }
    }
    
    recognizeGestureFromPoints(points) {
        // Simple gesture recognition (to be enhanced with $Q recognizer)
        if (!points || points.length < 2) return null;
        
        // Calculate basic properties
        const startPoint = points[0];
        const endPoint = points[points.length - 1];
        const distance = Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) + 
            Math.pow(endPoint.y - startPoint.y, 2)
        );
        
        // Basic gesture detection
        if (distance < 50 && points.length > 20) {
            return { type: 'circle', confidence: 0.7 };
        } else if (distance > 100 && points.length < 10) {
            return { type: 'line', confidence: 0.8 };
        } else if (points.length === 1) {
            return { type: 'tap', confidence: 1.0 };
        }
        
        return null;
    }
    
    routeToGestureClient(clientId, data) {
        for (const client of this.gestureClients) {
            if (client.clientId === clientId) {
                this.sendToGesture(client, data);
                return;
            }
        }
    }
    
    /**
     * Shutdown the bridge gracefully
     */
    async shutdown() {
        console.log(' Shutting down bridge...');
        
        // Close gesture connections
        this.gestureClients.forEach(ws => ws.close());
        if (this.gestureWss) {
            this.gestureWss.close();
        }
        
        // Close server connection
        if (this.serverConnection) {
            this.serverConnection.close();
        }
        
        console.log('Bridge shutdown complete');
    }
}

// Export for use
export default GestureWebSocketBridge;

// Standalone execution - fixed for Windows
const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));

if (isMain || process.env.RUN_BRIDGE === 'true') {
    console.log('Starting Gesture-WebSocket Bridge...');
    const bridge = new GestureWebSocketBridge();
    
    bridge.start().catch(err => {
        console.error('Failed to start bridge:', err);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await bridge.shutdown();
        process.exit(0);
    });
}
