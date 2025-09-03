/**
 * AE Claude Max v3.3.0 - Main Server Entry Point
 * 
 * This is the heart of our real-time After Effects automation system.
 * It orchestrates all components: WebSocket communication, NLP processing,
 * and ExtendScript generation.
 * 
 * ES Module Migration Complete ✅
 * - All core components now use ES modules
 * - Ready for CEP to UXP transition
 * - Prepared for µWebSockets 8.5x performance boost
 * 
 * Performance Targets:
 * - WebSocket: 850+ msg/sec (µWebSockets mode)
 * - NLP Processing: <10ms per message
 * - Script Generation: <5ms per command
 * 
 * @module MainServer
 * @version 3.3.0
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import WebSocketBridge from './abstraction/websocket-bridge.js';
import NLPEngine from './nlp-engine.js';
import ScriptGenerator from './script-generator.js';
import AEBridge from './ae-bridge.js';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Get current directory (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure logging for production monitoring
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'ae-claude-max' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ 
            filename: join(__dirname, '../logs/error.log'), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: join(__dirname, '../logs/combined.log') 
        })
    ]
});

/**
 * Main AE Claude Max Server Class
 * Orchestrates all components for real-time After Effects automation
 */
class AEClaudeMaxServer {
    constructor() {
        // Initialize core components
        this.nlpEngine = new NLPEngine();
        this.scriptGenerator = new ScriptGenerator();
        
        // Initialize After Effects bridge for script execution
        this.aeBridge = new AEBridge({
            port: process.env.AE_PORT || 9000,
            host: process.env.AE_HOST || 'localhost',
            reconnectInterval: 5000,
            maxReconnectAttempts: 10
        });
        
        // Configure WebSocket with auto-detection for best performance
        // Will use µWebSockets if available (8.5x faster), otherwise standard ws
        this.websocketBridge = new WebSocketBridge({
            implementation: process.env.WS_IMPLEMENTATION || 'auto',
            port: process.env.WS_PORT || 8080,
            host: process.env.WS_HOST || 'localhost',
            compression: true,
            maxPayload: 100 * 1024, // 100KB max message size
            ssl: process.env.SSL_ENABLED === 'true' ? {
                keyFile: process.env.SSL_KEY_FILE,
                certFile: process.env.SSL_CERT_FILE,
                passphrase: process.env.SSL_PASSPHRASE
            } : null
        });
        
        // Performance metrics tracking
        this.metrics = {
            startTime: Date.now(),
            messagesProcessed: 0,
            commandsExecuted: 0,
            errors: 0,
            averageLatency: 0
        };
        
        this.setupEventHandlers();
        this.setupGracefulShutdown();
    }
    
    /**
     * Set up WebSocket event handlers for real-time communication
     */
    setupEventHandlers() {
        // Set up After Effects bridge event handlers
        this.aeBridge.on('connected', () => {
            logger.info('After Effects bridge connected');
            // Notify all connected clients
            this.websocketBridge.broadcast({
                type: 'AE_STATUS',
                connected: true,
                message: 'After Effects is now connected',
                timestamp: Date.now()
            });
        });
        
        this.aeBridge.on('disconnected', () => {
            logger.warn('After Effects bridge disconnected');
            // Notify all connected clients
            this.websocketBridge.broadcast({
                type: 'AE_STATUS',
                connected: false,
                message: 'After Effects disconnected - attempting reconnection',
                timestamp: Date.now()
            });
        });
        
        this.aeBridge.on('mock_mode', () => {
            logger.info('After Effects bridge entered mock mode');
            // Notify all connected clients
            this.websocketBridge.broadcast({
                type: 'AE_STATUS',
                connected: true,
                mockMode: true,
                message: 'Running in development mode (After Effects not connected)',
                timestamp: Date.now()
            });
        });
        
        // Handle new connections
        this.websocketBridge.on('connection', ({ connectionId, metadata }) => {
            logger.info(`New connection: ${connectionId}`, { metadata });
            
            // Send welcome message with server capabilities
            this.websocketBridge.send(connectionId, {
                type: 'WELCOME',
                message: 'Connected to AE Claude Max v3.3.0',
                capabilities: {
                    nlp: true,
                    realtime: true,
                    maxMessageSize: 100 * 1024,
                    supportedIntents: this.nlpEngine.getSupportedIntents(),
                    afterEffects: {
                        connected: this.aeBridge.isConnected(),
                        mockMode: this.aeBridge.isMockMode()
                    }
                },
                timestamp: Date.now()
            });
        });
        
        // Handle incoming messages
        this.websocketBridge.on('NATURAL_LANGUAGE', async ({ connectionId, message }) => {
            const startTime = Date.now();
            
            try {
                // Extract text from message payload (handle both formats for compatibility)
                const text = message.payload?.text || message.text;
                
                if (!text) {
                    logger.error('No text found in message:', message);
                    await this.websocketBridge.send(connectionId, {
                        type: 'ERROR',
                        error: 'No text content found in message',
                        timestamp: Date.now()
                    });
                    return;
                }
                
                logger.debug(`Processing natural language: ${text}`);
                
                // Step 1: Parse natural language using NLP engine
                const intent = await this.nlpEngine.parse(
                    text, 
                    connectionId
                );
                
                // Step 2: Check if we need clarification
                if (intent.needsClarification) {
                    await this.websocketBridge.send(connectionId, {
                        type: 'CLARIFICATION_NEEDED',
                        question: intent.clarificationQuestion,
                        suggestions: intent.suggestions,
                        timestamp: Date.now()
                    });
                    return;
                }
                
                // Step 3: Generate ExtendScript from parsed intent
                const script = await this.scriptGenerator.generate(intent);
                
                // Step 4: Execute script in After Effects through the bridge
                let executionResult = null;
                let executionSuccess = false;
                
                try {
                    if (this.aeBridge.isConnected() || this.aeBridge.isMockMode()) {
                        executionResult = await this.aeBridge.execute(script);
                        executionSuccess = true;
                        logger.info('Script executed successfully in After Effects');
                    } else {
                        logger.warn('After Effects not connected - script generated but not executed');
                    }
                } catch (execError) {
                    logger.error('Script execution failed:', execError);
                    executionResult = { error: execError.message };
                }
                
                // Step 5: Send response back to client with execution results
                await this.websocketBridge.send(connectionId, {
                    type: 'SCRIPT_GENERATED',
                    script: script,
                    intent: intent.type,
                    confidence: intent.confidence,
                    executed: executionSuccess,
                    result: executionResult,
                    processingTime: Date.now() - startTime,
                    requestId: message.requestId, // Include original request ID for correlation
                    humanReadable: this.generateHumanReadableDescription(intent),
                    timestamp: Date.now()
                });
                
                // Update metrics
                const latency = Date.now() - startTime;
                this.updateMetrics(latency);
                
                logger.info(`Processed command in ${latency}ms`, {
                    intent: intent.type,
                    confidence: intent.confidence
                });
                
            } catch (error) {
                logger.error('Error processing message:', error);
                this.metrics.errors++;
                
                await this.websocketBridge.send(connectionId, {
                    type: 'ERROR',
                    error: error.message,
                    suggestion: 'Please try rephrasing your request',
                    timestamp: Date.now()
                });
            }
        });
        
        // Handle disconnections
        this.websocketBridge.on('disconnection', ({ connectionId, duration, messageCount }) => {
            logger.info(`Connection closed: ${connectionId}`, {
                duration: `${duration}ms`,
                messages: messageCount
            });
            
            // Clear NLP context for this connection
            this.nlpEngine.clearContext(connectionId);
        });
    }
    
    /**
     * Generate human-readable description of what the script will do
     */
    generateHumanReadableDescription(intent) {
        const descriptions = {
            CREATE: `Creating ${intent.entities.object || 'shape'} with ${intent.entities.color || 'default'} color`,
            MOVE: `Moving ${intent.entities.target || 'selected object'} ${intent.entities.direction || 'to position'}`,
            TRANSFORM: `Transforming ${intent.entities.target || 'selected object'} by ${intent.entities.amount || 'specified amount'}`,
            ANIMATE: `Adding ${intent.entities.animation_type || 'animation'} to ${intent.entities.target || 'selected object'}`,
            STYLE: `Changing ${intent.entities.property || 'style'} of ${intent.entities.target || 'selected object'}`
        };
        
        return descriptions[intent.type] || `Executing ${intent.type} command`;
    }
    
    /**
     * Update performance metrics
     */
    updateMetrics(latency) {
        this.metrics.messagesProcessed++;
        this.metrics.commandsExecuted++;
        
        // Calculate rolling average latency
        const alpha = 0.1; // Smoothing factor
        this.metrics.averageLatency = this.metrics.averageLatency * (1 - alpha) + latency * alpha;
    }
    
    /**
     * Set up graceful shutdown handling
     */
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            logger.info(`Received ${signal}, shutting down gracefully...`);
            
            // Report final metrics
            const uptime = (Date.now() - this.metrics.startTime) / 1000;
            logger.info('Final metrics:', {
                uptime: `${uptime.toFixed(2)}s`,
                messagesProcessed: this.metrics.messagesProcessed,
                commandsExecuted: this.metrics.commandsExecuted,
                errors: this.metrics.errors,
                averageLatency: `${this.metrics.averageLatency.toFixed(2)}ms`,
                messagesPerSecond: (this.metrics.messagesProcessed / uptime).toFixed(2)
            });
            
            // Stop WebSocket server
            await this.websocketBridge.stop();
            
            // Exit process
            process.exit(0);
        };
        
        // Handle various shutdown signals
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception:', error);
            shutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled rejection:', reason);
            shutdown('unhandledRejection');
        });
    }
    
    /**
     * Start the server
     */
    async start() {
        try {
            logger.info('🚀 Starting AE Claude Max Server v3.3.0');
            logger.info('📦 ES Module Migration: Complete');
            logger.info(`🔧 Configuration:`, {
                nodeVersion: process.version,
                platform: process.platform,
                environment: process.env.NODE_ENV || 'development'
            });
            
            // Start WebSocket server
            await this.websocketBridge.start();
            
            logger.info('✅ Server started successfully');
            logger.info('🎯 Performance Targets:');
            logger.info('   - WebSocket: 850 msg/sec (µWebSockets mode)');
            logger.info('   - NLP Processing: <10ms');
            logger.info('   - Script Generation: <5ms');
            
            // Start metrics reporting
            this.startMetricsReporting();
            
        } catch (error) {
            logger.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    
    /**
     * Start periodic metrics reporting
     */
    startMetricsReporting() {
        setInterval(() => {
            const uptime = (Date.now() - this.metrics.startTime) / 1000;
            const currentMetrics = this.websocketBridge.getMetrics();
            
            logger.info('📊 Performance Report:', {
                uptime: `${uptime.toFixed(0)}s`,
                wsImplementation: currentMetrics.implementation,
                msgPerSec: currentMetrics.messagesPerSecond.toFixed(2),
                avgLatency: `${currentMetrics.averageLatency.toFixed(2)}ms`,
                connections: currentMetrics.activeConnections,
                commandsProcessed: this.metrics.commandsExecuted,
                errorRate: `${((this.metrics.errors / Math.max(1, this.metrics.messagesProcessed)) * 100).toFixed(2)}%`
            });
            
            // Check if we're meeting performance targets
            if (currentMetrics.messagesPerSecond >= 850) {
                logger.info('🎯 µWebSockets performance target achieved!');
            }
        }, 30000); // Report every 30 seconds
    }
}

// Create and start server
const server = new AEClaudeMaxServer();

// Start the server
server.start().catch(error => {
    console.error('Fatal error starting server:', error);
    process.exit(1);
});

export default server;