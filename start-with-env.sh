#!/bin/bash

# API 키 환경변수 설정 및 서비스 시작 스크립트

echo "🔐 Setting up environment variables..."

# .env 파일에서 환경변수 로드
export $(grep -v '^#' .env | xargs)

# 환경변수 확인
echo "✅ Environment variables loaded:"
echo "   DASHSCOPE_API_KEY: ${DASHSCOPE_API_KEY:0:10}..."
echo "   GEMINI_API_KEY: ${GEMINI_API_KEY:0:10}..."

# 서비스 시작
echo ""
echo "🚀 Starting services with proper environment..."

# AI Collaboration Orchestrator 시작
echo "Starting AI Collaboration Orchestrator..."
nohup node ai-collaboration-orchestrator.js > orchestrator.log 2>&1 &
ORCHESTRATOR_PID=$!
echo "   PID: $ORCHESTRATOR_PID"

# API Usage Monitor 시작
echo "Starting API Usage Monitor..."
nohup node api-usage-monitor-simplified.js > monitor.log 2>&1 &
MONITOR_PID=$!
echo "   PID: $MONITOR_PID"

# Ontology Optimizer 시작
echo "Starting Ontology Optimizer..."
nohup node ontology-optimizer.js > optimizer.log 2>&1 &
OPTIMIZER_PID=$!
echo "   PID: $OPTIMIZER_PID"

# PID 저장
echo "$ORCHESTRATOR_PID" > orchestrator.pid
echo "$MONITOR_PID" > monitor.pid
echo "$OPTIMIZER_PID" > optimizer.pid

echo ""
echo "✅ All services started with proper API keys"
echo "📝 Log files:"
echo "   - orchestrator.log"
echo "   - monitor.log"
echo "   - optimizer.log"
echo ""
echo "To stop services: kill \$(cat *.pid)"