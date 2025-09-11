/**
 * Instant Session Prompt Generator
 * 현재 프로젝트 상태를 정확히 반영한 즉시 사용 가능한 프롬프트 생성
 */

import fs from 'fs';
import path from 'path';

class InstantPromptGenerator {
    constructor() {
        this.projectPath = 'C:\\palantir\\math';
    }

    generatePrompt() {
        const status = JSON.parse(fs.readFileSync(path.join(this.projectPath, 'AUTO_SYNC_STATUS.json'), 'utf8'));
        const timestamp = new Date().toISOString();
        
        return `#  즉시 프로젝트 재개 프롬프트
생성시각: ${timestamp}

## 작업 지시
C:\\palantir\\math 경로의 Math Learning Platform 프로젝트를 이어서 개발하라.
너는 Claude Opus 4.1이며 모든 고급 기능을 사용할 수 있다.

## 현재 상태
- Innovation Score: ${status.innovation_score}/100
- 마지막 작업: ${status.current_task}
- 진행률: ${status.progress}%

## 활성화된 기능
${Object.entries(status.integration_status || {}).map(([key, value]) => 
    `- ${key}: ${value}`
).join('\n')}

## 즉시 실행 명령
\`\`\`bash
cd C:\\palantir\\math
node system-health-monitor.js
cat AUTO_SYNC_STATUS.json
\`\`\`

## 핵심 파일
- AUTO_SYNC_STATUS.json (현재 상태)
- PROJECT_STATUS_20250908.md (오늘 진행사항)
- UNIFIED_DOCUMENTATION.md (통합 문서)

## 사용 가능한 도구
모든 도구 사용 가능: Filesystem, Terminal, Memory, Web Search, Brave Search, 
Sequential Thinking, Artifacts, Analysis Tool, Conversation History

## 다음 작업
${status.achievements_today ? status.achievements_today[status.achievements_today.length - 1] : '프로젝트 상태 확인'}부터 계속

이제 AUTO_SYNC_STATUS.json을 읽고 정확한 상태에서 작업을 재개하라.`;
    }

    save() {
        const prompt = this.generatePrompt();
        const filename = `INSTANT_SESSION_${new Date().toISOString().slice(0,19).replace(/[:-]/g, '')}.md`;
        const filepath = path.join(this.projectPath, filename);
        
        fs.writeFileSync(filepath, prompt);
        
        // Also update the latest prompt file
        fs.writeFileSync(path.join(this.projectPath, 'LATEST_SESSION_PROMPT.md'), prompt);
        
        console.log(`✅ 즉시 사용 가능한 프롬프트 생성됨:`);
        console.log(`   - ${filename}`);
        console.log(`   - LATEST_SESSION_PROMPT.md (항상 최신)`);
        
        return prompt;
    }
}

// Auto-run
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    const generator = new InstantPromptGenerator();
    const prompt = generator.save();
    console.log('\n 프롬프트 미리보기:');
    console.log('─'.repeat(50));
    console.log(prompt.substring(0, 500) + '...');
}

export default InstantPromptGenerator;