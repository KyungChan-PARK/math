@echo off
REM start-system.bat - Windows용 시스템 시작 스크립트

echo ========================================
echo  지능형 수학 교육 시스템 시작
echo  AI-in-the-Loop Math Education System
echo ========================================
echo.

REM MongoDB 확인
echo MongoDB 상태 확인 중...
sc query MongoDB >nul 2>&1
if %errorlevel%==0 (
    echo [OK] MongoDB가 실행 중입니다
) else (
    echo [경고] MongoDB가 실행되고 있지 않습니다
    echo MongoDB를 먼저 시작해주세요
    echo.
    pause
)

REM Neo4j 확인 (선택사항)
echo Neo4j 상태 확인 중...
curl -s http://localhost:7474 >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Neo4j가 실행 중입니다
) else (
    echo [정보] Neo4j가 실행되고 있지 않습니다 (선택사항)
)

echo.
echo ========================================
echo  백엔드 서버 시작
echo ========================================

REM 새 터미널에서 백엔드 시작
cd backend
start "Math Education Backend" cmd /k "npm install ; npm start"

REM 백엔드가 준비될 때까지 대기
echo 백엔드 초기화 대기 중...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  프론트엔드 시작
echo ========================================

REM 새 터미널에서 프론트엔드 시작
cd ..\frontend
start "Math Education Frontend" cmd /k "npm install ; npm start"

echo.
echo ========================================
echo  시스템이 성공적으로 시작되었습니다!
echo ========================================
echo.
echo 프론트엔드: http://localhost:3000
echo 백엔드 API: http://localhost:8086
echo WebSocket: ws://localhost:8086/ws
echo.
echo 브라우저가 자동으로 열립니다...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo 모든 창을 닫으려면 이 창을 닫으세요.
pause
