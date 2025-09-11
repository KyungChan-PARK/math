#!/bin/bash
# Qwen3-Max-Preview Orchestrator 시작 스크립트

echo "🚀 Starting Qwen3-Max-Preview Orchestrator..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Model: Qwen3-Max-Preview (1T+ parameters)"
echo "Context: 262K tokens"
echo "Port: 8093 (HTTP), 8094 (WebSocket)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd C:/palantir/math/orchestration
node qwen-orchestrator-75.js
