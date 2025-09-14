/**
 * Cluster-based WebSocket Orchestration Server
 * 고성능 멀티프로세스 WebSocket 처리 시스템
 * Target: 850+ msg/sec
 */

import cluster from 'cluster';
import { cpus } from 'os';
import net from 'net';
import crypto from 'crypto';
import { Worker } from 'worker_threads';

// Configuration
const CONFIG = {
    PORT: 8085,
    WORKER_COUNT: cpus().length, // 16 cores on this machine
    STICKY_SESSION: true,
    MESSAGE_PACK: true,
    COMPRESSION: false, // Disabled for 15% speed boost
    MAX_CONNECTIONS_PER_WORKER: 1000,
    HEARTBEAT_INTERVAL: 30000
};

// Metrics tracking
const metrics = {
    startTime: Date.now(),
    totalConnections: 0,
    totalMessages: 0,
    messagesPerSecond: 0,
    workerStats: new Map()
};

if (cluster.isPrimary) {
    console.log(` Master Process ${process.pid} starting...`);
    console.log(` CPU Cores: ${CONFIG.WORKER_COUNT}`);
    console.log(` Target: 850+ msg/sec\n`);
    
    // Create worker processes
    for (let i = 0; i < CONFIG.WORKER_COUNT; i++) {
        createWorker(i);
    }
    
    // Sticky session handler
    const server = net.createServer({ pauseOnConnect: true }, (connection) => {
        // Hash IP for sticky session
        const remoteAddress = connection.remoteAddress || '';
        const hash = crypto.createHash('md5').update(remoteAddress).digest();
        const workerIndex = hash.readUInt32BE(0) % CONFIG.WORKER_COUNT;
        
        const workers = Object.values(cluster.workers);
        const worker = workers[workerIndex];
        if (worker) {
            worker.send('sticky-session:connection', connection);
        }
    });
    
    server.listen(CONFIG.PORT, () => {
        console.log(`✅ Cluster listening on port ${CONFIG.PORT}`);
    });
    
    // Handle worker messages
    cluster.on('message', (worker, message) => {
        if (message.type === 'metrics') {
            updateMetrics(worker.id, message.data);
        }
    });
    
    // Handle worker exit
    cluster.on('exit', (worker, code, signal) => {
        console.log(`️  Worker ${worker.process.pid} died (${signal || code})`);
        createWorker(worker.id);
    });
    
    // Performance reporting
    setInterval(reportPerformance, 5000);
}
/**
 * Worker Process Logic
 */
else {
    // Import required modules for worker
    import('./worker-handler.js').then(({ WorkerHandler }) => {
        const handler = new WorkerHandler(CONFIG);
        handler.start();
    });
}

/**
 * Create a worker process
 */
function createWorker(id) {
    const worker = cluster.fork();
    
    metrics.workerStats.set(worker.id, {
        connections: 0,
        messages: 0,
        startTime: Date.now()
    });
    
    console.log(` Worker ${worker.process.pid} started`);
    return worker;
}

/**
 * Update metrics from worker
 */
function updateMetrics(workerId, data) {
    const stats = metrics.workerStats.get(workerId);
    if (stats) {
        stats.connections = data.connections;
        stats.messages = data.messages;
        
        // Calculate total
        metrics.totalConnections = 0;
        metrics.totalMessages = 0;
        
        for (const [, workerStat] of metrics.workerStats) {
            metrics.totalConnections += workerStat.connections;
            metrics.totalMessages += workerStat.messages;
        }
        
        // Calculate messages per second
        const elapsed = (Date.now() - metrics.startTime) / 1000;
        metrics.messagesPerSecond = Math.round(metrics.totalMessages / elapsed);
    }
}
/**
 * Report performance metrics
 */
function reportPerformance() {
    const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
    
    console.clear();
    console.log('━'.repeat(60));
    console.log(' WebSocket Cluster Performance Monitor');
    console.log('━'.repeat(60));
    console.log(`⏱️  Uptime: ${uptime}s`);
    console.log(` Total Connections: ${metrics.totalConnections}`);
    console.log(` Total Messages: ${metrics.totalMessages}`);
    console.log(` Messages/sec: ${metrics.messagesPerSecond}`);
    console.log(` Target: 850 msg/sec`);
    console.log(` Performance: ${Math.round((metrics.messagesPerSecond / 850) * 100)}%`);
    console.log('━'.repeat(60));
    
    // Worker stats
    console.log('\n Worker Statistics:');
    for (const [workerId, stats] of metrics.workerStats) {
        const worker = cluster.workers[workerId];
        if (worker) {
            console.log(`  Worker #${workerId} (PID: ${worker.process.pid})`);
            console.log(`    Connections: ${stats.connections}`);
            console.log(`    Messages: ${stats.messages}`);
        }
    }
    
    // Performance warnings
    if (metrics.messagesPerSecond < 400) {
        console.log('\n️  Performance below 50% of target!');
    } else if (metrics.messagesPerSecond >= 850) {
        console.log('\n✅ TARGET ACHIEVED! 850+ msg/sec!');
    }
}

export { CONFIG };