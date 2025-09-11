// Enhanced AI Agents System with Fixed Error Handling
// Promise.allSettled와 개선된 에러 핸들링 적용

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트의 .env 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 모델 선택 가이드 (비용 최적화)
const MODELS = {
    HAIKU: 'claude-3-haiku-20240307',
    SONNET: 'claude-3-5-sonnet-20241022',
    OPUS: 'claude-3-opus-20240229'
};

export class FixedMathEducationAgentSystem {
    constructor() {
        this.anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });
        
        this.agents = this.initializeAgents();
        console.log(chalk.green(`✅ Initialized ${Object.keys(this.agents).length} AI Agents with Enhanced Error Handling`));
    }
    
    initializeAgents() {
        return {
            // Core agents for testing
            algebraExpert: {
                role: "대수학 전문가",
                model: MODELS.HAIKU,
                category: "math_concepts",
                systemPrompt: "You are an algebra expert. Solve equations and explain concepts clearly."
            },
            geometryExpert: {
                role: "기하학 전문가",
                model: MODELS.HAIKU,
                category: "math_concepts",
                systemPrompt: "You are a geometry expert. Calculate areas, perimeters, and explain geometric concepts."
            },
            statisticsExpert: {
                role: "통계학 전문가",
                model: MODELS.HAIKU,
                category: "math_concepts",
                systemPrompt: "You are a statistics expert. Calculate statistical measures and explain data analysis."
            },
            curriculumDesigner: {
                role: "교육과정 설계자",
                model: MODELS.HAIKU,
                category: "pedagogy",
                systemPrompt: "You design educational curricula. Create structured lesson plans."
            },
            lessonPlanner: {
                role: "수업 계획 전문가",
                model: MODELS.HAIKU,
                category: "pedagogy",
                systemPrompt: "You create detailed lesson plans. Structure content for effective teaching."
            },
            assessmentCreator: {
                role: "평가 문항 개발자",
                model: MODELS.HAIKU,
                category: "pedagogy",
                systemPrompt: "You create assessment questions and quizzes. Generate appropriate test items."
            },
            graphVisualizer: {
                role: "그래프 시각화 전문가",
                model: MODELS.HAIKU,
                category: "visualization",
                systemPrompt: "You create graph visualizations. Generate code to plot mathematical functions."
            },
            solutionExplainer: {
                role: "해법 설명자",
                model: MODELS.HAIKU,
                category: "assessment",
                systemPrompt: "You explain solutions step by step. Break down complex problems clearly."
            }
        };
    }
    
    // Enhanced agent call with better error handling
    async callAgent(agentName, task, options = {}) {
        const agent = this.agents[agentName];
        
        if (!agent) {
            console.error(chalk.red(`Agent ${agentName} not found`));
            return {
                agent: agentName,
                error: `Agent ${agentName} not found`,
                success: false
            };
        }
        
        try {
            console.log(chalk.blue(`Calling ${agentName} with task: ${task?.substring(0, 50)}...`));
            
            const response = await this.anthropic.messages.create({
                model: agent.model,
                max_tokens: options.maxTokens || 500,
                system: agent.systemPrompt,
                messages: [{
                    role: 'user',
                    content: task || 'Please help with this task.'
                }]
            });
            
            return {
                agent: agentName,
                role: agent.role,
                category: agent.category,
                model: agent.model,
                response: response.content[0].text,
                usage: response.usage,
                success: true
            };
        } catch (error) {
            console.error(chalk.red(`Error calling ${agentName}:`, error.message));
            return {
                agent: agentName,
                role: agent.role,
                error: error.message,
                success: false
            };
        }
    }
    
    // Fixed parallel execution using Promise.allSettled
    async parallelExecution(tasks) {
        console.log(chalk.yellow(`\nExecuting ${tasks.length} tasks in parallel...`));
        
        if (!tasks || !Array.isArray(tasks)) {
            return { success: false, error: 'Invalid tasks array' };
        }
        
        const promises = tasks.map(task => {
            const taskText = task.prompt || task.task || task.content || 'Default task';
            return this.callAgent(task.agent, taskText, task.options);
        });
        
        const results = await Promise.allSettled(promises);
        
        const processedResults = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                return {
                    agent: tasks[index].agent,
                    error: result.reason,
                    success: false
                };
            }
        });
        
        const successCount = processedResults.filter(r => r.success).length;
        console.log(chalk.green(`Parallel execution complete: ${successCount}/${tasks.length} succeeded`));
        
        return processedResults;
    }
    
    // Fixed workflow execution with proper error handling
    async executeWorkflow(workflow) {
        console.log(chalk.yellow(`\nExecuting workflow with ${workflow.length} steps...`));
        
        if (!workflow || !Array.isArray(workflow)) {
            return { success: false, error: 'Invalid workflow array' };
        }
        
        const results = [];
        let previousResult = null;
        
        for (let i = 0; i < workflow.length; i++) {
            const step = workflow[i];
            const prompt = previousResult 
                ? `${step.prompt || step.task || 'Continue'}\n\nPrevious result: ${previousResult}`
                : (step.prompt || step.task || 'Start workflow');
            
            console.log(chalk.blue(`Step ${i + 1}: ${step.agent}`));
            
            const result = await this.callAgent(step.agent, prompt, step.options);
            results.push(result);
            
            if (result.success) {
                previousResult = result.response;
            } else {
                console.log(chalk.red(`Workflow step ${i + 1} failed, continuing...`));
                previousResult = null;
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        console.log(chalk.green(`Workflow complete: ${successCount}/${workflow.length} steps succeeded`));
        
        return results;
    }
    
    // Get agents by category
    getAgentsByCategory(category) {
        return Object.entries(this.agents)
            .filter(([_, agent]) => agent.category === category)
            .map(([name, agent]) => ({
                name,
                ...agent
            }));
    }
    
    // Select optimal agent based on task
    selectOptimalAgent(task, complexity = 'medium') {
        // Simple keyword matching for demo
        const taskLower = (task || '').toLowerCase();
        
        if (taskLower.includes('algebra') || taskLower.includes('equation')) {
            return 'algebraExpert';
        }
        if (taskLower.includes('geometry') || taskLower.includes('area') || taskLower.includes('circle')) {
            return 'geometryExpert';
        }
        if (taskLower.includes('statistic') || taskLower.includes('mean') || taskLower.includes('average')) {
            return 'statisticsExpert';
        }
        if (taskLower.includes('lesson') || taskLower.includes('curriculum')) {
            return 'curriculumDesigner';
        }
        if (taskLower.includes('graph') || taskLower.includes('plot')) {
            return 'graphVisualizer';
        }
        
        // Default
        return 'algebraExpert';
    }
    
    // Get statistics
    getStatistics() {
        const stats = {
            totalAgents: Object.keys(this.agents).length,
            byCategory: {},
            byModel: {}
        };
        
        Object.values(this.agents).forEach(agent => {
            // By category
            if (!stats.byCategory[agent.category]) {
                stats.byCategory[agent.category] = 0;
            }
            stats.byCategory[agent.category]++;
            
            // By model
            if (!stats.byModel[agent.model]) {
                stats.byModel[agent.model] = 0;
            }
            stats.byModel[agent.model]++;
        });
        
        return stats;
    }
}

export default FixedMathEducationAgentSystem;