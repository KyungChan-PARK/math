// OntologyService.js - Core ontology management for Math Education System
// Handles knowledge graph operations and entity relationships

import neo4j from 'neo4j-driver';
import { ChromaClient } from 'chromadb';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OntologyService {
  constructor() {
    this.ontologyPath = path.join(__dirname, '../../ontology/ontology.json');
    this.ontology = null;
    this.neo4jDriver = null;
    this.chromaClient = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load ontology definition
      const ontologyData = await fs.readFile(this.ontologyPath, 'utf-8');
      this.ontology = JSON.parse(ontologyData);
      
      // Initialize Neo4j connection
      if (this.ontology.integrations.neo4j.enabled) {
        this.neo4jDriver = neo4j.driver(
          this.ontology.integrations.neo4j.uri,
          neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD || 'password')
        );
        await this.verifyNeo4jConnection();
      }
      
      // Initialize ChromaDB
      if (this.ontology.integrations.chromadb.enabled) {
        this.chromaClient = new ChromaClient({
          path: this.ontology.integrations.chromadb.uri
        });
      }
      
      this.initialized = true;
      console.log('✅ OntologyService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OntologyService:', error);
      throw error;
    }
  }

  async verifyNeo4jConnection() {
    const session = this.neo4jDriver.session();
    try {
      await session.run('RETURN 1');
      console.log('✅ Neo4j connection verified');
    } finally {
      await session.close();
    }
  }

  // Create entity in knowledge graph
  async createEntity(type, properties) {
    if (!this.ontology.entities[type]) {
      throw new Error(`Unknown entity type: ${type}`);
    }
    
    const session = this.neo4jDriver.session();
    try {
      const query = `
        CREATE (n:${type} $props)
        RETURN n
      `;
      const result = await session.run(query, { props: properties });
      return result.records[0].get('n').properties;
    } finally {
      await session.close();
    }
  }

  // Create relationship between entities
  async createRelation(fromId, relation, toId, properties = {}) {
    if (!this.ontology.relations[relation]) {
      throw new Error(`Unknown relation type: ${relation}`);
    }
    
    const session = this.neo4jDriver.session();
    try {
      const relDef = this.ontology.relations[relation];
      const query = `
        MATCH (a:${relDef.from} {id: $fromId})
        MATCH (b:${relDef.to} {id: $toId})
        CREATE (a)-[r:${relation} $props]->(b)
        RETURN r
      `;
      const result = await session.run(query, {
        fromId,
        toId,
        props: properties
      });
      return result.records[0].get('r').properties;
    } finally {
      await session.close();
    }
  }

  // Query entities by type and properties
  async queryEntities(type, filters = {}) {
    const session = this.neo4jDriver.session();
    try {
      const whereClause = Object.keys(filters).length > 0
        ? 'WHERE ' + Object.keys(filters).map(key => `n.${key} = $${key}`).join(' AND ')
        : '';
      
      const query = `
        MATCH (n:${type})
        ${whereClause}
        RETURN n
      `;
      
      const result = await session.run(query, filters);
      return result.records.map(record => record.get('n').properties);
    } finally {
      await session.close();
    }
  }

  // Get entity with all its relationships
  async getEntityWithRelations(type, id) {
    const session = this.neo4jDriver.session();
    try {
      const query = `
        MATCH (n:${type} {id: $id})
        OPTIONAL MATCH (n)-[r]-(m)
        RETURN n, collect({
          relation: type(r),
          direction: CASE WHEN startNode(r) = n THEN 'outgoing' ELSE 'incoming' END,
          target: m
        }) as relations
      `;
      
      const result = await session.run(query, { id });
      if (result.records.length === 0) return null;
      
      const record = result.records[0];
      return {
        entity: record.get('n').properties,
        relations: record.get('relations')
      };
    } finally {
      await session.close();
    }
  }

  async close() {
    if (this.neo4jDriver) {
      await this.neo4jDriver.close();
    }
    this.initialized = false;
  }
}

export default OntologyService;