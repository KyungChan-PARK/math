/**
 * Test real Claude API integration
 */

import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';

async function testRealClaude() {
    console.log(chalk.blue('\n═══════════════════════════════════════'));
    console.log(chalk.blue('     Real Claude API Test'));
    console.log(chalk.blue('═══════════════════════════════════════\n'));

    const apiKey = '[YOUR_CLAUDE_API_KEY]1LsVTVUo_GpWMbZwLWHv1ZJ2ae7BKZpfiE0BEQDk15XQDDLCjtyXeip9z_2lZlOuX_yS8RupxG3pUEZ-gRlTWA-jbcG0QAA';
    
    try {
        const anthropic = new Anthropic({ apiKey });
        
        console.log(chalk.yellow('Testing Claude API...'));
        
        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: 'Validate this code: fetch("/api/test", { method: "POST" }). Is this correct?'
            }]
        });
        
        console.log(chalk.green('✓ Claude API Response Received!'));
        console.log(chalk.gray('Response:', message.content[0].text.substring(0, 200) + '...'));
        console.log(chalk.green('\n Claude API is working correctly!'));
        
        // Test validation
        console.log(chalk.yellow('\nTesting validation...'));
        const validation = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 512,
            system: 'You are a code validator. Respond with JSON: {"valid": boolean, "issues": [], "suggestions": []}',
            messages: [{
                role: 'user',
                content: 'Validate: var x = 5; console.log(x);'
            }]
        });
        
        console.log(chalk.green('✓ Validation Response:'));
        console.log(chalk.gray(validation.content[0].text.substring(0, 200)));
        
    } catch (error) {
        console.error(chalk.red('Error:'), error.message);
        if (error.status === 401) {
            console.log(chalk.yellow('API key may be invalid or expired'));
        }
    }
}

testRealClaude();
