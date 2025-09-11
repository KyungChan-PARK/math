// DemonstrationCollector.js - Collect teacher demonstrations for RLHF
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

class DemonstrationCollector {
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.demonstrationBuffer = [];
    this.bufferSize = 100;
  }

  async collect(interactionLog, features) {
    try {
      // Transform interaction log into demonstration data
      const demonstration = this.createDemonstration(interactionLog, features);
      
      // Generate preference pairs
      const preferencePairs = await this.generatePreferencePairs(demonstration);
      
      // Add to buffer
      this.demonstrationBuffer.push({
        demonstration,
        preferencePairs,
        timestamp: Date.now()
      });
      
      // Process buffer if full
      if (this.demonstrationBuffer.length >= this.bufferSize) {
        await this.processBuffer();
      }
      
      return {
        demonstration,
        pairs_generated: preferencePairs.length
      };
    } catch (error) {
      logger.error('Error collecting demonstration:', error);
      return null;
    }
  }

  createDemonstration(interactionLog, features) {
    return {
      id: uuidv4(),
      state: interactionLog.scene_state_before,
      action: interactionLog.user_action,
      next_state: interactionLog.scene_state_after,
      features: features,
      metadata: {
        session_id: interactionLog.session_id,
        user_id: interactionLog.user_id,
        timestamp: interactionLog.timestamp,
        log_id: interactionLog.log_id
      }
    };
  }

  async generatePreferencePairs(demonstration) {
    const pairs = [];
    
    // Teacher's action is the preferred action
    const preferredAction = demonstration.action;
    
    // Generate alternative actions (negative samples)
    const alternativeActions = this.generateAlternativeActions(
      demonstration.state,
      preferredAction
    );
    
    // Create preference pairs
    for (const altAction of alternativeActions) {
      pairs.push({
        state: demonstration.state,
        preferred: preferredAction,
        rejected: altAction,
        features: demonstration.features,
        metadata: demonstration.metadata
      });
    }
    
    return pairs;
  }

  generateAlternativeActions(state, teacherAction, numAlternatives = 5) {
    const alternatives = [];
    
    // Type 1: Random valid actions
    for (let i = 0; i < 2; i++) {
      alternatives.push(this.generateRandomAction(state));
    }
    
    // Type 2: Perturbations of teacher action
    if (teacherAction) {
      alternatives.push(...this.perturbAction(teacherAction, 2));
    }
    
    // Type 3: Opposite actions
    if (teacherAction && teacherAction.gesture_type) {
      alternatives.push(this.generateOppositeAction(teacherAction));
    }
    
    return alternatives.slice(0, numAlternatives);
  }

  generateRandomAction(state) {
    const actionTypes = ['CREATE', 'MODIFY', 'DELETE', 'GROUP'];
    const randomType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
    
    switch (randomType) {
      case 'CREATE':
        return {
          gesture_type: 'DOUBLE_TAP',
          parameters: {
            x: Math.random() * 800,
            y: Math.random() * 600,
            shape_type: ['cube', 'sphere', 'cylinder'][Math.floor(Math.random() * 3)]
          }
        };
        
      case 'MODIFY':
        return {
          gesture_type: 'DRAG',
          parameters: {
            objectId: this.getRandomObjectId(state),
            deltaX: (Math.random() - 0.5) * 200,
            deltaY: (Math.random() - 0.5) * 200
          }
        };
        
      case 'DELETE':
        return {
          gesture_type: 'LONG_PRESS',
          parameters: {
            objectId: this.getRandomObjectId(state),
            duration: 1000
          }
        };
        
      case 'GROUP':
        return {
          gesture_type: 'MULTI_SELECT',
          parameters: {
            objectIds: this.getMultipleObjectIds(state, 2)
          }
        };
        
      default:
        return {
          gesture_type: 'TAP',
          parameters: {
            x: Math.random() * 800,
            y: Math.random() * 600
          }
        };
    }
  }

  perturbAction(action, numPerturbations = 2) {
    const perturbations = [];
    
    for (let i = 0; i < numPerturbations; i++) {
      const perturbed = JSON.parse(JSON.stringify(action)); // Deep copy
      
      // Perturb parameters
      if (perturbed.parameters) {
        if (perturbed.parameters.x !== undefined) {
          perturbed.parameters.x += (Math.random() - 0.5) * 100;
        }
        if (perturbed.parameters.y !== undefined) {
          perturbed.parameters.y += (Math.random() - 0.5) * 100;
        }
        if (perturbed.parameters.scaleFactor !== undefined) {
          perturbed.parameters.scaleFactor *= (0.5 + Math.random());
        }
        if (perturbed.parameters.rotation !== undefined) {
          perturbed.parameters.rotation += (Math.random() - 0.5) * Math.PI;
        }
      }
      
      perturbations.push(perturbed);
    }
    
    return perturbations;
  }

  generateOppositeAction(action) {
    const oppositeMap = {
      'DRAG': 'TAP',
      'PINCH': 'SPREAD',
      'ROTATE_CLOCKWISE': 'ROTATE_COUNTER_CLOCKWISE',
      'CREATE': 'DELETE',
      'SCALE_UP': 'SCALE_DOWN'
    };
    
    const opposite = { ...action };
    
    if (oppositeMap[action.gesture_type]) {
      opposite.gesture_type = oppositeMap[action.gesture_type];
    } else {
      // Invert some parameters
      if (opposite.parameters) {
        if (opposite.parameters.deltaX) {
          opposite.parameters.deltaX = -opposite.parameters.deltaX;
        }
        if (opposite.parameters.deltaY) {
          opposite.parameters.deltaY = -opposite.parameters.deltaY;
        }
        if (opposite.parameters.scaleFactor) {
          opposite.parameters.scaleFactor = 1 / opposite.parameters.scaleFactor;
        }
      }
    }
    
    return opposite;
  }

  getRandomObjectId(state) {
    if (!state || !state.objects || state.objects.length === 0) {
      return 'object_' + Math.floor(Math.random() * 10);
    }
    
    const randomIndex = Math.floor(Math.random() * state.objects.length);
    return state.objects[randomIndex].id;
  }

  getMultipleObjectIds(state, count) {
    if (!state || !state.objects) {
      return [];
    }
    
    const shuffled = [...state.objects].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(obj => obj.id);
  }

  async processBuffer() {
    try {
      logger.info(`Processing demonstration buffer (${this.demonstrationBuffer.length} items)`);
      
      // Save all demonstrations to database
      for (const item of this.demonstrationBuffer) {
        // Save demonstration
        await this.dbManager.saveRewardData({
          type: 'demonstration',
          data: item.demonstration,
          timestamp: item.timestamp
        });
        
        // Save preference pairs
        for (const pair of item.preferencePairs) {
          await this.dbManager.saveRewardData({
            type: 'preference_pair',
            data: pair,
            timestamp: item.timestamp
          });
        }
      }
      
      // Clear buffer
      this.demonstrationBuffer = [];
      
      logger.info('Demonstration buffer processed successfully');
    } catch (error) {
      logger.error('Error processing demonstration buffer:', error);
    }
  }

  async getStatistics() {
    return {
      buffer_size: this.demonstrationBuffer.length,
      total_demonstrations: this.demonstrationBuffer.reduce(
        (sum, item) => sum + 1,
        0
      ),
      total_preference_pairs: this.demonstrationBuffer.reduce(
        (sum, item) => sum + item.preferencePairs.length,
        0
      )
    };
  }
}

export default DemonstrationCollector;
