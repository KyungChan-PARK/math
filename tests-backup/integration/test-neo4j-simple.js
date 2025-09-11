import neo4j from 'neo4j-driver';

console.log(' Testing Neo4j Connection...\n');

const driver = neo4j.driver(
    'bolt://localhost:7687',
    neo4j.auth.basic('neo4j', 'aeclaudemax')
);

const session = driver.session();

try {
    const result = await session.run('RETURN 1 as test');
    console.log('✅ Neo4j connected successfully');
    
    // Initialize gesture nodes
    await session.run(`
        MERGE (g1:Gesture {name: 'PINCH'})
        MERGE (g2:Gesture {name: 'SPREAD'})
        MERGE (g3:Gesture {name: 'DRAW'})
        MERGE (c1:Concept {name: 'Geometry'})
        MERGE (c2:Concept {name: 'Trigonometry'})
        MERGE (g1)-[:APPLIES_TO]->(c1)
        MERGE (g2)-[:APPLIES_TO]->(c2)
    `);
    
    console.log('✅ Gesture-Concept graph initialized');
    
    // Query relationships
    const rels = await session.run(`
        MATCH (g:Gesture)-[r:APPLIES_TO]->(c:Concept)
        RETURN g.name as gesture, c.name as concept
    `);
    
    console.log('\n Gesture-Concept Mappings:');
    rels.records.forEach(r => {
        console.log(`  ${r.get('gesture')} → ${r.get('concept')}`);
    });
    
    console.log('\n✨ Neo4j integration ready for production!');
    
} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    await session.close();
    await driver.close();
}