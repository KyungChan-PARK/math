/**
 * MCP Server Claude Integration Test
 * Tests the Claude API integration features
 */

import axios from 'axios';
import WebSocket from 'ws';
import chalk from 'chalk';

const MCP_PORT = process.env.MCP_PORT || 3001;
const BASE_URL = `http://localhost:${MCP_PORT}`;

async function testClaudeIntegration() {
    console.log(chalk.blue('\n═══════════════════════════════════════'));
    console.log(chalk.blue('     MCP Claude Integration Test'));
    console.log(chalk.blue('═══════════════════════════════════════\n'));

    const tests = [];
    
    // Test 1: Validate AI Response
    try {
        console.log(chalk.yellow('Test 1: Validate AI Response...'));
        const validation = await axios.post(`${BASE_URL}/mcp/validate`, {
            response: `
                fetch('/api/shapes', {
                    method: 'POST',
                    body: JSON.stringify({ type: 'triangle' })
                })
            `,
            context: { query: 'create shape' }
        });
        
        console.log(chalk.green('✓ Validation response received'));
        console.log(chalk.gray(`  Valid: ${validation.data.valid}`));
        console.log(chalk.gray(`  Issues: ${validation.data.issues.length}`));
        console.log(chalk.gray(`  Suggestions: ${validation.data.suggestions.length}`));
        tests.push({ name: 'Validate Response', passed: true });
    } catch (error) {
        console.log(chalk.red('✗ Validation failed:', error.message));
        tests.push({ name: 'Validate Response', passed: false });
    }

    // Test 2: Improve Response
    try {
        console.log(chalk.yellow('\nTest 2: Improve AI Response...'));
        const improved = await axios.post(`${BASE_URL}/mcp/improve`, {
            response: 'var x = 5; console.log(x);',
            documentation: {
                apis: [],
                schemas: []
            },
            issues: ['Use const instead of var']
        });
        
        console.log(chalk.green('✓ Improvement response received'));
        console.log(chalk.gray(`  Changes: ${improved.data.changes.length}`));
        console.log(chalk.gray(`  Confidence: ${improved.data.confidence}`));
        tests.push({ name: 'Improve Response', passed: true });
    } catch (error) {
        console.log(chalk.red('✗ Improvement failed:', error.message));
        tests.push({ name: 'Improve Response', passed: false });
    }

    // Test 3: Generate Documentation
    try {
        console.log(chalk.yellow('\nTest 3: Generate Documentation...'));
        const docs = await axios.post(`${BASE_URL}/mcp/generate-docs`, {
            code: `
                function calculateArea(radius) {
                    return Math.PI * radius * radius;
                }
            `,
            context: { module: 'geometry' }
        });
        
        console.log(chalk.green('✓ Documentation generated'));
        console.log(chalk.gray(`  Format: ${docs.data.format}`));
        console.log(chalk.gray(`  Generated: ${docs.data.generated}`));
        if (docs.data.simulated) {
            console.log(chalk.gray('  Mode: Simulation (no API key)'));
        }
        tests.push({ name: 'Generate Documentation', passed: true });
    } catch (error) {
        console.log(chalk.red('✗ Documentation generation failed:', error.message));
        tests.push({ name: 'Generate Documentation', passed: false });
    }

    // Test 4: Detect Hallucination
    try {
        console.log(chalk.yellow('\nTest 4: Detect Hallucination...'));
        const detection = await axios.post(`${BASE_URL}/mcp/detect-hallucination`, {
            statement: 'The API runs on port 9999',
            facts: [
                { key: 'backend_port', value: '8086', type: 'config' },
                { key: 'mcp_port', value: '3001', type: 'config' }
            ]
        });
        
        console.log(chalk.green('✓ Hallucination detection complete'));
        console.log(chalk.gray(`  Hallucinated: ${detection.data.hallucinated}`));
        console.log(chalk.gray(`  Confidence: ${detection.data.confidence}`));
        tests.push({ name: 'Detect Hallucination', passed: true });
    } catch (error) {
        console.log(chalk.red('✗ Hallucination detection failed:', error.message));
        tests.push({ name: 'Detect Hallucination', passed: false });
    }

    // Test 5: WebSocket Claude Messages
    console.log(chalk.yellow('\nTest 5: WebSocket Claude Integration...'));
    await new Promise((resolve) => {
        const ws = new WebSocket(`ws://localhost:${MCP_PORT}`);
        
        ws.on('open', () => {
            console.log(chalk.green('✓ WebSocket connected'));
            
            // Test validation via WebSocket
            ws.send(JSON.stringify({
                type: 'validate_ai_response',
                payload: {
                    response: 'fetch("/api/test")',
                    context: { query: 'test' }
                }
            }));
        });

        ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'connected') {
                console.log(chalk.gray(`  Client ID: ${message.clientId}`));
            } else if (message.type === 'validation_result') {
                console.log(chalk.green('✓ Validation via WebSocket successful'));
                tests.push({ name: 'WebSocket Claude', passed: true });
                ws.close();
                resolve();
            } else if (message.type === 'validation_update') {
                console.log(chalk.gray('  Validation update received'));
            }
        });

        ws.on('error', (error) => {
            console.log(chalk.red('✗ WebSocket failed:', error.message));
            tests.push({ name: 'WebSocket Claude', passed: false });
            resolve();
        });

        setTimeout(() => {
            ws.close();
            resolve();
        }, 5000);
    });

    // Test 6: Get System State with Claude Stats
    try {
        console.log(chalk.yellow('\nTest 6: System State with Claude...'));
        const state = await axios.get(`${BASE_URL}/mcp/state`);
        
        console.log(chalk.green('✓ System state retrieved'));
        console.log(chalk.gray(`  Claude Integration: ${state.data.services.claudeIntegration}`));
        if (state.data.claude) {
            console.log(chalk.gray(`  API Key Present: ${state.data.claude.apiKeyPresent}`));
            console.log(chalk.gray(`  Model: ${state.data.claude.model}`));
            console.log(chalk.gray(`  Cache Size: ${state.data.claude.cacheSize}`));
        }
        tests.push({ name: 'System State', passed: true });
    } catch (error) {
        console.log(chalk.red('✗ System state failed:', error.message));
        tests.push({ name: 'System State', passed: false });
    }

    // Summary
    console.log(chalk.blue('\n═══════════════════════════════════════'));
    console.log(chalk.blue('              Test Summary'));
    console.log(chalk.blue('═══════════════════════════════════════\n'));
    
    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;
    
    tests.forEach(test => {
        const icon = test.passed ? chalk.green('✓') : chalk.red('✗');
        console.log(`${icon} ${test.name}`);
    });
    
    console.log('\nTotal:', chalk.green(`${passed} passed`), chalk.red(`${failed} failed`));
    
    if (failed === 0) {
        console.log(chalk.green('\n All Claude integration tests passed!'));
    } else {
        console.log(chalk.yellow('\n️ Some tests failed. Check server logs for details.'));
    }
}

// Run tests
console.log(chalk.gray('Testing Claude integration...'));
setTimeout(() => {
    testClaudeIntegration().catch(error => {
        console.error(chalk.red('Test execution failed:'), error);
    });
}, 2000);
