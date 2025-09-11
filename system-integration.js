/**
 * Palantir Math System Integration
 * Integrates enhanced dashboard, memory pool, and version control
 */

import DashboardEnhancer from './dashboard-enhancer.js';
import AgentMemoryPool from './agent-memory-pool.js';
import OntologyVersionControl from './ontology-version-control.js';
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';

class PalantirSystemIntegration {
    constructor() {
        console.log('\n🚀 Initializing Palantir Math Enhanced System...\n');
        
        // Initialize components
        this.dashboard = new DashboardEnhancer();
        this.memoryPool = new AgentMemoryPool({
            totalMemoryMB: 2048, // 2GB for AI agents
            minMemoryPerAgent: 10,
            maxMemoryPerAgent: 100
        });
        this.versionControl = new OntologyVersionControl({
            maxVersions: 30
        });
        
        // Setup web server
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: { origin: "*", methods: ["GET", "POST"] }
        });
        
        this.port = 8096; // New port for enhanced system
        
        this.setupRoutes();
        this.setupSocketHandlers();
        this.startMonitoring();
    }
}
    setupRoutes() {
        // Serve enhanced dashboard
        this.app.get('/', (req, res) => {
            res.send(this.dashboard.generateEnhancedHTML());
        });
        
        // API endpoints
        this.app.get('/api/status', async (req, res) => {
            const status = {
                system: 'operational',
                components: {
                    dashboard: 'active',
                    memoryPool: this.memoryPool.getStatistics(),
                    versionControl: this.versionControl.getHistory(5),
                    ontology: await this.dashboard.getOntologyVisualization()
                },
                timestamp: new Date().toISOString()
            };
            res.json(status);
        });
        
        this.app.post('/api/memory/optimize', (req, res) => {
            const result = this.memoryPool.optimize();
            res.json({ success: true, statistics: result });
        });
        
        this.app.post('/api/ontology/snapshot', async (req, res) => {
            try {
                const version = await this.versionControl.createSnapshot({
                    message: 'Manual snapshot via API',
                    author: 'api-user'
                });
                res.json({ success: true, version });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        this.app.get('/api/ontology/history', (req, res) => {
            const history = this.versionControl.getHistory(20);
            res.json(history);
        });
        
        this.app.post('/api/ontology/rollback/:versionId', async (req, res) => {
            try {
                await this.versionControl.rollback(req.params.versionId);
                res.json({ success: true, message: `Rolled back to ${req.params.versionId}` });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            
            socket.on('request-metrics', async () => {
                const metrics = {
                    memory: await this.dashboard.getMemoryMetrics(),
                    ontology: await this.dashboard.getOntologyVisualization(),
                    memoryPool: this.memoryPool.getStatistics(),
                    timestamp: new Date().toISOString()
                };
                socket.emit('metrics', metrics);
            });
            
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
        
        // Memory pool events
        this.memoryPool.on('memory-allocated', (data) => {
            this.io.emit('memory-event', { type: 'allocated', ...data });
        });
        
        this.memoryPool.on('memory-reallocated', (data) => {
            this.io.emit('memory-event', { type: 'reallocated', ...data });
        });
        
        this.memoryPool.on('pool-optimized', (stats) => {
            this.io.emit('memory-event', { type: 'optimized', stats });
        });
    }
    startMonitoring() {
        // Auto-snapshot every hour
        setInterval(async () => {
            try {
                await this.versionControl.createSnapshot({
                    message: 'Hourly auto-snapshot',
                    author: 'auto-system'
                });
            } catch (error) {
                console.error('Auto-snapshot failed:', error);
            }
        }, 60 * 60 * 1000); // 1 hour
        
        // Optimize memory pool every 30 minutes
        setInterval(() => {
            this.memoryPool.optimize();
        }, 30 * 60 * 1000); // 30 minutes
        
        // Broadcast metrics every 5 seconds
        setInterval(async () => {
            const metrics = {
                memory: await this.dashboard.getMemoryMetrics(),
                ontology: await this.dashboard.getOntologyVisualization(),
                memoryPool: this.memoryPool.getStatistics(),
                timestamp: new Date().toISOString()
            };
            this.io.emit('metrics', metrics);
        }, 5000);
        
        console.log('📊 Monitoring systems activated');
    }
    
    async start() {
        try {
            // Create initial snapshot
            await this.versionControl.createSnapshot({
                message: 'System startup snapshot',
                author: 'system'
            });
            
            // Start server
            this.server.listen(this.port, () => {
                console.log(`
═══════════════════════════════════════════════════════════════
        🚀 PALANTIR MATH ENHANCED SYSTEM ACTIVE 🚀
═══════════════════════════════════════════════════════════════

  Dashboard:        http://localhost:${this.port}
  API Status:       http://localhost:${this.port}/api/status
  Memory Pool:      ${this.memoryPool.memoryAllocations.size} agents configured
  Version Control:  ${this.versionControl.history.versions.length} versions tracked
  
  Components:
  ✅ Enhanced Dashboard with Visualizations
  ✅ AI Agent Memory Pool (2GB allocated)
  ✅ Ontology Version Control System
  ✅ Real-time WebSocket Updates
  
  Auto-Features:
  ⏰ Hourly ontology snapshots
  ⏰ 30-minute memory optimization
  ⏰ 5-second metric broadcasts
  
═══════════════════════════════════════════════════════════════
                `);
            });
            
        } catch (error) {
            console.error('Failed to start system:', error);
            process.exit(1);
        }
    }
}

// Start the integrated system
const system = new PalantirSystemIntegration();
system.start();

export default PalantirSystemIntegration;