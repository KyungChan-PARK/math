import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
    'neo4j://localhost:7687',
    neo4j.auth.basic('neo4j', 'aeclaudemax')
);

async function fixDocumentNames() {
    const session = driver.session();
    try {
        // Update document names
        await session.run(`
            MATCH (d:Document {id: '09'})
            SET d.name = 'PALANTIR-INTEGRATION-PLAN',
                d.path = 'C:\\\\palantir\\\\math\\\\dev-docs\\\\09-PALANTIR-INTEGRATION-PLAN.md'
            RETURN d.name
        `);
        
        await session.run(`
            MATCH (d:Document {id: '11'}) 
            SET d.name = 'COMPLEX-WORKFLOW-MANAGEMENT',
                d.path = 'C:\\\\palantir\\\\math\\\\dev-docs\\\\11-COMPLEX-WORKFLOW-MANAGEMENT.md'
            RETURN d.name
        `);
        
        console.log('Fixed document names in Neo4j');
    } finally {
        await session.close();
        await driver.close();
    }
}

fixDocumentNames().catch(console.error);
