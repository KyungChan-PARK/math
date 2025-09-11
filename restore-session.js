// Session Context Restorer
// 새로운 대화 세션 시작 시 프로젝트 컨텍스트를 빠르게 복원

import ProjectStateManager from './project-state-manager.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SessionContextRestorer {
    constructor() {
        this.stateManager = new ProjectStateManager();
        this.state = this.stateManager.currentState;
    }
    
    // 세션 시작 시 실행할 메인 함수
    async restoreSession() {
        console.clear();
        this.printHeader();
        
        // 1. 프로젝트 개요 표시
        this.showProjectOverview();
        
        // 2. 현재 작업 상태 표시
        this.showCurrentWork();
        
        // 3. 인프라 상태 확인
        await this.checkInfrastructure();
        
        // 4. 최근 활동 표시
        this.showRecentActivities();
        
        // 5. 열린 이슈 표시
        this.showOpenIssues();
        
        // 6. 다음 단계 제안
        this.suggestNextSteps();
        
        // 7. 빠른 명령어 표시
        this.showQuickCommands();
        
        // 8. 상태 파일 생성
        this.generateContextFile();
        
        return this.state;
    }
    
    printHeader() {
        console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║                                                              ║'));
        console.log(chalk.cyan('║') + chalk.yellow.bold('             PALANTIR MATH PROJECT RESTORED                  ') + chalk.cyan('║'));
        console.log(chalk.cyan('║                                                              ║'));
        console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════╝'));
        console.log();
    }
    
    showProjectOverview() {
        const project = this.state.project;
        const phase = this.state.currentPhase;
        
        console.log(chalk.magenta.bold('📁 PROJECT OVERVIEW'));
        console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.gray('Name:        ') + chalk.white.bold(project.name));
        console.log(chalk.gray('Version:     ') + chalk.white(project.version));
        console.log(chalk.gray('Started:     ') + chalk.white(project.startDate));
        console.log(chalk.gray('Last Active: ') + chalk.white(project.lastUpdated));
        console.log(chalk.gray('Phase:       ') + chalk.yellow(`${phase.name} (${phase.completionPercentage}%)`));
        
        if (phase.activeTask) {
            console.log(chalk.gray('Active Task: ') + chalk.green(phase.activeTask));
        }
        
        console.log();
    }
    
    showCurrentWork() {
        const inProgress = this.state.components.inProgress;
        
        if (inProgress.length === 0) return;
        
        console.log(chalk.magenta.bold('🚧 CURRENT WORK IN PROGRESS'));
        console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        inProgress.forEach(component => {
            const progressBar = this.createProgressBar(component.progress);
            console.log(chalk.yellow(`\n${component.name}`));
            console.log(progressBar + chalk.gray(` ${component.progress}%`));
            
            if (component.nextSteps && component.nextSteps.length > 0) {
                console.log(chalk.gray('Next: ') + chalk.white(component.nextSteps[0]));
            }
            
            if (component.blockers && component.blockers.length > 0) {
                console.log(chalk.red('⚠️ Blocked: ') + component.blockers[0]);
            }
        });
        
        console.log();
    }
    
    async checkInfrastructure() {
        console.log(chalk.magenta.bold('🏗️ INFRASTRUCTURE STATUS'));
        console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        // 데이터베이스 상태
        console.log(chalk.blue('\n📊 Databases:'));
        for (const [name, db] of Object.entries(this.state.infrastructure.databases)) {
            const status = db.status === 'CONNECTED' 
                ? chalk.green('● CONNECTED') 
                : chalk.red('● DISCONNECTED');
            console.log(`  ${name}: ${status}`);
        }
        
        // 서버 상태
        console.log(chalk.blue('\n🖥️ Servers:'));
        for (const [name, server] of Object.entries(this.state.infrastructure.servers)) {
            const status = server.status === 'RUNNING'
                ? chalk.green('● RUNNING')
                : chalk.yellow('● STOPPED');
            console.log(`  ${name}: ${status} (port ${server.port})`);
        }
        
        // AI 모델 상태
        console.log(chalk.blue('\n🤖 AI Models:'));
        console.log(`  Claude: ${chalk.green('✓')} ${this.state.infrastructure.ai.claude.model}`);
        console.log(`  Qwen:   ${chalk.green('✓')} ${this.state.infrastructure.ai.qwen.model}`);
        console.log(`  Collab: ${this.state.infrastructure.ai.collaboration.enabled ? chalk.green('✓ Enabled') : chalk.red('✗ Disabled')}`);
        
        // 실제 서버 상태 확인
        await this.checkActualServerStatus();
        
        console.log();
    }
    
    async checkActualServerStatus() {
        console.log(chalk.blue('\n🔍 Checking actual server status...'));
        
        try {
            // Orchestrator 서버 확인
            const { stdout } = await execAsync('netstat -ano | findstr :8093');
            if (stdout.includes('LISTENING')) {
                console.log(chalk.green('  ✓ Orchestrator is actually running on :8093'));
            } else {
                console.log(chalk.yellow('  ⚠️ Orchestrator not detected on :8093'));
                console.log(chalk.gray('    Run: node orchestration/qwen-orchestrator-enhanced.js'));
            }
        } catch (error) {
            console.log(chalk.yellow('  ⚠️ Orchestrator not running'));
            console.log(chalk.gray('    Run: node orchestration/qwen-orchestrator-enhanced.js'));
        }
    }
    
    showRecentActivities() {
        const activities = this.state.recentActivities.slice(0, 5);
        
        if (activities.length === 0) return;
        
        console.log(chalk.magenta.bold('📝 RECENT ACTIVITIES'));
        console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        activities.forEach(activity => {
            const time = new Date(activity.timestamp).toLocaleString();
            console.log(chalk.gray(time) + ' - ' + chalk.white(activity.activity));
        });
        
        console.log();
    }
    
    showOpenIssues() {
        const issues = this.state.issues.open;
        
        if (issues.length === 0) {
            console.log(chalk.green.bold('✅ NO OPEN ISSUES'));
            console.log();
            return;
        }
        
        console.log(chalk.red.bold('⚠️ OPEN ISSUES'));
        console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        issues.forEach(issue => {
            console.log(chalk.red(`[${issue.id}]`) + ' ' + chalk.white(issue.description));
        });
        
        console.log();
    }
    
    suggestNextSteps() {
        console.log(chalk.magenta.bold('🎯 SUGGESTED NEXT STEPS'));
        console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        const suggestions = [];
        
        // 서버가 꺼져있으면 시작 제안
        if (this.state.infrastructure.servers.orchestrator.status !== 'RUNNING') {
            suggestions.push('Start the orchestrator server');
        }
        
        // 진행 중인 작업 계속하기
        const inProgress = this.state.components.inProgress[0];
        if (inProgress && inProgress.nextSteps.length > 0) {
            suggestions.push(`Continue "${inProgress.name}": ${inProgress.nextSteps[0]}`);
        }
        
        // 열린 이슈 해결
        if (this.state.issues.open.length > 0) {
            suggestions.push(`Resolve issue: ${this.state.issues.open[0].description}`);
        }
        
        // 계획된 작업 시작
        const highPriority = this.state.components.planned.find(p => p.priority === 'HIGH');
        if (highPriority) {
            suggestions.push(`Start planned: ${highPriority.name}`);
        }
        
        if (suggestions.length === 0) {
            suggestions.push('Review and update project documentation');
            suggestions.push('Create tests for completed components');
        }
        
        suggestions.forEach((suggestion, index) => {
            console.log(chalk.cyan(`${index + 1}.`) + ' ' + chalk.white(suggestion));
        });
        
        console.log();
    }
    
    showQuickCommands() {
        console.log(chalk.magenta.bold('⚡ QUICK COMMANDS'));
        console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        const commands = [
            { cmd: 'node orchestration/qwen-orchestrator-enhanced.js', desc: 'Start server' },
            { cmd: 'node project-state-manager.js status', desc: 'Check status' },
            { cmd: 'node project-state-manager.js checkpoint "message"', desc: 'Save checkpoint' },
            { cmd: 'node restore-session.js', desc: 'Restore context' },
            { cmd: 'cd orchestration && npm test', desc: 'Run tests' }
        ];
        
        commands.forEach(({ cmd, desc }) => {
            console.log(chalk.gray(desc.padEnd(20)) + chalk.yellow(cmd));
        });
        
        console.log();
    }
    
    createProgressBar(percentage) {
        const width = 30;
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        
        const filledBar = chalk.green('█'.repeat(filled));
        const emptyBar = chalk.gray('░'.repeat(empty));
        
        return `[${filledBar}${emptyBar}]`;
    }
    
    generateContextFile() {
        // Claude가 빠르게 읽을 수 있는 컨텍스트 파일 생성
        const contextFile = path.join(__dirname, 'CURRENT_CONTEXT.md');
        
        let content = '# CURRENT PROJECT CONTEXT FOR CLAUDE\n\n';
        content += '## Quick Summary\n';
        content += `- Project: ${this.state.project.name} v${this.state.project.version}\n`;
        content += `- Phase: ${this.state.currentPhase.name} (${this.state.currentPhase.completionPercentage}%)\n`;
        content += `- AI: Claude + Qwen3-Max (75 agents)\n`;
        content += `- Last Active: ${this.state.project.lastUpdated}\n\n`;
        
        content += '## Active Work\n';
        this.state.components.inProgress.forEach(comp => {
            content += `- ${comp.name}: ${comp.progress}%\n`;
            if (comp.nextSteps[0]) {
                content += `  Next: ${comp.nextSteps[0]}\n`;
            }
        });
        
        content += '\n## Key Files\n';
        content += '- orchestration/qwen-orchestrator-enhanced.js (Main server)\n';
        content += '- orchestration/claude-qwen-collaborative-solver.js (Collaboration)\n';
        content += '- project-state-manager.js (State management)\n';
        
        content += '\n## Commands\n';
        content += '```bash\n';
        content += '# Start server\n';
        content += 'node orchestration/qwen-orchestrator-enhanced.js\n';
        content += '\n# Check status\n';
        content += 'node project-state-manager.js status\n';
        content += '```\n';
        
        fs.writeFileSync(contextFile, content);
        console.log(chalk.green(`✅ Context file generated: ${contextFile}`));
    }
}

// Export
export default SessionContextRestorer;

// 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
    const restorer = new SessionContextRestorer();
    
    restorer.restoreSession().then(() => {
        console.log(chalk.cyan('╔══════════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║') + chalk.green.bold('             SESSION CONTEXT RESTORED SUCCESSFULLY           ') + chalk.cyan('║'));
        console.log(chalk.cyan('╚══════════════════════════════════════════════════════════════╝'));
        console.log();
        console.log(chalk.yellow('💡 Tip: Copy CURRENT_CONTEXT.md content to Claude for instant context'));
    });
}
