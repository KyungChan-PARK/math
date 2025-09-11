import OptimizedWSAdapter from './optimized-ws-adapter.js';
// Simplified test without NLP dependencies

const adapter = new OptimizedWSAdapter({
    port: 8086,
    host: '0.0.0.0'
});

// Override message handler
adapter.onMessage = async (connectionId, message) => {
    console.log(` Received: ${message.type}`);
    
    if (message.type === 'nlp') {
        // Mock processing
        adapter.send(connectionId, {
            type: 'script',
            code: 'comp.layer("Text").transform.position.wiggle(2,50);',
            timestamp: Date.now()
        });
    }
};

// Performance monitor
setInterval(() => {
    const metrics = adapter.getMetrics();
    console.log(` ${metrics.messagesPerSecond.toFixed(0)} msg/sec (${metrics.targetProgress.toFixed(1)}% of goal)`);
}, 5000);

adapter.start().then(() => {
    console.log(' 4x Optimized WebSocket Server Running');
});