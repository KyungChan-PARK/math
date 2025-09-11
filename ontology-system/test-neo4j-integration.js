// Neo4j Integration Test without Docker
import neo4j from 'neo4j-driver';

async function testNeo4j() {
    console.log(' Testing Neo4j connection...');
    
    // Try connecting to local Neo4j
    const driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'aeclaudemax')
    );
    
    const session = driver.session();
    
    try {
        // Test connection
        const result = await session.run('RETURN 1 as test');
        console.log('✅ Neo4j connected:', result.records[0].get('test'));
        
        // Initialize ontology
        await session.run('MATCH (n) DETACH DELETE n');
        
        // Create sample nodes
        await session.run(`
            CREATE (d1:Document {name: '01-MASTER-INSTRUCTIONS', layer: 'L0'})
            CREATE (d2:Document {name: '06-WEBSOCKET-OPTIMIZATION', layer: 'L2'})
            CREATE (m:Migration {name: 'uWebSockets', progress: 20})
            CREATE (d1)-[:REQUIRES]->(d2)
            CREATE (d2)-[:TARGETS]->(m)
            RETURN d1, d2, m
        `);
        
        // Query test
        const docs = await session.run('MATCH (d:Document) RETURN d.name as name, d.layer as layer');
        console.log('\n Documents:');
        docs.records.forEach(r => {
            console.log(`  - ${r.get('name')} (${r.get('layer')})`);
        });
        
        // GraphRAG test
        const related = await session.run(`
            MATCH (d:Document {name: '01-MASTER-INSTRUCTIONS'})-[r]-(connected)
            RETURN type(r) as rel, connected.name as name
        `);
        console.log('\n GraphRAG Relations:');
        related.records.forEach(r => {
            console.log(`  - ${r.get('rel')} → ${r.get('name')}`);
        });
        
        console.log('\n✨ Neo4j Ontology Test Complete');
        
    } catch (error) {
        console.error('❌ Neo4j not available:', error.message);
        console.log('\n Running mock ontology test instead...');
        runMockTest();
    } finally {
        await session.close();
        await driver.close();
    }
}

function runMockTest() {
    // Mock ontology for testing without Neo4j
    const mockOntology = {
        nodes: [
            { type: 'Document', name: '01-MASTER-INSTRUCTIONS', layer: 'L0' },
            { type: 'Document', name: '06-WEBSOCKET-OPTIMIZATION', layer: 'L2' },
            { type: 'Migration', name: 'uWebSockets', progress: 20 }
        ],
        relationships: [
            { from: '01-MASTER-INSTRUCTIONS', rel: 'REQUIRES', to: '06-WEBSOCKET-OPTIMIZATION' },
            { from: '06-WEBSOCKET-OPTIMIZATION', rel: 'TARGETS', to: 'uWebSockets' }
        ]
    };
    
    console.log('✅ Mock Ontology Created');
    console.log(` Nodes: ${mockOntology.nodes.length}`);
    console.log(` Relations: ${mockOntology.relationships.length}`);
}

testNeo4j();