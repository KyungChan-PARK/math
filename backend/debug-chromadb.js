/**
 * Debug ChromaDB add method
 * Diagnose exactly what's causing the 422 error
 */

import { ChromaClient } from 'chromadb';
import embeddingService from './src/services/HybridEmbeddingService.js';

async function debugChromaDB() {
    console.log(' ChromaDB Debug Tool\n');
    
    try {
        // Connect to ChromaDB
        const chromaClient = new ChromaClient({
            path: 'http://localhost:8000'
        });
        
        // Get collection
        const collection = await chromaClient.getCollection({
            name: 'palantir_ontology'
        });
        
        console.log('✅ Connected to collection');
        
        // Test 1: Simple add with minimal data
        console.log('\n Test 1: Minimal add...');
        try {
            const simpleEmbedding = new Array(384).fill(0.1);
            await collection.add({
                ids: ['test-minimal'],
                embeddings: [simpleEmbedding]
            });
            console.log('✅ Minimal add successful');
        } catch (error) {
            console.error('❌ Minimal add failed:', error.message);
            if (error.response) {
                const text = await error.response.text();
                console.error('Response:', text);
            }
        }
        
        // Test 2: Add with metadata
        console.log('\n Test 2: Add with metadata...');
        try {
            const embedding = await embeddingService.generateEmbedding('test content');
            const metadata = {
                type: 'test',
                path: 'test/path',
                size: 100
            };
            
            await collection.add({
                ids: ['test-metadata'],
                embeddings: [embedding],
                metadatas: [metadata]
            });
            console.log('✅ Metadata add successful');
        } catch (error) {
            console.error('❌ Metadata add failed:', error.message);
            if (error.response) {
                const text = await error.response.text();
                console.error('Response:', text);
            }
        }
        
        // Test 3: Add with documents
        console.log('\n Test 3: Add with documents...');
        try {
            const embedding = await embeddingService.generateEmbedding('test content');
            await collection.add({
                ids: ['test-documents'],
                embeddings: [embedding],
                documents: ['This is a test document']
            });
            console.log('✅ Documents add successful');
        } catch (error) {
            console.error('❌ Documents add failed:', error.message);
            if (error.response) {
                const text = await error.response.text();
                console.error('Response:', text);
            }
        }
        
        // Test 4: Full add (like in PalantirOntologySystem)
        console.log('\n Test 4: Full add with complex metadata...');
        try {
            const embedding = await embeddingService.generateEmbedding('test content');
            const complexMetadata = {
                path: 'C:\\test\\file.js',
                type: 'Code:JavaScript',
                size: 1000,
                lines: 50,
                created: Date.now(),
                functions: ['func1', 'func2'],
                imports: ['module1'],
                exports: ['export1']
            };
            
            await collection.add({
                ids: ['test-complex'],
                embeddings: [embedding],
                metadatas: [complexMetadata],
                documents: ['Complex test document content']
            });
            console.log('✅ Complex add successful');
        } catch (error) {
            console.error('❌ Complex add failed:', error.message);
            if (error.response) {
                const text = await error.response.text();
                console.error('Response body:', text);
            }
        }
        
        // Check collection count
        const count = await collection.count();
        console.log(`\n Collection now has ${count} items`);
        
        // Clean up test data
        console.log('\n Cleaning up test data...');
        const testIds = ['test-minimal', 'test-metadata', 'test-documents', 'test-complex'];
        for (const id of testIds) {
            try {
                await collection.delete({ ids: [id] });
            } catch (e) {
                // Ignore if doesn't exist
            }
        }
        
        console.log('✅ Debug complete');
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run debug
debugChromaDB();
