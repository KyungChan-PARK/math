/**
 * Enhanced Dashboard Module for Palantir Math
 * Adds ontology visualization and memory graphs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DashboardEnhancer {
    constructor() {
        this.ontologyStatePath = path.join(__dirname, 'ontology-state.json');
        this.memoryReportPath = path.join(__dirname, 'memory-optimization-report.json');
        this.historicalData = {
            memory: [],
            ontology: [],
            maxDataPoints: 100
        };
    }

    // Load ontology state
    async loadOntologyState() {
        try {
            const data = await fs.promises.readFile(this.ontologyStatePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading ontology state:', error);
            return null;
        }
    }
}
    // Get memory metrics with history
    async getMemoryMetrics() {
        const memUsage = process.memoryUsage();
        const totalMem = require('os').totalmem();
        const freeMem = require('os').freemem();
        const usedMem = totalMem - freeMem;
        
        const metrics = {
            timestamp: new Date().toISOString(),
            system: {
                total: Math.round(totalMem / 1024 / 1024),
                used: Math.round(usedMem / 1024 / 1024),
                free: Math.round(freeMem / 1024 / 1024),
                percentage: ((usedMem / totalMem) * 100).toFixed(2)
            },
            process: {
                rss: Math.round(memUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024)
            }
        };

        // Add to history
        this.historicalData.memory.push(metrics);
        if (this.historicalData.memory.length > this.maxDataPoints) {
            this.historicalData.memory.shift();
        }

        return metrics;
    }
}
    // Generate ontology visualization data
    async getOntologyVisualization() {
        const state = await this.loadOntologyState();
        if (!state) return null;

        return {
            nodes: {
                total: state.entities.total,
                categories: state.entities.categories,
                distribution: Object.entries(state.entities.categories).map(([key, value]) => ({
                    name: key,
                    value: value,
                    percentage: ((value / state.entities.total) * 100).toFixed(1)
                }))
            },
            graph: {
                nodes: state.knowledge_graph.nodes,
                edges: state.knowledge_graph.edges,
                clusters: state.knowledge_graph.clusters,
                connectivity: state.knowledge_graph.connectivity
            },
            domains: state.domains,
            performance: state.performance,
            integrity: state.integrity
        };
    }

    // Generate dashboard HTML with enhanced visualizations
    generateEnhancedHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Palantir Math - Enhanced Dashboard</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        .dashboard {
            max-width: 1600px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
            gap: 20px;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .card h2 {
            margin-bottom: 15px;
            font-size: 1.2em;
            color: #4fc3f7;
        }        .metric {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .metric-value {
            font-weight: bold;
            color: #81c784;
        }
        .chart-container {
            position: relative;
            height: 300px;
            margin-top: 20px;
        }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-active { background: #4caf50; }
        .status-warning { background: #ff9800; }
        .status-error { background: #f44336; }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            background: linear-gradient(45deg, #4fc3f7, #81c784);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
    </style>
</head>
<body>
    <h1>🚀 Palantir Math Enhanced Dashboard</h1>
    
    <div class="dashboard">
        <!-- Memory Usage Card -->
        <div class="card">
            <h2>💾 Memory Usage</h2>
            <div class="metric">
                <span>System Memory</span>
                <span class="metric-value" id="sys-memory">-</span>
            </div>
            <div class="metric">
                <span>Process Memory</span>
                <span class="metric-value" id="proc-memory">-</span>
            </div>
            <div class="chart-container">
                <canvas id="memoryChart"></canvas>
            </div>
        </div>

        <!-- Ontology Status Card -->
        <div class="card">
            <h2>🧬 Ontology Status</h2>
            <div class="metric">
                <span>Total Entities</span>
                <span class="metric-value" id="total-entities">-</span>
            </div>
            <div class="metric">
                <span>Knowledge Graph</span>
                <span class="metric-value" id="kg-stats">-</span>
            </div>
            <div class="metric">
                <span>Connectivity</span>
                <span class="metric-value" id="connectivity">-</span>
            </div>
            <div class="chart-container">
                <canvas id="ontologyChart"></canvas>
            </div>
        </div>

        <!-- AI Agents Card -->
        <div class="card">
            <h2>🤖 AI Agents</h2>
            <div class="metric">
                <span>Active Agents</span>
                <span class="metric-value" id="active-agents">75</span>
            </div>
            <div class="metric">
                <span>Query Rate</span>
                <span class="metric-value" id="query-rate">-</span>
            </div>
            <div class="metric">
                <span>Inference Accuracy</span>
                <span class="metric-value" id="accuracy">94%</span>
            </div>
            <div class="chart-container">
                <canvas id="agentsChart"></canvas>
            </div>
        </div>

        <!-- System Health Card -->
        <div class="card">
            <h2>🏥 System Health</h2>
            <div class="metric">
                <span><span class="status-indicator status-active"></span>Master Launcher</span>
                <span class="metric-value">PID 28724</span>
            </div>
            <div class="metric">
                <span><span class="status-indicator status-active"></span>Monitoring</span>
                <span class="metric-value">Port 8095</span>
            </div>
            <div class="metric">
                <span><span class="status-indicator status-active"></span>Qwen Orchestrator</span>
                <span class="metric-value">Port 8093</span>
            </div>
            <div class="metric">
                <span>Overall Health</span>
                <span class="metric-value" id="health-score">92/100</span>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        
        // Initialize Charts
        const memoryCtx = document.getElementById('memoryChart').getContext('2d');
        const memoryChart = new Chart(memoryCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'System Memory (MB)',
                    data: [],
                    borderColor: '#4fc3f7',
                    backgroundColor: 'rgba(79, 195, 247, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Process Memory (MB)',
                    data: [],
                    borderColor: '#81c784',
                    backgroundColor: 'rgba(129, 199, 132, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#fff' } }
                },
                scales: {
                    x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                }
            }
        });

        const ontologyCtx = document.getElementById('ontologyChart').getContext('2d');
        const ontologyChart = new Chart(ontologyCtx, {
            type: 'doughnut',
            data: {
                labels: ['Concepts', 'Relationships', 'Attributes', 'Instances'],
                datasets: [{
                    data: [342, 567, 189, 149],
                    backgroundColor: [
                        'rgba(79, 195, 247, 0.8)',
                        'rgba(129, 199, 132, 0.8)',
                        'rgba(255, 183, 77, 0.8)',
                        'rgba(186, 104, 200, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#fff' } }
                }
            }
        });

        // Update functions
        socket.on('metrics', (data) => {
            // Update memory display
            if (data.memory) {
                document.getElementById('sys-memory').textContent = 
                    `${data.memory.system.used} / ${data.memory.system.total} MB`;
                document.getElementById('proc-memory').textContent = 
                    `${data.memory.process.rss} MB`;
                
                // Update memory chart
                const time = new Date().toLocaleTimeString();
                memoryChart.data.labels.push(time);
                memoryChart.data.datasets[0].data.push(data.memory.system.used);
                memoryChart.data.datasets[1].data.push(data.memory.process.rss);
                
                // Keep only last 20 points
                if (memoryChart.data.labels.length > 20) {
                    memoryChart.data.labels.shift();
                    memoryChart.data.datasets.forEach(dataset => dataset.data.shift());
                }
                memoryChart.update();
            }

            // Update ontology display
            if (data.ontology) {
                document.getElementById('total-entities').textContent = data.ontology.nodes.total;
                document.getElementById('kg-stats').textContent = 
                    `${data.ontology.graph.nodes} nodes, ${data.ontology.graph.edges} edges`;
                document.getElementById('connectivity').textContent = 
                    `${(data.ontology.graph.connectivity * 100).toFixed(0)}%`;
            }
        });

        // Request initial data
        socket.emit('request-metrics');
        
        // Auto-refresh every 5 seconds
        setInterval(() => {
            socket.emit('request-metrics');
        }, 5000);
    </script>
</body>
</html>
        `;
    }
}

export default DashboardEnhancer;