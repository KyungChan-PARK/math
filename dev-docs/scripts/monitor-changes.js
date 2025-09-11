#!/usr/bin/env node
/**
 * Real-time project change monitor
 * Auto-updates documentation when development changes
 * Created: 2025-09-03
 */

import chokidar from 'chokidar';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

class ProjectMonitor {
    constructor() {
        this.watchPaths = [
            'C:\\palantir\\math\\server',
            'C:\\palantir\\math\\gesture-app',
            'C:\\palantir\\math\\ml',
            'C:\\palantir\\math\\cep-extension'
        ];
        
        this.migrationTracking = {
            uwebsockets: { path: 'server/uws-migration', progress: 15 },
            windowsML: { path: 'ml/windows-ml', progress: 30 },
            cepUxp: { path: 'cep-extension/abstraction', progress: 60 }
        };
    }

    async checkMigrationProgress() {
        const updates = {};
        
        // Check µWebSockets migration
        try {
            const result = await execAsync('git status server/uws-migration --porcelain', {
                cwd: 'C:\\palantir\\math'
            });
            if (result.stdout) {
                updates.uwebsockets = this.estimateProgress(result.stdout, 15);
            }
        } catch (e) {}
        
        // Check Windows ML migration
        try {
            const result = await execAsync('git status ml/windows-ml --porcelain', {
                cwd: 'C:\\palantir\\math'
            });
            if (result.stdout) {
                updates.windowsML = this.estimateProgress(result.stdout, 30);
            }
        } catch (e) {}
        
        return updates;
    }

    estimateProgress(gitOutput, currentProgress) {
        const lines = gitOutput.split('\n').filter(Boolean);
        const newFiles = lines.filter(l => l.startsWith('A ')).length;
        const modifiedFiles = lines.filter(l => l.startsWith('M ')).length;
        
        // Estimate progress based on activity
        const increment = (newFiles * 2 + modifiedFiles) * 0.5;
        return Math.min(currentProgress + increment, 100);
    }

    async updateDocs(changes) {
        console.log(' Updating documentation with changes:', changes);
        await execAsync('node scripts/force-update.js', {
            cwd: 'C:\\palantir\\math\\dev-docs'
        });
        
        // Update with specific migration progress
        if (Object.keys(changes).length > 0) {
            await this.updateMigrationStatus(changes);
        }
    }

    async updateMigrationStatus(changes) {
        const statusFile = 'C:\\palantir\\math\\dev-docs\\MIGRATION-STATUS.md';
        const { readFile, writeFile } = await import('fs/promises');
        
        let content = await readFile(statusFile, 'utf-8');
        
        for (const [key, value] of Object.entries(changes)) {
            const pattern = new RegExp(`${key}.*?(\\d+)%`, 'gi');
            content = content.replace(pattern, `${key}: ${Math.round(value)}%`);
        }
        
        await writeFile(statusFile, content, 'utf-8');
    }

    start() {
        console.log(' Starting project monitoring...');
        
        const watcher = chokidar.watch(this.watchPaths, {
            ignored: /node_modules|\.git/,
            persistent: true,
            ignoreInitial: true
        });
        
        watcher
            .on('add', path => this.handleChange('added', path))
            .on('change', path => this.handleChange('modified', path))
            .on('unlink', path => this.handleChange('deleted', path));
        
        // Check progress every 30 minutes
        setInterval(async () => {
            const changes = await this.checkMigrationProgress();
            if (Object.keys(changes).length > 0) {
                await this.updateDocs(changes);
            }
        }, 1800000);
    }

    async handleChange(event, filePath) {
        console.log(` ${event}: ${path.basename(filePath)}`);
        
        // Determine if this affects migration progress
        for (const [key, value] of Object.entries(this.migrationTracking)) {
            if (filePath.includes(value.path)) {
                const changes = await this.checkMigrationProgress();
                await this.updateDocs(changes);
                break;
            }
        }
    }
}

const monitor = new ProjectMonitor();
monitor.start();
