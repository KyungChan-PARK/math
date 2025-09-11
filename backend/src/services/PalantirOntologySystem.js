/**
 * Palantir-Style Ontology System
 * Real-time document-code synchronization with Neo4j GraphRAG
 * Based on Object Storage V2 architecture patterns
 * 
 * @version 2.0.0
 * @date 2025-09-06
 */

import neo4j from 'neo4j-driver';
import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import chokidar from 'chokidar';
import { WebSocketServer } from 'ws';
import { ChromaClient } from 'chromadb';
import embeddingService from './HybridEmbeddingService.js';
// import * as tf from '@tensorflow/tfjs-node'; // Commented out - not needed yet

export class PalantirOntologySystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Core configuration
        this.config = {
            neo4jUri: config.neo4jUri || 'bolt://localhost:7687',
            neo4jUser: config.neo4jUser || 'neo4j',
            neo4jPassword: config.neo4jPassword || 'aeclaudemax',
            watchPaths: config.watchPaths || ['C:\\palantir\\math'],
            wsPort: config.wsPort || 8091,
            streamingEnabled: config.streamingEnabled !== false,
            vectorDimensions: config.vectorDimensions || 768,
            ...config
        };

        // Object Storage V2 components
        this.objectStorage = new Map(); // In-memory cache
        this.changelogStream = []; // Changelog for streaming
        this.semanticLayer = null; // Semantic search layer
        this.driver = null;
        this.wss = null;
        this.watcher = null;
        this.chromaClient = null;
        
        // Metrics
        this.metrics = {
            nodesCreated: 0,
            relationsCreated: 0,
            streamEvents: 0,
            syncLatency: [],
            lastSync: null
        };

        this.initialize();
    }

    async initialize() {
        console.log(' Initializing Palantir-Style Ontology System...');
        
        // 1. Connect to Neo4j
        await this.connectNeo4j();
        
        // 2. Initialize Semantic Layer
        await this.initializeSemanticLayer();
        
        // 3. Setup WebSocket streaming
        if (this.config.streamingEnabled) {
            this.setupWebSocketStreaming();
        }
        
        // 4. Setup file watching
        this.setupFileWatching();
        
        // 5. Build initial ontology
        await this.buildInitialOntology();
        
        console.log('✅ Palantir Ontology System initialized successfully');
        this.emit('initialized', this.metrics);
    }

    async connectNeo4j() {
        try {
            this.driver = neo4j.driver(
                this.config.neo4jUri,
                neo4j.auth.basic(this.config.neo4jUser, this.config.neo4jPassword)
            );
            
            // Test connection
            const session = this.driver.session();
            await session.run('RETURN 1');
            await session.close();
            
            console.log('✅ Connected to Neo4j');
            
            // Create indexes for performance
            await this.createIndexes();
            
        } catch (error) {
            console.error('❌ Neo4j connection failed:', error);
            throw error;
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
            
            // Note: Vector index requires Neo4j 5.x with vector plugin
            // Uncomment when vector support is available
            /*
            await session.run(`
                CREATE VECTOR INDEX IF NOT EXISTS objectEmbeddings
                FOR (n:Object) ON (n.embedding)
                OPTIONS {indexConfig: {
                    \`vector.dimensions\`: ${this.config.vectorDimensions},
                    \`vector.similarity_function\`: 'cosine'
                }}
            `);
            */
        } finally {
            await session.close();
        }
    }

    async initializeSemanticLayer() {
        console.log(' Initializing Semantic Layer...');
        
        // Initialize ChromaDB for vector storage
        const chromaUrl = this.config.chromaUri || 'http://localhost:8000';
        this.chromaClient = new ChromaClient({
            path: chromaUrl
        });
        
        // Always try to get the existing collection first
        try {
            this.semanticLayer = await this.chromaClient.getCollection({
                name: 'palantir_ontology'
            });
            console.log('✅ Using existing palantir_ontology collection');
            
            // Get collection info
            const count = await this.semanticLayer.count();
            console.log(`   Collection has ${count} items`);
        } catch (error) {
            // Collection doesn't exist, create it
            console.log(' Creating new palantir_ontology collection...');
            this.semanticLayer = await this.chromaClient.createCollection({
                name: 'palantir_ontology',
                metadata: { 'hnsw:space': 'cosine' }
            });
        }
        
        console.log('✅ Semantic Layer initialized with ChromaDB at', chromaUrl);
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
                stabilityThreshold: 500,
                pollInterval: 100
            }
        };

        this.watcher = chokidar.watch(this.config.watchPaths, watchOptions);
        
        // File change events (Ontology Streaming pattern)
        this.watcher
            .on('add', path => this.handleFileChange('add', path))
            .on('change', path => this.handleFileChange('change', path))
            .on('unlink', path => this.handleFileChange('remove', path));
        
        console.log('✅ File watching enabled for:', this.config.watchPaths);
    }

    async handleFileChange(event, path) {
        const startTime = Date.now();
        console.log(` File ${event}: ${path}`);
        
        // Create changelog entry (Object Storage V2 pattern)
        const changelogEntry = {
            id: createHash('md5').update(path + Date.now()).digest('hex'),
            event,
            path,
            timestamp: Date.now(),
            version: this.changelogStream.length + 1
        };
        
        this.changelogStream.push(changelogEntry);
        
        // Process based on event type
        switch (event) {
            case 'add':
            case 'change':
                await this.syncObjectToOntology(path, changelogEntry);
                break;
            case 'remove':
                await this.removeObjectFromOntology(path);
                break;
        }
        
        // Stream update to connected clients
        this.broadcastUpdate({
            type: 'changelog',
            data: changelogEntry
        });
        
        // Update metrics
        const latency = Date.now() - startTime;
        this.metrics.syncLatency.push(latency);
        this.metrics.lastSync = Date.now();
        this.metrics.streamEvents++;
        
        console.log(`✅ Sync completed in ${latency}ms`);
    }

    async syncObjectToOntology(path, changelog) {
        const session = this.driver.session();
        
        try {
            // Read file content
            const fs = await import('fs/promises');
            const content = await fs.readFile(path, 'utf-8');
            
            // Generate embeddings for semantic search
            const embedding = await this.generateEmbedding(content);
            
            // Detect object type
            const objectType = this.detectObjectType(path, content);
            
            // Extract metadata
            const metadata = await this.extractMetadata(path, content, objectType);
            
            // Create or update object in Neo4j (Object Storage V2 pattern)
            const result = await session.run(`
                MERGE (o:Object {path: $path})
                SET o += {
                    type: $type,
                    content: $content,
                    embedding: $embedding,
                    metadata: $metadata,
                    version: $version,
                    timestamp: $timestamp,
                    lastModified: timestamp()
                }
                WITH o
                MERGE (c:Changelog {version: $version})
                SET c += {
                    event: $event,
                    timestamp: $timestamp
                }
                MERGE (o)-[:HAS_VERSION]->(c)
                RETURN o
            `, {
                path,
                type: objectType,
                content: content.substring(0, 5000), // Limit content size
                embedding,
                metadata: JSON.stringify(metadata),
                version: changelog.version,
                timestamp: changelog.timestamp,
                event: changelog.event
            });
            
            // Update semantic layer
            await this.updateSemanticLayer(path, content, embedding, metadata);
            
            // Extract and create relationships
            await this.extractAndCreateRelationships(path, content, objectType, metadata);
            
            // Cache in Object Storage
            this.objectStorage.set(path, {
                type: objectType,
                metadata,
                embedding,
                version: changelog.version,
                timestamp: changelog.timestamp
            });
            
            this.metrics.nodesCreated++;
            
        } catch (error) {
            console.error(`❌ Error syncing ${path}:`, error);
        } finally {
            await session.close();
        }
    }

    detectObjectType(path, content) {
        // Intelligent type detection based on file extension and content
        const ext = path.split('.').pop().toLowerCase();
        
        const typeMap = {
            'js': 'Code:JavaScript',
            'ts': 'Code:TypeScript',
            'py': 'Code:Python',
            'md': 'Document:Markdown',
            'json': 'Config:JSON',
            'yaml': 'Config:YAML',
            'yml': 'Config:YAML',
            'html': 'View:HTML',
            'css': 'Style:CSS',
            'jsx': 'Code:React',
            'tsx': 'Code:React'
        };
        
        return typeMap[ext] || 'Object:Unknown';
    }

    async extractMetadata(path, content, type) {
        const metadata = {
            path,
            type,
            size: Buffer.byteLength(content, 'utf8'),
            lines: content.split('\n').length,
            created: Date.now()
        };
        
        // Extract type-specific metadata
        if (type.startsWith('Code:')) {
            metadata.functions = this.extractFunctions(content);
            metadata.classes = this.extractClasses(content);
            metadata.imports = this.extractImports(content);
            metadata.exports = this.extractExports(content);
        } else if (type.startsWith('Document:')) {
            metadata.headings = this.extractHeadings(content);
            metadata.links = this.extractLinks(content);
            metadata.codeBlocks = this.extractCodeBlocks(content);
        }
        
        return metadata;
    }

    extractFunctions(content) {
        const regex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=]*)=>)/g;
        const functions = [];
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            functions.push(match[1] || match[2]);
        }
        
        return functions;
    }

    extractClasses(content) {
        const regex = /class\s+(\w+)/g;
        const classes = [];
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            classes.push(match[1]);
        }
        
        return classes;
    }

    extractImports(content) {
        const regex = /import\s+(?:{[^}]+}|[\w]+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
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

    extractCodeBlocks(content) {
        const regex = /```(\w+)?\n([\s\S]*?)```/g;
        const codeBlocks = [];
        let match;
        
        while ((match = regex.exec(content)) !== null) {
            codeBlocks.push({ language: match[1] || 'plain', code: match[2] });
        }
        
        return codeBlocks;
    }

    async extractAndCreateRelationships(path, content, type, metadata) {
        const session = this.driver.session();
        
        try {
            // Create relationships based on imports/exports
            if (metadata.imports) {
                for (const importPath of metadata.imports) {
                    await session.run(`
                        MATCH (source:Object {path: $sourcePath})
                        MERGE (target:Object {path: $targetPath})
                        MERGE (source)-[:IMPORTS]->(target)
                    `, {
                        sourcePath: path,
                        targetPath: importPath
                    });
                }
            }
            
            // Create semantic relationships
            const similarObjects = await this.findSimilarObjects(path);
            for (const similar of similarObjects) {
                await session.run(`
                    MATCH (source:Object {path: $sourcePath})
                    MATCH (target:Object {path: $targetPath})
                    MERGE (source)-[:SIMILAR_TO {score: $score}]->(target)
                `, {
                    sourcePath: path,
                    targetPath: similar.path,
                    score: similar.score
                });
            }
            
            this.metrics.relationsCreated += metadata.imports?.length || 0;
            this.metrics.relationsCreated += similarObjects.length;
            
        } finally {
            await session.close();
        }
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

    async updateSemanticLayer(path, content, embedding, metadata) {
        try {
            // Validate embedding
            if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
                console.warn(`️ Invalid embedding for ${path}, skipping ChromaDB update`);
                return;
            }
            
            // Ensure all values are numbers
            const validEmbedding = embedding.map(v => {
                const num = Number(v);
                return isNaN(num) ? 0 : num;
            });
            
            // Fix metadata for ChromaDB (no arrays allowed)
            const chromaMetadata = {};
            for (const [key, value] of Object.entries(metadata)) {
                if (Array.isArray(value)) {
                    // Convert arrays to JSON strings
                    chromaMetadata[key] = JSON.stringify(value);
                } else if (typeof value === 'object' && value !== null) {
                    // Convert objects to JSON strings
                    chromaMetadata[key] = JSON.stringify(value);
                } else {
                    // Keep primitives as-is
                    chromaMetadata[key] = value;
                }
            }
            
            // First try to delete if exists (ChromaDB doesn't have upsert)
            try {
                await this.semanticLayer.delete({
                    ids: [path]
                });
            } catch (deleteError) {
                // Item doesn't exist, that's fine
            }
            
            // Now add the new/updated item
            await this.semanticLayer.add({
                ids: [path],
                embeddings: [validEmbedding],
                metadatas: [chromaMetadata],  // Use serialized metadata
                documents: [content.substring(0, 1000)]
            });
            
            console.log(`✅ Added to ChromaDB: ${path}`);
        } catch (error) {
            console.error(`❌ ChromaDB error for ${path}:`, error.message);
            // Continue without ChromaDB for now
        }
    }

    async findSimilarObjects(path, threshold = 0.7) {
        const object = this.objectStorage.get(path);
        if (!object || !object.embedding) return [];
        
        const results = await this.semanticLayer.query({
            queryEmbeddings: [object.embedding],  // Fixed: camelCase for JS client
            nResults: 5  // Fixed: camelCase for JS client
        });
        
        return results.ids[0]
            .map((id, index) => ({
                path: id,
                score: 1 - results.distances[0][index]
            }))
            .filter(r => r.path !== path && r.score >= threshold);
    }

    async removeObjectFromOntology(path) {
        const session = this.driver.session();
        
        try {
            await session.run(`
                MATCH (o:Object {path: $path})
                DETACH DELETE o
            `, { path });
            
            this.objectStorage.delete(path);
            
            await this.semanticLayer.delete({
                ids: [path]
            });
            
        } finally {
            await session.close();
        }
    }

    async buildInitialOntology() {
        console.log('️ Building initial ontology...');
        
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const scanDirectory = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    await scanDirectory(fullPath);
                } else if (entry.isFile()) {
                    await this.handleFileChange('add', fullPath);
                }
            }
        };
        
        for (const watchPath of this.config.watchPaths) {
            await scanDirectory(watchPath);
        }
        
        console.log(`✅ Initial ontology built: ${this.objectStorage.size} objects`);
    }

    broadcastUpdate(update) {
        if (!this.wss) return;
        
        const message = JSON.stringify(update);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    async handleClientMessage(ws, message) {
        switch (message.type) {
            case 'query':
                const results = await this.queryOntology(message.query);
                ws.send(JSON.stringify({ type: 'query_result', data: results }));
                break;
                
            case 'subscribe':
                // Client subscribes to specific object changes
                ws.subscriptions = message.objects;
                break;
                
            case 'get_metrics':
                ws.send(JSON.stringify({ type: 'metrics', data: this.metrics }));
                break;
        }
    }

    async queryOntology(query) {
        const session = this.driver.session();
        
        try {
            // GraphRAG pattern - combine graph traversal with semantic search
            const semanticResults = await this.semanticLayer.query({
                queryTexts: [query],  // Fixed: camelCase for JS client
                nResults: 10  // Fixed: camelCase for JS client
            });
            
            const paths = semanticResults.ids[0];
            
            const result = await session.run(`
                MATCH (o:Object)
                WHERE o.path IN $paths
                OPTIONAL MATCH (o)-[r]-(related)
                RETURN o, collect(DISTINCT {
                    relation: type(r),
                    object: related.path
                }) as relationships
            `, { paths });
            
            return result.records.map(record => ({
                object: record.get('o').properties,
                relationships: record.get('relationships')
            }));
            
        } finally {
            await session.close();
        }
    }

    async semanticSearch(query, limit = 10) {
        try {
            if (!this.semanticLayer) {
                throw new Error('Semantic layer not initialized');
            }
            
            // Generate embedding for query
            const queryEmbedding = await this.generateEmbedding(query);
            
            // Search in ChromaDB
            const results = await this.semanticLayer.query({
                queryEmbeddings: [queryEmbedding],  // Fixed: camelCase for JS client
                nResults: limit  // Fixed: camelCase for JS client
            });
            
            // Format results
            if (results && results.ids && results.ids[0]) {
                return results.ids[0].map((id, index) => ({
                    path: id,
                    score: results.distances ? (1 - results.distances[0][index]) : 0,
                    metadata: results.metadatas ? results.metadatas[0][index] : {},
                    document: results.documents ? results.documents[0][index] : ''
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Semantic search error:', error);
            return [];
        }
    }
    
    async performFullSync() {
        console.log(' Performing full synchronization...');
        
        try {
            // Clear existing metrics
            this.metrics.nodesCreated = 0;
            this.metrics.relationsCreated = 0;
            
            // Build the initial ontology (scan all files)
            await this.buildInitialOntology();
            
            console.log('✅ Full sync complete:', {
                nodes: this.metrics.nodesCreated,
                relations: this.metrics.relationsCreated,
                objects: this.objectStorage.size
            });
            
            return {
                success: true,
                nodes: this.metrics.nodesCreated,
                relations: this.metrics.relationsCreated,
                objects: this.objectStorage.size
            };
        } catch (error) {
            console.error('❌ Full sync failed:', error);
            throw error;
        }
    }
    
    async getOntologyStats() {
        const session = this.driver.session();
        
        try {
            const result = await session.run(`
                MATCH (n:Object)
                WITH count(n) as nodeCount
                MATCH ()-[r]->()
                RETURN nodeCount, count(r) as relationCount
            `);
            
            const record = result.records[0];
            
            return {
                nodes: record.get('nodeCount').toNumber(),
                relations: record.get('relationCount').toNumber(),
                cached: this.objectStorage.size,
                changelog: this.changelogStream.length,
                metrics: this.metrics
            };
            
        } finally {
            await session.close();
        }
    }

    async shutdown() {
        console.log(' Shutting down Palantir Ontology System...');
        
        if (this.watcher) await this.watcher.close();
        if (this.wss) this.wss.close();
        if (this.driver) await this.driver.close();
        
        console.log('✅ Shutdown complete');
    }
}

// Export for use
export default PalantirOntologySystem;