/**
 * Initialize Ontology System with Document Scanning
 * This script forces a full rescan of all documents and creates nodes in Neo4j
 */

import axios from 'axios';
import { PalantirOntologySystem } from './src/services/PalantirOntologySystem.js';

console.log(' Starting Ontology Initialization...\n');

async function initializeOntology() {
    try {
        // Step 1: Check current status
        console.log(' Checking current ontology status...');
        const statusResponse = await axios.get('http://localhost:8086/api/ontology/status');
        console.log('Current status:', statusResponse.data);
        
        // Step 2: Initialize the ontology system directly
        console.log('\n Initializing Palantir Ontology System...');
        const ontologySystem = new PalantirOntologySystem({
            neo4jUri: 'bolt://localhost:7687',
            neo4jUser: 'neo4j',
            neo4jPassword: 'aeclaudemax',
            watchPaths: ['C:\\palantir\\math'],
            chromaUri: 'http://localhost:8000',
            streamingEnabled: true,
            wsPort: 8092
        });
        
        // Step 3: Initialize the system
        await ontologySystem.initialize();
        console.log('✅ Ontology system initialized');
        
        // Step 4: Build initial ontology (scan all documents)
        console.log('\n Scanning all documents and creating nodes...');
        await ontologySystem.buildInitialOntology();
        
        // Step 5: Get metrics
        const metrics = ontologySystem.metrics;
        console.log('\n Final Metrics:');
        console.log(`  - Nodes created: ${metrics.nodesCreated}`);
        console.log(`  - Relations created: ${metrics.relationsCreated}`);
        console.log(`  - Objects in storage: ${ontologySystem.objectStorage.size}`);
        console.log(`  - Stream events: ${metrics.streamEvents}`);
        
        // Step 6: Test semantic search
        console.log('\n Testing semantic search...');
        const searchResults = await ontologySystem.semanticSearch('math education system', 5);
        console.log(`  - Found ${searchResults.length} results for "math education system"`);
        
        // Step 7: Close connections
        await ontologySystem.driver.close();
        console.log('\n✅ Ontology initialization complete!');
        
        // Step 8: Update backend status
        console.log('\n Triggering full sync on backend...');
        await axios.post('http://localhost:8086/api/ontology/sync');
        console.log('✅ Backend sync initiated');
        
    } catch (error) {
        console.error('❌ Error during initialization:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run initialization
initializeOntology().then(() => {
    console.log('\n All done! Ontology system is now fully initialized.');
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
