@echo off
echo === AE Claude Max v3.0 환경 설정 ===
echo.

cd /d C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project

echo [1/4] 가상환경 활성화 중...
call venv\Scripts\activate.bat

echo [2/4] pip 업그레이드 중...
python -m pip install --upgrade pip

echo [3/4] 필수 패키지 설치 중...
python -m pip install anthropic watchdog pyyaml rich python-dotenv aiofiles

echo [4/4] 선택 패키지 설치 중...
python -m pip install opencv-python numpy pytest pytest-asyncio black

echo.
echo === 설치 완료 ===
echo.
echo 설치된 패키지 목록:
python -m pip list

echo.
echo === 환경 검증 ===
python test_v3_implementation.py

pause
