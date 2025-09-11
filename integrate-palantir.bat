@echo off
echo ========================================
echo PALANTIR 프로젝트 통합 스크립트
echo ========================================

echo [1/4] 백업 생성 중...
set BACKUP_DIR=C:\palantir\math\backup_palantir_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
mkdir "%BACKUP_DIR%" 2>nul
xcopy /E /I /Y "C:\palantir-project" "%BACKUP_DIR%\palantir-project" >nul
echo 백업 완료: %BACKUP_DIR%

echo [2/4] 파일 통합 중...
:: palantir-api를 math 프로젝트로 이동
xcopy /E /I /Y "C:\palantir-project\palantir-api" "C:\palantir\math\cloud-api" >nul
xcopy /E /I /Y "C:\palantir-project\palantir-dashboard" "C:\palantir\math\cloud-dashboard" >nul
copy /Y "C:\palantir-project\.env.production" "C:\palantir\math\cloud-api\.env.production" >nul

echo [3/4] 경로 업데이트 중...
echo # PALANTIR 프로젝트 통합 완료 > "C:\palantir-project\MOVED_TO_MATH.txt"
echo 이 프로젝트는 C:\palantir\math로 통합되었습니다. >> "C:\palantir-project\MOVED_TO_MATH.txt"
echo 새 위치: >> "C:\palantir-project\MOVED_TO_MATH.txt"
echo - API: C:\palantir\math\cloud-api >> "C:\palantir-project\MOVED_TO_MATH.txt"
echo - Dashboard: C:\palantir\math\cloud-dashboard >> "C:\palantir-project\MOVED_TO_MATH.txt"
echo 백업: %BACKUP_DIR% >> "C:\palantir-project\MOVED_TO_MATH.txt"

echo [4/4] 통합 완료!
echo.
echo 결과:
echo - 원본 위치: C:\palantir-project
echo - 새 위치: C:\palantir\math\cloud-api
echo - 백업: %BACKUP_DIR%
echo.
echo 이제 C:\palantir\math에서 모든 PALANTIR 프로젝트를 관리할 수 있습니다.
