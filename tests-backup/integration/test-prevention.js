#!/usr/bin/env node

import TrivialIssuePrevention from './trivial-issue-prevention.js';

console.log('Starting Trivial Issue Prevention System Test...\n');

const prevention = new TrivialIssuePrevention();

// Enable monitoring
prevention.enableRealTimeMonitoring();

// Test 1: ES Module Export Fix
console.log('\n=== TEST 1: ES Module Export Fix ===');
const badESModule = `export default class TestClass {
    constructor() {
        this.name = 'test';
    }
}`;

const fixedESModule = prevention.preWriteValidation('test.js', badESModule);
console.log('Original:', badESModule);
console.log('Fixed:', fixedESModule);

// Test 2: PowerShell Command Fix
console.log('\n=== TEST 2: PowerShell Command Fix ===');
const badCommand = 'cd C:\\palantir\\math && npm start';
const fixedCommand = prevention.preCommandValidation(badCommand);
console.log('Original command:', badCommand);
console.log('Fixed command:', fixedCommand);

// Test 3: Working Directory Fix
console.log('\n=== TEST 3: Working Directory Fix ===');
const nodeCommand = 'node server/index.js';
const fixedNodeCommand = prevention.preCommandValidation(nodeCommand);
console.log('Original command:', nodeCommand);
console.log('Fixed command:', fixedNodeCommand);

// Record actual issues that occurred today
console.log('\n=== Recording Today\'s Issues ===');
prevention.recordIssue('es_module_exports', {
    file: 'nlp-engine.js',
    error: "The requested module './nlp-engine.js' does not provide an export named 'default'"
});

prevention.recordIssue('es_module_exports', {
    file: 'script-generator.js', 
    error: "The requested module './script-generator.js' does not provide an export named 'default'"
});

prevention.recordIssue('es_module_exports', {
    file: 'ae-bridge.js',
    error: "The requested module './ae-bridge.js' does not provide an export named 'default'"
});

// Generate report
console.log('\n=== Learning Report ===');
const report = prevention.generateReport();
console.log('Total issues recorded:', report.totalIssues);
console.log('Top issues:');
report.topIssues.forEach(issue => {
    console.log(`  - ${issue.type}: ${issue.count} occurrences`);
    console.log(`    Solution: ${issue.solution}`);
});

console.log('\nRecommendations:');
report.recommendations.forEach(rec => console.log(`  ${rec}`));

console.log('\n✅ Prevention system test complete!');
