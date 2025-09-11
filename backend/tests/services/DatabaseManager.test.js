// DatabaseManager.test.js
import { jest } from '@jest/globals';
import DatabaseManager from '../../src/services/DatabaseManager.js';
import { MongoClient } from 'mongodb';
import neo4j from 'neo4j-driver';

// Mock the modules
jest.mock('mongodb');
jest.mock('neo4j-driver');
jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('DatabaseManager', () => {
  let dbManager;
  let mockMongoClient;
  let mockMongoDB;
  let mockCollection;
  let mockNeo4jDriver;
  let mockNeo4jSession;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup MongoDB mocks
    mockCollection = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-id' }),
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      createIndex: jest.fn().mockResolvedValue(true)
    };

    mockMongoDB = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    mockMongoClient = {
      connect: jest.fn().mockResolvedValue(),
      db: jest.fn().mockReturnValue(mockMongoDB),
      close: jest.fn().mockResolvedValue()
    };

    MongoClient.mockImplementation(() => mockMongoClient);

    // Setup Neo4j mocks
    mockNeo4jSession = {
      run: jest.fn().mockResolvedValue({ records: [] }),
      close: jest.fn().mockResolvedValue()
    };

    mockNeo4jDriver = {
      session: jest.fn().mockReturnValue(mockNeo4jSession),
      close: jest.fn().mockResolvedValue()
    };

    neo4j.driver = jest.fn().mockReturnValue(mockNeo4jDriver);
    neo4j.auth = {
      basic: jest.fn().mockReturnValue({})
    };

    // Create instance
    dbManager = new DatabaseManager();
  });

  afterEach(async () => {
    // Clean up
    if (dbManager) {
      await dbManager.disconnect();
    }
  });

  describe('Connection Management', () => {
    test('should connect to MongoDB successfully', async () => {
      await dbManager.connectMongoDB();

      expect(MongoClient).toHaveBeenCalled();
      expect(mockMongoClient.connect).toHaveBeenCalled();
      expect(mockMongoClient.db).toHaveBeenCalledWith('math_education');
      expect(dbManager.isMongoConnected).toBe(true);
    });

    test('should connect to Neo4j successfully', async () => {
      await dbManager.connectNeo4j();

      expect(neo4j.driver).toHaveBeenCalledWith(
        'bolt://localhost:7687',
        expect.any(Object)
      );
      expect(mockNeo4jSession.run).toHaveBeenCalledWith('RETURN 1');
      expect(dbManager.isNeo4jConnected).toBe(true);
    });

    test('should handle MongoDB connection error', async () => {
      mockMongoClient.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(dbManager.connectMongoDB()).rejects.toThrow('Connection failed');
      expect(dbManager.isMongoConnected).toBe(false);
    });

    test('should handle Neo4j connection error gracefully', async () => {
      mockNeo4jSession.run.mockRejectedValue(new Error('Neo4j connection failed'));

      await dbManager.connectNeo4j();
      
      // Neo4j failure should not throw, just set flag
      expect(dbManager.isNeo4jConnected).toBe(false);
    });

    test('should connect to all databases', async () => {
      await dbManager.connect();

      expect(dbManager.isMongoConnected).toBe(true);
      expect(dbManager.isNeo4jConnected).toBe(true);
    });

    test('should disconnect from all databases', async () => {
      await dbManager.connect();
      await dbManager.disconnect();

      expect(mockMongoClient.close).toHaveBeenCalled();
      expect(mockNeo4jDriver.close).toHaveBeenCalled();
      expect(dbManager.isMongoConnected).toBe(false);
      expect(dbManager.isNeo4jConnected).toBe(false);
    });

    test('should check connection status', async () => {
      expect(dbManager.isConnected()).toBe(false);
      
      await dbManager.connectMongoDB();
      expect(dbManager.isConnected()).toBe(true);
    });
  });

  describe('Collection Initialization', () => {
    test('should initialize MongoDB collections', async () => {
      await dbManager.connectMongoDB();

      const expectedCollections = [
        'interaction_logs',
        'sessions',
        'scene_states',
        'training_data',
        'reward_models',
        'agent_states'
      ];

      expectedCollections.forEach(collectionName => {
        expect(mockMongoDB.collection).toHaveBeenCalledWith(collectionName);
      });
    });

    test('should create indexes for interaction_logs', async () => {
      await dbManager.connectMongoDB();

      expect(mockCollection.createIndex).toHaveBeenCalledWith({ session_id: 1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ user_id: 1 });
    });

    test('should create indexes for sessions', async () => {
      await dbManager.connectMongoDB();

      expect(mockCollection.createIndex).toHaveBeenCalledWith({ user_id: 1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ created_at: -1 });
    });
  });

  describe('Neo4j Schema Initialization', () => {
    test('should create Neo4j constraints', async () => {
      await dbManager.connectNeo4j();

      expect(mockNeo4jSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE CONSTRAINT IF NOT EXISTS FOR (u:User)')
      );
      expect(mockNeo4jSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE CONSTRAINT IF NOT EXISTS FOR (s:Session)')
      );
      expect(mockNeo4jSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE CONSTRAINT IF NOT EXISTS FOR (o:Object)')
      );
      expect(mockNeo4jSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE CONSTRAINT IF NOT EXISTS FOR (g:Gesture)')
      );
    });

    test('should handle Neo4j schema initialization error', async () => {
      mockNeo4jSession.run
        .mockResolvedValueOnce({ records: [] }) // Connection test
        .mockRejectedValue(new Error('Schema error')); // Schema creation

      await dbManager.connectNeo4j();

      // Should still be connected despite schema error
      expect(dbManager.isNeo4jConnected).toBe(true);
    });
  });

  describe('Interaction Log Management', () => {
    beforeEach(async () => {
      await dbManager.connect();
    });

    test('should save interaction log to MongoDB', async () => {
      const log = {
        user_id: 'user123',
        session_id: 'session456',
        user_action: {
          gesture_type: 'TAP',
          parameters: { x: 100, y: 200 }
        },
        scene_state_before: {},
        scene_state_after: {},
        timestamp: new Date()
      };

      const result = await dbManager.saveInteractionLog(log);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          ...log,
          server_timestamp: expect.any(Date)
        })
      );
      expect(result).toBe('test-id');
    });

    test('should save interaction to Neo4j graph', async () => {
      const log = {
        user_id: 'user123',
        session_id: 'session456',
        user_action: {
          gesture_type: 'DRAG',
          parameters: {}
        },
        timestamp: new Date()
      };

      await dbManager.saveInteractionLog(log);

      // Check user node creation
      expect(mockNeo4jSession.run).toHaveBeenCalledWith(
        expect.stringContaining('MERGE (u:User {id: $userId})'),
        expect.objectContaining({ userId: 'user123' })
      );

      // Check session node creation
      expect(mockNeo4jSession.run).toHaveBeenCalledWith(
        expect.stringContaining('MERGE (s:Session {id: $sessionId})'),
        expect.objectContaining({ sessionId: 'session456' })
      );

      // Check gesture node creation
      expect(mockNeo4jSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (g:Gesture'),
        expect.objectContaining({
          gestureType: 'DRAG',
          sessionId: 'session456'
        })
      );
    });

    test('should handle Neo4j save error gracefully', async () => {
      dbManager.isNeo4jConnected = true;
      mockNeo4jSession.run.mockRejectedValue(new Error('Neo4j error'));

      const log = {
        user_id: 'user123',
        session_id: 'session456',
        timestamp: new Date()
      };

      // Should not throw, just log error
      const result = await dbManager.saveInteractionLog(log);
      expect(result).toBe('test-id');
    });

    test('should handle MongoDB save error', async () => {
      mockCollection.insertOne.mockRejectedValue(new Error('Insert failed'));

      const log = {
        user_id: 'user123',
        session_id: 'session456',
        timestamp: new Date()
      };

      await expect(dbManager.saveInteractionLog(log)).rejects.toThrow('Insert failed');
    });
  });

  describe('Scene State Management', () => {
    beforeEach(async () => {
      await dbManager.connectMongoDB();
    });

    test('should save scene state', async () => {
      const state = {
        objects: [
          { id: 'obj1', type: 'cube', position: [0, 0, 0] }
        ],
        camera: { position: [5, 5, 5] }
      };

      const result = await dbManager.saveSceneState('session123', state);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'session123',
          state,
          timestamp: expect.any(Date)
        })
      );
      expect(result).toBe('test-id');
    });

    test('should handle scene state save error', async () => {
      mockCollection.insertOne.mockRejectedValue(new Error('Save failed'));

      await expect(
        dbManager.saveSceneState('session123', {})
      ).rejects.toThrow('Save failed');
    });
  });

  describe('Training Data Retrieval', () => {
    beforeEach(async () => {
      await dbManager.connectMongoDB();
    });

    test('should get training data for specific session', async () => {
      const mockLogs = [
        {
          session_id: 'session123',
          user_id: 'user1',
          user_action: { gesture_type: 'TAP' },
          scene_state_before: { objects: [] },
          scene_state_after: { objects: [1] },
          timestamp: new Date(),
          log_id: 'log1'
        }
      ];

      mockCollection.toArray.mockResolvedValue(mockLogs);

      const trainingData = await dbManager.getTrainingData('session123', 50);

      expect(mockCollection.find).toHaveBeenCalledWith({ session_id: 'session123' });
      expect(mockCollection.limit).toHaveBeenCalledWith(50);
      expect(trainingData).toHaveLength(1);
      expect(trainingData[0]).toHaveProperty('state');
      expect(trainingData[0]).toHaveProperty('action');
      expect(trainingData[0]).toHaveProperty('next_state');
      expect(trainingData[0]).toHaveProperty('metadata');
    });

    test('should get all training data when no session specified', async () => {
      mockCollection.toArray.mockResolvedValue([]);

      const trainingData = await dbManager.getTrainingData(null, 100);

      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(mockCollection.limit).toHaveBeenCalledWith(100);
      expect(trainingData).toEqual([]);
    });

    test('should handle training data retrieval error', async () => {
      mockCollection.toArray.mockRejectedValue(new Error('Query failed'));

      await expect(
        dbManager.getTrainingData('session123')
      ).rejects.toThrow('Query failed');
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      await dbManager.connect();
    });

    test('should create a new session', async () => {
      const session = await dbManager.createSession('user123', {
        device: 'tablet',
        app_version: '1.0.0'
      });

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('user_id', 'user123');
      expect(session).toHaveProperty('status', 'active');
      expect(session).toHaveProperty('metadata');
      
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user123',
          status: 'active'
        })
      );
    });

    test('should create session in Neo4j', async () => {
      const session = await dbManager.createSession('user123');

      expect(mockNeo4jSession.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (s:Session'),
        expect.objectContaining({
          userId: 'user123',
          sessionId: session.id
        })
      );
    });

    test('should end a session', async () => {
      await dbManager.endSession('session123');

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: 'session123' },
        {
          $set: expect.objectContaining({
            status: 'ended',
            ended_at: expect.any(Date)
          })
        }
      );
    });

    test('should update session in Neo4j when ending', async () => {
      await dbManager.endSession('session123');

      expect(mockNeo4jSession.run).toHaveBeenCalledWith(
        expect.stringContaining('SET s.status = \'ended\''),
        { sessionId: 'session123' }
      );
    });

    test('should handle session creation error', async () => {
      mockCollection.insertOne.mockRejectedValue(new Error('Create failed'));

      await expect(
        dbManager.createSession('user123')
      ).rejects.toThrow('Create failed');
    });

    test('should handle session end error', async () => {
      mockCollection.updateOne.mockRejectedValue(new Error('Update failed'));

      await expect(
        dbManager.endSession('session123')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('Reward Model Management', () => {
    beforeEach(async () => {
      await dbManager.connectMongoDB();
    });

    test('should save reward data', async () => {
      const rewardData = {
        session_id: 'session123',
        state_action_pairs: [],
        reward_values: [],
        model_version: '1.0.0'
      };

      const result = await dbManager.saveRewardData(rewardData);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          ...rewardData,
          created_at: expect.any(Date)
        })
      );
      expect(result).toBe('test-id');
    });

    test('should handle reward data save error', async () => {
      mockCollection.insertOne.mockRejectedValue(new Error('Save failed'));

      await expect(
        dbManager.saveRewardData({})
      ).rejects.toThrow('Save failed');
    });
  });

  describe('User Preferences', () => {
    beforeEach(async () => {
      await dbManager.connect();
    });

    test('should get user preferences from Neo4j', async () => {
      const mockPreferences = [
        { gesture: 'TAP', frequency: 10 },
        { gesture: 'DRAG', frequency: 5 }
      ];

      mockNeo4jSession.run.mockResolvedValue({
        records: [{
          get: jest.fn().mockReturnValue(mockPreferences)
        }]
      });

      const preferences = await dbManager.getUserPreferences('user123');

      expect(mockNeo4jSession.run).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (u:User {id: $userId})'),
        { userId: 'user123' }
      );
      expect(preferences).toEqual(mockPreferences);
    });

    test('should return empty array when no preferences found', async () => {
      mockNeo4jSession.run.mockResolvedValue({ records: [] });

      const preferences = await dbManager.getUserPreferences('user123');
      expect(preferences).toEqual([]);
    });

    test('should return null when Neo4j not connected', async () => {
      dbManager.isNeo4jConnected = false;

      const preferences = await dbManager.getUserPreferences('user123');
      expect(preferences).toBeNull();
    });

    test('should handle Neo4j query error gracefully', async () => {
      mockNeo4jSession.run.mockRejectedValue(new Error('Query failed'));

      const preferences = await dbManager.getUserPreferences('user123');
      expect(preferences).toEqual([]);
    });
  });
});
