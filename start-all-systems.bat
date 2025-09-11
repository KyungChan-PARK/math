@echo off
cls
echo ================================================================================
echo                     PALANTIR MATH LEARNING PLATFORM v4.2
echo                          전체 시스템 자동 시작 스크립트
echo ================================================================================
echo.

:: 색상 설정
color 0A

:: 시작 시간 기록
set START_TIME=%time%

echo [%time%] 🚀 시스템 시작 준비 중...
echo.

:: Python 환경 확인
echo [1/7] Python 환경 확인...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python이 설치되어 있지 않습니다!
    echo Python 3.11을 설치해주세요.
    pause
    exit /b 1
)
echo ✅ Python 확인 완료

:: Node.js 환경 확인
echo [2/7] Node.js 환경 확인...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다!
    echo Node.js 20.x를 설치해주세요.
    pause
    exit /b 1
)
echo ✅ Node.js 확인 완료

:: 포트 확인 및 정리
echo [3/7] 포트 정리 중...
netstat -ano | findstr :8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo   - 포트 8080 사용 중, 프로세스 종료...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do taskkill /F /PID %%a >nul 2>&1
)

netstat -ano | findstr :8090 >nul 2>&1
if %errorlevel% equ 0 (
    echo   - 포트 8090 사용 중, 프로세스 종료...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8090') do taskkill /F /PID %%a >nul 2>&1
)

netstat -ano | findstr :8092 >nul 2>&1
if %errorlevel% equ 0 (
    echo   - 포트 8092 사용 중, 프로세스 종료...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8092') do taskkill /F /PID %%a >nul 2>&1
)

netstat -ano | findstr :8100 >nul 2>&1
if %errorlevel% equ 0 (
    echo   - 포트 8100 사용 중, 프로세스 종료...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8100') do taskkill /F /PID %%a >nul 2>&1
)
echo ✅ 포트 정리 완료

:: 서버 시작
echo.
echo [4/7] 🌐 Math WebSocket Server 시작 (포트 8100)...
start /min cmd /c "cd /d C:\palantir\math && node index.js"
timeout /t 2 >nul

echo [5/7] 🧮 LOLA Physics Server 시작 (포트 8090)...
start /min cmd /c "cd /d C:\palantir\math && python src\lola-integration\lola-server-8090.py"
timeout /t 2 >nul

echo [6/7] 🎯 LOLA Intent Learning Server 시작 (포트 8092)...
start /min cmd /c "cd /d C:\palantir\math && python src\lola-integration\lola_math_intent_system.py"
timeout /t 2 >nul

echo [7/7] ☁️ Cloud Run Warmup Service 시작...
start /min cmd /c "cd /d C:\palantir\math\cloud-api && python warmup.py"
timeout /t 1 >nul

echo.
echo ================================================================================
echo                            ✅ 모든 시스템 시작 완료!
echo ================================================================================
echo.
echo 📊 실행 중인 서비스:
echo    • Math WebSocket Server    : http://localhost:8100
echo    • LOLA Physics Server      : http://localhost:8090  
echo    • LOLA Intent Learning     : http://localhost:8092
echo    • Cloud Run API            : https://palantir-ai-api-521122377191.us-central1.run.app
echo.
echo 📁 프로젝트 위치: C:\palantir\math
echo ⏰ 시작 시간: %START_TIME%
echo ⏰ 완료 시간: %time%
echo.
echo 💡 팁: 
echo    - 모든 서버 중지: Ctrl+C 또는 stop-all-systems.bat 실행
echo    - 상태 확인: check-system-status.bat 실행
echo    - 로그 확인: C:\palantir\math\logs 폴더
echo.
echo 브라우저에서 http://localhost:8100 으로 접속하세요!
echo.
pause
