// Auto Session Context System
// 새 대화 시작 시 자동으로 컨텍스트를 복원하고 요약하는 시스템

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AutoContextSystem {
    constructor() {
        this.contextDir = path.join(__dirname, 'context');
        this.sessionsDir = path.join(this.contextDir, 'sessions');
        this.currentSessionFile = path.join(this.contextDir, 'current_session.json');
        
        // 디렉토리 생성
        this.ensureDirectories();
        
        // 현재 세션 정보
        this.sessionId = this.generateSessionId();
        this.sessionStart = new Date();
    }
    
    ensureDirectories() {
        if (!fs.existsSync(this.contextDir)) {
            fs.mkdirSync(this.contextDir, { recursive: true });
        }
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
    }
    
    generateSessionId() {
        const date = new Date().toISOString().split('T')[0];
        const time = Date.now().toString(36);
        return `session_${date}_${time}`;
    }
    
    // 새 세션 시작 시 자동 실행
    async startNewSession() {
        console.clear();
        console.log(chalk.cyan.bold('╔══════════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan.bold('║           PALANTIR MATH - AUTO CONTEXT RESTORATION          ║'));
        console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════╝'));
        console.log();
        
        // 1. 이전 세션 정보 로드
        const previousSession = await this.loadPreviousSession();
        
        // 2. 프로젝트 상태 분석
        const projectState = await this.analyzeProjectState();
        
        // 3. 코드 변경사항 감지
        const codeChanges = await this.detectCodeChanges();
        
        // 4. 서버 상태 확인
        const serverStatus = await this.checkServerStatus();
        
        // 5. 컨텍스트 요약 생성
        const contextSummary = this.generateContextSummary({
            previousSession,
            projectState,
            codeChanges,
            serverStatus
        });
        
        // 6. Claude용 컨텍스트 파일 생성
        await this.generateClaudeContext(contextSummary);
        
        // 7. 세션 정보 저장
        await this.saveSessionInfo(contextSummary);
        
        // 8. 빠른 시작 옵션 제공
        await this.provideQuickStartOptions(contextSummary);
        
        return contextSummary;
    }
    
    async loadPreviousSession() {
        try {
            if (fs.existsSync(this.currentSessionFile)) {
                const data = JSON.parse(fs.readFileSync(this.currentSessionFile, 'utf8'));
                console.log(chalk.gray(`📅 Previous session: ${data.sessionId}`));
                console.log(chalk.gray(`   Last active: ${data.lastActive}`));
                return data;
            }
        } catch (error) {
            console.log(chalk.yellow('No previous session found'));
        }
        return null;
    }
    
    async analyzeProjectState() {
        console.log(chalk.blue('\n🔍 Analyzing project state...'));
        
        const state = {
            totalFiles: 0,
            keyFiles: [],
            recentModified: [],
            projectStructure: {}
        };
        
        // 주요 파일 확인
        const keyFilePaths = [
            'orchestration/qwen-orchestrator-enhanced.js',
            'orchestration/qwen-agents-75-complete.js',
            'orchestration/claude-qwen-collaborative-solver.js',
            'project-state-manager.js',
            'package.json'
        ];
        
        for (const filePath of keyFilePaths) {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                state.keyFiles.push({
                    path: filePath,
                    size: stats.size,
                    modified: stats.mtime
                });
                
                // 최근 수정된 파일 체크
                const hourAgo = new Date(Date.now() - 3600000);
                if (stats.mtime > hourAgo) {
                    state.recentModified.push(filePath);
                }
            }
        }
        
        // 전체 파일 수 계산
        state.totalFiles = this.countFiles(__dirname);
        
        console.log(chalk.green(`   ✓ Found ${state.keyFiles.length} key files`));
        console.log(chalk.green(`   ✓ Total project files: ${state.totalFiles}`));
        
        if (state.recentModified.length > 0) {
            console.log(chalk.yellow(`   ⚡ Recently modified: ${state.recentModified.join(', ')}`));
        }
        
        return state;
    }
    
    countFiles(dir, count = 0) {
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stats = fs.statSync(fullPath);
                if (stats.isFile()) {
                    count++;
                } else if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    count = this.countFiles(fullPath, count);
                }
            }
        } catch (error) {
            // 권한 문제 등 무시
        }
        return count;
    }
    
    async detectCodeChanges() {
        console.log(chalk.blue('\n🔄 Detecting code changes...'));
        
        const changes = {
            added: [],
            modified: [],
            summary: ''
        };
        
        try {
            // Git 사용 가능한 경우
            const { stdout: status } = await execAsync('git status --porcelain');
            const lines = status.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                const [flag, file] = line.trim().split(/\s+/);
                if (flag === 'A' || flag === 'AM') {
                    changes.added.push(file);
                } else if (flag === 'M' || flag === 'MM') {
                    changes.modified.push(file);
                }
            }
            
            if (changes.added.length > 0 || changes.modified.length > 0) {
                changes.summary = `${changes.added.length} added, ${changes.modified.length} modified`;
                console.log(chalk.yellow(`   ⚡ Changes detected: ${changes.summary}`));
            } else {
                console.log(chalk.green('   ✓ No uncommitted changes'));
            }
        } catch (error) {
            console.log(chalk.gray('   Git not available - skipping change detection'));
        }
        
        return changes;
    }
    
    async checkServerStatus() {
        console.log(chalk.blue('\n🖥️ Checking server status...'));
        
        const status = {
            orchestrator: false,
            websocket: false,
            mongodb: false,
            neo4j: false
        };
        
        // Orchestrator 서버 확인
        try {
            const { stdout } = await execAsync('netstat -ano | findstr :8093');
            if (stdout.includes('LISTENING')) {
                status.orchestrator = true;
                console.log(chalk.green('   ✓ Orchestrator server is running'));
            } else {
                console.log(chalk.red('   ✗ Orchestrator server is not running'));
            }
        } catch (error) {
            console.log(chalk.red('   ✗ Orchestrator server is not running'));
        }
        
        // WebSocket 서버 확인
        try {
            const { stdout } = await execAsync('netstat -ano | findstr :8094');
            if (stdout.includes('LISTENING')) {
                status.websocket = true;
                console.log(chalk.green('   ✓ WebSocket server is running'));
            }
        } catch (error) {
            // WebSocket은 orchestrator에 통합되어 있을 수 있음
        }
        
        return status;
    }
    
    generateContextSummary(data) {
        const { previousSession, projectState, codeChanges, serverStatus } = data;
        
        const summary = {
            sessionId: this.sessionId,
            timestamp: this.sessionStart.toISOString(),
            
            continuity: {
                isNewSession: !previousSession,
                lastSessionId: previousSession?.sessionId || null,
                timeSinceLastSession: previousSession 
                    ? this.getTimeDifference(previousSession.lastActive) 
                    : 'First session'
            },
            
            projectStatus: {
                phase: 'Foundation (85%)',
                totalFiles: projectState.totalFiles,
                keyFilesPresent: projectState.keyFiles.length,
                recentlyModified: projectState.recentModified
            },
            
            infrastructure: {
                servers: {
                    orchestrator: serverStatus.orchestrator ? 'RUNNING' : 'STOPPED',
                    websocket: serverStatus.websocket ? 'RUNNING' : 'STOPPED'
                },
                databases: {
                    mongodb: serverStatus.mongodb ? 'CONNECTED' : 'DISCONNECTED',
                    neo4j: serverStatus.neo4j ? 'CONNECTED' : 'DISCONNECTED'
                }
            },
            
            aiSystem: {
                claude: 'Ready (Strategic Intelligence)',
                qwen: 'Ready (75 Agents)',
                collaboration: 'Enabled (5-Step Process)'
            },
            
            changes: codeChanges,
            
            recommendations: this.generateRecommendations(serverStatus, codeChanges)
        };
        
        return summary;
    }
    
    getTimeDifference(lastActive) {
        const diff = Date.now() - new Date(lastActive).getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} days ago`;
        if (hours > 0) return `${hours} hours ago`;
        return 'Recently';
    }
    
    generateRecommendations(serverStatus, codeChanges) {
        const recommendations = [];
        
        if (!serverStatus.orchestrator) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Start orchestrator server',
                command: 'node orchestration/qwen-orchestrator-enhanced.js'
            });
        }
        
        if (codeChanges.modified.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                action: 'Test modified components',
                command: 'npm test'
            });
        }
        
        recommendations.push({
            priority: 'LOW',
            action: 'Update project documentation',
            command: 'node project-state-manager.js export'
        });
        
        return recommendations;
    }
    
    async generateClaudeContext(summary) {
        console.log(chalk.blue('\n📝 Generating Claude context...'));
        
        const contextFile = path.join(this.contextDir, 'CLAUDE_CONTEXT.md');
        
        let content = '# 🎯 CLAUDE: YOUR CURRENT PROJECT CONTEXT\n\n';
        
        content += '## Quick Brief\n';
        content += `You are continuing work on **Palantir Math**, an AI-powered mathematics education platform.\n`;
        content += `Session ID: ${summary.sessionId}\n`;
        content += `Time since last session: ${summary.continuity.timeSinceLastSession}\n\n`;
        
        content += '## Your Role\n';
        content += '- **Strategic Intelligence**: System architecture, complex problem solving\n';
        content += '- **Collaboration Lead**: Working with Qwen3-Max (75 agents) via 5-step process\n';
        content += '- **Quality Assurance**: Ensuring educational effectiveness\n\n';
        
        content += '## Current System Status\n';
        content += '```javascript\n';
        content += `Infrastructure: {\n`;
        content += `  orchestrator: "${summary.infrastructure.servers.orchestrator}",\n`;
        content += `  websocket: "${summary.infrastructure.servers.websocket}",\n`;
        content += `  mongodb: "${summary.infrastructure.databases.mongodb}",\n`;
        content += `  neo4j: "${summary.infrastructure.databases.neo4j}"\n`;
        content += `}\n`;
        content += '```\n\n';
        
        content += '## Active Components\n';
        content += '- ✅ 75 AI Agents System (Complete)\n';
        content += '- ✅ Claude-Qwen Collaboration (Active)\n';
        content += '- ✅ After Effects CEP Framework\n';
        content += '- 🚧 Gesture Recognition (60%)\n';
        content += '- 🚧 Real-time Collaboration (40%)\n\n';
        
        if (summary.recommendations.length > 0) {
            content += '## 🎯 Immediate Actions Needed\n';
            summary.recommendations.forEach(rec => {
                content += `\n### ${rec.priority}: ${rec.action}\n`;
                content += '```bash\n';
                content += `${rec.command}\n`;
                content += '```\n';
            });
        }
        
        content += '\n## Key Files\n';
        content += '```\n';
        content += 'orchestration/\n';
        content += '  ├── qwen-orchestrator-enhanced.js (Main server)\n';
        content += '  ├── qwen-agents-75-complete.js (Agent definitions)\n';
        content += '  └── claude-qwen-collaborative-solver.js (Collaboration)\n';
        content += 'project-state-manager.js (State management)\n';
        content += 'auto-session-context.js (This system)\n';
        content += '```\n\n';
        
        content += '## Quick Commands\n';
        content += '```bash\n';
        content += '# Start server\n';
        content += 'node orchestration/qwen-orchestrator-enhanced.js\n\n';
        content += '# Test collaboration\n';
        content += 'node orchestration/test-collaboration.js\n\n';
        content += '# Save checkpoint\n';
        content += 'node project-state-manager.js checkpoint "description"\n';
        content += '```\n\n';
        
        content += '## Working Context\n';
        content += 'The project uses a hierarchical 8-layer architecture:\n';
        content += '1. Vision (User) → 2. Strategy (Claude) → 3. Collaboration → 4. Orchestration\n';
        content += '→ 5. Execution (Qwen) → 6. Integration → 7. Persistence → 8. Presentation\n\n';
        
        content += '---\n';
        content += '*This context was automatically generated. If you need more details, ';
        content += 'check PROJECT_CURRENT_STATE.md or ask for specific information.*\n';
        
        fs.writeFileSync(contextFile, content);
        console.log(chalk.green(`   ✓ Context file created: ${contextFile}`));
        
        // 콘솔에도 간단한 버전 출력
        console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.yellow.bold(' CLAUDE QUICK CONTEXT'));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.white(`Project: Palantir Math (AI Math Education)`));
        console.log(chalk.white(`Your Role: Strategic Intelligence + Collaboration`));
        console.log(chalk.white(`Partner: Qwen3-Max (75 specialized agents)`));
        console.log(chalk.white(`Status: ${summary.infrastructure.servers.orchestrator === 'RUNNING' ? '🟢 Active' : '🔴 Server needs start'}`));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
        
        return contextFile;
    }
    
    async saveSessionInfo(summary) {
        // 현재 세션 저장
        const sessionData = {
            ...summary,
            lastActive: new Date().toISOString()
        };
        
        fs.writeFileSync(this.currentSessionFile, JSON.stringify(sessionData, null, 2));
        
        // 세션 히스토리에도 저장
        const historyFile = path.join(this.sessionsDir, `${summary.sessionId}.json`);
        fs.writeFileSync(historyFile, JSON.stringify(sessionData, null, 2));
        
        console.log(chalk.gray(`💾 Session saved: ${summary.sessionId}`));
    }
    
    async provideQuickStartOptions(summary) {
        console.log(chalk.magenta.bold('\n🚀 QUICK START OPTIONS'));
        console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        const options = [
            {
                key: '1',
                label: 'Start Orchestrator Server',
                command: 'node orchestration/qwen-orchestrator-enhanced.js',
                condition: !summary.infrastructure.servers.orchestrator
            },
            {
                key: '2',
                label: 'Test Claude-Qwen Collaboration',
                command: 'node orchestration/test-collaboration.js',
                condition: true
            },
            {
                key: '3',
                label: 'View Project Status',
                command: 'node quick-state.js show',
                condition: true
            },
            {
                key: '4',
                label: 'Create Checkpoint',
                command: 'node project-state-manager.js checkpoint "Session start"',
                condition: true
            },
            {
                key: '5',
                label: 'Open Documentation',
                command: 'start COMPLETE_ARCHITECTURE_HIERARCHY.md',
                condition: true
            }
        ];
        
        options.filter(opt => opt.condition).forEach(opt => {
            console.log(chalk.cyan(`[${opt.key}]`) + ' ' + chalk.white(opt.label));
            console.log(chalk.gray(`    ${opt.command}`));
        });
        
        console.log(chalk.white('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.yellow('\n💡 Copy CLAUDE_CONTEXT.md content to start conversation'));
        
        return options;
    }
}

// Export
export default AutoContextSystem;

// 직접 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    const autoContext = new AutoContextSystem();
    
    autoContext.startNewSession().then(summary => {
        console.log(chalk.green.bold('\n✅ SESSION CONTEXT READY'));
        console.log(chalk.gray(`Session ID: ${summary.sessionId}`));
        
        // 자동으로 클립보드에 복사 (Windows)
        if (process.platform === 'win32') {
            const contextFile = path.join(autoContext.contextDir, 'CLAUDE_CONTEXT.md');
            exec(`type "${contextFile}" | clip`, (error) => {
                if (!error) {
                    console.log(chalk.green('\n📋 Context copied to clipboard!'));
                    console.log(chalk.yellow('Just paste it into Claude to continue working.'));
                }
            });
        }
    }).catch(error => {
        console.error(chalk.red('Error:'), error);
    });
}
