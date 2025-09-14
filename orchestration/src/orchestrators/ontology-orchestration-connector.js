/**
 * Ontology-Orchestration Connector
 * Links Neo4j knowledge graph with execution engine for intelligent decision making
 * Created: 2025-01-27
 */

import neo4j from 'neo4j-driver';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

class OntologyOrchestrationConnector extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            neo4jUri: config.neo4jUri || 'bolt://localhost:7687',
            neo4jUser: config.neo4jUser || 'neo4j',
            neo4jPassword: config.neo4jPassword || 'aeclaudemax',
            syncInterval: 5000,
            ...config
        };
        
        this.driver = null;
        this.orchestrationEngine = null;
        this.knowledgeCache = new Map();
        this.decisionHistory = [];
    }

    async initialize(orchestrationEngine) {
        console.log('[CONNECTOR] Initializing Ontology-Orchestration connection...');
        
        // Connect to Neo4j
        this.driver = neo4j.driver(
            this.config.neo4jUri,
            neo4j.auth.basic(this.config.neo4jUser, this.config.neo4jPassword)
        );
        
        // Link orchestration engine
        this.orchestrationEngine = orchestrationEngine;
        
        // Verify connection
        await this.verifyConnection();
        
        // Create bidirectional references
        await this.createBidirectionalReferences();
        
        // Start sync loop
        this.startSyncLoop();
        
        console.log('[CONNECTOR] Ontology-Orchestration connection established');
        return true;
    }

    async verifyConnection() {
        const session = this.driver.session();
        try {
            const result = await session.run('RETURN 1 as test');
            console.log('[CONNECTOR] Neo4j connection verified');
            return true;
        } finally {
            await session.close();
        }
    }

    async createBidirectionalReferences() {
        const session = this.driver.session();
        try {
            // Create Orchestration node in ontology
            await session.run(`
                MERGE (o:System {name: 'OrchestrationEngine'})
                SET o.type = 'execution_engine',
                    o.status = 'connected',
                    o.updated_at = datetime(),
                    o.capabilities = ['hub_spoke', 'constraint_validation', 'workflow_management']
                RETURN o
            `);

            // Link to existing ontology nodes
            await session.run(`
                MATCH (o:System {name: 'OrchestrationEngine'})
                MATCH (ont:System {name: 'Neo4jOntology'})
                MERGE (o)-[:USES_KNOWLEDGE_FROM]->(ont)
                MERGE (ont)-[:INFORMS_DECISIONS_OF]->(o)
            `);

            // Connect to all documents
            await session.run(`
                MATCH (o:System {name: 'OrchestrationEngine'})
                MATCH (d:Document)
                MERGE (o)-[:REFERENCES]->(d)
            `);

            // Connect to all agents
            await session.run(`
                MATCH (o:System {name: 'OrchestrationEngine'})
                MATCH (a:Agent)
                MERGE (o)-[:ORCHESTRATES]->(a)
            `);

            console.log('[CONNECTOR] Bidirectional references created in Neo4j');
            
            // Update orchestration engine with ontology reference
            if (this.orchestrationEngine) {
                this.orchestrationEngine.ontologyConnector = this;
                this.orchestrationEngine.useOntology = true;
            }
            
        } finally {
            await session.close();
        }
    }

    async queryOntology(query, parameters = {}) {
        const session = this.driver.session();
        try {
            const result = await session.run(query, parameters);
            return result.records.map(record => record.toObject());
        } finally {
            await session.close();
        }
    }

    async getNaturalLanguageIntent(text) {
        // Query ontology for intent understanding
        const query = `
            MATCH (i:Intent)-[:TRIGGERED_BY]->(k:Keyword)
            WHERE toLower($text) CONTAINS toLower(k.word)
            RETURN DISTINCT i.name as intent, 
                   i.action as action,
                   collect(k.word) as keywords
            ORDER BY size(collect(k.word)) DESC
            LIMIT 1
        `;
        
        const results = await this.queryOntology(query, { text });
        
        if (results.length > 0) {
            return {
                intent: results[0].intent,
                action: results[0].action,
                confidence: results[0].keywords.length / text.split(' ').length
            };
        }
        
        return null;
    }

    async getWorkflowFromIntent(intent) {
        // Get workflow steps from ontology
        const query = `
            MATCH (w:Workflow {intent: $intent})-[:HAS_STEP]->(s:Step)
            RETURN s.order as order, 
                   s.action as action, 
                   s.parameters as parameters
            ORDER BY s.order
        `;
        
        return await this.queryOntology(query, { intent });
    }

    async validateConstraints(action, context) {
        // Check constraints from ontology
        const query = `
            MATCH (a:Action {name: $action})-[:HAS_CONSTRAINT]->(c:Constraint)
            RETURN c.type as type, 
                   c.rule as rule, 
                   c.severity as severity
        `;
        
        const constraints = await this.queryOntology(query, { action });
        const violations = [];
        
        for (const constraint of constraints) {
            if (!this.evaluateConstraint(constraint, context)) {
                violations.push(constraint);
            }
        }
        
        return {
            valid: violations.length === 0,
            violations
        };
    }

    evaluateConstraint(constraint, context) {
        // Evaluate constraint rules
        switch (constraint.type) {
            case 'dependency':
                return context.dependencies?.includes(constraint.rule);
            
            case 'permission':
                return context.permissions?.includes(constraint.rule);
            
            case 'resource':
                return context.resources?.[constraint.rule] !== undefined;
            
            case 'state':
                return context.state === constraint.rule;
            
            default:
                return true;
        }
    }

    async enrichDecisionWithKnowledge(decision) {
        // Add knowledge from ontology to decision
        const enriched = { ...decision };
        
        // Get related concepts
        const query = `
            MATCH (c:Concept)-[:RELATED_TO]->(d:Decision {type: $type})
            RETURN c.name as concept, 
                   c.description as description,
                   c.importance as importance
            ORDER BY c.importance DESC
            LIMIT 5
        `;
        
        const concepts = await this.queryOntology(query, { type: decision.type });
        enriched.relatedConcepts = concepts;
        
        // Get historical patterns
        const historyQuery = `
            MATCH (p:Pattern)-[:APPLIES_TO]->(d:Decision {type: $type})
            WHERE p.success_rate > 0.7
            RETURN p.name as pattern, 
                   p.approach as approach,
                   p.success_rate as successRate
            ORDER BY p.success_rate DESC
            LIMIT 3
        `;
        
        const patterns = await this.queryOntology(historyQuery, { type: decision.type });
        enriched.recommendedPatterns = patterns;
        
        return enriched;
    }

    async recordDecisionOutcome(decision, outcome) {
        // Store decision outcome in ontology for learning
        const session = this.driver.session();
        try {
            await session.run(`
                CREATE (d:DecisionRecord {
                    id: randomUUID(),
                    type: $type,
                    action: $action,
                    outcome: $outcome,
                    success: $success,
                    timestamp: datetime(),
                    context: $context
                })
                RETURN d
            `, {
                type: decision.type,
                action: decision.action,
                outcome: outcome.status,
                success: outcome.success,
                context: JSON.stringify(decision.context)
            });
            
            // Update pattern success rates
            if (outcome.success) {
                await session.run(`
                    MATCH (p:Pattern {name: $pattern})
                    SET p.success_count = coalesce(p.success_count, 0) + 1,
                        p.total_count = coalesce(p.total_count, 0) + 1,
                        p.success_rate = (coalesce(p.success_count, 0) + 1.0) / (coalesce(p.total_count, 0) + 1.0)
                `, {
                    pattern: decision.pattern
                });
            }
            
        } finally {
            await session.close();
        }
    }

    async getRelevantDocuments(topic) {
        // Find relevant documentation from ontology
        const query = `
            MATCH (d:Document)-[:COVERS_TOPIC]->(t:Topic)
            WHERE toLower(t.name) CONTAINS toLower($topic)
            RETURN d.name as document, 
                   d.path as path,
                   d.summary as summary,
                   collect(t.name) as topics
            ORDER BY size(collect(t.name)) DESC
            LIMIT 5
        `;
        
        return await this.queryOntology(query, { topic });
    }

    startSyncLoop() {
        setInterval(async () => {
            try {
                // Sync orchestration state to ontology
                if (this.orchestrationEngine) {
                    await this.syncOrchestrationState();
                }
                
                // Update knowledge cache
                await this.updateKnowledgeCache();
                
            } catch (error) {
                console.error('[CONNECTOR] Sync error:', error);
            }
        }, this.config.syncInterval);
    }

    async syncOrchestrationState() {
        const session = this.driver.session();
        try {
            const state = this.orchestrationEngine.getState();
            
            await session.run(`
                MATCH (o:System {name: 'OrchestrationEngine'})
                SET o.status = $status,
                    o.active_spokes = $spokes,
                    o.active_workflows = $workflows,
                    o.last_sync = datetime()
            `, {
                status: state.status,
                spokes: state.spokes.size,
                workflows: state.workflows.size
            });
            
        } finally {
            await session.close();
        }
    }

    async updateKnowledgeCache() {
        // Cache frequently used knowledge
        const commonIntents = await this.queryOntology(`
            MATCH (i:Intent)
            RETURN i.name as name, i.action as action
            ORDER BY i.usage_count DESC
            LIMIT 20
        `);
        
        this.knowledgeCache.set('common_intents', commonIntents);
    }

    // Integration methods for orchestration engine
    async beforeAction(action, context) {
        // Validate with ontology before execution
        const validation = await this.validateConstraints(action, context);
        
        if (!validation.valid) {
            console.log(`[CONNECTOR] Constraint violations for ${action}:`, validation.violations);
            return {
                proceed: false,
                reason: 'constraint_violation',
                violations: validation.violations
            };
        }
        
        // Enrich with knowledge
        const enriched = await this.enrichDecisionWithKnowledge({
            type: 'action',
            action,
            context
        });
        
        return {
            proceed: true,
            enriched
        };
    }

    async afterAction(action, context, result) {
        // Record outcome for learning
        await this.recordDecisionOutcome(
            { type: 'action', action, context },
            { status: result.status, success: result.success }
        );
    }

    async shutdown() {
        console.log('[CONNECTOR] Shutting down Ontology-Orchestration connection...');
        
        if (this.driver) {
            await this.driver.close();
        }
        
        console.log('[CONNECTOR] Shutdown complete');
    }
}

// Export for use in orchestration engine
export default OntologyOrchestrationConnector;

// Auto-initialize if needed
export async function connectOntologyToOrchestration(orchestrationEngine) {
    const connector = new OntologyOrchestrationConnector();
    await connector.initialize(orchestrationEngine);
    return connector;
}
