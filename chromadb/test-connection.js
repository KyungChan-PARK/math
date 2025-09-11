// Test ChromaDB Connection
import { ChromaClient } from 'chromadb';

console.log('Testing ChromaDB connection...');

async function testConnection() {
  try {
    // Create ChromaDB client
    const client = new ChromaClient({
      path: 'http://localhost:8000'
    });
    
    // Test basic operations
    console.log('1. Listing collections...');
    const collections = await client.listCollections();
    console.log(`   Found ${collections.length} collections`);
    
    // Create or get a test collection
    console.log('2. Creating/Getting test collection...');
    const collection = await client.getOrCreateCollection({
      name: 'math_education_test',
      metadata: { 
        description: 'Test collection for math education system' 
      }
    });
    console.log(`   Collection '${collection.name}' ready`);
    
    // Add some test data
    console.log('3. Adding test documents...');
    await collection.add({
      ids: ['test1', 'test2', 'test3'],
      documents: [
        'Triangle with 3 sides',
        'Circle with radius 5',
        'Square with side length 4'
      ],
      metadatas: [
        { type: 'triangle', category: 'geometry' },
        { type: 'circle', category: 'geometry' },
        { type: 'square', category: 'geometry' }
      ]
    });
    console.log('   Added 3 test documents');
    
    // Query the collection
    console.log('4. Querying collection...');
    const results = await collection.query({
      queryTexts: ['shape with sides'],
      nResults: 2
    });
    console.log(`   Found ${results.ids[0].length} results`);
    console.log('   Results:', results.documents[0]);
    
    // Get collection info
    console.log('5. Collection stats:');
    const count = await collection.count();
    console.log(`   Total documents: ${count}`);
    
    console.log('\n✅ ChromaDB connection successful!');
    console.log('   Server: http://localhost:8000');
    console.log('   Status: Ready for production use');
    
  } catch (error) {
    console.error('❌ ChromaDB connection failed:', error.message);
    console.error('   Make sure ChromaDB is running on port 8000');
  }
}

testConnection();
