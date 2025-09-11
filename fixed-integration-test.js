// Fixed Integration Test for 75 AI Agents System
// Tests all endpoints with correct request format

import fetch from 'node-fetch';
import chalk from 'chalk';
import fs from 'fs/promises';

class FixedIntegrationTester {
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

    async testParallelExecution() {
        const tasks = [
            { agent: 'algebraExpert', prompt: 'Solve x + 5 = 10' },
            { agent: 'geometryExpert', prompt: 'Find area of circle with radius 5' },
            { agent: 'statisticsExpert', prompt: 'Calculate mean of [1,2,3,4,5]' }
        ];
        
        const response = await fetch(`${this.baseUrl}/api/agent/parallel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks })
        });
        
        const data = await response.json();
        
        if (!data.success || !data.results || data.results.length !== 3) {
            throw new Error(`Parallel execution failed: ${JSON.stringify(data)}`);
        }
        
        return data;
    }

    async testWorkflow() {
        const workflow = [
            { agent: 'curriculumDesigner', prompt: 'Design a lesson on quadratic equations' },
            { agent: 'lessonPlanner', prompt: 'Create 45-minute plan based on previous result' },
            { agent: 'assessmentCreator', prompt: 'Generate quiz questions' }
        ];
        
        const response = await fetch(`${this.baseUrl}/api/agent/workflow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workflow })
        });
        
        const data = await response.json();
        
        if (!data.success || !data.results) {
            throw new Error(`Workflow execution failed: ${JSON.stringify(data)}`);
        }
        
        return data;
    }

    async testMathSolver() {
        const response = await fetch(`${this.baseUrl}/api/math/solve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                problem: 'Solve the quadratic equation: x^2 - 5x + 6 = 0',
                grade: 'high'
            })
        });
        
        const data = await response.json();
        
        if (!data.success || !data.results) {
            throw new Error(`Math solver failed: ${JSON.stringify(data)}`);
        }
        
        return data;
    }

    async testVisualization() {
        const response = await fetch(`${this.baseUrl}/api/visualize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                concept: 'y = x^2 + 2x - 3',
                type: 'graph'
            })
        });
        
        const data = await response.json();
        
        if (!data.success || !data.result) {
            throw new Error(`Visualization failed: ${JSON.stringify(data)}`);
        }
        
        return data;
    }

    async runFixedTests() {
        console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan.bold(' Fixed Integration Test - Failed Endpoints'));
        console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        console.log(chalk.yellow('\n📋 Testing Failed Endpoints...\n'));
        
        // Test previously failed endpoints
        await this.test('Parallel Execution (Fixed)', () => this.testParallelExecution());
        await this.test('Sequential Workflow (Fixed)', () => this.testWorkflow());
        await this.test('Math Problem Solver (Fixed)', () => this.testMathSolver());
        await this.test('Visualization Generator (Fixed)', () => this.testVisualization());
        
        // Generate Report
        await this.generateReport();
    }

    async generateReport() {
        console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan.bold(' Fixed Test Results'));
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
            testType: 'Fixed Failed Endpoints',
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
            'fixed-integration-test-report.json',
            JSON.stringify(report, null, 2),
            'utf-8'
        );
        
        console.log(chalk.green('\n  📄 Report saved to fixed-integration-test-report.json'));
        console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    }
}

// Run tests
const tester = new FixedIntegrationTester();
tester.runFixedTests().catch(console.error);
