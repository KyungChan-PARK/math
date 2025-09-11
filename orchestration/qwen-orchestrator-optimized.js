// Enhanced Qwen3-Max Orchestrator with Performance Optimization
// 최적화된 Qwen API 클라이언트를 사용하는 오케스트레이터

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

// 최적화된 Qwen 클라이언트
import OptimizedQwenClient from '../optimized-qwen-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Express 앱 초기화
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 포트 설정
const HTTP_PORT = process.env.QWEN_ORCHESTRATOR_PORT || 8093;
const WS_PORT = process.env.QWEN_WS_PORT || 8094;

// 최적화된 에이전트 시스템
class OptimizedAgentSystem {
    constructor() {
        this.client = new OptimizedQwenClient();
        this.agents = this.initializeAgents();
        this.stats = {
            totalCalls: 0,
            cacheHits: 0,
            avgResponseTime: 0
        };
        
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan.bold(' 🚀 Optimized Qwen System Initialized'));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green(`✅ ${Object.keys(this.agents).length} agents with optimized client`));
        console.log(chalk.yellow(' Features:'));
        console.log(chalk.white('  • Response Caching (1hr TTL)'));
        console.log(chalk.white('  • Parallel Processing (5x concurrent)'));
        console.log(chalk.white('  • Auto-retry with exponential backoff'));
        console.log(chalk.white('  • Request queuing & batching'));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    }
    
    initializeAgents() {
        // 75개 에이전트 정의 (간소화)
        const categories = {
            math_concepts: ['algebra', 'geometry', 'calculus', 'statistics', 'trigonometry'],
            pedagogy: ['curriculum', 'lesson', 'assessment', 'differentiation', 'scaffolding'],
            visualization: ['graph', 'shape3D', 'animation', 'color', 'infographic'],
            interaction: ['gesture', 'voice', 'touch', 'pen', 'dragdrop'],
            assessment: ['progress', 'error', 'hint', 'solution', 'rubric'],
            technical: ['extendscript', 'debug', 'performance', 'api', 'database'],
            content: ['problem', 'example', 'worksheet', 'video', 'quiz'],
            analytics: ['learning', 'usage', 'predictive', 'report', 'dashboard']
        };
        
        const agents = {};
        
        for (const [category, types] of Object.entries(categories)) {
            for (const type of types) {
                const agentName = `${type}Expert`;
                agents[agentName] = {
                    category,
                    role: `${type} specialist`,
                    systemPrompt: `You are an expert in ${type} for mathematics education.`,
                    maxTokens: category === 'technical' ? 3000 : 2000
                };
            }
        }
        
        return agents;
    }
    
    async callAgent(agentName, task, options = {}) {
        const agent = this.agents[agentName];
        if (!agent) {
            // 에이전트가 없으면 기본 에이전트 사용
            agent = this.agents.algebraExpert || Object.values(this.agents)[0];
        }
        
        const startTime = Date.now();
        this.stats.totalCalls++;
        
        try {
            const result = await this.client.call(
                agentName,
                task,
                {
                    systemPrompt: agent.systemPrompt,
                    maxTokens: options.maxTokens || agent.maxTokens,
                    temperature: options.temperature || 0.7
                }
            );
            
            // 통계 업데이트
            const responseTime = Date.now() - startTime;
            this.stats.avgResponseTime = 
                (this.stats.avgResponseTime * (this.stats.totalCalls - 1) + responseTime) / 
                this.stats.totalCalls;
            
            return {
                ...result,
                responseTime
            };
        } catch (error) {
            console.error(chalk.red(`Error calling ${agentName}:`), error.message);
            
            // 폴백 응답
            return {
                agent: agentName,
                response: `I apologize, but I'm currently experiencing technical difficulties. Error: ${error.message}`,
                error: true,
                responseTime: Date.now() - startTime
            };
        }
    }
    
    async parallelExecution(tasks) {
        console.log(chalk.blue(`Executing ${tasks.length} tasks in parallel...`));
        
        const promises = tasks.map(task => 
            this.callAgent(task.agent || 'algebraExpert', task.task || task.prompt, task.options)
        );
        
        return await Promise.all(promises);
    }
    
    getStatistics() {
        const clientStats = this.client.getStats();
        
        return {
            agents: Object.keys(this.agents).length,
            totalCalls: this.stats.totalCalls,
            avgResponseTime: Math.round(this.stats.avgResponseTime),
            cache: clientStats.cache,
            queue: clientStats.queue,
            api: clientStats.api
        };
    }
}

// 시스템 초기화
const agentSystem = new OptimizedAgentSystem();

// WebSocket 서버
const wss = new WebSocketServer({ port: WS_PORT });

// ==================== HTTP 엔드포인트 ====================

// 헬스체크
app.get('/api/health', async (req, res) => {
    const health = await agentSystem.client.healthCheck();
    const stats = agentSystem.getStatistics();
    
    res.json({
        status: health.status,
        service: 'Optimized Qwen3-Max System',
        model: 'qwen3-max-preview',
        agents: stats.agents,
        performance: {
            avgResponseTime: `${stats.avgResponseTime}ms`,
            cacheHitRate: stats.cache?.hitRate || '0%',
            queueLength: stats.queue?.queueLength || 0
        },
        timestamp: Date.now()
    });
});

// 에이전트 호출
app.post('/api/agent/call', async (req, res) => {
    const { agent, task, options } = req.body;
    
    if (!task) {
        return res.status(400).json({ error: 'Task is required' });
    }
    
    try {
        const result = await agentSystem.callAgent(agent || 'algebraExpert', task, options);
        res.json({
            success: !result.error,
            result,
            cached: result.responseTime < 10
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 배치 처리
app.post('/api/agent/batch', async (req, res) => {
    const { tasks } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ error: 'Tasks array is required' });
    }
    
    try {
        const results = await agentSystem.client.batchCall(tasks);
        res.json({
            success: true,
            results,
            count: results.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 병렬 실행
app.post('/api/agent/parallel', async (req, res) => {
    const { tasks } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ error: 'Tasks array is required' });
    }
    
    try {
        const results = await agentSystem.parallelExecution(tasks);
        res.json({
            success: true,
            results,
            totalTime: Math.max(...results.map(r => r.responseTime || 0))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 통계
app.get('/api/stats', (req, res) => {
    const stats = agentSystem.getStatistics();
    res.json(stats);
});

// 캐시 관리
app.post('/api/cache/clear', (req, res) => {
    agentSystem.client.clearCache();
    res.json({
        success: true,
        message: 'Cache cleared'
    });
});

// 성능 테스트
app.get('/api/test/performance', async (req, res) => {
    console.log(chalk.cyan('Running performance test...'));
    
    const tests = {
        single: null,
        cached: null,
        parallel: null
    };
    
    // 1. 단일 요청
    const start1 = Date.now();
    await agentSystem.callAgent('algebraExpert', 'Test query 1');
    tests.single = Date.now() - start1;
    
    // 2. 캐시된 요청
    const start2 = Date.now();
    await agentSystem.callAgent('algebraExpert', 'Test query 1');
    tests.cached = Date.now() - start2;
    
    // 3. 병렬 요청
    const start3 = Date.now();
    await agentSystem.parallelExecution([
        { agent: 'algebraExpert', task: 'Test A' },
        { agent: 'geometryExpert', task: 'Test B' },
        { agent: 'calculusExpert', task: 'Test C' }
    ]);
    tests.parallel = Date.now() - start3;
    
    res.json({
        results: tests,
        improvements: {
            cacheSpeedup: tests.single / tests.cached,
            parallelEfficiency: (tests.single * 3) / tests.parallel
        }
    });
});

// ==================== WebSocket 핸들러 ====================

wss.on('connection', (ws) => {
    console.log(chalk.green('New WebSocket connection'));
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'agent_call':
                    const result = await agentSystem.callAgent(
                        data.agent,
                        data.task,
                        data.options
                    );
                    ws.send(JSON.stringify({
                        type: 'response',
                        result
                    }));
                    break;
                    
                case 'stats':
                    ws.send(JSON.stringify({
                        type: 'stats',
                        data: agentSystem.getStatistics()
                    }));
                    break;
                    
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
            }
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message
            }));
        }
    });
});

// ==================== 서버 시작 ====================

app.listen(HTTP_PORT, () => {
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan.bold(' 🚀 Optimized Qwen Orchestrator'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.yellow(' Performance Features:'));
    console.log(chalk.white('  ✓ Response Caching'));
    console.log(chalk.white('  ✓ Parallel Processing'));
    console.log(chalk.white('  ✓ Request Queuing'));
    console.log(chalk.white('  ✓ Auto-retry Logic'));
    console.log(chalk.white('  ✓ Connection Pooling'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green(` HTTP: http://localhost:${HTTP_PORT}`));
    console.log(chalk.green(` WebSocket: ws://localhost:${WS_PORT}`));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    console.log(chalk.white('\nAPI Endpoints:'));
    console.log(chalk.gray('  GET  /api/health           - System health'));
    console.log(chalk.gray('  POST /api/agent/call       - Call single agent'));
    console.log(chalk.gray('  POST /api/agent/batch      - Batch processing'));
    console.log(chalk.gray('  POST /api/agent/parallel   - Parallel execution'));
    console.log(chalk.gray('  GET  /api/stats            - Performance stats'));
    console.log(chalk.gray('  POST /api/cache/clear      - Clear cache'));
    console.log(chalk.gray('  GET  /api/test/performance - Run performance test'));
});

// 종료 처리
process.on('SIGINT', () => {
    console.log(chalk.yellow('\nShutting down...'));
    wss.close();
    process.exit(0);
});

export default OptimizedAgentSystem;