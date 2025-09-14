// Test Qwen3-Max-Preview with Real API Call
import axios from 'axios';
import chalk from 'chalk';

const BASE_URL = 'http://localhost:8093';

async function testRealAPI() {
    console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.magenta.bold(' 🚀 Qwen3-Max-Preview Real API Test'));
    console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    // Test 1: Simple Agent Call
    console.log(chalk.yellow('\n1. Testing Simple Agent Call'));
    try {
        const response = await axios.post(`${BASE_URL}/api/agent/call`, {
            agent: 'algebraExpert',
            task: '이차방정식 x^2 + 5x + 6 = 0을 풀어주세요.',
            options: { maxTokens: 500 }
        });
        
        console.log(chalk.green('   ✅ Success!'));
        console.log(chalk.gray(`   Agent: ${response.data.result.agent}`));
        console.log(chalk.gray(`   Response Preview: ${response.data.result.response.substring(0, 100)}...`));
        
        if (response.data.result.cost) {
            console.log(chalk.blue(`   Cost: $${response.data.result.cost.totalCost.toFixed(6)}`));
            console.log(chalk.blue(`   Tokens: ${response.data.result.cost.inputTokens} in / ${response.data.result.cost.outputTokens} out`));
        }
    } catch (error) {
        console.log(chalk.red('   ❌ Failed:'), error.response?.data?.error || error.message);
    }
    
    // Test 2: Auto Agent Selection
    console.log(chalk.yellow('\n2. Testing Auto Agent Selection'));
    try {
        const response = await axios.post(`${BASE_URL}/api/agent/auto`, {
            task: '삼각형의 넓이를 구하는 공식을 설명해주세요.',
            complexity: 'simple'
        });
        
        console.log(chalk.green('   ✅ Success!'));
        console.log(chalk.gray(`   Selected Agent: ${response.data.selectedAgent}`));
        console.log(chalk.gray(`   Response Preview: ${response.data.result.response.substring(0, 100)}...`));
    } catch (error) {
        console.log(chalk.red('   ❌ Failed:'), error.response?.data?.error || error.message);
    }
    
    // Test 3: Parallel Execution
    console.log(chalk.yellow('\n3. Testing Parallel Execution'));
    try {
        const response = await axios.post(`${BASE_URL}/api/agent/parallel`, {
            tasks: [
                { agent: 'numberTheoryExpert', task: '소수란 무엇인가요?' },
                { agent: 'geometryExpert', task: '원의 둘레 공식은?' }
            ]
        });
        
        console.log(chalk.green('   ✅ Success!'));
        console.log(chalk.gray(`   Completed ${response.data.results.length} tasks`));
        console.log(chalk.blue(`   Total Cost: $${response.data.totalCost}`));
    } catch (error) {
        console.log(chalk.red('   ❌ Failed:'), error.response?.data?.error || error.message);
    }
    
    // Test 4: Visualization Generation
    console.log(chalk.yellow('\n4. Testing Visualization Generation'));
    try {
        const response = await axios.post(`${BASE_URL}/api/visualize`, {
            concept: 'y = x^2 포물선',
            type: 'graph',
            includeCode: true
        });
        
        console.log(chalk.green('   ✅ Success!'));
        console.log(chalk.gray(`   Generated visualization for: y = x^2`));
        
        // Check if code is included
        if (response.data.result.response.includes('function') || response.data.result.response.includes('var')) {
            console.log(chalk.green('   ✅ Code generation successful'));
        }
    } catch (error) {
        console.log(chalk.red('   ❌ Failed:'), error.response?.data?.error || error.message);
    }
    
    console.log(chalk.magenta('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green.bold(' 🎉 Test Complete!'));
    console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
}

testRealAPI().catch(console.error);
