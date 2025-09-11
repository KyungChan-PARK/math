// server.js - Main backend server
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import Trivial Issue Prevention System
// import '../../auto-prevention.js';

// Import custom modules
import DatabaseManager from './services/DatabaseManager.js';
import InteractionProcessor from './processors/InteractionProcessor.js';
import AIAgentController from './controllers/AIAgentController.js';
import WebSocketHandler from './handlers/WebSocketHandler.js';
import DocumentImprovementService from './services/DocumentImprovementService.js';
import RealTimeSelfImprovementEngine from './services/RealTimeSelfImprovementEngine.js';
import { PalantirOntologySystem } from './services/PalantirOntologySystem.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize services
const dbManager = new DatabaseManager();
const interactionProcessor = new InteractionProcessor(dbManager);
const aiController = new AIAgentController();
const docImprover = new DocumentImprovementService();
const selfImprover = new RealTimeSelfImprovementEngine();

// Initialize Palantir Ontology System with ChromaDB
const ontologySystem = new PalantirOntologySystem({
  neo4jUri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4jUser: process.env.NEO4J_USER || 'neo4j',
  neo4jPassword: process.env.NEO4J_PASSWORD || 'aeclaudemax',
  chromaUri: process.env.CHROMADB_URL || process.env.CHROMA_URI || 'http://localhost:8000',
  watchPaths: ['/app/src'],  // Use Docker container path
  wsPort: 8092,  // Changed from 8091 to avoid conflict
  streamingEnabled: false  // Temporarily disabled to avoid port conflict
});

// Initialize WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

const wsHandler = new WebSocketHandler(wss, interactionProcessor);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: Date.now(),
    services: {
      database: dbManager.isConnected(),
      websocket: wss.clients.size,
      ai: aiController.isReady(),
      docImprovement: docImprover.isInitialized,
      selfImprovement: selfImprover ? selfImprover.getStatus() : null,
      ontology: ontologySystem ? 'active' : 'inactive',
      chromaDB: ontologySystem && ontologySystem.chromaClient ? 'connected' : 'disconnected'
    }
  });
});

// API Routes

// Interaction logging endpoint
app.post('/api/interactions', async (req, res) => {
  try {
    const logs = req.body;
    const processedLogs = await interactionProcessor.processLogs(logs);
    
    res.json({
      success: true,
      processed: processedLogs.length,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error processing interactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Scene state endpoint
app.post('/api/scene/state', async (req, res) => {
  try {
    const { sessionId, state } = req.body;
    
    await dbManager.saveSceneState(sessionId, state);
    
    res.json({
      success: true,
      sessionId,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error saving scene state:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI Agent action endpoint
app.post('/api/agent/action', async (req, res) => {
  try {
    const { sceneState, context } = req.body;
    
    // Process through AI agent
    const agentAction = await aiController.generateAction(sceneState, context);
    
    res.json({
      success: true,
      action: agentAction,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error generating agent action:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Document improvement endpoints
app.post('/api/docs/analyze', async (req, res) => {
  try {
    const { documentPath, content } = req.body;
    
    const improvements = await docImprover.analyzeDocument(documentPath, content);
    
    res.json({
      success: true,
      improvements,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error analyzing document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/docs/improvement/status', async (req, res) => {
  const status = await docImprover.getImprovementStatus();
  res.json(status);
});

app.get('/api/docs/improvement/history', async (req, res) => {
  const { limit = 10 } = req.query;
  const history = await docImprover.getImprovementHistory(parseInt(limit));
  res.json(history);
});

app.post('/api/docs/improvement/mode', async (req, res) => {
  const { mode } = req.body;
  const success = docImprover.setOrchestrationMode(mode);
  res.json({ success, mode });
});

// Self-improvement engine endpoints
app.get('/api/self-improvement/status', (req, res) => {
  const status = selfImprover.getStatus();
  res.json({
    ...status,
    graph: {
      totalNodes: status.nodes,
      codeFiles: Array.from(selfImprover.projectGraph.values())
        .filter(n => n.type === 'code').length,
      docFiles: Array.from(selfImprover.projectGraph.values())
        .filter(n => n.type === 'doc').length
    }
  });
});

app.get('/api/self-improvement/issues', (req, res) => {
  res.json({
    queue: selfImprover.issueQueue,
    processing: selfImprover.isProcessing,
    count: selfImprover.issueQueue.length
  });
});

app.get('/api/self-improvement/history', (req, res) => {
  const { limit = 20 } = req.query;
  res.json({
    changes: selfImprover.changeHistory.slice(-parseInt(limit))
  });
});

app.post('/api/self-improvement/validate', async (req, res) => {
  try {
    const inconsistencies = await selfImprover.validateConsistency();
    res.json({
      success: true,
      inconsistencies,
      count: inconsistencies.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Real-time Sync endpoints
app.post('/api/sync/test', async (req, res) => {
  try {
    const { type, file, content } = req.body;
    
    const result = {
      type,
      file,
      timestamp: new Date().toISOString(),
      processed: false,
      updates: []
    };
    
    // Process document update through self-improvement engine
    if (type === 'document_update' && selfImprover) {
      // Properly format the path for handleFileChange
      const filePath = typeof file === 'string' ? file : file.path || 'unknown.md';
      
      // Call handleFileChange with the file path
      await selfImprover.handleFileChange(filePath, 'update');
      
      result.processed = true;
      result.updates = ['Document sync triggered'];
      
      // Update in Neo4j ontology if available
      if (global.ontologySystem) {
        await global.ontologySystem.updateDocument(filePath, content);
      }
    }
    
    res.json({
      success: true,
      result
    });
    
  } catch (error) {
    logger.error('Sync test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/sync/status', async (req, res) => {
  try {
    const status = {
      selfImprovement: selfImprover ? 'active' : 'inactive',
      documentService: docImprover ? 'active' : 'inactive',
      ontology: global.ontologySystem ? 'active' : 'inactive',
      metrics: selfImprover?.getMetrics?.() || {},
      lastSync: selfImprover?.lastSyncTime || null
    };
    
    res.json(status);
  } catch (error) {
    logger.error('Failed to get sync status:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync/full', async (req, res) => {
  try {
    if (!selfImprover) {
      throw new Error('Self-improvement engine not initialized');
    }
    
    // Start full sync in background
    selfImprover.startMonitoring?.().then(result => {
      logger.info('Full sync completed:', result);
    }).catch(error => {
      logger.error('Full sync failed:', error);
    });
    
    res.json({
      success: true,
      message: 'Full synchronization started in background'
    });
    
  } catch (error) {
    logger.error('Failed to start full sync:', error);
    res.status(500).json({ error: error.message });
  }
});

// Training data endpoint
app.get('/api/training/data', async (req, res) => {
  try {
    const { sessionId, limit = 100 } = req.query;
    
    const trainingData = await dbManager.getTrainingData(sessionId, parseInt(limit));
    
    res.json({
      success: true,
      data: trainingData,
      count: trainingData.length,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error fetching training data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Session management
app.post('/api/session/start', async (req, res) => {
  try {
    const { userId, metadata } = req.body;
    
    const session = await dbManager.createSession(userId, metadata);
    
    res.json({
      success: true,
      sessionId: session.id,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/session/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    await dbManager.endSession(sessionId);
    
    res.json({
      success: true,
      sessionId,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ontology System API endpoints
app.get('/api/ontology/status', async (req, res) => {
  try {
    const status = {
      initialized: ontologySystem ? true : false,
      neo4j: ontologySystem && ontologySystem.driver ? 'connected' : 'disconnected',
      chromaDB: ontologySystem && ontologySystem.chromaClient ? 'connected' : 'disconnected',
      metrics: ontologySystem ? ontologySystem.metrics : null,
      websocket: ontologySystem && ontologySystem.wss ? 'active' : 'inactive'
    };
    res.json(status);
  } catch (error) {
    logger.error('Error getting ontology status:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ontology/semantic-search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;
    
    if (!ontologySystem || !ontologySystem.semanticLayer) {
      return res.status(503).json({ error: 'Ontology system not initialized' });
    }
    
    const results = await ontologySystem.semanticSearch(query, limit);
    res.json({
      success: true,
      results,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error performing semantic search:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ontology/sync', async (req, res) => {
  try {
    if (!ontologySystem) {
      return res.status(503).json({ error: 'Ontology system not initialized' });
    }
    
    await ontologySystem.performFullSync();
    res.json({
      success: true,
      message: 'Full synchronization initiated',
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error initiating sync:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: dbManager.mongoClient ? 'connected' : 'disconnected',
      neo4j: dbManager.neo4jDriver ? 'connected' : 'disconnected',
      selfImprovement: selfImprover ? 'active' : 'inactive',
      documentImprovement: docImprover.isInitialized ? 'active' : 'inactive',
      websocket: wss.clients.size + ' clients connected'
    },
    metrics: selfImprover.getMetrics ? selfImprover.getMetrics() : {}
  });
});

const PORT = process.env.PORT || 8086;

async function startServer() {
  try {
    // Connect to databases
    await dbManager.connect();
    
    // Initialize AI controller
    await aiController.initialize();
    
    // Initialize document improvement service
    await docImprover.initialize();
    
    // Initialize real-time self-improvement engine
    await selfImprover.initialize();
    
    // Initialize Palantir Ontology System with ChromaDB
    await ontologySystem.initialize();
    logger.info('Palantir Ontology System initialized with ChromaDB');
    
    // Start listening
    server.listen(PORT, () => {
      logger.info(`Math Education Backend Server running on port ${PORT}`);
      logger.info(`WebSocket server available at ws://localhost:${PORT}/ws`);
      logger.info(`Ontology WebSocket streaming available at ws://localhost:8092`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  
  // Close WebSocket connections
  wss.clients.forEach(client => {
    client.close();
  });
  
  // Cleanup Ontology System
  if (ontologySystem) {
    await ontologySystem.cleanup();
  }
  
  // Close database connections
  await dbManager.disconnect();
  
  // Close server
  server.close(() => {
    logger.info('Server shutdown complete');
    process.exit(0);
  });
});

// Start the server
startServer();

export default app;
