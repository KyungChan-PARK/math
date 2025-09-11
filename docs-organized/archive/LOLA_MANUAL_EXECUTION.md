# LOLA Integration - 수동 실행 가이드

## 🚀 빠른 실행 (3개 터미널 필요)

### Terminal 1: LOLA Physics Server
```cmd
cd C:\palantir\math
venv311\Scripts\activate
python src\lola-integration\lola-server.py
```

### Terminal 2: Gesture Controller
```cmd
cd C:\palantir\math
venv311\Scripts\activate
python src\lola-integration\gesture_physics_controller.py
```

### Terminal 3: React App
```cmd
cd C:\palantir\math
npm start
```

---

## 🔧 문제 해결

### 1. Python 환경 확인
```cmd
# venv311이 있는지 확인
dir C:\palantir\math\venv311

# Python 버전 확인
C:\palantir\math\venv311\Scripts\python.exe --version
```

### 2. 필수 패키지 설치
```cmd
cd C:\palantir\math
venv311\Scripts\activate

# 최소 필수 패키지
pip install numpy
pip install opencv-python

# 선택 패키지 (실패해도 괜찮음)
pip install mediapipe
pip install scikit-learn
```

### 3. 서버 테스트
```cmd
# LOLA 서버 직접 실행
C:\palantir\math\venv311\Scripts\python.exe C:\palantir\math\src\lola-integration\lola-server.py

# 브라우저에서 확인
http://localhost:8080
```

### 4. React 앱 확인
```cmd
cd C:\palantir\math

# package.json 확인
type package.json | findstr "start"

# 직접 실행
node server\index.js
```

---

## 📝 테스트 명령

### 배치 파일 테스트 순서
1. `test-lola-components.bat` - 컴포넌트 단계별 테스트
2. `start-lola-direct.bat` - 가장 간단한 실행
3. `start-lola-simple.bat` - 디버깅 포함 실행

---

## 🎯 즉시 실행 명령

가장 간단한 방법:
```cmd
C:\palantir\math\start-lola-direct.bat
```

---

## ⚠️ 주의사항

1. **venv311이 없는 경우**:
   - venv 디렉토리를 사용하거나
   - 시스템 Python 사용

2. **MediaPipe 오류**:
   - 무시하고 계속 진행 (터치만 사용)

3. **포트 충돌**:
   - 8080, 8081, 3000 포트가 사용 중인지 확인
   ```cmd
   netstat -an | findstr :8080
   netstat -an | findstr :8081
   netstat -an | findstr :3000
   ```