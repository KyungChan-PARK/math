/**
 * MCP Server Test Script
 * Tests the basic functionality of the MCP server
 */

import axios from 'axios';
import WebSocket from 'ws';
import chalk from 'chalk';

const MCP_PORT = process.env.MCP_PORT || 3001;
const BASE_URL = `http://localhost:${MCP_PORT}`;

async function testMCPServer() {
    console.log(chalk.blue('\n═══════════════════════════════════════'));
    console.log(chalk.blue('       MCP Server Integration Test'));
    console.log(chalk.blue('═══════════════════════════════════════\n'));

    const tests = [];
    
    // Test 1: Health Check
    try {
        console.log(chalk.yellow('Test 1: Health Check...'));
        const health = await axios.get(`${BASE_URL}/mcp/health`);
        if (health.data.status === 'healthy') {
            console.log(chalk.green('✓ Health check passed'));
            console.log(chalk.gray(`  Version: ${health.data.version}`));
            console.log(chalk.gray(`  APIs: ${health.data.registeredAPIs}`));
            tests.push({ name: 'Health Check', passed: true });
        } else {
            throw new Error('Unhealthy status');
        }
    } catch (error) {
        console.log(chalk.red('✗ Health check failed:', error.message));
        tests.push({ name: 'Health Check', passed: false });
    }

    // Test 2: Get APIs
    try {
        console.log(chalk.yellow('\nTest 2: Get API Documentation...'));
        const apis = await axios.get(`${BASE_URL}/mcp/apis`);
        console.log(chalk.green(`✓ Retrieved ${apis.data.length} API endpoints`));
        apis.data.slice(0, 3).forEach(api => {
            console.log(chalk.gray(`  - ${api.method} ${api.endpoint}`));
        });
        tests.push({ name: 'Get APIs', passed: true });
    } catch (error) {
        console.log(chalk.red('✗ Get APIs failed:', error.message));
        tests.push({ name: 'Get APIs', passed: false });
    }

    // Test 3: Get Schemas
    try {
        console.log(chalk.yellow('\nTest 3: Get Schemas...'));
        const schemas = await axios.get(`${BASE_URL}/mcp/schemas`);
        console.log(chalk.green(`✓ Retrieved ${schemas.data.length} schemas`));
        schemas.data.forEach(schema => {
            console.log(chalk.gray(`  - ${schema.name}`));
        });
        tests.push({ name: 'Get Schemas', passed: true });
    } catch (error) {
        console.log(chalk.red('✗ Get Schemas failed:', error.message));
        tests.push({ name: 'Get Schemas', passed: false });
    }

    // Test 4: Get System State
    try {
        console.log(chalk.yellow('\nTest 4: Get System State...'));
        const state = await axios.get(`${BASE_URL}/mcp/state`);
        console.log(chalk.green('✓ System state retrieved'));
        console.log(chalk.gray(`  Uptime: ${Math.round(state.data.server.uptime)}s`));
        console.log(chalk.gray(`  Clients: ${state.data.server.clients}`));
        tests.push({ name: 'System State', passed: true });
    } catch (error) {
        console.log(chalk.red('✗ System State failed:', error.message));
        tests.push({ name: 'System State', passed: false });
    }

    // Test 5: Documentation Query
    try {
        console.log(chalk.yellow('\nTest 5: Documentation Query...'));
        const docs = await axios.post(`${BASE_URL}/mcp/documentation`, {
            query: 'gesture',
            context: { module: 'interaction' }
        });
        console.log(chalk.green('✓ Documentation retrieved'));
        console.log(chalk.gray(`  APIs: ${docs.data.apis.length}`));
        console.log(chalk.gray(`  Schemas: ${docs.data.schemas.length}`));
        console.log(chalk.gray(`  Examples: ${docs.data.examples.length}`));
        tests.push({ name: 'Documentation Query', passed: true });
    } catch (error) {
        console.log(chalk.red('✗ Documentation Query failed:', error.message));
        tests.push({ name: 'Documentation Query', passed: false });
    }

    // Test 6: WebSocket Connection
    console.log(chalk.yellow('\nTest 6: WebSocket Connection...'));
    await new Promise((resolve) => {
        const ws = new WebSocket(`ws://localhost:${MCP_PORT}`);
        
        ws.on('open', () => {
            console.log(chalk.green('✓ WebSocket connected'));
        });

        ws.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === 'connected') {
                console.log(chalk.gray(`  Client ID: ${message.clientId}`));
                
                // Test WebSocket message
                ws.send(JSON.stringify({
                    type: 'get_documentation',
                    payload: { query: 'test' }
                }));
            } else if (message.type === 'documentation') {
                console.log(chalk.green('✓ WebSocket documentation received'));
                tests.push({ name: 'WebSocket', passed: true });
                ws.close();
                resolve();
            }
        });

        ws.on('error', (error) => {
            console.log(chalk.red('✗ WebSocket failed:', error.message));
            tests.push({ name: 'WebSocket', passed: false });
            resolve();
        });

        setTimeout(() => {
            ws.close();
            resolve();
        }, 5000);
    });

    // Test 7: Register API
    try {
        console.log(chalk.yellow('\nTest 7: Register New API...'));
        const register = await axios.post(`${BASE_URL}/mcp/register-api`, {
            endpoint: '/api/test',
            method: 'GET',
            description: 'Test endpoint',
            params: {},
            response: { test: 'string' }
        });
        if (register.data.success) {
            console.log(chalk.green('✓ API registration successful'));
            tests.push({ name: 'Register API', passed: true });
        }
    } catch (error) {
        console.log(chalk.red('✗ Register API failed:', error.message));
        tests.push({ name: 'Register API', passed: false });
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
        console.log(chalk.green('\n All tests passed! MCP Server is working correctly.'));
    } else {
        console.log(chalk.yellow('\n️ Some tests failed. Check server logs for details.'));
    }
}

// Run tests
console.log(chalk.gray('Waiting for MCP server to be ready...'));
setTimeout(() => {
    testMCPServer().catch(error => {
        console.error(chalk.red('Test execution failed:'), error);
    });
}, 2000);
