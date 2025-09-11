// Quick Project State Snapshot
// 세션 시작 시 빠르게 실행할 수 있는 간단한 스크립트

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 현재 상태 스냅샷
const PROJECT_STATE = {
    lastSession: new Date().toISOString(),
    
    // 프로젝트 핵심 정보
    project: {
        name: "Palantir Math",
        phase: "Foundation (85% complete)",
        description: "AI 기반 수학 교육 플랫폼 - After Effects + Claude + Qwen"
    },
    
    // 현재 활성 컴포넌트
    activeComponents: {
        servers: {
            orchestrator: { port: 8093, file: "orchestration/qwen-orchestrator-enhanced.js" },
            websocket: { port: 8094, status: "integrated" }
        },
        ai: {
            claude: "Strategic Intelligence (You)",
            qwen: "75 AI Agents Execution Engine",
            collaboration: "5-Step Process Active"
        },
        databases: {
            mongodb: "mongodb://localhost:27017/mathDB",
            neo4j: "bolt://localhost:7687"
        }
    },
    
    // 완료된 주요 작업
    completed: [
        "✅ 75개 AI 에이전트 시스템 구축",
        "✅ Claude-Qwen 협업 시스템 구현",
        "✅ After Effects CEP 프레임워크",
        "✅ ExtendScript 생성 시스템",
        "✅ DashScope API 인증 (sk-f2ab784cfdc7467495fa72ced5477c2a)"
    ],
    
    // 진행 중인 작업
    inProgress: [
        "🚧 제스처 인식 통합 (60%) - MediaPipe 21 keypoints",
        "🚧 실시간 협업 기능 (40%) - WebRTC 구현 필요",
        "🚧 프로젝트 상태 관리 시스템 (90%) - 방금 구축 중"
    ],
    
    // 다음 단계
    nextSteps: [
        "1. 서버 시작: node orchestration/qwen-orchestrator-enhanced.js",
        "2. 제스처 인식 테스트 데이터 수집",
        "3. 학습 경로 그래프 구축 (Neo4j)"
    ],
    
    // 주요 파일 경로
    keyFiles: {
        mainServer: "orchestration/qwen-orchestrator-enhanced.js",
        agents: "orchestration/qwen-agents-75-complete.js",
        collaboration: "orchestration/claude-qwen-collaborative-solver.js",
        stateManager: "project-state-manager.js",
        sessionRestore: "restore-session.js"
    },
    
    // 빠른 명령어
    quickCommands: {
        startServer: "cd orchestration && node qwen-orchestrator-enhanced.js",
        testCollab: "cd orchestration && node test-collaboration.js",
        checkStatus: "curl http://localhost:8093/api/health",
        saveState: "node quick-state.js save",
        loadState: "node quick-state.js load"
    }
};

// 상태 표시 함수
function displayState() {
    console.clear();
    console.log(chalk.cyan.bold('\n════════════════════════════════════════════════'));
    console.log(chalk.yellow.bold('        PALANTIR MATH - PROJECT STATE'));
    console.log(chalk.cyan.bold('════════════════════════════════════════════════\n'));
    
    // 프로젝트 정보
    console.log(chalk.magenta.bold('📁 PROJECT'));
    console.log(chalk.white(`   ${PROJECT_STATE.project.name}`));
    console.log(chalk.gray(`   ${PROJECT_STATE.project.phase}`));
    console.log(chalk.gray(`   Last: ${PROJECT_STATE.lastSession}\n`));
    
    // 완료된 작업
    console.log(chalk.green.bold('✅ COMPLETED'));
    PROJECT_STATE.completed.forEach(item => {
        console.log(chalk.green(`   ${item}`));
    });
    console.log();
    
    // 진행 중
    console.log(chalk.yellow.bold('🚧 IN PROGRESS'));
    PROJECT_STATE.inProgress.forEach(item => {
        console.log(chalk.yellow(`   ${item}`));
    });
    console.log();
    
    // AI 시스템
    console.log(chalk.blue.bold('🤖 AI SYSTEM'));
    console.log(chalk.white(`   Claude: ${PROJECT_STATE.activeComponents.ai.claude}`));
    console.log(chalk.white(`   Qwen: ${PROJECT_STATE.activeComponents.ai.qwen}`));
    console.log(chalk.white(`   Collab: ${PROJECT_STATE.activeComponents.ai.collaboration}\n`));
    
    // 서버 정보
    console.log(chalk.cyan.bold('🖥️ SERVERS'));
    console.log(chalk.white(`   Orchestrator: http://localhost:${PROJECT_STATE.activeComponents.servers.orchestrator.port}`));
    console.log(chalk.white(`   WebSocket: ws://localhost:${PROJECT_STATE.activeComponents.servers.websocket.port}\n`));
    
    // 다음 단계
    console.log(chalk.magenta.bold('🎯 NEXT STEPS'));
    PROJECT_STATE.nextSteps.forEach(step => {
        console.log(chalk.white(`   ${step}`));
    });
    console.log();
    
    // 빠른 명령어
    console.log(chalk.cyan.bold('⚡ QUICK COMMANDS'));
    console.log(chalk.gray('   Start Server:  ') + chalk.yellow('node orchestration/qwen-orchestrator-enhanced.js'));
    console.log(chalk.gray('   Test Collab:   ') + chalk.yellow('node orchestration/test-collaboration.js'));
    console.log(chalk.gray('   Check Health:  ') + chalk.yellow('curl http://localhost:8093/api/health'));
    console.log();
    
    console.log(chalk.cyan.bold('════════════════════════════════════════════════\n'));
}

// 상태를 파일로 저장
function saveState() {
    const stateFile = path.join(__dirname, 'PROJECT_CURRENT_STATE.json');
    fs.writeFileSync(stateFile, JSON.stringify(PROJECT_STATE, null, 2));
    console.log(chalk.green(`✅ State saved to: ${stateFile}`));
    
    // Markdown 버전도 생성
    const mdFile = path.join(__dirname, 'PROJECT_CURRENT_STATE.md');
    let md = `# Palantir Math - Current State\n\n`;
    md += `> Last Session: ${PROJECT_STATE.lastSession}\n\n`;
    md += `## Project\n`;
    md += `- **Name**: ${PROJECT_STATE.project.name}\n`;
    md += `- **Phase**: ${PROJECT_STATE.project.phase}\n\n`;
    md += `## Completed ✅\n`;
    PROJECT_STATE.completed.forEach(item => {
        md += `- ${item}\n`;
    });
    md += `\n## In Progress 🚧\n`;
    PROJECT_STATE.inProgress.forEach(item => {
        md += `- ${item}\n`;
    });
    md += `\n## AI System\n`;
    md += `- **Claude**: ${PROJECT_STATE.activeComponents.ai.claude}\n`;
    md += `- **Qwen**: ${PROJECT_STATE.activeComponents.ai.qwen}\n`;
    md += `- **Collaboration**: ${PROJECT_STATE.activeComponents.ai.collaboration}\n\n`;
    md += `## Quick Start\n`;
    md += `\`\`\`bash\n`;
    md += `# Start the server\n`;
    md += `${PROJECT_STATE.quickCommands.startServer}\n`;
    md += `\n# Check status\n`;
    md += `${PROJECT_STATE.quickCommands.checkStatus}\n`;
    md += `\`\`\`\n`;
    
    fs.writeFileSync(mdFile, md);
    console.log(chalk.green(`✅ Markdown saved to: ${mdFile}`));
}

// 상태 로드
function loadState() {
    const stateFile = path.join(__dirname, 'PROJECT_CURRENT_STATE.json');
    if (fs.existsSync(stateFile)) {
        const loaded = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        Object.assign(PROJECT_STATE, loaded);
        console.log(chalk.green('✅ State loaded successfully'));
        return true;
    }
    console.log(chalk.yellow('⚠️ No saved state found'));
    return false;
}

// 메인 실행
const command = process.argv[2];

switch (command) {
    case 'save':
        displayState();
        saveState();
        break;
    case 'load':
        if (loadState()) {
            displayState();
        }
        break;
    case 'show':
        displayState();
        break;
    default:
        displayState();
        saveState();
        console.log(chalk.yellow('\n💡 TIP: 새 세션 시작 시 이 내용을 Claude에게 제공하세요!'));
        console.log(chalk.gray('   Copy PROJECT_CURRENT_STATE.md content\n'));
}
