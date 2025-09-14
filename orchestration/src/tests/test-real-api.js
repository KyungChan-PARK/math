// Test script for Claude API real integration
import axios from 'axios';
import chalk from 'chalk';

const ORCHESTRATOR_URL = 'http://localhost:8089';

async function testNLPProcessing() {
    console.log(chalk.blue.bold('\n Testing Real Claude API Integration\n'));
    console.log('━'.repeat(60));
    
    const testCases = [
        {
            name: 'Korean Math Command',
            text: '빨간색 삼각형을 화면 중앙에 그려줘'
        },
        {
            name: 'English Math Command',
            text: 'Draw a blue circle with radius 100 pixels'
        },
        {
            name: 'Complex Command',
            text: 'Create an animated square that rotates 360 degrees over 2 seconds'
        }
    ];
    
    for (const testCase of testCases) {
        console.log(chalk.cyan(`\n Test: ${testCase.name}`));
        console.log(`   Input: "${testCase.text}"`);
        
        try {
            const startTime = Date.now();
            
            // Call the NLP processing endpoint
            const response = await axios.post(`${ORCHESTRATOR_URL}/nlp/process`, {
                text: testCase.text
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Extract results
            const results = response.data;
            
            console.log(chalk.green(`✅ Success in ${duration}ms`));
            
            // Show agent responses
            if (Array.isArray(results)) {
                results.forEach((result, index) => {
                    console.log(chalk.yellow(`\n   Step ${index + 1}: ${result.agent}`));
                    
                    if (result.response.result) {
                        // Truncate long responses
                        const preview = result.response.result.substring(0, 200);
                        console.log(`   Response: ${preview}${result.response.result.length > 200 ? '...' : ''}`);
                    }
                    
                    if (result.response.usage) {
                        console.log(chalk.gray(`   Tokens: ${result.response.usage.inputTokens}/${result.response.usage.outputTokens}`));
                    }
                });
            }
            
        } catch (error) {
            console.log(chalk.red(`❌ Error: ${error.message}`));
        }
    }
    
    console.log('\n' + '━'.repeat(60));
    
    // Get usage status
    try {
        const usageResponse = await axios.get(`${ORCHESTRATOR_URL}/usage/status`);
        const usage = usageResponse.data.current;
        
        console.log(chalk.yellow.bold('\n API Usage After Tests:'));
        console.log(`   Total Spent: $${usage.spent}`);
        console.log(`   Session Cost: $${usage.sessionCost}`);
        console.log(`   API Calls: ${usage.calls}`);
        console.log(`   Remaining: $${usage.remaining} / $${usage.limit}`);
        console.log(`   Usage: ${usage.percentage}%`);
        
        // Visual progress bar
        const barLength = 30;
        const filled = Math.round((parseFloat(usage.percentage) / 100) * barLength);
        const empty = barLength - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        
        const color = parseFloat(usage.percentage) < 50 ? chalk.green : 
                      parseFloat(usage.percentage) < 80 ? chalk.yellow : chalk.red;
        
        console.log(color(`   [${bar}] ${usage.percentage}%`));
        
    } catch (error) {
        console.log(chalk.red('Failed to get usage status'));
    }
}

// Run the test
testNLPProcessing().catch(console.error);
