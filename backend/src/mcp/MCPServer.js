/**
 * MCP (Model Context Protocol) Server Implementation
 * Provides real-time documentation and context for AI agents
 * Context7-style architecture for preventing hallucinations
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import chokidar from 'chokidar';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MCPServer extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            name: config.name || 'math-education-mcp',
            version: config.version || '1.0.0',
            description: config.description || 'Real-time documentation for AI Math Education System',
            port: config.port || 3001,
            ...config
        };

        this.app = express();
        this.server = null;
        this.wss = null;
        this.clients = new Set();
        this.documentCache = new Map();
        this.apiRegistry = new Map();
        this.schemaRegistry = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/mcp/health', (req, res) => {
            res.json({
                status: 'healthy',
                name: this.config.name,
                version: this.config.version,
                connectedClients: this.clients.size,
                cachedDocuments: this.documentCache.size,
                registeredAPIs: this.apiRegistry.size
            });
        });

        // Get documentation
        this.app.post('/mcp/documentation', async (req, res) => {
            const { query, context } = req.body;
            const documentation = await this.getDocumentation(query, context);
            res.json(documentation);
        });

        // Get API specifications
        this.app.get('/mcp/apis', async (req, res) => {
            const apis = await this.getAPIDocumentation();
            res.json(apis);
        });

        // Get schemas
        this.app.get('/mcp/schemas', async (req, res) => {
            const schemas = await this.getSchemas();
            res.json(schemas);
        });

        // Get system state
        this.app.get('/mcp/state', async (req, res) => {
            const state = await this.getCurrentSystemState();
            res.json(state);
        });

        // Register new API endpoint
        this.app.post('/mcp/register-api', (req, res) => {
            const { endpoint, method, description, params, response } = req.body;
            this.registerAPI(endpoint, { method, description, params, response });
            res.json({ success: true, message: 'API registered successfully' });
        });

        // Validate AI response endpoint
        this.app.post('/mcp/validate', async (req, res) => {
            const { response, context } = req.body;
            const validation = await this.validateAIResponse(response, context);
            res.json(validation);
        });

        // Improve AI response endpoint
        this.app.post('/mcp/improve', async (req, res) => {
            const { response, documentation, issues } = req.body;
            const improved = await this.improveResponse(response, documentation, issues);
            res.json(improved);
        });

        // Generate documentation endpoint
        this.app.post('/mcp/generate-docs', async (req, res) => {
            const { code, context } = req.body;
            const docs = await this.generateDocumentation(code, context);
            res.json(docs);
        });

        // Detect hallucination endpoint
        this.app.post('/mcp/detect-hallucination', async (req, res) => {
            const { statement, facts } = req.body;
            const detection = await this.detectHallucination(statement, facts);
            res.json(detection);
        });
    }

    async start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.config.port, () => {
                console.log(`MCP Server running on port ${this.config.port}`);
                this.setupWebSocket();
                this.setupFileWatchers();
                resolve();
            });
        });
    }

    setupWebSocket() {
        this.wss = new WebSocketServer({ server: this.server });

        this.wss.on('connection', (ws) => {
            const clientId = this.generateClientId();
            this.clients.add({ id: clientId, ws });

            console.log(`MCP Client connected: ${clientId}`);

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(clientId, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        error: 'Invalid message format',
                        details: error.message
                    }));
                }
            });

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(`MCP Client disconnected: ${clientId}`);
            });

            // Send initial state
            ws.send(JSON.stringify({
                type: 'connected',
                clientId,
                config: this.config
            }));
        });
    }

    async handleWebSocketMessage(clientId, data) {
        const { type, payload } = data;

        switch(type) {
            case 'get_documentation':
                const docs = await this.getDocumentation(payload.query);
                this.sendToClient(clientId, { type: 'documentation', data: docs });
                break;
            
            case 'get_context':
                const context = await this.getCodeContext(payload.modulePath);
                this.sendToClient(clientId, { type: 'context', data: context });
                break;
            
            case 'subscribe':
                // Subscribe to real-time updates
                this.subscribeClient(clientId, payload.topics);
                break;
            
            default:
                this.sendToClient(clientId, { 
                    type: 'error', 
                    message: `Unknown message type: ${type}` 
                });
        }
    }

    setupFileWatchers() {
        // Watch for code changes
        const srcWatcher = chokidar.watch([
            path.join(__dirname, '../../**/*.js'),
            path.join(__dirname, '../../**/*.json')
        ], { ignored: /node_modules/ });

        srcWatcher.on('change', async (filepath) => {
            await this.handleFileChange(filepath);
        });

        // Watch for documentation changes
        const docWatcher = chokidar.watch([
            path.join(__dirname, '../../../*.md'),
            path.join(__dirname, '../../../**/*.md')
        ], { ignored: /node_modules/ });

        docWatcher.on('change', async (filepath) => {
            await this.handleDocumentationChange(filepath);
        });
    }

    async handleFileChange(filepath) {
        console.log(`File changed: ${filepath}`);
        
        // Extract API changes if in routes folder
        if (filepath.includes('routes')) {
            await this.updateAPIRegistry(filepath);
        }

        // Broadcast change to all clients
        this.broadcast({
            type: 'file_changed',
            filepath,
            timestamp: Date.now()
        });
    }

    async handleDocumentationChange(filepath) {
        console.log(`Documentation changed: ${filepath}`);
        
        // Update document cache
        const content = await fs.readFile(filepath, 'utf8');
        this.documentCache.set(filepath, {
            content,
            lastModified: Date.now()
        });

        // Broadcast to clients
        this.broadcast({
            type: 'documentation_changed',
            filepath,
            timestamp: Date.now()
        });
    }

    // Core MCP Methods
    async getDocumentation(query, context = {}) {
        return {
            apis: await this.getAPIDocumentation(),
            schemas: await this.getSchemas(),
            examples: await this.getExamples(query),
            relevantDocs: await this.findRelevantDocumentation(query),
            currentState: await this.getCurrentSystemState()
        };
    }

    async getAPIDocumentation() {
        const apis = [];
        for (const [endpoint, details] of this.apiRegistry) {
            apis.push({
                endpoint,
                ...details,
                examples: await this.generateExamples(endpoint)
            });
        }
        return apis;
    }

    async getSchemas() {
        return Array.from(this.schemaRegistry.entries()).map(([name, schema]) => ({
            name,
            schema
        }));
    }

    async getExamples(query) {
        // Generate relevant examples based on query
        return [
            {
                description: 'Create a triangle',
                code: `fetch('/api/shapes', {
                    method: 'POST',
                    body: JSON.stringify({ type: 'triangle', size: 100 })
                })`
            }
        ];
    }

    async findRelevantDocumentation(query) {
        const relevantDocs = [];
        for (const [filepath, doc] of this.documentCache) {
            if (doc.content.toLowerCase().includes(query.toLowerCase())) {
                relevantDocs.push({
                    filepath,
                    snippet: this.extractSnippet(doc.content, query),
                    lastModified: doc.lastModified
                });
            }
        }
        return relevantDocs;
    }

    extractSnippet(content, query, contextLines = 2) {
        const lines = content.split('\n');
        const queryLower = query.toLowerCase();
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(queryLower)) {
                const start = Math.max(0, i - contextLines);
                const end = Math.min(lines.length, i + contextLines + 1);
                return lines.slice(start, end).join('\n');
            }
        }
        
        return content.slice(0, 200) + '...';
    }

    async getCurrentSystemState() {
        return {
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                clients: this.clients.size
            },
            cache: {
                documents: this.documentCache.size,
                apis: this.apiRegistry.size,
                schemas: this.schemaRegistry.size
            },
            timestamp: Date.now()
        };
    }

    async getCodeContext(modulePath) {
        try {
            const content = await fs.readFile(modulePath, 'utf8');
            return {
                path: modulePath,
                content,
                dependencies: this.extractDependencies(content),
                exports: this.extractExports(content)
            };
        } catch (error) {
            return {
                error: `Could not read module: ${error.message}`
            };
        }
    }

    extractDependencies(content) {
        const imports = [];
        const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return imports;
    }

    extractExports(content) {
        const exports = [];
        const exportRegex = /export\s+(default\s+)?(class|function|const|let|var)\s+(\w+)/g;
        let match;
        while ((match = exportRegex.exec(content)) !== null) {
            exports.push({
                type: match[2],
                name: match[3],
                isDefault: !!match[1]
            });
        }
        return exports;
    }

    registerAPI(endpoint, details) {
        this.apiRegistry.set(endpoint, {
            ...details,
            registeredAt: Date.now()
        });
        
        // Notify all clients
        this.broadcast({
            type: 'api_registered',
            endpoint,
            details
        });
    }

    registerSchema(name, schema) {
        this.schemaRegistry.set(name, schema);
        
        this.broadcast({
            type: 'schema_registered',
            name,
            schema
        });
    }

    generateClientId() {
        return `mcp-client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    sendToClient(clientId, message) {
        for (const client of this.clients) {
            if (client.id === clientId) {
                client.ws.send(JSON.stringify(message));
                break;
            }
        }
    }

    broadcast(message) {
        const messageStr = JSON.stringify(message);
        for (const client of this.clients) {
            client.ws.send(messageStr);
        }
    }

    subscribeClient(clientId, topics) {
        // Store subscription preferences
        for (const client of this.clients) {
            if (client.id === clientId) {
                client.subscriptions = topics;
                break;
            }
        }
    }

    async generateExamples(endpoint) {
        // Generate examples based on endpoint pattern
        return [];
    }

    async updateAPIRegistry(filepath) {
        // Parse file and extract API endpoints
        // This would use AST parsing in production
    }

    // Validation methods (can be overridden by IntegratedMCPServer)
    async validateAIResponse(response, context) {
        return {
            valid: true,
            issues: [],
            suggestions: []
        };
    }

    async improveResponse(response, documentation, issues) {
        return {
            improved: response,
            changes: [],
            confidence: 0
        };
    }

    async generateDocumentation(code, context) {
        return {
            documentation: '// Documentation pending',
            generated: false
        };
    }

    async detectHallucination(statement, facts) {
        return {
            hallucinated: false,
            issues: [],
            confidence: 0
        };
    }

    async stop() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    console.log('MCP Server stopped');
                    resolve();
                });
            });
        }
    }
}

export default MCPServer;
