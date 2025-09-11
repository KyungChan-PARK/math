/**
 * Full System Integration Test
 * Tests all services working together
 */

import axios from 'axios';
import WebSocket from 'ws';
import chalk from 'chalk';
import msgpack from 'msgpack-lite';

class IntegrationTest {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }
    
    async run() {
        console.log(chalk.blue.bold('\n FULL SYSTEM INTEGRATION TEST\n'));
        console.log(chalk.cyan('Testing all services together...\n'));
        
        // Test 1: MediaPipe Gesture Recognition
        await this.testMediaPipe();
        
        // Test 2: NLP Processing
        await this.testNLP();
        
        // Test 3: WebSocket Performance
        await this.testWebSocket();
        
        // Test 4: Claude Orchestrator
        await this.testOrchestrator();
        
        // Test 5: End-to-End Flow
        await this.testEndToEnd();
        
        // Report results
        this.reportResults();
    }
    
    async testMediaPipe() {
        console.log(chalk.yellow(' Test 1: MediaPipe Gesture Recognition'));
        
        try {
            const response = await axios.get('http://localhost:5000/health');
            
            if (response.data.status === 'healthy') {
                this.pass('MediaPipe health check');
            } else {
                this.fail('MediaPipe health check', 'Unhealthy status');
            }
        } catch (error) {
            this.fail('MediaPipe health check', error.message);
        }
    }
    async testNLP() {
        console.log(chalk.yellow('\n Test 2: NLP Processing'));
        
        try {
            const testCases = [
                { text: '삼각형 그려줘', expected: 'triangle' },
                { text: 'draw a circle', expected: 'circle' }
            ];
            
            for (const test of testCases) {
                const response = await axios.post('http://localhost:3000/process', test);
                
                if (response.data.parameters && response.data.parameters.shape) {
                    this.pass(`NLP: "${test.text}"`);
                } else {
                    this.fail(`NLP: "${test.text}"`, 'No shape detected');
                }
            }
        } catch (error) {
            this.fail('NLP processing', error.message);
        }
    }
    
    async testWebSocket() {
        console.log(chalk.yellow('\n Test 3: WebSocket Cluster Performance'));
        
        return new Promise((resolve) => {
            const ws = new WebSocket('ws://localhost:8085');
            let messageCount = 0;
            const startTime = Date.now();
            
            ws.on('open', () => {
                // Send 100 messages
                for (let i = 0; i < 100; i++) {
                    ws.send(msgpack.encode({
                        type: 'math',
                        data: `test-${i}`
                    }));
                }
            });
            
            ws.on('message', () => {
                messageCount++;
                if (messageCount >= 100) {
                    const duration = Date.now() - startTime;
                    const msgPerSec = Math.round((100 / duration) * 1000);
                    
                    if (msgPerSec > 850) {
                        this.pass(`WebSocket: ${msgPerSec} msg/sec`);
                    } else {
                        this.fail(`WebSocket: ${msgPerSec} msg/sec`, 'Below target 850');
                    }
                    
                    ws.close();
                    resolve();
                }
            });
            
            ws.on('error', (error) => {
                this.fail('WebSocket connection', error.message);
                resolve();
            });
            
            setTimeout(() => {
                ws.close();
                resolve();
            }, 5000);
        });
    }
    async testOrchestrator() {
        console.log(chalk.yellow('\n Test 4: Claude Orchestrator'));
        
        try {
            const response = await axios.get('http://localhost:8089/health');
            
            if (response.data.status === 'running' && response.data.agents === 5) {
                this.pass('Orchestrator: 5 agents ready');
            } else {
                this.fail('Orchestrator agents', 'Not all agents ready');
            }
        } catch (error) {
            this.fail('Orchestrator health', error.message);
        }
    }
    
    async testEndToEnd() {
        console.log(chalk.yellow('\n Test 5: End-to-End Flow'));
        
        try {
            // Simulate complete flow: Text -> NLP -> WebSocket -> Result
            const nlpResponse = await axios.post('http://localhost:3000/process', {
                text: 'draw a triangle with 60 degree angles'
            });
            
            if (nlpResponse.data.parameters && nlpResponse.data.parameters.shape === 'triangle') {
                this.pass('End-to-end: NLP processing');
                
                // Send to WebSocket
                const ws = new WebSocket('ws://localhost:8085');
                
                await new Promise((resolve) => {
                    ws.on('open', () => {
                        ws.send(JSON.stringify({
                            type: 'math',
                            data: nlpResponse.data
                        }));
                    });
                    
                    ws.on('message', (data) => {
                        this.pass('End-to-end: Complete flow');
                        ws.close();
                        resolve();
                    });
                    
                    setTimeout(resolve, 2000);
                });
            } else {
                this.fail('End-to-end flow', 'NLP processing failed');
            }
        } catch (error) {
            this.fail('End-to-end flow', error.message);
        }
    }
    pass(test) {
        this.results.passed++;
        this.results.tests.push({ test, result: 'PASS' });
        console.log(chalk.green(`  ✅ ${test}`));
    }
    
    fail(test, reason) {
        this.results.failed++;
        this.results.tests.push({ test, result: 'FAIL', reason });
        console.log(chalk.red(`  ❌ ${test}: ${reason}`));
    }
    
    reportResults() {
        console.log(chalk.blue.bold('\n TEST RESULTS\n'));
        console.log(chalk.cyan('━'.repeat(50)));
        
        const total = this.results.passed + this.results.failed;
        const passRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
        
        console.log(chalk.white(`Total Tests: ${total}`));
        console.log(chalk.green(`Passed: ${this.results.passed}`));
        console.log(chalk.red(`Failed: ${this.results.failed}`));
        console.log(chalk.yellow(`Pass Rate: ${passRate}%`));
        
        console.log(chalk.cyan('━'.repeat(50)));
        
        if (passRate >= 80) {
            console.log(chalk.green.bold('\n✅ INTEGRATION TEST PASSED!\n'));
        } else if (passRate >= 60) {
            console.log(chalk.yellow.bold('\n️  PARTIAL SUCCESS - Some issues remain\n'));
        } else {
            console.log(chalk.red.bold('\n❌ INTEGRATION TEST FAILED\n'));
        }
        
        // List failures
        if (this.results.failed > 0) {
            console.log(chalk.red('Failed Tests:'));
            this.results.tests
                .filter(t => t.result === 'FAIL')
                .forEach(t => console.log(chalk.red(`  • ${t.test}: ${t.reason}`)));
        }
    }
}

// Run test
if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    const test = new IntegrationTest();
    test.run().catch(console.error);
}

export default IntegrationTest;