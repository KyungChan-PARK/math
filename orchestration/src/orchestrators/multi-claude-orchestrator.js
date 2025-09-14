/**
 * Multi-Claude Service Integration
 * Orchestrates multiple Claude instances for different specialized tasks
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
require('dotenv').config();

class MultiClaudeOrchestrator extends EventEmitter {
    constructor() {
        super();
        
        // Claude service endpoints configuration
        this.services = {
            gesture: {
                name: 'Gesture Recognition Claude',
                endpoint: process.env.CLAUDE_GESTURE_ENDPOINT || 'wss://claude-gesture.example.com',
                apiKey: process.env.CLAUDE_GESTURE_API_KEY,
                specialization: 'gesture_recognition',
                status: 'disconnected',
                connection: null,
                queue: []
            },
            math: {
                name: 'Math Problem Solving Claude',
                endpoint: process.env.CLAUDE_MATH_ENDPOINT || 'wss://claude-math.example.com',
                apiKey: process.env.CLAUDE_MATH_API_KEY,
                specialization: 'mathematical_reasoning',
                status: 'disconnected',
                connection: null,
                queue: []
            },
            visual: {
                name: 'Visual Processing Claude',
                endpoint: process.env.CLAUDE_VISUAL_ENDPOINT || 'wss://claude-visual.example.com',
                apiKey: process.env.CLAUDE_VISUAL_API_KEY,
                specialization: 'visual_analysis',
                status: 'disconnected',
                connection: null,
                queue: []
            },
            nlp: {
                name: 'Natural Language Claude',
                endpoint: process.env.CLAUDE_NLP_ENDPOINT || 'wss://claude-nlp.example.com',
                apiKey: process.env.CLAUDE_NLP_API_KEY,
                specialization: 'natural_language',
                status: 'disconnected',
                connection: null,
                queue: []
            }
        };
        
        // Task routing configuration
        this.routingRules = {
            gesture_recognition: ['gesture', 'visual'],
            math_problem: ['math', 'nlp'],
            visual_analysis: ['visual', 'gesture'],
            natural_language: ['nlp', 'math'],
            complex_task: ['gesture', 'math', 'visual', 'nlp'] // Use all services
        };
        
        // Performance metrics
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            serviceMetrics: {}
        };
        
        // Initialize service metrics
        Object.keys(this.services).forEach(service => {
            this.metrics.serviceMetrics[service] = {
                requests: 0,
                successes: 0,
                failures: 0,
                averageResponseTime: 0,
                responseTimes: []
            };
        });
        
        this.pendingTasks = new Map();
        this.taskIdCounter = 0;
        
        // Error handling configuration
        this.maxRetries = 3;
        this.retryDelay = 1000; // ms
        
        this.initialize();
    }
    
    async initialize() {
        console.log('Initializing Multi-Claude Orchestrator...');
        
        // Connect to all Claude services
        for (const [key, service] of Object.entries(this.services)) {
            await this.connectToService(key, service);
        }
        
        // Start health monitoring
        this.startHealthMonitoring();
        
        console.log('Multi-Claude Orchestrator initialized');
    }
    
    async connectToService(serviceKey, service) {
        try {
            // For development, simulate connections
            if (process.env.NODE_ENV === 'development') {
                service.status = 'simulated';
                console.log(`[DEV] Simulated connection to ${service.name}`);
                return;
            }
            
            // Create WebSocket connection
            service.connection = new WebSocket(service.endpoint, {
                headers: {
                    'Authorization': `Bearer ${service.apiKey}`,
                    'X-Service-Type': service.specialization
                }
            });
            
            // Handle connection events
            service.connection.on('open', () => {
                service.status = 'connected';
                console.log(`Connected to ${service.name}`);
                this.emit('service_connected', serviceKey);
                
                // Process queued tasks
                this.processQueuedTasks(serviceKey);
            });
            
            service.connection.on('message', (data) => {
                this.handleServiceMessage(serviceKey, data);
            });
            
            service.connection.on('error', (error) => {
                console.error(`Error in ${service.name}:`, error.message);
                service.status = 'error';
                this.emit('service_error', { service: serviceKey, error });
            });
            
            service.connection.on('close', () => {
                service.status = 'disconnected';
                console.log(`Disconnected from ${service.name}`);
                this.emit('service_disconnected', serviceKey);
                
                // Attempt reconnection
                setTimeout(() => this.connectToService(serviceKey, service), 5000);
            });
            
        } catch (error) {
            console.error(`Failed to connect to ${service.name}:`, error);
            service.status = 'error';
        }
    }
    
    async processTask(taskType, data, options = {}) {
        const taskId = `task_${++this.taskIdCounter}_${Date.now()}`;
        const startTime = Date.now();
        
        // Create task object
        const task = {
            id: taskId,
            type: taskType,
            data,
            options,
            status: 'pending',
            createdAt: startTime,
            services: [],
            results: {},
            errors: []
        };
        
        this.pendingTasks.set(taskId, task);
        this.metrics.totalRequests++;
        
        try {
            // Determine which services to use
            const services = this.routingRules[taskType] || ['nlp'];
            task.services = services;
            
            // Process with each service
            const results = await this.processWithServices(task, services);
            
            // Combine results
            const combinedResult = this.combineResults(results, taskType);
            
            // Update metrics
            const responseTime = Date.now() - startTime;
            this.updateMetrics('success', responseTime);
            
            task.status = 'completed';
            task.result = combinedResult;
            task.completedAt = Date.now();
            
            this.emit('task_completed', task);
            
            return {
                taskId,
                result: combinedResult,
                processingTime: responseTime,
                servicesUsed: services
            };
            
        } catch (error) {
            console.error(`Task ${taskId} failed:`, error);
            
            task.status = 'failed';
            task.error = error.message;
            
            this.metrics.failedRequests++;
            this.emit('task_failed', task);
            
            throw error;
            
        } finally {
            // Clean up after delay
            setTimeout(() => this.pendingTasks.delete(taskId), 60000);
        }
    }
    
    async processWithServices(task, services) {
        const results = {};
        const promises = [];
        
        for (const serviceKey of services) {
            const service = this.services[serviceKey];
            
            if (service.status === 'connected' || service.status === 'simulated') {
                promises.push(
                    this.sendToService(serviceKey, task)
                        .then(result => {
                            results[serviceKey] = result;
                        })
                        .catch(error => {
                            console.error(`Service ${serviceKey} error:`, error);
                            task.errors.push({ service: serviceKey, error: error.message });
                        })
                );
            } else {
                // Queue for later processing
                service.queue.push(task);
                console.log(`Queued task ${task.id} for ${serviceKey}`);
            }
        }
        
        // Wait for all services to respond
        await Promise.allSettled(promises);
        
        return results;
    }
    
    async sendToService(serviceKey, task) {
        const service = this.services[serviceKey];
        const startTime = Date.now();
        
        // For development/simulation mode
        if (service.status === 'simulated') {
            return this.simulateServiceResponse(serviceKey, task);
        }
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Service ${serviceKey} timeout`));
            }, 30000); // 30 second timeout
            
            // Create request
            const request = {
                id: task.id,
                type: 'process',
                data: task.data,
                timestamp: Date.now()
            };
            
            // Store callback
            const callback = (response) => {
                clearTimeout(timeout);
                
                // Update service metrics
                const responseTime = Date.now() - startTime;
                this.updateServiceMetrics(serviceKey, 'success', responseTime);
                
                resolve(response);
            };
            
            // Register callback
            this.once(`response_${serviceKey}_${task.id}`, callback);
            
            // Send to service
            service.connection.send(JSON.stringify(request));
        });
    }
    
    simulateServiceResponse(serviceKey, task) {
        // Simulate processing delay
        return new Promise(resolve => {
            setTimeout(() => {
                const response = {
                    service: serviceKey,
                    taskId: task.id,
                    result: this.generateSimulatedResult(serviceKey, task),
                    confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
                    processingTime: Math.random() * 100 + 50 // 50-150ms
                };
                
                resolve(response);
            }, Math.random() * 500 + 100); // 100-600ms delay
        });
    }
    
    generateSimulatedResult(serviceKey, task) {
        const simulatedResults = {
            gesture: {
                gesture: 'pinch',
                confidence: 0.92,
                parameters: { distance: 0.05 }
            },
            math: {
                solution: '42',
                steps: ['Step 1', 'Step 2', 'Step 3'],
                confidence: 0.88
            },
            visual: {
                objects: ['hand', 'screen'],
                positions: [{ x: 100, y: 200 }],
                confidence: 0.85
            },
            nlp: {
                intent: 'create_circle',
                entities: { shape: 'circle', size: 'medium' },
                confidence: 0.90
            }
        };
        
        return simulatedResults[serviceKey] || { result: 'processed' };
    }
    
    combineResults(results, taskType) {
        // Combine results from multiple services
        const combined = {
            taskType,
            timestamp: Date.now(),
            services: {},
            consensus: null,
            confidence: 0
        };
        
        // Store individual service results
        Object.entries(results).forEach(([service, result]) => {
            combined.services[service] = result;
        });
        
        // Calculate consensus based on task type
        if (taskType === 'gesture_recognition') {
            combined.consensus = this.calculateGestureConsensus(results);
        } else if (taskType === 'math_problem') {
            combined.consensus = this.calculateMathConsensus(results);
        } else {
            // Generic consensus - pick highest confidence
            let maxConfidence = 0;
            Object.values(results).forEach(result => {
                if (result.confidence > maxConfidence) {
                    maxConfidence = result.confidence;
                    combined.consensus = result.result;
                }
            });
            combined.confidence = maxConfidence;
        }
        
        return combined;
    }
    
    calculateGestureConsensus(results) {
        // Combine gesture recognition results
        const gestures = {};
        let totalConfidence = 0;
        let count = 0;
        
        Object.values(results).forEach(result => {
            if (result.result && result.result.gesture) {
                const gesture = result.result.gesture;
                gestures[gesture] = (gestures[gesture] || 0) + result.confidence;
                totalConfidence += result.confidence;
                count++;
            }
        });
        
        // Find most confident gesture
        let bestGesture = null;
        let bestScore = 0;
        
        Object.entries(gestures).forEach(([gesture, score]) => {
            if (score > bestScore) {
                bestScore = score;
                bestGesture = gesture;
            }
        });
        
        return {
            gesture: bestGesture,
            confidence: count > 0 ? totalConfidence / count : 0
        };
    }
    
    calculateMathConsensus(results) {
        // Combine math problem solving results
        const solutions = {};
        
        Object.values(results).forEach(result => {
            if (result.result && result.result.solution) {
                const solution = result.result.solution;
                solutions[solution] = (solutions[solution] || 0) + 1;
            }
        });
        
        // Find most common solution
        let bestSolution = null;
        let maxCount = 0;
        
        Object.entries(solutions).forEach(([solution, count]) => {
            if (count > maxCount) {
                maxCount = count;
                bestSolution = solution;
            }
        });
        
        return {
            solution: bestSolution,
            agreement: maxCount / Object.keys(results).length
        };
    }
    
    handleServiceMessage(serviceKey, data) {
        try {
            const message = JSON.parse(data);
            
            if (message.type === 'response' && message.taskId) {
                this.emit(`response_${serviceKey}_${message.taskId}`, message);
            } else {
                this.emit('service_message', { service: serviceKey, message });
            }
        } catch (error) {
            console.error(`Error parsing message from ${serviceKey}:`, error);
        }
    }
    
    processQueuedTasks(serviceKey) {
        const service = this.services[serviceKey];
        const queue = service.queue;
        
        while (queue.length > 0) {
            const task = queue.shift();
            this.sendToService(serviceKey, task);
        }
    }
    
    updateMetrics(status, responseTime) {
        if (status === 'success') {
            this.metrics.successfulRequests++;
        } else {
            this.metrics.failedRequests++;
        }
        
        // Update average response time
        const total = this.metrics.successfulRequests + this.metrics.failedRequests;
        this.metrics.averageResponseTime = 
            (this.metrics.averageResponseTime * (total - 1) + responseTime) / total;
    }
    
    updateServiceMetrics(serviceKey, status, responseTime) {
        const metrics = this.metrics.serviceMetrics[serviceKey];
        
        metrics.requests++;
        if (status === 'success') {
            metrics.successes++;
        } else {
            metrics.failures++;
        }
        
        metrics.responseTimes.push(responseTime);
        if (metrics.responseTimes.length > 100) {
            metrics.responseTimes.shift();
        }
        
        metrics.averageResponseTime = 
            metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
    }
    
    startHealthMonitoring() {
        setInterval(() => {
            Object.entries(this.services).forEach(([key, service]) => {
                if (service.connection && service.status === 'connected') {
                    service.connection.ping();
                }
            });
            
            this.emit('health_check', this.getHealthStatus());
        }, 30000); // Every 30 seconds
    }
    
    getHealthStatus() {
        const status = {
            healthy: true,
            services: {},
            metrics: this.metrics,
            pendingTasks: this.pendingTasks.size
        };
        
        Object.entries(this.services).forEach(([key, service]) => {
            status.services[key] = {
                name: service.name,
                status: service.status,
                queueLength: service.queue.length
            };
            
            if (service.status !== 'connected' && service.status !== 'simulated') {
                status.healthy = false;
            }
        });
        
        return status;
    }
    
    async shutdown() {
        console.log('Shutting down Multi-Claude Orchestrator...');
        
        // Close all connections
        Object.values(this.services).forEach(service => {
            if (service.connection) {
                service.connection.close();
            }
        });
        
        // Clear pending tasks
        this.pendingTasks.clear();
        
        this.emit('shutdown');
    }
}

export default MultiClaudeOrchestrator;
