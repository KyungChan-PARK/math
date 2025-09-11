// Unified System Launcher for Claude Opus 4.1
// All-in-one control system

import { spawn } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';

class UnifiedLauncher {
    constructor() {
        this.processes = new Map();
        this.services = {
            orchestrator: {
                name: '75 AI Agents Orchestrator',
                command: 'node',
                args: ['orchestration/claude-orchestrator-75.js'],
                port: 8091
            },
            lola: {
                name: 'LOLA Intent System',
                command: 'cmd',
                args: ['/c', 'scripts\\start-lola-intent.bat'],
                port: 8086
            },
            documentMonitor: {
                name: 'Document Self-Improvement',
                command: 'node',
                args: ['document-self-improvement-v2.js'],
                port: null
            },
            gestureService: {
                name: 'Gesture Recognition',
                command: 'python',
                args: ['gesture-service/gesture_detection_service.py'],
                port: 5000
            }
        };
    }

    async start() {
        console.log(chalk.cyan.bold(`
╔════════════════════════════════════════════════════════╗
║     Claude Opus 4.1 - Unified System Launcher         ║
║     Math Learning Platform v5.0.0                     ║
╚════════════════════════════════════════════════════════╝
        `));

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Select action:',
                choices: [
                    '🚀 Start All Services',
                    '🤖 Start AI Orchestrator Only',
                    '📚 Start LOLA System Only',
                    '📄 Start Document Monitor Only',
                    '✋ Start Gesture Service Only',
                    '📊 Check System Status',
                    '🛑 Stop All Services',
                    '❌ Exit'
                ]
            }
        ]);

        switch (action) {
            case '🚀 Start All Services':
                await this.startAll();
                break;
            case '🤖 Start AI Orchestrator Only':
                await this.startService('orchestrator');
                break;
            case '📚 Start LOLA System Only':
                await this.startService('lola');
                break;
            case '📄 Start Document Monitor Only':
                await this.startService('documentMonitor');
                break;
            case '✋ Start Gesture Service Only':
                await this.startService('gestureService');
                break;
            case '📊 Check System Status':
                await this.checkStatus();
                break;
            case '🛑 Stop All Services':
                await this.stopAll();
                break;
            case '❌ Exit':
                process.exit(0);
        }

        // Continue menu
        setTimeout(() => this.start(), 2000);
    }

    async startAll() {
        console.log(chalk.green('\n🚀 Starting all services...\n'));
        
        for (const [key, service] of Object.entries(this.services)) {
            await this.startService(key);
            await this.sleep(2000); // Wait between services
        }
        
        console.log(chalk.green.bold('\n✅ All services started successfully!\n'));
        this.displayStatus();
    }

    async startService(serviceName) {
        const service = this.services[serviceName];
        
        if (this.processes.has(serviceName)) {
            console.log(chalk.yellow(`⚠️ ${service.name} is already running`));
            return;
        }

        console.log(chalk.blue(`Starting ${service.name}...`));
        
        try {
            const proc = spawn(service.command, service.args, {
                cwd: 'C:\\palantir\\math',
                shell: true,
                detached: false
            });

            proc.stdout.on('data', (data) => {
                console.log(chalk.gray(`[${serviceName}] ${data}`));
            });

            proc.stderr.on('data', (data) => {
                console.error(chalk.red(`[${serviceName}] ${data}`));
            });

            proc.on('close', (code) => {
                console.log(chalk.yellow(`${service.name} exited with code ${code}`));
                this.processes.delete(serviceName);
            });

            this.processes.set(serviceName, proc);
            console.log(chalk.green(`✅ ${service.name} started`));
            
            if (service.port) {
                console.log(chalk.cyan(`   Available at: http://localhost:${service.port}`));
            }
        } catch (error) {
            console.error(chalk.red(`Failed to start ${service.name}:`, error.message));
        }
    }

    async stopAll() {
        console.log(chalk.red('\n🛑 Stopping all services...\n'));
        
        for (const [name, proc] of this.processes) {
            console.log(chalk.yellow(`Stopping ${this.services[name].name}...`));
            proc.kill();
            this.processes.delete(name);
        }
        
        console.log(chalk.green('\n✅ All services stopped\n'));
    }

    async checkStatus() {
        console.log(chalk.cyan('\n📊 System Status:\n'));
        
        for (const [key, service] of Object.entries(this.services)) {
            const running = this.processes.has(key);
            const status = running ? chalk.green('● RUNNING') : chalk.red('○ STOPPED');
            console.log(`${status} ${service.name}`);
            
            if (running && service.port) {
                console.log(chalk.gray(`         http://localhost:${service.port}`));
            }
        }
        
        console.log(chalk.cyan('\n📈 System Metrics:'));
        console.log(chalk.gray(`   Active Processes: ${this.processes.size}`));
        console.log(chalk.gray(`   Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`));
        console.log(chalk.gray(`   Uptime: ${(process.uptime() / 60).toFixed(2)} minutes`));
    }

    displayStatus() {
        const status = `
╔════════════════════════════════════════════════════════╗
║                    SYSTEM ACTIVE                      ║
╠════════════════════════════════════════════════════════╣
║ 🤖 AI Agents:        http://localhost:8091           ║
║ 📚 LOLA System:      http://localhost:8086           ║
║ ✋ Gesture Service:  http://localhost:5000           ║
║ 📄 Document Monitor: Active (Background)              ║
╚════════════════════════════════════════════════════════╝
        `;
        console.log(chalk.green(status));
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start the launcher
const launcher = new UnifiedLauncher();
launcher.start().catch(console.error);

export default UnifiedLauncher;