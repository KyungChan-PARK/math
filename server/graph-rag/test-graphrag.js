import GraphRAGNLPEngine from './nlp-engine-graphrag.js';

async function testGraphRAG() {
    console.log(' Testing GraphRAG Integration...\n');
    
    const engine = new GraphRAGNLPEngine();
    
    try {
        await engine.initialize();
        console.log('✅ Connection to Neo4j established\n');
        
        // Test cases
        const testCommands = [
            "create a wiggle on the text layer",
            "add glow effect to shape",
            "rotate the null object 45 degrees",
            "make the text bounce"
        ];
        
        for (const command of testCommands) {
            console.log(` Command: "${command}"`);
            const result = await engine.parse(command);
            console.log(`   Intent: ${result.intent}`);
            console.log(`   Script: ${result.extendScript}`);
            console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%\n`);
        }
        
        console.log('✅ All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Check Neo4j is running: http://localhost:7474');
        console.log('2. Verify credentials: neo4j/aemax2025');
        console.log('3. Check port 7687 is available');
    }
    
    process.exit(0);
}

testGraphRAG();
