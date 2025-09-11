/**
 * Reset ChromaDB Collection
 * Deletes and recreates the palantir_ontology collection
 * Fixes dimension mismatch issues
 */

import { ChromaClient } from 'chromadb';
import embeddingService from './HybridEmbeddingService.js';

async function resetChromaDBCollection() {
    console.log(' Starting ChromaDB collection reset...\n');
    
    try {
        // Initialize ChromaDB client
        const chromaUrl = 'http://localhost:8000';  // Fixed: Use localhost when running from host
        const chromaClient = new ChromaClient({
            path: chromaUrl
        });
        
        console.log(` Connected to ChromaDB at ${chromaUrl}`);
        
        // Test embedding generation to get actual dimensions
        const testText = 'Test embedding for dimension check';
        const testEmbedding = await embeddingService.generateEmbedding(testText);
        const actualDimensions = testEmbedding.length;
        
        console.log(` Detected embedding dimensions: ${actualDimensions}`);
        
        // Try to delete existing collection
        try {
            await chromaClient.deleteCollection({
                name: 'palantir_ontology'
            });
            console.log('️ Deleted existing palantir_ontology collection');
        } catch (error) {
            console.log('ℹ️ Collection does not exist or already deleted');
        }
        
        // Create new collection with correct settings
        const collection = await chromaClient.createCollection({
            name: 'palantir_ontology',
            metadata: { 
                'hnsw:space': 'cosine',
                'dimensions': actualDimensions.toString()
            }
        });
        
        console.log('✅ Created new palantir_ontology collection');
        
        // Test the collection with sample data
        console.log('\n Testing collection with sample data...');
        
        await collection.add({
            ids: ['test-1'],
            embeddings: [testEmbedding],
            metadatas: [{ type: 'test', created: Date.now() }],
            documents: ['This is a test document']
        });
        
        // Test query with correct API format
        const results = await collection.query({
            queryEmbeddings: [testEmbedding],  // Using camelCase
            nResults: 1  // Using camelCase
        });
        
        if (results.ids && results.ids[0] && results.ids[0][0] === 'test-1') {
            console.log('✅ Collection test successful!');
            console.log('   Query returned expected result');
        }
        
        // Clean up test data
        await collection.delete({
            ids: ['test-1']
        });
        console.log(' Cleaned up test data');
        
        // Summary
        console.log('\n Summary:');
        console.log(`   Collection: palantir_ontology`);
        console.log(`   Dimensions: ${actualDimensions}`);
        console.log(`   Similarity: cosine`);
        console.log(`   Status: Ready for use`);
        
        console.log('\n✅ ChromaDB collection reset complete!');
        console.log(' You can now restart the backend server');
        
    } catch (error) {
        console.error('\n❌ Error resetting ChromaDB collection:', error);
        console.error('Details:', error.message);
        
        // Provide troubleshooting tips
        console.log('\n Troubleshooting tips:');
        console.log('1. Check if ChromaDB is running: docker ps | grep chromadb');
        console.log('2. Check ChromaDB logs: docker logs chromadb');
        console.log('3. Verify ChromaDB URL: http://localhost:8000');
        console.log('4. Try restarting ChromaDB: docker-compose restart chromadb');
        
        process.exit(1);
    }
}

// Run the reset
resetChromaDBCollection().catch(console.error);
