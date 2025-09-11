import { App } from 'uWebSockets.js';
import { NLPEngine } from './nlp-engine.js';
import { ScriptGenerator } from './script-generator.js';
import { AEBridge } from './ae-bridge.js';

class UltraWebSocketServer {
    constructor(port = 8080) {
        this.port = port;
        this.connections = new Map();
        this.nlpEngine = new NLPEngine();
        this.scriptGenerator = new ScriptGenerator();
        this.aeBridge = new AEBridge();
        this.metrics = {
            messages: 0,
            errors: 0,
            latency: []
        };
        
        this.initializeServer();
    }
    
    initializeServer() {
        this.app = App();
        
        this.app.ws('/realtime', {
            compression: 0,
            maxPayloadLength: 100 * 1024,
            
            open: (ws) => {
                const clientId = this.generateClientId();
                ws.clientId = clientId;
                
                this.connections.set(clientId, {
                    socket: ws,
                    connected: Date.now()
                });
                
                console.log(`✅ Client connected: ${clientId}`);
            },            message: (ws, message) => {
                this.handleMessage(ws, Buffer.from(message));
            },
            
            close: (ws) => {
                this.connections.delete(ws.clientId);
                console.log(`❌ Disconnected: ${ws.clientId}`);
            }
        });
        
        this.app.listen(this.port, (token) => {
            if (token) {
                console.log(` µWebSocket server running on port ${this.port}`);
                console.log(` Target: 850 msg/sec`);
            }
        });
    }
    
    async handleMessage(ws, buffer) {
        const startTime = Date.now();
        try {
            const message = JSON.parse(buffer.toString());
            
            if (message.type === 'NATURAL_LANGUAGE') {
                const parsed = await this.nlpEngine.parse(message.payload.text);
                const script = this.scriptGenerator.generate(parsed);
                const result = await this.aeBridge.execute(script);
                
                ws.send(JSON.stringify({
                    type: 'NL_RESULT',
                    success: result.success,
                    message: result.message,
                    latency: Date.now() - startTime
                }));
            }
            
            this.metrics.messages++;
            this.metrics.latency.push(Date.now() - startTime);
        } catch (error) {
            ws.send(JSON.stringify({ type: 'ERROR', message: error.message }));
            this.metrics.errors++;
        }
    }
    
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Start server
const server = new UltraWebSocketServer(8080);
export default UltraWebSocketServer;