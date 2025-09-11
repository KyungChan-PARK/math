// AIAgentController.js - Controls AI agent actions and Claude API integration
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import { agentActionSchemas } from '../schemas/agentActionSchemas.js';

class AIAgentController {
  constructor() {
    this.anthropic = null;
    this.isInitialized = false;
    this.agentState = {
      mode: 'observing', // observing, suggesting, acting
      confidence: 0,
      learning_progress: 0,
      context_window: []
    };
    this.actionHistory = [];
    this.maxContextSize = 10;
  }

  async initialize() {
    try {
      // Initialize Anthropic client
      const apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        logger.warn('No Anthropic API key found, running in simulation mode');
        this.isInitialized = true;
        return;
      }
      
      this.anthropic = new Anthropic({
        apiKey: apiKey
      });
      
      this.isInitialized = true;
      logger.info('AI Agent Controller initialized');
    } catch (error) {
      logger.error('Failed to initialize AI Agent Controller:', error);
      throw error;
    }
  }

  async generateAction(sceneState, context = {}) {
    try {
      // Add to context window
      this.updateContextWindow({ sceneState, context, timestamp: Date.now() });
      
      // Generate action based on current mode
      let action;
      
      switch (this.agentState.mode) {
        case 'observing':
          action = await this.observeAndLearn(sceneState, context);
          break;
        case 'suggesting':
          action = await this.generateSuggestion(sceneState, context);
          break;
        case 'acting':
          action = await this.generateAutonomousAction(sceneState, context);
          break;
        default:
          action = null;
      }
      
      // Record action in history
      if (action) {
        this.actionHistory.push({
          action,
          sceneState,
          timestamp: Date.now()
        });
      }
      
      return action;
    } catch (error) {
      logger.error('Error generating AI action:', error);
      throw error;
    }
  }

  async observeAndLearn(sceneState, context) {
    // In observing mode, the agent doesn't generate actions
    // It just processes and learns from teacher demonstrations
    
    // Update learning progress
    this.agentState.learning_progress += 0.01;
    
    // Switch to suggesting mode after sufficient learning
    if (this.agentState.learning_progress > 0.3) {
      this.agentState.mode = 'suggesting';
      logger.info('AI Agent switched to suggesting mode');
    }
    
    return {
      type: 'OBSERVE',
      message: 'Learning from demonstration',
      learning_progress: this.agentState.learning_progress
    };
  }

  async generateSuggestion(sceneState, context) {
    try {
      // Generate suggestions based on learned patterns
      const prompt = this.buildSuggestionPrompt(sceneState, context);
      
      let suggestion;
      
      if (this.anthropic) {
        // Use Claude API
        const response = await this.anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });
        
        suggestion = this.parseClaudeResponse(response.content[0].text);
      } else {
        // Simulation mode
        suggestion = this.generateSimulatedSuggestion(sceneState);
      }
      
      // Increase confidence over time
      this.agentState.confidence += 0.005;
      
      // Switch to acting mode when confident enough
      if (this.agentState.confidence > 0.5) {
        this.agentState.mode = 'acting';
        logger.info('AI Agent switched to acting mode');
      }
      
      return {
        type: 'SUGGESTION',
        action: suggestion,
        confidence: this.agentState.confidence
      };
    } catch (error) {
      logger.error('Error generating suggestion:', error);
      return null;
    }
  }

  async generateAutonomousAction(sceneState, context) {
    try {
      // Generate autonomous actions
      const prompt = this.buildActionPrompt(sceneState, context);
      
      let action;
      
      if (this.anthropic) {
        // Use Claude API
        const response = await this.anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });
        
        action = this.parseClaudeResponse(response.content[0].text);
      } else {
        // Simulation mode
        action = this.generateSimulatedAction(sceneState);
      }
      
      return {
        type: 'ACTION',
        action: action,
        confidence: this.agentState.confidence,
        autonomous: true
      };
    } catch (error) {
      logger.error('Error generating autonomous action:', error);
      return null;
    }
  }

  buildSuggestionPrompt(sceneState, context) {
    return `You are an AI teaching assistant helping a teacher demonstrate mathematical concepts using 3D shapes.

Current Scene State:
${JSON.stringify(sceneState, null, 2)}

Context:
${JSON.stringify(context, null, 2)}

Recent Actions:
${JSON.stringify(this.getRecentActions(), null, 2)}

Based on the current scene and recent teacher actions, suggest a helpful next action that would enhance the mathematical demonstration. 
The suggestion should follow this JSON schema:

${JSON.stringify(agentActionSchemas.create_object, null, 2)}

Respond with only valid JSON that matches one of the action schemas.`;
  }

  buildActionPrompt(sceneState, context) {
    return `You are an autonomous AI teaching assistant demonstrating mathematical concepts using 3D shapes.

Current Scene State:
${JSON.stringify(sceneState, null, 2)}

Context:
${JSON.stringify(context, null, 2)}

Learning History:
${JSON.stringify(this.actionHistory.slice(-5), null, 2)}

Generate the next action to continue the mathematical demonstration.
The action must follow one of these JSON schemas:

${JSON.stringify(agentActionSchemas, null, 2)}

Respond with only valid JSON that matches one of the action schemas.`;
  }

  parseClaudeResponse(response) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, return null
      logger.warn('No valid JSON found in Claude response');
      return null;
    } catch (error) {
      logger.error('Error parsing Claude response:', error);
      return null;
    }
  }

  generateSimulatedSuggestion(sceneState) {
    // Simple rule-based suggestions for simulation
    const suggestions = [
      {
        command: 'create_object',
        shape_type: 'cube',
        position: { x: 2, y: 1, z: 0 },
        color: '#667eea'
      },
      {
        command: 'modify_transform',
        object_id: this.getRandomObjectId(sceneState),
        scale: { x: 1.5, y: 1.5, z: 1.5 }
      },
      {
        command: 'change_property',
        object_id: this.getRandomObjectId(sceneState),
        property_name: 'color',
        property_value: '#764ba2'
      }
    ];
    
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  generateSimulatedAction(sceneState) {
    // Generate more complex actions in autonomous mode
    const objectCount = sceneState.objects ? sceneState.objects.length : 0;
    
    if (objectCount < 3) {
      // Create new objects if scene is sparse
      return {
        command: 'create_object',
        shape_type: ['sphere', 'cylinder', 'cone'][Math.floor(Math.random() * 3)],
        position: {
          x: (Math.random() - 0.5) * 6,
          y: 1,
          z: (Math.random() - 0.5) * 6
        },
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
      };
    } else if (Math.random() > 0.5) {
      // Group objects
      const objectIds = this.getMultipleObjectIds(sceneState, 2);
      return {
        command: 'group_objects',
        object_ids: objectIds,
        new_group_id: 'group_' + Date.now()
      };
    } else {
      // Transform existing object
      return {
        command: 'modify_transform',
        object_id: this.getRandomObjectId(sceneState),
        rotation: {
          x: Math.random() * Math.PI,
          y: Math.random() * Math.PI,
          z: 0
        }
      };
    }
  }

  getRandomObjectId(sceneState) {
    if (!sceneState.objects || sceneState.objects.length === 0) {
      return 'object_1';
    }
    
    const randomIndex = Math.floor(Math.random() * sceneState.objects.length);
    return sceneState.objects[randomIndex].id;
  }

  getMultipleObjectIds(sceneState, count) {
    if (!sceneState.objects) return [];
    
    const ids = sceneState.objects.slice(0, count).map(obj => obj.id);
    return ids;
  }

  updateContextWindow(entry) {
    this.agentState.context_window.push(entry);
    
    // Keep context window size limited
    if (this.agentState.context_window.length > this.maxContextSize) {
      this.agentState.context_window.shift();
    }
  }

  getRecentActions() {
    return this.actionHistory.slice(-5).map(entry => entry.action);
  }

  async processTeacherFeedback(feedback) {
    // Process explicit teacher feedback
    logger.info('Processing teacher feedback:', feedback);
    
    if (feedback.type === 'positive') {
      this.agentState.confidence += 0.02;
    } else if (feedback.type === 'negative') {
      this.agentState.confidence = Math.max(0, this.agentState.confidence - 0.05);
      
      // Switch back to suggesting mode if confidence drops
      if (this.agentState.confidence < 0.3 && this.agentState.mode === 'acting') {
        this.agentState.mode = 'suggesting';
        logger.info('AI Agent switched back to suggesting mode due to negative feedback');
      }
    }
  }

  getAgentState() {
    return {
      ...this.agentState,
      action_history_size: this.actionHistory.length
    };
  }

  resetAgent() {
    this.agentState = {
      mode: 'observing',
      confidence: 0,
      learning_progress: 0,
      context_window: []
    };
    this.actionHistory = [];
    logger.info('AI Agent state reset');
  }

  isReady() {
    return this.isInitialized;
  }
}

export default AIAgentController;
