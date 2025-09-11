// ChromaDB Service for Math Education System
import { ChromaClient } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';

class ChromaDBService {
  constructor() {
    this.client = null;
    this.collections = {};
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('Initializing ChromaDB service...');
      
      // Create client
      this.client = new ChromaClient({
        path: 'http://localhost:8000'
      });
      
      // Create collections
      await this.createCollections();
      
      this.initialized = true;
      console.log('ChromaDB service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize ChromaDB:', error);
      return false;
    }
  }

  async createCollections() {
    // Math concepts collection
    this.collections.concepts = await this.client.getOrCreateCollection({
      name: 'math_concepts',
      metadata: { 
        description: 'Mathematical concepts and definitions',
        type: 'knowledge_base'
      }
    });
    
    // Gesture patterns collection
    this.collections.gestures = await this.client.getOrCreateCollection({
      name: 'gesture_patterns',
      metadata: { 
        description: 'Teacher gesture patterns and interactions',
        type: 'behavior_learning'
      }
    });
    
    // Interaction logs collection  
    this.collections.interactions = await this.client.getOrCreateCollection({
      name: 'interaction_logs',
      metadata: { 
        description: 'User interaction history for RLHF',
        type: 'rlhf_data'
      }
    });
    
    // Solutions collection
    this.collections.solutions = await this.client.getOrCreateCollection({
      name: 'math_solutions', 
      metadata: {
        description: 'Step-by-step solutions and explanations',
        type: 'educational_content'
      }
    });
    
    console.log('Created 4 collections:', Object.keys(this.collections));
  }

  // Store math concept
  async storeConcept(concept) {
    const id = concept.id || uuidv4();
    
    await this.collections.concepts.add({
      ids: [id],
      documents: [concept.description],
      metadatas: [{
        name: concept.name,
        category: concept.category,
        difficulty: concept.difficulty,
        prerequisites: JSON.stringify(concept.prerequisites || []),
        timestamp: new Date().toISOString()
      }]
    });
    
    return id;
  }

  // Store gesture pattern
  async storeGesturePattern(pattern) {
    const id = pattern.id || uuidv4();
    
    await this.collections.gestures.add({
      ids: [id],
      documents: [pattern.description],
      metadatas: [{
        gesture_type: pattern.type,
        action: pattern.action,
        confidence: pattern.confidence,
        teacher_id: pattern.teacherId,
        frequency: pattern.frequency,
        timestamp: new Date().toISOString()
      }]
    });
    
    return id;
  }

  // Store interaction for RLHF
  async storeInteraction(interaction) {
    const id = interaction.id || uuidv4();
    
    await this.collections.interactions.add({
      ids: [id],
      documents: [JSON.stringify(interaction.action)],
      metadatas: [{
        session_id: interaction.sessionId,
        user_id: interaction.userId,
        action_type: interaction.actionType,
        object_id: interaction.objectId,
        reward: interaction.reward || 0,
        timestamp: new Date().toISOString()
      }]
    });
    
    return id;
  }

  // Search for similar concepts
  async searchConcepts(query, nResults = 5) {
    const results = await this.collections.concepts.query({
      queryTexts: [query],
      nResults: nResults
    });
    
    return this.formatResults(results);
  }

  // Find similar gesture patterns
  async findSimilarGestures(description, nResults = 3) {
    const results = await this.collections.gestures.query({
      queryTexts: [description],
      nResults: nResults
    });
    
    return this.formatResults(results);
  }

  // Get teacher's frequent patterns
  async getTeacherPatterns(teacherId, limit = 10) {
    const results = await this.collections.gestures.get({
      where: { teacher_id: teacherId },
      limit: limit
    });
    
    return results;
  }

  // Format query results
  formatResults(results) {
    const formatted = [];
    
    if (results.ids && results.ids[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        formatted.push({
          id: results.ids[0][i],
          document: results.documents[0][i],
          metadata: results.metadatas[0][i],
          distance: results.distances ? results.distances[0][i] : null
        });
      }
    }
    
    return formatted;
  }

  // Get collection stats
  async getStats() {
    const stats = {};
    
    for (const [name, collection] of Object.entries(this.collections)) {
      stats[name] = await collection.count();
    }
    
    return stats;
  }

  // Delete collection data
  async clearCollection(collectionName) {
    if (this.collections[collectionName]) {
      const collection = this.collections[collectionName];
      const allIds = await collection.get();
      
      if (allIds.ids && allIds.ids.length > 0) {
        await collection.delete({ ids: allIds.ids });
      }
      
      return true;
    }
    
    return false;
  }
}

export default ChromaDBService;
