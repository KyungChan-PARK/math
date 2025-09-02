# 📚 AE Claude Max v3.1 - 개발 문서 인덱스

> **Note**: 이 디렉토리는 AI 에이전트가 프로젝트 개발 시 참조하는 핵심 문서들을 포함합니다.
> 토큰 효율성을 위해 필요한 문서만 포함되어 있습니다.

## 📋 문서 목록

### 1. 프로젝트 가이드라인
- **AI_AGENT_GUIDELINES.md** - AI 에이전트 개발 가이드라인
  - 자율 개발 원칙
  - MCP 도구 사용법
  - 우선순위 규칙
  - 안전 규칙

### 2. 구현 계획
- **IMPLEMENTATION_PLAN_V3.md** - v3.1 구현 계획서
  - 일정 및 마일스톤
  - 기술 스택
  - 성능 목표
  - 위험 관리

### 3. 최적화 문서
- **OPTIMIZATION_REPORT.md** - 상세 최적화 보고서
  - 캐싱 시스템
  - 모델 라우팅
  - 성능 메트릭
  
- **OPTIMIZATION_SUMMARY.md** - 최적화 요약
  - 핵심 개선사항
  - 비용 절감 전략

### 4. 통합 계획
- **PALANTIR_INTEGRATION_PLAN.md** - Palantir 디바이스 통합 계획
  - 하드웨어 사양 고려사항
  - Windows 11 최적화
  - 메모리 관리

### 5. 에이전트 정의 (agents/)
- **ae-asset-processor.md** - 미디어 자산 처리 에이전트
- **ae-render-optimizer.md** - 렌더 최적화 에이전트
- **ae-composition-builder.md** - 컴포지션 생성 에이전트
- **ae-delivery-automation.md** - 배포 자동화 에이전트

## 🔄 업데이트 이력

| 날짜 | 버전 | 변경사항 |
|------|------|----------|
| 2025-09-02 | v3.1 | 개발 문서 디렉토리 생성 및 정리 |
| 2025-09-02 | v3.1 | 구버전 문서 제거 |

## 📝 사용 방법

### AI 에이전트용
```python
# 문서 로드 예시
with open('dev-docs/AI_AGENT_GUIDELINES.md', 'r') as f:
    guidelines = f.read()
```

### 개발자용
이 디렉토리의 문서들은 프로젝트의 핵심 개발 지침을 포함합니다.
새로운 기능 개발이나 버그 수정 시 반드시 참조하세요.

## ⚠️ 주의사항

1. 이 디렉토리의 문서는 **수동 관리**됩니다
2. 구버전 문서는 자동으로 삭제되었습니다
3. 새 버전 추가 시 반드시 이 인덱스를 업데이트하세요

## 🗑️ 삭제된 구버전 문서들

다음 파일들은 구버전으로 확인되어 삭제되었습니다:
- README_V2.md (2025-09-01)
- README_v31.md (2025-09-02 16:50)
- AI_AGENT_GUIDELINES_v1.md.backup
- UPGRADE_PLAN_V2.md
- UPGRADE_NOTES_V2.md

---
*Last Updated: 2025-09-02 17:30*
