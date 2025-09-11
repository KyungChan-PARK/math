# 🚀 CLAUDE 새 세션 시작 가이드

## 📌 새 대화를 시작할 때 이렇게 하세요:

### 1단계: 초기 인사와 함께 컨텍스트 요청

```
안녕하세요 Claude! 새로운 작업 세션을 시작하려고 합니다.

먼저 당신이 누구이고 어떤 역할을 하는지, 그리고 현재 프로젝트 상태를 파악해주세요.

다음 파일을 읽어주세요:
1. C:\palantir\math\CLAUDE_MASTER_CONTEXT.json
2. C:\palantir\math\SESSION_INIT_REPORT.md
```

### 2단계: Claude가 응답하면 구체적 확인

```
좋습니다. 이제 다음을 확인해주세요:

1. 현재 실행 중인 시스템들의 상태
2. 사용 가능한 API 엔드포인트
3. 75개 AI 에이전트의 상태
4. 최근 작업 내역

terminal:list_sessions 명령으로 실행 중인 프로세스를 확인하고,
curl http://localhost:8095/api/status 로 시스템 상태를 확인해주세요.
```

### 3단계: 작업 목표 설정

```
확인 감사합니다. 오늘의 작업 목표는 다음과 같습니다:

[여기에 구체적인 작업 목표 입력]

이를 위해 어떤 시스템과 도구를 사용해야 할지 제안해주세요.
```

---

## 🎯 Claude가 스스로 확인해야 할 핵심 사항

### A. 정체성 확인
```javascript
// Claude는 다음을 명확히 인지해야 함:
{
  "identity": "Claude Opus 4.1",
  "role": "Master System Architect & AI Orchestrator",
  "project": "Palantir Math - AI-Powered Mathematics Education Platform",
  "authority": "Full system control and modification rights"
}
```

### B. 도구 확인
```javascript
// 사용 가능한 도구 카테고리:
{
  "file_operations": ["read", "write", "edit", "search"],
  "terminal": ["execute", "interact", "monitor"],
  "apis": ["REST", "WebSocket"],
  "ai_collaboration": ["Qwen", "75 agents"]
}
```

### C. 시스템 상태
```javascript
// 확인해야 할 시스템:
{
  "dashboard": "http://localhost:8095",
  "orchestrator": "http://localhost:8093",
  "websocket": "ws://localhost:8094",
  "agents": 75,
  "health": "90/100"
}
```

---

## 💡 빠른 시작 명령어

### 옵션 1: 간단한 시작
```
Claude, 파일 C:\palantir\math\CLAUDE_MASTER_CONTEXT.json을 읽고 
당신의 역할과 현재 시스템 상태를 요약해주세요.
```

### 옵션 2: 상세한 시작
```
Claude, 다음을 수행해주세요:
1. CLAUDE_MASTER_CONTEXT.json 파일 읽기
2. terminal:list_sessions로 프로세스 확인
3. http://localhost:8095/api/status API 호출
4. 현재 상태 종합 보고
```

### 옵션 3: 자동 초기화
```
Claude, C:\palantir\math\claude-session-init.cjs를 실행하여
세션을 초기화하고 결과를 보고해주세요.
```

---

## 🔧 문제 해결

### 만약 Claude가 컨텍스트를 잃었다면:

1. **기본 복원**
```
Claude, 당신은 Palantir Math 프로젝트의 Master System Architect입니다.
C:\palantir\math\CLAUDE_MASTER_CONTEXT.json을 읽어 전체 컨텍스트를 복원하세요.
```

2. **시스템 재시작**
```
Claude, 다음 시스템을 재시작해주세요:
- node C:\palantir\math\master-launcher.js
- node C:\palantir\math\monitoring-dashboard.cjs
- node C:\palantir\math\orchestration\qwen-orchestrator-enhanced.js
```

3. **온톨로지 재로드**
```
Claude, palantir-ontology.js를 읽고 온톨로지 시스템을 재초기화하세요.
```

---

## 📊 상태 확인 체크리스트

Claude가 새 세션에서 확인해야 할 사항:

- [ ] CLAUDE_MASTER_CONTEXT.json 로드 완료
- [ ] 75개 AI 에이전트 상태 확인
- [ ] 3개 핵심 시스템 실행 확인
- [ ] API 엔드포인트 응답 확인
- [ ] 온톨로지 시스템 로드 확인
- [ ] 프로젝트 건강도 확인 (목표: 90/100)
- [ ] 최근 작업 내역 확인
- [ ] 사용 가능한 도구 목록 확인

---

## 🎯 최종 확인 질문

새 세션이 제대로 초기화되었는지 확인하기 위한 질문:

```
Claude, 다음 질문에 답해주세요:
1. 당신의 역할은 무엇입니까?
2. 몇 개의 AI 에이전트를 관리하고 있습니까?
3. 현재 실행 중인 주요 시스템은 무엇입니까?
4. 프로젝트의 건강도는 몇 점입니까?
5. 사용 가능한 주요 API 엔드포인트는 무엇입니까?
```

정답:
1. Master System Architect & AI Orchestrator
2. 75개
3. Master Launcher, Monitoring Dashboard, Qwen Orchestrator
4. 90/100
5. http://localhost:8093 (Qwen), http://localhost:8095 (Dashboard)

---

*이 가이드를 따라 새 세션을 시작하면 Claude가 완벽한 컨텍스트를 가지고 작업을 시작할 수 있습니다.*
