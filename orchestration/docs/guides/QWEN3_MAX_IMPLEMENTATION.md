# Qwen3-Max-Preview 75 AI Agents System

## 🚀 시스템 개요

75개의 AI 에이전트를 Alibaba Cloud의 Qwen3-Max-Preview (1조+ 파라미터) 모델로 구동하는 통합 시스템입니다.

## 📊 모델 사양

### Qwen3-Max-Preview
- **파라미터**: 1 Trillion+ (1조 이상)
- **컨텍스트 윈도우**: 262,144 토큰
  - 입력: 258,048 토큰
  - 출력: 32,768 토큰
- **응답 속도**: Blazing fast (사용자 평가)
- **언어 지원**: 영어, 한국어, 중국어
- **특화 분야**: 복잡한 추론, 코딩, JSON 처리, 창의적 작업

## 💰 가격 정책

| 토큰 범위 | 입력 ($/MTok) | 출력 ($/MTok) |
|-----------|---------------|---------------|
| 0-32K | $0.861 | $3.441 |
| 32K-128K | $1.434 | $5.735 |
| 128K-252K | $2.151 | $8.602 |

## 🏗️ 시스템 구조

### 75개 AI 에이전트 분포

1. **수학 개념 전문가** (10개)
   - algebraExpert, geometryExpert, calculusExpert 등

2. **교육 방법론** (10개)
   - curriculumDesigner, lessonPlanner, assessmentCreator 등

3. **시각화 전문가** (10개)
   - graphVisualizer, shape3DModeler, animationChoreographer 등

4. **상호작용 전문가** (10개)
   - gestureInterpreter, voiceCommandProcessor, touchPatternAnalyzer 등

5. **평가 및 피드백** (10개)
   - progressTracker, errorPatternDetector, solutionExplainer 등

6. **기술 지원** (10개)
   - extendScriptGenerator, debugAssistant, performanceOptimizer 등

7. **콘텐츠 생성** (10개)
   - problemGenerator, worksheetDesigner, videoScriptWriter 등

8. **데이터 분석** (5개)
   - learningAnalyticsExpert, predictiveModeler, dashboardDesigner 등

## 🔧 설치 및 실행

### 1. 환경 변수 설정 (.env)
```env
# Alibaba Cloud - Qwen3-Max-Preview
ALIBABA_ACCESS_KEY_ID=LTAI5tGKFLf3VhjBVAjUvUo4
ALIBABA_ACCESS_KEY_SECRET=nnvPMQMDAyqT147jTxkQJdET36JUB9
QWEN_MODEL=qwen3-max-preview
QWEN_ORCHESTRATOR_PORT=8093
QWEN_WS_PORT=8094
```

### 2. 의존성 설치
```bash
cd C:\palantir\math\orchestration
npm install openai
```

### 3. 서버 실행
```bash
# Windows
start-qwen.bat

# 또는 직접 실행
node qwen-orchestrator-75.js
```

## 📡 API 엔드포인트

### 기본 정보
- **HTTP Server**: http://localhost:8093
- **WebSocket**: ws://localhost:8094

### 주요 엔드포인트

| 메소드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/health` | 시스템 상태 확인 |
| GET | `/api/agents` | 전체 에이전트 목록 |
| GET | `/api/agents?category=math_concepts` | 카테고리별 필터링 |
| POST | `/api/agent/call` | 특정 에이전트 호출 |
| POST | `/api/agent/auto` | 자동 에이전트 선택 |
| POST | `/api/agent/parallel` | 병렬 실행 |
| POST | `/api/agent/workflow` | 워크플로우 실행 |
| POST | `/api/math/solve` | 수학 문제 해결 |
| POST | `/api/lesson/create` | 수업 계획 생성 |
| POST | `/api/visualize` | 시각화 생성 |
| POST | `/api/code/generate` | 코드 생성 |
| POST | `/api/cost/estimate` | 비용 예측 |

## 🧪 테스트

### 시뮬레이션 테스트
```bash
node test-qwen-simulation.js
```

### 전체 테스트
```bash
node test-qwen-system.js
```

## 📈 성능 비교

| 모델 | 파라미터 | 컨텍스트 | 평균 응답 시간 |
|------|----------|----------|---------------|
| **Qwen3-Max** | 1T+ | 262K | ~200ms (추정) |
| Claude Opus | Unknown | 200K | ~2000ms |
| Claude Sonnet | Unknown | 200K | ~1000ms |
| Claude Haiku | Unknown | 200K | ~500ms |

## ✨ 주요 특징

1. **초고속 응답**: 사용자들이 "blazing fast"라고 평가
2. **대용량 컨텍스트**: 262K 토큰 (Claude의 200K보다 큼)
3. **비용 효율성**: 계층별 가격으로 최적화 가능
4. **강력한 추론**: Non-reasoning 모델이지만 복잡한 추론 가능
5. **다국어 지원**: 영어, 한국어, 중국어 완벽 지원

## 🔍 복잡도 기반 최적화

시스템은 작업 복잡도에 따라 토큰 수를 자동 조절합니다:

- **Simple** (35개 에이전트): 1000-1500 토큰
- **Medium** (37개 에이전트): 2000-2500 토큰  
- **Complex** (3개 에이전트): 3000 토큰

## 📂 파일 구조

```
orchestration/
├── qwen-agents-75-complete.js    # 75개 에이전트 정의
├── qwen-orchestrator-75.js       # 메인 서버
├── test-qwen-system.js          # 테스트 스크립트
├── test-qwen-simulation.js      # 시뮬레이션 테스트
├── start-qwen.bat               # Windows 시작 스크립트
└── package.json                 # 의존성 정의
```

## 🚨 주의사항

1. **API 인증**: Alibaba Cloud의 AccessKey 방식 사용 (OpenAI와 다름)
2. **비용 관리**: 토큰 사용량에 따른 계층별 가격 적용
3. **속도 제한**: API 호출 간 적절한 딜레이 필요
4. **컨텍스트 관리**: 262K 토큰 한계 내에서 효율적 사용

## 📊 현재 상태

- ✅ **시스템 아키텍처**: 완전 구현
- ✅ **75개 에이전트**: 모두 정의 및 초기화
- ✅ **HTTP/WebSocket 서버**: 작동 중
- ✅ **비용 최적화 시스템**: 구현 완료
- ⚠️ **API 연결**: 인증 방식 조정 필요
- ✅ **테스트 프레임워크**: 구현 완료

## 🎯 다음 단계

1. Alibaba Cloud DashScope SDK 통합
2. 실제 API 연결 테스트
3. 프로덕션 배포 준비
4. 모니터링 시스템 구축
5. 사용자 인터페이스 연결

---

*Last Updated: 2025-09-09*
*Version: 1.0.0*
*Model: Qwen3-Max-Preview (1T+ parameters)*
