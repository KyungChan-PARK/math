/**
 * Palantir Ontology System Lite
 * Simplified version without ChromaDB for stability
 * Uses Neo4j only for ontology management
 * 
 * @version 2.0.0
 * @date 2025-09-07
 */

import neo4j from 'neo4j-driver';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';
import embeddingService from './HybridEmbeddingService.js';

export class PalantirOntologySystemLite extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            neo4jUri: process.env.NEO4J_URI || 'bolt://localhost:7687',
            neo4jUser: process.env.NEO4J_USER || 'neo4j',
            neo4jPassword: process.env.NEO4J_PASSWORD || 'aeclaudemax',
            wsPort: config.wsPort || 8092,
            watchPaths: config.watchPaths || ['./src'],
            ...config
        };
        
        // Object Storage V2 - Store all domain objects
        this.objectStorage = new Map();
        
        // Metrics
        this.metrics = {
            nodesCreated: 0,
            relationsCreated: 0,
            syncOperations: 0,
            errors: 0
        };
    }

    async initialize() {
        console.log(' Initializing Palantir Ontology System Lite (No ChromaDB)...');
        
        // Initialize Neo4j
        await this.initializeNeo4j();
        
        // Setup WebSocket streaming
        this.setupWebSocketStreaming();
        
        // Setup file watching
        this.setupFileWatching();
        
        // Build initial ontology
        await this.buildInitialOntology();
        
        console.log('✅ Palantir Ontology System Lite initialized successfully');
    }

    async initializeNeo4j() {
        console.log(' Connecting to Neo4j...');
        this.driver = neo4j.driver(
            this.config.neo4jUri,
            neo4j.auth.basic(this.config.neo4jUser, this.config.neo4jPassword),
            {
                maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
                maxConnectionPoolSize: 50,
                connectionAcquisitionTimeout: 2 * 60 * 1000 // 2 minutes
            }
        );
        
        // Test connection
        const session = this.driver.session();
        try {
            await session.run('RETURN 1');
            console.log('✅ Neo4j connected successfully');
            
            // Create indexes
            await this.createIndexes();
        } finally {
            await session.close();
        }
    }

    async createIndexes() {
        const session = this.driver.session();
        try {
            // Create indexes for Object Storage V2 pattern
            await session.run(`
                CREATE INDEX IF NOT EXISTS FOR (n:Object) ON (n.id)
            `);
            await session.run(`
                CREATE INDEX IF NOT EXISTS FOR (n:Object) ON (n.type)
            `);
            await session.run(`
                CREATE INDEX IF NOT EXISTS FOR (n:Object) ON (n.timestamp)
            `);
            await session.run(`
                CREATE INDEX IF NOT EXISTS FOR (n:Document) ON (n.path)
            `);
            await session.run(`
                CREATE INDEX IF NOT EXISTS FOR (n:Code) ON (n.module)
            `);
        } finally {
            await session.close();
        }
    }

    setupWebSocketStreaming() {
        this.wss = new WebSocketServer({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log(' New WebSocket client connected');
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'initial_state',
                data: {
                    nodes: this.objectStorage.size,
                    metrics: this.metrics
                }
            }));
            
            // Handle client messages
            ws.on('message', async (message) => {
                const msg = JSON.parse(message);
                await this.handleClientMessage(ws, msg);
            });
        });
        
        console.log(`✅ WebSocket streaming server started on port ${this.config.wsPort}`);
    }

    setupFileWatching() {
        const watchOptions = {
            persistent: true,
            ignoreInitial: true,
            ignored: /(^|[\/\\])\.|node_modules|\.git/,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        };
        
        this.watcher = chokidar.watch(this.config.watchPaths, watchOptions);
        
        this.watcher
            .on('add', async (filePath) => await this.handleFileChange(filePath, 'add'))
            .on('change', async (filePath) => await this.handleFileChange(filePath, 'change'))
            .on('unlink', async (filePath) => await this.handleFileChange(filePath, 'delete'));
        
        console.log('️ File watching enabled for:', this.config.watchPaths);
    }

    async buildInitialOntology() {
        console.log('️ Building initial ontology...');
        
        const startTime = Date.now();
        let objectCount = 0;
        
        // Recursively scan directories
        const scanDirectory = async (dirPath) => {
            try {
                const entries = await fs.readdir(dirPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry.name);
                    
                    if (entry.isDirectory()) {
                        if (!entry.name.startsWith('.') && 
                            entry.name !== 'node_modules' && 
                            entry.name !== 'dist' &&
                            entry.name !== 'build') {
                            await scanDirectory(fullPath);
                        }
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name);
                        if (['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.py'].includes(ext)) {
                            await this.handleFileChange(fullPath, 'add');
                            objectCount++;
                        }
                    }
                }
            } catch (error) {
                console.error(`Error scanning directory ${dirPath}:`, error.message);
            }
        };
        
        for (const watchPath of this.config.watchPaths) {
            await scanDirectory(watchPath);
        }
        
        const duration = Date.now() - startTime;
        console.log(`✅ Initial ontology built: ${objectCount} objects in ${duration}ms`);
    }

    async handleFileChange(filePath, changeType) {
        console.log(` File ${changeType}: ${filePath}`);
        
        const startTime = Date.now();
        
        try {
            if (changeType === 'delete') {
                await this.removeObjectFromOntology(filePath);
            } else {
                const content = await fs.readFile(filePath, 'utf-8');
                await this.syncObjectToOntology(filePath, content);
            }
            
            const duration = Date.now() - startTime;
            console.log(`✅ Sync completed in ${duration}ms`);
            
            // Broadcast update to WebSocket clients
            this.broadcastUpdate({
                type: 'file_change',
                data: { path: filePath, changeType, duration }
            });
            
            this.metrics.syncOperations++;
        } catch (error) {
            console.error(`❌ Error handling file change for ${filePath}:`, error.message);
            this.metrics.errors++;
        }
    }

    async syncObjectToOntology(filePath, content) {
        const session = this.driver.session();
        
        try {
            // Generate embedding for content
            const embedding = await this.generateEmbedding(content);
            
            // Extract metadata based on file type
            const metadata = this.extractMetadata(filePath, content);
            
            // Create or update object in Neo4j
            const result = await session.run(`
                MERGE (o:Object {path: $path})
                SET o += {
                    type: $type,
                    name: $name,
                    content: $content,
                    embedding: $embedding,
                    size: $size,
                    timestamp: timestamp(),
                    imports: $imports,
                    exports: $exports
                }
                RETURN o
            `, {
                path: filePath,
                type: metadata.type,
                name: metadata.name,
                content: content.substring(0, 5000), // Store first 5000 chars
                embedding: embedding,
                size: content.length,
                imports: metadata.imports || [],
                exports: metadata.exports || []
            });
            
            // Store in local object storage
            this.objectStorage.set(filePath, {
                path: filePath,
                type: metadata.type,
                name: metadata.name,
                embedding,
                metadata,
                content: content.substring(0, 1000),
                timestamp: Date.now()
            });
            
            // Create relationships
            await this.extractAndCreateRelationships(filePath, metadata, session);
            
            this.metrics.nodesCreated++;
            
        } finally {
            await session.close();
        }
    }

    async extractAndCreateRelationships(filePath, metadata, session) {
        // Create IMPORTS relationships
        if (metadata.imports && metadata.imports.length > 0) {
            for (const importPath of metadata.imports) {
                await session.run(`
                    MATCH (source:Object {path: $sourcePath})
                    MERGE (target:Object {path: $targetPath})
                    MERGE (source)-[:IMPORTS]->(target)
                `, {
                    sourcePath: filePath,
                    targetPath: importPath
                });
                this.metrics.relationsCreated++;
            }
        }
        
        // Create semantic relationships based on similarity
        const similar = await this.findSimilarObjects(filePath);
        for (const simObj of similar) {
            await session.run(`
                MATCH (source:Object {path: $sourcePath})
                MATCH (target:Object {path: $targetPath})
                MERGE (source)-[:SIMILAR_TO {score: $score}]->(target)
            `, {
                sourcePath: filePath,
                targetPath: simObj.path,
                score: simObj.score
            });
            this.metrics.relationsCreated++;
        }
    }

    extractMetadata(filePath, content) {
        const ext = path.extname(filePath);
        const name = path.basename(filePath);
        const type = this.getFileType(ext);
        
        const metadata = {
            name,
            type,
            extension: ext
        };
        
        // Extract language-specific metadata
        if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
            metadata.imports = this.extractImports(content);
            metadata.exports = this.extractExports(content);
        } else if (ext === '.md') {
            metadata.headings = this.extractHeadings(content);
            metadata.links = this.extractLinks(content);
        } else if (ext === '.json') {
            try {
                const jsonData = JSON.parse(content);
                metadata.keys = Object.keys(jsonData);
            } catch (e) {
                // Invalid JSON
            }
        } else if (ext === '.py') {
            metadata.imports = this.extractPythonImports(content);
            metadata.functions = this.extractPythonFunctions(content);
        }
        
        return metadata;
    }

    getFileType(ext) {
        const typeMap = {
            '.js': 'JavaScript',
            '.jsx': 'React',
            '.ts': 'TypeScript',
            '.tsx': 'React TypeScript',
            '.json': 'JSON',
            '.md': 'Markdown',
            '.py': 'Python',
            '.yml': 'YAML',
            '.yaml': 'YAML'
        };
        return typeMap[ext] || 'Unknown';
    }

    extractImports(content) {
        const regex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
        const imports = [];
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        return imports;
    }

    extractExports(content) {
        const regex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
        const exports = [];
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            exports.push(match[1]);
        }
        
        return exports;
    }

    extractHeadings(content) {
        const regex = /^#{1,6}\s+(.+)$/gm;
        const headings = [];
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            headings.push(match[1]);
        }
        
        return headings;
    }

    extractLinks(content) {
        const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const links = [];
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            links.push({ text: match[1], url: match[2] });
        }
        
        return links;
    }

    extractPythonImports(content) {
        const regex = /(?:from\s+(\S+)\s+)?import\s+(.+)/g;
        const imports = [];
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            if (match[1]) {
                imports.push(match[1]);
            } else {
                imports.push(match[2].split(',')[0].trim());
            }
        }
        
        return imports;
    }

    extractPythonFunctions(content) {
        const regex = /def\s+(\w+)\s*\(/g;
        const functions = [];
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            functions.push(match[1]);
        }
        
        return functions;
    }

    async generateEmbedding(text) {
        // Use Hybrid Embedding Service (OpenAI with local fallback)
        try {
            const embedding = await embeddingService.generateEmbedding(text);
            return embedding;
        } catch (error) {
            console.error('❌ Embedding generation failed:', error.message);
            // Return zero vector as last resort
            return new Array(384).fill(0);
        }
    }

    async findSimilarObjects(path, threshold = 0.7) {
        const object = this.objectStorage.get(path);
        if (!object || !object.embedding) return [];
        
        const similar = [];
        
        // Calculate cosine similarity with all other objects
        for (const [otherPath, otherObject] of this.objectStorage.entries()) {
            if (otherPath === path || !otherObject.embedding) continue;
            
            const similarity = this.cosineSimilarity(object.embedding, otherObject.embedding);
            if (similarity >= threshold) {
                similar.push({
                    path: otherPath,
                    score: similarity
                });
            }
        }
        
        // Sort by similarity and return top 5
        return similar
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    cosineSimilarity(vec1, vec2) {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        
        if (norm1 === 0 || norm2 === 0) return 0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    async removeObjectFromOntology(path) {
        const session = this.driver.session();
        
        try {
            await session.run(`
                MATCH (o:Object {path: $path})
                DETACH DELETE o
            `, { path });
            
            this.objectStorage.delete(path);
        } finally {
            await session.close();
        }
    }

    async handleClientMessage(ws, message) {
        switch (message.type) {
            case 'query':
                const results = await this.semanticSearch(message.query);
                ws.send(JSON.stringify({
                    type: 'query_results',
                    data: results
                }));
                break;
                
            case 'get_graph':
                const graph = await this.getKnowledgeGraph();
                ws.send(JSON.stringify({
                    type: 'graph_data',
                    data: graph
                }));
                break;
                
            case 'get_metrics':
                ws.send(JSON.stringify({
                    type: 'metrics',
                    data: this.metrics
                }));
                break;
        }
    }

    async semanticSearch(query, limit = 10) {
        const session = this.driver.session();
        
        try {
            // Generate embedding for query
            const queryEmbedding = await this.generateEmbedding(query);
            
            // Calculate similarities with all objects
            const results = [];
            
            for (const [path, object] of this.objectStorage.entries()) {
                if (!object.embedding) continue;
                
                const similarity = this.cosineSimilarity(queryEmbedding, object.embedding);
                if (similarity > 0.5) {
                    results.push({
                        path,
                        score: similarity,
                        metadata: object.metadata,
                        content: object.content
                    });
                }
            }
            
            // Sort and limit results
            return results
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            
        } finally {
            await session.close();
        }
    }

    async getKnowledgeGraph() {
        const session = this.driver.session();
        
        try {
            const result = await session.run(`
                MATCH (n:Object)
                OPTIONAL MATCH (n)-[r]->(m:Object)
                RETURN n, r, m
                LIMIT 100
            `);
            
            const nodes = new Map();
            const edges = [];
            
            result.records.forEach(record => {
                const source = record.get('n');
                if (source && !nodes.has(source.properties.path)) {
                    nodes.set(source.properties.path, {
                        id: source.properties.path,
                        label: source.properties.name,
                        type: source.properties.type
                    });
                }
                
                const target = record.get('m');
                if (target && !nodes.has(target.properties.path)) {
                    nodes.set(target.properties.path, {
                        id: target.properties.path,
                        label: target.properties.name,
                        type: target.properties.type
                    });
                }
                
                const relationship = record.get('r');
                if (relationship) {
                    edges.push({
                        source: source.properties.path,
                        target: target.properties.path,
                        type: relationship.type,
                        properties: relationship.properties
                    });
                }
            });
            
            return {
                nodes: Array.from(nodes.values()),
                edges
            };
        } finally {
            await session.close();
        }
    }

    broadcastUpdate(message) {
        const messageStr = JSON.stringify(message);
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(messageStr);
            }
        });
    }

    async shutdown() {
        console.log(' Shutting down Palantir Ontology System Lite...');
        
        if (this.watcher) {
            await this.watcher.close();
        }
        
        if (this.wss) {
            this.wss.close();
        }
        
        if (this.driver) {
            await this.driver.close();
        }
        
        console.log('✅ Shutdown complete');
    }
}

// Export singleton
export default new PalantirOntologySystemLite();
