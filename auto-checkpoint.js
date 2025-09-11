#!/usr/bin/env node

/**
 * Auto Session Checkpoint Creator
 * 작업 단위마다 자동으로 세션 복원 프롬프트 생성
 * 
 * Usage: node auto-checkpoint.js "작업명" "상태"
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class AutoCheckpoint {
  constructor() {
    this.projectRoot = 'C:\\palantir\\math';
    this.checkpointDir = path.join(this.projectRoot, 'checkpoints');
    this.sessionFile = path.join(this.projectRoot, 'frontend', 'AI_SESSION_STATE.json');
  }

  async createCheckpoint(taskName, status = 'completed') {
    // Ensure checkpoint directory exists
    await fs.mkdir(this.checkpointDir, { recursive: true });
    
    // Load current session
    const session = JSON.parse(await fs.readFile(this.sessionFile, 'utf-8'));
    
    // Generate checkpoint ID
    const timestamp = new Date().toISOString();
    const checkpointId = timestamp.replace(/[:\-\.]/g, '').slice(0, 14);
    const fileName = `checkpoint_${checkpointId}.md`;
    const filePath = path.join(this.checkpointDir, fileName);
    
    // Create checkpoint content
    const checkpoint = `#  작업 단위 체크포인트: ${taskName}
**생성 시각**: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
**작업 상태**: ${status}

##  새 세션 시작 프롬프트

\`\`\`
I need to continue development on the AI-in-the-Loop Math Education System at C:\\palantir\\math.

작업 완료: ${taskName}
상태: ${status}
마지막 명령: ${session.lastCommand || 'N/A'}

완료된 단계:
${session.completedSteps?.slice(-3).map(s => `- ${s}`).join('\n') || '- 없음'}

다음 작업:
${session.pendingWork?.slice(0, 3).map(w => `- ${w}`).join('\n') || '- 없음'}

서비스 시작:
docker-compose -f C:\\palantir\\math\\docker-compose.yml up -d
node C:\\palantir\\math\\server\\index.js

"C:\\palantir\\math\\PROBLEM_SOLVING_GUIDE.md"를 준수하여 작업 진행.
\`\`\`

##  시스템 상태
- Docker: ${session.dockerStatus?.running ? '실행 중' : '정지'}
- 테스트: ${session.testStatus || 'unknown'}
- 통합: ${session.integrationResults?.overall ? '✅' : '❌'}

##  수정된 파일
${session.files?.modified?.slice(-5).map(f => `- ${f}`).join('\n') || '없음'}

---
*체크포인트 ID: ${checkpointId}*`;

    await fs.writeFile(filePath, checkpoint);
    console.log(`✅ 체크포인트 생성: ${fileName}`);
    
    // Update main recovery prompt
    await fs.writeFile(
      path.join(this.projectRoot, 'RECOVERY_PROMPT.md'),
      checkpoint
    );
    
    return fileName;
  }
}

// CLI 실행
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('auto-checkpoint.js');
if (isMain) {
  const checkpoint = new AutoCheckpoint();
  const taskName = process.argv[2] || '작업';
  const status = process.argv[3] || 'completed';
  
  checkpoint.createCheckpoint(taskName, status)
    .then(fileName => {
      console.log(`체크포인트 저장됨: ${fileName}`);
      console.log('새 세션에서 RECOVERY_PROMPT.md 내용을 복사하여 시작하세요.');
    })
    .catch(console.error);
}

export default AutoCheckpoint;