/**
 * API Usage Monitor - Real-time tracking for Qwen, Gemini, Claude
 * 실시간 API 사용량 및 요금 추적 시스템
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import WebSocket, { WebSocketServer } from 'ws';

class APIUsageMonitor extends EventEmitter {
    constructor() {
        super();
        
        // API 요금 정보 (USD per 1K tokens)
        this.pricing = {
            qwen: {
                'qwen-max': { input: 0.014, output: 0.014 },
                'qwen-plus': { input: 0.004, output: 0.012 },
                'qwen-turbo': { input: 0.0005, output: 0.0015 }
            },
            gemini: {
                'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
                'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
                'gemini-1.0-pro': { input: 0.0005, output: 0.0015 }
            },
            claude: {
                'claude-3-opus': { input: 0.015, output: 0.075 },
                'claude-3-sonnet': { input: 0.003, output: 0.015 },
                'claude-3-haiku': { input: 0.00025, output: 0.00125 }
            }
        };
        
        // 실시간 사용량 추적
        this.usage = {
            qwen: {
                requests: 0,
                inputTokens: 0,
                outputTokens: 0,
                cost: 0,
                lastHour: [],
                errors: 0,
                latency: []
            },
            gemini: {
                requests: 0,
                inputTokens: 0,
                outputTokens: 0,
                cost: 0,
                lastHour: [],
                errors: 0,
                latency: []
            },
            claude: {
                requests: 0,
                inputTokens: 0,
                outputTokens: 0,
                cost: 0,
                lastHour: [],
                errors: 0,
                latency: []
            }
        };
        
        // 시간대별 통계
        this.hourlyStats = [];
        this.dailyStats = [];
        
        // WebSocket 서버 (실시간 대시보드용)
        this.wss = null;
        
        // 자동 저장 타이머
        this.saveInterval = null;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 API Usage Monitor 초기화 중...');
        
        // 이전 데이터 로드
        await this.loadPreviousData();
        
        // WebSocket 서버 시작
        this.startWebSocketServer();
        
        // 자동 저장 시작
        this.startAutoSave();
        
        // 시간별 집계 시작
        this.startHourlyAggregation();
        
        console.log('✅ API Usage Monitor 준비 완료');
    }
    
    /**
     * API 호출 추적
     */
    async trackAPICall(provider, model, inputTokens, outputTokens, latency = 0, error = null) {
        // API 추적 비활성화 - 비용 방지
        console.log(`📊 API 호출 추적 건너뛰기: ${provider} (비용 방지 모드)`);
        return;
        
        const timestamp = new Date();
        
        // 사용량 업데이트
        const usage = this.usage[provider];
        if (!usage) return;
        
        usage.requests++;
        usage.inputTokens += inputTokens;
        usage.outputTokens += outputTokens;
        
        if (error) {
            usage.errors++;
        }
        
        if (latency > 0) {
            usage.latency.push(latency);
            // 최근 100개만 유지
            if (usage.latency.length > 100) {
                usage.latency.shift();
            }
        }
        
        // 요금 계산
        const pricing = this.pricing[provider][model];
        if (pricing) {
            const inputCost = (inputTokens / 1000) * pricing.input;
            const outputCost = (outputTokens / 1000) * pricing.output;
            usage.cost += inputCost + outputCost;
        }
        
        // 시간별 기록
        usage.lastHour.push({
            timestamp,
            inputTokens,
            outputTokens,
            cost: usage.cost,
            latency,
            error: error ? error.message : null
        });
        
        // 1시간 이상 된 데이터 제거
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        usage.lastHour = usage.lastHour.filter(item => item.timestamp > oneHourAgo);
        
        // 이벤트 발생
        this.emit('apiCall', {
            provider,
            model,
            inputTokens,
            outputTokens,
            latency,
            error,
            totalCost: usage.cost
        });
        
        // WebSocket으로 실시간 전송
        this.broadcastUpdate();
        
        return usage;
    }
    
    /**
     * Qwen API 호출 추적
     */
    async trackQwenCall(model = 'qwen-plus', inputTokens, outputTokens, latency) {
        return this.trackAPICall('qwen', model, inputTokens, outputTokens, latency);
    }
    
    /**
     * Gemini API 호출 추적
     */
    async trackGeminiCall(model = 'gemini-1.5-flash', inputTokens, outputTokens, latency) {
        return this.trackAPICall('gemini', model, inputTokens, outputTokens, latency);
    }
    
    /**
     * Claude API 호출 추적
     */
    async trackClaudeCall(model = 'claude-3-sonnet', inputTokens, outputTokens, latency) {
        return this.trackAPICall('claude', model, inputTokens, outputTokens, latency);
    }
    
    /**
     * 현재 사용량 요약
     */
    getSummary() {
        const summary = {
            timestamp: new Date(),
            providers: {}
        };
        
        for (const [provider, usage] of Object.entries(this.usage)) {
            const avgLatency = usage.latency.length > 0 
                ? usage.latency.reduce((a, b) => a + b, 0) / usage.latency.length 
                : 0;
            
            summary.providers[provider] = {
                requests: usage.requests,
                inputTokens: usage.inputTokens,
                outputTokens: usage.outputTokens,
                totalTokens: usage.inputTokens + usage.outputTokens,
                cost: usage.cost.toFixed(4),
                costKRW: (usage.cost * 1300).toFixed(2), // USD to KRW
                errorRate: usage.requests > 0 ? (usage.errors / usage.requests * 100).toFixed(2) : 0,
                avgLatency: avgLatency.toFixed(2),
                lastHourRequests: usage.lastHour.length
            };
        }
        
        // 총 비용 계산
        summary.totalCost = Object.values(this.usage)
            .reduce((sum, usage) => sum + usage.cost, 0)
            .toFixed(4);
        summary.totalCostKRW = (summary.totalCost * 1300).toFixed(2);
        
        return summary;
    }
    
    /**
     * WebSocket 서버 시작
     */
    startWebSocketServer() {
        this.wss = new WebSocketServer({ port: 8106 });
        
        this.wss.on('connection', (ws) => {
            console.log('📱 대시보드 연결됨');
            
            // 초기 데이터 전송
            ws.send(JSON.stringify({
                type: 'initial',
                data: this.getSummary()
            }));
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                if (data.type === 'request_details') {
                    ws.send(JSON.stringify({
                        type: 'details',
                        data: this.getDetailedStats(data.provider)
                    }));
                }
            });
        });
        
        console.log('🌐 WebSocket 서버 시작 (포트 8106)');
    }
    
    /**
     * 실시간 업데이트 전송
     */
    broadcastUpdate() {
        if (!this.wss) return;
        
        const update = JSON.stringify({
            type: 'update',
            data: this.getSummary()
        });
        
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(update);
            }
        });
    }
    
    /**
     * 상세 통계
     */
    getDetailedStats(provider) {
        const usage = this.usage[provider];
        if (!usage) return null;
        
        // 시간별 그래프 데이터
        const hourlyData = [];
        const now = new Date();
        
        for (let i = 23; i >= 0; i--) {
            const hourStart = new Date(now - i * 60 * 60 * 1000);
            const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
            
            const hourData = usage.lastHour.filter(item => 
                item.timestamp >= hourStart && item.timestamp < hourEnd
            );
            
            hourlyData.push({
                hour: hourStart.getHours(),
                requests: hourData.length,
                tokens: hourData.reduce((sum, item) => 
                    sum + item.inputTokens + item.outputTokens, 0),
                cost: hourData.reduce((sum, item) => sum + (item.cost || 0), 0)
            });
        }
        
        return {
            provider,
            usage,
            hourlyData,
            recentCalls: usage.lastHour.slice(-10).reverse()
        };
    }
    
    /**
     * 자동 저장
     */
    startAutoSave() {
        this.saveInterval = setInterval(async () => {
            await this.saveData();
        }, 60000); // 1분마다 저장
    }
    
    async saveData() {
        const dataPath = path.join(process.cwd(), 'api-usage-data.json');
        const data = {
            timestamp: new Date(),
            usage: this.usage,
            hourlyStats: this.hourlyStats,
            dailyStats: this.dailyStats
        };
        
        try {
            await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
            console.log('💾 API 사용량 데이터 저장됨');
        } catch (error) {
            console.error('저장 실패:', error);
        }
    }
    
    async loadPreviousData() {
        const dataPath = path.join(process.cwd(), 'api-usage-data.json');
        
        try {
            const data = await fs.readFile(dataPath, 'utf-8');
            const parsed = JSON.parse(data);
            
            // 이전 데이터 복원
            if (parsed.usage) {
                Object.assign(this.usage, parsed.usage);
            }
            
            console.log('📂 이전 API 사용량 데이터 로드됨');
        } catch (error) {
            console.log('새로운 세션 시작');
        }
    }
    
    /**
     * 시간별 집계
     */
    startHourlyAggregation() {
        setInterval(() => {
            const hourSummary = {
                timestamp: new Date(),
                providers: {}
            };
            
            for (const [provider, usage] of Object.entries(this.usage)) {
                hourSummary.providers[provider] = {
                    requests: usage.lastHour.length,
                    tokens: usage.lastHour.reduce((sum, item) => 
                        sum + item.inputTokens + item.outputTokens, 0),
                    cost: usage.lastHour.reduce((sum, item) => 
                        sum + (item.cost || 0), 0)
                };
            }
            
            this.hourlyStats.push(hourSummary);
            
            // 24시간 이상 된 데이터 제거
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            this.hourlyStats = this.hourlyStats.filter(stat => 
                stat.timestamp > oneDayAgo
            );
            
        }, 60 * 60 * 1000); // 1시간마다
    }
    
    /**
     * 대시보드 HTML 생성
     */
    async generateDashboard() {
        const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Usage Monitor - 실시간 대시보드</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .provider-name {
            font-size: 1.5em;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #4ade80;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .metric:last-child {
            border-bottom: none;
        }
        .metric-label {
            opacity: 0.8;
        }
        .metric-value {
            font-weight: bold;
            font-size: 1.1em;
        }
        .cost {
            color: #fbbf24;
            font-size: 1.3em;
        }
        .total-cost {
            text-align: center;
            font-size: 2em;
            margin: 30px 0;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
        }
        .chart {
            height: 200px;
            margin-top: 20px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            padding: 10px;
        }
        .timestamp {
            text-align: center;
            opacity: 0.7;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 API Usage Monitor</h1>
        
        <div class="total-cost">
            💰 총 비용: <span id="totalCost">$0.00</span> (<span id="totalCostKRW">₩0</span>)
        </div>
        
        <div class="grid">
            <div class="card">
                <div class="provider-name">
                    <span class="status-indicator"></span>
                    Qwen API
                </div>
                <div class="metric">
                    <span class="metric-label">요청 수</span>
                    <span class="metric-value" id="qwen-requests">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">입력 토큰</span>
                    <span class="metric-value" id="qwen-input">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">출력 토큰</span>
                    <span class="metric-value" id="qwen-output">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">비용</span>
                    <span class="metric-value cost" id="qwen-cost">$0.00</span>
                </div>
                <div class="metric">
                    <span class="metric-label">평균 지연시간</span>
                    <span class="metric-value" id="qwen-latency">0ms</span>
                </div>
                <div class="chart" id="qwen-chart"></div>
            </div>
            
            <div class="card">
                <div class="provider-name">
                    <span class="status-indicator"></span>
                    Gemini API
                </div>
                <div class="metric">
                    <span class="metric-label">요청 수</span>
                    <span class="metric-value" id="gemini-requests">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">입력 토큰</span>
                    <span class="metric-value" id="gemini-input">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">출력 토큰</span>
                    <span class="metric-value" id="gemini-output">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">비용</span>
                    <span class="metric-value cost" id="gemini-cost">$0.00</span>
                </div>
                <div class="metric">
                    <span class="metric-label">평균 지연시간</span>
                    <span class="metric-value" id="gemini-latency">0ms</span>
                </div>
                <div class="chart" id="gemini-chart"></div>
            </div>
            
            <div class="card">
                <div class="provider-name">
                    <span class="status-indicator"></span>
                    Claude API
                </div>
                <div class="metric">
                    <span class="metric-label">요청 수</span>
                    <span class="metric-value" id="claude-requests">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">입력 토큰</span>
                    <span class="metric-value" id="claude-input">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">출력 토큰</span>
                    <span class="metric-value" id="claude-output">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">비용</span>
                    <span class="metric-value cost" id="claude-cost">$0.00</span>
                </div>
                <div class="metric">
                    <span class="metric-label">평균 지연시간</span>
                    <span class="metric-value" id="claude-latency">0ms</span>
                </div>
                <div class="chart" id="claude-chart"></div>
            </div>
        </div>
        
        <div class="timestamp">
            마지막 업데이트: <span id="lastUpdate">-</span>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:8106');
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === 'initial' || message.type === 'update') {
                updateDashboard(message.data);
            }
        };
        
        function updateDashboard(data) {
            // 총 비용 업데이트
            document.getElementById('totalCost').textContent = '$' + data.totalCost;
            document.getElementById('totalCostKRW').textContent = '₩' + data.totalCostKRW;
            
            // 각 프로바이더별 업데이트
            ['qwen', 'gemini', 'claude'].forEach(provider => {
                const stats = data.providers[provider];
                if (stats) {
                    document.getElementById(provider + '-requests').textContent = stats.requests.toLocaleString();
                    document.getElementById(provider + '-input').textContent = stats.inputTokens.toLocaleString();
                    document.getElementById(provider + '-output').textContent = stats.outputTokens.toLocaleString();
                    document.getElementById(provider + '-cost').textContent = '$' + stats.cost;
                    document.getElementById(provider + '-latency').textContent = stats.avgLatency + 'ms';
                }
            });
            
            // 타임스탬프 업데이트
            document.getElementById('lastUpdate').textContent = new Date(data.timestamp).toLocaleString('ko-KR');
        }
        
        // 자동 새로고침
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'refresh' }));
            }
        }, 5000);
    </script>
</body>
</html>`;
        
        const dashboardPath = path.join(process.cwd(), 'api-usage-dashboard.html');
        await fs.writeFile(dashboardPath, html);
        console.log('📊 대시보드 생성: api-usage-dashboard.html');
        
        return dashboardPath;
    }
}

// Export and run
export default APIUsageMonitor;

if (import.meta.url === `file://${process.argv[1]}`) {
    const monitor = new APIUsageMonitor();
    
    // 테스트 데이터 생성
    console.log('\n📊 API Usage Monitor 테스트 시작\n');
    
    // 시뮬레이션 데이터
    setInterval(async () => {
        // Qwen 호출 시뮬레이션
        if (Math.random() > 0.3) {
            await monitor.trackQwenCall('qwen-plus', 
                Math.floor(Math.random() * 1000), 
                Math.floor(Math.random() * 2000),
                Math.random() * 500
            );
        }
        
        // Gemini 호출 시뮬레이션
        if (Math.random() > 0.5) {
            await monitor.trackGeminiCall('gemini-1.5-flash',
                Math.floor(Math.random() * 800),
                Math.floor(Math.random() * 1500),
                Math.random() * 300
            );
        }
        
        // Claude 호출 시뮬레이션
        if (Math.random() > 0.7) {
            await monitor.trackClaudeCall('claude-3-sonnet',
                Math.floor(Math.random() * 1200),
                Math.floor(Math.random() * 2500),
                Math.random() * 600
            );
        }
        
        // 요약 출력
        const summary = monitor.getSummary();
        console.clear();
        console.log('='.repeat(60));
        console.log('📊 API 사용량 실시간 모니터링');
        console.log('='.repeat(60));
        
        for (const [provider, stats] of Object.entries(summary.providers)) {
            console.log(`\n${provider.toUpperCase()}:`);
            console.log(`  요청: ${stats.requests}`);
            console.log(`  토큰: ${stats.totalTokens.toLocaleString()}`);
            console.log(`  비용: $${stats.cost} (₩${stats.costKRW})`);
            console.log(`  평균 지연: ${stats.avgLatency}ms`);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log(`총 비용: $${summary.totalCost} (₩${summary.totalCostKRW})`);
        console.log('='.repeat(60));
        
    }, 2000);
    
    // 대시보드 생성
    await monitor.generateDashboard();
    console.log('\n🌐 대시보드: http://localhost:8106');
}