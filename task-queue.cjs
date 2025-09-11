const EventEmitter = require('events');

class TaskQueue extends EventEmitter {
    constructor(config = {}) {
        super();
        this.maxConcurrent = config.maxConcurrent || 10;
        this.maxRetries = config.maxRetries || 3;
        this.retryDelay = config.retryDelay || 1000;
        
        this.queues = {
            high: [],
            normal: [],
            low: []
        };
        
        this.activeTasks = new Map();
        this.completedTasks = [];
        this.failedTasks = [];
        this.taskHandlers = new Map();
        this.workers = new Map();
        
        this.isProcessing = false;
        this.statistics = {
            totalQueued: 0,
            totalProcessed: 0,
            totalFailed: 0,
            averageProcessingTime: 0,
            processingTimes: []
        };
    }

    addTask(task, priority = 'normal') {
        const taskEntry = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            task: task,
            priority: priority,
            status: 'queued',
            attempts: 0,
            queuedAt: Date.now(),
            startedAt: null,
            completedAt: null,
            result: null,
            error: null,
            assignedTo: null
        };
        
        this.queues[priority].push(taskEntry);
        this.statistics.totalQueued++;
        this.emit('task-queued', taskEntry);
        
        if (!this.isProcessing) {
            this.startProcessing();
        }
        
        return taskEntry.id;
    }

    async startProcessing() {
        this.isProcessing = true;
        
        while (this.hasQueuedTasks() || this.activeTasks.size > 0) {
            while (this.activeTasks.size < this.maxConcurrent && this.hasQueuedTasks()) {
                const task = this.getNextTask();
                if (task) {
                    this.processTask(task);
                }
            }
            
            await this.delay(100);
        }
        
        this.isProcessing = false;
    }

    hasQueuedTasks() {
        return this.queues.high.length > 0 || 
               this.queues.normal.length > 0 || 
               this.queues.low.length > 0;
    }

    getNextTask() {
        if (this.queues.high.length > 0) return this.queues.high.shift();
        if (this.queues.normal.length > 0) return this.queues.normal.shift();
        if (this.queues.low.length > 0) return this.queues.low.shift();
        return null;
    }

    async processTask(taskEntry) {
        taskEntry.status = 'processing';
        taskEntry.startedAt = Date.now();
        taskEntry.attempts++;
        
        const worker = this.assignWorker(taskEntry);
        taskEntry.assignedTo = worker.id;
        
        this.activeTasks.set(taskEntry.id, taskEntry);
        this.emit('task-started', taskEntry);
        
        try {
            const handler = this.taskHandlers.get(taskEntry.task.type) || this.defaultHandler;
            const result = await handler(taskEntry.task, worker);
            
            taskEntry.status = 'completed';
            taskEntry.completedAt = Date.now();
            taskEntry.result = result;
            
            const processingTime = taskEntry.completedAt - taskEntry.startedAt;
            this.updateStatistics(processingTime);
            
            this.completedTasks.push(taskEntry);
            this.activeTasks.delete(taskEntry.id);
            this.releaseWorker(worker);
            
            this.emit('task-completed', taskEntry);
            
        } catch (error) {
            taskEntry.error = error.message;
            
            if (taskEntry.attempts < this.maxRetries) {
                taskEntry.status = 'retry';
                this.activeTasks.delete(taskEntry.id);
                this.releaseWorker(worker);
                
                await this.delay(this.retryDelay * taskEntry.attempts);
                this.queues[taskEntry.priority].unshift(taskEntry);
                
                this.emit('task-retry', taskEntry);
                
            } else {
                taskEntry.status = 'failed';
                taskEntry.completedAt = Date.now();
                
                this.failedTasks.push(taskEntry);
                this.activeTasks.delete(taskEntry.id);
                this.releaseWorker(worker);
                this.statistics.totalFailed++;
                
                this.emit('task-failed', taskEntry);
            }
        }
    }

    assignWorker(task) {
        const availableWorkers = Array.from(this.workers.values())
            .filter(w => w.status === 'idle' && w.capabilities.includes(task.task.type));
        
        if (availableWorkers.length > 0) {
            const worker = availableWorkers[0];
            worker.status = 'busy';
            worker.currentTask = task.id;
            return worker;
        }
        
        // Create virtual worker if none available
        const virtualWorker = {
            id: `worker-${Date.now()}`,
            status: 'busy',
            capabilities: ['*'],
            currentTask: task.id,
            virtual: true
        };
        
        this.workers.set(virtualWorker.id, virtualWorker);
        return virtualWorker;
    }

    releaseWorker(worker) {
        if (worker.virtual) {
            this.workers.delete(worker.id);
        } else {
            worker.status = 'idle';
            worker.currentTask = null;
        }
    }

    registerWorker(workerId, capabilities = ['*']) {
        const worker = {
            id: workerId,
            status: 'idle',
            capabilities: capabilities,
            currentTask: null,
            tasksCompleted: 0,
            virtual: false
        };
        
        this.workers.set(workerId, worker);
        return worker;
    }

    registerHandler(taskType, handler) {
        this.taskHandlers.set(taskType, handler);
    }

    defaultHandler = async (task) => {
        // Simulate processing
        await this.delay(Math.random() * 1000 + 500);
        return { processed: true, taskId: task.id };
    }

    updateStatistics(processingTime) {
        this.statistics.totalProcessed++;
        this.statistics.processingTimes.push(processingTime);
        
        if (this.statistics.processingTimes.length > 100) {
            this.statistics.processingTimes.shift();
        }
        
        const sum = this.statistics.processingTimes.reduce((a, b) => a + b, 0);
        this.statistics.averageProcessingTime = sum / this.statistics.processingTimes.length;
    }

    getStatistics() {
        return {
            ...this.statistics,
            queued: {
                high: this.queues.high.length,
                normal: this.queues.normal.length,
                low: this.queues.low.length
            },
            active: this.activeTasks.size,
            completed: this.completedTasks.length,
            failed: this.failedTasks.length,
            workers: {
                total: this.workers.size,
                busy: Array.from(this.workers.values()).filter(w => w.status === 'busy').length,
                idle: Array.from(this.workers.values()).filter(w => w.status === 'idle').length
            }
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clear() {
        this.queues.high = [];
        this.queues.normal = [];
        this.queues.low = [];
        this.activeTasks.clear();
        this.completedTasks = [];
        this.failedTasks = [];
    }
}

module.exports = TaskQueue;