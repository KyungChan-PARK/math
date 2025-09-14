/**
 * Auto Document Sync Watcher
 * Monitors and auto-updates documentation in real-time
 */

import fs from 'fs/promises';
import path from 'path';
import chokidar from 'chokidar';
import crypto from 'crypto';

class AutoDocSyncWatcher {
    constructor() {
        this.projectRoot = 'C:\\palantir\\math';
        this.checksums = new Map();
        this.updateQueue = [];
        this.isProcessing = false;
        
        // Critical documents to monitor
        this.criticalDocs = [
            '.checkpoint.json',
            'MASTER_SESSION_PROMPT.md',
            'PROBLEM_SOLVING_GUIDE.md',
            'orchestration/claude-api-orchestrator.js',
            'orchestration/advanced-mcp-orchestrator.js'
        ];
        
        this.init();
    }
    
    async init() {
        console.log(' Starting Auto Document Sync Watcher');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Create initial checksums
        await this.createChecksums();
        
        // Setup file watcher
        this.setupWatcher();
        
        // Start processing loop
        setInterval(() => this.processQueue(), 5000);
        
        console.log('✅ Auto sync watcher is running');
        console.log(` Monitoring ${this.criticalDocs.length} critical files\n`);
    }
    
    async createChecksums() {
        for (const doc of this.criticalDocs) {
            const fullPath = path.join(this.projectRoot, doc);
            try {
                const content = await fs.readFile(fullPath, 'utf-8');
                const checksum = crypto.createHash('sha256')
                    .update(content)
                    .digest('hex');
                this.checksums.set(doc, checksum);
            } catch (error) {
                console.warn(`️ Cannot access ${doc}`);
            }
        }
    }
    
    setupWatcher() {
        const watchPaths = this.criticalDocs.map(doc => 
            path.join(this.projectRoot, doc)
        );
        
        this.watcher = chokidar.watch(watchPaths, {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 1000,
                pollInterval: 100
            }
        });
        
        this.watcher.on('change', (filePath) => {
            const relativePath = path.relative(this.projectRoot, filePath);
            console.log(` Changed: ${relativePath}`);
            this.handleChange(relativePath);
        });
    }
    
    async handleChange(relativePath) {
        const fullPath = path.join(this.projectRoot, relativePath);
        
        try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const newChecksum = crypto.createHash('sha256')
                .update(content)
                .digest('hex');
            
            const oldChecksum = this.checksums.get(relativePath);
            
            if (newChecksum !== oldChecksum) {
                this.checksums.set(relativePath, newChecksum);
                this.queueUpdate(relativePath);
            }
        } catch (error) {
            console.error(`❌ Error handling change: ${error.message}`);
        }
    }
    
    queueUpdate(filePath) {
        if (!this.updateQueue.includes(filePath)) {
            this.updateQueue.push(filePath);
            console.log(`  ➕ Queued for update: ${filePath}`);
        }
    }
    
    async processQueue() {
        if (this.isProcessing || this.updateQueue.length === 0) return;
        
        this.isProcessing = true;
        const updates = [...this.updateQueue];
        this.updateQueue = [];
        
        console.log(`\n️ Processing ${updates.length} updates...`);
        
        for (const filePath of updates) {
            await this.processUpdate(filePath);
        }
        
        this.isProcessing = false;
    }
    
    async processUpdate(filePath) {
        console.log(`   Processing: ${filePath}`);
        
        // Update related documentation
        if (filePath.includes('orchestration')) {
            await this.updateOrchestrationDocs();
        } else if (filePath === '.checkpoint.json') {
            await this.updateStatusDocs();
        } else if (filePath.includes('PROMPT') || filePath.includes('GUIDE')) {
            await this.validateConsistency();
        }
        
        console.log(`  ✅ Update complete: ${filePath}`);
    }
    
    async updateOrchestrationDocs() {
        // Update API documentation when orchestration changes
        console.log('     Updating API documentation...');
        
        const timestamp = new Date().toISOString();
        const updateNote = `\n\n## Auto-Update Note\nLast synchronized: ${timestamp}\nOrchestration system optimized with parallel Claude API processing.\n`;
        
        try {
            const apiDocPath = path.join(this.projectRoot, 'API_DOCUMENTATION.md');
            const content = await fs.readFile(apiDocPath, 'utf-8');
            
            if (!content.includes('Auto-Update Note')) {
                await fs.appendFile(apiDocPath, updateNote);
                console.log('    ✓ API documentation updated');
            }
        } catch (error) {
            console.log('    ️ Could not update API docs');
        }
    }
    
    async updateStatusDocs() {
        // Update status reports when checkpoint changes
        console.log('     Updating status reports...');
        
        try {
            const checkpoint = JSON.parse(
                await fs.readFile(path.join(this.projectRoot, '.checkpoint.json'), 'utf-8')
            );
            
            const statusReport = {
                timestamp: new Date().toISOString(),
                current_task: checkpoint.current_task,
                progress: checkpoint.active_migrations?.MediaPipe?.progress || 0,
                integration_status: checkpoint.integration_status,
                auto_sync: 'active'
            };
            
            await fs.writeFile(
                path.join(this.projectRoot, 'AUTO_SYNC_STATUS.json'),
                JSON.stringify(statusReport, null, 2)
            );
            
            console.log('    ✓ Status reports updated');
        } catch (error) {
            console.log('    ️ Could not update status');
        }
    }
    
    async validateConsistency() {
        // Validate documentation consistency
        console.log('     Validating documentation consistency...');
        
        const issues = [];
        
        // Check for outdated references
        for (const doc of this.criticalDocs) {
            if (!doc.endsWith('.md')) continue;
            
            try {
                const content = await fs.readFile(
                    path.join(this.projectRoot, doc), 
                    'utf-8'
                );
                
                if (content.includes('multi-claude-orchestrator.js')) {
                    issues.push(`${doc}: Contains outdated WebSocket reference`);
                }
                
                if (content.includes('TODO') || content.includes('FIXME')) {
                    issues.push(`${doc}: Contains TODO/FIXME markers`);
                }
            } catch (error) {
                // Skip if file not accessible
            }
        }
        
        if (issues.length > 0) {
            console.log('    ️ Consistency issues found:');
            issues.forEach(issue => console.log(`      - ${issue}`));
            
            // Save issues to file
            await fs.writeFile(
                path.join(this.projectRoot, 'CONSISTENCY_ISSUES.json'),
                JSON.stringify({ 
                    timestamp: new Date().toISOString(),
                    issues 
                }, null, 2)
            );
        } else {
            console.log('    ✓ Documentation is consistent');
        }
    }
}

// Start the watcher
const watcher = new AutoDocSyncWatcher();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n Stopping auto sync watcher...');
    if (watcher.watcher) {
        watcher.watcher.close();
    }
    process.exit(0);
});

export default AutoDocSyncWatcher;