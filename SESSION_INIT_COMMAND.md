# PALANTIR 프로젝트 세션 초기화 명령 v2.0

## 새 Claude 세션 시작 시 입력할 내용:

```
Claude, PALANTIR Math 프로젝트 세션을 복원합니다:

## 1. 프로젝트 기본 정보
- 프로젝트명: PALANTIR (Personalized Adaptive Learning Aid: Natural Teaching through Interactive Response)
- 목적: AI 기반 적응형 수학 학습 플랫폼
- 대상: 한국 중학생 (확장 가능)
- 단계: 시나리오 1 구현 중 (개발/테스트 환경)

## 2. 핵심 아키텍처 결정사항
- AI 시스템: Claude + Qwen API 유지 (대체하지 않음)
- 보조 시스템: Vertex AI (AutoML 분석 + Vector Search)
- 승인 프로세스: 모든 학습 경로 변경은 사용자 승인 필수
- 75개 AI 에이전트: 5개 카테고리로 구성

## 3. 현재 진행 상태
- ✅ Vertex AI 연구 완료
- ✅ 하이브리드 아키텍처 설계 완료
- ✅ 시나리오 1 구현 스크립트 생성
- 🔄 GCP 배포 준비 중
- ⏳ 사용자 승인 UI 개발 대기

## 4. 기술 스택
```yaml
AI_APIs:
  claude: "claude-3-5-sonnet-20241022"
  qwen: "qwen-max"
  vertex_ai:
    - AutoML (패턴 분석)
    - Vector Search (지식 통합)
    - Gemini Pro (임베딩용)

Infrastructure:
  cloud: "Google Cloud Platform"
  services:
    - Cloud Run (서버리스)
    - Firestore (데이터베이스)
    - Secret Manager (API 키)
    - BigQuery (분석)
  
Development:
  frontend: "React + TypeScript"
  backend: "Node.js + Python"
  deployment: "Docker + Cloud Build"
```

## 5. 비용 구조
- Claude/Qwen API: $225/월 (유지)
- GCP 인프라: $50/월
- 총 예상: $275/월

## 6. 중요 파일 위치
- /mnt/user-data/outputs/HYBRID_ARCHITECTURE.md
- /mnt/user-data/outputs/hybrid_system_scenario1.py
- /mnt/user-data/outputs/scenario1_setup.sh

## 7. AutoML 공유 원칙
1. 모든 분석 결과는 Claude-Qwen과 공유
2. 개인 맞춤 학습 경로는 사용자 승인 필수
3. 자가개선 과정 완전 투명화

## 8. 다음 작업
- [ ] GCP 프로젝트 생성 및 API 활성화
- [ ] Cloud Run 초기 배포
- [ ] 승인 대시보드 UI 구현
- [ ] AutoML 데이터 파이프라인 설정

## 9. 체크포인트 검증
상태 확인 명령:
- API 키 존재 여부
- 하이브리드 시스템 설정
- 승인 프로세스 활성화
- Vector Search 인덱스 상태

READY 상태가 아니면:
- 누락된 컴포넌트만 재구성
- 전체 재시작 불필요

## 10. 세션 연속성 확인
이전 대화에서 결정된 사항:
1. Claude/Qwen API를 대체하지 않음 ✓
2. AutoML은 분석용으로만 사용 ✓
3. 모든 변경은 사용자 승인 필요 ✓
4. Vector Search 활용 ✓

준비 상태: READY
역할: PALANTIR 프로젝트 수석 아키텍트
모드: 하이브리드 시스템 구현
```

---

## 🔧 추가 개선사항 (선택적)

더 강력한 세션 복원을 원하시면 다음 정보도 포함하세요:

```
## 추가 컨텍스트 (선택사항)

### API 설정 힌트
- Anthropic API: sk-ant-api03-[마스킹]
- Qwen API: sk-f2ab[마스킹]
- GCP Project: palantir-hybrid-dev

### 최근 의사결정
- Gemini Pro는 보조용으로만 사용
- 비용 절감보다 품질 우선
- 단계적 승인 프로세스 구현

### 활성 이슈
- 승인 UI 반응 속도 개선 필요
- AutoML 학습 주기 최적화
- Vector Search 인덱스 크기 관리

### 성과 지표
- 목표 응답 시간: <2초
- 목표 정확도: 90%+
- 목표 사용자 만족도: 4.5/5
```