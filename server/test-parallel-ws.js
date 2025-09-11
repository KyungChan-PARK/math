import ParallelWSAdapter from './parallel-ws-adapter.js';

const server = new ParallelWSAdapter({
    port: 8087,
    host: '0.0.0.0',
    workerPoolSize: 4
});

server.start().then(() => {
    console.log(' 4x WebSocket ready on port 8087');
});