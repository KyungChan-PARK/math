#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios').default;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class SessionInitializer {
    constructor() {
        this.projectRoot = __dirname;
        this.version = '4.1.0';
        this.checkpoints = [];
        this.errors = [];
    }

    async initialize() {
        const startTime = Date.now();
        
        // Core files check
        await this.checkFile('CLAUDE_MASTER_CONTEXT.json');
        await this.checkFile('ontology-state.json');
        await this.checkFile('SESSION_INIT_REPORT.md');
        await this.checkFile('OPTIMIZATION_COMPLETE_REPORT.md');
        await this.checkFile('NEXT_PHASE_COMPLETE_REPORT.md');
        
        // API endpoints check
        await this.checkAPI('http://localhost:8095/api/status', 'Monitoring Dashboard');
        await this.checkAPI('http://localhost:8096/api/status', 'Enhanced System');
        await this.checkAPI('http://localhost:8093/api/agents', 'Qwen Orchestrator');
        
        // Process check
        await this.checkProcesses();
        
        // Generate checkpoint
        const checkpoint = {
            timestamp: new Date().toISOString(),
            version: this.version,
            duration: Date.now() - startTime,
            checks: this.checkpoints,
            errors: this.errors,
            status: this.errors.length === 0 ? 'READY' : 'ISSUES_FOUND'
        };
        
        await fs.writeFile(
            path.join(this.projectRoot, 'SESSION_CHECKPOINT.json'),
            JSON.stringify(checkpoint, null, 2)
        );
        
        return checkpoint;
    }

    async checkFile(filename) {
        try {
            const filePath = path.join(this.projectRoot, filename);
            const stats = await fs.stat(filePath);
            this.checkpoints.push({
                type: 'file',
                name: filename,
                status: 'OK',
                size: stats.size
            });
        } catch (error) {
            this.errors.push({
                type: 'file',
                name: filename,
                error: 'NOT_FOUND'
            });
        }
    }

    async checkAPI(url, name) {
        try {
            const response = await axios.get(url, { timeout: 3000 });
            this.checkpoints.push({
                type: 'api',
                name: name,
                url: url,
                status: 'ACTIVE'
            });
        } catch (error) {
            this.errors.push({
                type: 'api',
                name: name,
                url: url,
                error: 'UNREACHABLE'
            });
        }
    }

    async checkProcesses() {
        try {
            const { stdout } = await execPromise('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
            const lines = stdout.split('\n').filter(line => line.includes('node.exe'));
            this.checkpoints.push({
                type: 'process',
                name: 'Node.js',
                count: lines.length,
                status: 'RUNNING'
            });
        } catch (error) {
            this.errors.push({
                type: 'process',
                error: 'CHECK_FAILED'
            });
        }
    }
}

// Run initializer
(async () => {
    const init = new SessionInitializer();
    const result = await init.initialize();
    
    // Silent output - only checkpoint file
    if (result.status === 'READY') {
        process.exit(0);
    } else {
        process.exit(1);
    }
})();