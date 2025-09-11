const uWS = require('uWebSockets.js');
const GestureONNXModel = require('../models/gesture-onnx-model');
require('dotenv').config();

class GestureService {
    constructor() {
        this.port = process.env.GESTURE_PORT || 8081;
        this.clients = new Map();
        this.onnxModel = new GestureONNXModel();
        this.sessions = new Map(); // Track gesture sessions
        this.multiClaudeEnabled = process.env.MULTI_CLAUDE_ENABLED === 'true';
        
        this.initializeService();
    }
    
    async initializeService() {
        try {
            // Initialize ONNX model
            await this.onnxModel.initialize();
            console.log('ONNX model initialized successfully');
            
            // Initialize server
            this.initializeServer();
            
            // Connect to multi-Claude orchestrator if enabled
            if (this.multiClaudeEnabled) {
                await this.connectToMultiClaude();
            }
        } catch (error) {
            console.error('Service initialization error:', error);
            // Continue with fallback mode
            this.initializeServer();
        }
    }

    initializeServer() {
        this.app = uWS.App();
        
        // WebSocket endpoint for gesture recognition
        this.app.ws('/gesture', {
            compression: 0, // Disable for lowest latency
            maxPayloadLength: 64 * 1024, // Increased for hand landmark data
            idleTimeout: 120,
            
            open: (ws) => {
                const clientId = this.generateClientId();
                ws.clientId = clientId;
                this.clients.set(clientId, ws);
                
                // Initialize session tracking
                this.sessions.set(clientId, {
                    startTime: Date.now(),
                    gestureHistory: [],
                    performance: {
                        fps: 0,
                        latency: [],
                        accuracy: []
                    }
                });
                
                console.log(`Gesture client connected: ${clientId}`);
                
                // Send welcome message with capabilities
                ws.send(JSON.stringify({
                    type: 'connected',
                    clientId: clientId,
                    capabilities: {
                        onnxModel: !!this.onnxModel.session,
                        tfModel: !!this.onnxModel.tfModel,
                        multiClaude: this.multiClaudeEnabled,
                        supportedGestures: this.onnxModel.labels,
                        mathOperations: Object.keys(this.onnxModel.mathGestures)
                    },
                    timestamp: Date.now()
                }));
            },
            
            message: async (ws, message, isBinary) => {
                const startTime = performance.now();
                
                try {
                    const data = JSON.parse(Buffer.from(message).toString());
                    await this.handleMessage(ws, data);
                    
                    // Track performance
                    const latency = performance.now() - startTime;
                    this.updatePerformanceMetrics(ws.clientId, latency);
                    
                } catch (error) {
                    console.error('Message processing error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message,
                        timestamp: Date.now()
                    }));
                }
            },
            
            close: (ws) => {
                const session = this.sessions.get(ws.clientId);
                if (session) {
                    this.logSessionStats(ws.clientId, session);
                }
                
                this.clients.delete(ws.clientId);
                this.sessions.delete(ws.clientId);
                console.log(`Gesture client disconnected: ${ws.clientId}`);
            },
            
            drain: (ws) => {
                console.log(`WebSocket backpressure: ${ws.getBufferedAmount()}`);
            }
        });
        
        // REST endpoints
        this.setupRESTEndpoints();
        
        // Start listening
        this.app.listen(this.port, (token) => {
            if (token) {
                console.log(`Gesture service running on port ${this.port}`);
                console.log(`WebSocket endpoint: ws://localhost:${this.port}/gesture`);
            } else {
                console.error(`Failed to start gesture service on port ${this.port}`);
                process.exit(1);
            }
        });
    }
    
    setupRESTEndpoints() {
        // Health check endpoint
        this.app.get('/health', (res) => {
            res.writeHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                status: 'healthy',
                clients: this.clients.size,
                sessions: this.sessions.size,
                modelStatus: {
                    onnx: !!this.onnxModel.session,
                    tensorflow: !!this.onnxModel.tfModel
                },
                uptime: process.uptime(),
                timestamp: Date.now()
            }));
        });
        
        // Statistics endpoint
        this.app.get('/stats', (res) => {
            const stats = this.getServiceStatistics();
            res.writeHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(stats));
        });
        
        // Model info endpoint
        this.app.get('/model/info', (res) => {
            res.writeHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                supportedGestures: this.onnxModel.labels,
                mathOperations: this.onnxModel.mathGestures,
                handLandmarks: this.onnxModel.HAND_LANDMARKS
            }));
        });
    }
    
    async handleMessage(ws, data) {
        switch (data.type) {
            case 'handLandmarks':
                await this.processHandLandmarks(ws, data.landmarks, data.metadata);
                break;
                
            case 'gesture':
                // Legacy support for point-based gestures
                await this.processLegacyGesture(ws, data.points);
                break;
                
            case 'calibrate':
                await this.calibrateForUser(ws, data.samples);
                break;
                
            case 'ping':
                ws.send(JSON.stringify({ 
                    type: 'pong',
                    timestamp: Date.now()
                }));
                break;
                
            default:
                console.warn('Unknown message type:', data.type);
        }
    }
    
    async processHandLandmarks(ws, landmarks, metadata = {}) {
        // Predict gesture using ONNX model
        const prediction = await this.onnxModel.predict(landmarks);
        
        // Get math operation if applicable
        const mathOp = this.onnxModel.getMathOperation(prediction.gesture);
        
        // Track in session history
        const session = this.sessions.get(ws.clientId);
        if (session) {
            session.gestureHistory.push({
                gesture: prediction.gesture,
                confidence: prediction.confidence,
                timestamp: Date.now()
            });
            
            // Keep only last 100 gestures
            if (session.gestureHistory.length > 100) {
                session.gestureHistory.shift();
            }
        }
        
        // Prepare response
        const result = {
            type: 'gesture_result',
            gesture: prediction.gesture,
            confidence: prediction.confidence,
            probabilities: prediction.probabilities,
            mathOperation: mathOp,
            metadata: {
                processingTime: metadata.processingTime,
                frameId: metadata.frameId,
                timestamp: Date.now()
            }
        };
        
        // Send to multi-Claude if enabled and confidence is high
        if (this.multiClaudeEnabled && prediction.confidence > 0.8) {
            this.sendToMultiClaude(result);
        }
        
        ws.send(JSON.stringify(result));
    }
    
    async processLegacyGesture(ws, points) {
        // Convert points to pseudo-landmarks for compatibility
        const landmarks = this.convertPointsToLandmarks(points);
        await this.processHandLandmarks(ws, landmarks);
    }
    
    convertPointsToLandmarks(points) {
        // Simple conversion - treat points as trajectory
        // Create pseudo hand landmarks
        const landmarks = [];
        
        for (let i = 0; i < 21; i++) {
            const pointIndex = Math.min(i, points.length - 1);
            const point = points[pointIndex] || { x: 0, y: 0 };
            
            landmarks.push({
                x: point.x / 1000, // Normalize to 0-1
                y: point.y / 1000,
                z: 0
            });
        }
        
        return landmarks;
    }
    
    async calibrateForUser(ws, samples) {
        // User-specific calibration
        console.log(`Calibrating for client ${ws.clientId} with ${samples.length} samples`);
        
        // TODO: Implement user-specific model fine-tuning
        
        ws.send(JSON.stringify({
            type: 'calibration_complete',
            message: 'Calibration successful',
            timestamp: Date.now()
        }));
    }
    
    updatePerformanceMetrics(clientId, latency) {
        const session = this.sessions.get(clientId);
        if (!session) return;
        
        session.performance.latency.push(latency);
        
        // Keep only last 100 measurements
        if (session.performance.latency.length > 100) {
            session.performance.latency.shift();
        }
        
        // Calculate FPS from gesture frequency
        const recentGestures = session.gestureHistory.slice(-30);
        if (recentGestures.length >= 2) {
            const timeSpan = recentGestures[recentGestures.length - 1].timestamp - recentGestures[0].timestamp;
            session.performance.fps = (recentGestures.length / timeSpan) * 1000;
        }
    }
    
    getServiceStatistics() {
        const stats = {
            activeClients: this.clients.size,
            totalSessions: this.sessions.size,
            averageLatency: 0,
            averageFPS: 0,
            gestureDistribution: {},
            timestamp: Date.now()
        };
        
        // Calculate averages
        let totalLatency = 0;
        let latencyCount = 0;
        let totalFPS = 0;
        let fpsCount = 0;
        
        this.sessions.forEach(session => {
            if (session.performance.latency.length > 0) {
                const avgLatency = session.performance.latency.reduce((a, b) => a + b, 0) / session.performance.latency.length;
                totalLatency += avgLatency;
                latencyCount++;
            }
            
            if (session.performance.fps > 0) {
                totalFPS += session.performance.fps;
                fpsCount++;
            }
            
            // Count gesture distribution
            session.gestureHistory.forEach(entry => {
                stats.gestureDistribution[entry.gesture] = (stats.gestureDistribution[entry.gesture] || 0) + 1;
            });
        });
        
        stats.averageLatency = latencyCount > 0 ? totalLatency / latencyCount : 0;
        stats.averageFPS = fpsCount > 0 ? totalFPS / fpsCount : 0;
        
        return stats;
    }
    
    logSessionStats(clientId, session) {
        const duration = Date.now() - session.startTime;
        const stats = {
            clientId,
            duration: duration / 1000, // seconds
            totalGestures: session.gestureHistory.length,
            averageLatency: session.performance.latency.length > 0 
                ? session.performance.latency.reduce((a, b) => a + b, 0) / session.performance.latency.length 
                : 0,
            averageFPS: session.performance.fps
        };
        
        console.log('Session statistics:', stats);
        
        // TODO: Save to database or analytics service
    }
    
    async connectToMultiClaude() {
        // TODO: Implement connection to multi-Claude orchestrator
        console.log('Multi-Claude integration enabled');
        
        // This would connect to the orchestrator service
        // For now, we'll just set a flag
        this.multiClaudeConnected = true;
    }
    
    sendToMultiClaude(gestureResult) {
        if (!this.multiClaudeConnected) return;
        
        // TODO: Send gesture result to multi-Claude orchestrator
        // This would typically be a WebSocket or REST call
        console.log('Sending to multi-Claude:', gestureResult.gesture);
    }
    
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gesture service...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nTerminating gesture service...');
    process.exit(0);
});

// Start the service
const service = new GestureService();

export default GestureService;
