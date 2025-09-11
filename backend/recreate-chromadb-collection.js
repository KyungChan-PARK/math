/**
 * Recreate ChromaDB Collection with Correct Dimensions
 * Fixes 422 error by ensuring dimension consistency
 */

import { ChromaClient } from 'chromadb';
import axios from 'axios';

console.log(' ChromaDB Collection Recreation Script\n');

async function recreateCollection() {
    try {
        // Step 1: Connect to ChromaDB
        console.log(' Connecting to ChromaDB...');
        const chromaClient = new ChromaClient({
            path: 'http://localhost:8000'
        });
        
        // Step 2: Delete existing collection
        console.log('\n️ Deleting existing collection...');
        try {
            await chromaClient.deleteCollection({
                name: 'palantir_ontology'
            });
            console.log('✅ Existing collection deleted');
        } catch (error) {
            console.log('ℹ️ Collection might not exist, continuing...');
        }
        
        // Step 3: Create new collection with proper configuration
        console.log('\n✨ Creating new collection with 768 dimensions...');
        const collection = await chromaClient.createCollection({
            name: 'palantir_ontology',
            metadata: {
                'hnsw:space': 'cosine',
                'dimension': 768,
                'description': 'Math Education System Ontology'
            }
        });
        console.log('✅ New collection created successfully');
        
        // Step 4: Test with a sample document
        console.log('\n Testing with sample document...');
        const testEmbedding = new Array(768).fill(0).map(() => Math.random());
        
        await collection.add({
            ids: ['test-doc'],
            embeddings: [testEmbedding],
            metadatas: [{ type: 'test', timestamp: Date.now() }],
            documents: ['This is a test document for the math education system']
        });
        console.log('✅ Test document added successfully');
        
        // Step 5: Verify collection info
        const count = await collection.count();
        console.log(`✅ Collection has ${count} documents`);
        
        // Step 6: Remove test document
        await collection.delete({ ids: ['test-doc'] });
        console.log('✅ Test document removed');
        
        console.log('\n✅ ChromaDB collection recreated successfully!');
        console.log('\n Next steps:');
        console.log('  1. Restart backend container');
        console.log('  2. Trigger full document sync');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error recreating collection:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Run the recreation
recreateCollection().then(success => {
    if (success) {
        console.log('\n Collection recreation complete!');
        process.exit(0);
    } else {
        console.log('\n❌ Collection recreation failed');
        process.exit(1);
    }
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
