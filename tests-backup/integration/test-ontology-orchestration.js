// Test Ontology-Orchestration Real-time Sync System
import axios from 'axios';
import neo4j from 'neo4j-driver';

async function testOntologyOrchestrationSync() {
    console.log('=== Testing Ontology-Orchestration Real-time Sync System ===\n');
    
    let driver;
    const results = {
        neo4j: false,
        backend: false,
        selfImprovement: false,
        documentSync: false,
        realTimeUpdate: false
    };
    
    try {
        // 1. Test Neo4j Connection
        console.log('1. Testing Neo4j Connection...');
        driver = neo4j.driver(
            'bolt://localhost:7687',
            neo4j.auth.basic('neo4j', 'aeclaudemax')
        );
        
        const session = driver.session();
        const neo4jTest = await session.run('RETURN 1 as test');
        results.neo4j = neo4jTest.records.length > 0;
        console.log(`   Neo4j: ${results.neo4j ? 'CONNECTED' : 'FAILED'}`);
        
        // Check ontology nodes
        const ontologyCheck = await session.run(`
            MATCH (n) 
            RETURN labels(n) as label, count(n) as count
            ORDER BY count DESC
            LIMIT 10
        `);
        
        console.log('   Ontology Nodes:');
        ontologyCheck.records.forEach(record => {
            const label = record.get('label')[0] || 'Unknown';
            const count = record.get('count').toNumber();
            console.log(`     - ${label}: ${count} nodes`);
        });
        
        await session.close();
        
        // 2. Test Backend Health
        console.log('\n2. Testing Backend Services...');
        const healthResponse = await axios.get('http://localhost:8086/api/health');
        const health = healthResponse.data;
        
        results.backend = health.status === 'healthy';
        results.selfImprovement = health.services.selfImprovement === 'active';
        results.documentSync = health.services.documentImprovement === 'active';
        
        console.log(`   Backend: ${results.backend ? 'HEALTHY' : 'UNHEALTHY'}`);
        console.log(`   Self-Improvement: ${results.selfImprovement ? 'ACTIVE' : 'INACTIVE'}`);
        console.log(`   Document Sync: ${results.documentSync ? 'ACTIVE' : 'INACTIVE'}`);
        
        // 3. Test Document-Code Sync
        console.log('\n3. Testing Document-Code Synchronization...');
        const syncTest = await axios.post('http://localhost:8086/api/sync/test', {
            type: 'document_update',
            file: 'MASTER_REFERENCE.md',
            content: 'Test update at ' + new Date().toISOString()
        }).catch(err => ({data: {error: err.message}}));
        
        if (syncTest.data && !syncTest.data.error) {
            results.realTimeUpdate = true;
            console.log('   Real-time sync: WORKING');
        } else {
            console.log('   Real-time sync: NOT CONFIGURED');
            console.log(`   Note: ${syncTest.data?.error || 'Endpoint not found'}`);
        }
        
        // 4. Check Orchestration Status
        console.log('\n4. Checking Orchestration Engine...');
        const orchestrationSession = driver.session();
        const orchCheck = await orchestrationSession.run(`
            MATCH (o:System {name: 'OrchestrationEngine'})
            RETURN o.status as status, o.updated_at as updated
        `);
        
        if (orchCheck.records.length > 0) {
            const status = orchCheck.records[0].get('status');
            const updated = orchCheck.records[0].get('updated');
            console.log(`   Orchestration: ${status}`);
            console.log(`   Last Update: ${updated}`);
        } else {
            console.log('   Orchestration: NOT FOUND IN ONTOLOGY');
        }
        
        await orchestrationSession.close();
        
        // Summary
        console.log('\n=== SUMMARY ===');
        const working = Object.values(results).filter(v => v).length;
        const total = Object.keys(results).length;
        
        console.log(`Overall Status: ${working}/${total} systems operational`);
        
        if (working === total) {
            console.log('✅ FULLY OPERATIONAL - All systems working!');
        } else if (working >= 3) {
            console.log('️ PARTIALLY OPERATIONAL - Core systems working');
            console.log('   Missing features:');
            Object.entries(results).forEach(([key, value]) => {
                if (!value) console.log(`     - ${key}`);
            });
        } else {
            console.log('❌ NEEDS CONFIGURATION - Multiple systems offline');
        }
        
        // Recommendations
        console.log('\n=== RECOMMENDATIONS ===');
        if (!results.realTimeUpdate) {
            console.log('1. Implement /api/sync/test endpoint in backend');
            console.log('2. Connect RealTimeSelfImprovementEngine to routes');
        }
        if (!results.neo4j) {
            console.log('3. Start Neo4j container: docker-compose up neo4j');
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
    } finally {
        if (driver) await driver.close();
    }
}

// Run test
testOntologyOrchestrationSync().catch(console.error);
