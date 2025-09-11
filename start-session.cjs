#!/usr/bin/env node

/**
 * Palantir Math - Session Start Script
 * 새 대화 세션 시작 시 실행하는 마스터 스크립트
 * 
 * 사용법: node start-session.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 색상 코드 (chalk 없이)
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

const c = {
    red: (str) => `${colors.red}${str}${colors.reset}`,
    green: (str) => `${colors.green}${str}${colors.reset}`,
    yellow: (str) => `${colors.yellow}${str}${colors.reset}`,
    blue: (str) => `${colors.blue}${str}${colors.reset}`,
    magenta: (str) => `${colors.magenta}${str}${colors.reset}`,
    cyan: (str) => `${colors.cyan}${str}${colors.reset}`,
    white: (str) => `${colors.white}${str}${colors.reset}`,
    gray: (str) => `${colors.gray}${str}${colors.reset}`,
    bold: (str) => `${colors.bright}${str}${colors.reset}`
};

class SessionStarter {
    constructor() {
        this.projectRoot = __dirname;
        this.timestamp = new Date().toISOString();
        this.sessionId = `session_${Date.now()}`;
    }
    
    async start() {
        console.clear();
        this.printHeader();
        
        // 1. 프로젝트 상태 확인
        await this.checkProjectStructure();
        
        // 2. 서버 상태 확인
        await this.checkServers();
        
        // 3. 컨텍스트 파일 생성
        await this.generateContextFiles();
        
        // 4. 요약 표시
        this.displaySummary();
        
        // 5. 다음 단계 안내
        this.showNextSteps();
    }
    
    printHeader() {
        console.log(c.cyan('═══════════════════════════════════════════════════════════════════'));
        console.log(c.cyan('║                                                                 ║'));
        console.log(c.cyan('║') + c.yellow(c.bold('              PALANTIR MATH - SESSION INITIALIZER               ')) + c.cyan('║'));
        console.log(c.cyan('║                                                                 ║'));
        console.log(c.cyan('═══════════════════════════════════════════════════════════════════'));
        console.log();
        console.log(c.gray(`Session ID: ${this.sessionId}`));
        console.log(c.gray(`Timestamp: ${this.timestamp}`));
        console.log();
    }
    
    async checkProjectStructure() {
        console.log(c.magenta(c.bold('📁 PROJECT STRUCTURE CHECK')));
        console.log(c.white('───────────────────────────────────────────────────'));
        
        const criticalFiles = [
            {
                path: 'orchestration/qwen-orchestrator-enhanced.js',
                name: 'Orchestrator Server',
                required: true
            },
            {
                path: 'orchestration/qwen-agents-75-complete.js',
                name: '75 AI Agents',
                required: true
            },
            {
                path: 'orchestration/claude-qwen-collaborative-solver.js',
                name: 'Collaboration System',
                required: true
            },
            {
                path: 'package.json',
                name: 'Package Config',
                required: true
            },
            {
                path: 'PROJECT_CURRENT_STATE.json',
                name: 'State File',
                required: false
            }
        ];
        
        let allCriticalPresent = true;
        
        for (const file of criticalFiles) {
            const exists = fs.existsSync(path.join(this.projectRoot, file.path));
            const status = exists ? c.green('✓') : (file.required ? c.red('✗') : c.yellow('○'));
            console.log(`  ${status} ${file.name.padEnd(25)} ${c.gray(file.path)}`);
            
            if (file.required && !exists) {
                allCriticalPresent = false;
            }
        }
        
        if (!allCriticalPresent) {
            console.log(c.red('\n⚠️  Some critical files are missing!'));
        } else {
            console.log(c.green('\n✅ All critical files present'));
        }
        
        console.log();
    }
    
    async checkServers() {
        console.log(c.magenta(c.bold('🖥️  SERVER STATUS CHECK')));
        console.log(c.white('───────────────────────────────────────────────────'));
        
        const servers = [
            { name: 'Orchestrator', port: 8093 },
            { name: 'WebSocket', port: 8094 }
        ];
        
        for (const server of servers) {
            try {
                const { stdout } = await execAsync(`netstat -ano | findstr :${server.port}`);
                if (stdout.includes('LISTENING')) {
                    console.log(`  ${c.green('●')} ${server.name.padEnd(15)} ${c.green('RUNNING')} on port ${server.port}`);
                } else {
                    console.log(`  ${c.yellow('●')} ${server.name.padEnd(15)} ${c.yellow('STOPPED')}`);
                }
            } catch (error) {
                console.log(`  ${c.red('●')} ${server.name.padEnd(15)} ${c.red('NOT RUNNING')}`);
            }
        }
        
        console.log();
    }
    
    async generateContextFiles() {
        console.log(c.magenta(c.bold('📝 GENERATING CONTEXT FILES')));
        console.log(c.white('───────────────────────────────────────────────────'));
        
        // 1. 간단한 상태 파일
        const stateFile = path.join(this.projectRoot, 'SESSION_STATE.json');
        const state = {
            sessionId: this.sessionId,
            timestamp: this.timestamp,
            project: 'Palantir Math',
            version: '2.0.0',
            phase: 'Foundation (85%)',
            components: {
                completed: [
                    '75 AI Agents System',
                    'Claude-Qwen Collaboration',
                    'After Effects CEP Framework'
                ],
                inProgress: [
                    'Gesture Recognition (60%)',
                    'Real-time Collaboration (40%)'
                ]
            },
            ai: {
                claude: 'Strategic Intelligence',
                qwen: '75 Specialized Agents',
                collaboration: '5-Step Process'
            }
        };
        
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
        console.log(`  ${c.green('✓')} SESSION_STATE.json created`);
        
        // 2. Claude용 컨텍스트 Markdown
        const contextFile = path.join(this.projectRoot, 'CLAUDE_SESSION_CONTEXT.md');
        let contextContent = `# CLAUDE SESSION CONTEXT
Generated: ${this.timestamp}
Session: ${this.sessionId}

## PROJECT: Palantir Math
AI-powered mathematics education platform combining After Effects with Claude + Qwen

## YOUR ROLE
- **Strategic Intelligence**: System architecture and complex problem solving
- **Collaboration Lead**: Work with Qwen3-Max (75 agents) via 5-step process
- **Quality Assurance**: Ensure educational effectiveness

## CURRENT STATUS
- **Phase**: Foundation (85% complete)
- **Infrastructure**: Orchestrator (:8093), WebSocket (:8094)
- **Databases**: MongoDB (mathDB), Neo4j (knowledge graph)

## COMPLETED ✅
- 75 AI Agents System
- Claude-Qwen Collaboration Framework
- After Effects CEP Extension
- ExtendScript Generation System

## IN PROGRESS 🚧
- Gesture Recognition Integration (60%) - MediaPipe 21 keypoints
- Real-time Collaboration (40%) - WebRTC implementation

## KEY FILES
\`\`\`
orchestration/
  ├── qwen-orchestrator-enhanced.js      # Main server
  ├── qwen-agents-75-complete.js         # Agent definitions
  └── claude-qwen-collaborative-solver.js # Collaboration
\`\`\`

## QUICK COMMANDS
\`\`\`bash
# Start server
node orchestration/qwen-orchestrator-enhanced.js

# Test collaboration
node orchestration/test-collaboration.js

# Check status
curl http://localhost:8093/api/health
\`\`\`

## AI COLLABORATION
- **Your Model**: Claude Opus 4.1
- **Partner Model**: Qwen3-Max-Preview (1T+ parameters)
- **API Key**: sk-f2ab784cfdc7467495fa72ced5477c2a
- **Process**: 5-step collaborative problem solving

## NEXT PRIORITIES
1. Start orchestrator if not running
2. Test gesture recognition with sample data
3. Complete WebRTC implementation for real-time collab
`;
        
        fs.writeFileSync(contextFile, contextContent);
        console.log(`  ${c.green('✓')} CLAUDE_SESSION_CONTEXT.md created`);
        
        // 3. 빠른 참조 파일
        const quickRefFile = path.join(this.projectRoot, 'QUICK_REFERENCE.txt');
        const quickRef = `PALANTIR MATH - QUICK REFERENCE
================================

START SERVER:
node orchestration/qwen-orchestrator-enhanced.js

TEST COLLABORATION:
node orchestration/test-collaboration.js

CHECK STATUS:
curl http://localhost:8093/api/health

API ENDPOINTS:
POST http://localhost:8093/api/ai/process
POST http://localhost:8093/api/ai/collaborate
GET  http://localhost:8093/api/agents/list
GET  http://localhost:8093/api/health

WEBSOCKET:
ws://localhost:8094

AI MODELS:
Claude: Strategic Intelligence
Qwen: 75 Specialized Agents
API Key: sk-f2ab784cfdc7467495fa72ced5477c2a
`;
        
        fs.writeFileSync(quickRefFile, quickRef);
        console.log(`  ${c.green('✓')} QUICK_REFERENCE.txt created`);
        
        console.log();
    }
    
    displaySummary() {
        console.log(c.cyan('═══════════════════════════════════════════════════════════════════'));
        console.log(c.cyan(c.bold('                         SESSION SUMMARY                           ')));
        console.log(c.cyan('═══════════════════════════════════════════════════════════════════'));
        console.log();
        
        console.log(c.white('PROJECT OVERVIEW:'));
        console.log(c.gray('  • Name: ') + c.white('Palantir Math'));
        console.log(c.gray('  • Type: ') + c.white('AI Mathematics Education Platform'));
        console.log(c.gray('  • Stack: ') + c.white('After Effects + Claude + Qwen'));
        console.log();
        
        console.log(c.white('AI ARCHITECTURE:'));
        console.log(c.gray('  • Claude: ') + c.white('Strategic layer (You)'));
        console.log(c.gray('  • Qwen: ') + c.white('Execution layer (75 agents)'));
        console.log(c.gray('  • Collab: ') + c.white('5-step process'));
        console.log();
        
        console.log(c.white('CURRENT FOCUS:'));
        console.log(c.yellow('  • Gesture Recognition (60% complete)'));
        console.log(c.yellow('  • Real-time Collaboration (40% complete)'));
        console.log();
    }
    
    showNextSteps() {
        console.log(c.magenta(c.bold('🎯 NEXT STEPS')));
        console.log(c.white('───────────────────────────────────────────────────'));
        console.log();
        
        console.log(c.cyan('1. Copy Context to Claude:'));
        console.log(c.gray('   Open CLAUDE_SESSION_CONTEXT.md and copy its content'));
        console.log();
        
        console.log(c.cyan('2. Start Orchestrator (if needed):'));
        console.log(c.yellow('   node orchestration/qwen-orchestrator-enhanced.js'));
        console.log();
        
        console.log(c.cyan('3. Test Current Systems:'));
        console.log(c.gray('   node orchestration/test-collaboration.js'));
        console.log();
        
        console.log(c.cyan('4. Continue Development:'));
        console.log(c.gray('   - Work on gesture recognition'));
        console.log(c.gray('   - Implement WebRTC for collaboration'));
        console.log(c.gray('   - Test with After Effects'));
        console.log();
        
        console.log(c.green('═══════════════════════════════════════════════════════════════════'));
        console.log(c.green(c.bold('                    SESSION INITIALIZED SUCCESSFULLY                ')));
        console.log(c.green('═══════════════════════════════════════════════════════════════════'));
        console.log();
        
        // Windows에서 자동으로 컨텍스트 파일 열기
        if (process.platform === 'win32') {
            exec('start CLAUDE_SESSION_CONTEXT.md', (error) => {
                if (!error) {
                    console.log(c.green('📄 Context file opened in default editor'));
                }
            });
        }
    }
}

// 실행
const starter = new SessionStarter();
starter.start().catch(error => {
    console.error(c.red('Error: '), error.message);
});
