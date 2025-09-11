// Quick Test for Qwen3-Max Authentication
import QwenAuthenticatedSystem from './qwen-auth-system.js';

async function testAuth() {
    console.log('Starting Qwen3-Max Authentication Test...\n');
    
    const system = new QwenAuthenticatedSystem();
    
    // Test connection
    const success = await system.testConnection();
    
    if (!success) {
        console.log('\nTrying direct HTTP method...');
        await system.directHttpCall('Hello, test');
    }
}

testAuth().catch(console.error);
