# 🎯 AE Claude Max v3.5.0 - AI Agent Master Instruction PRD

## Introduction/Overview

당신은 AI Agent(Claude Opus 4.1)입니다. AE Claude Max는 수학 교사를 위한 혁신적인 실시간 교육 시각화 시스템입니다. 자연어 명령과 손 제스처를 통해 복잡한 수학 개념을 즉각적으로 시각화하며, AI가 자율적으로 시스템을 개선하고 교사의 스타일을 학습합니다. 본 문서는 AI Agent(Claude Opus 4.1)가 프로젝트를 개발하고 관리하는데 필요한 모든 지침을 정의합니다.

## Goals

1. **수학 교육 혁신**: 교사의 수업 준비 시간 80% 단축 (20분 → 4분)
2. **실시간 상호작용**: 제스처 인식 <50ms, WebSocket 850 msg/sec 달성
3. **자율 개발 시스템**: AI Agent가 스스로 학습하고 개선하는 시스템 구축
4. **하이브리드 플랫폼**: After Effects(고품질) + Figma(실시간 협업) 통합
5. **완벽한 추적성**: 모든 결정과 변경사항의 실시간 문서화

## User Stories

### 교사 관점
- **As a** 수학 교사, **I want to** 말로 "삼각형 그려줘"라고 명령 **so that** 즉시 시각화가 생성된다
- **As a** 수학 교사, **I want to** 손 제스처로 도형 크기 조절 **so that** 실시간으로 수정할 수 있다
- **As a** 수학 교사, **I want to** 내 수업 스타일을 AI가 학습 **so that** 점점 더 효율적으로 작업할 수 있다

### AI Agent 관점
- **As an** AI Agent, **I want to** 이슈 발생시 옵션 제시 **so that** 사용자가 최적의 결정을 내릴 수 있다
- **As an** AI Agent, **I want to** 모든 작업을 메모리에 저장 **so that** 학습과 개선이 가능하다
- **As an** AI Agent, **I want to** 병렬로 개발 진행 **so that** 효율적으로 목표를 달성할 수 있다

## Functional Requirements

### 1. 이슈 처리 프로토콜
1. **이슈 감지 시 즉시 개발 일시정지**
2. **이슈 복잡도 분석 (1-10 scale)**
3. **해결 옵션 생성 (1-5개, 복잡도에 따라)**
   - 간단한 이슈(1-3): 1-2개 옵션
   - 중간 이슈(4-6): 2-3개 옵션  
   - 복잡한 이슈(7-10): 3-5개 옵션
4. **사용자에게 명확한 형식으로 제시**
   ```
   ⚠️ 이슈 발견: [이슈 설명]
   영향도: [Low/Medium/High]
   
   해결 옵션:
   a) [권장] 설명 - 예상 시간, 장단점
   b) [대안1] 설명 - 예상 시간, 장단점
   c) [대안2] 설명 - 예상 시간, 장단점
   
   선택해주세요 (a/b/c):
   ```
5. **사용자 결정 대기 (타임아웃 없음)**
6. **선택된 옵션으로 개발 재개**
7. **결정사항 메모리 저장**

### 2. 개발 프로세스
1. **3-트랙 병렬 개발 체계**
   - Track A: MediaPipe 제스처 인식 (최우선)
   - Track B: NLP 자연어 처리 (병렬)
   - Track C: WebSocket 최적화 (병렬)
2. **매 작업마다 Extended Thinking 활용**
3. **MCP 도구 우선 사용 (Python I/O 금지)**
4. **모든 파일 작업은 Desktop Commander 사용**

### 3. 메모리 관리 시스템
1. **즉시 저장 원칙**
   - 모든 작업 시작/완료 시점 기록
   - 이슈와 해결책 패턴 저장
   - 사용자 결정사항 영구 기록
2. **GitHub 동기화 준비**
   - 메모리 내용을 .md 파일로 export
   - commit 메시지 자동 생성
   - 일일 백업 체크포인트

### 4. 하이브리드 플랫폼 아키텍처
1. **After Effects (고품질 렌더링)**
   - ExtendScript 생성 및 실행
   - CEP 12 유지 (UXP 추상화 준비)
   - 복잡한 애니메이션과 이펙트
2. **Figma (실시간 협업)**
   - 교육용 무료 라이선스 활용
   - WebSocket 기반 실시간 동기화
   - 학생과 화면 공유

### 5. 성능 요구사항
1. **제스처 인식**: <50ms 지연 (MediaPipe 21 keypoints)
2. **WebSocket**: 850 msg/sec (µWebSockets 최종 목표)
3. **NLP 처리**: <100ms 응답
4. **메모리 쿼리**: <10ms
5. **파일 작업**: 30줄 단위 청킹

### 6. 문서 자동 업데이트
1. **실시간 업데이트 트리거**
   - 코드 변경 시
   - 이슈 해결 시
   - 마일스톤 달성 시
2. **업데이트 내용**
   - 진행률 퍼센트
   - 최신 변경사항
   - 다음 단계 계획
3. **문서 일관성 검증**
   - 상호 참조 확인
   - 버전 정보 동기화
   - 날짜/시간 자동 갱신

### 7. 교사 피드백 통합
1. **애자일 스프린트 (1주 단위)**
2. **피드백 수집 채널**
   - 실시간 사용 로그
   - 주간 설문조사
   - 직접 인터뷰
3. **피드백 기반 우선순위 조정**
4. **개인화 학습 시스템**

## Non-Goals (Out of Scope)

1. **학생용 직접 인터페이스** (교사 전용)
2. **모바일 앱 개발** (데스크톱 우선)
3. **다국어 지원** (한국어/영어만)
4. **클라우드 배포** (로컬 우선)
5. **자동 채점 시스템** (시각화만)

## Design Considerations

### UI/UX 원칙
- **최소주의**: 교사가 수업에 집중할 수 있도록
- **직관성**: 학습 곡선 최소화
- **반응성**: 모든 액션에 즉각 피드백
- **접근성**: 다양한 교사 연령대 고려

### 제스처 디자인
- **PINCH**: 엄지-검지로 크기 조절
- **SPREAD**: 다섯 손가락으로 각도 조절
- **GRAB**: 주먹으로 이동
- **POINT**: 검지로 선택
- **DRAW**: 검지+중지로 그리기

## Technical Considerations

### 기술 스택
- **AI Model**: Claude Opus 4.1 with Extended Thinking
- **Gesture**: MediaPipe 21 keypoints + FingerNet
- **Backend**: Node.js + WebSocket + Neo4j
- **Frontend**: After Effects CEP + Figma Plugin
- **ML**: Windows ML (ONNX Runtime)

### 의존성 관리
- **Python**: 3.11+ for MediaPipe
- **Node.js**: 20+ for WebSocket
- **After Effects**: 2025 (CEP 12)
- **Figma**: Latest with education license

## Success Metrics

1. **개발 속도**: 주당 3개 이상 기능 완성
2. **이슈 해결률**: 95% 이상 첫 시도 성공
3. **문서 최신성**: 24시간 이내 업데이트
4. **코드 품질**: 0 critical bugs in production
5. **교사 만족도**: 90% 이상 긍정 평가

## Open Questions

1. GitHub 자동 동기화 구체적 구현 방식?
2. 교사 피드백 수집 자동화 방법?
3. Figma-AE 실시간 동기화 프로토콜?
4. 학교별 커스터마이징 범위?
5. 오프라인 모드 지원 여부?

---

**Created:** 2025-01-28
**Version:** v3.5.0
**Status:** Active Development
**AI Agent:** Claude Opus 4.1