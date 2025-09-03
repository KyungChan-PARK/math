/**
 * After Effects Bridge - ExtendScript Execution Interface
 * 
 * Platform Migration Status:
 * - CEP Compatible: Yes (through abstraction layer)
 * - UXP Ready: Yes (uses platform-agnostic patterns)
 * - Windows ML: Not required for this module
 * - Performance: Prepared for µWebSockets integration
 * 
 * This module provides the bridge between the WebSocket server and After Effects,
 * handling ExtendScript execution and state synchronization.
 */

import net from 'net';
import { EventEmitter } from 'events';
import path from 'path';
import { promises as fs } from 'fs';

class AEBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 9000,
            host: config.host || 'localhost',
            reconnectInterval: config.reconnectInterval || 5000,
            maxReconnectAttempts: config.maxReconnectAttempts || 10,
            timeout: config.timeout || 30000,
            ...config
        };
        
        this.connected = false;
        this.reconnectAttempts = 0;
        this.commandQueue = [];
        this.pendingCommands = new Map();
        this.commandId = 0;
        
        // Initialize connection
        this.connect();
    }
    
    /**
     * Connect to After Effects CEP Extension
     */
    connect() {
        console.log(`[AE Bridge] Attempting to connect to After Effects at ${this.config.host}:${this.config.port}`);
        
        this.socket = new net.Socket();
        
        // Set up connection timeout
        this.socket.setTimeout(this.config.timeout);
        
        // Connection event handlers
        this.socket.on('connect', () => {
            console.log('[AE Bridge] Connected to After Effects');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');
            
            // Process any queued commands
            this.processQueue();
        });
        
        this.socket.on('data', (data) => {
            this.handleResponse(data.toString());
        });
        
        this.socket.on('close', () => {
            console.log('[AE Bridge] Connection to After Effects closed');
            this.connected = false;
            this.emit('disconnected');
            this.attemptReconnect();
        });
        
        this.socket.on('error', (error) => {
            console.error('[AE Bridge] Connection error:', error.message);
            this.connected = false;
            
            // For development/testing without After Effects
            if (error.code === 'ECONNREFUSED') {
                console.log('[AE Bridge] After Effects not available - entering mock mode');
                this.enterMockMode();
            }
        });
        
        this.socket.on('timeout', () => {
            console.error('[AE Bridge] Connection timeout');
            this.socket.destroy();
        });
        
        // Attempt connection
        this.socket.connect(this.config.port, this.config.host);
    }
    
    /**
     * Attempt to reconnect to After Effects
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.error('[AE Bridge] Max reconnection attempts reached');
            this.emit('connection_failed');
            this.enterMockMode();
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`[AE Bridge] Reconnecting... (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, this.config.reconnectInterval);
    }
    
    /**
     * Enter mock mode for development/testing without After Effects
     */
    enterMockMode() {
        console.log('[AE Bridge] Entering mock mode for development');
        this.mockMode = true;
        this.connected = true; // Simulate connection
        this.emit('mock_mode');
        
        // Process queued commands with mock responses
        this.processQueue();
    }
    
    /**
     * Execute ExtendScript in After Effects
     * @param {string} script - The ExtendScript to execute
     * @returns {Promise<any>} - The result of the script execution
     */
    async execute(script) {
        return new Promise((resolve, reject) => {
            const commandId = this.generateCommandId();
            
            const command = {
                id: commandId,
                script: script,
                timestamp: Date.now(),
                resolve: resolve,
                reject: reject
            };
            
            // Add to queue
            this.commandQueue.push(command);
            
            // Process immediately if connected
            if (this.connected) {
                this.processQueue();
            }
            
            // Set timeout for command
            setTimeout(() => {
                if (this.pendingCommands.has(commandId)) {
                    this.pendingCommands.delete(commandId);
                    reject(new Error('Script execution timeout'));
                }
            }, this.config.timeout);
        });
    }
    
    /**
     * Process queued commands
     */
    processQueue() {
        while (this.commandQueue.length > 0 && this.connected) {
            const command = this.commandQueue.shift();
            
            if (this.mockMode) {
                this.executeMockCommand(command);
            } else {
                this.sendCommand(command);
            }
        }
    }
    
    /**
     * Send command to After Effects
     */
    sendCommand(command) {
        const message = JSON.stringify({
            id: command.id,
            type: 'EXECUTE_SCRIPT',
            script: command.script,
            timestamp: command.timestamp
        });
        
        // Store pending command
        this.pendingCommands.set(command.id, command);
        
        // Send to After Effects
        this.socket.write(message + '\n');
        
        console.log(`[AE Bridge] Sent command ${command.id}`);
    }
    
    /**
     * Execute command in mock mode
     */
    executeMockCommand(command) {
        console.log(`[AE Bridge] Mock execution of command ${command.id}`);
        
        // Simulate async execution
        setTimeout(() => {
            const mockResult = this.generateMockResult(command.script);
            command.resolve(mockResult);
        }, 50);
    }
    
    /**
     * Generate mock result based on script content
     */
    generateMockResult(script) {
        // Analyze script to generate appropriate mock response
        if (script.includes('CREATE_SHAPE')) {
            return JSON.stringify({
                success: true,
                layerIndex: Math.floor(Math.random() * 100),
                layerName: 'Mock Shape Layer',
                message: 'Shape created successfully (mock)'
            });
        } else if (script.includes('app.project.activeItem')) {
            return JSON.stringify({
                composition: {
                    name: 'Mock Composition',
                    width: 1920,
                    height: 1080,
                    duration: 10,
                    frameRate: 30
                },
                layers: [],
                platform: 'MOCK'
            });
        } else {
            return JSON.stringify({
                success: true,
                message: 'Mock execution completed'
            });
        }
    }
    
    /**
     * Handle response from After Effects
     */
    handleResponse(data) {
        try {
            // Parse response (may contain multiple messages)
            const messages = data.trim().split('\n');
            
            for (const message of messages) {
                if (!message) continue;
                
                const response = JSON.parse(message);
                const command = this.pendingCommands.get(response.id);
                
                if (command) {
                    this.pendingCommands.delete(response.id);
                    
                    if (response.success) {
                        command.resolve(response.result);
                    } else {
                        command.reject(new Error(response.error || 'Script execution failed'));
                    }
                    
                    console.log(`[AE Bridge] Processed response for command ${response.id}`);
                }
            }
        } catch (error) {
            console.error('[AE Bridge] Error parsing response:', error);
        }
    }
    
    /**
     * Get current After Effects state
     */
    async getState() {
        const stateScript = `
        (function() {
            try {
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    return JSON.stringify({ 
                        error: "No active composition",
                        hasComposition: false 
                    });
                }
                
                var state = {
                    hasComposition: true,
                    composition: {
                        name: comp.name,
                        width: comp.width,
                        height: comp.height,
                        duration: comp.duration,
                        frameRate: comp.frameRate,
                        time: comp.time,
                        numLayers: comp.numLayers
                    },
                    layers: []
                };
                
                // Get layer information
                for (var i = 1; i <= Math.min(comp.numLayers, 10); i++) {
                    var layer = comp.layer(i);
                    state.layers.push({
                        index: i,
                        name: layer.name,
                        selected: layer.selected,
                        enabled: layer.enabled,
                        startTime: layer.startTime,
                        inPoint: layer.inPoint,
                        outPoint: layer.outPoint
                    });
                }
                
                return JSON.stringify(state);
            } catch (error) {
                return JSON.stringify({ 
                    error: error.toString(),
                    hasComposition: false 
                });
            }
        })();
        `;
        
        try {
            const result = await this.execute(stateScript);
            return JSON.parse(result);
        } catch (error) {
            console.error('[AE Bridge] Error getting state:', error);
            return { error: error.message, hasComposition: false };
        }
    }
    
    /**
     * Generate unique command ID
     */
    generateCommandId() {
        return `cmd_${Date.now()}_${++this.commandId}`;
    }
    
    /**
     * Disconnect from After Effects
     */
    disconnect() {
        if (this.socket) {
            this.socket.destroy();
            this.connected = false;
        }
    }
    
    /**
     * Check if connected to After Effects
     */
    isConnected() {
        return this.connected;
    }
    
    /**
     * Check if in mock mode
     */
    isMockMode() {
        return this.mockMode || false;
    }
}

export default AEBridge;
