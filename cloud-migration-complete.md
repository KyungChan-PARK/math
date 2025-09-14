# 완전 클라우드 마이그레이션 계획

## 현재 상태 분석

### ✅ 이미 마이그레이션됨:
- `functions/generate-problem/` → Cloud Functions
- `teacher-app/` → Cloud Run  
- Firestore 데이터베이스 설정
- Cloud Scheduler (주간 배치)

### ❌ 마이그레이션 필요:
1. **로컬 서비스들**
   - WebSocket 서버 (8100) → Cloud Run with WebSockets
   - Ontology Optimizer → Cloud Functions
   - AI Orchestrator → Cloud Workflows
   - Monitor 시스템 → Cloud Monitoring

2. **로컬 파일들**
   - 20+ JavaScript 파일 → Cloud Functions/Cloud Run
   - Python 스크립트들 → Cloud Functions
   - 정적 HTML 파일들 → Cloud Storage

## 완전 클라우드 아키텍처

```yaml
# docker-compose.yml for local testing
version: '3.8'

services:
  # SAT 문제 생성 서비스
  problem-generator:
    build: ./functions/generate-problem
    environment:
      - MODE=SAT
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    ports:
      - "8080:8080"

  # 교사 대시보드
  teacher-dashboard:
    build: ./teacher-app
    ports:
      - "3000:3000"
    depends_on:
      - problem-generator

  # WebSocket 서버 (실시간 통신)
  websocket-server:
    build: ./services/websocket
    ports:
      - "8100:8100"
    environment:
      - FIRESTORE_PROJECT=${PROJECT_ID}

  # 스케줄러 에뮬레이터
  scheduler:
    build: ./services/scheduler
    environment:
      - CRON_SCHEDULE="0 20 * * SUN"
```

## Cloud Run 마이그레이션 (WebSocket 지원)

```javascript
// services/websocket/index.js
const express = require('express');
const { Server } = require('socket.io');
const { Firestore } = require('@google-cloud/firestore');

const app = express();
const server = require('http').createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ["*"],
    methods: ["GET", "POST"]
  }
});

const firestore = new Firestore();

// SAT 문제 실시간 협업
io.on('connection', (socket) => {
  console.log('Student connected:', socket.id);
  
  socket.on('join-session', async (data) => {
    const { studentId, sessionId } = data;
    socket.join(sessionId);
    
    // Firestore에서 세션 데이터 로드
    const session = await firestore.collection('sat_sessions').doc(sessionId).get();
    socket.emit('session-data', session.data());
  });
  
  socket.on('submit-answer', async (data) => {
    const { problemId, answer, studentId } = data;
    
    // 답안 검증 및 저장
    await firestore.collection('submissions').add({
      problemId,
      answer,
      studentId,
      timestamp: new Date(),
      socketId: socket.id
    });
    
    // 교사에게 실시간 알림
    io.to('teachers').emit('student-submission', data);
  });
  
  socket.on('request-hint', async (data) => {
    const { problemId, hintLevel } = data;
    
    // Khan Academy 스타일 힌트 제공
    const hint = await generateHint(problemId, hintLevel);
    socket.emit('hint-response', hint);
  });
});

const PORT = process.env.PORT || 8100;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
```

## Cloud Workflows 통합

```yaml
# workflows/sat-problem-workflow.yaml
main:
  params: [input]
  steps:
    - init:
        assign:
          - project: ${sys.get_env("GOOGLE_CLOUD_PROJECT_ID")}
          - location: "us-central1"
          
    - generateProblems:
        call: http.post
        args:
          url: https://generate-problem-${location}-${project}.cloudfunctions.net/generateSATProblem
          body:
            mode: "SAT"
            topic: ${input.topic}
            count: ${input.count}
            difficulty: ${input.difficulty}
          auth:
            type: OIDC
        result: problems
        
    - reviewQueue:
        call: googleapis.firestore.v1.projects.databases.documents.create
        args:
          parent: projects/${project}/databases/(default)/documents
          collectionId: sat_review_queue
          body:
            fields:
              problems: ${problems}
              status: "pending_review"
              created: ${sys.now()}
        result: reviewDoc
        
    - notifyTeacher:
        call: http.post
        args:
          url: https://teacher-app-${location}-${project}.run.app/api/notify
          body:
            reviewId: ${reviewDoc.name}
            problemCount: ${input.count}
          auth:
            type: OIDC
            
    - return:
        return:
          reviewId: ${reviewDoc.name}
          status: "success"
```

## Cloud Build 자동화

```yaml
# cloudbuild.yaml
steps:
  # 1. SAT 문제 생성기 빌드 및 배포
  - name: 'gcr.io/cloud-builders/npm'
    dir: 'functions/generate-problem'
    args: ['install']
    
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'functions'
      - 'deploy'
      - 'generateSATProblem'
      - '--source=functions/generate-problem'
      - '--trigger-http'
      - '--runtime=nodejs20'
      - '--region=us-central1'
      - '--memory=512MB'
      - '--set-env-vars=MODE=SAT'
      
  # 2. 교사 앱 빌드 및 배포
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/teacher-app'
      - './teacher-app'
      
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/teacher-app']
    
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'teacher-app'
      - '--image=gcr.io/$PROJECT_ID/teacher-app'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      
  # 3. WebSocket 서버 배포
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/websocket-server'
      - './services/websocket'
      
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'websocket-server'
      - '--image=gcr.io/$PROJECT_ID/websocket-server'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--cpu=1'
      - '--memory=512Mi'
      - '--min-instances=0'
      - '--max-instances=10'
      - '--session-affinity'  # WebSocket 연결 유지

timeout: '1200s'
```

## 로컬 파일 정리 스크립트

```bash
#!/bin/bash
# cleanup-local.sh

echo "🧹 로컬 파일 정리 시작..."

# 클라우드로 이동된 파일들 백업
mkdir -p backup/migrated
mv *.js backup/migrated/ 2>/dev/null
mv orchestration/*.js backup/migrated/orchestration/ 2>/dev/null

# 불필요한 파일 제거
rm -f AUTO_SYNC_STATUS.json
rm -f .monitor_status.json
rm -f integration-test-report.json

# Git에서 제거
git rm --cached *.js
git rm --cached orchestration/*.js

echo "✅ 정리 완료"
echo "📦 백업 위치: backup/migrated/"
```

## 마이그레이션 체크리스트

- [ ] WebSocket 서버 → Cloud Run
- [ ] 로컬 JS 파일들 → Cloud Functions
- [ ] Python 스크립트 → Cloud Functions
- [ ] 정적 파일 → Cloud Storage
- [ ] 환경 변수 → Secret Manager
- [ ] 로컬 데이터 → Firestore
- [ ] 모니터링 → Cloud Monitoring
- [ ] CI/CD → Cloud Build
- [ ] 로컬 파일 정리
- [ ] 문서 업데이트

## 예상 비용 (10명 학생 기준)

| 서비스 | 월 비용 | 설명 |
|--------|---------|------|
| Cloud Run (WebSocket) | $5 | 최소 인스턴스 0 |
| Cloud Functions | $10 | SAT 문제 생성 |
| Firestore | $10 | NoSQL 데이터 |
| Cloud Storage | $2 | 정적 파일 |
| Gemini API | $30 | AI 문제 생성 |
| Cloud Build | $0 | 무료 티어 |
| **총계** | **$57** | 예산 $100 이내 |

## 다음 단계

1. `cloud-build.yaml` 실행
2. 로컬 서비스 중단
3. 클라우드 엔드포인트로 전환
4. 로컬 파일 정리
5. 문서 업데이트