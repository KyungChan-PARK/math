# 🛠️ Claude Code Opus 4.1 - 실제 사용 가능 도구 가이드

> **모델**: Claude Opus 4.1 (claude-opus-4-1-20250805)  
> **환경**: Claude Code on Windows 11 WSL2  
> **컨텍스트**: 200K tokens  
> **작성일**: 2025년 9월 11일

---

## 📌 실제 사용 가능한 핵심 도구들

### 1. Task (AI 에이전트 오케스트레이션)
```javascript
// 복잡한 작업을 자율적으로 처리하는 AI 에이전트 실행
const agentTypes = {
  'general-purpose': '복잡한 검색, 코드 분석, 다단계 작업',
  'statusline-setup': 'Claude Code 상태 표시줄 설정',
  'output-style-setup': 'Claude Code 출력 스타일 생성'
};

// 사용 예시
await Task({
  subagent_type: 'general-purpose',
  description: '코드베이스 분석',
  prompt: '프로젝트 구조를 분석하고 주요 컴포넌트를 식별해줘'
});
```

### 2. Bash (시스템 명령 실행)
```javascript
// 시스템 명령 실행 및 프로세스 관리
const bashCommands = {
  // 기본 명령
  execute: await Bash({ command: 'npm install' }),
  
  // 백그라운드 실행
  background: await Bash({ 
    command: 'npm run dev',
    run_in_background: true,
    timeout: 600000  // 최대 10분
  }),
  
  // Git 작업 (병렬 실행)
  gitStatus: await Bash({ command: 'git status' }),
  gitDiff: await Bash({ command: 'git diff' }),
  gitLog: await Bash({ command: 'git log --oneline -10' })
};
```

### 3. Read (파일 읽기)
```javascript
// 다양한 파일 형식 읽기
const readCapabilities = {
  // 텍스트 파일
  code: await Read({ file_path: '/path/to/file.js' }),
  
  // 이미지 (PNG, JPG 등) - 시각적 분석
  image: await Read({ file_path: '/path/to/screenshot.png' }),
  
  // PDF 문서
  pdf: await Read({ file_path: '/path/to/document.pdf' }),
  
  // Jupyter 노트북
  notebook: await Read({ file_path: '/path/to/notebook.ipynb' }),
  
  // 대용량 파일 (청크 읽기)
  largeFile: await Read({ 
    file_path: '/path/to/large.log',
    offset: 1000,
    limit: 2000
  })
};
```

### 4. Write / Edit / MultiEdit (파일 작성 및 수정)
```javascript
// 파일 작성
await Write({
  file_path: '/path/to/new-file.js',
  content: 'const app = express();'
});

// 단일 수정
await Edit({
  file_path: '/path/to/file.js',
  old_string: 'const oldVar = 1;',
  new_string: 'const newVar = 2;',
  replace_all: false
});

// 다중 수정 (권장)
await MultiEdit({
  file_path: '/path/to/file.js',
  edits: [
    { old_string: 'old1', new_string: 'new1' },
    { old_string: 'old2', new_string: 'new2', replace_all: true }
  ]
});
```

### 5. Glob (파일 패턴 검색)
```javascript
// 파일 패턴으로 빠른 검색
const patterns = {
  jsFiles: await Glob({ pattern: '**/*.js' }),
  testFiles: await Glob({ pattern: 'src/**/*.test.ts' }),
  configs: await Glob({ pattern: '**/config*.json' }),
  inDirectory: await Glob({ 
    pattern: '*.md',
    path: '/mnt/c/palantir/math'
  })
};
```

### 6. Grep (내용 검색)
```javascript
// 정규식 기반 강력한 검색
const searchResults = {
  // 파일 목록만
  files: await Grep({
    pattern: 'TODO',
    output_mode: 'files_with_matches'
  }),
  
  // 매칭 라인 표시
  content: await Grep({
    pattern: 'function.*export',
    output_mode: 'content',
    '-n': true,  // 라인 번호
    '-B': 2,     // 이전 2줄
    '-A': 2      // 이후 2줄
  }),
  
  // 특정 파일 타입에서만
  typescript: await Grep({
    pattern: 'interface',
    type: 'ts',
    multiline: true
  })
};
```

### 7. TodoWrite (작업 관리)
```javascript
// 작업 추적 및 관리
await TodoWrite({
  todos: [
    {
      content: '데이터베이스 스키마 설계',
      activeForm: 'Designing database schema',
      status: 'in_progress'
    },
    {
      content: 'API 엔드포인트 구현',
      activeForm: 'Implementing API endpoints',
      status: 'pending'
    }
  ]
});

// 상태: pending → in_progress → completed
```

### 8. WebSearch / WebFetch (웹 검색 및 가져오기)
```javascript
// 웹 검색
await WebSearch({
  query: 'React 19 new features',
  allowed_domains: ['react.dev', 'github.com'],
  blocked_domains: ['w3schools.com']
});

// 웹 페이지 가져오기 및 분석
await WebFetch({
  url: 'https://docs.anthropic.com/api-reference',
  prompt: 'API 엔드포인트와 인증 방법을 요약해줘'
});
```

### 9. NotebookEdit (Jupyter 노트북 편집)
```javascript
// Jupyter 노트북 셀 편집
await NotebookEdit({
  notebook_path: '/path/to/notebook.ipynb',
  cell_id: 'cell-123',
  cell_type: 'code',
  new_source: 'import pandas as pd\ndf = pd.read_csv("data.csv")',
  edit_mode: 'replace'  // replace, insert, delete
});
```

### 10. BashOutput / KillBash (백그라운드 프로세스 관리)
```javascript
// 백그라운드 프로세스 출력 확인
const output = await BashOutput({
  bash_id: 'shell-123',
  filter: 'ERROR|WARNING'  // 정규식 필터
});

// 프로세스 종료
await KillBash({
  shell_id: 'shell-123'
});
```

### 11. ExitPlanMode (계획 모드 종료)
```javascript
// 계획 수립 완료 후 실행 모드로 전환
await ExitPlanMode({
  plan: `
  1. 데이터베이스 설계
  2. API 구현
  3. 프론트엔드 개발
  4. 테스트 작성
  `
});
```

---

## 🔄 기존 가이드 → 실제 도구 매핑

| 가이드의 기능 | 실제 Claude Code 도구 | 사용 방법 |
|-------------|---------------------|----------|
| 75+ AI 에이전트 | **Task** | `Task({ subagent_type: 'general-purpose' })` |
| Desktop Commander | **Bash** | `Bash({ command: 'python3 script.py' })` |
| Extended Thinking | **Task** (자동 활성화) | 복잡한 작업 시 자동 |
| 파일 시스템 작업 | **Read, Write, Edit** | 직접 파일 경로 지정 |
| 코드 검색 | **Grep, Glob** | 패턴 기반 검색 |
| Git Worktree | **Bash** (git 명령) | `Bash({ command: 'git worktree add' })` |
| Python REPL | **Bash** (백그라운드) | `Bash({ command: 'python3 -i', run_in_background: true })` |
| 메모리 관리 | **TodoWrite** | 작업 추적 및 컨텍스트 유지 |
| 웹 데이터 | **WebSearch, WebFetch** | 최신 정보 검색 |
| React Artifact | **Write** (React 파일) | JSX 파일 직접 생성 |

---

## 💡 최적화된 워크플로우

### 1. 프로젝트 초기 분석
```javascript
// 병렬 실행으로 프로젝트 파악
const projectAnalysis = async () => {
  // TodoWrite로 작업 계획
  await TodoWrite({ todos: [...] });
  
  // 병렬로 정보 수집
  const [structure, packages, readme] = await Promise.all([
    Bash({ command: 'find . -type f -name "*.js" | head -20' }),
    Read({ file_path: './package.json' }),
    Read({ file_path: './README.md' })
  ]);
  
  // 주요 파일 패턴 검색
  const components = await Glob({ pattern: 'src/**/*.{jsx,tsx}' });
  
  // 핵심 로직 찾기
  const mainLogic = await Grep({
    pattern: 'export.*function|class.*extends',
    output_mode: 'files_with_matches'
  });
};
```

### 2. 코드 수정 작업
```javascript
// 효율적인 코드 수정 프로세스
const codeModification = async () => {
  // 1. 파일 읽기 (필수)
  await Read({ file_path: '/path/to/file.js' });
  
  // 2. 다중 수정 한 번에 처리
  await MultiEdit({
    file_path: '/path/to/file.js',
    edits: [
      // 모든 수정사항을 한 번에
    ]
  });
  
  // 3. 검증
  await Bash({ command: 'npm run lint' });
  await Bash({ command: 'npm test' });
};
```

### 3. Git 작업 (커밋/PR)
```javascript
// Git 작업 병렬 처리
const gitWorkflow = async () => {
  // 상태 확인 (병렬)
  const [status, diff, log] = await Promise.all([
    Bash({ command: 'git status' }),
    Bash({ command: 'git diff' }),
    Bash({ command: 'git log --oneline -5' })
  ]);
  
  // 커밋 생성
  await Bash({ 
    command: `git commit -m "$(cat <<'EOF'
feat: 새로운 기능 추가

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"` 
  });
};
```

### 4. 테스트 및 디버깅
```javascript
// 백그라운드 테스트 실행
const testing = async () => {
  // 테스트 시작
  await Bash({
    command: 'npm test -- --watch',
    run_in_background: true
  });
  
  // 출력 모니터링
  const output = await BashOutput({
    bash_id: 'test-shell',
    filter: 'FAIL|PASS'
  });
  
  // 실패한 테스트 파일 찾기
  if (output.includes('FAIL')) {
    await Grep({
      pattern: 'test\\.fail|expect.*toBe',
      type: 'js'
    });
  }
};
```

---

## ⚡ 성능 최적화 팁

### 병렬 처리 극대화
```javascript
// ❌ 순차적 실행 (느림)
const file1 = await Read({ file_path: 'file1.js' });
const file2 = await Read({ file_path: 'file2.js' });
const file3 = await Read({ file_path: 'file3.js' });

// ✅ 병렬 실행 (빠름)
const [file1, file2, file3] = await Promise.all([
  Read({ file_path: 'file1.js' }),
  Read({ file_path: 'file2.js' }),
  Read({ file_path: 'file3.js' })
]);
```

### 효율적인 검색
```javascript
// ❌ Bash로 find/grep (느림)
await Bash({ command: 'find . -name "*.js" | xargs grep "TODO"' });

// ✅ 전용 도구 사용 (빠름)
await Grep({ pattern: 'TODO', type: 'js' });
```

### 스마트한 파일 수정
```javascript
// ❌ 여러 번 Edit 호출 (비효율)
await Edit({ file_path: 'app.js', old_string: 'a', new_string: 'b' });
await Edit({ file_path: 'app.js', old_string: 'c', new_string: 'd' });

// ✅ MultiEdit 한 번 호출 (효율적)
await MultiEdit({
  file_path: 'app.js',
  edits: [
    { old_string: 'a', new_string: 'b' },
    { old_string: 'c', new_string: 'd' }
  ]
});
```

---

## 📋 프로젝트별 도구 선택 가이드

### 웹 개발 프로젝트
- **주력**: Read, MultiEdit, Bash (npm/yarn)
- **검색**: Glob (컴포넌트), Grep (함수/클래스)
- **테스트**: Bash (jest/vitest)
- **작업관리**: TodoWrite

### 데이터 분석 프로젝트
- **주력**: Bash (python -i), NotebookEdit
- **데이터**: Read (CSV/JSON), Write (결과)
- **시각화**: Bash (matplotlib/seaborn)
- **웹데이터**: WebFetch (API 데이터)

### 시스템 스크립팅
- **주력**: Bash, BashOutput
- **파일작업**: Read, Write, Edit
- **프로세스**: run_in_background, KillBash
- **로그분석**: Grep (정규식 필터)

### 대규모 리팩토링
- **주력**: Task (general-purpose), MultiEdit
- **분석**: Grep (패턴 찾기), Glob (파일 목록)
- **검증**: Bash (lint/test)
- **추적**: TodoWrite (단계별 작업)

---

## 🚨 주의사항

1. **Read 필수**: Edit/Write 전에 반드시 Read 먼저 실행
2. **병렬 실행**: 독립적인 작업은 Promise.all로 동시 실행
3. **백그라운드**: 장시간 실행 명령은 run_in_background 사용
4. **검색 도구**: find/grep 대신 Glob/Grep 도구 사용
5. **작업 추적**: 복잡한 작업은 TodoWrite로 관리

---

**준비 상태**: ✅ 모든 도구 활성화 및 최적화 완료  
**성능**: 병렬 처리 및 전용 도구로 최대 효율  
**적용**: 즉시 프로젝트 개발 가능