# 점진적 확장 아키텍처 (1인 개발자 → 스타트업)

## 🎯 핵심 원칙
- **수학 교육 전문성 유지**
- **무료 티어 최대 활용**
- **점진적 비용 증가**
- **자동화 우선**

## 📊 성장 단계별 아키텍처

### Phase 1: MVP (현재) - 월 $0~10
```
1인 개발자 (0~100 사용자)
├── Google Cloud 무료 티어
│   ├── Cloud Functions (125K 호출/월 무료)
│   ├── Firestore (50K 읽기/일 무료)
│   └── Cloud Storage (5GB 무료)
├── Vertex AI
│   └── Gemini Pro (60 요청/분 무료)
└── GitHub Actions (공개 저장소 무료)
```

**핵심 기능:**
- 수학 문제 생성 (학년별)
- 단계별 풀이 제공
- 기본 학습 추적

### Phase 2: Early Adopters - 월 $10~50
```
100~1,000 사용자
├── Cloud Run (최소 인스턴스 0)
├── Redis Memorystore (기본 티어)
├── Cloud CDN (정적 콘텐츠)
└── Basic Monitoring
```

**추가 기능:**
- 실시간 피드백
- 학습 분석 리포트
- 맞춤형 문제 추천

### Phase 3: Growth - 월 $50~200
```
1,000~10,000 사용자
├── GKE Autopilot (자동 스케일링)
├── Cloud SQL (PostgreSQL)
├── Pub/Sub (비동기 처리)
└── Cloud Armor (보안)
```

**고급 기능:**
- AutoML 맞춤 모델
- 협업 학습
- 교사 대시보드

### Phase 4: Scale - 월 $200~1,000
```
10,000+ 사용자
├── Multi-region 배포
├── BigQuery (분석)
├── Dataflow (스트리밍)
└── Enterprise Security
```

## 🚀 즉시 실행 가능한 최적화

### 1. 캐싱 전략
```javascript
// 수학 문제 캐싱 (24시간)
const problemCache = new Map();
const CACHE_TTL = 86400000;

function getCachedProblem(key) {
    const cached = problemCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}
```

### 2. 배치 처리
```javascript
// Firestore 쓰기 최적화
const batch = firestore.batch();
problems.forEach(problem => {
    batch.set(docRef, problem);
});
await batch.commit(); // 1회 요금
```

### 3. 콜드 스타트 최소화
```yaml
# Cloud Run 설정
min-instances: 0  # 개발 단계
max-instances: 10 # 자동 스케일링
cpu-throttling: true # 비용 절감
```

## 📈 비용 예측 모델

| 사용자 수 | 월 예상 비용 | 주요 비용 요소 |
|----------|------------|--------------|
| 0-100 | $0-10 | 무료 티어 |
| 100-500 | $10-30 | Cloud Run, Firestore |
| 500-1K | $30-50 | Vertex AI 추가 호출 |
| 1K-5K | $50-150 | Redis, CDN |
| 5K-10K | $150-300 | GKE, Cloud SQL |
| 10K+ | $300+ | Multi-region, BigQuery |

## 🔧 자동화 도구

### 1. 비용 모니터링
```bash
# 일일 비용 알림 설정
gcloud billing budgets create \
  --billing-account=$BILLING_ID \
  --display-name="Daily Alert" \
  --budget-amount=10 \
  --threshold-rule=percent=80
```

### 2. 자동 스케일링
```yaml
# Cloud Run 자동 스케일링
scaling:
  minInstances: 0
  maxInstances: 100
  metrics:
  - type: cpu-utilization
    target: 60
```

### 3. 리소스 정리
```javascript
// 오래된 데이터 자동 삭제
async function cleanupOldData() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const batch = firestore.batch();
    const oldDocs = await firestore
        .collection('temp_data')
        .where('createdAt', '<', thirtyDaysAgo)
        .get();
    
    oldDocs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
}
```

## 🎓 수학 교육 특화 최적화

### 1. 문제 유형별 템플릿
```javascript
const mathTemplates = {
    'elementary': { // 초등
        cacheTime: 7 * 24 * 3600000, // 1주
        preGenerate: true,
        batchSize: 100
    },
    'middle': { // 중등
        cacheTime: 3 * 24 * 3600000, // 3일
        preGenerate: true,
        batchSize: 50
    },
    'high': { // 고등
        cacheTime: 24 * 3600000, // 1일
        preGenerate: false, // 실시간 생성
        batchSize: 10
    }
};
```

### 2. 학습 패턴 분석
```javascript
// 저비용 분석 (Firestore 집계)
async function analyzeLearningPatterns() {
    const patterns = await firestore
        .collection('learning_sessions')
        .where('date', '>=', getStartOfWeek())
        .aggregate({
            count: AggregateField.count(),
            avgScore: AggregateField.average('score'),
            topics: AggregateField.distinct('topic')
        })
        .get();
    
    return patterns;
}
```

## 🔐 보안 (무료/저비용)

### 1. API 키 관리
```bash
# Secret Manager (무료 티어: 6개 시크릿)
gcloud secrets create api-key --data-file=key.txt
```

### 2. 기본 Rate Limiting
```javascript
const rateLimiter = new Map();
const RATE_LIMIT = 100; // 요청/시간

function checkRateLimit(userId) {
    const now = Date.now();
    const userLimits = rateLimiter.get(userId) || [];
    const recentRequests = userLimits.filter(t => now - t < 3600000);
    
    if (recentRequests.length >= RATE_LIMIT) {
        return false;
    }
    
    recentRequests.push(now);
    rateLimiter.set(userId, recentRequests);
    return true;
}
```

## 📱 프론트엔드 최적화

### 1. 정적 호스팅
```bash
# Firebase Hosting (무료)
firebase deploy --only hosting
```

### 2. 이미지 최적화
```javascript
// WebP 자동 변환
const sharp = require('sharp');

async function optimizeImage(buffer) {
    return sharp(buffer)
        .resize(800, 600, { fit: 'inside' })
        .webp({ quality: 80 })
        .toBuffer();
}
```

## 🚦 모니터링 (무료 티어)

### 1. Cloud Logging
```javascript
const {Logging} = require('@google-cloud/logging');
const logging = new Logging();
const log = logging.log('math-app');

// 구조화된 로깅
log.write({
    severity: 'INFO',
    jsonPayload: {
        event: 'problem_generated',
        grade: 6,
        topic: '비와 비율',
        userId: 'user123'
    }
});
```

### 2. 커스텀 메트릭
```javascript
// 간단한 메트릭 수집
const metrics = {
    problemsGenerated: 0,
    apiCalls: 0,
    cacheHits: 0,
    
    increment(metric) {
        this[metric]++;
        // 주기적으로 Firestore에 저장
        if (this[metric] % 100 === 0) {
            this.save();
        }
    },
    
    async save() {
        await firestore.collection('metrics').add({
            ...this,
            timestamp: new Date()
        });
    }
};
```

## ✅ 체크리스트

### 즉시 실행 (Phase 1)
- [ ] Cloud Functions 배포
- [ ] Firestore 무료 할당량 모니터링
- [ ] Vertex AI 무료 티어 활용
- [ ] GitHub Actions CI/CD

### 준비 사항 (Phase 2)
- [ ] Redis 캐싱 계획
- [ ] CDN 설정 준비
- [ ] 사용자 인증 시스템

### 장기 계획 (Phase 3+)
- [ ] AutoML 데이터 수집
- [ ] 다국어 지원
- [ ] B2B 기능