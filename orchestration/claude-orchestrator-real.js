// Claude Sub-Agent Orchestration System for Math Education
// Real API Integration with Usage Monitoring

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import chalk from 'chalk';
import memorySystem from './memory-double-check.js';
import usageMonitor from './claude-api-monitor.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// Claude API Configuration with REAL API
class ClaudeOrchestrator {
    constructor() {
        this.agents = {
            // Math concept expert
            mathConcept: {
                role: "Math concept specialist",
                model: "claude-3-5-sonnet-20241022",
                systemPrompt: "You are a math concept specialist. Parse mathematical commands, explain concepts clearly, and generate visual representations. Focus on educational clarity for Korean math teachers."
            },
            
            // Gesture analysis expert
            gestureAnalyzer: {
                role: "Gesture pattern analyzer",
                model: "claude-3-5-haiku-20241022", // Cheaper for simple analysis
                systemPrompt: "You are a gesture pattern analyzer. Analyze MediaPipe 21-keypoint data and classify gestures into: PINCH, SPREAD, GRAB, POINT, DRAW. Return JSON with gesture type and confidence score."
            },
            
            // ExtendScript generator
            scriptGenerator: {
                role: "ExtendScript generation expert",
                model: "claude-3-5-sonnet-20241022",
                systemPrompt: "You are an After Effects ExtendScript expert. Convert math commands to ExtendScript code. Generate clean, executable .jsx code without markdown formatting. Include shape creation, animation, and text layers."
            },
            
            // Documentation automation
            documentManager: {
                role: "Documentation automation expert",
                model: "claude-3-5-haiku-20241022", // Cheaper for documentation
                systemPrompt: "You are a documentation automation expert. Analyze code changes and update documentation. Keep docs concise, accurate, and synchronized with code."
            },
            
            // Performance optimization
            performanceOptimizer: {
                role: "Performance optimization specialist",
                model: "claude-3-5-sonnet-20241022",
                systemPrompt: "You are a performance optimization specialist. Analyze system bottlenecks, suggest optimizations, and provide benchmarks. Focus on WebSocket, MediaPipe, and Node.js performance."
            }
        };
        
        this.taskQueue = [];
        this.results = new Map();
        this.apiEnabled = true;
        
        // Check API key
        if (!process.env.ANTHROPIC_API_KEY) {
            console.error(chalk.red('️ ANTHROPIC_API_KEY not found in .env file!'));
            this.apiEnabled = false;
        } else {
            console.log(chalk.green('✅ Claude API initialized with real API key'));
            usageMonitor.displayStatus();
        }
    }
    
    async callAgent(agentName, task, context = {}) {
        const agent = this.agents[agentName];
        if (!agent) throw new Error(`Agent ${agentName} not found`);
        
        // Check if API limit reached
        if (process.env.API_LIMIT_REACHED === 'true') {
            console.log(chalk.red('❌ API limit reached - using simulation mode'));
            return this.simulateResponse(agentName, task);
        }
        
        // Check if API is enabled
        if (!this.apiEnabled) {
            return this.simulateResponse(agentName, task);
        }
        
        try {
            console.log(chalk.cyan(` [${agentName}] Processing: ${task.substring(0, 50)}...`));
            
            // Record work
            await memorySystem.recordWork('API_CALL', `${agentName}: ${task}`, { context });
            
            // Build messages
            const messages = [
                {
                    role: 'user',
                    content: typeof task === 'object' ? JSON.stringify(task) : task
                }
            ];
            
            // Call real Claude API
            const startTime = Date.now();
            const response = await anthropic.messages.create({
                model: agent.model,
                max_tokens: 1000,
                system: agent.systemPrompt,
                messages: messages
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Track usage
            const inputTokens = response.usage.input_tokens;
            const outputTokens = response.usage.output_tokens;
            await usageMonitor.trackAPICall(
                agent.model,
                inputTokens,
                outputTokens,
                agentName
            );
            
            // Record successful API call
            await memorySystem.recordWork('API_SUCCESS', `${agentName} completed in ${duration}ms`, {
                tokens: { input: inputTokens, output: outputTokens }
            });
            
            // Return structured response
            return {
                agent: agentName,
                role: agent.role,
                response: {
                    status: 'success',
                    result: response.content[0].text,
                    usage: {
                        inputTokens,
                        outputTokens,
                        duration
                    }
                },
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error(chalk.red(`❌ [${agentName}] API Error:`, error.message));
            
            // Record error
            await memorySystem.recordWork('API_ERROR', `${agentName} failed: ${error.message}`);
            
            // Fallback to simulation
            return this.simulateResponse(agentName, task);
        }
    }
    
    // Simulation mode for testing or when API is unavailable
    simulateResponse(agentName, task) {
        console.log(chalk.yellow(`️ [${agentName}] Simulation mode`));
        
        const simulatedResponses = {
            mathConcept: {
                triangle: "Creating equilateral triangle with side length 200px at center (400, 300)",
                circle: "Drawing circle with radius 150px at center (400, 300)",
                square: "Creating square with side 200px at center (400, 300)"
            },
            gestureAnalyzer: {
                default: JSON.stringify({ gesture: "PINCH", confidence: 0.95 })
            },
            scriptGenerator: {
                default: `// ExtendScript for After Effects
var comp = app.project.activeItem;
var shape = comp.layers.addShape();
shape.name = "Math Shape";`
            },
            documentManager: {
                default: "Documentation updated successfully"
            },
            performanceOptimizer: {
                default: "Performance analysis: WebSocket at 14,286 msg/sec (optimal)"
            }
        };
        
        const agentResponses = simulatedResponses[agentName] || {};
        const result = agentResponses[Object.keys(agentResponses)[0]] || `Simulated response from ${agentName}`;
        
        return {
            agent: agentName,
            role: this.agents[agentName].role,
            response: {
                status: 'simulated',
                result: result,
                usage: { inputTokens: 0, outputTokens: 0, duration: 0 }
            },
            timestamp: Date.now()
        };
    }
    
    async parallelExecution(tasks) {
        console.log(chalk.blue(` Parallel execution of ${tasks.length} tasks`));
        
        const promises = tasks.map(task => 
            this.callAgent(task.agent, task.task, task.context)
        );
        
        const results = await Promise.all(promises);
        return this.synthesizeResults(results);
    }
    
    async sequentialExecution(workflow) {
        console.log(chalk.blue(` Sequential execution of ${workflow.length} steps`));
        
        const results = [];
        let previousResult = null;
        
        for (const step of workflow) {
            const context = {
                ...step.context,
                previousResult: previousResult
            };
            
            const result = await this.callAgent(
                step.agent, 
                step.task, 
                context
            );
            
            results.push(result);
            previousResult = result.response;
        }
        
        return results;
    }
    
    synthesizeResults(results) {
        const synthesis = {
            timestamp: Date.now(),
            agents_used: results.map(r => r.agent),
            combined_response: {},
            totalTokens: {
                input: 0,
                output: 0
            },
            confidence: 1.0
        };
        
        results.forEach(result => {
            if (result.response && result.response.status === 'success') {
                synthesis.combined_response[result.agent] = result.response.result;
                
                // Sum tokens
                if (result.response.usage) {
                    synthesis.totalTokens.input += result.response.usage.inputTokens || 0;
                    synthesis.totalTokens.output += result.response.usage.outputTokens || 0;
                }
            } else if (result.response.status === 'simulated') {
                synthesis.confidence *= 0.5; // Lower confidence for simulated responses
            }
        });
        
        return synthesis;
    }
}

// Initialize orchestrator
const orchestrator = new ClaudeOrchestrator();

// API Endpoints
app.get('/health', (req, res) => {
    const status = usageMonitor.getRealTimeStatus();
    res.json({
        status: 'running',
        service: 'Claude Orchestrator',
        agents: Object.keys(orchestrator.agents).length,
        apiEnabled: orchestrator.apiEnabled,
        usage: status,
        timestamp: Date.now()
    });
});

app.post('/gesture/enhance', async (req, res) => {
    const result = await orchestrator.callAgent('gestureAnalyzer', 'enhance gesture', req.body);
    res.json(result);
});

app.post('/nlp/process', async (req, res) => {
    const { text } = req.body;
    const result = await orchestrator.sequentialExecution([
        { agent: 'mathConcept', task: `Parse: ${text}`, context: req.body },
        { agent: 'scriptGenerator', task: 'Generate ExtendScript', context: req.body }
    ]);
    res.json(result);
});

app.post('/system/optimize', async (req, res) => {
    const result = await orchestrator.callAgent('performanceOptimizer', 'analyze system', {});
    res.json(result);
});

app.get('/agents/list', (req, res) => {
    const agentList = Object.entries(orchestrator.agents).map(([name, config]) => ({
        name,
        role: config.role,
        model: config.model
    }));
    res.json(agentList);
});

// Usage status endpoint
app.get('/usage/status', (req, res) => {
    const status = usageMonitor.getRealTimeStatus();
    const summary = usageMonitor.getUsageSummary();
    res.json({
        current: status,
        summary: summary
    });
});

// WebSocket setup
const server = app.listen(8089, () => {
    console.log(chalk.green.bold('\n Claude Orchestrator running on http://localhost:8089'));
    console.log(chalk.green(' WebSocket on ws://localhost:8090\n'));
});

const wss = new WebSocketServer({ port: 8090 });

wss.on('connection', (ws) => {
    console.log(chalk.blue(' New WebSocket connection'));
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            let result;
            
            switch (data.type) {
                case 'gesture':
                    result = await orchestrator.callAgent('gestureAnalyzer', data.payload);
                    break;
                case 'math':
                    result = await orchestrator.callAgent('mathConcept', data.payload);
                    break;
                case 'optimize':
                    result = await orchestrator.callAgent('performanceOptimizer', 'analyze');
                    break;
                default:
                    result = { error: 'Unknown message type' };
            }
            
            ws.send(JSON.stringify(result));
        } catch (error) {
            ws.send(JSON.stringify({ error: error.message }));
        }
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n Shutting down gracefully...'));
    
    // Save memory and usage
    await memorySystem.saveToMemory();
    await usageMonitor.saveUsage();
    
    process.exit(0);
});

console.log(chalk.cyan('Ready to orchestrate Claude agents with real API!\n'));
