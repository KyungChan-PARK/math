#!/bin/bash
# Palantir Math Project - Quick Start Script
# 새 세션 시작 시 실행

echo "================================================"
echo "   Palantir Math Project - Session Start"
echo "================================================"
echo ""

# 1. 프로젝트 상태 확인
echo "📋 Loading project status..."
echo ""

# 2. 서비스 상태 체크
echo "🔍 Checking services..."
echo ""

# HTTP 서비스 체크
echo -n "  Qwen Orchestrator (8093): "
curl -s http://localhost:8093/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Running"
else
    echo "❌ Not running"
    echo "  Starting orchestrator..."
    node C:/palantir/math/orchestration/qwen-orchestrator-optimized.js &
fi

# 3. 캐시 상태
echo ""
echo "💾 Cache Status:"
CACHE_COUNT=$(ls -1 C:/palantir/math/cache/qwen/*.json 2>/dev/null | wc -l)
echo "  Cached items: $CACHE_COUNT"

# 4. 최근 체크포인트
echo ""
echo "📍 Last Checkpoint:"
cat C:/palantir/math/checkpoint.json | grep "lastUpdated" | cut -d'"' -f4

# 5. 다음 작업
echo ""
echo "📝 Next Steps:"
echo "  1. Check PROJECT_STATUS.md for detailed status"
echo "  2. Review checkpoint.json for current focus"
echo "  3. Run test-optimized-client.js to verify system"
echo ""
echo "================================================"
echo "Ready to continue development!"
echo "================================================"