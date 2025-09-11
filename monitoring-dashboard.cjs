#!/usr/bin/env node

/**
 * Real-time Project Monitoring Dashboard
 * Ontology 상태, 프로젝트 건강도, Claude-Qwen 협업 모니터링
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MonitoringDashboard {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.MONITOR_PORT || 8095;
        this.projectRoot = __dirname;
        
        // 모니터링 데이터
        this.metrics = {
            system: {
                uptime: 0,
                memory: {},
                cpu: 0
            },
            project: {
                totalFiles: 0,
                health: 0,
                complexity: 'unknown',
                lastUpdate: null
            },
            ontology: {
                entities: 0,
                relationships: 0,
                lastAnalysis: null
            },
            collaboration: {
                claudeStatus: 'unknown',
                qwenStatus: 'unknown',
                lastCollaboration: null,
                successRate: 0
            },
            improvements: {
                pending: 0,
                completed: 0,
                inProgress: 0
            }
        };
        
        this.setupRoutes();
        this.setupWebSocket();
        this.startMonitoring();
    }
    
    setupRoutes() {
        // Static files
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // API endpoints
        this.app.get('/api/metrics', (req, res) => {
            res.json(this.metrics);
        });
        
        this.app.get('/api/project-state', (req, res) => {
            const statePath = path.join(this.projectRoot, 'PROJECT_CURRENT_STATE.json');
            if (fs.existsSync(statePath)) {
                const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
                res.json(state);
            } else {
                res.status(404).json({ error: 'State file not found' });
            }
        });
        
        this.app.get('/api/ontology-report', (req, res) => {
            const reportPath = path.join(this.projectRoot, 'ONTOLOGY_REPORT.json');
            if (fs.existsSync(reportPath)) {
                const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
                res.json(report);
            } else {
                res.status(404).json({ error: 'Ontology report not found' });
            }
        });
        
        this.app.get('/api/improvements', (req, res) => {
            const improvementsPath = path.join(this.projectRoot, 'IMPROVEMENT_SUGGESTIONS.json');
            if (fs.existsSync(improvementsPath)) {
                const improvements = JSON.parse(fs.readFileSync(improvementsPath, 'utf-8'));
                res.json(improvements);
            } else {
                res.json({ suggestions: [] });
            }
        });
        
        this.app.get('/api/cleanup-plan', (req, res) => {
            const cleanupPath = path.join(this.projectRoot, 'FILE_CLEANUP_PLAN.json');
            if (fs.existsSync(cleanupPath)) {
                const cleanup = JSON.parse(fs.readFileSync(cleanupPath, 'utf-8'));
                res.json(cleanup);
            } else {
                res.json({ summary: {}, recommendations: [] });
            }
        });
        
        // Dashboard HTML
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
    }
    
    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log(chalk.green('  ✓ Dashboard client connected'));
            
            // Send initial data
            socket.emit('metrics', this.metrics);
            
            // Handle client requests
            socket.on('refresh', () => {
                this.updateMetrics();
                socket.emit('metrics', this.metrics);
            });
            
            socket.on('trigger-improvement', () => {
                this.triggerImprovement();
            });
            
            socket.on('trigger-collaboration', () => {
                this.triggerCollaboration();
            });
            
            socket.on('disconnect', () => {
                console.log(chalk.yellow('  ○ Dashboard client disconnected'));
            });
        });
    }
    
    startMonitoring() {
        // Update metrics every 5 seconds
        setInterval(() => {
            this.updateMetrics();
            this.io.emit('metrics', this.metrics);
        }, 5000);
        
        // Deep analysis every minute
        setInterval(() => {
            this.performDeepAnalysis();
        }, 60000);
        
        this.server.listen(this.port, () => {
            console.log(chalk.cyan('═══════════════════════════════════════════════════════════════════'));
            console.log(chalk.cyan.bold('           MONITORING DASHBOARD STARTED                            '));
            console.log(chalk.cyan('═══════════════════════════════════════════════════════════════════'));
            console.log(chalk.green(`  Dashboard: http://localhost:${this.port}`));
            console.log(chalk.gray('  Real-time metrics updating every 5 seconds'));
            console.log();
        });
    }
    
    updateMetrics() {
        // System metrics
        this.metrics.system.uptime = process.uptime();
        this.metrics.system.memory = process.memoryUsage();
        this.metrics.system.cpu = process.cpuUsage().user / 1000000; // Convert to seconds
        
        // Project metrics from files
        this.updateProjectMetrics();
        this.updateOntologyMetrics();
        this.updateCollaborationMetrics();
        this.updateImprovementMetrics();
    }
    
    updateProjectMetrics() {
        try {
            const statePath = path.join(this.projectRoot, 'PROJECT_CURRENT_STATE.json');
            if (fs.existsSync(statePath)) {
                const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
                this.metrics.project.lastUpdate = state.lastSession || new Date().toISOString();
            }
            
            const ontologyReport = path.join(this.projectRoot, 'ONTOLOGY_REPORT.json');
            if (fs.existsSync(ontologyReport)) {
                const report = JSON.parse(fs.readFileSync(ontologyReport, 'utf-8'));
                this.metrics.project.totalFiles = report.totalFiles || 0;
                this.metrics.project.health = report.health?.score || 0;
                this.metrics.project.complexity = report.complexity || 'unknown';
            }
        } catch (error) {
            // Ignore errors
        }
    }
    
    updateOntologyMetrics() {
        try {
            const ontologyState = path.join(this.projectRoot, 'ontology-state.json');
            if (fs.existsSync(ontologyState)) {
                const state = JSON.parse(fs.readFileSync(ontologyState, 'utf-8'));
                this.metrics.ontology.entities = state.metadata?.entityCount || 0;
                this.metrics.ontology.relationships = state.metadata?.relationshipCount || 0;
                this.metrics.ontology.lastAnalysis = state.metadata?.saved || null;
            }
        } catch (error) {
            // Ignore errors
        }
    }
    
    updateCollaborationMetrics() {
        // Check server status
        const checkPort = (port) => {
            return new Promise((resolve) => {
                const net = require('net');
                const client = new net.Socket();
                client.setTimeout(1000);
                
                client.on('connect', () => {
                    client.destroy();
                    resolve(true);
                });
                
                client.on('timeout', () => {
                    client.destroy();
                    resolve(false);
                });
                
                client.on('error', () => {
                    resolve(false);
                });
                
                client.connect(port, '127.0.0.1');
            });
        };
        
        // Check orchestrator status
        checkPort(8093).then(isRunning => {
            this.metrics.collaboration.qwenStatus = isRunning ? 'active' : 'inactive';
        });
        
        // Claude is always considered active when this system is running
        this.metrics.collaboration.claudeStatus = 'active';
        
        // Collaboration history
        try {
            const collabRequest = path.join(this.projectRoot, 'COLLABORATION_REQUEST.json');
            if (fs.existsSync(collabRequest)) {
                const request = JSON.parse(fs.readFileSync(collabRequest, 'utf-8'));
                this.metrics.collaboration.lastCollaboration = request.timestamp;
            }
        } catch (error) {
            // Ignore errors
        }
    }
    
    updateImprovementMetrics() {
        try {
            const improvementsPath = path.join(this.projectRoot, 'IMPROVEMENT_SUGGESTIONS.json');
            if (fs.existsSync(improvementsPath)) {
                const improvements = JSON.parse(fs.readFileSync(improvementsPath, 'utf-8'));
                this.metrics.improvements.pending = improvements.suggestions?.length || 0;
            }
            
            const selfImprovementState = path.join(this.projectRoot, 'SELF_IMPROVEMENT_STATE.json');
            if (fs.existsSync(selfImprovementState)) {
                const state = JSON.parse(fs.readFileSync(selfImprovementState, 'utf-8'));
                this.metrics.improvements.completed = state.improvements?.filter(i => i.status === 'completed').length || 0;
                this.metrics.improvements.inProgress = state.improvements?.filter(i => i.status === 'in_progress').length || 0;
            }
        } catch (error) {
            // Ignore errors
        }
    }
    
    performDeepAnalysis() {
        console.log(chalk.cyan('🔍 Performing deep analysis...'));
        
        // Trigger comprehensive analysis
        const analysis = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            recommendations: this.generateRecommendations()
        };
        
        // Save analysis
        const analysisPath = path.join(this.projectRoot, 'DASHBOARD_ANALYSIS.json');
        fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
        
        // Emit to connected clients
        this.io.emit('deep-analysis', analysis);
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        if (this.metrics.project.health < 80) {
            recommendations.push({
                type: 'health',
                priority: 'high',
                message: 'Project health is below optimal. Run cleanup analyzer.'
            });
        }
        
        if (this.metrics.improvements.pending > 10) {
            recommendations.push({
                type: 'improvements',
                priority: 'medium',
                message: `${this.metrics.improvements.pending} improvements pending. Process high-priority items.`
            });
        }
        
        if (this.metrics.collaboration.qwenStatus === 'inactive') {
            recommendations.push({
                type: 'collaboration',
                priority: 'high',
                message: 'Qwen orchestrator is not running. Start it for full collaboration.'
            });
        }
        
        return recommendations;
    }
    
    triggerImprovement() {
        console.log(chalk.magenta('🔧 Triggering improvement cycle...'));
        this.io.emit('improvement-triggered', { timestamp: new Date().toISOString() });
    }
    
    triggerCollaboration() {
        console.log(chalk.magenta('🤝 Triggering Claude-Qwen collaboration...'));
        
        const collaborationRequest = {
            timestamp: new Date().toISOString(),
            trigger: 'dashboard',
            metrics: this.metrics
        };
        
        const requestPath = path.join(this.projectRoot, 'COLLABORATION_REQUEST.json');
        fs.writeFileSync(requestPath, JSON.stringify(collaborationRequest, null, 2));
        
        this.io.emit('collaboration-triggered', collaborationRequest);
    }
    
    getDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Palantir Math - Monitoring Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card h2 {
            margin-bottom: 15px;
            font-size: 1.3em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
        }
        
        .status-active {
            background: #10b981;
            animation: pulse 2s infinite;
        }
        
        .status-inactive {
            background: #ef4444;
        }
        
        .status-warning {
            background: #f59e0b;
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            70% {
                box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
            }
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
        }
        
        .metric-label {
            opacity: 0.8;
        }
        
        .metric-value {
            font-weight: bold;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #34d399);
            transition: width 0.3s ease;
        }
        
        .buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        button {
            flex: 1;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        
        button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        
        .recommendations {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .recommendation {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
            padding: 10px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
        }
        
        .priority-high {
            border-left: 3px solid #ef4444;
        }
        
        .priority-medium {
            border-left: 3px solid #f59e0b;
        }
        
        .priority-low {
            border-left: 3px solid #10b981;
        }
        
        .timestamp {
            text-align: center;
            opacity: 0.7;
            margin-top: 20px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Palantir Math - Real-time Monitoring</h1>
        
        <div class="grid">
            <div class="card">
                <h2>
                    <span class="status-indicator status-active"></span>
                    System Status
                </h2>
                <div class="metric">
                    <span class="metric-label">Uptime</span>
                    <span class="metric-value" id="uptime">0s</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Memory</span>
                    <span class="metric-value" id="memory">0 MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">CPU Time</span>
                    <span class="metric-value" id="cpu">0s</span>
                </div>
            </div>
            
            <div class="card">
                <h2>
                    <span class="status-indicator" id="project-status"></span>
                    Project Health
                </h2>
                <div class="metric">
                    <span class="metric-label">Total Files</span>
                    <span class="metric-value" id="total-files">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Health Score</span>
                    <span class="metric-value" id="health-score">0/100</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="health-progress" style="width: 0%"></div>
                </div>
                <div class="metric">
                    <span class="metric-label">Complexity</span>
                    <span class="metric-value" id="complexity">unknown</span>
                </div>
            </div>
            
            <div class="card">
                <h2>
                    <span class="status-indicator status-active"></span>
                    Ontology System
                </h2>
                <div class="metric">
                    <span class="metric-label">Entities</span>
                    <span class="metric-value" id="entities">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Relationships</span>
                    <span class="metric-value" id="relationships">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Last Analysis</span>
                    <span class="metric-value" id="last-analysis">Never</span>
                </div>
            </div>
            
            <div class="card">
                <h2>
                    <span class="status-indicator" id="collab-status"></span>
                    AI Collaboration
                </h2>
                <div class="metric">
                    <span class="metric-label">Claude</span>
                    <span class="metric-value" id="claude-status">unknown</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Qwen</span>
                    <span class="metric-value" id="qwen-status">unknown</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Last Collab</span>
                    <span class="metric-value" id="last-collab">Never</span>
                </div>
            </div>
            
            <div class="card">
                <h2>
                    <span class="status-indicator status-warning"></span>
                    Improvements
                </h2>
                <div class="metric">
                    <span class="metric-label">Pending</span>
                    <span class="metric-value" id="pending">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">In Progress</span>
                    <span class="metric-value" id="in-progress">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Completed</span>
                    <span class="metric-value" id="completed">0</span>
                </div>
            </div>
            
            <div class="card">
                <h2>Actions</h2>
                <div class="buttons">
                    <button onclick="refresh()">🔄 Refresh</button>
                    <button onclick="triggerImprovement()">🔧 Improve</button>
                    <button onclick="triggerCollaboration()">🤝 Collaborate</button>
                </div>
            </div>
        </div>
        
        <div class="recommendations">
            <h2>📋 Recommendations</h2>
            <div id="recommendations-list"></div>
        </div>
        
        <div class="timestamp" id="timestamp">Last updated: Never</div>
    </div>
    
    <script>
        const socket = io();
        
        socket.on('connect', () => {
            console.log('Connected to monitoring dashboard');
        });
        
        socket.on('metrics', (metrics) => {
            updateDashboard(metrics);
        });
        
        socket.on('deep-analysis', (analysis) => {
            updateRecommendations(analysis.recommendations);
        });
        
        function updateDashboard(metrics) {
            // System metrics
            document.getElementById('uptime').textContent = formatTime(metrics.system.uptime);
            document.getElementById('memory').textContent = formatBytes(metrics.system.memory.heapUsed);
            document.getElementById('cpu').textContent = metrics.system.cpu.toFixed(2) + 's';
            
            // Project metrics
            document.getElementById('total-files').textContent = metrics.project.totalFiles;
            document.getElementById('health-score').textContent = metrics.project.health + '/100';
            document.getElementById('health-progress').style.width = metrics.project.health + '%';
            document.getElementById('complexity').textContent = metrics.project.complexity;
            
            // Update project status indicator
            const projectStatus = document.getElementById('project-status');
            if (metrics.project.health >= 80) {
                projectStatus.className = 'status-indicator status-active';
            } else if (metrics.project.health >= 60) {
                projectStatus.className = 'status-indicator status-warning';
            } else {
                projectStatus.className = 'status-indicator status-inactive';
            }
            
            // Ontology metrics
            document.getElementById('entities').textContent = metrics.ontology.entities;
            document.getElementById('relationships').textContent = metrics.ontology.relationships;
            document.getElementById('last-analysis').textContent = formatDate(metrics.ontology.lastAnalysis);
            
            // Collaboration metrics
            document.getElementById('claude-status').textContent = metrics.collaboration.claudeStatus;
            document.getElementById('qwen-status').textContent = metrics.collaboration.qwenStatus;
            document.getElementById('last-collab').textContent = formatDate(metrics.collaboration.lastCollaboration);
            
            // Update collaboration status indicator
            const collabStatus = document.getElementById('collab-status');
            if (metrics.collaboration.claudeStatus === 'active' && metrics.collaboration.qwenStatus === 'active') {
                collabStatus.className = 'status-indicator status-active';
            } else if (metrics.collaboration.claudeStatus === 'active' || metrics.collaboration.qwenStatus === 'active') {
                collabStatus.className = 'status-indicator status-warning';
            } else {
                collabStatus.className = 'status-indicator status-inactive';
            }
            
            // Improvement metrics
            document.getElementById('pending').textContent = metrics.improvements.pending;
            document.getElementById('in-progress').textContent = metrics.improvements.inProgress;
            document.getElementById('completed').textContent = metrics.improvements.completed;
            
            // Update timestamp
            document.getElementById('timestamp').textContent = 'Last updated: ' + new Date().toLocaleString();
        }
        
        function updateRecommendations(recommendations) {
            const list = document.getElementById('recommendations-list');
            list.innerHTML = '';
            
            if (recommendations.length === 0) {
                list.innerHTML = '<div class="recommendation">✅ All systems optimal</div>';
            } else {
                recommendations.forEach(rec => {
                    const div = document.createElement('div');
                    div.className = 'recommendation priority-' + rec.priority;
                    div.textContent = rec.message;
                    list.appendChild(div);
                });
            }
        }
        
        function formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            
            if (hours > 0) {
                return hours + 'h ' + minutes + 'm';
            } else if (minutes > 0) {
                return minutes + 'm ' + secs + 's';
            } else {
                return secs + 's';
            }
        }
        
        function formatBytes(bytes) {
            return (bytes / 1024 / 1024).toFixed(2) + ' MB';
        }
        
        function formatDate(dateString) {
            if (!dateString) return 'Never';
            const date = new Date(dateString);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) {
                return 'Just now';
            } else if (diff < 3600000) {
                return Math.floor(diff / 60000) + ' min ago';
            } else if (diff < 86400000) {
                return Math.floor(diff / 3600000) + ' hours ago';
            } else {
                return date.toLocaleDateString();
            }
        }
        
        function refresh() {
            socket.emit('refresh');
        }
        
        function triggerImprovement() {
            socket.emit('trigger-improvement');
        }
        
        function triggerCollaboration() {
            socket.emit('trigger-collaboration');
        }
    </script>
</body>
</html>`;
    }
}

// Export for use
export default MonitoringDashboard;

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const dashboard = new MonitoringDashboard();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\nShutting down monitoring dashboard...'));
        process.exit(0);
    });
}
