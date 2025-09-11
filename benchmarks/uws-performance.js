/**
 * µWebSockets Performance Benchmark
 * Target: 850 msg/sec throughput
 */

import WebSocket from 'ws';

const NUM_CLIENTS = 50;
const MESSAGES_PER_CLIENT = 100;
const MESSAGE_INTERVAL = 10; // ms

let totalMessages = 0;
let startTime;
let endTime;

async function createClient(clientId) {
    return new Promise((resolve) => {
        const ws = new WebSocket('ws://localhost:8080/realtime');
        let messagesSent = 0;
        
        ws.on('open', () => {
            startTime = startTime || Date.now();
            
            const interval = setInterval(() => {
                if (messagesSent >= MESSAGES_PER_CLIENT) {
                    clearInterval(interval);
                    ws.close();
                    resolve();
                    return;
                }
                
                ws.send(JSON.stringify({
                    type: 'NATURAL_LANGUAGE',
                    payload: {
                        text: `Test message ${clientId}-${messagesSent}`
                    }
                }));
                
                messagesSent++;
                totalMessages++;
            }, MESSAGE_INTERVAL);
        });
        
        ws.on('error', console.error);
    });
}

async function runBenchmark() {
    console.log(' µWebSocket Performance Benchmark');
    console.log(` Testing with ${NUM_CLIENTS} clients, ${MESSAGES_PER_CLIENT} messages each`);
    console.log(' Target: 850 msg/sec\n');
    
    const clients = [];
    for (let i = 0; i < NUM_CLIENTS; i++) {
        clients.push(createClient(i));
    }
    
    await Promise.all(clients);
    endTime = Date.now();
    
    const duration = (endTime - startTime) / 1000;
    const throughput = totalMessages / duration;
    
    console.log('\n Results:');
    console.log(`Total messages: ${totalMessages}`);
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`Throughput: ${throughput.toFixed(1)} msg/sec`);
    
    if (throughput >= 850) {
        console.log('✅ PASSED: Target achieved!');
    } else {
        console.log(`️ Current: ${((throughput / 850) * 100).toFixed(1)}% of target`);
    }
}

runBenchmark().catch(console.error);
