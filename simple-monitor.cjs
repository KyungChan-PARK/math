const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const port = 8095;

// Simple dashboard HTML
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Palantir Math - Monitoring Dashboard</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
        }
        h1 { text-align: center; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 20px;
            margin: 10px;
            display: inline-block;
            width: calc(33% - 20px);
        }
        .status { font-size: 24px; font-weight: bold; }
        .metric { margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🎯 Palantir Math - System Monitor</h1>
    <div class="container">
        <div class="card">
            <h2>📊 System Status</h2>
            <div class="status">✅ ACTIVE</div>
            <div class="metric">Port: ${port}</div>
            <div class="metric">Time: <span id="time"></span></div>
        </div>
        <div class="card">
            <h2>🏛️ Ontology</h2>
            <div class="metric">Files: 217/256</div>
            <div class="metric">Health: 90/100</div>
            <div class="metric">Complexity: Simple</div>
        </div>
        <div class="card">
            <h2>🤖 AI Status</h2>
            <div class="metric">Claude: Active</div>
            <div class="metric">Qwen: Ready</div>
            <div class="metric">Agents: 75</div>
        </div>
    </div>
    <script>
        setInterval(() => {
            document.getElementById('time').innerText = new Date().toLocaleTimeString();
        }, 1000);
    </script>
</body>
</html>
    `);
});

// API endpoints
app.get('/api/status', (req, res) => {
    res.json({
        status: 'active',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        project: {
            name: 'Palantir Math',
            health: 90,
            files: 217
        }
    });
});

// Start server
server.listen(port, () => {
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('           MONITORING DASHBOARD STARTED                            ');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`  Dashboard: http://localhost:${port}`);
    console.log('  Status: Active');
    console.log('');
});
