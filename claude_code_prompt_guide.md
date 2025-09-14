<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Claude Code 모든 명령어 완전 가이드 (예시 포함)

Windows 11 Home, 16GB RAM, Core Ultra 7 환경에서 사용할 수 있는 **모든 Claude Code 명령어**를 상세한 예시와 함께 범주별로 설명합니다.

***

## 📌 CLI 기본 명령어 (터미널에서 실행)

### **세션 시작/관리**

#### `claude`

기본 대화형 세션 시작

```bash
# 예시 1: 기본 실행
cd ~/dev/projects/math
claude

# 예시 2: 초기 프롬프트와 함께 시작
claude "이 프로젝트의 구조를 분석하고 개선점을 알려줘"

# 예시 3: 직접 쿼리 모드 (한 번 실행 후 종료)
claude -p "모든 JavaScript 파일의 줄 수를 세어줘"
```


#### `claude --continue / -c`

최근 세션 재개

```bash
# 예시: 어제 작업하던 계산기 프로젝트 계속하기
claude -c
# → 자동으로 마지막 대화 컨텍스트 로드
```


#### `claude --resume / -r`

특정 세션 선택해서 재개

```bash
# 예시: 세션 목록 표시 후 선택
claude --resume
# → 1. math-project (2시간 전)
# → 2. calculator-refactor (1일 전)
# → 3. testing-setup (3일 전)
# → 선택: 1
```


### **모델 및 출력 설정**

#### `claude --model`

특정 모델 지정

```bash
# 예시 1: Opus 4.1 전용 모드로 시작
claude --model opus "복잡한 알고리즘을 분석해줘"

# 예시 2: Sonnet 4로 빠른 작업
claude --model sonnet "간단한 함수를 리팩토링해줘"
```


#### `claude --output-format`

출력 형식 지정

```bash
# 예시 1: JSON 파이프라인 처리용
claude -p "프로젝트의 모든 TODO를 찾아줘" --output-format json | jq '.todos'

# 예시 2: 실시간 스트리밍 (CI/CD용)
claude -p "테스트를 실행하고 결과를 실시간으로 보여줘" --output-format stream-json

# 예시 3: 기본 텍스트 출력
claude -p "README.md를 업데이트해줘" --output-format text
```


### **고급 CLI 플래그**

#### `claude --add-dir`

작업 디렉토리 추가

```bash
# 예시: 여러 디렉토리를 동시에 작업 범위에 포함
claude --add-dir ../shared-utils --add-dir ../docs "공통 유틸리티와 문서를 참고해서 API를 개발해줘"
```


#### `claude --allowedTools / --disallowedTools`

특정 도구 허용/차단

```bash
# 예시 1: Git 명령어만 허용
claude -p "안전하게 커밋만 해줘" --allowedTools "Bash(git:*)"

# 예시 2: 위험한 삭제 명령어 차단
claude -p "프로젝트를 정리해줘" --disallowedTools "Bash(rm:*),Bash(rmdir:*)"

# 예시 3: 네트워크 요청 차단
claude -p "로컬에서만 작업해줘" --disallowedTools "HTTP(*)"
```


#### `claude --max-turns`

대화 턴 제한 (토큰 절약)

```bash
# 예시: 간단한 수정 작업에 대화 제한
claude --max-turns 3 "이 함수의 버그를 찾아서 고쳐줘"
```


#### `claude --dangerously-skip-permissions`

권한 확인 건너뛰기 (자동화용)

```bash
# 예시 1: 린트 에러 자동 수정
claude --dangerously-skip-permissions -p "모든 ESLint 에러를 자동으로 고쳐줘"

# 예시 2: 안전한 환경(Docker)에서 사용
docker run -it --rm -v $(pwd):/workspace claude-env \
  claude --dangerously-skip-permissions "프로젝트를 빌드하고 테스트해줘"
```


***

## 🔧 내장 슬래시 명령어 (Claude Code 세션 내에서 사용)

### **세션 관리**

#### `/clear`

대화 기록 초기화 (컨텍스트 유지)

```bash
# 예시 사용 시나리오
claude> "calculator.js 파일을 분석해줘"
# ... 긴 대화 후
claude> /clear
# 파일 컨텍스트는 유지하면서 대화 기록만 정리됨
claude> "이제 새로운 기능을 추가해줘"  # 파일 정보는 여전히 기억
```


#### `/exit`

현재 세션 종료

```bash
# 예시: 작업 완료 후 정리해서 종료
claude> "작업한 내용을 요약해서 CLAUDE.md에 저장한 후 종료해줘"
claude> /exit
```


#### `/help`

사용 가능한 명령어 목록

```bash
claude> /help
# 출력 예시:
# Available commands:
# /clear - Clear conversation history
# /model - Switch AI model
# /init - Initialize project with CLAUDE.md
# ... (전체 명령어 목록 표시)
```


#### `/status`

계정 및 시스템 정보

```bash
claude> /status
# 출력 예시:
# Account: user@example.com (Max 20x Plan)
# Model: Claude Opus 4.1
# Session: 2h 15m active
# Files tracked: 23 files
# Last sync: 30 seconds ago
```


#### `/usage`

현재 사용량 확인 (Max 20x 한도 체크)

```bash
claude> /usage
# 출력 예시:
# Weekly Usage (Max 20x Plan):
# Opus 4: 12.5/40 hours (31% used)
# Sonnet 4: 45/480 hours (9% used)
# Messages: 1,247/∞
# Reset: 4 days, 12 hours
```


#### `/cost`

토큰 사용량 통계

```bash
claude> /cost
# 출력 예시:
# Session Token Usage:
# Input tokens: 12,543
# Output tokens: 8,921
# Total cost: $0.24 (API equivalent)
# Context efficiency: 87%
```


### **계정 및 인증**

#### `/login`

Anthropic 계정 전환/로그인

```bash
# 예시: 개인 계정에서 회사 계정으로 전환
claude> /login
# → Browser opened: https://claude.ai/auth
# → Enter verification code: ABC123
# → Logged in as: work@company.com
```


#### `/logout`

현재 계정 로그아웃

```bash
claude> /logout
# → Logged out from user@example.com
# → Session saved locally (encrypted)
```


#### `/doctor`

설치 문제 진단

```bash
claude> /doctor
# 출력 예시:
# ✓ Claude CLI version: 0.8.4 (latest)
# ✓ Node.js version: 18.17.0
# ✓ Internet connection: OK
# ✗ WSL2 memory: 12GB/16GB (75% used)
# ⚠ Recommendation: Restart WSL2 for optimal performance
```


#### `/config`

설정 인터페이스 열기

```bash
claude> /config
# → Opens: ~/.claude/config.json in default editor
# 또는 대화형 설정 모드 진입:
# 1. Model preferences
# 2. Directory permissions  
# 3. Hook settings
# 4. Custom commands
```


#### `/permissions`

파일/도메인 권한 관리

```bash
claude> /permissions
# 출력 예시:
# File Access:
# ✓ ~/dev/projects/math/ (read/write)
# ✓ ~/dev/shared-utils/ (read-only)
# 
# Domain Access:
# ✓ docs.python.org
# ✓ developer.mozilla.org
# ? github.com (ask each time)
#
# Add domain: /permissions add docs.anthropic.com
```


### **프로젝트 설정**

#### `/init`

CLAUDE.md 파일 자동 생성

```bash
claude> /init
# 자동 생성되는 CLAUDE.md 예시:
```

**생성되는 CLAUDE.md 내용:**

```markdown
# math 프로젝트

## 프로젝트 개요
JavaScript 87.1%, Python 11.9%, HTML 1.0%로 구성된 수학 계산 라이브러리

## 파일 구조
```

src/
├── js/
│   ├── calculator.js    \# 기본 계산 함수들
│   ├── trigonometry.js  \# 삼각함수 모듈
│   └── utils.js         \# 공통 유틸리티
├── python/
│   ├── math_core.py     \# 핵심 수학 연산
│   └── validators.py    \# 입력값 검증
└── tests/
├── js/              \# JavaScript 테스트
└── python/          \# Python 테스트

```

## 개발 규칙
- ES6+ 문법 사용, CommonJS 모듈
- Python PEP8 스타일 준수
- 모든 함수에 JSDoc/docstring 필수
- 단위 테스트 커버리지 90% 이상 유지

## 주요 명령어
- 테스트: `npm test && python -m pytest`
- 빌드: `npm run build`
- 린트: `npm run lint && flake8 src/python/`
```


#### `/memory`

프로젝트 메모리 파일 편집

```bash
claude> /memory
# → CLAUDE.md 파일을 편집기로 열거나
# → 대화형 메모리 업데이트 모드 진입
claude> "프로젝트에 새로운 통계 모듈을 추가했다는 걸 기억해줘"
# → CLAUDE.md 자동 업데이트됨
```


#### `/add-dir`

작업 디렉토리 추가 (세션 중)

```bash
claude> /add-dir ../shared-components
# → Added directory: ~/dev/shared-components (read-only)
# → 23 new files available in context
claude> "shared-components의 Button 컴포넌트를 참고해서 새로운 버튼을 만들어줘"
```


#### `/ide`

IDE 연동 (VS Code, Cursor 등)

```bash
claude> /ide
# 출력 예시:
# Available IDEs:
# 1. VS Code (detected: /mnt/c/Users/.../AppData/Local/Programs/Microsoft VS Code/)
# 2. Cursor (not installed)
# 3. Neovim (detected: /usr/bin/nvim)
# 
# Select IDE: 1
# ✓ VS Code integration enabled
# ✓ File synchronization active
# ✓ Real-time editing support enabled
```


#### `/terminal-setup`

터미널 환경 최적화

```bash
claude> /terminal-setup
# 자동 수행:
# ✓ Checking WSL2 configuration
# ✓ Optimizing font rendering (D2Coding ligature)
# ✓ Setting up aliases:
#   - ll='ls -alF'
#   - gs='git status'
#   - gd='git diff'
# ✓ Configuring prompt with git branch info
# ✓ Setting up tab completion for git
```


### **모델 및 도구 제어**

#### `/model`

모델 전환 메뉴

```bash
claude> /model
# 출력:
# Current: Claude Opus 4.1
# Available models:
# 1. Claude Opus 4.1 (best reasoning, slower)
# 2. Claude Sonnet 4 (balanced, faster) 
# 3. Auto-select (switches based on task)
#
# Select: 1
# ✓ Using Claude Opus 4.1 exclusively

# 직접 전환:
claude> /model opus    # Opus 4.1로 전환
claude> /model sonnet  # Sonnet 4로 전환
```


#### `/hooks`

자동화 훅 설정

```bash
claude> /hooks
# 출력 예시:
# Available hooks:
# 1. Pre-commit formatting (ESLint + Prettier)
# 2. Post-edit testing (run relevant tests)
# 3. Security scanning (check for secrets)
# 4. Documentation updates (auto-generate docs)
#
# Current hooks:
# ✓ PreToolUse: Security validation
# ✓ PostToolUse: Auto-formatting
#
# Configure hook: /hooks add pre-commit
```


#### `/mcp`

MCP 서버 관리

```bash
claude> /mcp
# 출력 예시:
# Connected MCP Servers:
# ✓ filesystem (local files) - 1.2.3
# ✓ git (repository tools) - 2.1.0
# ✗ github (API access) - connection failed
# ✓ postgres (database) - 0.9.1
#
# Available actions:
# 1. Reconnect failed servers
# 2. Add new server
# 3. Update server configuration
# 4. Test server connections
```


### **개발 작업**

#### `/review`

코드 리뷰 요청

```bash
claude> /review
# 자동 분석:
# Reviewing recent changes...
# 
# 📁 Modified files:
# - src/js/calculator.js (12 additions, 3 deletions)
# - tests/js/calculator.test.js (8 additions)
# 
# 🔍 Review results:
# ✓ Code quality: Good
# ⚠ Missing null checks in divide() function
# ✓ Test coverage: 94% (+2%)
# 💡 Suggestion: Extract magic numbers to constants
# 
# Apply suggestions? (y/N)
```


#### `/compact`

대화 내역 압축 (토큰 절약)

```bash
claude> /compact
# 수행 과정:
# 🔄 Analyzing conversation history (2,347 messages)
# 📝 Extracting key information...
# 💾 Preserving project context and decisions
# 🗜️ Compressing redundant exchanges
# ✓ Reduced context size: 2,347 → 892 messages (62% reduction)
# 📊 Tokens saved: ~15,000 tokens
```


#### `/vim`

Vim 모드 진입

```bash
claude> /vim src/js/calculator.js
# → Vim 인터페이스로 파일 편집 모드
# → Claude가 Vim 명령어 해석하여 파일 수정
# → :q로 나가면 자동으로 변경사항 적용
```


#### `/debug`

디버깅 모드 활성화

```bash
claude> /debug
# 디버깅 모드 활성화됨
# ✓ Verbose logging enabled
# ✓ Step-by-step execution tracking
# ✓ Error context expansion
# ✓ Performance monitoring active

claude> "divide(10, 0) 함수 호출 시 에러를 분석해줘"
# → 🐛 Debug trace:
# → Step 1: Function call divide(10, 0)
# → Step 2: Parameter validation - divisor is 0
# → Step 3: Error thrown: DivisionByZeroError
# → Step 4: Stack trace analysis...
```


#### `/plan`

계획 모드 활성화 (Shift+Tab 두 번과 동일)

```bash
claude> /plan "삼각함수 모듈을 추가하고 싶어"
# 📋 Implementation Plan:
# 
# Phase 1: File Structure
# 1. Create src/js/trigonometry.js
# 2. Add module exports for sin, cos, tan, etc.
# 3. Import in main calculator.js
# 
# Phase 2: Core Functions
# 1. Implement basic trig functions (sin, cos, tan)
# 2. Add inverse functions (asin, acos, atan)
# 3. Handle degree/radian conversion
# 
# Phase 3: Testing & Integration
# 1. Create comprehensive test suite
# 2. Add error handling for invalid inputs
# 3. Update documentation
# 
# Approve plan to proceed? (y/N)
```


***

## 🎛️ 커스텀 슬래시 명령어 시스템

### **개인 명령어 생성 예시** (모든 프로젝트에서 사용)

#### 보안 검토 명령어

```bash
mkdir -p ~/.claude/commands
cat > ~/.claude/commands/security-check.md << 'EOF'
---
name: security-check
description: 종합적인 보안 분석 수행
---

# 보안 분석 전문가

이 코드를 다음 관점에서 철저히 분석해줘:

## 검사 항목
1. **SQL 인젝션 취약점**
   - 사용자 입력을 직접 쿼리에 삽입하는 경우
   - 파라미터화된 쿼리 사용 여부

2. **XSS (Cross-Site Scripting) 공격 가능성**
   - HTML 출력 시 이스케이프 처리
   - innerHTML 사용 시 검증

3. **인증/인가 문제**
   - 권한 검증 누락
   - 세션 관리 취약점

4. **입력 데이터 검증**
   - 타입 검증 누락
   - 길이 제한 미설정
   - 특수문자 처리

5. **민감 정보 노출 위험**
   - 하드코딩된 비밀번호/API 키
   - 에러 메시지에서 시스템 정보 노출

## 출력 형식
- 🔴 심각: 즉시 수정 필요
- 🟡 주의: 검토 후 개선 권장  
- 🟢 양호: 보안 기준 충족

각 항목별로 구체적인 코드 라인과 개선 방안을 제시해줘.
EOF

# 사용 예시:
claude> /security-check
# → 현재 프로젝트의 모든 파일을 보안 관점에서 분석
```


#### 성능 최적화 명령어

```bash
cat > ~/.claude/commands/optimize.md << 'EOF'
---
name: optimize
description: 성능 병목점 찾기 및 최적화
---

# 성능 최적화 전문가

현재 코드의 성능을 다음과 같이 분석하고 개선해줘:

## 분석 영역
1. **알고리즘 복잡도**
   - Big O 분석
   - 중복 연산 감지
   - 효율적인 자료구조 제안

2. **메모리 사용량**
   - 메모리 누수 가능성
   - 불필요한 객체 생성
   - 가비지 컬렉션 영향

3. **I/O 최적화**
   - 파일 읽기/쓰기 최적화
   - 네트워크 요청 배치
   - 캐싱 전략

4. **JavaScript 특화**
   - 이벤트 루프 블로킹
   - DOM 조작 최적화
   - 번들 크기 최적화

5. **Python 특화**
   - 리스트 컴프리헨션 활용
   - 내장 함수 사용
   - 메모이제이션 적용

## 결과 제공
- 현재 성능 측정 결과
- 병목점과 개선 방안
- 최적화된 코드 제안
- 성능 향상 예상치

인수로 전달된 파일이나 함수에 대해서만 집중 분석: $ARGUMENTS
EOF

# 사용 예시:
claude> /optimize calculator.js
claude> /optimize factorial  # 특정 함수만 최적화
```


#### 테스트 자동 생성 명령어

```bash
cat > ~/.claude/commands/generate-tests.md << 'EOF'
---
name: generate-tests
description: 포괄적인 테스트 코드 자동 생성
---

# 테스트 자동화 전문가

다음 함수/모듈에 대한 포괄적인 테스트를 생성해줘:

## 테스트 범위
1. **단위 테스트 (Unit Tests)**
   - 모든 public 함수/메서드
   - 각종 입력값에 대한 테스트
   - 경계값 테스트 (boundary cases)

2. **예외 처리 테스트**
   - 잘못된 입력값 처리
   - null/undefined 처리
   - 타입 에러 상황

3. **통합 테스트 (Integration Tests)**  
   - 모듈 간 상호작용
   - 외부 API 호출 mock
   - 데이터베이스 연동 테스트

4. **성능 테스트**
   - 대용량 데이터 처리
   - 메모리 사용량 모니터링
   - 실행 시간 측정

## 테스트 프레임워크
- **JavaScript**: Jest, Mocha 중 프로젝트에 맞게 선택
- **Python**: pytest, unittest 활용
- **Mock**: 외부 의존성은 모두 mock 처리

## 코드 커버리지
- 최소 90% 이상 커버리지 목표
- 브랜치 커버리지 포함
- 누락된 테스트 케이스 명시

대상: $ARGUMENTS (함수명 또는 파일명)
EOF

# 사용 예시:
claude> /generate-tests calculator.js
claude> /generate-tests divide factorial  # 특정 함수들만
```


### **프로젝트 명령어 (팀 공유용)**

#### 배포 자동화 명령어

```bash
mkdir -p .claude/commands
cat > .claude/commands/deploy.md << 'EOF'
---
name: deploy  
description: 환경별 배포 자동화
---

# 배포 자동화 전문가

다음 단계로 프로젝트를 안전하게 배포해줘:

## 배포 전 검증
1. **코드 품질 체크**
```

npm run lint
npm run test
npm run build

```

2. **보안 검사**
- 하드코딩된 시크릿 검사
- 의존성 취약점 스캔
- 빌드 산출물 검증

3. **성능 테스트**
- 번들 크기 확인
- 로딩 시간 측정
- 메모리 사용량 체크

## 환경별 배포
### Staging 환경 ($ARGUMENTS = staging)
- 스테이징 서버로 배포
- E2E 테스트 실행
- 성능 벤치마크 수행

### Production 환경 ($ARGUMENTS = production)  
- Blue-Green 배포 수행
- 트래픽 점진적 전환
- 롤백 계획 준비

## 배포 후 검증
1. **헬스체크**
- API 엔드포인트 응답 확인
- 데이터베이스 연결 테스트
- 외부 서비스 연동 확인

2. **모니터링**
- 에러율 모니터링
- 응답시간 측정
- 리소스 사용량 확인

배포 대상 환경: $ARGUMENTS
EOF

# 사용 예시:
claude> /deploy staging
claude> /deploy production
```


### **네임스페이스 명령어 (고급 조직화)**

#### API 스캐폴딩 도구

```bash
mkdir -p ~/.claude/commands/tools
cat > ~/.claude/commands/tools/api-scaffold.md << 'EOF'
---
name: tools:api-scaffold
description: RESTful API 기본 구조 자동 생성
---

# API 스캐폴딩 전문가

"$ARGUMENTS" 엔티티에 대한 완전한 RESTful API를 생성해줘:

## 파일 구조
```

api/
├── routes/
│   └── \${ARGUMENTS,,}.js      \# 라우트 정의
├── models/
│   └── \${ARGUMENTS^}.js       \# 데이터 모델
├── controllers/
│   └── \${ARGUMENTS^}Controller.js  \# 비즈니스 로직
├── middleware/
│   └── \${ARGUMENTS,,}Auth.js  \# 인증/인가
└── tests/
└── \${ARGUMENTS,,}.test.js \# API 테스트

```

## CRUD 엔드포인트
- **GET    /api/${ARGUMENTS,,}**     - 목록 조회 (pagination)
- **GET    /api/${ARGUMENTS,,}/:id** - 단일 항목 조회  
- **POST   /api/${ARGUMENTS,,}**     - 새 항목 생성
- **PUT    /api/${ARGUMENTS,,}/:id** - 전체 업데이트
- **PATCH  /api/${ARGUMENTS,,}/:id** - 부분 업데이트
- **DELETE /api/${ARGUMENTS,,}/:id** - 항목 삭제

## 포함될 기능
1. **데이터 검증** (Joi/Yup)
2. **에러 핸들링** (표준 HTTP 상태코드)  
3. **로깅** (Winston/console)
4. **레이트 리미팅** (express-rate-limit)
5. **API 문서** (Swagger/OpenAPI)

## 데이터베이스 연동
- MongoDB (Mongoose) 또는 PostgreSQL (Sequelize) 선택
- 연결 설정 및 모델 스키마 생성
- 마이그레이션 스크립트 포함

엔티티명: $ARGUMENTS (예: User, Product, Order)
EOF

# 사용 예시:
claude> /tools:api-scaffold User
claude> /tools:api-scaffold Product
```


***

## 🌟 프로젝트 전체 파일 읽기 명령어

### **모든 파일을 문장단위로 빠짐없이 읽기**

#### 방법 1: `@` 참조를 이용한 전체 프로젝트 분석

```bash
# 프로젝트 루트에서 모든 파일을 재귀적으로 읽기
claude> "@. 이 프로젝트의 모든 파일을 문장단위로 빠짐없이 읽고 전체적인 구조와 기능을 상세히 분석해줘"

# 특정 확장자만 읽기
claude> "find . -name '*.js' -o -name '*.py' | head -20 이 파일들을 모두 읽고 분석해줘"

# 깊이 제한하여 읽기
claude> "find . -maxdepth 3 -type f | head -50 이 파일들의 내용을 모두 읽어줘"
```


#### 방법 2: 커스텀 명령어로 전체 프로젝트 스캔

```bash
cat > ~/.claude/commands/scan-project.md << 'EOF'
---
name: scan-project
description: 프로젝트 전체 파일을 문장단위로 완전 분석
---

# 프로젝트 전체 분석 전문가

프로젝트의 모든 파일을 빠짐없이 읽고 분석해줘:

## 1단계: 파일 인벤토리
먼저 다음 명령어로 모든 파일 목록을 가져와:
```

find . -type f \
-not -path '*/\.*' \
-not -path '*/node_modules/*' \
-not -path '*/venv/*' \
-not -path '*/dist/*' \
-not -path '*/build/*' \
| sort

```

## 2단계: 파일 분류
파일들을 다음과 같이 분류해:
- **소스 코드**: .js, .py, .ts, .jsx 등
- **설정 파일**: package.json, requirements.txt, config 파일들
- **문서**: README.md, CHANGELOG.md, 주석 파일들  
- **테스트**: test/, tests/, spec/ 디렉토리 파일들
- **빌드/배포**: Dockerfile, CI/CD 설정 등

## 3단계: 전체 코드 읽기
각 파일에 대해 다음을 수행해:
1. **파일 내용 완전 읽기** (cat 명령어 사용)
2. **함수/클래스 목록 추출**
3. **주요 로직 파악**
4. **의존성 관계 분석**
5. **TODO/FIXME 주석 수집**

## 4단계: 종합 분석 보고서
다음 형식으로 보고서 작성:

### 📊 프로젝트 개요
- 총 파일 수: X개
- 코드 라인 수: Y줄  
- 주요 기술 스택
- 프로젝트 목적과 기능

### 📁 아키텍처 분석
- 디렉토리 구조와 역할
- 모듈 간 의존성 그래프
- 설계 패턴 사용 현황

### 🔍 코드 품질 분석
- 코딩 컨벤션 준수도
- 테스트 커버리지 현황
- 잠재적 개선 포인트

### ⚠️ 이슈 및 개선사항
- 발견된 버그나 문제점
- 성능 최적화 기회
- 보안 취약점
- TODO 항목들

분석 범위: 현재 디렉토리의 모든 파일
EOF

# 사용법:
claude> /scan-project
```


#### 방법 3: 대용량 프로젝트를 위한 단계별 읽기

```bash
# 1단계: 핵심 파일들 먼저 읽기
claude> "package.json, README.md, main entry point 파일들을 먼저 읽어서 프로젝트를 파악해줘"

# 2단계: 소스 코드 디렉토리별 읽기  
claude> "src/ 디렉토리의 모든 파일을 읽고 분석해줘"
claude> "lib/ 디렉토리의 모든 파일을 읽고 분석해줘"

# 3단계: 테스트 파일들 읽기
claude> "test/, tests/, __tests__ 디렉토리의 모든 파일을 읽어서 테스트 전략을 파악해줘"

# 4단계: 설정 및 문서 파일들 읽기
claude> "*.json, *.md, *.yml, *.yaml 파일들을 모두 읽어서 프로젝트 설정을 파악해줘"
```


#### 방법 4: Shell 스크립트를 이용한 자동 파일 읽기

```bash
cat > ~/.claude/commands/read-all.md << 'EOF'
---
name: read-all
description: 모든 파일 내용을 순차적으로 읽기
---

# 전체 파일 리더

다음 스크립트로 모든 파일을 순차적으로 읽어줘:

```

\#!/bin/bash
echo "🔍 전체 프로젝트 파일 읽기 시작"
echo "================================="

# 읽을 파일 찾기 (바이너리 파일 제외)

find . -type f \
-not -path '*/\.*' \
-not -path '*/node_modules/*' \
-not -path '*/venv/*' \
-not -path '*/dist/*' \
-not -path '*/build/*' \
| while IFS= read -r file; do

    # 텍스트 파일인지 확인
    if file "$file" | grep -q text; then
        echo ""
        echo "📄 파일: $file"
        echo "$(wc -l < "$file") lines"
        echo "---"
        cat "$file"
        echo "---"
        echo ""
    fi
    done

echo "✅ 전체 파일 읽기 완료"

```

이 스크립트를 실행한 후, 출력 결과를 바탕으로:
1. **각 파일의 목적과 기능** 분석
2. **파일 간 연관관계** 파악  
3. **전체 프로젝트 아키텍처** 이해
4. **개선점과 최적화 방안** 제시

특별히 주의깊게 볼 파일들:
- Entry point 파일들 (main.js, app.py, index.js 등)
- 설정 파일들 (package.json, requirements.txt 등)
- 핵심 비즈니스 로직 파일들
- 테스트 파일들
EOF

# 사용법:
claude> /read-all
```


#### 방법 5: 언어별 특화 읽기

```bash
# JavaScript/TypeScript 프로젝트
claude> "find . -name '*.js' -o -name '*.ts' -o -name '*.jsx' -o -name '*.tsx' | xargs -I {} sh -c 'echo \"=== {} ===\" && cat \"{}\"' 이 모든 JavaScript/TypeScript 파일들을 읽고 분석해줘"

# Python 프로젝트  
claude> "find . -name '*.py' | xargs -I {} sh -c 'echo \"=== {} ===\" && cat \"{}\"' 이 모든 Python 파일들을 읽고 분석해줘"

# 설정 파일들만
claude> "find . -name '*.json' -o -name '*.yaml' -o -name '*.yml' -o -name '*.toml' -o -name '*.ini' | xargs -I {} sh -c 'echo \"=== {} ===\" && cat \"{}\"' 모든 설정 파일들을 읽고 프로젝트 구성을 파악해줘"
```


***

## 🚀 실제 사용 시나리오 예시

### **math 프로젝트 완전 분석 워크플로우**

```bash
# 1. 프로젝트 진입 및 초기 설정
cd ~/dev/projects/math
claude --model opus

# 2. 프로젝트 전체 스캔
claude> /scan-project

# 3. 특화 분석 (JavaScript + Python 혼합)
claude> /tools:analyze-polyglot "JavaScript Python 혼합 프로젝트의 상호운용성을 분석해줘"

# 4. 수학 프로젝트 특화 분석
claude> "이 프로젝트의 모든 수학 함수들을 찾아서 정확성, 성능, 테스트 커버리지를 종합 분석해줘"

# 5. 개선 계획 수립
claude> /plan "프로젝트 품질을 높이기 위한 개선 계획을 세워줘"

# 6. 자동화 설정
claude> /hooks add pre-commit "수학 함수 테스트 자동 실행"
```

이 가이드를 따라하면 Claude Code의 모든 기능을 활용하여 프로젝트 전체를 빠짐없이 분석하고 개발 생산성을 극대화할 수 있습니다.
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^18][^2][^3][^4][^5][^6][^7][^8][^9]</span>

<div style="text-align: center">⁂</div>

[^1]: jangcisayang.jpg

[^2]: https://milvus.io/ai-quick-reference/can-i-upload-files-to-claude-code-for-processing

[^3]: https://github.com/haasonsaas/claude-recursive-spawn

[^4]: https://www.paulmduvall.com/claude-code-advanced-tips-using-commands-configuration-and-hooks/

[^5]: https://www.reddit.com/r/ClaudeAI/comments/1efy6yf/best_way_to_use_claude_projects_for_coding_one/

[^6]: https://stevekinney.com/courses/ai-development/referencing-files-in-claude-code

[^7]: https://dev.to/holasoymalva/the-ultimate-claude-code-guide-every-hidden-trick-hack-and-power-feature-you-need-to-know-2l45

[^8]: https://www.siddharthbharath.com/claude-code-the-complete-guide/

[^9]: https://www.reddit.com/r/ClaudeCode/comments/1ljzlif/claudemd_files_in_subdirectories_arent_being/

[^10]: https://www.reddit.com/r/ClaudeAI/comments/1l3gouj/share_your_claude_code_commands/

[^11]: https://www.anthropic.com/engineering/claude-code-best-practices

[^12]: https://www.youtube.com/watch?v=Bz5fyyCa2-0

[^13]: https://www.reddit.com/r/ClaudeAI/comments/1jpyqlu/claude_codes_context_magic_does_it_really_scan/

[^14]: https://docs.anthropic.com/en/docs/claude-code/overview

[^15]: https://apidog.com/blog/claude-code-beginners-guide-best-practices/

[^16]: https://www.reddit.com/r/ClaudeAI/comments/1e4d7cl/aidigest_copy_your_whole_codebase_into_a_claude/

[^17]: https://www.builder.io/blog/claude-code

[^18]: https://github.com/hesreallyhim/awesome-claude-code

