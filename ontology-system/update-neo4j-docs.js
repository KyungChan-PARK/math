import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
    'neo4j://localhost:7687',
    neo4j.auth.basic('neo4j', 'aeclaudemax')
);

async function updateDocumentOntology() {
    const session = driver.session();
    
    try {
        // Clear existing document nodes
        await session.run('MATCH (d:Document) DETACH DELETE d');
        
        // All 11 core documents
        const documents = [
            { id: '01', name: 'MASTER-INSTRUCTIONS', layer: 'L0', purpose: 'Core identity and capabilities' },
            { id: '02', name: 'AUTONOMY-GUIDELINES', layer: 'L1', purpose: 'Autonomous development rules' },
            { id: '03', name: 'NLP-REALTIME-SYSTEM', layer: 'L1', purpose: 'Natural language processing' },
            { id: '04', name: 'GESTURE-RECOGNITION', layer: 'L2', purpose: 'Gesture to motion graphics' },
            { id: '05', name: 'VIDEO-MOTION-EXTRACTION', layer: 'L2', purpose: 'Computer vision processing' },
            { id: '06', name: 'WEBSOCKET-OPTIMIZATION', layer: 'L3', purpose: 'Performance optimization' },
            { id: '07', name: 'WINDOWS-ML-INTEGRATION', layer: 'L3', purpose: 'ML acceleration' },
            { id: '08', name: 'CEP-UXP-MIGRATION', layer: 'L3', purpose: 'Platform modernization' },
            { id: '09', name: 'PALANTIR-INTEGRATION', layer: 'L2', purpose: 'Enterprise integration' },
            { id: '10', name: 'MCP-TOOL-INTEGRATION', layer: 'L1', purpose: 'Tool orchestration' },
            { id: '11', name: 'COMPLEX-WORKFLOW', layer: 'L1', purpose: 'Multi-step management' }
        ];
        
        // Create all document nodes
        for (const doc of documents) {
            await session.run(
                `CREATE (d:Document {
                    id: $id,
                    name: $name,
                    layer: $layer,
                    purpose: $purpose,
                    path: $path
                })`,
                {
                    ...doc,
                    path: `C:\\palantir\\math\\dev-docs\\${doc.id}-${doc.name}.md`
                }
            );
        }
        
        // Define relationships
        const relationships = [
            // Core dependencies
            ['01', '02', 'DEFINES'],
            ['01', '10', 'USES'],
            ['01', '11', 'IMPLEMENTS'],
            
            // System integrations
            ['02', '03', 'ENABLES'],
            ['03', '04', 'INTEGRATES_WITH'],
            ['03', '06', 'REQUIRES'],
            ['04', '06', 'COMMUNICATES_VIA'],
            ['04', '07', 'ACCELERATED_BY'],
            
            // Technical dependencies
            ['06', '09', 'ENHANCED_BY'],
            ['07', '04', 'OPTIMIZES'],
            ['08', '03', 'MODERNIZES'],
            ['09', '06', 'PROVIDES_GRAPHRAG'],
            ['09', '11', 'ORCHESTRATES'],
            
            // Tool connections
            ['10', '11', 'COORDINATES'],
            ['10', '02', 'SUPPORTS'],
            ['11', '09', 'MANAGES']
        ];
        
        // Create relationships
        for (const [from, to, type] of relationships) {
            await session.run(
                `MATCH (a:Document {id: $from}), (b:Document {id: $to})
                 CREATE (a)-[:${type}]->(b)`,
                { from, to }
            );
        }
        
        // Verify connections
        const result = await session.run(`
            MATCH (d:Document)
            OPTIONAL MATCH (d)-[r]-()
            RETURN d.name as name, count(r) as connections
            ORDER BY connections DESC
        `);
        
        console.log(' Document Ontology Updated:');
        result.records.forEach(record => {
            console.log(`  ${record.get('name')}: ${record.get('connections')} connections`);
        });
        
        console.log('✅ All 11 documents connected in Neo4j');
        
    } finally {
        await session.close();
        await driver.close();
    }
}

updateDocumentOntology().catch(console.error);
