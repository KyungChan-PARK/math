# 📚 통합 문제 제작 프레임워크 v2.0

## 🎯 핵심 설계 원칙

### 1. 교육학적 기반
- **Bloom's Taxonomy**: 인지 수준 분류
- **Webb's DOK**: 지식 깊이 측정
- **Vygotsky's ZPD**: 근접발달영역 고려
- **Cognitive Load Theory**: 인지 부하 관리

### 2. 범용성과 재사용성
- 모든 Khan Academy 커리큘럼 단원 대응
- Grade 5-12 + AP 과정 호환
- 메타데이터 기반 자동 분류

## 📊 난이도 레벨 시스템

### 5단계 세분화 체계

#### Level 1: Foundation (기초)
- **DOK 1**: Recall & Reproduction
- **Bloom**: Remember/Understand
- **특징**: 단순 계산, 용어 이해
- **스캐폴딩**: 완전 안내형
- **시각화**: 구체적 표현

#### Level 2: Application (적용)
- **DOK 2**: Skills & Concepts
- **Bloom**: Apply
- **특징**: 공식 적용, 단일 개념
- **스캐폴딩**: 부분 안내형
- **시각화**: 반구체적 표현

#### Level 3: Strategic (전략)
- **DOK 2-3**: Strategic Thinking
- **Bloom**: Analyze
- **특징**: 다단계 문제, 패턴 인식
- **스캐폴딩**: 힌트 제공형
- **시각화**: 추상적 다이어그램

#### Level 4: Extended (확장)
- **DOK 3**: Strategic Thinking
- **Bloom**: Evaluate
- **특징**: 복합 개념, 실세계 응용
- **스캐폴딩**: 자기 주도형
- **시각화**: 복합 모델

#### Level 5: Creative (창의)
- **DOK 4**: Extended Thinking
- **Bloom**: Create
- **특징**: 개방형 문제, 다중 해법
- **스캐폴딩**: 탐구 기반
- **시각화**: 학생 생성

## 🔗 개념 연결 매트릭스

### 수직적 연계 (학년 간)
```
Grade 6: 비와 비율 기초
    ↓
Grade 7: 비례 관계
    ↓
Grade 8: 일차 함수
    ↓
Algebra 1: 선형 방정식
    ↓
Algebra 2: 함수 변환
```

### 수평적 연계 (단원 간)
```
비와 비율 ← → 분수/소수
    ↓           ↓
백분율    ← → 확률
    ↓           ↓
통계      ← → 데이터 분석
```

## 🏗️ 문제 구조 템플릿

### 메타데이터 헤더
```yaml
problem_id: [자동생성]
unit: [Khan Academy 단원]
grade: [학년]
level: [1-5]
dok: [1-4]
bloom: [Remember-Create]
concepts: [관련 개념 리스트]
prerequisites: [선수 학습]
connections: [연결 개념]
time_estimate: [예상 시간]
```

### 문제 구성 요소

#### 1. 개념 활성화 (Concept Activation)
- 선수 지식 확인
- 핵심 용어 복습
- 관련 경험 연결

#### 2. 점진적 스캐폴딩 (Progressive Scaffolding)
```
Level 1-2: 7단계 스캐폴딩
├── 1. 문제 이해
├── 2. 정보 추출
├── 3. 전략 선택
├── 4. 계획 수립
├── 5. 실행
├── 6. 검증
└── 7. 일반화

Level 3-4: 5단계 스캐폴딩
├── 1. 분석
├── 2. 계획
├── 3. 실행
├── 4. 평가
└── 5. 확장

Level 5: 3단계 스캐폴딩
├── 1. 탐구
├── 2. 창조
└── 3. 반성
```

#### 3. 다중 표현 (Multiple Representations)
- **구체적**: 실물, 조작 자료
- **시각적**: 그림, 다이어그램
- **기호적**: 수식, 기호
- **언어적**: 설명, 서술
- **맥락적**: 실생활 상황

#### 4. 차별화 전략 (Differentiation)
```
기본 경로: 표준 문제
├── 도전 경로: 심화 문제 (+)
├── 지원 경로: 단순화 문제 (-)
└── 대안 경로: 다른 접근법 (≈)
```

## 📈 적응형 난이도 조정

### 성과 기반 조정 알고리즘
```javascript
if (정확도 >= 85% && 시간 < 예상시간*0.8) {
    난이도 상승 (Level + 1)
} else if (정확도 >= 70%) {
    현재 유지 (Level = Level)
} else if (정확도 < 60%) {
    난이도 하락 (Level - 1)
    추가 스캐폴딩 제공
}
```

### 오답 패턴 분석
- **개념 오류**: 개념 재학습 제공
- **절차 오류**: 단계별 안내 강화
- **계산 오류**: 연습 문제 추가
- **이해 오류**: 다른 표현 제시

## 🎨 시각적 설계 표준

### 인지 부하 최적화
```
Essential Load (필수 부하)
├── 핵심 개념만 포함
├── 최소 정보 단위
└── 명확한 구조

Extraneous Load (외재 부하) 최소화
├── 불필요한 장식 제거
├── 일관된 레이아웃
└── 명확한 지시사항

Germane Load (유의미 부하) 증진
├── 스키마 구축 지원
├── 패턴 인식 촉진
└── 전이 가능성 향상
```

### PDF 정적 디자인 원칙
- **계층적 구조**: 제목 > 부제 > 본문
- **색상 코딩**: 난이도별 일관된 색상
- **공백 활용**: 인지적 휴식 공간
- **정렬과 그룹핑**: 게슈탈트 원리

## 🔄 피드백 시스템

### 즉각적 피드백 (Immediate)
- 정답/오답 표시
- 핵심 개념 확인
- 다음 단계 안내

### 상세 피드백 (Detailed)
- 풀이 과정 분석
- 대안적 해법 제시
- 개념 연결 설명

### 메타인지 피드백 (Metacognitive)
- 학습 전략 평가
- 사고 과정 반성
- 개선 방향 제시

## 📋 구현 체크리스트

### 문제 제작 시
- [ ] 메타데이터 완성
- [ ] 학습 목표 명시
- [ ] 선수 학습 확인
- [ ] 난이도 적절성 검증
- [ ] 스캐폴딩 단계 설정
- [ ] 시각 자료 준비
- [ ] 차별화 경로 설계
- [ ] 피드백 내용 작성
- [ ] 연결 개념 표시
- [ ] 평가 기준 수립

### 품질 검증
- [ ] 교육과정 정렬
- [ ] 인지 부하 적정성
- [ ] 접근성 기준 충족
- [ ] 문화적 적절성
- [ ] 언어 명확성

## 🚀 확장 가능성

### 단기 확장 (1-3개월)
- 다른 수학 단원 적용
- 자동 문제 생성 템플릿
- 간단한 적응형 로직

### 중기 확장 (3-6개월)
- 전 학년 커리큘럼 대응
- AI 기반 난이도 예측
- 학습 분석 대시보드

### 장기 확장 (6-12개월)
- 다과목 통합 시스템
- 완전 개인화 학습
- 실시간 협업 학습

## 📚 참고 자료

### 교육 이론
- Bloom, B. S. (1956). Taxonomy of Educational Objectives
- Webb, N. L. (1997). Depth of Knowledge Levels
- Mayer, R. E. (2009). Multimedia Learning
- Sweller, J. (1988). Cognitive Load Theory

### Khan Academy 커리큘럼
- /mnt/c/palantir/math/khan-academy-curriculum.json
- Grade 5-12 + AP 과정 매핑

### 기존 가이드라인
- problem-creation-guidelines.md
- pdf-static-design-guide.md

---

*Version 2.0 | Updated: 2024*
*이 프레임워크는 지속적으로 개선됩니다*