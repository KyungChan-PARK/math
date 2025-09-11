# Palantir Math Project - Quick Start Script (PowerShell)
# 새 세션 시작 시 실행: .\start-session.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Palantir Math Project - Session Start" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 프로젝트 상태 확인
Write-Host "📋 Loading project status..." -ForegroundColor Green
$checkpoint = Get-Content "C:\palantir\math\checkpoint.json" | ConvertFrom-Json
Write-Host "  Version: $($checkpoint.version)"
Write-Host "  Last Updated: $($checkpoint.lastUpdated)"
Write-Host "  Current Focus: $($checkpoint.currentFocus.primary)"
Write-Host ""

# 2. 서비스 상태 체크
Write-Host "🔍 Checking services..." -ForegroundColor Green
Write-Host ""

# HTTP 서비스 체크
Write-Host -NoNewline "  Qwen Orchestrator (8093): "
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8093/api/health" -UseBasicParsing -TimeoutSec 2
    Write-Host "✅ Running" -ForegroundColor Green
    
    # 통계 가져오기
    $stats = Invoke-RestMethod -Uri "http://localhost:8093/api/stats" -UseBasicParsing
    Write-Host "    Cache Hit Rate: $($stats.cache.hitRate)"
    Write-Host "    Avg Response: $($stats.avgResponseTime)ms"
} catch {
    Write-Host "❌ Not running" -ForegroundColor Red
    Write-Host "  Starting orchestrator..." -ForegroundColor Yellow
    Start-Process node -ArgumentList "C:\palantir\math\orchestration\qwen-orchestrator-optimized.js" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# 3. 캐시 상태
Write-Host ""
Write-Host "💾 Cache Status:" -ForegroundColor Green
$cacheFiles = Get-ChildItem "C:\palantir\math\cache\qwen\*.json" -ErrorAction SilentlyContinue
Write-Host "  Cached items: $($cacheFiles.Count)"
if ($cacheFiles.Count -gt 0) {
    $oldestCache = $cacheFiles | Sort-Object LastWriteTime | Select-Object -First 1
    $newestCache = $cacheFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    Write-Host "  Oldest: $($oldestCache.LastWriteTime)"
    Write-Host "  Newest: $($newestCache.LastWriteTime)"
}

# 4. 파일 상태
Write-Host ""
Write-Host "📁 Project Files:" -ForegroundColor Green
$jsFiles = (Get-ChildItem "C:\palantir\math\*.js" -ErrorAction SilentlyContinue).Count
$cjsFiles = (Get-ChildItem "C:\palantir\math\*.cjs" -ErrorAction SilentlyContinue).Count
Write-Host "  JavaScript files: $jsFiles"
Write-Host "  CommonJS files: $cjsFiles"

# 5. 알려진 이슈
Write-Host ""
Write-Host "⚠️ Known Issues:" -ForegroundColor Yellow
foreach ($issue in $checkpoint.issues) {
    Write-Host "  [$($issue.severity)] $($issue.title)"
    Write-Host "    Workaround: $($issue.workaround)"
}

# 6. 다음 작업
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Green
$i = 1
foreach ($step in $checkpoint.nextSteps) {
    Write-Host "  $i. $step"
    $i++
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📌 Quick Commands:" -ForegroundColor Yellow
Write-Host "  Test System:  node C:\palantir\math\test-optimized-client.js"
Write-Host "  View Status:  Get-Content C:\palantir\math\PROJECT_STATUS.md"
Write-Host "  Check Stats:  curl http://localhost:8093/api/stats"
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Ready to continue development!" -ForegroundColor Green
Write-Host ""