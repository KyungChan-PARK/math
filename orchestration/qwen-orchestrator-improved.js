// Improved Qwen Orchestrator - Clean Architecture
// 설정 파일 기반, 보안 강화, 에러 처리 개선

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 환경 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// API 키 검증 (보안 강화)
if (!process.env.DASHSCOPE_API_KEY) {
    console.error(chalk.red('❌ DASHSCOPE_API_KEY is required in .env file'));
    process.exit(1);
}

// 에이전트 설정 로드
const agentsConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'config', 'agents.json'), 'utf8')
);

// 최적화된 Qwen 클라이언트
import OptimizedQwenClient from '../optimized-qwen-client.js';

// Express 앱 초기화
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 포트 설정
const HTTP_PORT = process.env.QWEN_ORCHESTRATOR_PORT || 8093;
const WS_PORT = process.env.QWEN_WS_PORT || 8094;

// 에러 타입 정의
const ErrorTypes = {
    NETWORK: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT_ERROR',
    RATE_LIMIT: 'RATE_LIMIT_ERROR',
    INVALID_INPUT: 'INVALID_INPUT_ERROR',
    API_ERROR: 'API_ERROR'
};

// 개선된 에이전트 시스템
class ImprovedAgentSystem {
    constructor(config) {
        this.config = config;
        this.client = new OptimizedQwenClient();
        this.agents = this.loadAgentsFromConfig();
        this.stats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            cacheHits: 0,
            responseTimes: [],
            errorCounts: {}
        };
        
        this.initializeSystem();
    }
    
    loadAgentsFromConfig() {
        const agents = {};
        
        for (const [category, categoryData] of Object.entries(this.config.categories)) {
            for (const agentType of categoryData.agents) {
                const agentName = `${agentType}Expert`;
                agents[agentName] = {
                    category,
                    type: agentType,
                    role: `${agentType} specialist in ${category}`,
                    description: categoryData.description,
                    systemPrompt: this.generateSystemPrompt(agentType, category),
                    maxTokens: categoryData.defaultTokens,
                    created: new Date().toISOString()
                };
            }
        }
        
        return agents;
    }
    
    generateSystemPrompt(type, category) {
        return `You are an expert ${type} specialist in the ${category} domain for mathematics education.
Your role is to provide accurate, educational, and helpful responses.
Always consider the educational context and learning objectives.
Respond in a clear, structured manner suitable for educational purposes.`;
    }
    
    initializeSystem() {
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan.bold(' 🚀 Improved Qwen System v2.0'));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green(`✅ ${Object.keys(this.agents).length} agents loaded from config`));
        console.log(chalk.yellow(' Improvements:'));
        console.log(chalk.white('  • Configuration-based agents'));
        console.log(chalk.white('  • Enhanced error handling'));
        console.log(chalk.white('  • Detailed statistics tracking'));
        console.log(chalk.white('  • Security improvements'));
        console.log(chalk.white('  • Clean architecture'));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    }
    
    classifyError(error) {
        const message = error.message?.toLowerCase() || '';
        
        if (message.includes('timeout')) return ErrorTypes.TIMEOUT;
        if (message.includes('rate limit')) return ErrorTypes.RATE_LIMIT;
        if (message.includes('network') || message.includes('fetch')) return ErrorTypes.NETWORK;
        if (message.includes('invalid')) return ErrorTypes.INVALID_INPUT;
        
        return ErrorTypes.API_ERROR;
    }
    
    async handleError(error, agentName, task) {
        const errorType = this.classifyError(error);
        
        // 에러 통계 업데이트
        this.stats.errorCounts[errorType] = (this.stats.errorCounts[errorType] || 0) + 1;
        this.stats.failedCalls++;
        
        console.error(chalk.red(`[${errorType}] ${agentName}:`), error.message);
        
        // 에러 타입별 대응
        switch (errorType) {
            case ErrorTypes.TIMEOUT:
                return {
                    error: true,
                    errorType,
                    message: 'Request timed out. The task might be too complex. Try simplifying it.',
                    suggestion: 'Break down the task into smaller parts'
                };
                
            case ErrorTypes.RATE_LIMIT:
                return {
                    error: true,
                    errorType,
                    message: 'Rate limit exceeded. Please wait a moment.',
                    retryAfter: 60000
                };
                
            case ErrorTypes.NETWORK:
                return {
                    error: true,
                    errorType,
                    message: 'Network connection issue. Please check your connection.',
                    canRetry: true
                };
                
            case ErrorTypes.INVALID_INPUT:
                return {
                    error: true,
                    errorType,
                    message: 'Invalid input provided. Please check your request.',
                    validation: this.validateTask(task)
                };
                
            default:
                return {
                    error: true,
                    errorType,
                    message: 'An unexpected error occurred.',
                    details: error.message
                };
        }
    }
    
    validateTask(task) {
        const issues = [];
        
        if (!task || typeof task !== 'string') {
            issues.push('Task must be a non-empty string');
        }
        if (task && task.length > 10000) {
            issues.push('Task is too long (max 10000 characters)');
        }
        if (task && task.trim().length === 0) {
            issues.push('Task cannot be only whitespace');
        }
        
        return {
            valid: issues.length === 0,
            issues
        };
    }
    
    async callAgent(agentName, task, options = {}) {
        // 입력 검증
        const validation = this.validateTask(task);
        if (!validation.valid) {
            return this.handleError(
                new Error('Invalid input'),
                agentName,
                task
            );
        }
        
        const agent = this.agents[agentName] || this.agents.algebraExpert;
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
            
            // 성공 통계 업데이트
            const responseTime = Date.now() - startTime;
            this.stats.successfulCalls++;
            this.stats.responseTimes.push(responseTime);
            
            // 최근 100개만 유지 (메모리 관리)
            if (this.stats.responseTimes.length > 100) {
                this.stats.responseTimes.shift();
            }
            
            return {
                success: true,
                agent: agentName,
                category: agent.category,
                ...result,
                responseTime,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return await this.handleError(error, agentName, task);
        }
    }
    
    async parallelExecution(tasks) {
        console.log(chalk.blue(`Executing ${tasks.length} tasks in parallel...`));
        
        // 입력 검증
        if (!Array.isArray(tasks) || tasks.length === 0) {
            return {
                error: true,
                message: 'Tasks must be a non-empty array'
            };
        }
        
        const promises = tasks.map(task => 
            this.callAgent(
                task.agent || 'algebraExpert',
                task.task || task.prompt,
                task.options
            )
        );
        
        return await Promise.allSettled(promises);
    }
    
    getStatistics() {
        const avgResponseTime = this.stats.responseTimes.length > 0
            ? this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length
            : 0;
        
        const successRate = this.stats.totalCalls > 0
            ? (this.stats.successfulCalls / this.stats.totalCalls * 100).toFixed(2)
            : 0;
        
        return {
            agents: Object.keys(this.agents).length,
            totalCalls: this.stats.totalCalls,
            successfulCalls: this.stats.successfulCalls,
            failedCalls: this.stats.failedCalls,
            successRate: `${successRate}%`,
            avgResponseTime: Math.round(avgResponseTime),
            errorBreakdown: this.stats.errorCounts,
            cacheStats: this.client.getStats?.()?.cache || {},
            timestamp: new Date().toISOString()
        };
    }
    
    // 에이전트 목록 조회
    getAgentList() {
        const agentsByCategory = {};
        
        for (const [name, agent] of Object.entries(this.agents)) {
            if (!agentsByCategory[agent.category]) {
                agentsByCategory[agent.category] = [];
            }
            agentsByCategory[agent.category].push({
                name,
                type: agent.type,
                description: agent.description
            });
        }
        
        return agentsByCategory;
    }
}

// 시스템 초기화
const agentSystem = new ImprovedAgentSystem(agentsConfig);

// WebSocket 서버
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
    console.log(chalk.green('✅ WebSocket client connected'));
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            const result = await agentSystem.callAgent(
                data.agent,
                data.task,
                data.options
            );
            ws.send(JSON.stringify(result));
        } catch (error) {
            ws.send(JSON.stringify({
                error: true,
                message: error.message
            }));
        }
    });
    
    ws.on('close', () => {
        console.log(chalk.yellow('👋 WebSocket client disconnected'));
    });
});

// ==================== HTTP 엔드포인트 ====================

// 헬스체크
app.get('/api/health', async (req, res) => {
    const stats = agentSystem.getStatistics();
    
    res.json({
        status: 'healthy',
        service: 'Improved Qwen System v2.0',
        model: 'qwen3-max-preview',
        ...stats
    });
});

// 에이전트 목록
app.get('/api/agents', (req, res) => {
    res.json({
        success: true,
        agents: agentSystem.getAgentList(),
        total: Object.keys(agentSystem.agents).length
    });
});

// 에이전트 호출
app.post('/api/agent/call', async (req, res) => {
    const { agent, task, options } = req.body;
    
    const result = await agentSystem.callAgent(agent, task, options);
    
    res.status(result.error ? 400 : 200).json(result);
});

// 병렬 실행
app.post('/api/agent/parallel', async (req, res) => {
    const { tasks } = req.body;
    
    const results = await agentSystem.parallelExecution(tasks);
    
    res.json({
        success: true,
        results,
        summary: {
            total: results.length,
            successful: results.filter(r => r.status === 'fulfilled').length,
            failed: results.filter(r => r.status === 'rejected').length
        }
    });
});

// 통계 조회
app.get('/api/stats', (req, res) => {
    res.json(agentSystem.getStatistics());
});

// 캐시 초기화
app.post('/api/cache/clear', async (req, res) => {
    if (agentSystem.client.clearCache) {
        await agentSystem.client.clearCache();
        res.json({ success: true, message: 'Cache cleared' });
    } else {
        res.status(501).json({ 
            success: false, 
            message: 'Cache clearing not implemented' 
        });
    }
});

// 에러 핸들러
app.use((err, req, res, next) => {
    console.error(chalk.red('Server error:'), err);
    res.status(500).json({
        error: true,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 서버 시작
app.listen(HTTP_PORT, () => {
    console.log(chalk.green(`\n🚀 HTTP Server running on port ${HTTP_PORT}`));
    console.log(chalk.blue(`🔌 WebSocket Server running on port ${WS_PORT}`));
    console.log(chalk.yellow('\n📍 Endpoints:'));
    console.log(chalk.white(`  GET  /api/health        - System health check`));
    console.log(chalk.white(`  GET  /api/agents        - List all agents`));
    console.log(chalk.white(`  POST /api/agent/call    - Call single agent`));
    console.log(chalk.white(`  POST /api/agent/parallel - Parallel execution`));
    console.log(chalk.white(`  GET  /api/stats         - Performance statistics`));
    console.log(chalk.white(`  POST /api/cache/clear   - Clear response cache`));
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Shutting down gracefully...'));
    wss.close();
    process.exit(0);
});

export default ImprovedAgentSystem;