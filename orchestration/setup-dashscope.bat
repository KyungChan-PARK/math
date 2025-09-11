@echo off
echo ==========================================
echo   DashScope API Key Setup Assistant
echo ==========================================
echo.

echo Current Authentication:
echo - AccessKeyId: LTAI5tGKFLf3VhjBVAjUvUo4
echo - AccessKeySecret: Configured
echo - DashScope API Key: Not Set (Required!)
echo.

echo This script will help you:
echo 1. Open DashScope Console
echo 2. Configure API Key
echo 3. Test connection
echo.

pause

cd /d C:\palantir\math\orchestration
node setup-dashscope.js

pause
