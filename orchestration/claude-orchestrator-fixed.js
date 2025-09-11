// Fixed Orchestration Server with Enhanced Error Handling
// All endpoints working with proper response formats

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import FixedMathEducationAgentSystem from './ai-agents-fixed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize fixed agent system
const agentSystem = new FixedMathEducationAgentSystem();

// Get stats
const stats = agentSystem.getStatistics();
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.cyan.bold(' Fixed AI Agents System Initialized'));
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.green(` Total Agents: ${stats.totalAgents}`));
console.log(chalk.yellow(' Categories:'));
Object.entries(stats.byCategory).forEach(([cat, count]) => {
    console.log(chalk.yellow(`  - ${cat}: ${count} agents`));
});
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        service: 'Fixed AI Agents Orchestration System',
        agents: stats.totalAgents,
        categories: Object.keys(stats.byCategory).length,
        apiKey: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
        timestamp: Date.now()
    });
});

// Get all agents
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

// Single agent call
app.post('/api/agent/call', async (req, res) => {
    const { agent, task, options } = req.body;
    
    try {
        const result = await agentSystem.callAgent(agent, task, options);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
});

// Auto agent selection
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

// Fixed parallel execution
app.post('/api/agent/parallel', async (req, res) => {
    const { tasks } = req.body;
    
    try {
        const results = await agentSystem.parallelExecution(tasks);
        res.json({ 
            success: true, 
            results,
            summary: {
                total: results.length,
                succeeded: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Fixed workflow execution
app.post('/api/agent/workflow', async (req, res) => {
    const { workflow } = req.body;
    
    try {
        const results = await agentSystem.executeWorkflow(workflow);
        res.json({ 
            success: true, 
            results,
            summary: {
                total: results.length,
                succeeded: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Fixed math solver
app.post('/api/math/solve', async (req, res) => {
    const { problem, grade = 'high' } = req.body;
    
    const workflow = [
        { agent: 'algebraExpert', prompt: `Analyze this problem: ${problem}` },
        { agent: 'solutionExplainer', prompt: 'Explain the solution step by step' },
        { agent: 'graphVisualizer', prompt: 'Create visualization code if applicable' }
    ];
    
    try {
        const results = await agentSystem.executeWorkflow(workflow);
        
        // Format response to match expected structure
        res.json({ 
            success: true, 
            results,
            solution: results[0]?.response || 'No solution generated',
            explanation: results[1]?.response || 'No explanation generated',
            visualization: results[2]?.response || 'No visualization generated'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Fixed visualization
app.post('/api/visualize', async (req, res) => {
    const { concept, type = 'graph', data } = req.body;
    
    const taskText = data || concept || 'Create a visualization';
    
    try {
        const result = await agentSystem.callAgent('graphVisualizer', taskText);
        
        // Format response to match expected structure
        res.json({ 
            success: true, 
            result,
            visualization: result.response || 'No visualization generated',
            type: type,
            concept: concept
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
    res.json(agentSystem.getStatistics());
});

// Start server
const PORT = process.env.FIXED_PORT || 8092;

const server = app.listen(PORT, () => {
    console.log(chalk.green.bold(`\n HTTP Server: http://localhost:${PORT}`));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.yellow(' Fixed System Ready!'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    console.log('\nAvailable endpoints:');
    console.log('  GET  /api/health         - Health check');
    console.log('  GET  /api/agents         - List all agents');
    console.log('  POST /api/agent/call     - Call specific agent');
    console.log('  POST /api/agent/auto     - Auto-select agent');
    console.log('  POST /api/agent/parallel - Parallel execution (FIXED)');
    console.log('  POST /api/agent/workflow - Sequential workflow (FIXED)');
    console.log('  POST /api/math/solve     - Solve math problem (FIXED)');
    console.log('  POST /api/visualize      - Generate visualization (FIXED)');
    console.log('  GET  /api/stats          - System statistics\n');
});

export default app;