// Qwen3-Max-Preview Orchestration Server
// Alibaba Cloud의 1조+ 파라미터 모델을 사용한 75개 AI 에이전트 시스템

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import QwenMathEducationAgentSystem from './qwen-agents-75-complete.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트의 .env 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 큰 컨텍스트 지원

// Qwen3-Max 에이전트 시스템 초기화
const agentSystem = new QwenMathEducationAgentSystem();

// 시스템 상태 확인
const stats = agentSystem.getStatistics();
console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.magenta.bold(' 🚀 Qwen3-Max-Preview Agent System Initialized'));
console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.cyan(` Model: ${stats.model}`));
console.log(chalk.cyan(` Context: ${stats.contextWindow}`));
console.log(chalk.green(` Total Agents: ${stats.totalAgents}`));
console.log(chalk.yellow(' Categories:'));
Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(chalk.yellow(`  - ${cat}: ${count} agents`));
});
console.log(chalk.blue(' Complexity Levels:'));
Object.entries(stats.byComplexity).forEach(([level, count]) => {
    console.log(chalk.blue(`  - ${level}: ${count} agents`));
});
console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

// API 엔드포인트들

// 1. 에이전트 목록 조회
app.get('/api/agents', (req, res) => {
    const category = req.query.category;
    
    if (category) {
        const agents = agentSystem.getAgentsByCategory(category);
        res.json({ category, agents, count: agents.length });
    } else {
        res.json({
            model: stats.model,
            contextWindow: stats.contextWindow,
            total: stats.totalAgents,
            categories: stats.byCategory,
            complexity: stats.byComplexity,
            agents: Object.entries(agentSystem.agents).map(([name, config]) => ({
                name,
                role: config.role,
                category: config.category,
                complexity: config.complexity,
                maxTokens: config.maxTokens
            }))
        });
    }
});

// 2. 단일 에이전트 호출
app.post('/api/agent/call', async (req, res) => {
    const { agent, task, options } = req.body;
    
    try {
        console.log(chalk.cyan(`Calling agent: ${agent}`));
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
        console.log(chalk.cyan(`Auto-selected agent: ${selectedAgent}`));
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

// 4. 병렬 실행 (Qwen3-Max의 빠른 속도 활용)
app.post('/api/agent/parallel', async (req, res) => {
    const { tasks } = req.body;
    
    try {
        console.log(chalk.cyan(`Parallel execution: ${tasks.length} tasks`));
        const results = await agentSystem.parallelExecution(tasks);
        
        // 총 비용 계산
        const totalCost = results.reduce((sum, r) => 
            sum + (r.cost?.totalCost || 0), 0
        );
        
        res.json({ 
            success: true, 
            results,
            totalCost: totalCost.toFixed(6) 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. 워크플로우 실행
app.post('/api/agent/workflow', async (req, res) => {
    const { workflow } = req.body;
    
    try {
        console.log(chalk.cyan(`Workflow execution: ${workflow.length} steps`));
        const results = await agentSystem.executeWorkflow(workflow);
        
        // 총 비용 계산
        const totalCost = results.reduce((sum, r) => 
            sum + (r.cost?.totalCost || 0), 0
        );
        
        res.json({ 
            success: true, 
            results,
            totalCost: totalCost.toFixed(6)
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. 수학 교육 특화 엔드포인트
app.post('/api/math/solve', async (req, res) => {
    const { problem, grade = 'high', detailed = false } = req.body;
    
    const workflow = [
        { agent: 'algebraExpert', prompt: `문제 분석: ${problem}` },
        { agent: 'solutionExplainer', prompt: '단계별 해법 생성' },
        { agent: 'graphVisualizer', prompt: '시각화 코드 생성' }
    ];
    
    if (detailed) {
        workflow.push(
            { agent: 'misconceptionAnalyzer', prompt: '일반적인 오개념 분석' },
            { agent: 'realWorldConnector', prompt: '실생활 연결 예시' }
        );
    }
    
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
            `MediaPipe 21 keypoints data: ${JSON.stringify(keypoints)}\n분석해서 수학적 의도를 파악하세요.`
        );
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 8. 수업 계획 생성
app.post('/api/lesson/create', async (req, res) => {
    const { topic, duration = 45, level = 'intermediate', language = 'ko' } = req.body;
    
    const prompt = language === 'ko' 
        ? `주제: ${topic}, 수준: ${level}, 시간: ${duration}분`
        : `Topic: ${topic}, Level: ${level}, Duration: ${duration} minutes`;
    
    const workflow = [
        { agent: 'curriculumDesigner', prompt },
        { agent: 'lessonPlanner', prompt: `${duration}분 수업 계획` },
        { agent: 'engagementStrategist', prompt: '참여 활동 설계' },
        { agent: 'assessmentCreator', prompt: '평가 문항 생성' },
        { agent: 'worksheetDesigner', prompt: '워크시트 생성' }
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
    const { concept, type = 'graph', includeCode = true } = req.body;
    
    const agentMap = {
        'graph': 'graphVisualizer',
        '3d': 'shape3DModeler',
        'animation': 'animationChoreographer',
        'diagram': 'diagramArchitect',
        'fractal': 'fractalGenerator',
        'infographic': 'infographicCreator',
        'data': 'dataVisualizationExpert'
    };
    
    const agent = agentMap[type] || 'graphVisualizer';
    const prompt = includeCode 
        ? `${concept}에 대한 시각화를 생성하고 실행 가능한 코드를 포함하세요.`
        : `${concept}에 대한 시각화 설명을 제공하세요.`;
    
    try {
        const result = await agentSystem.callAgent(agent, prompt);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 10. 코드 생성 (ExtendScript, JavaScript, Python)
app.post('/api/code/generate', async (req, res) => {
    const { description, language = 'javascript', purpose = 'visualization' } = req.body;
    
    let agent = 'extendScriptGenerator';
    let prompt = description;
    
    if (language === 'extendscript') {
        agent = 'extendScriptGenerator';
        prompt = `After Effects ExtendScript 코드 생성: ${description}`;
    } else if (purpose === 'visualization') {
        agent = type === '3d' ? 'shape3DModeler' : 'graphVisualizer';
        prompt = `${language}로 시각화 코드 생성: ${description}`;
    } else {
        agent = 'debugAssistant';
        prompt = `${language} 코드 생성: ${description}`;
    }
    
    try {
        const result = await agentSystem.callAgent(agent, prompt, { maxTokens: 3000 });
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 11. 건강 체크
app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        service: 'Qwen3-Max-Preview AI Agents System',
        model: stats.model,
        agents: stats.totalAgents,
        categories: Object.keys(stats.byCategory).length,
        contextWindow: stats.contextWindow,
        apiKey: process.env.ALIBABA_ACCESS_KEY_ID ? 'configured' : 'missing',
        timestamp: Date.now()
    });
});

// 12. 통계
app.get('/api/stats', (req, res) => {
    res.json(agentSystem.getStatistics());
});

// 13. 비용 예측
app.post('/api/cost/estimate', (req, res) => {
    const { tasks } = req.body;
    
    // 평균 토큰 수 추정
    const avgInputTokens = 500;
    const avgOutputTokens = 1500;
    
    const costPerTask = agentSystem.calculateCost({
        prompt_tokens: avgInputTokens,
        completion_tokens: avgOutputTokens
    });
    
    const totalCost = costPerTask.totalCost * tasks.length;
    
    res.json({
        tasksCount: tasks.length,
        estimatedCostPerTask: costPerTask,
        estimatedTotalCost: totalCost.toFixed(6),
        note: 'This is an estimate based on average token usage'
    });
});

// WebSocket 서버
const PORT = process.env.QWEN_ORCHESTRATOR_PORT || 8093;
const WS_PORT = process.env.QWEN_WS_PORT || 8094;

const server = app.listen(PORT, () => {
    console.log(chalk.green.bold(` HTTP Server: http://localhost:${PORT}`));
});

const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
    console.log(chalk.blue(' New WebSocket connection'));
    
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Qwen3-Max-Preview System Connected',
        model: stats.model,
        agents: stats.totalAgents,
        contextWindow: stats.contextWindow
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
                    
                case 'parallel':
                    result = await agentSystem.parallelExecution(data.tasks);
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

console.log(chalk.green(` WebSocket Server: ws://localhost:${WS_PORT}`));
console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.yellow.bold(' ⚡ Qwen3-Max-Preview Ready! (Blazing Fast)'));
console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

// 도움말 출력
console.log('\n' + chalk.white('Available endpoints:'));
console.log(chalk.gray('  GET  /api/agents         - List all agents'));
console.log(chalk.gray('  GET  /api/agents?category=math_concepts - Filter by category'));
console.log(chalk.gray('  POST /api/agent/call     - Call specific agent'));
console.log(chalk.gray('  POST /api/agent/auto     - Auto-select optimal agent'));
console.log(chalk.gray('  POST /api/agent/parallel - Parallel execution (fast!)'));
console.log(chalk.gray('  POST /api/agent/workflow - Sequential workflow'));
console.log(chalk.gray('  POST /api/math/solve     - Solve math problem'));
console.log(chalk.gray('  POST /api/lesson/create  - Create lesson plan'));
console.log(chalk.gray('  POST /api/visualize      - Generate visualization'));
console.log(chalk.gray('  POST /api/code/generate  - Generate code'));
console.log(chalk.gray('  POST /api/cost/estimate  - Estimate API costs'));
console.log(chalk.gray('  GET  /api/health         - Health check'));
console.log(chalk.gray('  GET  /api/stats          - System statistics\n'));

console.log(chalk.magenta('Features:'));
console.log(chalk.cyan('  • 1 Trillion+ parameters'));
console.log(chalk.cyan('  • 262K token context window'));
console.log(chalk.cyan('  • Blazing fast response'));
console.log(chalk.cyan('  • Multi-language support (EN/KO/ZH)'));
console.log(chalk.cyan('  • Cost-optimized token usage\n'));

export default app;
