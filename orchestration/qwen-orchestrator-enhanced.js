// Enhanced Qwen3-Max Orchestrator with Claude Collaboration
// 75개 AI 에이전트 + Claude-Qwen 협업 시스템 통합 버전

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

// 커스텀 모듈 임포트
import QwenMathEducationAgentSystem from './qwen-agents-75-complete.js';
import CollaborativeProblemSolver from './claude-qwen-collaborative-solver.js';

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

// 시스템 초기화
const agentSystem = new QwenMathEducationAgentSystem();
const collaborativeSolver = new CollaborativeProblemSolver();

// WebSocket 서버
const wss = new WebSocketServer({ port: WS_PORT });

// ==================== HTTP 엔드포인트 ====================

// 헬스체크
app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        service: 'Qwen3-Max-Preview AI Agents System with Claude Collaboration',
        model: 'Qwen3-Max-Preview (1T+ parameters) + Claude Opus 4.1',
        agents: Object.keys(agentSystem.agents).length,
        collaboration: 'enabled',
        categories: Object.keys(agentSystem.getStatistics().byCategory).length,
        contextWindow: '262K tokens',
        apiKey: process.env.DASHSCOPE_API_KEY ? 'configured' : 'missing',
        timestamp: Date.now()
    });
});

// 에이전트 목록 조회
app.get('/api/agents', (req, res) => {
    const { category } = req.query;
    const stats = agentSystem.getStatistics();
    
    if (category) {
        const filtered = agentSystem.getAgentsByCategory(category);
        res.json({
            category,
            agents: filtered,
            count: filtered.length
        });
    } else {
        res.json({
            total: stats.totalAgents,
            categories: stats.byCategory,
            complexity: stats.byComplexity,
            agents: Object.keys(agentSystem.agents)
        });
    }
});

// 단일 에이전트 호출
app.post('/api/agent/call', async (req, res) => {
    const { agent, task, options } = req.body;
    
    if (!agent || !task) {
        return res.status(400).json({ 
            error: 'Missing required parameters: agent, task' 
        });
    }
    
    try {
        console.log(chalk.blue(`Calling agent: ${agent}`));
        const result = await agentSystem.callAgent(agent, task, options);
        res.json({ 
            success: true, 
            result,
            totalCost: result.cost ? result.cost.totalCost : 0
        });
    } catch (error) {
        console.error(chalk.red('Agent call error:'), error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 자동 에이전트 선택
app.post('/api/agent/auto', async (req, res) => {
    const { task, complexity = 'medium' } = req.body;
    
    if (!task) {
        return res.status(400).json({ 
            error: 'Missing required parameter: task' 
        });
    }
    
    try {
        const selectedAgent = agentSystem.selectOptimalAgent(task, complexity);
        console.log(chalk.blue(`Auto-selected agent: ${selectedAgent}`));
        
        const result = await agentSystem.callAgent(selectedAgent, task);
        res.json({ 
            success: true,
            selectedAgent,
            result,
            totalCost: result.cost ? result.cost.totalCost : 0
        });
    } catch (error) {
        console.error(chalk.red('Auto selection error:'), error);
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
        return res.status(400).json({ 
            error: 'Missing or invalid parameter: tasks (array required)' 
        });
    }
    
    try {
        console.log(chalk.blue(`Parallel execution: ${tasks.length} tasks`));
        const results = await agentSystem.parallelExecution(tasks);
        
        const totalCost = results.reduce(
            (sum, r) => sum + (r.cost ? r.cost.totalCost : 0), 
            0
        );
        
        res.json({ 
            success: true,
            results,
            totalCost: totalCost.toFixed(6)
        });
    } catch (error) {
        console.error(chalk.red('Parallel execution error:'), error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ==================== Claude-Qwen 협업 엔드포인트 ====================

// 협업 문제 해결
app.post('/api/collaborate/solve', async (req, res) => {
    const { problem, includeSearch = false } = req.body;
    
    if (!problem) {
        return res.status(400).json({ 
            error: 'Missing required parameter: problem' 
        });
    }
    
    try {
        console.log(chalk.magenta('\n🤝 Initiating Claude-Qwen Collaboration'));
        console.log(chalk.gray(`Problem: ${problem.substring(0, 100)}...`));
        
        const recommendation = await collaborativeSolver.solveProblem(problem);
        
        res.json({
            success: true,
            collaboration: {
                models: ['Claude Opus 4.1', 'Qwen3-Max-Preview'],
                method: '5-Step Collaborative Analysis'
            },
            recommendation,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(chalk.red('Collaboration error:'), error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 협업 분석만 수행 (해결방안 제외)
app.post('/api/collaborate/analyze', async (req, res) => {
    const { problem } = req.body;
    
    if (!problem) {
        return res.status(400).json({ 
            error: 'Missing required parameter: problem' 
        });
    }
    
    try {
        console.log(chalk.magenta('🔍 Collaborative Analysis Only'));
        
        // Step 1: 독립적 분석
        const analyses = await collaborativeSolver.analyzeProblemIndependently(problem);
        
        // Claude 분석 추가 (시뮬레이션)
        analyses.claude = {
            model: 'Claude Opus 4.1',
            rootCauses: [
                'Architecture design issue',
                'Integration complexity',
                'Missing abstraction layer'
            ],
            confidence: 88
        };
        
        // Step 2: 원인 통합
        const synthesis = await collaborativeSolver.synthesizeCauses(
            analyses.claude,
            analyses.qwen
        );
        
        res.json({
            success: true,
            claudeAnalysis: analyses.claude,
            qwenAnalysis: analyses.qwen,
            synthesis,
            primaryCause: synthesis.primaryCause
        });
    } catch (error) {
        console.error(chalk.red('Analysis error:'), error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 협업 통계
app.get('/api/collaborate/stats', (req, res) => {
    res.json({
        collaborationEnabled: true,
        models: {
            strategic: 'Claude Opus 4.1',
            execution: 'Qwen3-Max-Preview'
        },
        features: [
            'Independent Analysis',
            'Cause Synthesis',
            'Solution Generation',
            'External Validation',
            'Hybrid Recommendations'
        ],
        history: collaborativeSolver.solutionHistory.length,
        lastCollaboration: collaborativeSolver.solutionHistory.slice(-1)[0] || null
    });
});

// ==================== 특수 엔드포인트 ====================

// 수학 문제 해결 (협업 모드 옵션)
app.post('/api/math/solve', async (req, res) => {
    const { problem, grade = 'high', detailed = true, useCollaboration = false } = req.body;
    
    if (!problem) {
        return res.status(400).json({ 
            error: 'Missing required parameter: problem' 
        });
    }
    
    try {
        if (useCollaboration) {
            // Claude-Qwen 협업 모드
            console.log(chalk.magenta('Using collaborative solving for math problem'));
            const recommendation = await collaborativeSolver.solveProblem(
                `Math problem (${grade} level): ${problem}`
            );
            
            res.json({
                success: true,
                mode: 'collaborative',
                solution: recommendation.recommendations[0],
                allApproaches: recommendation.recommendations,
                confidence: recommendation.recommendations[0].confidence
            });
        } else {
            // 단일 Qwen 모드
            const agent = 'algebraExpert'; // 수학 문제는 대수 전문가 사용
            const result = await agentSystem.callAgent(agent, problem, { 
                maxTokens: detailed ? 3000 : 1500 
            });
            
            res.json({
                success: true,
                mode: 'single',
                solution: result.response,
                agent: agent,
                cost: result.cost
            });
        }
    } catch (error) {
        console.error(chalk.red('Math solve error:'), error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 비용 예측
app.post('/api/cost/estimate', (req, res) => {
    const { tasks } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ 
            error: 'Missing or invalid parameter: tasks' 
        });
    }
    
    let totalEstimate = 0;
    const estimates = [];
    
    tasks.forEach(task => {
        const agent = agentSystem.agents[task.agent];
        if (agent) {
            const tokens = agent.maxTokens || 2000;
            const inputTokens = 200; // 평균 입력 토큰
            const cost = agentSystem.calculateCost({
                prompt_tokens: inputTokens,
                completion_tokens: tokens
            });
            
            estimates.push({
                agent: task.agent,
                estimatedCost: cost.totalCost
            });
            
            totalEstimate += cost.totalCost;
        }
    });
    
    res.json({
        success: true,
        tasksCount: tasks.length,
        estimates,
        estimatedTotalCost: totalEstimate.toFixed(6),
        note: 'Estimates based on average token usage'
    });
});

// 시스템 통계
app.get('/api/stats', (req, res) => {
    const stats = agentSystem.getStatistics();
    
    res.json({
        ...stats,
        collaboration: {
            enabled: true,
            solutionsGenerated: collaborativeSolver.solutionHistory.length
        },
        server: {
            httpPort: HTTP_PORT,
            wsPort: WS_PORT,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        }
    });
});

// ==================== WebSocket 핸들러 ====================

wss.on('connection', (ws) => {
    console.log(chalk.green('New WebSocket connection established'));
    
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
                        type: 'agent_response', 
                        result 
                    }));
                    break;
                    
                case 'collaborate':
                    const recommendation = await collaborativeSolver.solveProblem(
                        data.problem
                    );
                    ws.send(JSON.stringify({ 
                        type: 'collaboration_result', 
                        recommendation 
                    }));
                    break;
                    
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
                    
                default:
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        message: 'Unknown message type' 
                    }));
            }
        } catch (error) {
            console.error(chalk.red('WebSocket error:'), error);
            ws.send(JSON.stringify({ 
                type: 'error', 
                message: error.message 
            }));
        }
    });
    
    ws.on('close', () => {
        console.log(chalk.yellow('WebSocket connection closed'));
    });
});

// ==================== 서버 시작 ====================

app.listen(HTTP_PORT, () => {
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan.bold(' 🚀 Enhanced Qwen3-Max System with Claude'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.yellow(' Models:'));
    console.log(chalk.white('  • Qwen3-Max-Preview (1T+ parameters)'));
    console.log(chalk.white('  • Claude Opus 4.1 (Collaboration)'));
    console.log(chalk.yellow(' Features:'));
    console.log(chalk.white('  • 75 AI Agents'));
    console.log(chalk.white('  • Claude-Qwen Collaboration'));
    console.log(chalk.white('  • 5-Step Problem Solving'));
    console.log(chalk.white('  • Hybrid Solution Generation'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green(` HTTP Server: http://localhost:${HTTP_PORT}`));
    console.log(chalk.green(` WebSocket: ws://localhost:${WS_PORT}`));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.magenta(' ⚡ Enhanced System Ready!'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    
    console.log(chalk.white('Collaboration Endpoints:'));
    console.log(chalk.gray('  POST /api/collaborate/solve   - Full collaborative solving'));
    console.log(chalk.gray('  POST /api/collaborate/analyze - Analysis only'));
    console.log(chalk.gray('  GET  /api/collaborate/stats   - Collaboration statistics'));
    console.log(chalk.gray('  POST /api/math/solve         - Math with optional collaboration'));
});

console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.green(' WebSocket Server: ws://localhost:' + WS_PORT));
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

// 우아한 종료 처리
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nShutting down servers...'));
    wss.close();
    process.exit(0);
});
