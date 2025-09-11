@echo off
echo ==========================================
echo   Starting Qwen3-Max-Preview Orchestrator
echo ==========================================
echo   Model: Qwen3-Max-Preview (1T+ params)
echo   Context: 262K tokens  
echo   Port: 8093 (HTTP), 8094 (WebSocket)
echo ==========================================

cd /d C:\palantir\math\orchestration
node qwen-orchestrator-75.js
pause
