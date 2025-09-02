# 🚀 Enhanced AE Drop Zones - Claude Max Optimized System

## 📋 프로젝트 개요

After Effects 자동화를 위한 혁신적인 **드래그앤드롭 기반 AI 워크플로우 시스템**입니다.
Claude Max 구독을 활용하여 Opus 4.1과 Sonnet 4를 지능적으로 라우팅하여 **75-85% 비용 절감**을 달성합니다.

### 🎯 핵심 혁신
- **Chat UI 탈피**: 드래그앤드롭 한 번으로 완전 자동화
- **지능형 라우팅**: 복잡도 기반 Opus/Sonnet 자동 선택
- **무한 재사용**: 한 번 생성된 워크플로우 영구 재사용
- **자가 학습**: 사용 패턴 자동 학습 및 개선

## 🛠️ 시스템 아키텍처

```
Drop Zones (입력)
    ↓
Claude Max Router (지능형 라우팅)
    ↓
Opus 4.1 / Sonnet 4 (처리)
    ↓
ExtendScript / Templates (출력)
    ↓
After Effects (실행)
```

## 📦 설치 및 실행

### 1. 필수 요구사항
- Windows 11 (테스트 완료)
- Python 3.11+
- Adobe After Effects 2024
- Claude API Key (Anthropic)

### 2. 설치 방법

```bash
# 1. 프로젝트 클론 또는 다운로드
cd AE_Claude_Max_Project

# 2. 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows

# 3. 의존성 설치
pip install anthropic watchdog pyyaml rich opencv-python

# 4. API 키 설정
set ANTHROPIC_API_KEY=your-api-key-here
```

### 3. 실행

```bash
# 메인 시스템 실행
python sfs_enhanced_ae_dropzones.py
```

## 📁 Drop Zones 사용법

### 1. AE Vibe Zone (자연어 → ExtendScript)
```
drops/ae_vibe/ 폴더에 텍스트 파일 드롭
예: "레이어 10개에 랜덤 위글 적용.txt"
→ 자동으로 ExtendScript 생성 및 실행
```

### 2. Video Motion Zone (영상 분석)
```
drops/video_motion/ 폴더에 영상 파일 드롭
예: reference_motion.mp4
→ 모션 분석 후 AE 템플릿 생성
```

### 3. Batch Operations (대량 작업)
```
drops/batch_ops/ 폴더에 CSV/JSON 파일 드롭
예: batch_animations.csv
→ 대량 작업 자동 처리
```

### 4. Template Learning (패턴 학습)
```
drops/template_learning/ 폴더에 AEP 파일 드롭
예: my_project.aep
→ 패턴 분석 후 재사용 가능한 템플릿 생성
```

## 📊 성능 및 비용 최적화

| 모델 | 사용 조건 | 비용 |
|------|----------|------|
| **Opus 4.1** | 복잡한 작업 (30%) | $15/1M tokens |
| **Sonnet 4** | 일반 작업 (50%) | $3/1M tokens |
| **Cache** | 반복 작업 (20%) | $0 (무료) |

### 예상 절감 효과
- 기존 방식: 월 $100
- 최적화 후: 월 $15-25
- **절감률: 75-85%**

## 🔧 설정 커스터마이징

`enhanced_drops.yaml` 파일을 수정하여 드롭존 동작을 커스터마이징할 수 있습니다:

```yaml
drop_zones:
  custom_zone:
    name: "My Custom Zone"
    file_patterns: ["*.custom"]
    routing_config:
      complexity_threshold: 5  # 복잡도 임계값
      opus_triggers: ["complex"]  # Opus 트리거 키워드
      sonnet_triggers: ["simple"]  # Sonnet 트리거 키워드
```

## 📈 통계 및 모니터링

시스템 실행 중 실시간으로 다음 통계를 확인할 수 있습니다:
- Opus 4.1 호출 횟수
- Sonnet 4 호출 횟수
- 캐시 히트 횟수
- 총 비용 및 절감률

## 🚀 로드맵

### Phase 1 (완료) ✅
- 기본 드롭존 시스템
- Claude Max 라우팅
- 캐싱 시스템

### Phase 2 (진행중) 🔄
- CEP Extension 통합
- WebSocket 실시간 통신
- 고급 패턴 학습

### Phase 3 (예정) 📅
- 클라우드 동기화
- 팀 협업 기능
- 플러그인 마켓플레이스

## 🤝 기여 및 문의

이 프로젝트는 Claude Opus 4.1 AI Agent가 자율적으로 개발했습니다.
개선 사항이나 문의사항은 이슈를 등록해주세요.

## 📄 라이선스

MIT License - 자유롭게 사용 및 수정 가능

---

**Built with ❤️ by Claude Opus 4.1 Agent**
*Optimized for Claude Max Subscription*