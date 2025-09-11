// WebSocketHandler.js - Handle WebSocket connections for real-time interaction
import { logger } from '../utils/logger.js';

class WebSocketHandler {
  constructor(wss, interactionProcessor) {
    this.wss = wss;
    this.interactionProcessor = interactionProcessor;
    this.clients = new Map();
    
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      
      // Store client info
      this.clients.set(clientId, {
        ws,
        sessionId: null,
        userId: null,
        connectedAt: Date.now()
      });
      
      logger.info(`Client connected: ${clientId}`);
      
      // Send welcome message
      this.sendToClient(ws, {
        type: 'CONNECTED',
        clientId,
        timestamp: Date.now()
      });
      
      // Handle messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(clientId, data);
        } catch (error) {
          logger.error('Error handling WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });
      
      // Handle errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error);
      });
      
      // Handle disconnection
      ws.on('close', () => {
        logger.info(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });
      
      // Setup ping/pong for connection health
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });
    
    // Setup heartbeat interval
    this.setupHeartbeat();
  }

  async handleMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    try {
      switch (data.type) {
        case 'INTERACTION_LOGS':
          await this.handleInteractionLogs(client, data.data);
          break;
          
        case 'SESSION_START':
          await this.handleSessionStart(client, data);
          break;
          
        case 'SESSION_END':
          await this.handleSessionEnd(client, data);
          break;
          
        case 'SCENE_UPDATE':
          await this.handleSceneUpdate(client, data);
          break;
          
        case 'REQUEST_SUGGESTION':
          await this.handleSuggestionRequest(client, data);
          break;
          
        case 'FEEDBACK':
          await this.handleFeedback(client, data);
          break;
          
        default:
          logger.warn(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      logger.error('Error handling message:', error);
      this.sendError(client.ws, error.message);
    }
  }

  async handleInteractionLogs(client, logs) {
    try {
      // Process logs through interaction processor
      const processedLogs = await this.interactionProcessor.processLogs(logs);
      
      // Send confirmation
      this.sendToClient(client.ws, {
        type: 'LOGS_PROCESSED',
        processed: processedLogs.length,
        timestamp: Date.now()
      });
      
      // Get session statistics
      if (client.sessionId) {
        const stats = await this.interactionProcessor.getStatistics(client.sessionId);
        
        // Send statistics update
        this.sendToClient(client.ws, {
          type: 'SESSION_STATS',
          stats,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      logger.error('Error processing interaction logs:', error);
      throw error;
    }
  }

  async handleSessionStart(client, data) {
    client.sessionId = data.sessionId;
    client.userId = data.userId;
    
    logger.info(`Session started: ${client.sessionId} for user: ${client.userId}`);
    
    // Send confirmation
    this.sendToClient(client.ws, {
      type: 'SESSION_STARTED',
      sessionId: client.sessionId,
      timestamp: Date.now()
    });
  }

  async handleSessionEnd(client, data) {
    logger.info(`Session ended: ${client.sessionId}`);
    
    // Clear session info
    client.sessionId = null;
    
    // Send confirmation
    this.sendToClient(client.ws, {
      type: 'SESSION_ENDED',
      timestamp: Date.now()
    });
  }

  async handleSceneUpdate(client, data) {
    // Broadcast scene update to all connected clients in the same session
    this.broadcastToSession(client.sessionId, {
      type: 'SCENE_UPDATE',
      sceneState: data.sceneState,
      timestamp: Date.now()
    }, client.ws);
  }

  async handleSuggestionRequest(client, data) {
    // This would integrate with the AI agent to provide suggestions
    // For now, send a mock suggestion
    this.sendToClient(client.ws, {
      type: 'SUGGESTION',
      suggestion: {
        action: 'create_object',
        params: {
          shape_type: 'sphere',
          position: { x: 0, y: 1, z: 0 }
        }
      },
      confidence: 0.75,
      timestamp: Date.now()
    });
  }

  async handleFeedback(client, data) {
    logger.info(`Feedback received from ${client.userId}: ${data.feedback}`);
    
    // Process feedback for learning
    // This would be integrated with the RLHF system
    
    // Send acknowledgment
    this.sendToClient(client.ws, {
      type: 'FEEDBACK_RECEIVED',
      timestamp: Date.now()
    });
  }

  setupHeartbeat() {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          logger.warn('Client connection lost due to heartbeat timeout');
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
    
    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  sendToClient(ws, data) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  sendError(ws, message) {
    this.sendToClient(ws, {
      type: 'ERROR',
      message,
      timestamp: Date.now()
    });
  }

  broadcastToSession(sessionId, data, excludeWs = null) {
    this.clients.forEach((client) => {
      if (client.sessionId === sessionId && client.ws !== excludeWs) {
        this.sendToClient(client.ws, data);
      }
    });
  }

  broadcast(data) {
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectedClients() {
    return Array.from(this.clients.entries()).map(([id, client]) => ({
      id,
      sessionId: client.sessionId,
      userId: client.userId,
      connectedAt: client.connectedAt
    }));
  }
}

export default WebSocketHandler;
