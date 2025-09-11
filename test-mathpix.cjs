const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Simple test script for Mathpix API
async function testMathpixAPI() {
    console.log('🧪 Testing Mathpix API Connection...\n');
    
    // Load configuration
    const config = require('./mathpix-config.json');
    const credentials = config.mathpix.credentials;
    
    console.log('📋 Configuration loaded:');
    console.log(`   App ID: ${credentials.app_id}`);
    console.log(`   App Key: ****...${credentials.app_key.slice(-8)}\n`);
    
    // Test LaTeX rendering endpoint (doesn't consume OCR quota)
    try {
        console.log('🔍 Testing LaTeX rendering endpoint...');
        
        const response = await axios.post(
            'https://api.mathpix.com/v3/latex',
            {
                latex: '\\int_{0}^{\\pi} \\sin(x) dx = 2',
                format: 'svg'
            },
            {
                headers: {
                    'app_id': credentials.app_id,
                    'app_key': credentials.app_key,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        
        console.log('✅ API Connection Successful!');
        console.log('   Response status:', response.status);
        console.log('   SVG output received:', response.data.svg ? 'Yes' : 'No');
        
        // Save SVG for verification
        if (response.data.svg) {
            await fs.writeFile(
                path.join(__dirname, 'test-output.svg'),
                response.data.svg
            );
            console.log('   Test output saved to: test-output.svg\n');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ API Test Failed!');
        
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Error:', error.response.data?.error || error.message);
            
            if (error.response.status === 401) {
                console.error('\n⚠️  Authentication failed. Please check your API credentials.');
            } else if (error.response.status === 429) {
                console.error('\n⚠️  Rate limit exceeded. Please wait before retrying.');
            }
        } else {
            console.error('   Network error:', error.message);
        }
        
        return false;
    }
}

// Test the Claude-Qwen orchestrator
async function testOrchestrator() {
    console.log('🤝 Testing Claude-Qwen Orchestrator...\n');
    
    try {
        const Orchestrator = require('./claude-qwen-mathpix-orchestrator.cjs');
        const orchestrator = new Orchestrator();
        
        console.log('✅ Orchestrator initialized successfully');
        
        // Test task routing
        const testTask = {
            id: 'test-001',
            type: 'image',
            data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            metadata: {
                source: 'test',
                content: { includes: 'equation' }
            }
        };
        
        console.log('📋 Test task created:');
        console.log('   Task ID:', testTask.id);
        console.log('   Type:', testTask.type);
        
        const complexity = await orchestrator.analyzeTaskComplexity(testTask);
        console.log('\n📊 Task Analysis:');
        console.log('   Best Processor:', complexity.bestProcessor);
        console.log('   Requires Collaboration:', complexity.requiresCollaboration);
        console.log('   Estimated Time:', complexity.estimatedTime + 'ms');
        
        // Test statistics
        const stats = orchestrator.getStatistics();
        console.log('\n📈 Orchestrator Statistics:');
        console.log('   Claude Tasks:', stats.claudeTasks);
        console.log('   Qwen Tasks:', stats.qwenTasks);
        console.log('   Total Processed:', stats.totalProcessed);
        
        return true;
        
    } catch (error) {
        console.error('❌ Orchestrator Test Failed!');
        console.error('   Error:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║     MATHPIX INTEGRATION TEST SUITE                   ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
    const apiTestResult = await testMathpixAPI();
    const orchestratorTestResult = await testOrchestrator();
    
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                    TEST RESULTS                      ║');
    console.log('╠═══════════════════════════════════════════════════════╣');
    console.log(`║  Mathpix API:        ${apiTestResult ? '✅ PASSED' : '❌ FAILED'}                        ║`);
    console.log(`║  Orchestrator:       ${orchestratorTestResult ? '✅ PASSED' : '❌ FAILED'}                        ║`);
    console.log('╚═══════════════════════════════════════════════════════╝');
    
    if (apiTestResult && orchestratorTestResult) {
        console.log('\n🎉 All tests passed! Ready to start the integration service.');
        console.log('   Run: node mathpix-integration-service.cjs');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
}

// Execute tests
runTests().catch(console.error);