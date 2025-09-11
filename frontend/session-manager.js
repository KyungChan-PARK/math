#!/usr/bin/env node

/**
 * AI Session Continuity Manager
 * Automatically manages session state, recovery points, and knowledge updates
 * 
 * Usage: node session-manager.js [command]
 * Commands: save, restore, update-lessons, generate-prompt
 */

const fs = require('fs').promises;
const path = require('path');

class SessionManager {
  constructor() {
    this.projectRoot = 'C:\\palantir\\math';
    this.sessionFile = path.join(this.projectRoot, 'frontend', 'AI_SESSION_STATE.json');
    this.guideFile = path.join(this.projectRoot, 'PROBLEM_SOLVING_GUIDE.md');
    this.promptFile = path.join(this.projectRoot, 'RECOVERY_PROMPT.md');
  }

  async saveSession(data) {
    const session = {
      timestamp: new Date().toISOString(),
      projectPath: this.projectRoot,
      currentTask: data.currentTask || 'Unknown',
      completedSteps: data.completedSteps || [],
      pendingWork: data.pendingWork || [],
      lastCommand: data.lastCommand || '',
      errorState: data.errorState || null,
      files: {
        modified: data.modifiedFiles || [],
        created: data.createdFiles || [],
        currentFocus: data.currentFiles || []
      },
      services: {
        frontend: 'http://localhost:3000',
        backend: 'http://localhost:8086',
        neo4j: 'bolt://localhost:7687',
        chromadb: 'http://localhost:8000'
      },
      testStatus: data.testStatus || 'unknown',
      aiCapabilities: {
        tools: [
          'filesystem operations',
          'terminal commands',
          'web search',
          'memory management',
          'code analysis'
        ],
        context: 'Claude Opus 4.1 with full tool access'
      }
    };

    await fs.writeFile(this.sessionFile, JSON.stringify(session, null, 2));
    console.log(`✅ Session saved: ${this.sessionFile}`);
    return session;
  }

  async generateRecoveryPrompt() {
    let session;
    try {
      const content = await fs.readFile(this.sessionFile, 'utf-8');
      session = JSON.parse(content);
    } catch (error) {
      session = { error: 'No session file found' };
    }

    // Generate unique prompt ID based on timestamp
    const timestamp = new Date().toISOString();
    const promptId = timestamp.replace(/[:\-\.]/g, '').slice(0, 14);
    const promptFileName = `SESSION_RESTORE_PROMPT_${promptId}.md`;
    const promptPath = path.join(this.projectRoot, promptFileName);

    const prompt = `#  세션 복원 프롬프트 - ${session.currentTask || 'Development'}
**생성 시각**: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
**작업 단위**: ${session.currentTask || 'Development'}

## 새 세션에서 이 메시지를 복사하여 시작하세요:

---

I need to continue development on the AI-in-the-Loop Math Education System project located at C:\\palantir\\math.

## Previous Session Context
- **Last Task**: ${session.currentTask || 'Not specified'}
- **Timestamp**: ${session.timestamp || 'Unknown'}
- **Last Command**: \`${session.lastCommand || 'Not specified'}\`

## Current Status
### ✅ Completed
${session.completedSteps?.map(step => `- ${step}`).join('\n') || '- No completed steps recorded'}

###  In Progress
${session.pendingWork?.map(work => `- ${work}`).join('\n') || '- No pending work recorded'}

### ❌ Last Error
${session.errorState ? `
- **Error**: ${session.errorState.error || session.errorState}
- **Location**: ${session.errorState.location || 'Unknown'}
- **Cause**: ${session.errorState.cause || 'Unknown'}
` : 'No errors recorded'}

## Files Context
### Modified Files
${session.files?.modified?.map(f => `- ${f}`).join('\n') || 'None'}

### Current Focus Files
${session.files?.currentFocus?.map(f => `- ${f}`).join('\n') || 'None'}

## 서비스 상태
${session.dockerStatus?.running ? `- Docker 컨테이너 ${session.dockerStatus.containers?.length || 0}개 실행 중` : '- Docker 서비스 확인 필요'}
${session.services?.websocket ? `- WebSocket 서버: ${session.services.websocket}` : '- WebSocket 서버 시작 필요'}
${session.integrationResults?.overall ? '- 모든 통합 테스트 통과 ✅' : '- 통합 테스트 필요'}

## Recovery Instructions
1. First, read the session state: \`cat C:\\palantir\\math\\frontend\\AI_SESSION_STATE.json\`
2. Check the PROBLEM_SOLVING_GUIDE.md for any recent case studies
3. Review TEST_RECOVERY_POINT.md if it exists
4. Continue from the last error or pending work

## 서비스 복원 명령
\`\`\`bash
# 1. Docker 서비스 시작
docker-compose -f C:\\palantir\\math\\docker-compose.yml up -d

# 2. WebSocket 서버 시작 (별도 터미널)
node C:\\palantir\\math\\server\\index.js

# 3. 통합 상태 확인
node C:\\palantir\\math\\test-complete-integration.js
\`\`\`

"C:\\palantir\\math\\PROBLEM_SOLVING_GUIDE.md"를 반드시 준수해서 issue 해결해라.

## Your Capabilities
You have access to all tools including filesystem, terminal, web search, and memory management. 
You're running as Claude Opus 4.1 with full development capabilities.

Please acknowledge this context and continue the development from where we left off.

---

## Auto-Generated at: ${new Date().toISOString()}
`;

    // Save both versioned and main prompt files
    await fs.writeFile(promptPath, prompt);
    console.log(`✅ 세션 복원 프롬프트 생성됨: ${promptFileName}`);
    
    await fs.writeFile(this.promptFile, prompt);
    console.log(`✅ Recovery prompt generated: ${this.promptFile}`);
    
    return prompt;
  }

  async updateLessonsLearned(lesson) {
    const timestamp = new Date().toISOString().split('T')[0];
    const lessonEntry = `

### Auto-Added Lesson (${timestamp})

**Context**: ${lesson.context}
**Problem**: ${lesson.problem}
**Solution**: ${lesson.solution}
**Key Learning**: ${lesson.learning}

---
`;

    await fs.appendFile(this.guideFile, lessonEntry);
    console.log('✅ Lesson added to PROBLEM_SOLVING_GUIDE.md');
  }

  async createStatusReport() {
    const session = JSON.parse(await fs.readFile(this.sessionFile, 'utf-8'));
    
    const report = `
##  Status Report - ${new Date().toISOString()}

### Session Information
- **Project**: AI-in-the-Loop Math Education System
- **Location**: ${this.projectRoot}
- **Duration**: Current session

### Progress Summary
- **Completed Tasks**: ${session.completedSteps?.length || 0}
- **Pending Tasks**: ${session.pendingWork?.length || 0}
- **Files Modified**: ${session.files?.modified?.length || 0}

### Current State
- **Active Task**: ${session.currentTask}
- **Test Status**: ${session.testStatus}
- **Last Command**: \`${session.lastCommand}\`

### Next Steps
${session.pendingWork?.map((task, i) => `${i + 1}. ${task}`).join('\n') || 'No pending tasks'}

### Recovery Command
To continue this session in a new conversation:
\`\`\`
node C:\\palantir\\math\\frontend\\session-manager.js restore
\`\`\`

---
*Auto-generated by AI Session Manager*
`;

    return report;
  }
}

// CLI Interface
async function main() {
  const manager = new SessionManager();
  const command = process.argv[2] || 'help';

  switch (command) {
    case 'save':
      await manager.saveSession({
        currentTask: process.argv[3] || 'Development',
        completedSteps: process.argv[4]?.split(',') || [],
        pendingWork: process.argv[5]?.split(',') || []
      });
      await manager.generateRecoveryPrompt();
      break;

    case 'restore':
      const prompt = await manager.generateRecoveryPrompt();
      console.log('\n' + prompt);
      break;

    case 'report':
      const report = await manager.createStatusReport();
      console.log(report);
      break;

    case 'lesson':
      await manager.updateLessonsLearned({
        context: process.argv[3],
        problem: process.argv[4],
        solution: process.argv[5],
        learning: process.argv[6]
      });
      break;

    default:
      console.log(`
AI Session Manager - Usage:
  node session-manager.js save [task] [completed] [pending]
  node session-manager.js restore
  node session-manager.js report
  node session-manager.js lesson [context] [problem] [solution] [learning]
      `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default SessionManager;
