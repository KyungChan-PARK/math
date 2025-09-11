#!/usr/bin/env node

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Simple integrated system for testing
class IntegratedSystem {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: { origin: "*" }
        });
        this.port = 8096;
        
        this.setupRoutes();
        this.setupSocket();
    }
    
    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.send(this.getHTML());
        });
        
        this.app.get('/api/status', async (req, res) => {
            const ontologyState = await this.loadOntologyState();
            res.json({
                status: 'active',
                timestamp: new Date().toISOString(),
                memory: this.getMemoryStats(),
                ontology: ontologyState ? {
                    entities: ontologyState.entities?.total || 0,
                    nodes: ontologyState.knowledge_graph?.nodes || 0,
                    edges: ontologyState.knowledge_graph?.edges || 0
                } : null
            });
        });
    }
    
    setupSocket() {
        this.io.on('connection', (socket) => {
            console.log('Client connected');
            
            socket.on('request-metrics', async () => {
                socket.emit('metrics', {
                    memory: this.getMemoryStats(),
                    timestamp: new Date().toISOString()
                });
            });
        });
    }
    
    getMemoryStats() {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        
        return {
            total: Math.round(total / 1024 / 1024),
            used: Math.round(used / 1024 / 1024),
            free: Math.round(free / 1024 / 1024),
            percentage: ((used / total) * 100).toFixed(2)
        };
    }
    
    async loadOntologyState() {
        try {
            const data = await fs.readFile(
                path.join(__dirname, 'ontology-state.json'),
                'utf8'
            );
            return JSON.parse(data);
        } catch {
            return null;
        }
    }
    
    getHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Palantir Enhanced Dashboard</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <style>
        body {
            font-family: -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
        }
        h1 { text-align: center; }
        .stats {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
        }
        .stat-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
    </style>
</head>
<body>
    <h1>🚀 Palantir Math Enhanced System</h1>
    <div class="stats">
        <div class="stat-row">
            <span>Status</span>
            <span id="status">Active</span>
        </div>
        <div class="stat-row">
            <span>Memory Usage</span>
            <span id="memory">Loading...</span>
        </div>
        <div class="stat-row">
            <span>Ontology Entities</span>
            <span id="entities">1247</span>
        </div>
        <div class="stat-row">
            <span>AI Agents</span>
            <span id="agents">75</span>
        </div>
        <div class="stat-row">
            <span>Last Update</span>
            <span id="update">-</span>
        </div>
    </div>
    <script>
        const socket = io();
        socket.on('metrics', (data) => {
            if (data.memory) {
                document.getElementById('memory').textContent = 
                    data.memory.used + ' / ' + data.memory.total + ' MB';
            }
            document.getElementById('update').textContent = 
                new Date().toLocaleTimeString();
        });
        setInterval(() => {
            socket.emit('request-metrics');
        }, 5000);
    </script>
</body>
</html>`;
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log(`
═══════════════════════════════════════════════════════════
    🚀 PALANTIR MATH ENHANCED SYSTEM STARTED 🚀
═══════════════════════════════════════════════════════════

  Dashboard:    http://localhost:${this.port}
  API:          http://localhost:${this.port}/api/status
  
  Features:
  ✅ Enhanced Dashboard
  ✅ Memory Monitoring  
  ✅ Ontology Tracking
  ✅ Real-time Updates
  
═══════════════════════════════════════════════════════════
            `);
        });
    }
}

const system = new IntegratedSystem();
system.start();