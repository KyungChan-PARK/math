// Worker Thread Pool for 4x WebSocket Performance
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class WorkerPool {
    constructor(workerScript, poolSize = 4) {
        this.workers = [];
        this.queue = [];
        this.workerScript = workerScript;
        this.poolSize = poolSize;
        this.roundRobin = 0;
    }

    async initialize() {
        for (let i = 0; i < this.poolSize; i++) {
            const worker = new Worker(this.workerScript);
            worker.on('message', (result) => {
                if (this.queue.length > 0) {
                    const { data, resolve } = this.queue.shift();
                    worker.postMessage(data);
                    resolve(result);
                }
            });
            this.workers.push(worker);
        }
        console.log(` Worker pool initialized with ${this.poolSize} threads`);
    }

    async process(data) {
        return new Promise((resolve) => {
            const worker = this.workers[this.roundRobin % this.poolSize];
            this.roundRobin++;
            
            if (this.queue.length < 100) {
                worker.postMessage(data);
                worker.once('message', resolve);
            } else {
                this.queue.push({ data, resolve });
            }
        });
    }

    terminate() {
        this.workers.forEach(w => w.terminate());
    }
}

export default WorkerPool;