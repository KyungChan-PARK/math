/**
 * Simple Math Orchestration Server
 * Coordinates between MediaPipe (5000), NLP (3000), and WebSocket (8085)
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = 8085;

app.use(cors());
app.use(express.json());

// Service registry
const services = {
    mediapipe: { url: 'http://localhost:5000', status: 'unknown', lastCheck: null },
    nlp: { url: 'http://localhost:3000', status: 'unknown', lastCheck: null },
    websocket: { port: 8085, status: 'starting', messageCount: 0 }
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Math Orchestration Server',
        port: PORT,
        services: services
    });
});

// Process unified request
app.post('/process', async (req, res) => {
    const { type, data } = req.body;
    
    try {
        let result = {};
        
        if (type === 'gesture') {
            // Route to MediaPipe
            result.service = 'mediapipe';
            result.processed = true;
        } else if (type === 'text') {
            // Route to NLP
            result.service = 'nlp';
            result.processed = true;
        }
        
        result.timestamp = Date.now();
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start HTTP server
const server = app.listen(PORT, () => {
    console.log('Math Orchestration Server running on port', PORT);
    console.log('Coordinating: MediaPipe (5000), NLP (3000)');
    services.websocket.status = 'running';
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            // Route message based on type
            if (data.type === 'gesture') {
                // Forward to MediaPipe service
                ws.send(JSON.stringify({ 
                    status: 'processing',
                    service: 'mediapipe'
                }));
            } else if (data.type === 'text') {
                // Forward to NLP service  
                ws.send(JSON.stringify({
                    status: 'processing',
                    service: 'nlp'
                }));
            }
            
        } catch (error) {
            ws.send(JSON.stringify({ error: error.message }));
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

// Service health monitoring
async function checkServices() {
    // Check MediaPipe
    try {
        const res = await fetch('http://localhost:5000/health');
        if (res.ok) {
            services.mediapipe.status = 'running';
        }
    } catch (e) {
        services.mediapipe.status = 'offline';
    }
    
    // Check NLP
    try {
        const res = await fetch('http://localhost:3000/health');
        if (res.ok) {
            services.nlp.status = 'running';
        }
    } catch (e) {
        services.nlp.status = 'offline';
    }
}

// Check services every 10 seconds
setInterval(checkServices, 10000);
checkServices(); // Initial check

export default app;