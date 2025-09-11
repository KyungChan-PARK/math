// DatabaseManager.js - MongoDB and Neo4j connection manager
import { MongoClient } from 'mongodb';
import neo4j from 'neo4j-driver';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

class DatabaseManager {
  constructor() {
    this.mongoClient = null;
    this.mongoDB = null;
    this.neo4jDriver = null;
    this.isMongoConnected = false;
    this.isNeo4jConnected = false;
  }

  async connect() {
    try {
      // Connect to MongoDB
      await this.connectMongoDB();
      
      // Connect to Neo4j
      await this.connectNeo4j();
      
      logger.info('All databases connected successfully');
    } catch (error) {
      logger.error('Database connection error:', error);
      throw error;
    }
  }

  async connectMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
      this.mongoClient = new MongoClient(mongoUri);
      
      await this.mongoClient.connect();
      this.mongoDB = this.mongoClient.db(process.env.MONGODB_NAME || 'math_education');
      
      // Create collections if they don't exist
      await this.initializeCollections();
      
      this.isMongoConnected = true;
      logger.info('MongoDB connected successfully');
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async connectNeo4j() {
    try {
      const neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
      const neo4jUser = process.env.NEO4J_USER || 'neo4j';
      const neo4jPassword = process.env.NEO4J_PASSWORD || 'aeclaudemax';
      
      this.neo4jDriver = neo4j.driver(
        neo4jUri,
        neo4j.auth.basic(neo4jUser, neo4jPassword)
      );
      
      // Test connection
      const session = this.neo4jDriver.session();
      await session.run('RETURN 1');
      await session.close();
      
      // Initialize Neo4j schema
      await this.initializeNeo4jSchema();
      
      this.isNeo4jConnected = true;
      logger.info('Neo4j connected successfully');
    } catch (error) {
      logger.error('Neo4j connection error:', error);
      // Neo4j is optional, so we don't throw
      this.isNeo4jConnected = false;
    }
  }

  async initializeCollections() {
    const collections = [
      'interaction_logs',
      'sessions',
      'scene_states',
      'training_data',
      'reward_models',
      'agent_states'
    ];

    for (const collectionName of collections) {
      const collection = this.mongoDB.collection(collectionName);
      
      // Create indexes
      if (collectionName === 'interaction_logs') {
        await collection.createIndex({ session_id: 1 });
        await collection.createIndex({ timestamp: -1 });
        await collection.createIndex({ user_id: 1 });
      } else if (collectionName === 'sessions') {
        await collection.createIndex({ user_id: 1 });
        await collection.createIndex({ created_at: -1 });
      }
    }
  }

  async initializeNeo4jSchema() {
    const session = this.neo4jDriver.session();
    
    try {
      // Create constraints
      await session.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE
      `);
      
      await session.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (s:Session) REQUIRE s.id IS UNIQUE
      `);
      
      await session.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (o:Object) REQUIRE o.id IS UNIQUE
      `);
      
      await session.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (g:Gesture) REQUIRE g.id IS UNIQUE
      `);
      
      logger.info('Neo4j schema initialized');
    } catch (error) {
      logger.error('Neo4j schema initialization error:', error);
    } finally {
      await session.close();
    }
  }

  // Save interaction log
  async saveInteractionLog(log) {
    try {
      const collection = this.mongoDB.collection('interaction_logs');
      
      // Add server timestamp
      log.server_timestamp = new Date();
      
      const result = await collection.insertOne(log);
      
      // Also save to Neo4j for graph analysis
      if (this.isNeo4jConnected) {
        await this.saveInteractionToGraph(log);
      }
      
      return result.insertedId;
    } catch (error) {
      logger.error('Error saving interaction log:', error);
      throw error;
    }
  }

  async saveInteractionToGraph(log) {
    const session = this.neo4jDriver.session();
    
    try {
      // Create or update user node
      await session.run(`
        MERGE (u:User {id: $userId})
        SET u.last_active = datetime()
      `, { userId: log.user_id });
      
      // Create session node
      await session.run(`
        MERGE (s:Session {id: $sessionId})
        SET s.last_updated = datetime()
      `, { sessionId: log.session_id });
      
      // Create gesture node
      if (log.user_action) {
        const gestureId = uuidv4();
        await session.run(`
          CREATE (g:Gesture {
            id: $gestureId,
            type: $gestureType,
            timestamp: datetime($timestamp)
          })
          WITH g
          MATCH (s:Session {id: $sessionId})
          CREATE (s)-[:HAS_GESTURE]->(g)
        `, {
          gestureId,
          gestureType: log.user_action.gesture_type,
          timestamp: new Date(log.timestamp).toISOString(),
          sessionId: log.session_id
        });
      }
    } catch (error) {
      logger.error('Error saving to Neo4j:', error);
    } finally {
      await session.close();
    }
  }

  // Save scene state
  async saveSceneState(sessionId, state) {
    try {
      const collection = this.mongoDB.collection('scene_states');
      
      const document = {
        session_id: sessionId,
        state,
        timestamp: new Date()
      };
      
      const result = await collection.insertOne(document);
      return result.insertedId;
    } catch (error) {
      logger.error('Error saving scene state:', error);
      throw error;
    }
  }

  // Get training data for RLHF
  async getTrainingData(sessionId, limit = 100) {
    try {
      const collection = this.mongoDB.collection('interaction_logs');
      
      const query = sessionId ? { session_id: sessionId } : {};
      
      const logs = await collection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      // Transform logs into training data format
      const trainingData = logs.map(log => ({
        state: log.scene_state_before,
        action: log.user_action,
        next_state: log.scene_state_after,
        timestamp: log.timestamp,
        metadata: {
          session_id: log.session_id,
          user_id: log.user_id,
          log_id: log.log_id
        }
      }));
      
      return trainingData;
    } catch (error) {
      logger.error('Error fetching training data:', error);
      throw error;
    }
  }

  // Session management
  async createSession(userId, metadata = {}) {
    try {
      const collection = this.mongoDB.collection('sessions');
      
      const session = {
        id: uuidv4(),
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
        status: 'active',
        metadata
      };
      
      await collection.insertOne(session);
      
      // Create session in Neo4j
      if (this.isNeo4jConnected) {
        const neo4jSession = this.neo4jDriver.session();
        try {
          await neo4jSession.run(`
            MATCH (u:User {id: $userId})
            CREATE (s:Session {
              id: $sessionId,
              created_at: datetime(),
              status: 'active'
            })
            CREATE (u)-[:STARTED_SESSION]->(s)
          `, { userId, sessionId: session.id });
        } finally {
          await neo4jSession.close();
        }
      }
      
      return session;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  async endSession(sessionId) {
    try {
      const collection = this.mongoDB.collection('sessions');
      
      await collection.updateOne(
        { id: sessionId },
        {
          $set: {
            status: 'ended',
            ended_at: new Date(),
            updated_at: new Date()
          }
        }
      );
      
      // Update session in Neo4j
      if (this.isNeo4jConnected) {
        const session = this.neo4jDriver.session();
        try {
          await session.run(`
            MATCH (s:Session {id: $sessionId})
            SET s.status = 'ended', s.ended_at = datetime()
          `, { sessionId });
        } finally {
          await session.close();
        }
      }
    } catch (error) {
      logger.error('Error ending session:', error);
      throw error;
    }
  }

  // Save reward model data
  async saveRewardData(rewardData) {
    try {
      const collection = this.mongoDB.collection('reward_models');
      
      const document = {
        ...rewardData,
        created_at: new Date()
      };
      
      const result = await collection.insertOne(document);
      return result.insertedId;
    } catch (error) {
      logger.error('Error saving reward data:', error);
      throw error;
    }
  }

  // Get user preferences for personalization
  async getUserPreferences(userId) {
    try {
      if (!this.isNeo4jConnected) return null;
      
      const session = this.neo4jDriver.session();
      
      try {
        const result = await session.run(`
          MATCH (u:User {id: $userId})-[:STARTED_SESSION]->(s:Session)
          MATCH (s)-[:HAS_GESTURE]->(g:Gesture)
          WITH g.type as gesture_type, count(*) as frequency
          ORDER BY frequency DESC
          RETURN collect({
            gesture: gesture_type,
            frequency: frequency
          }) as preferences
        `, { userId });
        
        if (result.records.length > 0) {
          return result.records[0].get('preferences');
        }
        
        return [];
      } finally {
        await session.close();
      }
    } catch (error) {
      logger.error('Error fetching user preferences:', error);
      return [];
    }
  }

  isConnected() {
    return this.isMongoConnected;
  }

  async disconnect() {
    try {
      if (this.mongoClient) {
        await this.mongoClient.close();
        this.isMongoConnected = false;
      }
      
      if (this.neo4jDriver) {
        await this.neo4jDriver.close();
        this.isNeo4jConnected = false;
      }
      
      logger.info('Databases disconnected');
    } catch (error) {
      logger.error('Error disconnecting databases:', error);
    }
  }
}

export default DatabaseManager;
