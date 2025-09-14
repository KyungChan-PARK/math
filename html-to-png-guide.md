# HTML 파일을 PNG로 변환하는 Claude Code CLI 작업지시서

## 프로젝트 개요
HTML 파일을 고품질 PNG 이미지로 변환하는 Node.js 기반 자동화 도구 개발

## 개발 환경
- **플랫폼**: WSL2 (Ubuntu 22.04) on Windows
- **Node.js**: 최신 LTS 버전
- **개발 경로**: `/mnt/c/palantir/html-to-png` 또는 `/palantir/html-to-png`

## 핵심 기능 요구사항

### 1. 기본 변환 기능
- HTML 파일을 PNG 이미지로 변환
- Full-page 스크린샷 지원 (전체 페이지 캡처)
- 고해상도 이미지 생성 (최소 300 DPI)
- CSS 스타일과 레이아웃 완벽 보존

### 2. 고급 옵션 지원
- **해상도 설정**: DPR(Device Pixel Ratio) 조정 가능 (1x, 2x, 3x)
- **이미지 크기**: 커스텀 viewport 크기 설정
- **품질 옵션**: PNG 압축 레벨 조정
- **클리핑**: 특정 영역만 캡처하는 기능

### 3. 배치 처리
- 여러 HTML 파일 동시 처리
- 폴더 단위 일괄 변환
- 진행 상황 표시

## 기술 스택 권장사항

### 필수 라이브러리
1. **Puppeteer** (v21+): 메인 HTML-to-PNG 변환 엔진
2. **node-html-to-image**: 추가 변환 옵션
3. **Commander.js**: CLI 인터페이스
4. **Chalk**: 컬러풀한 터미널 출력

### 설치 명령어
```bash
npm init -y
npm install puppeteer node-html-to-image commander chalk fs-extra path
npm install --save-dev nodemon
```

## 코드 구조

### 파일 구조
```
html-to-png/
├── src/
│   ├── converter.js      # 메인 변환 로직
│   ├── cli.js           # CLI 인터페이스
│   └── utils.js         # 유틸리티 함수
├── input/               # HTML 입력 파일 폴더
├── output/              # PNG 출력 파일 폴더
├── package.json
└── README.md
```

### 메인 기능 명세

#### converter.js 핵심 기능
```javascript
class HTMLToPNGConverter {
    async convertSingle(htmlPath, options = {}) {
        // 단일 HTML 파일 변환
        // - fullPage: true (전체 페이지)
        // - deviceScaleFactor: 2 (고해상도)
        // - viewport 설정
        // - CSS 미디어 쿼리 지원
    }
    
    async convertBatch(inputDir, outputDir, options = {}) {
        // 배치 변환 처리
        // - 폴더 내 모든 HTML 파일 처리
        // - 진행 상황 표시
        // - 에러 핸들링
    }
    
    async convertWithClipping(htmlPath, clipArea, options = {}) {
        // 특정 영역만 캡처
        // - clip: {x, y, width, height}
        // - 요소 선택자 기반 캡처
    }
}
```

#### CLI 옵션 설계
```bash
# 기본 사용법
node cli.js convert input.html output.png

# 고해상도 변환
node cli.js convert input.html output.png --dpr 3

# 배치 처리
node cli.js batch ./input ./output

# 커스텀 크기
node cli.js convert input.html output.png --width 1920 --height 1080

# 특정 요소만 캡처
node cli.js convert input.html output.png --selector "#main-content"
```

## 성능/품질 최적화 요구사항

### 1. 이미지 품질
- **최소 해상도**: 300 DPI (인쇄용)
- **색상 정확도**: sRGB 색공간 보장
- **폰트 렌더링**: 안티앨리어싱 활성화
- **투명도 지원**: PNG 알파 채널 보존

### 2. 변환 속도
- 단일 파일: 5초 이내
- 배치 처리: 병렬 처리로 최적화
- 메모리 사용량: 1GB 이하 유지

### 3. 호환성
- **웹 폰트**: Google Fonts 등 외부 폰트 로딩 대기
- **JavaScript**: DOM 조작 완료 후 캡처
- **CSS**: Flexbox, Grid, CSS Variables 지원
- **미디어 쿼리**: 반응형 디자인 정확한 렌더링

## 에러 처리 및 로깅

### 필수 에러 핸들링
- 파일 존재 여부 확인
- HTML 파싱 오류 처리
- 이미지 저장 실패 처리
- 메모리 부족 상황 대응

### 로깅 시스템
- 변환 시작/완료 시간 기록
- 에러 로그 파일 생성
- 성공/실패 통계 표시

## 추가 기능 (선택사항)

### 1. 프리뷰 기능
- 변환 전 HTML 미리보기
- 브라우저에서 바로 열기

### 2. 설정 파일 지원
- JSON 설정 파일로 기본 옵션 저장
- 프로젝트별 설정 관리

### 3. 워터마크/메타데이터
- PNG 파일에 생성 정보 추가
- 커스텀 워터마크 삽입

## 테스트 케이스

### 필수 테스트 HTML 파일들
1. **기본 레이아웃**: 단순한 텍스트와 이미지
2. **복잡한 CSS**: Flexbox, Grid, 애니메이션
3. **반응형 디자인**: 미디어 쿼리 사용
4. **웹 폰트**: 외부 폰트 로딩
5. **JavaScript**: DOM 조작이 있는 페이지

## 성공 기준
- ✅ 모든 HTML 요소가 깨지지 않고 PNG로 변환
- ✅ CSS 스타일과 레이아웃이 100% 보존
- ✅ 고해상도 이미지 생성 (최소 300 DPI)
- ✅ 배치 처리 시 안정적인 동작
- ✅ CLI 인터페이스가 직관적이고 사용하기 쉬움

## 최종 실행 예시
```bash
# 개발 완료 후 실행할 명령어들
cd /mnt/c/palantir/html-to-png
npm install
node cli.js convert sample.html output.png --dpr 2 --fullpage
node cli.js batch ./test-files ./results
```

---
**개발 우선순위**: 기본 변환 기능 → CLI 인터페이스 → 배치 처리 → 고급 옵션 → 최적화