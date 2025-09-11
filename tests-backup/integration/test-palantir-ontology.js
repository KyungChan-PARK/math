/**
 * Test Palantir Ontology System
 * Real-time document-code synchronization test
 */

import PalantirOntologySystem from './backend/src/services/PalantirOntologySystem.js';
import fs from 'fs/promises';
import path from 'path';

async function testOntologySystem() {
    console.log(' Testing Palantir Ontology System...\n');
    
    // Initialize the system
    const ontology = new PalantirOntologySystem({
        neo4jUri: 'bolt://localhost:7687',
        neo4jUser: 'neo4j',
        neo4jPassword: 'aeclaudemax',
        watchPaths: ['C:\\palantir\\math\\backend\\src'],
        wsPort: 8091,
        streamingEnabled: true
    });
    
    // Wait for initialization
    await new Promise(resolve => {
        ontology.once('initialized', (metrics) => {
            console.log('\n Initialization Metrics:');
            console.log(JSON.stringify(metrics, null, 2));
            resolve();
        });
    });
    
    // Test 1: Get ontology statistics
    console.log('\n Test 1: Ontology Statistics');
    const stats = await ontology.getOntologyStats();
    console.log('Stats:', JSON.stringify(stats, null, 2));
    
    // Test 2: Query ontology
    console.log('\n Test 2: Query Ontology');
    const queryResults = await ontology.queryOntology('Claude integration');
    console.log(`Found ${queryResults.length} results`);
    queryResults.slice(0, 3).forEach(r => {
        console.log(`- ${r.object.path} (${r.object.type})`);
        if (r.relationships.length > 0) {
            console.log(`  Relations: ${r.relationships.map(rel => rel.relation).join(', ')}`);
        }
    });
    
    // Test 3: Create a test file to trigger sync
    console.log('\n Test 3: Real-time Sync Test');
    const testFilePath = path.join('C:\\palantir\\math\\backend\\src', 'test-ontology-sync.js');
    const testContent = `
// Test file for Palantir Ontology
export default class TestOntologySync {
    constructor() {
        this.timestamp = ${Date.now()};
    }
    
    testMethod() {
        return 'Ontology sync test';
    }
}
`;
    
    await fs.writeFile(testFilePath, testContent);
    console.log('Created test file:', testFilePath);
    
    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if file was synced
    const newStats = await ontology.getOntologyStats();
    console.log('\n Updated Statistics:');
    console.log(`Nodes: ${stats.nodes} → ${newStats.nodes}`);
    console.log(`Relations: ${stats.relations} → ${newStats.relations}`);
    console.log(`Changelog entries: ${newStats.changelog}`);
    console.log(`Stream events: ${newStats.metrics.streamEvents}`);
    
    // Test 4: Find similar objects
    console.log('\n Test 4: Semantic Similarity');
    const similar = await ontology.findSimilarObjects(testFilePath);
    console.log(`Found ${similar.length} similar objects:`);
    similar.forEach(s => {
        console.log(`- ${s.path} (similarity: ${(s.score * 100).toFixed(1)}%)`);
    });
    
    // Test 5: Performance metrics
    console.log('\n Test 5: Performance Metrics');
    const avgLatency = newStats.metrics.syncLatency.length > 0
        ? newStats.metrics.syncLatency.reduce((a, b) => a + b, 0) / newStats.metrics.syncLatency.length
        : 0;
    console.log(`Average sync latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`Total stream events: ${newStats.metrics.streamEvents}`);
    console.log(`Objects in cache: ${newStats.cached}`);
    
    // Clean up test file
    await fs.unlink(testFilePath);
    console.log('\n Cleaned up test file');
    
    // Shutdown
    await ontology.shutdown();
    
    console.log('\n✅ All tests completed successfully!');
    
    return {
        success: true,
        stats: newStats,
        performance: {
            avgLatency,
            streamEvents: newStats.metrics.streamEvents
        }
    };
}

// Run the test
testOntologySystem()
    .then(result => {
        console.log('\n Test Results:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });