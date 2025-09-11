/**
 * MCP Server Integration Module
 * Connects MCP Server with existing Self-Improvement Engine
 */

import MCPServer from './MCPServer.js';
import RealTimeSelfImprovementEngine from '../services/RealTimeSelfImprovementEngine.js';
import DocumentImprovementService from '../services/DocumentImprovementService.js';
import ClaudeIntegration from './ClaudeIntegration.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class IntegratedMCPServer extends MCPServer {
    constructor(config = {}) {
        super(config);
        
        // Initialize existing services
        this.selfImprover = null;
        this.docImprover = null;
        this.claudeIntegration = null;
        
        this.initializeServices();
        this.registerSystemAPIs();
        this.registerSystemSchemas();
    }

    async initializeServices() {
        try {
            // Connect to Self-Improvement Engine
            this.selfImprover = new RealTimeSelfImprovementEngine({
                targetPath: path.resolve(__dirname, '../..'),
                watchDocs: true
            });

            // Connect to Document Improvement Service
            this.docImprover = new DocumentImprovementService({
                apiKey: process.env.ANTHROPIC_API_KEY
            });

            // Initialize Claude Integration
            this.claudeIntegration = new ClaudeIntegration({
                apiKey: process.env.ANTHROPIC_API_KEY,
                model: 'claude-3-5-sonnet-20241022',
                maxTokens: 4096
            });

            // Listen to Claude validation events
            this.claudeIntegration.on('validation', (result) => {
                this.broadcast({
                    type: 'validation_update',
                    data: result
                });
            });

            console.log('MCP Server: Services initialized successfully');
            console.log('MCP Server: Claude Integration active');
        } catch (error) {
            console.error('MCP Server: Failed to initialize services:', error);
        }
    }

    registerSystemAPIs() {
        // Register all system APIs
        const apis = [
            {
                endpoint: '/api/health',
                method: 'GET',
                description: 'Health check endpoint',
                params: {},
                response: {
                    status: 'string',
                    timestamp: 'string',
                    services: 'object'
                }
            },
            {
                endpoint: '/api/interactions',
                method: 'POST',
                description: 'Log user interaction',
                params: {
                    timestamp: 'number',
                    gestureType: 'string',
                    coordinates: 'array',
                    objectId: 'string'
                },
                response: {
                    success: 'boolean',
                    id: 'string'
                }
            },
            {
                endpoint: '/api/ai-agent/suggest',
                method: 'POST',
                description: 'Get AI suggestions',
                params: {
                    sceneState: 'object',
                    recentActions: 'array'
                },
                response: {
                    suggestions: 'array',
                    confidence: 'number'
                }
            },
            {
                endpoint: '/api/shapes',
                method: 'POST',
                description: 'Create geometric shape',
                params: {
                    type: 'string',
                    properties: 'object'
                },
                response: {
                    id: 'string',
                    shape: 'object'
                }
            },
            {
                endpoint: '/api/demonstrations',
                method: 'POST',
                description: 'Record teacher demonstration',
                params: {
                    sessionId: 'string',
                    actions: 'array',
                    metadata: 'object'
                },
                response: {
                    success: 'boolean',
                    demonstrationId: 'string'
                }
            }
        ];

        apis.forEach(api => {
            this.registerAPI(api.endpoint, api);
        });
    }

    registerSystemSchemas() {
        // Register all system schemas
        const schemas = {
            InteractionLog: {
                type: 'object',
                properties: {
                    timestamp: { type: 'number', required: true },
                    sessionId: { type: 'string', required: true },
                    userId: { type: 'string', required: true },
                    gestureType: { 
                        type: 'string', 
                        enum: ['TAP', 'DRAG', 'PINCH', 'ROTATE', 'PAN', 'DRAW'],
                        required: true 
                    },
                    coordinates: { type: 'array', items: { type: 'number' } },
                    pressure: { type: 'number', min: 0, max: 1 },
                    objectId: { type: 'string' },
                    sceneStateBefore: { type: 'object' },
                    sceneStateAfter: { type: 'object' },
                    aiMode: { 
                        type: 'string', 
                        enum: ['observing', 'suggesting', 'acting'] 
                    }
                }
            },
            AgentAction: {
                type: 'object',
                properties: {
                    type: { type: 'string', required: true },
                    timestamp: { type: 'number', required: true },
                    confidence: { type: 'number', min: 0, max: 1 },
                    parameters: { type: 'object' }
                }
            },
            SceneState: {
                type: 'object',
                properties: {
                    objects: { 
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                type: { type: 'string' },
                                position: { type: 'object' },
                                rotation: { type: 'object' },
                                scale: { type: 'object' },
                                material: { type: 'object' }
                            }
                        }
                    },
                    camera: { type: 'object' },
                    lights: { type: 'array' }
                }
            },
            Gesture: {
                type: 'object',
                properties: {
                    type: { type: 'string', required: true },
                    startTime: { type: 'number' },
                    endTime: { type: 'number' },
                    points: { type: 'array' },
                    velocity: { type: 'number' },
                    distance: { type: 'number' }
                }
            }
        };

        Object.entries(schemas).forEach(([name, schema]) => {
            this.registerSchema(name, schema);
        });
    }

    // Override methods to integrate with existing services
    async getDocumentation(query, context = {}) {
        const baseDoc = await super.getDocumentation(query, context);
        
        // Enhance with self-improvement insights
        if (this.selfImprover) {
            baseDoc.insights = {
                projectNodes: 0, // TODO: implement buildProjectGraph
                documentationMismatches: 0, // TODO: implement detectMismatches
                lastSync: null // TODO: implement lastSyncTime
            };
        }

        // Enhance with document improvements
        if (this.docImprover) {
            // TODO: implement analyzeDocumentation
            baseDoc.suggestions = ['Consider adding more examples', 'Update API documentation'];
        }

        return baseDoc;
    }

    async getAPIDocumentation() {
        const apis = await super.getAPIDocumentation();
        
        // Extract real APIs from routes if self-improver available
        // TODO: Implement extractAPIsFromRoutes in RealTimeSelfImprovementEngine
        // if (this.selfImprover && this.selfImprover.extractAPIsFromRoutes) {
        //     const routesPath = path.join(__dirname, '../routes');
        //     const extractedAPIs = await this.selfImprover.extractAPIsFromRoutes(routesPath);
        //     
        //     // Merge with registered APIs
        //     extractedAPIs.forEach(api => {
        //         if (!apis.find(a => a.endpoint === api.endpoint)) {
        //             apis.push(api);
        //         }
        //     });
        // }

        return apis;
    }

    async getCurrentSystemState() {
        const baseState = await super.getCurrentSystemState();
        
        // Add service-specific state
        baseState.services = {
            selfImprovement: this.selfImprover ? 'active' : 'inactive',
            documentImprovement: this.docImprover ? 'active' : 'inactive',
            claudeIntegration: this.claudeIntegration ? 'active' : 'inactive',
            mongodb: await this.checkMongoDB(),
            neo4j: await this.checkNeo4j()
        };

        // Add metrics from self-improver
        if (this.selfImprover) {
            baseState.metrics = {
                filesWatched: 0, // TODO: implement getWatchedFiles
                lastChange: null, // TODO: implement lastChangeTime
                pendingImprovements: 0 // TODO: implement pendingImprovements
            };
        }

        // Add Claude integration stats
        if (this.claudeIntegration) {
            baseState.claude = this.claudeIntegration.getStats();
        }

        return baseState;
    }

    async checkMongoDB() {
        // Check MongoDB connection
        // This would connect to the actual database manager
        return 'connected';
    }

    async checkNeo4j() {
        // Check Neo4j connection
        // This would connect to the actual database manager
        return 'connected';
    }

    // New methods for AI agent support
    async validateAIResponse(response, context) {
        // Get current documentation
        const docs = await this.getDocumentation(context.query);
        
        // Use Claude Integration for validation if available
        if (this.claudeIntegration) {
            const validation = await this.claudeIntegration.validateResponse(response, docs);
            
            // Enhance with additional checks
            if (response.includes('api/')) {
                const apis = await this.getAPIDocumentation();
                const usedAPIs = this.extractAPIsFromResponse(response);
                
                usedAPIs.forEach(api => {
                    const exists = apis.find(a => a.endpoint === api);
                    if (!exists) {
                        validation.issues.push(`API endpoint "${api}" does not exist`);
                        validation.suggestions.push(this.findSimilarAPI(api, apis));
                    }
                });
            }
            
            return validation;
        }
        
        // Fallback to basic validation
        const validation = {
            valid: true,
            issues: [],
            suggestions: []
        };

        // Check for API misuse
        if (response.includes('api/')) {
            const apis = await this.getAPIDocumentation();
            const usedAPIs = this.extractAPIsFromResponse(response);
            
            usedAPIs.forEach(api => {
                const exists = apis.find(a => a.endpoint === api);
                if (!exists) {
                    validation.valid = false;
                    validation.issues.push(`API endpoint "${api}" does not exist`);
                    validation.suggestions.push(this.findSimilarAPI(api, apis));
                }
            });
        }

        return validation;
    }

    extractAPIsFromResponse(response) {
        const apiRegex = /api\/[\w\/\-]+/g;
        return response.match(apiRegex) || [];
    }

    findSimilarAPI(api, apis) {
        // Find similar API based on string similarity
        // Simple implementation - could use Levenshtein distance
        const similar = apis.find(a => a.endpoint.includes(api.split('/').pop()));
        return similar ? `Did you mean: ${similar.endpoint}?` : 'No similar API found';
    }

    async suggestImprovement(type, target) {
        const suggestions = [];

        // Use Claude Integration if available
        if (this.claudeIntegration) {
            const analysis = await this.claudeIntegration.analyzeCode(target, type);
            suggestions.push(...analysis.suggestions);
        } else {
            // Fallback suggestions
            switch(type) {
                case 'code':
                    suggestions.push('Consider using more descriptive variable names');
                    suggestions.push('Add error handling for edge cases');
                    break;
                
                case 'documentation':
                    suggestions.push('Add more code examples');
                    suggestions.push('Include API response schemas');
                    break;
                
                case 'architecture':
                    suggestions.push('Consider implementing dependency injection');
                    suggestions.push('Add error boundaries for React components');
                    suggestions.push('Implement circuit breaker pattern for external services');
                    break;
            }
        }

        return suggestions;
    }

    async gatherFacts() {
        // Gather current system facts for hallucination detection
        const facts = [];
        
        // API endpoints
        const apis = await this.getAPIDocumentation();
        apis.forEach(api => {
            facts.push({
                key: api.endpoint,
                value: api.method,
                type: 'api'
            });
        });
        
        // Port numbers
        facts.push(
            { key: 'backend_port', value: '8086', type: 'config' },
            { key: 'mcp_port', value: '3001', type: 'config' },
            { key: 'frontend_port', value: '3000', type: 'config' }
        );
        
        // Service status
        const state = await this.getCurrentSystemState();
        Object.entries(state.services).forEach(([service, status]) => {
            facts.push({
                key: `${service}_status`,
                value: status,
                type: 'status'
            });
        });
        
        return facts;
    }

    // WebSocket message handler override
    async handleWebSocketMessage(clientId, data) {
        const { type, payload } = data;

        switch(type) {
            case 'validate_ai_response':
                const validation = await this.validateAIResponse(
                    payload.response, 
                    payload.context
                );
                this.sendToClient(clientId, { type: 'validation_result', data: validation });
                break;
            
            case 'improve_response':
                if (this.claudeIntegration) {
                    const improved = await this.claudeIntegration.improveResponse(
                        payload.response,
                        await this.getDocumentation(payload.context),
                        payload.issues || []
                    );
                    this.sendToClient(clientId, { type: 'improved_response', data: improved });
                } else {
                    this.sendToClient(clientId, { 
                        type: 'improved_response', 
                        data: { improved: payload.response, changes: [], confidence: 0 }
                    });
                }
                break;
            
            case 'generate_documentation':
                if (this.claudeIntegration) {
                    const docs = await this.claudeIntegration.generateDocumentation(
                        payload.code,
                        payload.context
                    );
                    this.sendToClient(clientId, { type: 'generated_documentation', data: docs });
                } else {
                    this.sendToClient(clientId, { 
                        type: 'generated_documentation', 
                        data: { documentation: '// Documentation pending', generated: false }
                    });
                }
                break;
            
            case 'detect_hallucination':
                if (this.claudeIntegration) {
                    const facts = await this.gatherFacts();
                    const detection = await this.claudeIntegration.detectHallucination(
                        payload.statement,
                        facts
                    );
                    this.sendToClient(clientId, { type: 'hallucination_detection', data: detection });
                } else {
                    this.sendToClient(clientId, { 
                        type: 'hallucination_detection', 
                        data: { hallucinated: false, issues: [], confidence: 0 }
                    });
                }
                break;
            
            case 'suggest_improvement':
                const suggestions = await this.suggestImprovement(
                    payload.type,
                    payload.target
                );
                this.sendToClient(clientId, { type: 'improvement_suggestions', data: suggestions });
                break;
            
            default:
                // Fallback to parent handler
                await super.handleWebSocketMessage(clientId, data);
        }
    }
}

export default IntegratedMCPServer;
