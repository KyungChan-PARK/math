@echo off
echo Starting All LOLA Servers for Testing...
echo ========================================

echo [1/3] Starting Math WebSocket Server (port 8080)...
start /B cmd /c "cd C:\palantir\math && node index.js"
timeout /t 2 >nul

echo [2/3] Starting LOLA Physics Server (port 8090)...
start /B cmd /c "cd C:\palantir\math && python src\lola-integration\lola-server-8090.py"
timeout /t 2 >nul

echo [3/3] Starting LOLA Intent Server (port 8092)...
start /B cmd /c "cd C:\palantir\math && python src\lola-integration\lola_math_intent_system.py"
timeout /t 2 >nul

echo ========================================
echo All servers started!
echo Press any key to stop all servers...
pause >nul

echo Stopping all servers...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul
echo Done!
