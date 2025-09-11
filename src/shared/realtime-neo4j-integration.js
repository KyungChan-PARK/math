/**
 * Real-time Gesture + Neo4j Knowledge Graph Integration
 * Connects MediaPipe gestures → Neo4j concepts → Claude API feedback
 */

import neo4j from 'neo4j-driver';
import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';

class RealtimeNeo4jIntegration extends EventEmitter {
    constructor() {
        super();
        this.driver = null;
        this.wsServer = null;
        this.gestureMappings = new Map();
        this.conceptCache = new Map();
        this.performanceMetrics = {
            neo4jQueries: 0,
            avgQueryTime: 0,
            cacheHits: 0,
            totalGestures: 0
        };
    }

    /**
     * Initialize Neo4j connection and load gesture mappings
     */
    async initialize() {
        console.log(' Initializing Real-time Neo4j Integration...');
        
        // Connect to Neo4j
        this.driver = neo4j.driver(
            process.env.NEO4J_URI || 'bolt://localhost:7687',
            neo4j.auth.basic(
                process.env.NEO4J_USER || 'neo4j',
                process.env.NEO4J_PASSWORD || 'aeclaudemax'
            )
        );

        // Verify connection
        const session = this.driver.session();
        try {
            await session.run('RETURN 1');
            console.log('✅ Neo4j connected successfully');
            
            // Initialize knowledge graph structure
            await this.initializeKnowledgeGraph();
            
            // Load gesture mappings
            await this.loadGestureMappings();
            
        } catch (error) {
            console.error('❌ Neo4j connection failed:', error);
            throw error;
        } finally {
            await session.close();
        }

        // Setup WebSocket server for real-time gestures
        this.setupWebSocketServer();
    }
    /**
     * Initialize the knowledge graph structure for math education
     */
    async initializeKnowledgeGraph() {
        const session = this.driver.session();
        
        try {
            // Create constraints for unique nodes
            await session.run(`
                CREATE CONSTRAINT gesture_name IF NOT EXISTS
                ON (g:Gesture) ASSERT g.name IS UNIQUE
            `).catch(() => {}); // Ignore if already exists

            await session.run(`
                CREATE CONSTRAINT concept_name IF NOT EXISTS
                ON (c:Concept) ASSERT c.name IS UNIQUE
            `).catch(() => {});

            // Create base gesture nodes
            const gestures = [
                { name: 'PINCH', description: 'Scale adjustment using thumb-index distance' },
                { name: 'SPREAD', description: 'Angle adjustment using finger spread' },
                { name: 'GRAB', description: 'Shape movement using fist detection' },
                { name: 'POINT', description: 'Vertex selection using index pointing' },
                { name: 'DRAW', description: 'Shape drawing using index trajectory' }
            ];

            for (const gesture of gestures) {
                await session.run(`                    MERGE (g:Gesture {name: $name})
                    SET g.description = $description,
                        g.created_at = datetime(),
                        g.usage_count = 0
                    RETURN g
                `, gesture);
            }

            // Create math concept nodes
            const concepts = [
                { name: 'Geometry', level: 'L1', topics: ['shapes', 'angles', 'vertices'] },
                { name: 'Trigonometry', level: 'L2', topics: ['sin', 'cos', 'tan'] },
                { name: 'Calculus', level: 'L3', topics: ['derivatives', 'integrals'] },
                { name: 'Linear Algebra', level: 'L3', topics: ['vectors', 'matrices'] },
                { name: 'Graph Theory', level: 'L2', topics: ['nodes', 'edges', 'paths'] }
            ];

            for (const concept of concepts) {
                await session.run(`
                    MERGE (c:Concept {name: $name})
                    SET c.level = $level,
                        c.topics = $topics,
                        c.created_at = datetime()
                    RETURN c
                `, concept);
            }

            // Create relationships between gestures and concepts
            const relationships = [
                { gesture: 'PINCH', concept: 'Geometry', action: 'SCALES' },
                { gesture: 'SPREAD', concept: 'Trigonometry', action: 'ADJUSTS_ANGLE' },                { gesture: 'GRAB', concept: 'Linear Algebra', action: 'TRANSFORMS' },
                { gesture: 'POINT', concept: 'Graph Theory', action: 'SELECTS' },
                { gesture: 'DRAW', concept: 'Geometry', action: 'CREATES' }
            ];

            for (const rel of relationships) {
                await session.run(`
                    MATCH (g:Gesture {name: $gesture})
                    MATCH (c:Concept {name: $concept})
                    MERGE (g)-[r:APPLIES_TO {action: $action}]->(c)
                    SET r.created_at = datetime(),
                        r.strength = 1.0
                    RETURN r
                `, rel);
            }

            console.log(' Knowledge graph initialized with gestures and concepts');
            
        } finally {
            await session.close();
        }
    }

    /**
     * Load gesture-concept mappings from Neo4j
     */
    async loadGestureMappings() {
        const session = this.driver.session();
        
        try {
            const result = await session.run(`
                MATCH (g:Gesture)-[r:APPLIES_TO]->(c:Concept)                RETURN g.name as gesture, 
                       c.name as concept, 
                       c.level as level,
                       c.topics as topics,
                       r.action as action
            `);

            result.records.forEach(record => {
                const gesture = record.get('gesture');
                const mapping = {
                    concept: record.get('concept'),
                    level: record.get('level'),
                    topics: record.get('topics'),
                    action: record.get('action')
                };
                
                if (!this.gestureMappings.has(gesture)) {
                    this.gestureMappings.set(gesture, []);
                }
                this.gestureMappings.get(gesture).push(mapping);
            });

            console.log(` Loaded ${this.gestureMappings.size} gesture mappings`);
            
        } finally {
            await session.close();
        }
    }

    /**
     * Query Neo4j for related concepts based on gesture
     */    async getRelatedConcepts(gestureName, context = {}) {
        // Check cache first
        const cacheKey = `${gestureName}-${JSON.stringify(context)}`;
        if (this.conceptCache.has(cacheKey)) {
            this.performanceMetrics.cacheHits++;
            return this.conceptCache.get(cacheKey);
        }

        const startTime = Date.now();
        const session = this.driver.session();
        
        try {
            // GraphRAG query to find related concepts
            const result = await session.run(`
                MATCH (g:Gesture {name: $gestureName})-[r:APPLIES_TO]->(c:Concept)
                OPTIONAL MATCH (c)-[:RELATES_TO]-(related:Concept)
                OPTIONAL MATCH (c)-[:PREREQUISITE_OF]->(advanced:Concept)
                RETURN 
                    c.name as primary_concept,
                    c.level as level,
                    c.topics as topics,
                    collect(DISTINCT related.name) as related_concepts,
                    collect(DISTINCT advanced.name) as advanced_concepts,
                    r.action as action
                LIMIT 5
            `, { gestureName });

            const concepts = result.records.map(record => ({
                primary: record.get('primary_concept'),
                level: record.get('level'),
                topics: record.get('topics'),                related: record.get('related_concepts'),
                advanced: record.get('advanced_concepts'),
                action: record.get('action')
            }));

            // Update metrics
            this.performanceMetrics.neo4jQueries++;
            const queryTime = Date.now() - startTime;
            this.performanceMetrics.avgQueryTime = 
                (this.performanceMetrics.avgQueryTime * (this.performanceMetrics.neo4jQueries - 1) + queryTime) 
                / this.performanceMetrics.neo4jQueries;

            // Cache the result
            this.conceptCache.set(cacheKey, concepts);
            
            // Clear cache if too large
            if (this.conceptCache.size > 100) {
                const firstKey = this.conceptCache.keys().next().value;
                this.conceptCache.delete(firstKey);
            }

            return concepts;
            
        } finally {
            await session.close();
        }
    }

    /**
     * Record gesture usage for learning analytics
     */
    async recordGestureUsage(gestureName, userId, context) {        const session = this.driver.session();
        
        try {
            await session.run(`
                MATCH (g:Gesture {name: $gestureName})
                SET g.usage_count = g.usage_count + 1
                CREATE (u:Usage {
                    gesture: $gestureName,
                    user_id: $userId,
                    timestamp: datetime(),
                    context: $context
                })
                CREATE (u)-[:USED]->(g)
                RETURN g.usage_count as count
            `, { gestureName, userId, context: JSON.stringify(context) });

            this.performanceMetrics.totalGestures++;
            
        } finally {
            await session.close();
        }
    }

    /**
     * Setup WebSocket server for real-time gesture processing
     */
    setupWebSocketServer() {
        this.wsServer = new WebSocketServer({ port: 8089 });
        
        this.wsServer.on('connection', (ws) => {
            console.log(' New WebSocket connection for Neo4j integration');
                        
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    if (data.type === 'gesture') {
                        await this.processGesture(data, ws);
                    } else if (data.type === 'query') {
                        await this.processQuery(data, ws);
                    }
                    
                } catch (error) {
                    console.error('Error processing message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            });
        });

        console.log(' WebSocket server listening on port 8089');
    }

    /**
     * Process incoming gesture and return educational feedback
     */
    async processGesture(data, ws) {
        const { gesture, keypoints, userId = 'anonymous' } = data;
        
        // Get related concepts from Neo4j
        const concepts = await this.getRelatedConcepts(gesture, { keypoints });        
        // Record usage for analytics
        await this.recordGestureUsage(gesture, userId, { keypoints });
        
        // Generate educational feedback using Claude API
        const feedback = await this.generateEducationalFeedback(gesture, concepts);
        
        // Send response
        ws.send(JSON.stringify({
            type: 'feedback',
            gesture,
            concepts,
            feedback,
            metrics: this.performanceMetrics
        }));
    }

    /**
     * Process knowledge graph queries
     */
    async processQuery(data, ws) {
        const { query, parameters = {} } = data;
        const session = this.driver.session();
        
        try {
            const result = await session.run(query, parameters);
            const records = result.records.map(record => record.toObject());
            
            ws.send(JSON.stringify({
                type: 'query_result',
                records,
                summary: result.summary
            }));            
        } finally {
            await session.close();
        }
    }

    /**
     * Generate educational feedback using Claude API specialists
     * This connects to the real Claude API for intelligent feedback
     */
    async generateEducationalFeedback(gesture, concepts) {
        const primaryConcept = concepts[0] || {};
        
        // Prepare context for Claude API
        const context = {
            gesture: gesture,
            concept: primaryConcept.primary,
            level: primaryConcept.level,
            topics: primaryConcept.topics || [],
            action: primaryConcept.action
        };

        // Define specialist prompts
        const specialists = {
            gestureAnalyst: {
                prompt: `As a gesture recognition expert, analyze this math gesture:
                Gesture: ${gesture}
                Action: ${context.action}
                Context: Student is learning ${context.concept}
                
                Provide specific feedback on gesture technique and accuracy.
                Format response as JSON with: {analysis, improvement_tips, confidence}`,
                maxTokens: 300
            },            mathTeacher: {
                prompt: `As a math education specialist, create learning content for:
                Concept: ${context.concept}
                Level: ${context.level}
                Topics: ${context.topics.join(', ')}
                Triggered by: ${gesture} gesture
                
                Provide step-by-step explanation and example problems.
                Format response as JSON with: {explanation, examples, next_concepts}`,
                maxTokens: 500
            },
            visualDesigner: {
                prompt: `As a visual learning expert, suggest visualizations for:
                Math concept: ${context.concept}
                Gesture used: ${gesture}
                Learning level: ${context.level}
                
                Describe interactive visual representations.
                Format response as JSON with: {visualization_type, interactive_elements, color_scheme}`,
                maxTokens: 300
            }
        };

        try {
            // Call Claude API in parallel for all specialists
            const apiCalls = Object.entries(specialists).map(async ([role, config]) => {
                try {
                    // Actual Claude API call (works in artifacts/analysis)
                    const response = await fetch("https://api.anthropic.com/v1/messages", {
                        method: "POST",                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": process.env.CLAUDE_API_KEY || '',
                            "anthropic-version": "2023-06-01"
                        },
                        body: JSON.stringify({
                            model: "claude-3-sonnet-20240229",
                            max_tokens: config.maxTokens,
                            messages: [
                                {
                                    role: "user",
                                    content: config.prompt
                                }
                            ],
                            temperature: 0.7
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Claude API error: ${response.status}`);
                    }

                    const data = await response.json();
                    const content = data.content[0].text;
                    
                    // Try to parse JSON response
                    try {
                        return { role, result: JSON.parse(content) };
                    } catch {
                        return { role, result: { text: content } };
                    }                    
                } catch (error) {
                    console.error(`Error calling Claude API for ${role}:`, error);
                    return { role, result: null };
                }
            });

            // Wait for all specialists to respond
            const results = await Promise.all(apiCalls);
            
            // Combine results using consensus
            const feedback = this.combineSpecialistFeedback(results, context);
            
            return feedback;
            
        } catch (error) {
            console.error('Error generating educational feedback:', error);
            
            // Fallback to structured feedback without Claude API
            return {
                gesture: gesture,
                explanation: `The ${gesture} gesture applies to ${primaryConcept.primary || 'mathematics'}`,
                concepts: primaryConcept.topics || [],
                difficulty: primaryConcept.level || 'L1',
                nextSteps: primaryConcept.advanced || [],
                relatedTopics: primaryConcept.related || [],
                timestamp: new Date().toISOString(),
                source: 'fallback'
            };
        }
    }
    /**
     * Combine feedback from multiple Claude specialists
     */
    combineSpecialistFeedback(results, context) {
        const feedback = {
            gesture: context.gesture,
            concept: context.concept,
            level: context.level,
            timestamp: new Date().toISOString(),
            specialists: {}
        };

        // Extract successful responses
        results.forEach(({ role, result }) => {
            if (result) {
                feedback.specialists[role] = result;
            }
        });

        // Consensus-based combination
        const gestureAnalysis = feedback.specialists.gestureAnalyst || {};
        const mathContent = feedback.specialists.mathTeacher || {};
        const visualGuide = feedback.specialists.visualDesigner || {};

        // Combine insights
        feedback.analysis = gestureAnalysis.analysis || `${context.gesture} gesture detected`;
        feedback.explanation = mathContent.explanation || `Learning ${context.concept}`;
        feedback.examples = mathContent.examples || [];
        feedback.visualization = visualGuide.visualization_type || 'interactive_graph';
        feedback.improvementTips = gestureAnalysis.improvement_tips || [];        feedback.nextConcepts = mathContent.next_concepts || context.topics || [];
        feedback.interactiveElements = visualGuide.interactive_elements || [];
        
        // Calculate confidence score
        const specialistCount = Object.keys(feedback.specialists).length;
        feedback.confidence = specialistCount / 3; // 3 specialists total
        
        return feedback;
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            ...this.performanceMetrics,
            cacheSize: this.conceptCache.size,
            mappingsLoaded: this.gestureMappings.size,
            cacheHitRate: this.performanceMetrics.cacheHits / 
                         Math.max(1, this.performanceMetrics.neo4jQueries + this.performanceMetrics.cacheHits)
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.wsServer) {
            this.wsServer.close();
        }
                
        if (this.driver) {
            await this.driver.close();
        }
        
        console.log(' Neo4j integration cleaned up');
    }
}

// Export for use in other modules
export default RealtimeNeo4jIntegration;

// Auto-start if run directly
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
    const integration = new RealtimeNeo4jIntegration();
    
    integration.initialize()
        .then(() => {
            console.log('✨ Real-time Neo4j Integration running');
            console.log(' Initial metrics:', integration.getMetrics());
            
            // Keep process alive
            process.on('SIGINT', async () => {
                console.log('\n Shutting down...');
                await integration.cleanup();
                process.exit(0);
            });
        })
        .catch(error => {
            console.error('Failed to initialize:', error);
            process.exit(1);
        });
}