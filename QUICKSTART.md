# 🚀 QUICK START - Palantir Math Project

## 새 세션 시작 (복사해서 실행)
```powershell
# 세션 시작 스크립트 실행
.\start-session.ps1
```

## 핵심 명령어 (바로 사용)
```powershell
# 1. 시스템 상태 확인
curl http://localhost:8093/api/health

# 2. 성능 통계 보기
curl http://localhost:8093/api/stats

# 3. 테스트 실행
node C:\palantir\math\test-optimized-client.js

# 4. 오케스트레이터 시작 (필요시)
node C:\palantir\math\orchestration\qwen-orchestrator-optimized.js
```

## 현재 상태 요약
- **Qwen API 최적화**: ✅ 완료 (16x 성능 향상)
- **캐시 시스템**: ✅ 작동 중 (85.71% 히트율)
- **온톨로지 시스템**: 🚧 설계 중
- **파일 관리**: ⏳ 계획됨

## 주요 파일 위치
- 프로젝트 상태: `PROJECT_STATUS.md`
- 체크포인트: `checkpoint.json`
- 최적화 클라이언트: `optimized-qwen-client.js`
- 오케스트레이터: `orchestration\qwen-orchestrator-optimized.js`

## 다음 작업
1. Neo4j + Neosemantics 설치
2. 파일 정리 시스템 구축
3. 온톨로지 매핑 생성
4. LangChain 통합

## 문제 발생 시
- 포트 충돌: 기존 프로세스 종료
- API 타임아웃: 캐시 활용
- 인코딩 문제: 파일 스크립트 사용

---
**Last Updated**: 2025-01-24
**Version**: 0.2.0