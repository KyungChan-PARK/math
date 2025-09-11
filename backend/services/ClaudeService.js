// ClaudeService.js - Claude AI orchestration for Math Education System
// Manages AI agent coordination and task distribution

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ClaudeService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.agents = new Map();
    this.workflows = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load agent configurations
      await this.loadAgentConfigs();
      
      // Load workflow definitions
      await this.loadWorkflows();
      
      this.initialized = true;
      console.log('✅ ClaudeService initialized with', this.agents.size, 'agents');
    } catch (error) {
      console.error('❌ Failed to initialize ClaudeService:', error);
      throw error;
    }
  }

  async loadAgentConfigs() {
    const agentConfigs = [
      {
        id: 'math-tutor',
        name: 'Math Tutor Agent',
        role: 'Provides personalized math instruction',
        systemPrompt: `You are an expert math tutor in an AI-powered education system.
        Your role is to:
        1. Explain mathematical concepts clearly
        2. Provide step-by-step solutions
        3. Adapt to student's learning pace
        4. Generate practice problems
        5. Give encouraging feedback`,
        model: 'claude-3-opus-20240229'
      },
      {
        id: 'gesture-interpreter',
        name: 'Gesture Interpretation Agent',
        role: 'Interprets hand gestures as mathematical operations',
        systemPrompt: `You interpret hand gestures to mathematical operations.
        Gesture mappings:
        - Circle motion: multiplication
        - Horizontal line: addition
        - Vertical line: subtraction
        - Square motion: division
        - Triangle: exponentiation
        Provide clear interpretation with confidence scores.`,
        model: 'claude-3-sonnet-20240229'
      },
      {
        id: 'problem-generator',
        name: 'Problem Generation Agent',
        role: 'Creates adaptive math problems',
        systemPrompt: `You generate math problems based on:
        1. Student's current level
        2. Learning objectives
        3. Previous performance
        4. Concept prerequisites
        Ensure problems are engaging and appropriately challenging.`,
        model: 'claude-3-sonnet-20240229'
      },
      {
        id: 'progress-analyzer',
        name: 'Progress Analysis Agent',
        role: 'Analyzes student learning progress',
        systemPrompt: `You analyze student progress by:
        1. Tracking concept mastery
        2. Identifying knowledge gaps
        3. Recommending next topics
        4. Generating progress reports
        5. Suggesting interventions when needed`,
        model: 'claude-3-opus-20240229'
      }
    ];
    
    for (const config of agentConfigs) {
      this.agents.set(config.id, config);
    }
  }

  async loadWorkflows() {
    const workflows = [
      {
        id: 'solve-problem',
        name: 'Problem Solving Workflow',
        steps: [
          { agent: 'gesture-interpreter', action: 'interpret' },
          { agent: 'math-tutor', action: 'solve' },
          { agent: 'progress-analyzer', action: 'update' }
        ]
      },
      {
        id: 'generate-lesson',
        name: 'Lesson Generation Workflow',
        steps: [
          { agent: 'progress-analyzer', action: 'assess' },
          { agent: 'problem-generator', action: 'create' },
          { agent: 'math-tutor', action: 'explain' }
        ]
      },
      {
        id: 'provide-feedback',
        name: 'Feedback Generation Workflow',
        steps: [
          { agent: 'progress-analyzer', action: 'evaluate' },
          { agent: 'math-tutor', action: 'feedback' }
        ]
      }
    ];
    
    for (const workflow of workflows) {
      this.workflows.set(workflow.id, workflow);
    }
  }

  // Execute a single agent task
  async executeAgent(agentId, task, context = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    try {
      const message = await this.anthropic.messages.create({
        model: agent.model,
        max_tokens: 1024,
        system: agent.systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Task: ${task}\nContext: ${JSON.stringify(context)}`
          }
        ]
      });
      
      return {
        agent: agentId,
        task,
        response: message.content[0].text,
        usage: message.usage
      };
    } catch (error) {
      console.error(`Error executing agent ${agentId}:`, error);
      throw error;
    }
  }

  // Execute a complete workflow
  async executeWorkflow(workflowId, initialContext = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    
    let context = { ...initialContext };
    const results = [];
    
    for (const step of workflow.steps) {
      const result = await this.executeAgent(
        step.agent,
        step.action,
        context
      );
      
      results.push(result);
      
      // Update context with result for next step
      context[step.agent] = result.response;
    }
    
    return {
      workflow: workflowId,
      results,
      finalContext: context
    };
  }

  // Orchestrate multiple agents for complex tasks
  async orchestrate(task, options = {}) {
    const { agents = [], parallel = false, timeout = 30000 } = options;
    
    if (agents.length === 0) {
      // Auto-select agents based on task
      agents.push(...this.selectAgentsForTask(task));
    }
    
    if (parallel) {
      // Execute agents in parallel
      const promises = agents.map(agentId => 
        this.executeAgent(agentId, task, options.context)
      );
      
      return Promise.race([
        Promise.all(promises),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Orchestration timeout')), timeout)
        )
      ]);
    } else {
      // Execute agents sequentially
      const results = [];
      let context = options.context || {};
      
      for (const agentId of agents) {
        const result = await this.executeAgent(agentId, task, context);
        results.push(result);
        context[agentId] = result.response;
      }
      
      return results;
    }
  }

  // Select appropriate agents based on task type
  selectAgentsForTask(task) {
    const taskLower = task.toLowerCase();
    const selectedAgents = [];
    
    if (taskLower.includes('gesture') || taskLower.includes('hand')) {
      selectedAgents.push('gesture-interpreter');
    }
    
    if (taskLower.includes('solve') || taskLower.includes('explain')) {
      selectedAgents.push('math-tutor');
    }
    
    if (taskLower.includes('problem') || taskLower.includes('generate')) {
      selectedAgents.push('problem-generator');
    }
    
    if (taskLower.includes('progress') || taskLower.includes('analyze')) {
      selectedAgents.push('progress-analyzer');
    }
    
    // Default to math tutor if no specific agent selected
    if (selectedAgents.length === 0) {
      selectedAgents.push('math-tutor');
    }
    
    return selectedAgents;
  }

  // Stream responses for real-time interaction
  async streamResponse(agentId, task, onChunk) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    const stream = await this.anthropic.messages.create({
      model: agent.model,
      max_tokens: 1024,
      system: agent.systemPrompt,
      messages: [
        {
          role: 'user',
          content: task
        }
      ],
      stream: true
    });
    
    let fullResponse = '';
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        const text = chunk.delta.text;
        fullResponse += text;
        onChunk(text);
      }
    }
    
    return fullResponse;
  }

  // Get agent status and metrics
  getAgentStatus(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;
    
    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      model: agent.model,
      available: true // Could check API status here
    };
  }

  // Get all available agents
  getAllAgents() {
    return Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      role: agent.role
    }));
  }

  // Get all workflows
  getAllWorkflows() {
    return Array.from(this.workflows.values());
  }
}

export default ClaudeService;