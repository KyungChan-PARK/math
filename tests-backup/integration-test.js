/**
 * Integration Test Suite for Math Education System
 * Tests all services and their interactions
 * Generated: 2025-01-31
 */

import fetch from 'node-fetch';
import WebSocket from 'ws';
import fs from 'fs/promises';
import path from 'path';

class IntegrationTestRunner {
    constructor() {
        this.services = {
            mediapipe: 'http://localhost:5000',
            nlp: 'http://localhost:3000', 
            orchestration: 'http://localhost:8085'
        };
        
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: { passed: 0, failed: 0, skipped: 0 }
        };
    }
    
    // Phase 1: Health Checks
    async testHealthChecks() {
        console.log('\n=== PHASE 1: Health Checks ===\n');
        
        for (const [name, url] of Object.entries(this.services)) {
            try {
                const response = await fetch(`${url}/health`);
                const data = await response.json();
                
                this.recordTest({
                    name: `${name}_health_check`,
                    phase: 1,
                    status: response.ok ? 'PASS' : 'FAIL',
                    details: data
                });
                
                console.log(`[${response.ok ? 'PASS' : 'FAIL'}] ${name}: ${data.status}`);
            } catch (error) {
                this.recordTest({
                    name: `${name}_health_check`,
                    phase: 1,
                    status: 'FAIL',
                    error: error.message
                });
                
                console.log(`[FAIL] ${name}: ${error.message}`);
            }
        }
    }
    
    // Phase 2: Individual API Tests
    async testAPIs() {
        console.log('\n=== PHASE 2: API Tests ===\n');
        
        // Test MediaPipe gesture
        await this.testAPI(
            'mediapipe_gesture',
            `${this.services.mediapipe}/gesture`,
            {
                gesture: 'PINCH',
                parameters: { x: 100, y: 100, scale: 0.5 }
            }
        );
        
        // Test NLP processing
        await this.testAPI(
            'nlp_korean',
            `${this.services.nlp}/process`,
            {
                text: '삼각형 그려줘',
                language: 'ko'
            }
        );
        
        // Test Orchestration workflow
        await this.testAPI(
            'orchestration_workflow',
            `${this.services.orchestration}/workflow`,
            {
                type: 'gesture-to-animation',
                data: { gesture: 'DRAW', shape: 'triangle' }
            }
        );
    }
    
    // Phase 3: End-to-End Pipeline
    async testPipeline() {
        console.log('\n=== PHASE 3: Pipeline Test ===\n');
        
        try {
            // Step 1: Send gesture to MediaPipe
            const gestureResponse = await fetch(`${this.services.mediapipe}/gesture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gesture: 'DRAW',
                    parameters: { shape: 'triangle', size: 200 }
                })
            });
            
            const gestureData = await gestureResponse.json();
            
            // Step 2: Process with NLP
            const nlpResponse = await fetch(`${this.services.nlp}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: gestureData.interpretation || 'draw triangle',
                    context: gestureData
                })
            });
            
            const nlpData = await nlpResponse.json();
            
            // Step 3: Execute through Orchestration
            const orchestrationResponse = await fetch(`${this.services.orchestration}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    script: nlpData.extendscript,
                    metadata: {
                        gesture: gestureData,
                        nlp: nlpData
                    }
                })
            });
            
            const result = await orchestrationResponse.json();
            
            this.recordTest({
                name: 'end_to_end_pipeline',
                phase: 3,
                status: 'PASS',
                details: {
                    gesture: gestureData,
                    nlp: nlpData,
                    result: result
                }
            });
            
            console.log('[PASS] End-to-end pipeline completed successfully');
            
        } catch (error) {
            this.recordTest({
                name: 'end_to_end_pipeline',
                phase: 3,
                status: 'FAIL',
                error: error.message
            });
            
            console.log(`[FAIL] Pipeline test: ${error.message}`);
        }
    }
    
    // Phase 4: WebSocket Performance Test
    async testWebSocketPerformance() {
        console.log('\n=== PHASE 4: WebSocket Performance ===\n');
        
        const ws = new WebSocket('ws://localhost:8085');
        const messages = [];
        const startTime = Date.now();
        const testDuration = 5000; // 5 seconds
        const targetMessages = 850 * 5; // 850 msg/sec * 5 sec
        
        return new Promise((resolve) => {
            ws.on('open', () => {
                console.log('WebSocket connected, starting performance test...');
                
                // Send messages rapidly
                const interval = setInterval(() => {
                    if (Date.now() - startTime > testDuration) {
                        clearInterval(interval);
                        ws.close();
                        return;
                    }
                    
                    ws.send(JSON.stringify({
                        type: 'test',
                        timestamp: Date.now(),
                        data: 'performance_test'
                    }));
                }, 1); // Send as fast as possible
            });
            
            ws.on('message', (data) => {
                messages.push(JSON.parse(data));
            });
            
            ws.on('close', () => {
                const actualRate = messages.length / (testDuration / 1000);
                const passed = actualRate >= 850;
                
                this.recordTest({
                    name: 'websocket_performance',
                    phase: 4,
                    status: passed ? 'PASS' : 'FAIL',
                    details: {
                        targetRate: 850,
                        actualRate: Math.round(actualRate),
                        messages: messages.length,
                        duration: testDuration
                    }
                });
                
                console.log(`[${passed ? 'PASS' : 'FAIL'}] WebSocket: ${Math.round(actualRate)} msg/sec (target: 850)`);
                resolve();
            });
        });
    }
    
    // Helper Methods
    async testAPI(name, url, payload) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            this.recordTest({
                name: name,
                phase: 2,
                status: response.ok ? 'PASS' : 'FAIL',
                request: payload,
                response: data
            });
            
            console.log(`[${response.ok ? 'PASS' : 'FAIL'}] ${name}`);
            
        } catch (error) {
            this.recordTest({
                name: name,
                phase: 2,
                status: 'FAIL',
                error: error.message
            });
            
            console.log(`[FAIL] ${name}: ${error.message}`);
        }
    }
    
    recordTest(test) {
        this.results.tests.push(test);
        
        if (test.status === 'PASS') this.results.summary.passed++;
        else if (test.status === 'FAIL') this.results.summary.failed++;
        else this.results.summary.skipped++;
    }
    
    async saveReport() {
        const reportPath = path.join(
            'C:\\palantir\\math\\test-reports',
            `integration-test-${Date.now()}.json`
        );
        
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
        
        // Also create markdown report for DocSync
        const mdReport = this.generateMarkdownReport();
        const mdPath = path.join(
            'C:\\palantir\\math\\dev-docs',
            `99-TEST-REPORT-${new Date().toISOString().split('T')[0]}.md`
        );
        
        await fs.writeFile(mdPath, mdReport);
        
        console.log(`\nReports saved:`);
        console.log(`  JSON: ${reportPath}`);
        console.log(`  Markdown: ${mdPath}`);
    }
    
    generateMarkdownReport() {
        return `# Integration Test Report

**Date:** ${this.results.timestamp}
**Status:** ${this.results.summary.failed === 0 ? '✅ ALL PASSED' : '❌ FAILURES DETECTED'}

## Summary
- **Passed:** ${this.results.summary.passed}
- **Failed:** ${this.results.summary.failed}
- **Skipped:** ${this.results.summary.skipped}

## Test Results

${this.results.tests.map(test => `
### ${test.name}
- **Phase:** ${test.phase}
- **Status:** ${test.status}
${test.error ? `- **Error:** ${test.error}` : ''}
${test.details ? `- **Details:** \`\`\`json\n${JSON.stringify(test.details, null, 2)}\n\`\`\`` : ''}
`).join('\n')}

## Next Steps
${this.results.summary.failed > 0 ? `
1. Review failed tests above
2. Check service logs for errors
3. Verify network connectivity
4. Run individual service tests
` : `
1. All tests passed - system ready for production
2. Consider load testing for scalability
3. Deploy monitoring solutions
`}
`;
    }
    
    async run() {
        console.log('Starting Integration Test Suite...\n');
        console.log('=' * 50);
        
        await this.testHealthChecks();
        await this.testAPIs();
        await this.testPipeline();
        await this.testWebSocketPerformance();
        
        console.log('\n' + '=' * 50);
        console.log('\n=== TEST SUMMARY ===');
        console.log(`Passed: ${this.results.summary.passed}`);
        console.log(`Failed: ${this.results.summary.failed}`);
        console.log(`Skipped: ${this.results.summary.skipped}`);
        
        await this.saveReport();
        
        process.exit(this.results.summary.failed > 0 ? 1 : 0);
    }
}

// Run tests
const runner = new IntegrationTestRunner();
runner.run().catch(console.error);
