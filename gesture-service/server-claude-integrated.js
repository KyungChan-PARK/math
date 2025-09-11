/**
 * Gesture Service with Real Claude API Integration
 * Uses actual Claude API orchestration instead of fake WebSocket connections
 */

const uWS = require('uWebSockets.js');
const ClaudeAPIOrchestrator = require('../orchestration/claude-api-orchestrator');
const GestureONNXModel = require('../models/gesture-onnx-model');
require('dotenv').config();

class GestureServiceWithClaude {
    constructor() {
        this.port = process.env.GESTURE_PORT || 8081;
        this.clients = new Map();
        this.sessions = new Map();
        
        // Initialize real components
        this.onnxModel = new GestureONNXModel();
        this.claudeOrchestrator = new ClaudeAPIOrchestrator();
        
        // Performance tracking
        this.performance = {
            gestureProcessing: [],
            claudeOrchestration: [],
            totalRequests: 0,
            successfulRequests: 0
        };
        
        this.initializeService();
    }
    
    async initializeService() {
        try {
            // Initialize ONNX model
            await this.onnxModel.initialize();
            console.log('✅ ONNX model initialized');
            
            // Claude orchestrator is ready to use (no connection needed)
            console.log('✅ Claude API orchestrator ready');
            
            // Initialize WebSocket server
            this.initializeServer();
            
            console.log('✅ Gesture Service with Claude Integration started');
        } catch (error) {
            console.error('❌ Service initialization error:', error);
            this.initializeServer(); // Start anyway with fallback
        }
    }

    initializeServer() {
        this.app = uWS.App();
        
        // Main WebSocket endpoint
        this.app.ws('/gesture', {
            compression: 0,
            maxPayloadLength: 64 * 1024,
            idleTimeout: 120,
            
            open: (ws) => {
                const clientId = this.generateClientId();
                ws.clientId = clientId;
                this.clients.set(clientId, ws);
                
                this.sessions.set(clientId, {
                    startTime: Date.now(),
                    gestureHistory: [],
                    claudeResponses: [],
                    performance: {
                        gestureLatency: [],
                        claudeLatency: [],
                        totalLatency: []
                    }
                });
                
                console.log(`Client connected: ${clientId}`);
                
                ws.send(JSON.stringify({
                    type: 'connected',
                    clientId,
                    capabilities: {
                        onnxModel: true,
                        claudeOrchestration: true,
                        realtimeProcessing: true,
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
                    const totalLatency = performance.now() - startTime;
                    this.updatePerformance(ws.clientId, 'total', totalLatency);
                    
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
                console.log(`Client disconnected: ${ws.clientId}`);
            }
        });
        
        // REST endpoints
        this.setupRESTEndpoints();
        
        // Start server
        this.app.listen(this.port, (token) => {
            if (token) {
                console.log(` Gesture Service running on port ${this.port}`);
                console.log(` WebSocket: ws://localhost:${this.port}/gesture`);
                console.log(` Claude API: Integrated and ready`);
            } else {
                console.error(`Failed to start on port ${this.port}`);
                process.exit(1);
            }
        });
    }
    
    setupRESTEndpoints() {
        // Health check
        this.app.get('/health', (res) => {
            res.writeHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                status: 'healthy',
                services: {
                    onnx: !!this.onnxModel.session || !!this.onnxModel.tfModel,
                    claude: true,
                    websocket: this.clients.size
                },
                performance: this.getPerformanceStats(),
                uptime: process.uptime()
            }));
        });
        
        // Claude orchestration test
        this.app.post('/test-claude', (res) => {
            let body = '';
            
            res.onData((chunk, isLast) => {
                body += Buffer.from(chunk).toString();
                
                if (isLast) {
                    this.testClaudeOrchestration(JSON.parse(body))
                        .then(result => {
                            res.writeHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(result));
                        })
                        .catch(error => {
                            res.writeStatus('500');
                            res.end(JSON.stringify({ error: error.message }));
                        });
                }
            });
        });
        
        // Statistics
        this.app.get('/stats', (res) => {
            res.writeHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                performance: this.getPerformanceStats(),
                claude: this.claudeOrchestrator.getMetrics(),
                sessions: this.sessions.size,
                timestamp: Date.now()
            }));
        });
    }
    
    async handleMessage(ws, data) {
        const session = this.sessions.get(ws.clientId);
        
        switch (data.type) {
            case 'handLandmarks':
                await this.processHandLandmarksWithClaude(ws, data.landmarks, data.metadata);
                break;
                
            case 'mathProblem':
                await this.processMathProblem(ws, data.problem);
                break;
                
            case 'complexTask':
                await this.processComplexTask(ws, data.task);
                break;
                
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
                
            default:
                console.warn('Unknown message type:', data.type);
        }
    }
    
    async processHandLandmarksWithClaude(ws, landmarks, metadata = {}) {
        const session = this.sessions.get(ws.clientId);
        const gestureStart = performance.now();
        
        // Step 1: Local ONNX gesture recognition
        const gestureResult = await this.onnxModel.predict(landmarks);
        const gestureLatency = performance.now() - gestureStart;
        
        // Track gesture performance
        this.updatePerformance(ws.clientId, 'gesture', gestureLatency);
        
        // Step 2: If high confidence gesture detected, get Claude's interpretation
        let claudeAnalysis = null;
        if (gestureResult.confidence > 0.7) {
            const claudeStart = performance.now();
            
            try {
                // Use Claude to interpret the gesture in educational context
                claudeAnalysis = await this.claudeOrchestrator.processTask(
                    'gesture_recognition',
                    {
                        gesture: gestureResult.gesture,
                        confidence: gestureResult.confidence,
                        landmarks: landmarks,
                        context: 'math_education'
                    }
                );
                
                const claudeLatency = performance.now() - claudeStart;
                this.updatePerformance(ws.clientId, 'claude', claudeLatency);
                
                // Store in session
                if (session) {
                    session.claudeResponses.push({
                        timestamp: Date.now(),
                        analysis: claudeAnalysis
                    });
                }
            } catch (error) {
                console.error('Claude analysis failed:', error);
                // Continue with local result only
            }
        }
        
        // Step 3: Combine and send results
        const mathOp = this.onnxModel.getMathOperation(gestureResult.gesture);
        
        const result = {
            type: 'gesture_result',
            gesture: gestureResult.gesture,
            confidence: gestureResult.confidence,
            mathOperation: mathOp,
            claudeInsights: claudeAnalysis ? claudeAnalysis.combined : null,
            performance: {
                gestureLatency,
                claudeLatency: claudeAnalysis ? 
                    claudeAnalysis.processingTime : null,
                totalLatency: performance.now() - gestureStart
            },
            timestamp: Date.now()
        };
        
        // Update session
        if (session) {
            session.gestureHistory.push({
                gesture: gestureResult.gesture,
                confidence: gestureResult.confidence,
                timestamp: Date.now()
            });
        }
        
        ws.send(JSON.stringify(result));
    }
    
    async processMathProblem(ws, problem) {
        const startTime = performance.now();
        
        try {
            // Use Claude orchestrator for math problems
            const result = await this.claudeOrchestrator.processTask(
                'math_problem',
                problem
            );
            
            const response = {
                type: 'math_solution',
                problem,
                solution: result.combined,
                specialists: result.specialists,
                processingTime: performance.now() - startTime,
                timestamp: Date.now()
            };
            
            ws.send(JSON.stringify(response));
            
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                message: `Math problem processing failed: ${error.message}`,
                timestamp: Date.now()
            }));
        }
    }
    
    async processComplexTask(ws, task) {
        const startTime = performance.now();
        
        try {
            // Use full Claude orchestration for complex tasks
            const result = await this.claudeOrchestrator.processTask(
                'complex_learning',
                task
            );
            
            const response = {
                type: 'complex_result',
                task,
                result: result.combined,
                integratedLesson: result.combined.integratedLesson,
                specialists: result.specialists,
                processingTime: performance.now() - startTime,
                timestamp: Date.now()
            };
            
            ws.send(JSON.stringify(response));
            
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                message: `Complex task processing failed: ${error.message}`,
                timestamp: Date.now()
            }));
        }
    }
    
    async testClaudeOrchestration(testData) {
        const { taskType = 'math_problem', input = 'What is 2+2?' } = testData;
        
        console.log(`Testing Claude orchestration: ${taskType}`);
        const startTime = Date.now();
        
        try {
            const result = await this.claudeOrchestrator.processTask(taskType, input);
            
            return {
                success: true,
                taskType,
                input,
                result: result.combined,
                specialists: result.specialists.length,
                processingTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }
    
    updatePerformance(clientId, type, latency) {
        const session = this.sessions.get(clientId);
        if (!session) return;
        
        switch (type) {
            case 'gesture':
                session.performance.gestureLatency.push(latency);
                break;
            case 'claude':
                session.performance.claudeLatency.push(latency);
                break;
            case 'total':
                session.performance.totalLatency.push(latency);
                break;
        }
        
        // Keep only last 100 measurements
        Object.keys(session.performance).forEach(key => {
            if (session.performance[key].length > 100) {
                session.performance[key].shift();
            }
        });
    }
    
    getPerformanceStats() {
        let totalGestureLatency = 0;
        let totalClaudeLatency = 0;
        let totalOverallLatency = 0;
        let gestureCount = 0;
        let claudeCount = 0;
        let overallCount = 0;
        
        this.sessions.forEach(session => {
            if (session.performance.gestureLatency.length > 0) {
                const avg = session.performance.gestureLatency.reduce((a, b) => a + b, 0) / 
                           session.performance.gestureLatency.length;
                totalGestureLatency += avg;
                gestureCount++;
            }
            
            if (session.performance.claudeLatency.length > 0) {
                const avg = session.performance.claudeLatency.reduce((a, b) => a + b, 0) / 
                           session.performance.claudeLatency.length;
                totalClaudeLatency += avg;
                claudeCount++;
            }
            
            if (session.performance.totalLatency.length > 0) {
                const avg = session.performance.totalLatency.reduce((a, b) => a + b, 0) / 
                           session.performance.totalLatency.length;
                totalOverallLatency += avg;
                overallCount++;
            }
        });
        
        return {
            averageGestureLatency: gestureCount > 0 ? totalGestureLatency / gestureCount : 0,
            averageClaudeLatency: claudeCount > 0 ? totalClaudeLatency / claudeCount : 0,
            averageTotalLatency: overallCount > 0 ? totalOverallLatency / overallCount : 0,
            activeSessions: this.sessions.size
        };
    }
    
    logSessionStats(clientId, session) {
        const duration = Date.now() - session.startTime;
        const stats = {
            clientId,
            duration: duration / 1000,
            totalGestures: session.gestureHistory.length,
            claudeResponses: session.claudeResponses.length,
            averageGestureLatency: session.performance.gestureLatency.length > 0 ?
                session.performance.gestureLatency.reduce((a, b) => a + b, 0) / 
                session.performance.gestureLatency.length : 0,
            averageClaudeLatency: session.performance.claudeLatency.length > 0 ?
                session.performance.claudeLatency.reduce((a, b) => a + b, 0) / 
                session.performance.claudeLatency.length : 0
        };
        
        console.log(' Session statistics:', stats);
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
    console.log('\n Shutting down gesture service...');
    process.exit(0);
});

// Start the service
const service = new GestureServiceWithClaude();

export default GestureServiceWithClaude;
