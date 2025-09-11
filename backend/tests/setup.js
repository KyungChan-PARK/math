// Test setup and configuration
import dotenv from 'dotenv';
import { jest } from '@jest/globals';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Global test utilities
global.testUtils = {
  // Generate random test data
  generateId: () => Math.random().toString(36).substring(7),
  
  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock request object
  mockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides
  }),
  
  // Mock response object
  mockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
    return res;
  },
  
  // Mock WebSocket
  mockWebSocket: () => ({
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    readyState: 1, // OPEN
  }),
};

// Mock external services by default
jest.mock('mongodb', () => ({
  MongoClient: {
    connect: jest.fn().mockResolvedValue({
      db: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn(),
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([])
          }),
          insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-id' }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
          deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        })
      }),
      close: jest.fn()
    })
  }
}));

jest.mock('neo4j-driver', () => ({
  driver: jest.fn().mockReturnValue({
    session: jest.fn().mockReturnValue({
      run: jest.fn().mockResolvedValue({ records: [] }),
      close: jest.fn()
    }),
    close: jest.fn()
  }),
  auth: {
    basic: jest.fn()
  }
}));

jest.mock('chromadb', () => ({
  ChromaClient: jest.fn().mockImplementation(() => ({
    getOrCreateCollection: jest.fn().mockResolvedValue({
      add: jest.fn(),
      query: jest.fn().mockResolvedValue({
        ids: [],
        distances: [],
        metadatas: [],
        documents: []
      }),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0)
    }),
    getCollection: jest.fn(),
    deleteCollection: jest.fn(),
    listCollections: jest.fn().mockResolvedValue([])
  }))
}));

jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: { content: 'Test response' }
          }]
        })
      }
    }
  }))
}));

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Claude test response' }]
      })
    }
  }))
}));

// Clean up after tests
afterAll(async () => {
  // Close any open connections
  jest.clearAllMocks();
});
