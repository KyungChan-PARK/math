# 🛠️ Claude Opus 4.1 - 완전한 도구 사용 가이드

**작성일**: 2025-09-08  
**버전**: 1.0.0  
**목적**: 모든 사용 가능한 도구들의 완전한 레퍼런스

## 📁 Filesystem 도구들

### 1. **Filesystem:read_file**
- **용도**: 단일 파일 읽기
- **예시**:
```javascript
Filesystem:read_file({
  path: "C:\\palantir\\math\\file.txt"
})
```

### 2. **Filesystem:read_multiple_files**
- **용도**: 여러 파일 동시 읽기
- **예시**:
```javascript
Filesystem:read_multiple_files({
  paths: ["file1.js", "file2.js", "file3.js"]
})
```

### 3. **Filesystem:write_file**
- **용도**: 파일 생성 또는 덮어쓰기
- **예시**:
```javascript
Filesystem:write_file({
  path: "C:\\palantir\\math\\new-file.js",
  content: "console.log('Hello');"
})
```

### 4. **Filesystem:edit_file**
- **용도**: 파일의 특정 부분 수정
- **예시**:
```javascript
Filesystem:edit_file({
  path: "file.js",
  edits: [{
    oldText: "const x = 5",
    newText: "const x = 10"
  }]
})
```

### 5. **Filesystem:create_directory**
- **용도**: 디렉토리 생성
- **예시**:
```javascript
Filesystem:create_directory({
  path: "C:\\palantir\\math\\new-folder"
})
```

### 6. **Filesystem:list_directory**
- **용도**: 디렉토리 내용 나열
- **예시**:
```javascript
Filesystem:list_directory({
  path: "C:\\palantir\\math"
})
```

### 7. **Filesystem:directory_tree** ✅
- **용도**: 디렉토리 구조를 트리 형태로 표시
- **예시**:
```javascript
Filesystem:directory_tree({
  path: "C:\\palantir\\math\\src"
})
```
- **출력**: JSON 형태의 트리 구조

### 8. **Filesystem:move_file**
- **용도**: 파일/디렉토리 이동 또는 이름 변경
- **예시**:
```javascript
Filesystem:move_file({
  source: "old-name.js",
  destination: "new-name.js"
})
```

### 9. **Filesystem:search_files** ✅
- **용도**: 파일 이름 패턴 검색
- **예시**:
```javascript
Filesystem:search_files({
  path: "C:\\palantir\\math",
  pattern: "test",  // 파일명에 'test' 포함
  excludePatterns: ["node_modules", ".git"]
})
```

### 10. **Filesystem:get_file_info**
- **용도**: 파일 메타데이터 조회
- **예시**:
```javascript
Filesystem:get_file_info({
  path: "C:\\palantir\\math\\package.json"
})
```

### 11. **Filesystem:list_allowed_directories**
- **용도**: 접근 가능한 디렉토리 확인
- **예시**:
```javascript
Filesystem:list_allowed_directories()
```

---

## 💻 Terminal (Desktop Commander) 도구들

### 1. **terminal:get_config**
- **용도**: 현재 설정 확인
- **예시**:
```javascript
terminal:get_config()
```

### 2. **terminal:set_config_value**
- **용도**: 설정 변경
- **예시**:
```javascript
terminal:set_config_value({
  key: "fileWriteLineLimit",
  value: 100
})
```

### 3. **terminal:read_file**
- **용도**: 파일 읽기 (offset/length 지원)
- **예시**:
```javascript
terminal:read_file({
  path: "large-file.txt",
  offset: 100,  // 100번째 줄부터
  length: 50    // 50줄만 읽기
})
```

### 4. **terminal:read_multiple_files**
- **용도**: 여러 파일 동시 읽기
- **예시**:
```javascript
terminal:read_multiple_files({
  paths: ["file1.txt", "file2.txt"]
})
```

### 5. **terminal:write_file**
- **용도**: 파일 쓰기 (청킹 지원)
- **예시**:
```javascript
terminal:write_file({
  path: "output.txt",
  content: "data",
  mode: "append"  // 또는 "rewrite"
})
```
- **팁**: 25-30줄씩 청킹하여 작성

### 6. **terminal:create_directory**
- **용도**: 디렉토리 생성
- **예시**:
```javascript
terminal:create_directory({
  path: "C:\\palantir\\math\\new-dir"
})
```

### 7. **terminal:list_directory**
- **용도**: 디렉토리 리스팅
- **예시**:
```javascript
terminal:list_directory({
  path: "C:\\palantir\\math"
})
```

### 8. **terminal:move_file**
- **용도**: 파일 이동/이름 변경
- **예시**:
```javascript
terminal:move_file({
  source: "old.txt",
  destination: "new.txt"
})
```

### 9. **terminal:start_search** ✅
- **용도**: 비동기 파일/내용 검색 시작
- **예시**:
```javascript
terminal:start_search({
  path: "C:\\palantir\\math",
  pattern: "TODO",
  searchType: "content",  // 또는 "files"
  filePattern: "*.js",    // 특정 파일 타입만
  ignoreCase: true,
  contextLines: 3,
  maxResults: 100
})
```

### 10. **terminal:get_more_search_results** ✅
- **용도**: 검색 결과 가져오기
- **예시**:
```javascript
terminal:get_more_search_results({
  sessionId: "search_1_xxxxx",
  offset: 0,
  length: 100
})
```

### 11. **terminal:stop_search** ✅
- **용도**: 실행 중인 검색 중지
- **예시**:
```javascript
terminal:stop_search({
  sessionId: "search_1_xxxxx"
})
```

### 12. **terminal:list_searches** ✅
- **용도**: 활성 검색 세션 목록
- **예시**:
```javascript
terminal:list_searches()
```

### 13. **terminal:get_file_info**
- **용도**: 파일 상세 정보
- **예시**:
```javascript
terminal:get_file_info({
  path: "C:\\palantir\\math\\package.json"
})
```

### 14. **terminal:edit_block**
- **용도**: 정밀한 코드 수정
- **예시**:
```javascript
terminal:edit_block({
  file_path: "script.js",
  old_string: "const x = 5;",
  new_string: "const x = 10;",
  expected_replacements: 1
})
```

### 15. **terminal:start_process**
- **용도**: 프로세스 실행
- **예시**:
```javascript
terminal:start_process({
  command: "node script.js",
  timeout_ms: 10000,
  shell: "powershell.exe"
})
```

### 16. **terminal:read_process_output**
- **용도**: 프로세스 출력 읽기
- **예시**:
```javascript
terminal:read_process_output({
  pid: 12345,
  timeout_ms: 5000
})
```

### 17. **terminal:interact_with_process**
- **용도**: 실행 중인 프로세스와 상호작용
- **예시**:
```javascript
terminal:interact_with_process({
  pid: 12345,
  input: "console.log('test')",
  timeout_ms: 5000
})
```

### 18. **terminal:force_terminate**
- **용도**: 프로세스 강제 종료
- **예시**:
```javascript
terminal:force_terminate({
  pid: 12345
})
```

### 19. **terminal:list_sessions**
- **용도**: 활성 터미널 세션 목록
- **예시**:
```javascript
terminal:list_sessions()
```

### 20. **terminal:list_processes**
- **용도**: 실행 중인 프로세스 목록
- **예시**:
```javascript
terminal:list_processes()
```

### 21. **terminal:kill_process**
- **용도**: 특정 프로세스 종료
- **예시**:
```javascript
terminal:kill_process({
  pid: 12345
})
```

### 22. **terminal:get_usage_stats**
- **용도**: 도구 사용 통계
- **예시**:
```javascript
terminal:get_usage_stats()
```

---

## 🔍 검색 도구 사용 패턴

### 파일 이름으로 검색 (빠름)
```javascript
// Filesystem 도구 사용
Filesystem:search_files({
  path: "C:\\palantir\\math",
  pattern: "test"
})
```

### 파일 내용 검색 (강력함)
```javascript
// Terminal 도구 사용
// 1. 검색 시작
const result = terminal:start_search({
  path: "C:\\palantir\\math",
  pattern: "TODO",
  searchType: "content",
  filePattern: "*.js"
})

// 2. 결과 가져오기
terminal:get_more_search_results({
  sessionId: result.sessionId
})
```

### 디렉토리 구조 탐색
```javascript
// 트리 구조로 보기
Filesystem:directory_tree({
  path: "C:\\palantir\\math\\src"
})

// 또는 단순 리스트
Filesystem:list_directory({
  path: "C:\\palantir\\math\\src"
})
```

---

## 🎯 도구 선택 가이드

### 언제 Filesystem 도구를 사용할까?
- ✅ 단순 파일 작업
- ✅ 빠른 파일명 검색
- ✅ 디렉토리 구조 확인
- ✅ 파일 메타데이터 조회

### 언제 Terminal 도구를 사용할까?
- ✅ 파일 내용 검색
- ✅ 프로세스 실행 및 관리
- ✅ 대용량 파일 부분 읽기
- ✅ 정밀한 코드 수정 (edit_block)
- ✅ Python/Node.js REPL 실행

---

## 💡 실전 사용 예시

### 1. 프로젝트 전체에서 TODO 찾기
```javascript
// 검색 시작
const search = terminal:start_search({
  path: "C:\\palantir\\math",
  pattern: "TODO",
  searchType: "content",
  filePattern: "*.js|*.ts|*.py",
  contextLines: 2
})

// 결과 확인
terminal:get_more_search_results({
  sessionId: search.sessionId
})
```

### 2. 특정 함수 이름 찾기
```javascript
Filesystem:search_files({
  path: "C:\\palantir\\math",
  pattern: "orchestrate",
  excludePatterns: ["node_modules", ".git"]
})
```

### 3. 프로젝트 구조 파악
```javascript
// 전체 구조 (작은 디렉토리)
Filesystem:directory_tree({
  path: "C:\\palantir\\math\\src"
})

// 큰 디렉토리는 리스트로
Filesystem:list_directory({
  path: "C:\\palantir\\math"
})
```

### 4. Python 데이터 분석
```javascript
// Python REPL 시작
const pid = terminal:start_process({
  command: "python3 -i",
  timeout_ms: 5000
})

// pandas로 CSV 분석
terminal:interact_with_process({
  pid: pid.pid,
  input: "import pandas as pd\ndf = pd.read_csv('data.csv')\nprint(df.head())"
})
```

---

## ✅ 모든 도구 정상 작동 확인!

모든 도구들이 이미 설치되어 있고 정상적으로 작동하고 있습니다:
- ✅ **Filesystem:directory_tree** - 작동 중
- ✅ **Filesystem:search_files** - 작동 중
- ✅ **terminal:start_search** - 작동 중
- ✅ **terminal:get_more_search_results** - 작동 중
- ✅ **terminal:list_searches** - 작동 중
- ✅ **terminal:stop_search** - 작동 중

별도의 설치가 필요하지 않습니다!

---

*이 가이드는 Claude Opus 4.1의 모든 사용 가능한 도구들을 문서화한 것입니다.*