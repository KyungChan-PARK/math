/**
 * Fix ChromaDB Collection Dimensions
 * Recreates the collection with correct embedding dimensions
 * @date 2025-09-07
 */

import { ChromaClient } from 'chromadb';
import dotenv from 'dotenv';
import embeddingService from './src/services/HybridEmbeddingService.js';

dotenv.config();

async function fixChromaDBCollection() {
    console.log(' Fixing ChromaDB Collection Dimensions...\n');
    
    try {
        // Connect to ChromaDB
        const chromaUrl = 'http://localhost:8000';  // Use localhost when running from host
        console.log(` Connecting to ChromaDB at ${chromaUrl}...`);
        
        const client = new ChromaClient({
            path: chromaUrl
        });
        
        // Delete existing collection if it exists
        console.log('️  Deleting existing collection...');
        try {
            await client.deleteCollection({ name: 'palantir_ontology' });
            console.log('✅ Existing collection deleted');
        } catch (error) {
            console.log('ℹ️  No existing collection to delete');
        }
        
        // Get the actual embedding dimension from the service
        console.log('\n Checking embedding dimensions...');
        const testText = 'Test embedding for dimension check';
        const testEmbedding = await embeddingService.generateEmbedding(testText);
        const actualDimensions = testEmbedding.length;
        
        console.log(`✅ Embedding service is generating ${actualDimensions}-dimensional embeddings`);
        console.log(`   Mode: ${embeddingService.config.useOpenAI ? 'OpenAI' : 'Local'}`);
        
        // Create new collection with correct dimensions
        console.log(`\n Creating new collection with ${actualDimensions} dimensions...`);
        const collection = await client.createCollection({
            name: 'palantir_ontology',
            metadata: { 
                'hnsw:space': 'cosine',
                'dimensions': actualDimensions
            }
        });
        
        console.log('✅ New collection created successfully');
        
        // Test the collection with sample data
        console.log('\n Testing the new collection...');
        
        const testDocs = [
            'Mathematics education system',
            'AI-powered learning platform',
            'Real-time gesture recognition'
        ];
        
        const embeddings = [];
        const ids = [];
        const metadatas = [];
        
        for (let i = 0; i < testDocs.length; i++) {
            const embedding = await embeddingService.generateEmbedding(testDocs[i]);
            embeddings.push(embedding);
            ids.push(`test_${i}`);
            metadatas.push({ text: testDocs[i] });
        }
        
        // Add test documents
        await collection.add({
            embeddings,
            documents: testDocs,
            metadatas,
            ids
        });
        
        console.log(`✅ Added ${testDocs.length} test documents`);
        
        // Query test
        const queryText = 'education AI';
        const queryEmbedding = await embeddingService.generateEmbedding(queryText);
        
        const results = await collection.query({
            queryEmbeddings: [queryEmbedding],  // Changed from query_embeddings
            nResults: 2  // Changed from n_results
        });
        
        console.log(`\n Query test for "${queryText}":`);
        if (results.documents && results.documents[0]) {
            results.documents[0].forEach((doc, i) => {
                const distance = results.distances ? results.distances[0][i] : 'N/A';
                console.log(`   ${i + 1}. "${doc}" (distance: ${distance})`);
            });
        }
        
        // Clean up test data
        console.log('\n Cleaning up test data...');
        await collection.delete({ ids });
        console.log('✅ Test data removed');
        
        // Show final configuration
        console.log('\n Final Configuration:');
        console.log(`   Collection: palantir_ontology`);
        console.log(`   Dimensions: ${actualDimensions}`);
        console.log(`   Distance metric: cosine`);
        console.log(`   Embedding mode: ${embeddingService.config.useOpenAI ? 'OpenAI' : 'Local'}`);
        
        // Show metrics
        const metrics = embeddingService.getMetrics();
        console.log('\n Embedding Service Metrics:');
        console.log(`   API calls: ${metrics.apiCalls}`);
        console.log(`   Local calls: ${metrics.localCalls}`);
        console.log(`   Cache hits: ${metrics.cacheHits}`);
        console.log(`   Errors: ${metrics.errors}`);
        
        console.log('\n✅ ChromaDB collection successfully fixed!');
        console.log(' Next steps:');
        console.log('   1. Restart the backend server to use the new collection');
        console.log('   2. The ontology system will automatically re-index all documents');
        
    } catch (error) {
        console.error('❌ Error fixing ChromaDB collection:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the fix
fixChromaDBCollection().then(() => {
    console.log('\n Process completed successfully!');
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
