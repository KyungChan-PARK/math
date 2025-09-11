/**
 * Test PalantirOntologySystem with ChromaDB
 */

import PalantirOntologySystem from './src/services/PalantirOntologySystem.js';

async function testOntologySystem() {
    console.log(' Testing PalantirOntologySystem...\n');
    
    try {
        // Initialize system
        const ontologySystem = new PalantirOntologySystem({
            chromaUri: 'http://localhost:8000',  // Use localhost for testing
            neo4jUri: 'bolt://localhost:7687',
            watchPaths: ['C:\\palantir\\math\\backend\\src'],
            streamingEnabled: false  // Disable streaming for test
        });
        
        await ontologySystem.initialize();
        
        console.log('✅ System initialized successfully');
        
        // Test semantic search
        console.log('\n Testing semantic search...');
        const searchResults = await ontologySystem.semanticSearch('database connection', 5);
        console.log(`   Found ${searchResults.length} results`);
        
        // Get stats
        const stats = await ontologySystem.getOntologyStats();
        console.log('\n Ontology Statistics:');
        console.log(`   Nodes: ${stats.nodes}`);
        console.log(`   Relations: ${stats.relations}`);
        console.log(`   Cached objects: ${stats.cached}`);
        
        // Shutdown
        await ontologySystem.shutdown();
        console.log('\n✅ Test completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run test
testOntologySystem();
