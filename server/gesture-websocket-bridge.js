/**
 * Gesture-WebSocket Integration Bridge
 * Connects gesture recognition to AE server for real-time motion graphics
 * Created: 2025-01-27
 */

import WebSocket, { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import msgpack from 'msgpack-lite';

class GestureWebSocketBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            gesturePort: config.gesturePort || 8088,
            aeServerPort: config.aeServerPort || 8080,  // Changed from 8085 to 8080
            reconnectInterval: 5000,
            heartbeatInterval: 30000,
            ...config
        };
        
        this.gestureClients = new Set();
        this.aeConnection = null;
        this.isConnected = false;
        this.gestureHistory = [];
        this.maxHistorySize = 100;
    }

    async initialize() {
        console.log('[BRIDGE] Initializing Gesture-WebSocket Bridge...');
        
        // Start gesture server
        await this.startGestureServer();
        
        // Connect to AE server
        await this.connectToAEServer();
        
        // Start heartbeat
        this.startHeartbeat();
        
        console.log('[BRIDGE] Bridge initialized successfully');
        return true;
    }

    async startGestureServer() {
        this.gestureServer = new WebSocketServer({ 
            port: this.config.gesturePort 
        });

        this.gestureServer.on('connection', (ws, req) => {
            console.log(`[GESTURE] Client connected from ${req.socket.remoteAddress}`);
            this.gestureClients.add(ws);
            
            ws.on('message', async (data) => {
                try {
                    const gesture = this.parseGestureData(data);
                    await this.processGesture(gesture);
                } catch (error) {
                    console.error('[GESTURE] Error processing:', error);
                }
            });

            ws.on('close', () => {
                this.gestureClients.delete(ws);
                console.log('[GESTURE] Client disconnected');
            });

            ws.on('error', (error) => {
                console.error('[GESTURE] WebSocket error:', error);
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'CONNECTED',
                timestamp: Date.now(),
                bridge: 'gesture-websocket',
                capabilities: {
                    gestures: ['swipe', 'pinch', 'rotate', 'tap', 'draw'],
                    realtime: true,
                    tracking: true
                }
            }));
        });

        console.log(`[GESTURE] Server listening on port ${this.config.gesturePort}`);
    }

    async connectToAEServer() {
        return new Promise((resolve, reject) => {
            this.aeConnection = new WebSocket(`ws://localhost:${this.config.aeServerPort}`);
            
            this.aeConnection.on('open', () => {
                this.isConnected = true;
                console.log(`[AE] Connected to AE server on port ${this.config.aeServerPort}`);
                
                // Register as gesture bridge
                this.aeConnection.send(JSON.stringify({
                    type: 'REGISTER_BRIDGE',
                    source: 'gesture',
                    capabilities: {
                        gestures: true,
                        realtime: true,
                        mediapipe: true
                    }
                }));
                
                resolve();
            });

            this.aeConnection.on('message', (data) => {
                this.handleAEMessage(data);
            });

            this.aeConnection.on('close', () => {
                this.isConnected = false;
                console.log('[AE] Connection closed, attempting reconnect...');
                setTimeout(() => this.connectToAEServer(), this.config.reconnectInterval);
            });

            this.aeConnection.on('error', (error) => {
                console.error('[AE] Connection error:', error);
                reject(error);
            });
        });
    }

    parseGestureData(data) {
        try {
            // Try msgpack first for efficiency
            return msgpack.decode(data);
        } catch {
            // Fallback to JSON
            return JSON.parse(data.toString());
        }
    }

    async processGesture(gesture) {
        // Add to history
        this.gestureHistory.push({
            ...gesture,
            timestamp: Date.now()
        });
        
        if (this.gestureHistory.length > this.maxHistorySize) {
            this.gestureHistory.shift();
        }

        // Translate gesture to AE command
        const aeCommand = await this.translateGestureToAE(gesture);
        
        // Send to AE server if connected
        if (this.isConnected && this.aeConnection) {
            const message = msgpack.encode({
                type: 'GESTURE_COMMAND',
                gesture: gesture,
                command: aeCommand,
                timestamp: Date.now()
            });
            
            this.aeConnection.send(message);
            
            // Broadcast to all gesture clients
            this.broadcastToGestureClients({
                type: 'COMMAND_SENT',
                gesture: gesture.type,
                command: aeCommand.action,
                status: 'success'
            });
        }
        
        // Emit for local processing
        this.emit('gesture', gesture, aeCommand);
    }

    async translateGestureToAE(gesture) {
        // Map gestures to After Effects commands
        const gestureMap = {
            'swipe_left': {
                action: 'MOVE_LAYER',
                direction: 'left',
                amount: gesture.velocity || 100
            },
            'swipe_right': {
                action: 'MOVE_LAYER',
                direction: 'right',
                amount: gesture.velocity || 100
            },
            'pinch': {
                action: 'SCALE_LAYER',
                scale: gesture.scale || 1.0
            },
            'rotate': {
                action: 'ROTATE_LAYER',
                angle: gesture.angle || 0
            },
            'tap': {
                action: 'SELECT_LAYER',
                position: gesture.position
            },
            'draw': {
                action: 'CREATE_PATH',
                points: gesture.points || []
            },
            'circle': {
                action: 'CREATE_SHAPE',
                shape: 'ellipse',
                radius: gesture.radius || 100
            },
            'rectangle': {
                action: 'CREATE_SHAPE',
                shape: 'rectangle',
                dimensions: gesture.dimensions
            }
        };

        const command = gestureMap[gesture.type] || {
            action: 'CUSTOM_GESTURE',
            data: gesture
        };

        // Add context from gesture history for complex gestures
        if (this.gestureHistory.length > 1) {
            command.context = this.analyzeGestureContext();
        }

        return command;
    }

    analyzeGestureContext() {
        // Analyze recent gestures for patterns
        const recentGestures = this.gestureHistory.slice(-5);
        const gestureTypes = recentGestures.map(g => g.type);
        
        // Detect gesture combinations
        if (gestureTypes.includes('tap') && gestureTypes.includes('drag')) {
            return { pattern: 'select_and_move' };
        }
        
        if (gestureTypes.filter(g => g === 'tap').length >= 2) {
            return { pattern: 'multi_select' };
        }
        
        if (gestureTypes.includes('pinch') && gestureTypes.includes('rotate')) {
            return { pattern: 'transform' };
        }
        
        return { pattern: 'single_gesture' };
    }

    handleAEMessage(data) {
        try {
            const message = msgpack.decode(data);
            
            // Process AE server responses
            if (message.type === 'COMMAND_RESULT') {
                this.broadcastToGestureClients({
                    type: 'AE_RESULT',
                    success: message.success,
                    action: message.action,
                    details: message.details
                });
            }
            
            if (message.type === 'AE_STATE_UPDATE') {
                this.broadcastToGestureClients({
                    type: 'STATE_UPDATE',
                    layers: message.layers,
                    composition: message.composition
                });
            }
        } catch (error) {
            console.error('[BRIDGE] Error handling AE message:', error);
        }
    }

    broadcastToGestureClients(message) {
        const data = JSON.stringify(message);
        this.gestureClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }

    startHeartbeat() {
        setInterval(() => {
            // Ping gesture clients
            this.broadcastToGestureClients({ type: 'PING' });
            
            // Ping AE server
            if (this.isConnected && this.aeConnection) {
                this.aeConnection.send(JSON.stringify({ type: 'PING' }));
            }
        }, this.config.heartbeatInterval);
    }

    async shutdown() {
        console.log('[BRIDGE] Shutting down...');
        
        // Close gesture server
        if (this.gestureServer) {
            this.gestureServer.close();
        }
        
        // Close AE connection
        if (this.aeConnection) {
            this.aeConnection.close();
        }
        
        // Clear clients
        this.gestureClients.clear();
        
        console.log('[BRIDGE] Shutdown complete');
    }

    // MediaPipe integration helper
    processMediaPipeHandLandmarks(landmarks) {
        // 21 hand landmarks from MediaPipe
        const gestures = [];
        
        // Detect basic gestures from landmarks
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const distance = this.calculateDistance(thumbTip, indexTip);
        
        if (distance < 0.05) {
            gestures.push({ type: 'pinch', scale: distance });
        }
        
        // Detect pointing
        if (indexTip.y < landmarks[5].y) {
            gestures.push({ type: 'pointing', direction: 'up' });
        }
        
        return gestures;
    }

    calculateDistance(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) + 
            Math.pow(p1.y - p2.y, 2) + 
            Math.pow(p1.z - p2.z, 2)
        );
    }
}

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const bridge = new GestureWebSocketBridge();
    
    bridge.initialize().catch(console.error);
    
    process.on('SIGINT', async () => {
        await bridge.shutdown();
        process.exit(0);
    });
    
    console.log('[BRIDGE] Gesture-WebSocket Bridge running...');
    console.log('[BRIDGE] Gesture server: ws://localhost:8088');
    console.log('[BRIDGE] AE server connection: ws://localhost:8085');
}

export default GestureWebSocketBridge;
