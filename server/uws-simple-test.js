// Simple µWebSockets test server for debugging
import uWS from 'uWebSockets.js';

const port = 8085;
let messageCount = 0;
let startTime = Date.now();

const app = uWS.App();

app.ws('/*', {
    compression: 0, // Disable for max speed
    maxPayloadLength: 100 * 1024,
    
    open: (ws) => {
        console.log('Client connected');
        ws.send(JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() }));
    },
    
    message: (ws, message, isBinary) => {
        messageCount++;
        
        // Echo back for benchmark
        const data = Buffer.from(message).toString();
        ws.send(data);
        
        // Stats every 100 messages
        if (messageCount % 100 === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const throughput = Math.round(messageCount / elapsed);
            console.log(` Throughput: ${throughput} msg/sec`);
        }
    },
    
    close: (ws) => {
        console.log('Client disconnected');
    }
});

// Health check
app.get('/health', (res) => {
    res.writeHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
        status: 'ok',
        messages: messageCount,
        uptime: Math.round((Date.now() - startTime) / 1000)
    }));
});

app.listen(port, (token) => {
    if (token) {
        console.log(`✅ µWebSockets test server on port ${port}`);
        console.log('WebSocket path: ws://localhost:8085/');
        
        // Reset stats every 10 seconds
        setInterval(() => {
            if (messageCount > 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const throughput = Math.round(messageCount / elapsed);
                console.log(` Overall: ${throughput} msg/sec (${messageCount} total)`);
            }
        }, 10000);
    } else {
        console.error(`Failed to start on port ${port}`);
    }
});