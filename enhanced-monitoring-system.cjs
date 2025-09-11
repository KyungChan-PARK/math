const PerformanceMonitor = require('./performance-monitor.cjs');
const ErrorTracker = require('./error-tracker.cjs');
const AgentCommunicationProtocol = require('./agent-communication-protocol.cjs');
const TaskQueue = require('./task-queue.cjs');
const LoadBalancer = require('./load-balancer.cjs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

class EnhancedMonitoringSystem {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: { origin: "*" }
        });
        this.port = 8097;
        
        // Initialize components
        this.perfMonitor = new PerformanceMonitor();
        this.errorTracker = new ErrorTracker();
        this.commProtocol = new AgentCommunicationProtocol();
        this.taskQueue = new TaskQueue({ maxConcurrent: 20 });
        this.loadBalancer = new LoadBalancer({ algorithm: 'least-connections' });
        
        this.initializeAgents();
        this.setupRoutes();
        this.setupSocketHandlers();
        this.setupEventHandlers();
    }

    initializeAgents() {
        const categories = [
            'math_concepts', 'pedagogy', 'visualization', 'interaction',
            'assessment', 'technical', 'content', 'analytics'
        ];
        
        let agentCount = 0;
        categories.forEach((category, idx) => {
            const count = category === 'analytics' ? 5 : 10;
            for (let i = 0; i < count; i++) {
                const agentId = `${category}_agent_${i}`;
                
                // Register in communication protocol
                this.commProtocol.registerAgent(agentId, {
                    category: category,
                    priority: idx < 4 ? 3 : 2,
                    capabilities: [category, 'general']
                });
                
                // Register in load balancer
                this.loadBalancer.registerAgent(agentId, {
                    capacity: 10,
                    weight: idx < 4 ? 2 : 1,
                    category: category
                });
                
                // Register as task worker
                this.taskQueue.registerWorker(agentId, [category]);
                
                agentCount++;
            }
        });
        
        console.log(`Initialized ${agentCount} AI agents`);
    }

    setupRoutes() {
        this.app.use(express.json());
        
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
        
        this.app.get('/api/status', (req, res) => {
            res.json({
                performance: this.perfMonitor.getStatistics(),
                errors: this.errorTracker.getStatistics(),
                communication: this.commProtocol.getStatistics(),
                taskQueue: this.taskQueue.getStatistics(),
                loadBalancer: this.loadBalancer.getStatistics(),
                timestamp: new Date().toISOString()
            });
        });
        
        this.app.post('/api/task', async (req, res) => {
            const { task, priority = 'normal' } = req.body;
            const taskId = this.taskQueue.addTask(task, priority);
            res.json({ taskId, status: 'queued' });
        });
        
        this.app.post('/api/collaborate', (req, res) => {
            const { requester, agents, task } = req.body;
            this.commProtocol.emit('collaboration-request', { requester, agents, task });
            res.json({ status: 'collaboration-initiated' });
        });
        
        this.app.post('/api/message', (req, res) => {
            const { from, to, message, priority = 1 } = req.body;
            const messageId = this.commProtocol.sendMessage(from, to, message, priority);
            res.json({ messageId, status: 'sent' });
        });
        
        this.app.get('/api/performance/report', async (req, res) => {
            const report = await this.perfMonitor.saveReport();
            res.json(report);
        });
        
        this.app.get('/api/errors/report', async (req, res) => {
            const report = await this.errorTracker.generateReport();
            res.json(report);
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            
            const interval = setInterval(() => {
                socket.emit('metrics', {
                    performance: this.perfMonitor.getStatistics(),
                    taskQueue: this.taskQueue.getStatistics(),
                    loadBalancer: this.loadBalancer.getStatistics()
                });
            }, 1000);
            
            socket.on('disconnect', () => {
                clearInterval(interval);
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    setupEventHandlers() {
        // Performance alerts
        this.perfMonitor.on('alert', (alerts) => {
            this.io.emit('performance-alert', alerts);
            alerts.forEach(alert => {
                this.errorTracker.trackError(new Error(`Performance Alert: ${alert.type}`), alert);
            });
        });
        
        // Task events
        this.taskQueue.on('task-completed', (task) => {
            this.io.emit('task-update', { type: 'completed', task });
            const agent = task.assignedTo;
            if (agent) {
                this.loadBalancer.releaseTask(agent, task.completedAt - task.startedAt);
            }
        });
        
        this.taskQueue.on('task-failed', (task) => {
            this.io.emit('task-update', { type: 'failed', task });
            this.errorTracker.trackError(new Error(`Task failed: ${task.id}`), { task });
        });
        
        // Communication events
        this.commProtocol.on('message-delivered', (msg) => {
            this.io.emit('message-update', { type: 'delivered', message: msg });
        });
        
        // Register task handlers
        this.taskQueue.registerHandler('math', async (task) => {
            const agent = this.loadBalancer.selectAgent('math');
            if (!agent) throw new Error('No available agent');
            
            this.loadBalancer.assignTask(agent.id, task);
            
            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
            
            return { result: 'Math task completed', agent: agent.id };
        });
    }

    getDashboardHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Palantir Enhanced Monitoring</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { 
            font-family: -apple-system, sans-serif; 
            background: #1a1a2e; 
            color: #eee; 
            padding: 20px;
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            max-width: 1400px; 
            margin: 0 auto;
        }
        .card { 
            background: #16213e; 
            border-radius: 8px; 
            padding: 20px; 
            border: 1px solid #0f3460;
        }
        .metric { 
            font-size: 2em; 
            font-weight: bold; 
            color: #4fbdba;
        }
        .label { 
            color: #7ec8e3; 
            margin-bottom: 5px;
        }
        h1 { 
            text-align: center; 
            color: #4fbdba;
        }
        .chart-container { 
            height: 200px; 
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <h1>🚀 Palantir Enhanced Monitoring System</h1>
    <div class="grid">
        <div class="card">
            <div class="label">CPU Usage</div>
            <div class="metric" id="cpu">-</div>
        </div>
        <div class="card">
            <div class="label">Memory Usage</div>
            <div class="metric" id="memory">-</div>
        </div>
        <div class="card">
            <div class="label">Active Tasks</div>
            <div class="metric" id="tasks">-</div>
        </div>
        <div class="card">
            <div class="label">Healthy Agents</div>
            <div class="metric" id="agents">-</div>
        </div>
        <div class="card">
            <div class="label">Response Time</div>
            <div class="metric" id="response">-</div>
        </div>
        <div class="card">
            <div class="label">Error Rate</div>
            <div class="metric" id="errors">-</div>
        </div>
    </div>
    <div class="card" style="margin-top: 20px;">
        <div class="chart-container">
            <canvas id="perfChart"></canvas>
        </div>
    </div>
    <script>
        const socket = io();
        
        const ctx = document.getElementById('perfChart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'CPU %',
                    data: [],
                    borderColor: '#4fbdba',
                    tension: 0.4
                }, {
                    label: 'Memory %',
                    data: [],
                    borderColor: '#7ec8e3',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });
        
        socket.on('metrics', (data) => {
            if (data.performance) {
                document.getElementById('cpu').textContent = data.performance.cpu.avg + '%';
                document.getElementById('memory').textContent = data.performance.memory.avg + '%';
                document.getElementById('response').textContent = data.performance.responseTime.avg + 'ms';
                document.getElementById('errors').textContent = data.performance.errorRate + '%';
                
                const time = new Date().toLocaleTimeString();
                chart.data.labels.push(time);
                chart.data.datasets[0].data.push(parseFloat(data.performance.cpu.avg));
                chart.data.datasets[1].data.push(parseFloat(data.performance.memory.avg));
                
                if (chart.data.labels.length > 20) {
                    chart.data.labels.shift();
                    chart.data.datasets.forEach(d => d.data.shift());
                }
                chart.update();
            }
            
            if (data.taskQueue) {
                const total = data.taskQueue.active + data.taskQueue.queued.high + 
                            data.taskQueue.queued.normal + data.taskQueue.queued.low;
                document.getElementById('tasks').textContent = total;
            }
            
            if (data.loadBalancer) {
                document.getElementById('agents').textContent = 
                    data.loadBalancer.healthyAgents + '/' + data.loadBalancer.totalAgents;
            }
        });
        
        socket.on('performance-alert', (alerts) => {
            console.log('Performance Alert:', alerts);
        });
    </script>
</body>
</html>`;
    }

    start() {
        this.perfMonitor.start();
        
        this.server.listen(this.port, () => {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║          PALANTIR ENHANCED MONITORING SYSTEM v2.0           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Dashboard:     http://localhost:${this.port}                      ║
║  API Status:    http://localhost:${this.port}/api/status           ║
║                                                              ║
║  Components:                                                 ║
║  ✅ Performance Monitor (APM)                               ║
║  ✅ Error Tracking System                                   ║
║  ✅ Agent Communication Protocol                            ║
║  ✅ Task Queue System                                       ║
║  ✅ Load Balancer                                           ║
║                                                              ║
║  AI Agents:     75 initialized                              ║
║  Algorithm:     Least Connections                           ║
║  Max Tasks:     20 concurrent                               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
            `);
        });
    }
}

const system = new EnhancedMonitoringSystem();
system.start();