// Test actual API call
import fetch from 'node-fetch';
import chalk from 'chalk';

console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.cyan.bold(' Testing Real Claude API Call'));
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

async function testRealAPI() {
    try {
        console.log(chalk.yellow('\n📡 Calling algebraExpert agent...'));
        
        const response = await fetch('http://localhost:8091/api/agent/call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agent: 'algebraExpert',
                task: 'Explain how to solve x^2 + 5x + 6 = 0'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(chalk.green('\n✅ API Call Successful!'));
            console.log(chalk.blue('\nResponse:'));
            console.log(result.result);
        } else {
            console.log(chalk.red('\n❌ API Call Failed:'));
            console.log(result);
        }
    } catch (error) {
        console.log(chalk.red('\n❌ Error:'));
        console.log(error);
    }
}

testRealAPI();
