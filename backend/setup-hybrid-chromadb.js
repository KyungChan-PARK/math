/**
 * Setup ChromaDB for Hybrid Embeddings (384 dimensions)
 * Works with local embeddings as primary, OpenAI as fallback
 */

import { ChromaClient } from 'chromadb';
import HybridEmbeddingService from './src/services/HybridEmbeddingService.js';

console.log(' ChromaDB Hybrid Embedding Setup\n');

async function setupChromaDBForHybrid() {
    try {
        // Step 1: Connect to ChromaDB
        console.log(' Connecting to ChromaDB...');
        const chromaClient = new ChromaClient({
            path: 'http://localhost:8000'
        });
        
        // Step 2: Delete existing collection
        console.log('\n️ Removing old collection...');
        try {
            await chromaClient.deleteCollection({
                name: 'palantir_ontology'
            });
            console.log('✅ Old collection removed');
        } catch (error) {
            console.log('ℹ️ No existing collection found');
        }
        
        // Step 3: Create new collection for hybrid embeddings
        console.log('\n✨ Creating collection for hybrid embeddings (384 dimensions)...');
        const collection = await chromaClient.createCollection({
            name: 'palantir_ontology',
            metadata: {
                'hnsw:space': 'cosine',
                'dimension': 384,
                'description': 'Math Education System with Hybrid Embeddings',
                'embedding_model': 'hybrid-local-384'
            }
        });
        console.log('✅ Collection created for hybrid embeddings');
        
        // Step 4: Test embedding service
        console.log('\n Testing Hybrid Embedding Service...');
        const testSuccess = await HybridEmbeddingService.test();
        
        if (!testSuccess) {
            throw new Error('Embedding service test failed');
        }
        
        // Step 5: Add test documents
        console.log('\n Adding test documents...');
        const testDocs = [
            'Math education system with AI assistance',
            'Real-time gesture recognition for mathematics',
            'Teacher-centered learning platform'
        ];
        
        const embeddings = await HybridEmbeddingService.generateBatchEmbeddings(testDocs);
        
        await collection.add({
            ids: testDocs.map((_, i) => `test-${i}`),
            embeddings: embeddings,
            metadatas: testDocs.map((doc, i) => ({ 
                type: 'test',
                index: i,
                timestamp: Date.now() 
            })),
            documents: testDocs
        });
        console.log('✅ Test documents added');
        
        // Step 6: Test search
        console.log('\n Testing semantic search...');
        const queryEmbedding = await HybridEmbeddingService.generateEmbedding('AI math education');
        
        const searchResults = await collection.query({
            queryEmbeddings: [queryEmbedding],  // Changed from query_embeddings
            nResults: 3  // Changed from n_results
        });
        
        console.log('✅ Search results:');
        if (searchResults && searchResults.documents && searchResults.documents[0]) {
            searchResults.documents[0].forEach((doc, i) => {
                const distance = searchResults.distances ? searchResults.distances[0][i] : 0;
                const similarity = ((1 - distance) * 100).toFixed(1);
                console.log(`   ${i + 1}. "${doc}" (${similarity}% similarity)`);
            });
        }
        
        // Step 7: Clean up test documents
        await collection.delete({ 
            ids: testDocs.map((_, i) => `test-${i}`) 
        });
        console.log('\n✅ Test documents removed');
        
        // Step 8: Display status
        console.log('\n System Status:');
        console.log('  ✅ ChromaDB: Ready (384 dimensions)');
        console.log('  ✅ Local Embeddings: Active');
        console.log('  ️ OpenAI API: Available as fallback');
        console.log('   Cost: $0 (using local model)');
        
        console.log('\n✅ Hybrid embedding system ready!');
        console.log('\n Next steps:');
        console.log('  1. Restart backend to use new embeddings');
        console.log('  2. Run document sync to populate database');
        
        return true;
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Run setup
setupChromaDBForHybrid().then(success => {
    if (success) {
        console.log('\n Hybrid system setup complete!');
        console.log(' System will use local embeddings (free) with OpenAI fallback');
        process.exit(0);
    } else {
        console.log('\n❌ Setup failed');
        process.exit(1);
    }
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});