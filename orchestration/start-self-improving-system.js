/**
 * Starter for Self-Improving Development System
 * This activates the integrated issue resolution and documentation system
 */

import './self-improving-system-patch.js';
import './orchestrator-bridge.js';
import './performance-bridge.js';
import SelfImprovingDevelopmentSystem from './self-improving-development-system.js';
import chalk from 'chalk';

console.log(chalk.green('\n Starting Self-Improving Development System...'));

const system = new SelfImprovingDevelopmentSystem();

console.log(chalk.green('\n✅ Self-Improving Development System is running'));
console.log(chalk.cyan('This system will:'));
console.log('  1. Automatically detect and resolve issues');
console.log('  2. Learn from every resolution');
console.log('  3. Update documentation with lessons learned');
console.log('  4. Recognize patterns and prevent future issues');
console.log('  5. Continuously improve the development process');
console.log(chalk.yellow('\n Watching for issues and changes...'));
console.log(chalk.gray('Press Ctrl+C to stop\n'));

// Keep the process running
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n Shutting down Self-Improving Development System...'));
    const report = system.generateReport();
    console.log(chalk.cyan('\n Final Report:'));
    console.log(`  Issues resolved: ${report.statistics.issuesResolved}`);
    console.log(`  Lessons learned: ${report.statistics.lessonsLearned}`);
    console.log(`  Documents updated: ${report.statistics.documentsUpdated}`);
    console.log(`  Patterns recognized: ${report.statistics.patternsRecognized}`);
    console.log(`  Auto-fixes applied: ${report.statistics.autoFixesApplied}`);
    console.log(`  Success rate: ${report.successRate.toFixed(1)}%`);
    process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.log(chalk.red('\n❌ System error detected:'), error.message);
    system.handleIssue(error, {
        file: 'system',
        type: 'uncaught',
        timestamp: new Date().toISOString()
    });
});

// Test the system if requested
if (process.argv[2] === 'test') {
    console.log(chalk.cyan('\n Running test issue...'));
    const testError = new Error('ECONNREFUSED: Connection refused to localhost:8089');
    system.handleIssue(testError, {
        file: 'test.js',
        line: 42,
        function: 'connectToOrchestrator'
    }).then(result => {
        console.log(chalk.green('✅ Test completed:', result));
    });
}
