/**
 * Test Script for Claude API Orchestration
 * Tests the real Claude-in-Claude functionality
 */

import ClaudeAPIOrchestrator from './orchestration/claude-api-orchestrator.js';

class ClaudeOrchestrationTester {
    constructor() {
        this.orchestrator = new ClaudeAPIOrchestrator();
        this.testResults = [];
    }
    
    async runAllTests() {
        console.log(' Starting Claude API Orchestration Tests\n');
        console.log('=' .repeat(60));
        
        // Test 1: Gesture Recognition
        await this.testGestureRecognition();
        
        // Test 2: Math Problem Solving
        await this.testMathProblem();
        
        // Test 3: Visual Analysis
        await this.testVisualAnalysis();
        
        // Test 4: Complex Learning Task
        await this.testComplexLearning();
        
        // Test 5: Performance Benchmark
        await this.testPerformance();
        
        // Print summary
        this.printSummary();
    }
    
    async testGestureRecognition() {
        console.log('\n Test 1: Gesture Recognition');
        console.log('-'.repeat(40));
        
        const input = {
            landmarks: [
                { x: 0.5, y: 0.5, z: 0 },
                { x: 0.45, y: 0.48, z: 0.1 },
                { x: 0.43, y: 0.46, z: 0.15 }
            ],
            gesture_hint: 'pinch'
        };
        
        try {
            const startTime = Date.now();
            const result = await this.orchestrator.processTask('gesture_recognition', input);
            const duration = Date.now() - startTime;
            
            console.log('✅ Success!');
            console.log(`⏱️  Processing time: ${duration}ms`);
            console.log(' Result:', JSON.stringify(result.combined, null, 2).substring(0, 200) + '...');
            
            this.testResults.push({
                test: 'Gesture Recognition',
                success: true,
                duration,
                specialists: result.specialists.length
            });
        } catch (error) {
            console.log('❌ Failed:', error.message);
            this.testResults.push({
                test: 'Gesture Recognition',
                success: false,
                error: error.message
            });
        }
    }
    
    async testMathProblem() {
        console.log('\n Test 2: Math Problem Solving');
        console.log('-'.repeat(40));
        
        const problem = 'A circle has radius 5. What is its area? Show your work step by step.';
        
        try {
            const startTime = Date.now();
            const result = await this.orchestrator.processTask('math_problem', problem);
            const duration = Date.now() - startTime;
            
            console.log('✅ Success!');
            console.log(`⏱️  Processing time: ${duration}ms`);
            console.log(` Specialists used: ${result.specialists.map(s => s.specialist).join(', ')}`);
            
            // Check if we got a solution
            if (result.combined && result.combined.solution) {
                console.log(' Solution found:', result.combined.solution);
            }
            
            this.testResults.push({
                test: 'Math Problem',
                success: true,
                duration,
                specialists: result.specialists.length
            });
        } catch (error) {
            console.log('❌ Failed:', error.message);
            this.testResults.push({
                test: 'Math Problem',
                success: false,
                error: error.message
            });
        }
    }
    
    async testVisualAnalysis() {
        console.log('\n Test 3: Visual Analysis');
        console.log('-'.repeat(40));
        
        const input = {
            shapes: ['circle', 'triangle', 'square'],
            positions: [[100, 200], [300, 400], [500, 600]],
            relationships: 'triangle inscribed in circle, square adjacent'
        };
        
        try {
            const startTime = Date.now();
            const result = await this.orchestrator.processTask('visual_analysis', input);
            const duration = Date.now() - startTime;
            
            console.log('✅ Success!');
            console.log(`⏱️  Processing time: ${duration}ms`);
            console.log(` Specialists used: ${result.specialists.map(s => s.specialist).join(', ')}`);
            
            this.testResults.push({
                test: 'Visual Analysis',
                success: true,
                duration,
                specialists: result.specialists.length
            });
        } catch (error) {
            console.log('❌ Failed:', error.message);
            this.testResults.push({
                test: 'Visual Analysis',
                success: false,
                error: error.message
            });
        }
    }
    
    async testComplexLearning() {
        console.log('\n Test 4: Complex Learning Task');
        console.log('-'.repeat(40));
        
        const task = 'Create an interactive lesson about the Pythagorean theorem for 8th grade students';
        
        try {
            const startTime = Date.now();
            const result = await this.orchestrator.processTask('complex_learning', task);
            const duration = Date.now() - startTime;
            
            console.log('✅ Success!');
            console.log(`⏱️  Processing time: ${duration}ms`);
            console.log(` Specialists used: ${result.specialists.map(s => s.specialist).join(', ')}`);
            
            // Check integrated lesson
            if (result.combined && result.combined.integratedLesson) {
                console.log(' Lesson components:', 
                    result.combined.integratedLesson.components.map(c => c.type).join(', '));
            }
            
            this.testResults.push({
                test: 'Complex Learning',
                success: true,
                duration,
                specialists: result.specialists.length
            });
        } catch (error) {
            console.log('❌ Failed:', error.message);
            this.testResults.push({
                test: 'Complex Learning',
                success: false,
                error: error.message
            });
        }
    }
    
    async testPerformance() {
        console.log('\n Test 5: Performance Benchmark');
        console.log('-'.repeat(40));
        
        const iterations = 3;
        const latencies = [];
        
        console.log(`Running ${iterations} iterations...`);
        
        for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();
            
            try {
                await this.orchestrator.processTask(
                    'math_problem',
                    `What is ${i + 1} + ${i + 2}?`
                );
                
                const latency = Date.now() - startTime;
                latencies.push(latency);
                console.log(`  Iteration ${i + 1}: ${latency}ms`);
            } catch (error) {
                console.log(`  Iteration ${i + 1}: Failed`);
            }
        }
        
        if (latencies.length > 0) {
            const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
            const minLatency = Math.min(...latencies);
            const maxLatency = Math.max(...latencies);
            
            console.log('\n Performance Stats:');
            console.log(`  Average: ${avgLatency.toFixed(2)}ms`);
            console.log(`  Min: ${minLatency}ms`);
            console.log(`  Max: ${maxLatency}ms`);
            
            this.testResults.push({
                test: 'Performance',
                success: true,
                avgLatency,
                minLatency,
                maxLatency
            });
        }
    }
    
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log(' TEST SUMMARY');
        console.log('='.repeat(60));
        
        const successful = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        
        console.log(`\n✅ Passed: ${successful}/${total}`);
        console.log(`❌ Failed: ${total - successful}/${total}`);
        
        console.log('\nDetailed Results:');
        this.testResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`  ${status} ${result.test}`);
            if (result.duration) {
                console.log(`     Duration: ${result.duration}ms`);
            }
            if (result.specialists) {
                console.log(`     Specialists: ${result.specialists}`);
            }
            if (result.error) {
                console.log(`     Error: ${result.error}`);
            }
        });
        
        // Get final metrics
        const metrics = this.orchestrator.getMetrics();
        console.log('\n Orchestrator Metrics:');
        console.log(`  Total API Calls: ${metrics.totalCalls}`);
        console.log(`  Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
        console.log(`  Average Latency: ${metrics.averageLatency.toFixed(2)}ms`);
        console.log(`  Cache Size: ${metrics.cacheSize}`);
        
        console.log('\n Specialist Performance:');
        Object.entries(metrics.specialistStats).forEach(([key, stats]) => {
            console.log(`  ${key}:`);
            console.log(`    Calls: ${stats.calls}`);
            console.log(`    Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
            console.log(`    Avg Latency: ${stats.averageLatency.toFixed(2)}ms`);
        });
    }
}

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log(' Claude API Orchestration Test Suite');
    console.log('Testing real Claude-in-Claude functionality\n');
    
    const tester = new ClaudeOrchestrationTester();
    tester.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

export default ClaudeOrchestrationTester;
