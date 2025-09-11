/**
 * Recreate ChromaDB Collection with OpenAI Embedding Dimensions
 * Sets up collection for 1536-dimensional embeddings
 */

import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

console.log(' ChromaDB OpenAI Integration Setup\n');

async function setupChromaDBForOpenAI() {
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
        
        // Step 3: Create new collection with OpenAI dimensions
        console.log('\n✨ Creating collection for OpenAI embeddings (1536 dimensions)...');
        const collection = await chromaClient.createCollection({
            name: 'palantir_ontology',
            metadata: {
                'hnsw:space': 'cosine',
                'dimension': 1536,
                'description': 'Math Education System with OpenAI Embeddings',
                'embedding_model': 'text-embedding-3-small'
            }
        });
        console.log('✅ Collection created for OpenAI embeddings');
        
        // Step 4: Test with OpenAI embedding
        console.log('\n Testing with OpenAI API...');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        const testText = 'Math education system with AI assistance';
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: testText
        });
        
        const testEmbedding = response.data[0].embedding;
        console.log(`✅ Generated OpenAI embedding (${testEmbedding.length} dimensions)`);
        
        // Step 5: Add test document
        await collection.add({
            ids: ['test-openai'],
            embeddings: [testEmbedding],
            metadatas: [{ 
                type: 'test', 
                model: 'text-embedding-3-small',
                timestamp: Date.now() 
            }],
            documents: [testText]
        });
        console.log('✅ Test document added with OpenAI embedding');
        
        // Step 6: Verify
        const count = await collection.count();
        console.log(`✅ Collection has ${count} documents`);
        
        // Step 7: Clean up test
        await collection.delete({ ids: ['test-openai'] });
        console.log('✅ Test document removed');
        
        // Step 8: Display cost estimate
        console.log('\n Cost Information:');
        console.log('  Model: text-embedding-3-small');
        console.log('  Price: $0.00002 per 1K tokens');
        console.log('  Test cost: ~$0.000001');
        console.log('  Estimated monthly: < $0.10');
        
        console.log('\n✅ ChromaDB ready for OpenAI embeddings!');
        console.log('\n Next steps:');
        console.log('  1. Restart backend to use OpenAI embeddings');
        console.log('  2. Run document sync to generate embeddings');
        
        return true;
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        if (error.message.includes('API key')) {
            console.error(' Please check your OpenAI API key in .env file');
        }
        return false;
    }
}

// Run setup
setupChromaDBForOpenAI().then(success => {
    if (success) {
        console.log('\n OpenAI Embeddings integration complete!');
        process.exit(0);
    } else {
        console.log('\n❌ Setup failed');
        process.exit(1);
    }
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});