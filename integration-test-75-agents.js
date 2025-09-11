// Comprehensive Integration Test for 75 AI Agents System
// Tests all endpoints, agents, and performance metrics

import fetch from 'node-fetch';
import chalk from 'chalk';
import fs from 'fs/promises';

class SystemIntegrationTester {
    constructor() {
        this.baseUrl = 'http://localhost:8091';
        this.results = {
            passed: 0,
            failed: 0,
            totalTime: 0,
            details: []
        };
    }

    async test(name, testFn) {
        const startTime = Date.now();
        try {
            const result = await testFn();
            const duration = Date.now() - startTime;
            
            this.results.passed++;
            this.results.totalTime += duration;
            this.results.details.push({
                test: name,
                status: 'PASS',
                duration: duration,
                result: result
            });
            
            console.log(chalk.green(`  ✓ ${name} (${duration}ms)`));
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.results.failed++;
            this.results.totalTime += duration;
            this.results.details.push({
                test: name,
                status: 'FAIL',
                duration: duration,
                error: error.message
            });
            
            console.log(chalk.red(`  ✗ ${name} (${duration}ms) - ${error.message}`));
            return null;
        }
    }

    async testHealthCheck() {
        const response = await fetch(`${this.baseUrl}/api/health`);
        const data = await response.json();
        
        if (!data.status === 'running') {
            throw new Error('Health check failed');
        }
        
        return data;
    }

    async testGetAgents() {
        const response = await fetch(`${this.baseUrl}/api/agents`);
        const data = await response.json();
        
        if (!data.agents || data.total !== 75) {
            throw new Error(`Expected 75 agents, got ${data.total}`);
        }
        
        return data;
    }

    async testAgentCategories() {
        const categories = [
            'math_concepts', 'pedagogy', 'visualization',
            'interaction', 'assessment', 'technical',
            'content', 'analytics'
        ];
        
        const results = {};
        
        for (const category of categories) {
            const response = await fetch(`${this.baseUrl}/api/agents?category=${category}`);
            const data = await response.json();
            results[category] = data.count;
        }
        
        return results;
    }

    async testSingleAgentCall() {
        const response = await fetch(`${this.baseUrl}/api/agent/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agent: 'geometryExpert',
                task: 'Calculate the area of a triangle with base 10 and height 5'
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Agent call failed');
        }
        
        return data;
    }

    async testAutoAgentSelection() {
        const response = await fetch(`${this.baseUrl}/api/agent/auto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task: 'Explain the Pythagorean theorem',
                complexity: 'medium'
            })
        });
        
        const data = await response.json();
        
        if (!data.success || !data.selectedAgent) {
            throw new Error('Auto agent selection failed');
        }
        
        return data;
    }

    async testParallelExecution() {
        const tasks = [
            { agent: 'algebraExpert', task: 'Solve x + 5 = 10' },
            { agent: 'geometryExpert', task: 'Find area of circle with radius 5' },
            { agent: 'statisticsExpert', task: 'Calculate mean of [1,2,3,4,5]' }
        ];
        
        const response = await fetch(`${this.baseUrl}/api/agent/parallel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks })
        });
        
        const data = await response.json();
        
        if (!data.success || !data.results || data.results.length !== 3) {
            throw new Error('Parallel execution failed');
        }
        
        return data;
    }

    async testWorkflow() {
        const workflow = [
            { agent: 'curriculumDesigner', task: 'Design a lesson on quadratic equations' },
            { agent: 'lessonPlanner', task: 'Create 45-minute plan based on previous result' },
            { agent: 'assessmentCreator', task: 'Generate quiz questions' }
        ];
        
        const response = await fetch(`${this.baseUrl}/api/agent/workflow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workflow })
        });
        
        const data = await response.json();
        
        if (!data.success || !data.results) {
            throw new Error('Workflow execution failed');
        }
        
        return data;
    }

    async testMathSolver() {
        const response = await fetch(`${this.baseUrl}/api/math/solve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                problem: 'Solve the quadratic equation: x^2 - 5x + 6 = 0'
            })
        });
        
        const data = await response.json();
        
        if (!data.success || !data.solution) {
            throw new Error('Math solver failed');
        }
        
        return data;
    }

    async testVisualization() {
        const response = await fetch(`${this.baseUrl}/api/visualize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'function',
                data: 'y = x^2 + 2x - 3'
            })
        });
        
        const data = await response.json();
        
        if (!data.success || !data.visualization) {
            throw new Error('Visualization failed');
        }
        
        return data;
    }

    async testPerformance() {
        const startTime = Date.now();
        const promises = [];
        
        // Send 10 concurrent requests
        for (let i = 0; i < 10; i++) {
            promises.push(
                fetch(`${this.baseUrl}/api/agent/call`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agent: 'numberTheoryExpert',
                        task: `Is ${100 + i} a prime number?`
                    })
                })
            );
        }
        
        const responses = await Promise.all(promises);
        const duration = Date.now() - startTime;
        
        const successCount = responses.filter(r => r.status === 200).length;
        
        if (successCount < 8) {
            throw new Error(`Only ${successCount}/10 concurrent requests succeeded`);
        }
        
        return {
            totalRequests: 10,
            successCount: successCount,
            duration: duration,
            avgResponseTime: duration / 10
        };
    }

    async runAllTests() {
        console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan.bold(' 75 AI Agents System Integration Test'));
        console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        console.log(chalk.yellow('\n📋 Running Tests...\n'));
        
        // Basic Tests
        console.log(chalk.blue('Basic Functionality:'));
        await this.test('Health Check', () => this.testHealthCheck());
        await this.test('Get All Agents', () => this.testGetAgents());
        await this.test('Agent Categories', () => this.testAgentCategories());
        
        // Agent Tests
        console.log(chalk.blue('\nAgent Operations:'));
        await this.test('Single Agent Call', () => this.testSingleAgentCall());
        await this.test('Auto Agent Selection', () => this.testAutoAgentSelection());
        await this.test('Parallel Execution', () => this.testParallelExecution());
        await this.test('Sequential Workflow', () => this.testWorkflow());
        
        // Feature Tests
        console.log(chalk.blue('\nSpecialized Features:'));
        await this.test('Math Problem Solver', () => this.testMathSolver());
        await this.test('Visualization Generator', () => this.testVisualization());
        
        // Performance Test
        console.log(chalk.blue('\nPerformance:'));
        await this.test('Concurrent Requests (10)', () => this.testPerformance());
        
        // Generate Report
        await this.generateReport();
    }

    async generateReport() {
        console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan.bold(' Test Results Summary'));
        console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        const total = this.results.passed + this.results.failed;
        const passRate = (this.results.passed / total * 100).toFixed(1);
        const avgTime = Math.round(this.results.totalTime / total);
        
        console.log(chalk.green(`  ✓ Passed: ${this.results.passed}/${total}`));
        console.log(chalk.red(`  ✗ Failed: ${this.results.failed}/${total}`));
        console.log(chalk.blue(`  📊 Pass Rate: ${passRate}%`));
        console.log(chalk.yellow(`  ⏱️  Total Time: ${this.results.totalTime}ms`));
        console.log(chalk.yellow(`  ⏱️  Average Time: ${avgTime}ms`));
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: total,
                passed: this.results.passed,
                failed: this.results.failed,
                passRate: passRate,
                totalTime: this.results.totalTime,
                avgTime: avgTime
            },
            details: this.results.details
        };
        
        await fs.writeFile(
            'integration-test-report.json',
            JSON.stringify(report, null, 2),
            'utf-8'
        );
        
        console.log(chalk.green('\n  📄 Detailed report saved to integration-test-report.json'));
        console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    }
}

// Run tests
const tester = new SystemIntegrationTester();
tester.runAllTests().catch(console.error);
