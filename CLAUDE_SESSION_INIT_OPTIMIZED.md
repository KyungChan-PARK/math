# Claude Code Opus 4.1 - Session Initialization

## 🎓 학습 가이드 자동 적용
```javascript
// 세션 시작 시 자동 로드
await Read({ file_path: '/mnt/c/palantir/math/CLAUDE_CODE_SESSION_LEARNING_GUIDE.md' });
// 사용자의 프롬프트 수준에 맞춰 점진적 학습 지원
```

## 세션 초기화 절차 (Claude Code)

```javascript
// Claude Code에서 자동 실행
const sessionInit = async () => {
  // 1. 프로젝트 상태 파악
  await Read({ file_path: '/mnt/c/palantir/math/PROJECT_STATUS.md' });
  await Read({ file_path: '/mnt/c/palantir/math/checkpoint.json' });
  
  // 2. 서비스 상태 확인 (병렬)
  const [health, stats] = await Promise.all([
    Bash({ command: 'curl -s http://localhost:8093/api/health' }),
    Bash({ command: 'curl -s http://localhost:8093/api/stats' })
  ]);
  
  // 3. 작업 목록 설정
  await TodoWrite({ todos: [...projectTasks] });
};
```

## 빠른 상태 확인

```bash
# Claude Code Bash 도구로 실행
await Bash({ command: 'curl -s http://localhost:8093/api/health | jq .' });
```

## Claude Code 작업 지침

- TodoWrite로 작업 추적 관리
- Bash 도구로 시스템 명령 실행
- Read/Write/MultiEdit로 파일 작업
- Grep/Glob로 효율적 검색
- Promise.all로 병렬 처리 극대화

## 현재 시스템 구성

- Model: Claude Opus 4.1 (claude-opus-4-1-20250805)
- Context: 200K tokens
- Qwen Orchestrator: Port 8093 (HTTP), 8094 (WebSocket)
- AI Agents: 75개 (Task 도구로 실행)
- Cache: 26개 항목 (85.71% 히트율)
- 주요 도구: Task, Bash, Read/Write, Grep/Glob, TodoWrite