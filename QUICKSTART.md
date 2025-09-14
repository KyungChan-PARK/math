# 🚀 QUICK START - Palantir Math (Claude Code)

## 새 세션 시작 (Claude Code)
```javascript
// Claude Code에서 직접 실행
await TodoWrite({ todos: [...] }); // 작업 계획 설정
await Read({ file_path: '/mnt/c/palantir/math/PROJECT_STATUS.md' });
await Bash({ command: 'curl -s http://localhost:8093/api/health' });
```

## 핵심 명령어 (Claude Code 도구)
```javascript
// 1. 시스템 상태 확인
await Bash({ command: 'curl -s http://localhost:8093/api/health' });

// 2. 성능 통계 보기
await Bash({ command: 'curl -s http://localhost:8093/api/stats' });

// 3. 테스트 실행
await Bash({ command: 'node /mnt/c/palantir/math/test-optimized-client.js' });

// 4. 오케스트레이터 시작 (필요시)
await Bash({ 
  command: 'node /mnt/c/palantir/math/orchestration/qwen-orchestrator-optimized.js',
  run_in_background: true
});
```

## 현재 상태 요약
- **Qwen API 최적화**: ✅ 완료 (16x 성능 향상)
- **캐시 시스템**: ✅ 작동 중 (85.71% 히트율)
- **온톨로지 시스템**: 🚧 설계 중
- **파일 관리**: ⏳ 계획됨

## 주요 파일 위치 (Claude Code 경로)
- 프로젝트 상태: `/mnt/c/palantir/math/PROJECT_STATUS.md`
- 체크포인트: `/mnt/c/palantir/math/checkpoint.json`
- 최적화 클라이언트: `/mnt/c/palantir/math/optimized-qwen-client.js`
- 오케스트레이터: `/mnt/c/palantir/math/orchestration/qwen-orchestrator-optimized.js`
- Claude Code 도구 가이드: `/mnt/c/palantir/math/claude-code-opus41-tools-guide.md`

## 다음 작업 (Claude Code로 수행)
```javascript
await TodoWrite({
  todos: [
    { content: 'Neo4j + Neosemantics 설치', status: 'pending', activeForm: 'Installing Neo4j' },
    { content: '파일 정리 시스템 구축', status: 'pending', activeForm: 'Building file management system' },
    { content: '온톨로지 매핑 생성', status: 'pending', activeForm: 'Creating ontology mapping' },
    { content: 'LangChain 통합', status: 'pending', activeForm: 'Integrating LangChain' }
  ]
});
```

## 문제 발생 시 (Claude Code 해결법)
```javascript
// 포트 충돌 해결
await Bash({ command: 'lsof -i:8093 | grep LISTEN' });
await Bash({ command: 'kill -9 [PID]' });

// API 타임아웃 확인
await Grep({ pattern: 'REQUEST_TIMEOUT', glob: '*.js' });

// 인코딩 문제 해결
await Write({ file_path: '/mnt/c/palantir/math/script.js', content: '...' });
await Bash({ command: 'node /mnt/c/palantir/math/script.js' });
```

---
**Last Updated**: 2025-09-11
**Version**: 1.0.0 (Claude Code Opus 4.1)
**Environment**: Claude Code on WSL2