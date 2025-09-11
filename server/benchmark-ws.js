import WebSocket from 'ws';
import msgpack from 'msgpack-lite';

const ws = new WebSocket('ws://localhost:8087');
let sent = 0, received = 0;
const startTime = Date.now();

ws.on('open', () => {
    console.log(' Connected. Starting benchmark...\n');
    
    // Send 1000 messages
    const interval = setInterval(() => {
        if (sent < 1000) {
            const msg = msgpack.encode({
                type: 'nlp',
                text: `Test message ${sent}`,
                timestamp: Date.now()
            });
            ws.send(msg);
            sent++;
        } else {
            clearInterval(interval);
        }
    }, 1); // Send as fast as possible
});

ws.on('message', (data) => {
    received++;
    if (received % 100 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = received / elapsed;
        console.log(` Received ${received} | Rate: ${rate.toFixed(0)} msg/sec`);
    }
    
    if (received === 1000) {
        const totalTime = (Date.now() - startTime) / 1000;
        const avgRate = 1000 / totalTime;
        console.log(`\n✅ Benchmark Complete`);
        console.log(`⏱️ Time: ${totalTime.toFixed(2)}s`);
        console.log(` Speed: ${avgRate.toFixed(0)} msg/sec`);
        console.log(` Improvement: ${(avgRate/100).toFixed(1)}x over baseline`);
        process.exit(0);
    }
});

ws.on('error', console.error);