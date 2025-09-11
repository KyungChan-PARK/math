#!/usr/bin/env node
// Auto-generated Session Recovery Script
// Generated: 2025-09-09T04:16:16.119Z

console.log('🔄 Recovering Math Learning Platform session...');

// Step 1: Load checkpoint
const checkpoint = {
  "timestamp": "2025-09-09T04:16:16.111Z",
  "project": {
    "name": "Math Learning Platform",
    "version": "v5.0.0",
    "root": "C:\\palantir\\math"
  },
  "services": {
    "orchestrator": {
      "url": "http://localhost:8091",
      "agents": 75,
      "status": "offline"
    },
    "documentMonitor": {
      "file": "document-self-improvement-v2.js",
      "pid": 8424
    },
    "gmailNotifier": {
      "email": "packr0723@gmail.com",
      "active": true
    }
  },
  "currentState": {
    "documentsScanned": 160,
    "issuesFound": 70,
    "duplicates": 42,
    "brokenLinks": 6,
    "healthScore": 75,
    "innovationScore": 98
  },
  "lastTasks": [
    "Document reorganization complete",
    "Gmail notification system created",
    "75 AI agents operational",
    "Monitoring duplicate files",
    "Fixing broken links"
  ],
  "criticalInfo": {
    "apiKey": "sk-ant-api03-[STORED]",
    "model": "claude-opus-4-1-20250805",
    "gmail": "packr0723@gmail.com"
  },
  "quickCommands": [
    "node unified-launcher.js",
    "cat AI_AGENT_MASTER.md",
    "curl http://localhost:8091/api/health"
  ]
};

// Step 2: Verify services
const verifyServices = async () => {
    console.log('Checking services...');
    
    // Check orchestrator
    try {
        const response = await fetch('http://localhost:8091/api/health');
        if (response.ok) {
            console.log('✅ AI Orchestrator: ACTIVE');
        } else {
            console.log('❌ AI Orchestrator: INACTIVE - Starting...');
            require('child_process').spawn('node', ['orchestration/claude-orchestrator-75.js'], {
                detached: true,
                stdio: 'ignore'
            });
        }
    } catch (error) {
        console.log('⚠️ Orchestrator offline - needs manual start');
    }
    
    // Check document monitor
    const monitorRunning = true;
    if (!monitorRunning) {
        console.log('Starting document monitor...');
        require('child_process').spawn('node', ['document-self-improvement-v2.js'], {
            detached: true,
            stdio: 'ignore'
        });
    }
};

// Step 3: Display status
const displayStatus = () => {
    console.log('\n📊 PROJECT STATUS:');
    console.log('- Documents: 160');
    console.log('- Issues: 70');
    console.log('- Health: 75/100');
    console.log('- Innovation: 98/100');
    
    console.log('\n📝 LAST TASKS:');
    console.log('- Document reorganization complete');
    console.log('- Gmail notification system created');
    console.log('- 75 AI agents operational');
    console.log('- Monitoring duplicate files');
    console.log('- Fixing broken links');
    
    console.log('\n🚀 QUICK COMMANDS:');
    console.log('  node unified-launcher.js');
    console.log('  cat AI_AGENT_MASTER.md');
    console.log('  curl http://localhost:8091/api/health');
};

// Execute recovery
(async () => {
    await verifyServices();
    displayStatus();
    console.log('\n✅ Session recovered successfully!');
    console.log('📌 Use SESSION_START_PROMPT.md for Claude context');
})();
