/**
 * Trigger Ontology Document Scanning
 * Uses existing backend API to force rescan
 */

import axios from 'axios';

console.log(' Starting Ontology Document Scanning...\n');

async function scanDocuments() {
    try {
        // Step 1: Check current status
        console.log(' Checking current ontology status...');
        const statusResponse = await axios.get('http://localhost:8086/api/ontology/status');
        console.log('Before scan:', {
            nodesCreated: statusResponse.data.metrics.nodesCreated,
            relationsCreated: statusResponse.data.metrics.relationsCreated,
            streamEvents: statusResponse.data.metrics.streamEvents
        });
        
        // Step 2: Trigger full sync (which should scan documents)
        console.log('\n Triggering full document sync...');
        const syncResponse = await axios.post('http://localhost:8086/api/ontology/sync');
        console.log('Sync response:', syncResponse.data);
        
        // Step 3: Wait for processing
        console.log('\n⏳ Waiting for processing (10 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Step 4: Check status again
        console.log('\n Checking status after sync...');
        const afterStatus = await axios.get('http://localhost:8086/api/ontology/status');
        console.log('After scan:', {
            nodesCreated: afterStatus.data.metrics.nodesCreated,
            relationsCreated: afterStatus.data.metrics.relationsCreated,
            streamEvents: afterStatus.data.metrics.streamEvents
        });
        
        // Step 5: Test semantic search
        console.log('\n Testing semantic search...');
        try {
            const searchResponse = await axios.post('http://localhost:8086/api/ontology/semantic-search', {
                query: 'math education system',
                limit: 5
            });
            console.log(`Found ${searchResponse.data.results?.length || 0} results`);
        } catch (searchError) {
            console.log('Semantic search error:', searchError.response?.data || searchError.message);
        }
        
        console.log('\n✅ Document scanning complete!');
        
    } catch (error) {
        console.error('❌ Error during scanning:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run scan
scanDocuments().then(() => {
    console.log('\n Done!');
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
