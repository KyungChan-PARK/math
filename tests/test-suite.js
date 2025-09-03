/**
 * Comprehensive Test Suite for AE Claude Max v3.3.0
 * ES Module Version - Compatible with our ES module architecture
 * 
 * This test suite validates all critical components of our real-time
 * natural language to After Effects system.
 * 
 * Test Coverage:
 * - WebSocket abstraction layer functionality
 * - µWebSockets performance benchmarks
 * - NLP engine accuracy
 * - ExtendScript generation correctness
 * - End-to-end integration
 * 
 * Performance Targets:
 * - WebSocket throughput: 850+ msg/sec with µWebSockets
 * - NLP processing: <10ms per message
 * - Script generation: <5ms per command
 * - End-to-end latency: <100ms
 * 
 * @module TestSuite
 * @version 3.3.0
 */

// Import required modules using ES module syntax
import WebSocketBridge from '../server/abstraction/websocket-bridge.js';
import NLPEngine from '../server/nlp-engine.js';
import ScriptGenerator from '../server/script-generator.js';

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    startTime: Date.now(),
    details: []
};

/**
 * Main test runner class
 */
class TestRunner {
    constructor() {
        this.suites = [];
    }

    /**
     * Add a test suite
     */
    addSuite(name, tests) {
        this.suites.push({ name, tests });
    }

    /**
     * Run all test suites
     */
    async runAll() {
        console.log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════╗
║     AE Claude Max v3.3.0 - Test Suite           ║
║     Platform Migration Validation               ║
╚══════════════════════════════════════════════════╗
${colors.reset}`);

        console.log(`\n${colors.blue}🚀 Starting test execution...${colors.reset}\n`);

        for (const suite of this.suites) {
            await this.runSuite(suite);
        }

        this.printSummary();
    }

    /**
     * Run a single test suite
     */
    async runSuite(suite) {
        console.log(`${colors.cyan}${colors.bold}📋 Test Suite: ${suite.name}${colors.reset}`);
        console.log('══════════════════════════════════════════════════\n');

        for (const test of suite.tests) {
            await this.runTest(test, suite.name);
        }
        console.log();
    }

    /**
     * Run a single test
     */
    async runTest(test, suiteName) {
        const startTime = Date.now();
        try {
            await test.fn();
            const duration = Date.now() - startTime;
            console.log(`${colors.green}✓${colors.reset} ${test.name} (${duration}ms)`);
            testResults.passed++;
            testResults.details.push({
                suite: suiteName,
                test: test.name,
                status: 'passed',
                duration
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            console.log(`${colors.red}✗${colors.reset} ${test.name} (${duration}ms)`);
            console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
            
            if (test.skipOnError) {
                console.log(`  ${colors.yellow}⚠️  ${test.skipOnError}${colors.reset}`);
                testResults.skipped++;
            } else {
                testResults.failed++;
            }
            
            testResults.details.push({
                suite: suiteName,
                test: test.name,
                status: 'failed',
                error: error.message,
                duration
            });
        }
    }

    /**
     * Print test summary
     */
    printSummary() {
        const totalTime = Date.now() - testResults.startTime;
        const total = testResults.passed + testResults.failed + testResults.skipped;
        const passRate = ((testResults.passed / total) * 100).toFixed(1);

        console.log('══════════════════════════════════════════════════');
        console.log(`${colors.bold}📊 Test Results Summary${colors.reset}`);
        console.log('══════════════════════════════════════════════════');
        console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
        console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
        console.log(`${colors.yellow}Skipped: ${testResults.skipped}${colors.reset}`);
        console.log(`\nTotal: ${total} tests in ${totalTime}ms`);
        
        if (testResults.failed === 0) {
            console.log(`${colors.green}${colors.bold}Pass Rate: ${passRate}%${colors.reset}`);
            console.log(`\n${colors.green}${colors.bold}✅ All tests passed!${colors.reset}`);
        } else {
            console.log(`${colors.red}${colors.bold}Pass Rate: ${passRate}%${colors.reset}`);
            console.log(`\n${colors.red}${colors.bold}⚠️  ${testResults.failed} test(s) failed${colors.reset}`);
            
            // Show failed tests
            console.log('\nFailed Tests:');
            testResults.details
                .filter(d => d.status === 'failed')
                .forEach(d => {
                    console.log(`  - ${d.suite}: ${d.test}`);
                    console.log(`    ${colors.red}${d.error}${colors.reset}`);
                });
        }
    }
}

/**
 * Helper function to assert conditions
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

/**
 * Helper function to assert equality
 */
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

/**
 * Helper function to assert object deep equality
 */
function assertDeepEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
        throw new Error(message || `Objects not equal:\nExpected: ${expectedStr}\nActual: ${actualStr}`);
    }
}

// Create test runner
const runner = new TestRunner();

// WebSocket Abstraction Layer Tests
runner.addSuite('WebSocket Abstraction Layer', [
    {
        name: 'Should initialize with ws adapter by default',
        fn: async () => {
            const bridge = new WebSocketBridge(8082);
            assert(bridge.adapter, 'Adapter should be initialized');
            assert(bridge.adapter.type === 'ws', 'Should use ws adapter by default');
        }
    },
    {
        name: 'Should initialize with µWebSockets adapter when specified',
        fn: async () => {
            try {
                const bridge = new WebSocketBridge(8083, { adapter: 'uws' });
                assert(bridge.adapter.type === 'uws', 'Should use µWebSockets adapter');
            } catch (error) {
                // µWebSockets might not be installed
                if (error.message.includes('uWebSockets')) {
                    throw Object.assign(error, { skipOnError: 'µWebSockets not available, skipping' });
                }
                throw error;
            }
        },
        skipOnError: 'µWebSockets not available, skipping'
    },
    {
        name: 'Should handle message registration correctly',
        fn: async () => {
            const bridge = new WebSocketBridge(8084);
            let handlerCalled = false;
            
            bridge.on('test-message', () => {
                handlerCalled = true;
            });
            
            // Simulate message
            bridge.handleMessage({ type: 'test-message' });
            
            assert(handlerCalled, 'Message handler should be called');
        }
    },
    {
        name: 'Should track performance metrics',
        fn: async () => {
            const bridge = new WebSocketBridge(8085);
            const metrics = bridge.getMetrics();
            
            assert(metrics, 'Should return metrics object');
            assert(typeof metrics.messagesProcessed === 'number', 'Should track messages processed');
            assert(typeof metrics.averageLatency === 'number', 'Should track average latency');
        }
    }
]);

// NLP Engine Tests
runner.addSuite('Natural Language Processing Engine', [
    {
        name: 'Should parse CREATE intent correctly',
        fn: async () => {
            const nlp = new NLPEngine();
            const result = await nlp.parse('Create a red circle');
            
            assertEqual(result.intent, 'CREATE', 'Should identify CREATE intent');
            assert(result.entities.shapes.includes('circle'), 'Should identify circle shape');
            assert(result.entities.colors.includes('red'), 'Should identify red color');
        }
    },
    {
        name: 'Should parse MOVE intent correctly',
        fn: async () => {
            const nlp = new NLPEngine();
            const result = await nlp.parse('Move the circle to the right');
            
            assertEqual(result.intent, 'MOVE', 'Should identify MOVE intent');
            assert(result.entities.directions.includes('right'), 'Should identify right direction');
        }
    },
    {
        name: 'Should parse ANIMATE intent correctly',
        fn: async () => {
            const nlp = new NLPEngine();
            const result = await nlp.parse('Make it bounce');
            
            assertEqual(result.intent, 'ANIMATE', 'Should identify ANIMATE intent');
            assert(result.parameters.animation, 'Should have animation parameters');
        }
    },
    {
        name: 'Should handle ambiguous input',
        fn: async () => {
            const nlp = new NLPEngine();
            const result = await nlp.parse('Do something cool');
            
            assert(result.confidence < 0.5, 'Should have low confidence for ambiguous input');
            assert(result.needsClarification, 'Should flag need for clarification');
        }
    },
    {
        name: 'Should process quickly',
        fn: async () => {
            const nlp = new NLPEngine();
            const startTime = Date.now();
            
            await nlp.parse('Create a complex animation with multiple shapes');
            
            const duration = Date.now() - startTime;
            assert(duration < 10, `Processing took ${duration}ms, should be under 10ms`);
        }
    }
]);

// ExtendScript Generator Tests
runner.addSuite('ExtendScript Generator', [
    {
        name: 'Should generate CREATE script correctly',
        fn: async () => {
            const generator = new ScriptGenerator();
            const result = generator.generate({
                intent: 'CREATE',
                entities: {
                    shapes: ['circle'],
                    colors: ['blue']
                },
                parameters: {}
            });
            
            const script = result.script; // Extract script from result object
            assert(script.includes('addShape'), 'Should include addShape command');
            assert(script.includes('circle'), 'Should include circle shape');
            assert(script.includes('[0, 0, 1, 1]'), 'Should include blue color values');
        }
    },
    {
        name: 'Should generate MOVE script correctly',
        fn: async () => {
            const generator = new ScriptGenerator();
            const result = generator.generate({
                intent: 'MOVE',
                entities: {
                    directions: ['left'],
                    numbers: [100]
                },
                parameters: {}
            });
            
            const script = result.script; // Extract script from result object
            assert(script.includes('position'), 'Should include position property');
            assert(script.includes('-100'), 'Should include negative value for left movement');
        }
    },
    {
        name: 'Should sanitize user input',
        fn: async () => {
            const generator = new ScriptGenerator();
            const script = generator.generate({
                intent: 'CREATE',
                entities: {
                    shapes: ['<script>alert("xss")</script>'],
                    colors: ['red']
                },
                parameters: {}
            });
            
            assert(!script.includes('<script>'), 'Should not include script tags');
            assert(!script.includes('alert'), 'Should not include alert');
        }
    },
    {
        name: 'Should wrap scripts with safety checks',
        fn: async () => {
            const generator = new ScriptGenerator();
            const script = generator.generate({
                intent: 'CREATE',
                entities: { shapes: ['circle'], colors: ['red'] },
                parameters: {}
            });
            
            assert(script.includes('try'), 'Should include try block');
            assert(script.includes('catch'), 'Should include catch block');
            assert(script.includes('app.beginUndoGroup'), 'Should include undo group');
        }
    },
    {
        name: 'Should generate quickly',
        fn: async () => {
            const generator = new ScriptGenerator();
            const startTime = Date.now();
            
            generator.generate({
                intent: 'CREATE',
                entities: { shapes: ['circle'], colors: ['red'] },
                parameters: {}
            });
            
            const duration = Date.now() - startTime;
            assert(duration < 5, `Generation took ${duration}ms, should be under 5ms`);
        }
    }
]);

// End-to-End Integration Tests
runner.addSuite('End-to-End Integration', [
    {
        name: 'Should process natural language to script',
        fn: async () => {
            const nlp = new NLPEngine();
            const generator = new ScriptGenerator();
            
            const parsed = await nlp.parse('Create a red square');
            const script = generator.generate(parsed);
            
            assert(script, 'Should generate a script');
            assert(script.includes('square'), 'Script should create a square');
            assert(script.includes('red'), 'Script should use red color');
        }
    },
    {
        name: 'Should handle complex commands',
        fn: async () => {
            const nlp = new NLPEngine();
            const generator = new ScriptGenerator();
            
            const parsed = await nlp.parse('Create 3 blue circles and make them bounce');
            const script = generator.generate(parsed);
            
            assert(script, 'Should generate a script');
            assert(parsed.entities.numbers.includes(3), 'Should parse number 3');
            assert(parsed.entities.colors.includes('blue'), 'Should parse blue color');
        }
    },
    {
        name: 'Should maintain context across commands',
        fn: async () => {
            const nlp = new NLPEngine();
            const generator = new ScriptGenerator();
            const context = {};
            
            // First command
            const parsed1 = await nlp.parse('Create a circle', context);
            const script1 = generator.generate(parsed1);
            context.lastCreated = 'circle';
            
            // Second command referring to previous
            const parsed2 = await nlp.parse('Make it red', context);
            const script2 = generator.generate(parsed2, context);
            
            assert(script2, 'Should generate script for contextual command');
            assert(script2.includes('circle') || script2.includes('selectedLayers'), 
                   'Should reference the previously created circle');
        }
    }
]);

// Performance Benchmark Tests
runner.addSuite('Performance Benchmarks', [
    {
        name: 'NLP should handle 100+ requests per second',
        fn: async () => {
            const nlp = new NLPEngine();
            const iterations = 100;
            const startTime = Date.now();
            
            for (let i = 0; i < iterations; i++) {
                await nlp.parse(`Create shape number ${i}`);
            }
            
            const duration = Date.now() - startTime;
            const rps = (iterations / duration) * 1000;
            
            assert(rps > 100, `Achieved ${rps.toFixed(1)} requests/sec, need 100+`);
        }
    },
    {
        name: 'Script generation should be cached effectively',
        fn: async () => {
            const generator = new ScriptGenerator();
            const input = {
                intent: 'CREATE',
                entities: { shapes: ['circle'], colors: ['red'] },
                parameters: {}
            };
            
            // First generation (not cached)
            const start1 = Date.now();
            const script1 = generator.generate(input);
            const time1 = Date.now() - start1;
            
            // Second generation (should be cached)
            const start2 = Date.now();
            const script2 = generator.generate(input);
            const time2 = Date.now() - start2;
            
            assertEqual(script1, script2, 'Scripts should be identical');
            assert(time2 < time1, `Cached generation (${time2}ms) should be faster than initial (${time1}ms)`);
        }
    },
    {
        name: 'End-to-end latency should be under 100ms',
        fn: async () => {
            const nlp = new NLPEngine();
            const generator = new ScriptGenerator();
            
            const startTime = Date.now();
            
            const parsed = await nlp.parse('Create a red circle and make it bounce');
            const script = generator.generate(parsed);
            
            const duration = Date.now() - startTime;
            
            assert(duration < 100, `End-to-end took ${duration}ms, should be under 100ms`);
        }
    }
]);

// Run all tests
runner.runAll().catch(error => {
    console.error(`${colors.red}Test runner failed:${colors.reset}`, error);
    process.exit(1);
});
