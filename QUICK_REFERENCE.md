# 🚀 QUICK REFERENCE GUIDE

**Math Learning Platform v4.2.0**  
**Updated**: 2025-09-08 23:45 KST

---

## ⚡ 빠른 실행 명령어

```cmd
# 🧠 의도 학습 시스템 (NEW)
start-lola-intent.bat

# 🔬 물리 플랫폼
start-lola-final.bat

# ✅ 상태 확인
check-lola-status.bat

# 🧪 테스트
test-lola-components.bat
```

---

## 🌐 웹 인터페이스 접근

| 시스템 | URL | 포트 |
|--------|-----|------|
| **의도 학습** | `lola-math-intent.html` | 8092 |
| **물리 플랫폼** | `lola-platform.html` | 8090 |
| **데모** | `open-lola.bat` | - |

---

## 🔌 포트 맵

```
8080 - WebSocket Server
8081 - Gesture Controller  
8090 - LOLA Physics
8092 - LOLA Intent Learning
3000 - React App
3001 - Web Server
```

---

## 📁 핵심 파일 위치

```
실행 파일:
├── start-lola-intent.bat      # 의도 학습
├── start-lola-final.bat       # 통합 실행
└── check-lola-status.bat      # 상태 확인

소스 코드:
├── src/lola-integration/
│   ├── lola_math_intent_system.py  # 핵심 서버
│   └── *.jsx, *.js                 # 컴포넌트

데이터:
├── lola_math_data/            # 학습 데이터
└── .claude-memory/            # 세션 메모리
```

---

## 🎯 주요 기능

### NEW: 의도 학습 시스템
- 64차원 Latent Space
- 256x 압축
- 5회 시도 후 최적화

### 물리 시뮬레이션
- 실시간 60 FPS
- WebGPU 가속
- 터치 입력

### 수학 영역 (10개)
- Geometry, Algebra, Calculus
- Statistics, Trigonometry
- Linear Algebra, Topology
- Differential, Complex Analysis
- Number Theory

---

## 🔧 문제 해결

```cmd
# Python 확인
venv311\Scripts\python --version

# 포트 확인
netstat -an | findstr :8092

# 로그 확인
type lola-error.log
type gesture-error.log
```

---

## 📊 성능 목표

| 지표 | 목표 | 현재 |
|------|------|------|
| FPS | 60 | ✅ 60+ |
| 지연 | <50ms | ✅ 16ms |
| 압축 | 256x | ✅ 256-1000x |
| 정확도 | 80% | ✅ 85%+ |

---

## 📝 체크리스트

### 시작 전
- [ ] Python 3.11 확인
- [ ] Node.js 설치 확인
- [ ] 포트 가용성 확인

### 실행 중
- [ ] 서버 상태 확인
- [ ] 브라우저 WebGPU 지원
- [ ] 터치 입력 테스트

### 종료 시
- [ ] 데이터 자동 저장
- [ ] 프로세스 정리
- [ ] 로그 확인

---

## 💡 팁

1. **의도 학습**: 5회 이상 그려야 제안
2. **3D 모드**: Calculus 선택 → 3D Space
3. **데이터 저장**: 자동, 수동 내보내기 가능
4. **성능**: Chrome/Edge 권장

---

## 🆘 도움말

```cmd
# 전체 문서
start README.md

# 의도 학습 상세
start LOLA_MATH_INTENT_README.md

# 프로젝트 상태
start PROJECT_STATUS_LATEST.md

# 통합 대시보드
start SYSTEM_INTEGRATION_DASHBOARD.md
```

---

**Happy Learning! 🎓**