/**
 * AE Claude Max v3.4.0 - Complete Neo4j Ontology System
 * Full Palantir-style implementation with GraphRAG capabilities
 */

import neo4j from 'neo4j-driver';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import msgpack from 'msgpack-lite';

export class CompleteNeo4jOntology {
  constructor(config = {}) {
    this.driver = neo4j.driver(
      config.uri || 'bolt://localhost:7687',
      neo4j.auth.basic(config.user || 'neo4j', config.password || 'aemax2025')
    );
    
    this.semanticCache = new Map();
    this.queryCache = new Map();
    this.projectPath = 'C:\\palantir\\math';
  }

  // === Core Ontology Methods ===
  async initialize() {
    const session = this.driver.session();
    try {
      // Create comprehensive schema
      await this.createCompleteSchema(session);
      
      // Initialize all node types
      await this.createNodeTypes(session);
      
      // Set up relationships
      await this.createRelationshipTypes(session);
      
      // Load existing project data
      await this.loadProjectData(session);
      
      console.log('✅ Complete Neo4j Ontology initialized');
      return { success: true, nodes: await this.getNodeCount(session) };
    } finally {
      await session.close();
    }
  }

  async createCompleteSchema(session) {
    const constraints = [
      // Unique constraints
      'CREATE CONSTRAINT unique_doc IF NOT EXISTS FOR (d:Document) REQUIRE d.name IS UNIQUE',
      'CREATE CONSTRAINT unique_agent IF NOT EXISTS FOR (a:Agent) REQUIRE a.name IS UNIQUE',
      'CREATE CONSTRAINT unique_task IF NOT EXISTS FOR (t:Task) REQUIRE t.id IS UNIQUE',
      
      // Property existence constraints
      'CREATE CONSTRAINT doc_name_exists IF NOT EXISTS FOR (d:Document) REQUIRE d.name IS NOT NULL',
      'CREATE CONSTRAINT agent_type_exists IF NOT EXISTS FOR (a:Agent) REQUIRE a.type IS NOT NULL',
      
      // Indexes for performance
      'CREATE INDEX doc_layer IF NOT EXISTS FOR (d:Document) ON (d.layer)',
      'CREATE INDEX task_status IF NOT EXISTS FOR (t:Task) ON (t.status)',
      'CREATE INDEX comp_created IF NOT EXISTS FOR (c:Composition) ON (c.created)',
      'CREATE INDEX effect_type IF NOT EXISTS FOR (e:Effect) ON (e.type)',
      'CREATE INDEX layer_type IF NOT EXISTS FOR (l:Layer) ON (l.type)',
      'CREATE INDEX migration_progress IF NOT EXISTS FOR (m:Migration) ON (m.progress)'
    ];

    for (const constraint of constraints) {
      try {
        await session.run(constraint);
      } catch (e) {
        // Constraints might already exist
        console.log(`Schema item exists: ${constraint.split(' ')[2]}`);
      }
    }
  }

  async createNodeTypes(session) {
    // Define all node types in the ontology
    const nodeTypes = {
      Document: {
        properties: ['name', 'layer', 'type', 'priority', 'path', 'updated'],
        examples: ['01-MASTER-INSTRUCTIONS', '06-WEBSOCKET-OPTIMIZATION']
      },
      Agent: {
        properties: ['name', 'type', 'capabilities', 'status'],
        examples: ['NLPEngine', 'GestureRecognizer', 'WebSocketBridge']
      },
      Task: {
        properties: ['id', 'description', 'status', 'priority', 'assignedTo'],
        examples: ['websocket-optimization', 'neo4j-integration']
      },
      Composition: {
        properties: ['name', 'width', 'height', 'fps', 'duration'],
        examples: ['MainComp', 'PreviewComp']
      },
      Layer: {
        properties: ['name', 'type', 'index', 'parent'],
        examples: ['TextLayer1', 'ShapeLayer2']
      },
      Effect: {
        properties: ['name', 'type', 'parameters'],
        examples: ['Wiggle', 'GaussianBlur', 'ColorCorrection']
      },
      Migration: {
        properties: ['name', 'progress', 'target', 'status'],
        examples: ['uWebSockets', 'WindowsML', 'CEP-UXP']
      },
      Pattern: {
        properties: ['name', 'occurrences', 'efficiency', 'lastUsed'],
        examples: ['file-read-pattern', 'error-handling-pattern']
      }
    };

    // Create sample nodes for each type
    for (const [nodeType, config] of Object.entries(nodeTypes)) {
      const query = `
        MERGE (n:${nodeType} {name: $name})
        SET n.created = datetime(),
            n.type = $nodeType
        RETURN n
      `;
      
      for (const example of config.examples) {
        await session.run(query, { name: example, nodeType });
      }
    }
  }

  async createRelationshipTypes(session) {
    const relationships = [
      // Document relationships
      ['Document', '01-MASTER-INSTRUCTIONS', 'DEFINES', 'Document', '02-AUTONOMY-GUIDELINES'],
      ['Document', '03-NLP-REALTIME-SYSTEM', 'REQUIRES', 'Document', '06-WEBSOCKET-OPTIMIZATION'],
      
      // Agent relationships
      ['Agent', 'NLPEngine', 'PROCESSES', 'Document', '03-NLP-REALTIME-SYSTEM'],
      ['Agent', 'GestureRecognizer', 'IMPLEMENTS', 'Document', '04-GESTURE-RECOGNITION'],
      
      // Task relationships
      ['Task', 'websocket-optimization', 'TARGETS', 'Migration', 'uWebSockets'],
      ['Task', 'neo4j-integration', 'CREATES', 'Agent', 'GraphRAG'],
      
      // Composition relationships
      ['Composition', 'MainComp', 'CONTAINS', 'Layer', 'TextLayer1'],
      ['Layer', 'TextLayer1', 'APPLIES', 'Effect', 'Wiggle']
    ];

    for (const [fromType, fromName, relType, toType, toName] of relationships) {
      const query = `
        MATCH (from:${fromType} {name: $fromName})
        MATCH (to:${toType} {name: $toName})
        MERGE (from)-[r:${relType}]->(to)
        SET r.created = datetime()
        RETURN from, r, to
      `;
      
      await session.run(query, { fromName, toName });
    }
  }

  // === GraphRAG Methods ===
  async semanticSearch(query, limit = 10) {
    const session = this.driver.session();
    try {
      // Convert natural language to graph pattern
      const graphPattern = await this.nlToGraphPattern(query);
      
      // Execute semantic search
      const result = await session.run(graphPattern.cypher, {
        ...graphPattern.params,
        limit
      });
      
      return result.records.map(r => r.toObject());
    } finally {
      await session.close();
    }
  }

  async nlToGraphPattern(nlQuery) {
    // Pattern matching for common queries
    const patterns = {
      'find.*documents.*about (.+)': (match) => ({
        cypher: `
          MATCH (d:Document)
          WHERE d.name CONTAINS $pattern OR d.type CONTAINS $pattern
          RETURN d ORDER BY d.priority DESC LIMIT $limit
        `,
        params: { pattern: match[1] }
      }),
      
      'what.*depends.*on (.+)': (match) => ({
        cypher: `
          MATCH (n)-[:DEPENDS_ON|REQUIRES]->(target {name: $name})
          RETURN n, target
        `,
        params: { name: match[1] }
      }),
      
      'show.*migration.*status': () => ({
        cypher: `
          MATCH (m:Migration)
          RETURN m.name as migration, m.progress as progress, m.status as status
          ORDER BY m.progress ASC
        `,
        params: {}
      }),
      
      'find.*errors.*in (.+)': (match) => ({
        cypher: `
          MATCH (n {name: $name})-[:HAS_ERROR]->(e:Error)
          RETURN n, e, e.message as error
        `,
        params: { name: match[1] }
      })
    };

    // Match patterns
    for (const [pattern, generator] of Object.entries(patterns)) {
      const regex = new RegExp(pattern, 'i');
      const match = nlQuery.match(regex);
      if (match) {
        return generator(match);
      }
    }

    // Default semantic search
    return {
      cypher: `
        CALL db.index.fulltext.queryNodes('default', $query)
        YIELD node, score
        RETURN node, score
        ORDER BY score DESC
        LIMIT $limit
      `,
      params: { query: nlQuery }
    };
  }

  // === Project Data Loading ===
  async loadProjectData(session) {
    // Load actual project files and create nodes
    const docsPath = join(this.projectPath, 'dev-docs');
    
    if (existsSync(docsPath)) {
      const files = readdirSync(docsPath);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const docName = file.replace('.md', '');
          const fullPath = join(docsPath, file);
          
          // Create document node with metadata
          await session.run(`
            MERGE (d:Document {name: $name})
            SET d.path = $path,
                d.fileName = $fileName,
                d.updated = datetime(),
                d.layer = CASE
                  WHEN $name STARTS WITH '01' OR $name STARTS WITH '02' THEN 'L0'
                  WHEN $name STARTS WITH '03' OR $name STARTS WITH '04' THEN 'L1'
                  WHEN $name STARTS WITH '05' OR $name STARTS WITH '06' THEN 'L2'
                  ELSE 'L3'
                END
            RETURN d
          `, { name: docName, path: fullPath, fileName: file });
        }
      }
    }
  }

  // === Query Execution ===
  async executeAction(actionType, params) {
    const session = this.driver.session();
    const tx = session.beginTransaction();
    
    try {
      // Validate action against constraints
      const validation = await this.validateAction(actionType, params, tx);
      if (!validation.valid) {
        throw new Error(`Constraint violation: ${validation.reason}`);
      }

      // Execute action
      const result = await this.performAction(actionType, params, tx);
      
      // Commit transaction
      await tx.commit();
      
      // Update semantic cache
      this.updateSemanticCache(actionType, params, result);
      
      return { success: true, result };
    } catch (error) {
      await tx.rollback();
      return { success: false, error: error.message };
    } finally {
      await session.close();
    }
  }

  async validateAction(actionType, params, tx) {
    // Constraint validation logic
    const constraints = {
      CREATE_COMPOSITION: async (p) => {
        const existing = await tx.run(
          'MATCH (c:Composition {name: $name}) RETURN c',
          { name: p.name }
        );
        return {
          valid: existing.records.length === 0,
          reason: 'Composition already exists'
        };
      },
      
      ADD_LAYER: async (p) => {
        const comp = await tx.run(
          'MATCH (c:Composition {name: $comp}) RETURN c',
          { comp: p.composition }
        );
        return {
          valid: comp.records.length > 0,
          reason: 'Composition not found'
        };
      },
      
      APPLY_EFFECT: async (p) => {
        const layer = await tx.run(
          'MATCH (l:Layer {name: $layer}) RETURN l',
          { layer: p.layer }
        );
        return {
          valid: layer.records.length > 0,
          reason: 'Layer not found'
        };
      }
    };

    const validator = constraints[actionType];
    return validator ? await validator(params) : { valid: true };
  }

  async performAction(actionType, params, tx) {
    const actions = {
      CREATE_COMPOSITION: async (p) => {
        const result = await tx.run(`
          CREATE (c:Composition {
            name: $name,
            width: $width,
            height: $height,
            fps: $fps,
            duration: $duration,
            created: datetime()
          })
          RETURN c
        `, p);
        return result.records[0].get('c');
      },
      
      ADD_LAYER: async (p) => {
        const result = await tx.run(`
          MATCH (c:Composition {name: $comp})
          CREATE (l:Layer {
            name: $name,
            type: $type,
            index: $index,
            created: datetime()
          })
          CREATE (c)-[:CONTAINS]->(l)
          RETURN l, c
        `, p);
        return result.records[0].toObject();
      },
      
      APPLY_EFFECT: async (p) => {
        const result = await tx.run(`
          MATCH (l:Layer {name: $layer})
          CREATE (e:Effect {
            name: $effect,
            type: $type,
            parameters: $params,
            created: datetime()
          })
          CREATE (l)-[:APPLIES]->(e)
          RETURN e, l
        `, p);
        return result.records[0].toObject();
      }
    };

    const action = actions[actionType];
    return action ? await action(params) : null;
  }

  // === Cache Management ===
  updateSemanticCache(actionType, params, result) {
    const cacheKey = `${actionType}:${JSON.stringify(params)}`;
    this.semanticCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      hits: 0
    });

    // Limit cache size
    if (this.semanticCache.size > 1000) {
      const oldest = Array.from(this.semanticCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 100);
      
      oldest.forEach(([key]) => this.semanticCache.delete(key));
    }
  }

  // === Analytics Methods ===
  async getGraphMetrics() {
    const session = this.driver.session();
    try {
      const metrics = await session.run(`
        MATCH (n)
        WITH labels(n)[0] as nodeType, count(n) as count
        RETURN nodeType, count
        ORDER BY count DESC
      `);
      
      const relationships = await session.run(`
        MATCH ()-[r]->()
        RETURN type(r) as relType, count(r) as count
        ORDER BY count DESC
      `);
      
      return {
        nodes: metrics.records.map(r => ({
          type: r.get('nodeType'),
          count: r.get('count').toNumber()
        })),
        relationships: relationships.records.map(r => ({
          type: r.get('relType'),
          count: r.get('count').toNumber()
        }))
      };
    } finally {
      await session.close();
    }
  }

  async getNodeCount(session) {
    const result = await session.run('MATCH (n) RETURN count(n) as count');
    return result.records[0].get('count').toNumber();
  }

  // === Cleanup ===
  async close() {
    await this.driver.close();
  }
}

// Export for use in other modules
export default CompleteNeo4jOntology;