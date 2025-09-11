# 🎯 Palantir Math: 실제 작동 시나리오로 보는 계층 구조

## 시나리오: "학생이 이차함수 y = x² - 4x + 3의 그래프를 이해하고 싶어한다"

### 🔄 요청이 시스템을 통과하는 전체 여정

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
시간: T+0ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 [Layer 8: User Experience]
학생: "이차함수 y = x² - 4x + 3의 그래프를 보고 싶어요"
입력 방식: 제스처(공중에 포물선 그리기) + 음성 명령

    ↓ (제스처 데이터: MediaPipe 21 keypoints)
    ↓ (음성 데이터: "이차함수... 그래프")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
시간: T+50ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖥️ [Layer 7: Presentation]
After Effects CEP Panel 수신:
{
  "gestureData": {
    "type": "parabola_shape",
    "confidence": 0.87,
    "keypoints": [[x1,y1,z1], ..., [x21,y21,z21]]
  },
  "voiceCommand": "이차함수 y = x² - 4x + 3 그래프",
  "timestamp": "2025-09-09T14:30:00Z"
}

    ↓ WebSocket으로 전송

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
시간: T+100ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎛️ [Layer 3: Orchestration]
Orchestrator 분석:
- 작업 유형: "수학 시각화 + 교육"
- 복잡도: MEDIUM
- 필요 에이전트: multiple
- 협업 모드: RECOMMENDED

결정: Claude-Qwen 협업 시스템 활성화

    ↓ 협업 요청 전송

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
시간: T+150ms - T+500ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧠 [Layer 1: Claude Strategic Intelligence]
Claude의 분석:
"이 요청은 단순한 그래프 그리기가 아니라 교육적 이해를 
목적으로 한다. 학생이 제스처로 포물선을 그린 것은 
이미 기본 형태는 알지만 정확한 특성을 이해하고 싶어함을 시사한다."

전략 수립:
1. 그래프의 주요 특징점 강조 (꼭짓점, x절편, y절편)
2. 함수 변형 과정 애니메이션 (y = x² → y = x² - 4x → y = x² - 4x + 3)
3. 실생활 연결 (포물선 운동 예시)
4. 인터랙티브 요소 추가 (계수 조절 슬라이더)

🤝 [Layer 2: Collaborative Decision]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
병렬 처리 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Claude 접근:                    Qwen 접근:
"교육학적 구조화"               "즉각적 시각화"
- 개념 설명 우선                - 그래프 먼저 표시
- 단계별 이해                   - 애니메이션 효과
- 이론적 배경                   - 색상과 움직임
- 완전한 이해 목표              - 빠른 피드백

        ↓ 통합 (T+400ms) ↓

하이브리드 솔루션:
"그래프를 즉시 표시하되, 주요 특징점에서 
일시정지하며 설명을 추가하는 적응형 애니메이션"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
시간: T+500ms - T+800ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ [Layer 4: Qwen Execution Engine]
75개 에이전트 중 선택된 에이전트들 병렬 실행:

┌─────────────────────────────────────────┐
│ algebraExpert (T+500ms)                 │
│ 작업: 함수 분석                          │
│ • 표준형: y = x² - 4x + 3              │
│ • 꼭짓점형: y = (x-2)² - 1             │
│ • 꼭짓점: (2, -1)                      │
│ • x절편: x = 1, x = 3                  │
│ • y절편: y = 3                         │
│ • 판별식: D = 16 - 12 = 4 > 0         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ graphVisualizer (T+520ms)               │
│ 작업: 그래프 데이터 생성                 │
│ points = []                             │
│ for x from -2 to 6 step 0.1:          │
│   y = x² - 4x + 3                     │
│   points.push({x, y})                  │
│ criticalPoints = {                      │
│   vertex: {x:2, y:-1},                │
│   xIntercepts: [{x:1}, {x:3}],        │
│   yIntercept: {y:3}                   │
│ }                                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ animationChoreographer (T+540ms)        │
│ 작업: 애니메이션 시퀀스 설계             │
│ Timeline:                               │
│ 0-1s: 좌표축 그리기                     │
│ 1-2s: y = x² 기본 포물선               │
│ 2-3s: x축 이동 (-4x 효과)              │
│ 3-4s: y축 이동 (+3 효과)               │
│ 4-5s: 특징점 하이라이트                 │
│ 5-6s: 인터랙티브 모드 전환              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ extendScriptGenerator (T+560ms)         │
│ 작업: After Effects 코드 생성            │
│                                         │
│ // Create composition                   │
│ var comp = app.project.items.addComp(   │
│   "Parabola_Animation",                │
│   1920, 1080, 1, 6, 30                │
│ );                                      │
│                                         │
│ // Create shape layer for axes         │
│ var axes = comp.layers.addShape();     │
│ axes.name = "Coordinate_Axes";         │
│                                         │
│ // Create path for parabola            │
│ var parabolaLayer = comp.layers.       │
│   addShape();                          │
│ var path = parabolaLayer.property(     │
│   "Contents").addProperty("ADBE        │
│   Vector Shape - Group");              │
│                                         │
│ // Animate path                        │
│ for (var i = 0; i < points.length;    │
│      i++) {                           │
│   // 키프레임 추가 코드                  │
│ }                                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ colorSchemeDesigner (T+580ms)           │
│ 작업: 교육적 색상 팔레트                 │
│ • 좌표축: #333333 (진한 회색)           │
│ • 포물선: #007AFF (밝은 파랑)           │
│ • 꼭짓점: #FF3B30 (빨강, 강조)          │
│ • x절편: #34C759 (초록)                │
│ • y절편: #FF9500 (주황)                │
│ • 배경: #F2F2F7 (연한 회색)            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ misconceptionAnalyzer (T+600ms)         │
│ 작업: 일반적 오개념 예측                 │
│ • "꼭짓점이 항상 최소값" → 수정 필요     │
│ • "x절편이 해" → 정확함                │
│ • "그래프가 직선" → 포물선임을 강조      │
│ 추가 설명 생성...                       │
└─────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
시간: T+800ms - T+900ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 [Layer 5: Integration & Transformation]
모든 에이전트 출력 통합:

ExtendScript 최종 코드 (2500 lines):
```javascript
// Palantir Math - Parabola Visualization
// Generated: 2025-09-09T14:30:00.8Z
// Function: y = x² - 4x + 3

(function() {
  app.beginUndoGroup("Create Parabola");
  
  // 1. Composition Setup
  var comp = app.project.items.addComp(
    "Interactive_Parabola", 1920, 1080, 1, 10, 30
  );
  
  // 2. Coordinate System
  var coordSystem = new CoordinateSystem(comp);
  coordSystem.create({
    origin: [960, 540],
    scale: 50,
    gridLines: true
  });
  
  // 3. Parabola Animation
  var parabola = new ParabolaAnimation(comp);
  parabola.createFromEquation({
    a: 1, b: -4, c: 3,
    animationSteps: [
      {time: 0, state: "axes_only"},
      {time: 1, state: "basic_parabola"},
      {time: 2, state: "horizontal_shift"},
      {time: 3, state: "vertical_shift"},
      {time: 4, state: "highlight_features"},
      {time: 5, state: "interactive_ready"}
    ]
  });
  
  // 4. Critical Points
  var features = new CriticalFeatures(comp);
  features.markVertex(2, -1, "Vertex (2, -1)");
  features.markXIntercepts([1, 3]);
  features.markYIntercept(3);
  
  // 5. Interactive Controls
  var controls = new InteractiveControls(comp);
  controls.addSlider("a_coefficient", -5, 5, 1);
  controls.addSlider("b_coefficient", -10, 10, -4);
  controls.addSlider("c_coefficient", -10, 10, 3);
  
  // 6. Educational Overlays
  var education = new EducationalLayer(comp);
  education.addExplanation(2, 
    "꼭짓점: 포물선의 최저점\n" +
    "x = -b/2a = 4/2 = 2\n" +
    "y = f(2) = 4 - 8 + 3 = -1"
  );
  
  app.endUndoGroup();
})();
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
시간: T+900ms - T+950ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 [Layer 6: Data Persistence]
병렬 저장 작업:

MongoDB에 저장:
{
  "_id": "session_2025_09_09_14_30",
  "userId": "student_123",
  "function": "y = x² - 4x + 3",
  "interactions": {
    "gestureUsed": true,
    "voiceCommand": true,
    "timestamp": "2025-09-09T14:30:00Z"
  },
  "generatedContent": {
    "scriptId": "aes_script_abc123",
    "visualizationType": "animated_parabola"
  },
  "learningMetrics": {
    "conceptsCovered": ["vertex", "intercepts", "transformation"],
    "estimatedUnderstanding": 0.75
  }
}

Neo4j에 저장 (Cypher Query):
```cypher
MERGE (s:Student {id: 'student_123'})
MERGE (c:Concept {name: 'Quadratic Function'})
MERGE (g:Graph {equation: 'y = x² - 4x + 3'})
CREATE (s)-[:STUDIED {
  timestamp: datetime('2025-09-09T14:30:00Z'),
  method: 'gesture+voice',
  duration: 950
}]->(g)
CREATE (g)-[:DEMONSTRATES]->(c)
CREATE (g)-[:HAS_VERTEX]->(:Point {x: 2, y: -1})
CREATE (g)-[:HAS_X_INTERCEPT]->(:Point {x: 1})
CREATE (g)-[:HAS_X_INTERCEPT]->(:Point {x: 3})
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
시간: T+950ms - T+1000ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎬 [After Effects 실행]
ExtendScript 코드 실행:
- 컴포지션 생성 완료
- 좌표계 그리기 완료
- 포물선 애니메이션 시작
- 특징점 표시 활성화
- 인터랙티브 컨트롤 준비

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
시간: T+1000ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 [학생 화면]
표시되는 내용:
1. 좌표평면이 페이드인
2. y = x² 기본 포물선 등장
3. 포물선이 오른쪽으로 2만큼 이동
4. 포물선이 아래로 1만큼 이동
5. 꼭짓점 (2, -1) 빨간색 강조
6. x절편 (1, 0), (3, 0) 초록색 표시
7. y절편 (0, 3) 주황색 표시
8. 슬라이더 나타남 (계수 조절 가능)

학생 반응 감지:
- 눈동자 추적: 꼭짓점에 3초 이상 시선 고정
- 제스처: 손가락으로 x절편 가리킴
- 음성: "왜 여기가 최솟값이에요?"

    ↓ 새로운 요청 사이클 시작

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 📊 성능 분석 및 병목 지점

### ⏱️ 시간 분석
- 총 처리 시간: 1000ms (1초)
- Claude 전략 수립: 350ms (35%)
- Qwen 에이전트 실행: 300ms (30%)
- 통합 및 변환: 100ms (10%)
- 데이터 저장: 50ms (5%)
- 네트워크 지연: 200ms (20%)

### 🚀 최적화 포인트
1. **캐싱 활용**: 자주 요청되는 함수는 미리 계산
2. **병렬 처리**: 6개 에이전트 동시 실행
3. **스트리밍**: 결과를 점진적으로 전송
4. **예측 로딩**: 다음 가능한 요청 미리 준비

## 🔄 피드백 루프

### 즉각적 피드백 (T+1000ms - T+2000ms)
```
학생 추가 질문: "왜 꼭짓점이 (2, -1)이에요?"
    ↓
Orchestrator: 빠른 응답 모드
    ↓
Qwen만 사용 (Claude 스킵)
    ↓
solutionExplainer 에이전트 직접 호출
    ↓
200ms 내 응답: 
"x = -b/2a 공식으로 x좌표를 구하고,
그 x값을 원래 식에 대입하면 y좌표를 얻습니다"
```

### 심화 학습 요청 (T+10000ms)
```
학생: "이 개념을 다른 문제에도 적용하고 싶어요"
    ↓
Claude 재활성화: 커리큘럼 설계
    ↓
새로운 문제 세트 생성:
- y = 2x² - 4x + 1 (a 계수 변화)
- y = -x² + 6x - 5 (아래로 볼록)
- y = x² - 2x (c = 0인 경우)
    ↓
적응형 난이도 조절
```

## 🎯 핵심 통찰

### Claude의 가치
- **깊이**: 교육학적 고려사항 반영
- **구조**: 체계적 학습 경로 설계
- **맥락**: 학생의 전체 학습 이력 고려

### Qwen의 가치
- **속도**: 1초 내 완전한 시각화
- **병렬성**: 6개 작업 동시 처리
- **실용성**: 즉시 실행 가능한 코드

### 협업의 시너지
- **균형**: 교육적 깊이 + 실행 속도
- **검증**: 두 관점에서 교차 검증
- **적응**: 학생 반응에 따른 동적 조정

이것이 바로 Palantir Math 프로젝트에서 
Claude와 Qwen이 협력하여 만들어내는 
**살아있는 수학 교육 경험**입니다.
