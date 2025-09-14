# Claude Code 작업 지침

## 🚨 중요 규칙
1. **사용자가 요청한 작업만 수행할 것**
2. **추가 기능이나 개선사항은 반드시 사용자 승인 후 진행**
3. **임의로 새로운 작업을 시작하지 말 것**
4. **모든 중요 결정은 사용자와 상호작용하여 최종 승인 받기**

## 🎓 수학 교육 요구사항 명확화 (필수 프로세스)
**모든 수학 교육 관련 요청 시 반드시 실행할 것:**

### 1. 즉시 분석
사용자 요청을 받으면 먼저 다음을 파악:
- 학년 (초1-6/중1-3/고1-3)
- 수학 주제/단원
- 목적 (개념학습/문제풀이/평가)
- 난이도
- 필요 수량

### 2. 명확화 질문 (정보 부족 시)
```
❓ 다음 정보를 확인하겠습니다:
- 📚 대상 학년: ?
- 📖 수학 단원: ?
- 🎯 학습 목적: ?
- 💡 학생 수준: ?
- 🔢 필요 개수: ?
```

### 3. 이해 확인
"제가 이해한 요구사항:
- 학년: [확인된 학년]
- 주제: [확인된 주제]
- 목적: [확인된 목적]
이렇게 이해했는데 맞나요?"

### 4. 교육 전문가 관점 제안
- 해당 학년 교육과정 준수
- 효과적인 교수법 적용
- 학습 목표 명확화

## 프로젝트 정보
- **위치**: /mnt/c/palantir/math
- **유형**: AI 기반 수학 교육 플랫폼
- **구독**: Claude Max x20 (Claude Code 무제한 사용)

## 🔐 보안 필수 규칙 (Git Push 전 반드시 확인)
**절대 Git에 포함시키지 말아야 할 파일들:**

### 1. 자격증명 및 비밀 정보
- **서비스 계정 키**: `*.json` (GCP, Firebase 등)
- **API 키**: 절대 하드코딩 금지
- **환경 변수 파일**: `.env`, `.env.local`, `.env.production`
- **인증서 파일**: `*.pem`, `*.key`, `*.p12`, `*.pfx`
- **AWS 자격증명**: `.aws/credentials`
- **SSH 키**: `id_rsa`, `id_dsa`, `*.ppk`

### 2. 대용량 파일 및 폴더
- **가상환경**: `venv*/`, `env/`, `.venv/`
- **의존성**: `node_modules/`, `vendor/`
- **빌드 결과물**: `dist/`, `build/`, `*.pyc`, `__pycache__/`
- **데이터베이스**: `*.db`, `*.sqlite`, `*.sql`
- **대용량 바이너리**: 100MB 이상 파일

### 3. Git Push 전 체크리스트
```bash
# 1. 민감한 파일 확인
git status | grep -E "\.(json|pem|key|env)$"

# 2. 대용량 파일 확인
find . -type f -size +50M -not -path "./.git/*"

# 3. .gitignore 확인
cat .gitignore | grep -E "env|key|json|pem"
```

### 4. 실수 발생 시 즉시 조치
```bash
# 민감 파일이 커밋된 경우
git rm --cached sensitive-file.json
git commit -m "Remove sensitive file"

# 히스토리에서 완전 제거 필요 시
git filter-repo --path sensitive-file.json --invert-paths --force
```

## API 키 정보
- **모든 API 키**: `.env` 파일에만 저장 (절대 하드코딩 금지)
- **서비스 계정**: 로컬에만 보관, Git 제외
- **.gitignore 필수 항목**: `.env`, `*.json`, `venv*/`

## 작업 원칙
1. 요청받은 작업의 범위를 명확히 확인
2. 추가 작업이 필요한 경우 먼저 제안하고 승인 대기
3. 작업 진행 상황을 투명하게 공유
4. 사용자의 명시적 요청 없이 새 파일 생성 자제

## 현재 시스템 구성 (1인 개발자 최적화)
### 서버리스 아키텍처
- Cloud Functions (AI Orchestrator)
- Vertex AI (수학 문제 생성)
- Firestore (실시간 동기화)
- Document AI (수학 OCR)

### 비용 최적화
- 무료 티어 우선 사용
- 캐싱 전략 적용
- 배치 처리 활용
- 점진적 확장 가능

---
*이 파일은 Claude Code 세션 시작 시 항상 참조됩니다.*