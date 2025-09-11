# Palantir Math - Claude Session Initialization v4.1.0

## 최적화된 세션 초기화 명령어

```
Claude, Palantir Math 세션을 초기화합니다:
1. node C:\palantir\math\claude-session-checkpoint.cjs 실행
2. C:\palantir\math\SESSION_CHECKPOINT.json 읽기
3. C:\palantir\math\NEXT_PHASE_COMPLETE_REPORT.md 마지막 50줄 읽기
4. 체크포인트 상태가 READY가 아니면 누락 서비스 재시작
5. 간단한 상태 확인만 출력 (장황한 보고서 불필요)
```

## 대체 명령어 (빠른 초기화)

```
Claude, 빠른 세션 시작:
1. C:\palantir\math\SESSION_CHECKPOINT.json 읽기
2. http://localhost:8096/api/status 확인
3. 상태: [OPERATIONAL/DEGRADED/OFFLINE] 한 줄 출력
```

## 작업 지침

- 모든 중간 과정 출력 생략
- 포맷팅된 보고서 불필요
- 최종 상태만 간단히 보고
- 문제 발견시 자동 복구 시도

## 현재 시스템 버전

- Version: 4.1.0
- Enhanced Dashboard: Port 8096
- Original Dashboard: Port 8095
- Qwen Orchestrator: Port 8093
- AI Agents: 75개
- Memory Pool: 2GB
- Ontology Versions: 30개 추적