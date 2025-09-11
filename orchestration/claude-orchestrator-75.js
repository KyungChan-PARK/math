// 75+ AI Agents Orchestration Server
// 실제 작동 가능한 통합 시스템

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import MathEducationAgentSystem from './ai-agents-75-complete.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트의 .env 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// 75개 에이전트 시스템 초기화
const agentSystem = new MathEducationAgentSystem();

// 시스템 상태 확인
const stats = agentSystem.getStatistics();
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.cyan.bold(' 75+ AI Agents System Initialized'));
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.green(` Total Agents: ${stats.totalAgents}`));
console.log(chalk.yellow(' Categories:'));
Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(chalk.yellow(`  - ${cat}: ${count} agents`));
});
console.log(chalk.blue(' Models:'));
Object.entries(stats.byModel).forEach(([model, count]) => {
    const modelName = model.split('/').pop();
    console.log(chalk.blue(`  - ${modelName}: ${count} agents`));
});
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

// API 엔드포인트들

// 1. 에이전트 목록 조회
app.get('/api/agents', (req, res) => {
    const category = req.query.category;
    
    if (category) {
        const agents = agentSystem.getAgentsByCategory(category);
        res.json({ category, agents, count: agents.length });
    } else {
        res.json({
            total: stats.totalAgents,
            categories: stats.byCategory,
            models: stats.byModel,
            agents: Object.entries(agentSystem.agents).map(([name, config]) => ({
                name,
                role: config.role,
                category: config.category,
                model: config.model.split('/').pop()
            }))
        });
    }
});

// 2. 단일 에이전트 호출
app.post('/api/agent/call', async (req, res) => {
    const { agent, task, options } = req.body;
    
    try {
        const result = await agentSystem.callAgent(agent, task, options);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message,
            hint: '사용 가능한 에이전트 목록은 GET /api/agents를 확인하세요.'
        });
    }
});

// 3. 자동 에이전트 선택
app.post('/api/agent/auto', async (req, res) => {
    const { task, complexity = 'medium' } = req.body;
    
    try {
        const selectedAgent = agentSystem.selectOptimalAgent(task, complexity);
        const result = await agentSystem.callAgent(selectedAgent, task);
        res.json({ 
            success: true, 
            selectedAgent,
            result 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. 병렬 실행
app.post('/api/agent/parallel', async (req, res) => {
    const { tasks } = req.body;
    
    try {
        const results = await agentSystem.parallelExecution(tasks);
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. 워크플로우 실행
app.post('/api/agent/workflow', async (req, res) => {
    const { workflow } = req.body;
    
    try {
        const results = await agentSystem.executeWorkflow(workflow);
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. 수학 교육 특화 엔드포인트
app.post('/api/math/solve', async (req, res) => {
    const { problem, grade = 'high' } = req.body;
    
    const workflow = [
        { agent: 'algebraExpert', prompt: `문제 분석: ${problem}` },
        { agent: 'solutionExplainer', prompt: '단계별 해법 생성' },
        { agent: 'graphVisualizer', prompt: '시각화 코드 생성' }
    ];
    
    try {
        const results = await agentSystem.executeWorkflow(workflow);
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 7. 제스처 해석
app.post('/api/gesture/interpret', async (req, res) => {
    const { keypoints } = req.body;
    
    try {
        const result = await agentSystem.callAgent(
            'gestureInterpreter',
            JSON.stringify(keypoints)
        );
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 8. 수업 계획 생성
app.post('/api/lesson/create', async (req, res) => {
    const { topic, duration = 45, level = 'intermediate' } = req.body;
    
    const workflow = [
        { agent: 'curriculumDesigner', prompt: `주제: ${topic}, 수준: ${level}` },
        { agent: 'lessonPlanner', prompt: `${duration}분 수업 계획` },
        { agent: 'engagementStrategist', prompt: '참여 활동 설계' },
        { agent: 'assessmentCreator', prompt: '평가 문항 생성' }
    ];
    
    try {
        const results = await agentSystem.executeWorkflow(workflow);
        res.json({ success: true, lesson: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 9. 시각화 생성
app.post('/api/visualize', async (req, res) => {
    const { concept, type = 'graph' } = req.body;
    
    const agentMap = {
        'graph': 'graphVisualizer',
        '3d': 'shape3DModeler',
        'animation': 'animationChoreographer',
        'diagram': 'diagramArchitect',
        'fractal': 'fractalGenerator'
    };
    
    const agent = agentMap[type] || 'graphVisualizer';
    
    try {
        const result = await agentSystem.callAgent(agent, concept);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 10. 건강 체크
app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        service: '75+ AI Agents Orchestration System',
        agents: stats.totalAgents,
        categories: Object.keys(stats.byCategory).length,
        apiKey: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
        timestamp: Date.now()
    });
});

// 11. 통계
app.get('/api/stats', (req, res) => {
    res.json(agentSystem.getStatistics());
});

// WebSocket 서버
const PORT = process.env.ORCHESTRATOR_PORT || 8091;
const WS_PORT = process.env.ORCHESTRATOR_WS_PORT || 8092;

const server = app.listen(PORT, () => {
    console.log(chalk.green.bold(` HTTP Server: http://localhost:${PORT}`));
});

const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
    console.log(chalk.blue(' New WebSocket connection'));
    
    ws.send(JSON.stringify({
        type: 'connected',
        message: '75+ AI Agents System Connected',
        agents: stats.totalAgents
    }));
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            let result;
            
            switch (data.type) {
                case 'call':
                    result = await agentSystem.callAgent(
                        data.agent,
                        data.task,
                        data.options
                    );
                    break;
                    
                case 'auto':
                    const agent = agentSystem.selectOptimalAgent(
                        data.task,
                        data.complexity
                    );
                    result = await agentSystem.callAgent(agent, data.task);
                    break;
                    
                case 'workflow':
                    result = await agentSystem.executeWorkflow(data.workflow);
                    break;
                    
                default:
                    result = { error: 'Unknown message type' };
            }
            
            ws.send(JSON.stringify({
                type: 'response',
                requestId: data.id,
                result
            }));
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message
            }));
        }
    });
});

console.log(chalk.green(' WebSocket Server: ws://localhost:8090'));
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.yellow(' Ready to orchestrate 75+ AI Agents!'));
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

// 도움말 출력
console.log('\nAvailable endpoints:');
console.log('  GET  /api/agents         - List all agents');
console.log('  GET  /api/agents?category=math_concepts - Filter by category');
console.log('  POST /api/agent/call     - Call specific agent');
console.log('  POST /api/agent/auto     - Auto-select optimal agent');
console.log('  POST /api/agent/parallel - Parallel execution');
console.log('  POST /api/agent/workflow - Sequential workflow');
console.log('  POST /api/math/solve     - Solve math problem');
console.log('  POST /api/lesson/create  - Create lesson plan');
console.log('  POST /api/visualize      - Generate visualization');
console.log('  GET  /api/health         - Health check');
console.log('  GET  /api/stats          - System statistics\n');

export default app;