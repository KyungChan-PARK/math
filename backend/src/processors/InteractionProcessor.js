// InteractionProcessor.js - Process and analyze user interactions
import { logger } from '../utils/logger.js';
import MultiModalProcessor from './MultiModalProcessor.js';
import DemonstrationCollector from '../rlhf/DemonstrationCollector.js';

class InteractionProcessor {
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.multiModalProcessor = new MultiModalProcessor();
    this.demonstrationCollector = new DemonstrationCollector(dbManager);
    this.processingQueue = [];
    this.isProcessing = false;
  }

  async processLogs(logs) {
    try {
      const processedLogs = [];
      
      for (const log of logs) {
        // Validate log structure
        if (!this.validateLog(log)) {
          logger.warn('Invalid log structure:', log);
          continue;
        }
        
        // Process each log
        const processedLog = await this.processInteractionLog(log);
        processedLogs.push(processedLog);
      }
      
      // Process queue in background
      this.processQueue();
      
      return processedLogs;
    } catch (error) {
      logger.error('Error processing logs:', error);
      throw error;
    }
  }

  validateLog(log) {
    // Validate required fields
    const requiredFields = [
      'log_id',
      'session_id',
      'timestamp',
      'user_id',
      'event_type',
      'scene_state_before',
      'scene_state_after'
    ];
    
    for (const field of requiredFields) {
      if (!log[field]) {
        logger.warn(`Missing required field: ${field}`);
        return false;
      }
    }
    
    return true;
  }

  async processInteractionLog(log) {
    try {
      // Save raw log to database
      await this.dbManager.saveInteractionLog(log);
      
      // Extract features for learning
      const features = await this.extractFeatures(log);
      
      // Add to processing queue for RLHF
      if (log.event_type === 'USER_GESTURE' && log.user_action) {
        this.processingQueue.push({
          log,
          features,
          timestamp: Date.now()
        });
      }
      
      return {
        log_id: log.log_id,
        processed: true,
        features_extracted: !!features,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error processing interaction log:', error);
      throw error;
    }
  }

  async extractFeatures(log) {
    try {
      const features = {
        temporal: this.extractTemporalFeatures(log),
        spatial: await this.extractSpatialFeatures(log),
        semantic: this.extractSemanticFeatures(log),
        contextual: await this.extractContextualFeatures(log)
      };
      
      return features;
    } catch (error) {
      logger.error('Error extracting features:', error);
      return null;
    }
  }

  extractTemporalFeatures(log) {
    // Extract time-based features
    const timestamp = new Date(log.timestamp);
    
    return {
      hour_of_day: timestamp.getHours(),
      day_of_week: timestamp.getDay(),
      time_since_session_start: log.time_since_start || 0,
      interaction_duration: log.duration || 0,
      timestamp: log.timestamp
    };
  }

  async extractSpatialFeatures(log) {
    // Extract spatial features from scene states
    const stateBefore = log.scene_state_before;
    const stateAfter = log.scene_state_after;
    
    if (!stateBefore || !stateAfter) {
      return null;
    }
    
    // Process through multimodal processor
    const features = await this.multiModalProcessor.processSceneTransition(
      stateBefore,
      stateAfter
    );
    
    return features;
  }

  extractSemanticFeatures(log) {
    // Extract semantic features from user action
    if (!log.user_action) {
      return null;
    }
    
    const action = log.user_action;
    
    return {
      gesture_type: action.gesture_type,
      has_parameters: !!action.parameters,
      parameter_count: action.parameters ? Object.keys(action.parameters).length : 0,
      action_complexity: this.calculateActionComplexity(action)
    };
  }

  async extractContextualFeatures(log) {
    // Extract contextual features based on user history
    try {
      const userPreferences = await this.dbManager.getUserPreferences(log.user_id);
      
      return {
        user_experience_level: this.calculateExperienceLevel(userPreferences),
        preferred_gestures: userPreferences ? userPreferences.slice(0, 3) : [],
        session_context: log.session_context || {}
      };
    } catch (error) {
      logger.error('Error extracting contextual features:', error);
      return null;
    }
  }

  calculateActionComplexity(action) {
    // Simple complexity scoring
    let complexity = 1;
    
    if (action.gesture_type === 'PINCH' || action.gesture_type === 'ROTATE') {
      complexity += 2;
    }
    
    if (action.parameters) {
      complexity += Object.keys(action.parameters).length * 0.5;
    }
    
    return Math.min(complexity, 10);
  }

  calculateExperienceLevel(preferences) {
    if (!preferences || preferences.length === 0) {
      return 'beginner';
    }
    
    const totalInteractions = preferences.reduce((sum, p) => sum + p.frequency, 0);
    
    if (totalInteractions < 50) return 'beginner';
    if (totalInteractions < 200) return 'intermediate';
    return 'advanced';
  }

  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Process in batches
      const batchSize = 10;
      const batch = this.processingQueue.splice(0, batchSize);
      
      for (const item of batch) {
        // Collect demonstration data
        const demonstrationData = await this.demonstrationCollector.collect(
          item.log,
          item.features
        );
        
        // Save for training
        if (demonstrationData) {
          await this.dbManager.saveRewardData(demonstrationData);
        }
      }
      
      logger.info(`Processed ${batch.length} items for RLHF training`);
    } catch (error) {
      logger.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
      
      // Continue processing if more items in queue
      if (this.processingQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  async getStatistics(sessionId) {
    try {
      // Get session statistics
      const stats = {
        total_interactions: 0,
        gesture_distribution: {},
        average_complexity: 0,
        session_duration: 0
      };
      
      // Fetch logs for session
      const logs = await this.dbManager.getTrainingData(sessionId, 1000);
      
      stats.total_interactions = logs.length;
      
      // Calculate gesture distribution
      logs.forEach(log => {
        if (log.action && log.action.gesture_type) {
          const gesture = log.action.gesture_type;
          stats.gesture_distribution[gesture] = (stats.gesture_distribution[gesture] || 0) + 1;
        }
      });
      
      // Calculate average complexity
      const complexities = logs.map(log => 
        log.action ? this.calculateActionComplexity(log.action) : 0
      );
      stats.average_complexity = complexities.reduce((a, b) => a + b, 0) / complexities.length;
      
      // Calculate session duration
      if (logs.length > 0) {
        const firstLog = logs[logs.length - 1];
        const lastLog = logs[0];
        stats.session_duration = lastLog.timestamp - firstLog.timestamp;
      }
      
      return stats;
    } catch (error) {
      logger.error('Error getting statistics:', error);
      throw error;
    }
  }
}

export default InteractionProcessor;
