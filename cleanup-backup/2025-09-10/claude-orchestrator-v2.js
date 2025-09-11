// Enhanced Claude Orchestrator v2.0
// Fixed parallel execution and workflow implementation

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

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize agent system
const agentSystem = new MathEducationAgentSystem();

// System status
const stats = agentSystem.getStatistics();
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.cyan.bold(' 75+ AI Agents System v2.0 Initialized'));
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.green(` Total Agents: ${stats.totalAgents}`));
console.log(chalk.yellow(' Categories:'));
Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(chalk.yellow(`  - ${cat}: ${count} agents`));
});
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

// Helper function for error handling
const handleError = (res, error, message = 'Operation failed') => {
    console.error(chalk.red(message), error);
    res.status(500).json({ 
        success: false, 
        error: error.message || error,
        message 
    });
};

// 1. Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        service: '75+ AI Agents Orchestration System v2.0',
        agents: stats.totalAgents,
        categories: Object.keys(stats.byCategory).length,
        apiKey: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
        timestamp: Date.now()
    });
});

// 2. Get agents
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

// 3. Call single agent
app.post('/api/agent/call', async (req, res) => {
    const { agent, task, options } = req.body;
    
    if (!agent || !task) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields: agent, task' 
        });
    }
    
    try {
        const result = await agentSystem.callAgent(agent, task, options);
        res.json({ success: true, result });
    } catch (error) {
        handleError(res, error, `Failed to call agent ${agent}`);
    }
});

// 4. Auto-select agent
app.post('/api/agent/auto', async (req, res) => {
    const { task, complexity = 'medium' } = req.body;
    
    if (!task) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required field: task' 
        });
    }
    
    try {
        const selectedAgent = agentSystem.selectOptimalAgent(task, complexity);
        const result = await agentSystem.callAgent(selectedAgent, task);
        res.json({ 
            success: true, 
            selectedAgent,
            result 
        });
    } catch (error) {
        handleError(res, error, 'Auto agent selection failed');
    }
});

// 5. Parallel execution (FIXED)
app.post('/api/agent/parallel', async (req, res) => {
    const { tasks } = req.body;
    
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing or invalid tasks array' 
        });
    }
    
    try {
        console.log(chalk.blue(`Executing ${tasks.length} tasks in parallel...`));
        
        // Ensure all tasks have proper format
        const formattedTasks = tasks.map(task => ({
            agent: task.agent || 'algebraExpert',
            prompt: task.task || task.prompt || '',
            options: task.options || {}
        }));
        
        const results = await agentSystem.parallelExecution(formattedTasks);
        
        res.json({ 
            success: true, 
            results,
            count: results.length,
            execution: 'parallel'
        });
    } catch (error) {
        handleError(res, error, 'Parallel execution failed');
    }
});

// 6. Sequential workflow (FIXED)
app.post('/api/agent/workflow', async (req, res) => {
    const { workflow } = req.body;
    
    if (!workflow || !Array.isArray(workflow) || workflow.length === 0) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing or invalid workflow array' 
        });
    }
    
    try {
        console.log(chalk.blue(`Executing workflow with ${workflow.length} steps...`));
        
        // Ensure all workflow steps have proper format
        const formattedWorkflow = workflow.map(step => ({
            agent: step.agent || 'algebraExpert',
            prompt: step.task || step.prompt || '',
            options: step.options || {}
        }));
        
        const results = await agentSystem.executeWorkflow(formattedWorkflow);
        
        res.json({ 
            success: true, 
            results,
            steps: results.length,
            execution: 'sequential'
        });
    } catch (error) {
        handleError(res, error, 'Workflow execution failed');
    }
});

// 7. Math problem solver (ENHANCED)
app.post('/api/math/solve', async (req, res) => {
    const { problem, grade = 'high', showSteps = true } = req.body;
    
    if (!problem) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required field: problem' 
        });
    }
    
    try {
        console.log(chalk.blue(`Solving math problem: ${problem.substring(0, 50)}...`));
        
        // Multi-agent workflow for comprehensive solution
        const workflow = [
            { 
                agent: 'algebraExpert', 
                prompt: `Analyze and solve this problem: ${problem}` 
            }
        ];
        
        if (showSteps) {
            workflow.push({
                agent: 'solutionExplainer',
                prompt: 'Provide step-by-step explanation of the solution'
            });
        }
        
        if (problem.includes('graph') || problem.includes('function')) {
            workflow.push({
                agent: 'graphVisualizer',
                prompt: 'Create visualization code for this solution'
            });
        }
        
        const results = await agentSystem.executeWorkflow(workflow);
        
        // Format the solution
        const solution = {
            problem: problem,
            solution: results[0].response,
            steps: showSteps && results[1] ? results[1].response : null,
            visualization: results.find(r => r.agent === 'graphVisualizer')?.response || null,
            agents: results.map(r => r.agent)
        };
        
        res.json({ 
            success: true, 
            solution,
            execution: 'workflow'
        });
    } catch (error) {
        handleError(res, error, 'Math problem solving failed');
    }
});

// 8. Visualization generator (ENHANCED)
app.post('/api/visualize', async (req, res) => {
    const { type = 'graph', data, concept } = req.body;
    
    if (!data && !concept) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required field: data or concept' 
        });
    }
    
    try {
        const input = data || concept;
        console.log(chalk.blue(`Generating ${type} visualization...`));
        
        // Agent mapping for different visualization types
        const agentMap = {
            'graph': 'graphVisualizer',
            '3d': 'shape3DModeler',
            'animation': 'animationChoreographer',
            'diagram': 'diagramArchitect',
            'fractal': 'fractalGenerator',
            'chart': 'chartPlotter',
            'histogram': 'histogramDesigner'
        };
        
        const agent = agentMap[type] || 'graphVisualizer';
        
        // Generate visualization
        const result = await agentSystem.callAgent(
            agent,
            `Create a ${type} visualization for: ${input}`
        );
        
        // Generate implementation code
        const codeResult = await agentSystem.callAgent(
            'scriptWriter',
            `Generate JavaScript/Python code to implement this visualization: ${result.response}`
        );
        
        res.json({ 
            success: true, 
            visualization: {
                type: type,
                description: result.response,
                code: codeResult.response,
                agent: agent
            }
        });
    } catch (error) {
        handleError(res, error, 'Visualization generation failed');
    }
});

// 9. Lesson creation
app.post('/api/lesson/create', async (req, res) => {
    const { topic, duration = 45, level = 'intermediate' } = req.body;
    
    if (!topic) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required field: topic' 
        });
    }
    
    try {
        const workflow = [
            { agent: 'curriculumDesigner', prompt: `Design curriculum for: ${topic}, Level: ${level}` },
            { agent: 'lessonPlanner', prompt: `Create ${duration}-minute lesson plan` },
            { agent: 'engagementStrategist', prompt: 'Add engaging activities' },
            { agent: 'assessmentCreator', prompt: 'Create assessment questions' }
        ];
        
        const results = await agentSystem.executeWorkflow(workflow);
        
        res.json({ 
            success: true, 
            lesson: {
                topic,
                duration,
                level,
                curriculum: results[0].response,
                plan: results[1].response,
                activities: results[2].response,
                assessment: results[3].response
            }
        });
    } catch (error) {
        handleError(res, error, 'Lesson creation failed');
    }
});

// 10. System statistics
app.get('/api/stats', (req, res) => {
    const detailedStats = {
        ...stats,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        apiStatus: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing'
    };
    
    res.json(detailedStats);
});

// WebSocket server for real-time updates
const PORT = process.env.ORCHESTRATION_PORT || 8091;
const WS_PORT = process.env.WS_PORT || 8092;  // Changed from 8090 to 8092

const server = app.listen(PORT, () => {
    console.log(chalk.green(` HTTP Server: http://localhost:${PORT}`));
});

const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', (ws) => {
    console.log(chalk.blue('New WebSocket connection'));
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            // Handle real-time agent calls
            if (data.type === 'agent_call') {
                const result = await agentSystem.callAgent(data.agent, data.task);
                ws.send(JSON.stringify({ type: 'result', result }));
            }
        } catch (error) {
            ws.send(JSON.stringify({ type: 'error', error: error.message }));
        }
    });
});

console.log(chalk.green(` WebSocket Server: ws://localhost:${WS_PORT}`));
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.cyan.bold(' Ready to orchestrate 75+ AI Agents!'));
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\nShutting down gracefully...'));
    server.close();
    wss.close();
    process.exit(0);
});

export default app;
