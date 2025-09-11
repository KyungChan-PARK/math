/**
 * Gesture Service for AE Claude Max
 * µWebSocket-powered gesture recognition server
 */

import { App } from 'uWebSockets.js';

class GestureService {
    constructor() {
        this.app = App();
        this.clients = new Map();
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.app.ws('/gesture', {
            compression: 0, // Disabled for lowest latency
            maxPayloadLength: 64 * 1024,
            
            open: (ws) => {
                const id = this.generateId();
                ws.id = id;
                this.clients.set(id, ws);
                console.log(`Gesture client connected: ${id}`);
            },
            
            message: (ws, message, isBinary) => {
                const data = JSON.parse(Buffer.from(message).toString());
                this.handleGestureMessage(ws, data);
            },
            
            close: (ws) => {
                this.clients.delete(ws.id);
                console.log(`Gesture client disconnected: ${ws.id}`);
            }
        });
    }
    
    handleGestureMessage(ws, data) {
        if (data.type === 'gesture') {
            // Process gesture and translate to AE command
            const result = this.processGesture(data);
            
            // Send back to gesture app
            ws.send(JSON.stringify({
                type: 'gesture_feedback',
                ...result
            }));
            
            // Forward to CEP extension
            this.forwardToCEP(result);
        }
    }
    
    processGesture(data) {
        return {
            gesture: data.recognition?.name || 'unknown',
            confidence: data.recognition?.confidence || 0,
            naturalLanguage: this.translateToNL(data),
            command: this.generateAECommand(data),
            timestamp: Date.now()
        };
    }
    
    translateToNL(data) {
        const templates = {
            circle: 'Create a circle',
            rectangle: 'Draw a rectangle',
            bezier: 'Create a curved path',
            delete: 'Delete selected layer',
            duplicate: 'Duplicate the layer'
        };
        
        return templates[data.recognition?.name] || 'Unknown gesture';
    }
    
    generateAECommand(data) {
        const commands = {
            circle: 'comp.layers.addShape();',
            rectangle: 'comp.layers.addShape();',
            bezier: 'comp.layers.addShape();'
        };
        
        return commands[data.recognition?.name] || '';
    }
    
    forwardToCEP(result) {
        // Forward to CEP clients
        this.clients.forEach(client => {
            if (client.type === 'cep') {
                client.send(JSON.stringify({
                    type: 'gesture_command',
                    ...result
                }));
            }
        });
    }
    
    generateId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    listen(port = 8081) {
        this.app.listen(port, (token) => {
            if (token) {
                console.log(`Gesture service running on port ${port}`);
            } else {
                console.error('Failed to start gesture service');
            }
        });
    }
}

// Export for integration
export { GestureService };