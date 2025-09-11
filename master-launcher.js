#!/usr/bin/env node

/**
 * Palantir Math - Master Launcher
 * 모든 시스템 통합 실행 및 관리
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MasterLauncher {
    constructor() {
        this.projectRoot = __dirname;
        this.processes = new Map();
        this.systemStatus = {
            orchestrator: false,
            websocket: false,
            monitoring: false,
            selfImprovement: false,
            collaboration: false,
            mediapipe: false
        };
        
        this.config = {
            ports: {
                orchestrator: 8093,
                websocket: 8094,
                monitoring: 8095,
                mediapipe: 8096
            },
            autoStart: ['monitoring'],
            logLevel: 'info'
        };
    }
    
    async start() {
        console.clear();
        this.displayBanner();
        await this.checkPrerequisites();
        await this.showMainMenu();
    }
    
    displayBanner() {
        console.log(chalk.cyan('═══════════════════════════════════════════════════════════════════'));
        console.log(chalk.cyan('║                                                                 ║'));
        console.log(chalk.cyan('║') + chalk.yellow.bold('              PALANTIR MATH - MASTER CONTROL                    ') + chalk.cyan('║'));
        console.log(chalk.cyan('║') + chalk.gray('           AI-Powered Mathematics Education Platform            ') + chalk.cyan('║'));
        console.log(chalk.cyan('║') + chalk.gray('              Claude + Qwen + Ontology Integration              ') + chalk.cyan('║'));
        console.log(chalk.cyan('║                                                                 ║'));
        console.log(chalk.cyan('═══════════════════════════════════════════════════════════════════'));
        console.log();
    }
    
    async checkPrerequisites() {
        console.log(chalk.magenta.bold('🔍 CHECKING PREREQUISITES'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        const checks = [
            { name: 'Node.js', command: 'node --version', required: true },
            { name: 'Python', command: 'python --version', required: true },
            { name: 'Neo4j', command: 'neo4j version', required: false },
            { name: 'After Effects', command: 'afterfx --version', required: false }
        ];
        
        for (const check of checks) {
            const result = await this.checkCommand(check.command);
            if (result) {
                console.log(chalk.green(`  ✓ ${check.name} installed`));
            } else if (check.required) {
                console.log(chalk.red(`  ✗ ${check.name} not found (required)`));
            } else {
                console.log(chalk.yellow(`  ○ ${check.name} not found (optional)`));
            }
        }
        
        // Check critical files
        const criticalFiles = [
            'package.json',
            'palantir-ontology.js',
            'orchestration/qwen-orchestrator-enhanced.js'
        ];
        
        console.log();
        console.log(chalk.magenta.bold('📁 CHECKING PROJECT FILES'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        for (const file of criticalFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                console.log(chalk.green(`  ✓ ${file}`));
            } else {
                console.log(chalk.yellow(`  ○ ${file} not found`));
            }
        }
        
        console.log();
    }
    
    async checkCommand(command) {
        return new Promise(resolve => {
            const [cmd, ...args] = command.split(' ');
            const child = spawn(cmd, args, { 
                shell: true,
                stdio: 'ignore',
                windowsHide: true
            });
            
            child.on('error', () => resolve(false));
            child.on('exit', code => resolve(code === 0));
        });
    }
    
    async showMainMenu() {
        const choices = [
            new inquirer.Separator(chalk.cyan('═══ System Control ═══')),
            { name: '🚀 Start All Systems', value: 'start-all' },
            { name: '⚡ Quick Start (Essential Only)', value: 'quick-start' },
            { name: '🔧 Custom Start', value: 'custom-start' },
            new inquirer.Separator(chalk.cyan('═══ Individual Systems ═══')),
            { name: '🎯 Qwen Orchestrator', value: 'orchestrator' },
            { name: '📊 Monitoring Dashboard', value: 'monitoring' },
            { name: '🔄 Self-Improvement System', value: 'self-improvement' },
            { name: '🤝 Collaboration Pipeline', value: 'collaboration' },
            { name: '👋 MediaPipe Server', value: 'mediapipe' },
            new inquirer.Separator(chalk.cyan('═══ Maintenance ═══')),
            { name: '🧹 Run File Cleanup', value: 'cleanup' },
            { name: '📈 View System Status', value: 'status' },
            { name: '📝 Generate Report', value: 'report' },
            { name: '🔄 Refresh Ontology', value: 'refresh-ontology' },
            new inquirer.Separator(),
            { name: '❌ Exit', value: 'exit' }
        ];
        
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Select an action:',
                choices,
                pageSize: 20
            }
        ]);
        
        await this.handleAction(action);
    }
    
    async handleAction(action) {
        console.log();
        
        switch (action) {
            case 'start-all':
                await this.startAllSystems();
                break;
            case 'quick-start':
                await this.quickStart();
                break;
            case 'custom-start':
                await this.customStart();
                break;
            case 'orchestrator':
                await this.toggleSystem('orchestrator');
                break;
            case 'monitoring':
                await this.toggleSystem('monitoring');
                break;
            case 'self-improvement':
                await this.toggleSystem('selfImprovement');
                break;
            case 'collaboration':
                await this.toggleSystem('collaboration');
                break;
            case 'mediapipe':
                await this.toggleSystem('mediapipe');
                break;
            case 'cleanup':
                await this.runCleanup();
                break;
            case 'status':
                await this.showStatus();
                break;
            case 'report':
                await this.generateReport();
                break;
            case 'refresh-ontology':
                await this.refreshOntology();
                break;
            case 'exit':
                await this.shutdown();
                return;
        }
        
        console.log();
        console.log(chalk.gray('Press any key to return to menu...'));
        await this.waitForKeypress();
        await this.showMainMenu();
    }
    
    async startAllSystems() {
        console.log(chalk.cyan.bold('🚀 STARTING ALL SYSTEMS'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        const systems = [
            { name: 'Monitoring Dashboard', key: 'monitoring', command: 'node monitoring-dashboard.js' },
            { name: 'Qwen Orchestrator', key: 'orchestrator', command: 'node orchestration/qwen-orchestrator-enhanced.js' },
            { name: 'Self-Improvement', key: 'selfImprovement', command: 'node self-improvement-system.js' },
            { name: 'Collaboration Pipeline', key: 'collaboration', command: 'node collaboration-pipeline.js' },
            { name: 'MediaPipe Server', key: 'mediapipe', command: 'python gesture/mediapipe_server.py' }
        ];
        
        for (const system of systems) {
            await this.startSystem(system.key, system.command, system.name);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between starts
        }
        
        console.log();
        console.log(chalk.green.bold('✅ All systems started successfully!'));
        console.log();
        console.log(chalk.cyan('Access points:'));
        console.log(chalk.gray(`  • Monitoring: http://localhost:${this.config.ports.monitoring}`));
        console.log(chalk.gray(`  • WebSocket: ws://localhost:${this.config.ports.websocket}`));
        console.log(chalk.gray(`  • Orchestrator: http://localhost:${this.config.ports.orchestrator}`));
    }
    
    async quickStart() {
        console.log(chalk.cyan.bold('⚡ QUICK START - ESSENTIAL SYSTEMS'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        await this.startSystem('monitoring', 'node monitoring-dashboard.js', 'Monitoring Dashboard');
        await this.startSystem('orchestrator', 'node orchestration/qwen-orchestrator-enhanced.js', 'Qwen Orchestrator');
        
        console.log();
        console.log(chalk.green.bold('✅ Essential systems started!'));
        console.log(chalk.gray(`  • Access dashboard at: http://localhost:${this.config.ports.monitoring}`));
    }
    
    async customStart() {
        const { systems } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'systems',
                message: 'Select systems to start:',
                choices: [
                    { name: 'Monitoring Dashboard', value: 'monitoring', checked: true },
                    { name: 'Qwen Orchestrator', value: 'orchestrator', checked: true },
                    { name: 'Self-Improvement System', value: 'selfImprovement' },
                    { name: 'Collaboration Pipeline', value: 'collaboration' },
                    { name: 'MediaPipe Server', value: 'mediapipe' }
                ]
            }
        ]);
        
        console.log();
        
        const systemMap = {
            monitoring: { command: 'node monitoring-dashboard.js', name: 'Monitoring Dashboard' },
            orchestrator: { command: 'node orchestration/qwen-orchestrator-enhanced.js', name: 'Qwen Orchestrator' },
            selfImprovement: { command: 'node self-improvement-system.js', name: 'Self-Improvement' },
            collaboration: { command: 'node collaboration-pipeline.js', name: 'Collaboration Pipeline' },
            mediapipe: { command: 'python gesture/mediapipe_server.py', name: 'MediaPipe Server' }
        };
        
        for (const sys of systems) {
            const config = systemMap[sys];
            await this.startSystem(sys, config.command, config.name);
        }
        
        console.log();
        console.log(chalk.green.bold('✅ Selected systems started!'));
    }
    
    async startSystem(key, command, name) {
        if (this.systemStatus[key]) {
            console.log(chalk.yellow(`  ○ ${name} already running`));
            return;
        }
        
        console.log(chalk.blue(`  Starting ${name}...`));
        
        const [cmd, ...args] = command.split(' ');
        const child = spawn(cmd, args, {
            cwd: this.projectRoot,
            shell: true,
            detached: false,
            stdio: 'ignore',
            windowsHide: true
        });
        
        child.on('error', (error) => {
            console.log(chalk.red(`  ✗ Failed to start ${name}: ${error.message}`));
        });
        
        child.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                console.log(chalk.red(`  ✗ ${name} exited with code ${code}`));
            }
            this.systemStatus[key] = false;
            this.processes.delete(key);
        });
        
        this.processes.set(key, child);
        this.systemStatus[key] = true;
        
        console.log(chalk.green(`  ✓ ${name} started (PID: ${child.pid})`));
    }
    
    async toggleSystem(key) {
        const systemMap = {
            monitoring: { command: 'node monitoring-dashboard.js', name: 'Monitoring Dashboard' },
            orchestrator: { command: 'node orchestration/qwen-orchestrator-enhanced.js', name: 'Qwen Orchestrator' },
            selfImprovement: { command: 'node self-improvement-system.js', name: 'Self-Improvement' },
            collaboration: { command: 'node collaboration-pipeline.js', name: 'Collaboration Pipeline' },
            mediapipe: { command: 'python gesture/mediapipe_server.py', name: 'MediaPipe Server' }
        };
        
        const config = systemMap[key];
        
        if (this.systemStatus[key]) {
            // Stop the system
            const process = this.processes.get(key);
            if (process) {
                console.log(chalk.yellow(`Stopping ${config.name}...`));
                process.kill();
                this.processes.delete(key);
                this.systemStatus[key] = false;
                console.log(chalk.green(`✓ ${config.name} stopped`));
            }
        } else {
            // Start the system
            await this.startSystem(key, config.command, config.name);
        }
    }
    
    async runCleanup() {
        console.log(chalk.cyan.bold('🧹 RUNNING FILE CLEANUP'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        const cleanupScript = path.join(this.projectRoot, 'file-cleanup-analyzer.cjs');
        
        if (!fs.existsSync(cleanupScript)) {
            console.log(chalk.red('  ✗ Cleanup script not found'));
            console.log(chalk.gray('    Please ensure file-cleanup-analyzer.cjs is in the project root'));
            return;
        }
        
        console.log(chalk.blue('  Running analysis...'));
        
        const child = spawn('node', [cleanupScript], {
            cwd: this.projectRoot,
            stdio: 'inherit'
        });
        
        await new Promise(resolve => {
            child.on('exit', resolve);
        });
        
        console.log(chalk.green('  ✓ Cleanup analysis complete'));
        console.log(chalk.gray('    Check FILE_CLEANUP_PLAN.json for details'));
    }
    
    async showStatus() {
        console.log(chalk.cyan.bold('📈 SYSTEM STATUS'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        const systems = [
            { name: 'Monitoring Dashboard', key: 'monitoring', port: this.config.ports.monitoring },
            { name: 'Qwen Orchestrator', key: 'orchestrator', port: this.config.ports.orchestrator },
            { name: 'WebSocket Server', key: 'websocket', port: this.config.ports.websocket },
            { name: 'Self-Improvement', key: 'selfImprovement', port: null },
            { name: 'Collaboration Pipeline', key: 'collaboration', port: null },
            { name: 'MediaPipe Server', key: 'mediapipe', port: this.config.ports.mediapipe }
        ];
        
        for (const system of systems) {
            let status = 'Stopped';
            let indicator = chalk.red('●');
            
            if (this.systemStatus[system.key]) {
                status = 'Running';
                indicator = chalk.green('●');
                const process = this.processes.get(system.key);
                if (process) {
                    status += ` (PID: ${process.pid})`;
                }
            } else if (system.port) {
                // Check if running externally
                const isRunning = await this.checkPort(system.port);
                if (isRunning) {
                    status = 'Running (external)';
                    indicator = chalk.yellow('●');
                }
            }
            
            console.log(`  ${indicator} ${system.name.padEnd(25)} ${status}`);
        }
        
        // Project metrics
        console.log();
        console.log(chalk.cyan.bold('📊 PROJECT METRICS'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        try {
            const stateFile = path.join(this.projectRoot, 'PROJECT_CURRENT_STATE.json');
            if (fs.existsSync(stateFile)) {
                const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
                console.log(chalk.gray(`  Last session: ${state.lastSession || 'Unknown'}`));
                console.log(chalk.gray(`  Health: ${state.health || 'Unknown'}`));
            }
            
            const ontologyReport = path.join(this.projectRoot, 'ONTOLOGY_REPORT.json');
            if (fs.existsSync(ontologyReport)) {
                const report = JSON.parse(fs.readFileSync(ontologyReport, 'utf-8'));
                console.log(chalk.gray(`  Files analyzed: ${report.analyzedFiles}/${report.totalFiles}`));
                console.log(chalk.gray(`  Complexity: ${report.complexity}`));
            }
        } catch (error) {
            console.log(chalk.yellow('  Unable to load project metrics'));
        }
    }
    
    async checkPort(port) {
        return new Promise(resolve => {
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
    }
    
    async generateReport() {
        console.log(chalk.cyan.bold('📝 GENERATING COMPREHENSIVE REPORT'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        const report = {
            timestamp: new Date().toISOString(),
            project: 'Palantir Math',
            version: '2.0',
            systems: {},
            metrics: {},
            recommendations: []
        };
        
        // Collect system status
        Object.keys(this.systemStatus).forEach(key => {
            report.systems[key] = {
                status: this.systemStatus[key] ? 'active' : 'inactive',
                process: this.processes.has(key) ? this.processes.get(key).pid : null
            };
        });
        
        // Load various reports
        const reportFiles = [
            'PROJECT_CURRENT_STATE.json',
            'ONTOLOGY_REPORT.json',
            'FILE_CLEANUP_PLAN.json',
            'COLLABORATION_HISTORY.json',
            'SELF_IMPROVEMENT_STATE.json'
        ];
        
        for (const file of reportFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    report.metrics[file.replace('.json', '')] = data;
                    console.log(chalk.green(`  ✓ Loaded ${file}`));
                } catch (error) {
                    console.log(chalk.yellow(`  ○ Failed to load ${file}`));
                }
            }
        }
        
        // Generate recommendations
        if (report.metrics.ONTOLOGY_REPORT?.health?.score < 80) {
            report.recommendations.push({
                type: 'health',
                priority: 'high',
                message: 'Project health below optimal. Run cleanup and optimization.'
            });
        }
        
        if (!this.systemStatus.orchestrator) {
            report.recommendations.push({
                type: 'system',
                priority: 'medium',
                message: 'Qwen orchestrator not running. Start for full AI collaboration.'
            });
        }
        
        // Save report
        const reportPath = path.join(this.projectRoot, 'MASTER_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log();
        console.log(chalk.green.bold('✅ Report generated: MASTER_REPORT.json'));
        
        // Display summary
        console.log();
        console.log(chalk.cyan('Summary:'));
        console.log(chalk.gray(`  • Active systems: ${Object.values(this.systemStatus).filter(s => s).length}/${Object.keys(this.systemStatus).length}`));
        console.log(chalk.gray(`  • Recommendations: ${report.recommendations.length}`));
        
        if (report.recommendations.length > 0) {
            console.log();
            console.log(chalk.yellow('Top recommendations:'));
            report.recommendations.slice(0, 3).forEach(rec => {
                console.log(chalk.gray(`  • ${rec.message}`));
            });
        }
    }
    
    async refreshOntology() {
        console.log(chalk.cyan.bold('🔄 REFRESHING ONTOLOGY'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        const ontologyScript = path.join(this.projectRoot, 'palantir-ontology.js');
        
        if (!fs.existsSync(ontologyScript)) {
            console.log(chalk.red('  ✗ Ontology script not found'));
            return;
        }
        
        console.log(chalk.blue('  Running ontology refresh...'));
        
        const child = spawn('node', [ontologyScript, 'refresh'], {
            cwd: this.projectRoot,
            stdio: 'inherit'
        });
        
        await new Promise(resolve => {
            child.on('exit', resolve);
        });
        
        console.log(chalk.green('  ✓ Ontology refreshed'));
    }
    
    async waitForKeypress() {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        return new Promise(resolve => {
            process.stdin.once('data', () => {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                resolve();
            });
        });
    }
    
    async shutdown() {
        console.log();
        console.log(chalk.yellow.bold('🛑 SHUTTING DOWN'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        // Stop all running processes
        for (const [key, process] of this.processes) {
            const systemName = key.charAt(0).toUpperCase() + key.slice(1);
            console.log(chalk.yellow(`  Stopping ${systemName}...`));
            process.kill();
        }
        
        console.log();
        console.log(chalk.green('✅ All systems stopped'));
        console.log(chalk.gray('Goodbye! 👋'));
        
        process.exit(0);
    }
}

// Run the launcher
const launcher = new MasterLauncher();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await launcher.shutdown();
});

process.on('SIGTERM', async () => {
    await launcher.shutdown();
});

// Start
launcher.start().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
});
