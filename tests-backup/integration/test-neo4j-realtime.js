/**
 * Test script for Neo4j Real-time Integration
 * Tests the connection between gesture system and knowledge graph
 */

import neo4j from 'neo4j-driver';
import WebSocket from 'ws';

console.log(' Testing Neo4j Real-time Integration...\n');

// Test Neo4j connection
async function testNeo4jConnection() {
    console.log('1️⃣ Testing Neo4j Connection...');
    
    const driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'aeclaudemax')
    );
    
    const session = driver.session();
    
    try {
        const result = await session.run('RETURN 1 as test');
        console.log('✅ Neo4j connected:', result.records[0].get('test'));
        
        // Check existing gestures
        const gestures = await session.run('MATCH (g:Gesture) RETURN g.name as name');
        console.log(' Existing gestures:', gestures.records.map(r => r.get('name')));