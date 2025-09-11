// Auto-apply Trivial Issue Prevention to all operations
import TrivialIssuePrevention from './trivial-issue-prevention-v2.js';
import fs from 'fs';
import path from 'path';

const prevention = new TrivialIssuePrevention();

// Override global console.log to clean Korean/emoji
const originalLog = console.log;
console.log = (...args) => {
    const cleaned = args.map(arg => {
        if (typeof arg === 'string') {
            return prevention.removeNonAsciiForLogs(arg);
        }
        return arg;
    });
    originalLog.apply(console, cleaned);
};

// Override fs.writeFileSync to auto-fix code
const originalWriteFileSync = fs.writeFileSync;
fs.writeFileSync = (filePath, content, options) => {
    if (typeof content === 'string') {
        content = prevention.preWriteValidation(filePath, content);
    }
    return originalWriteFileSync(filePath, content, options);
};

// Override process.exit to save issues
const originalExit = process.exit;
process.exit = (code) => {
    prevention.saveIssues();
    prevention.savePatterns();
    const report = prevention.generateReport();
    if (report.totalIssues > 0) {
        console.log('\nTrivial Issues Summary:');
        report.topIssues.forEach(issue => {
            console.log(`  ${issue.type}: ${issue.count} occurrences`);
        });
    }
    originalExit(code);
};

// Enable monitoring
prevention.enableRealTimeMonitoring();

// Helper function for memory operations
export function cleanForMemory(data) {
    return prevention.prepareForMemory(data);
}

// Helper for commands
export function validateCommand(cmd) {
    return prevention.preCommandValidation(cmd);
}

export default prevention;

console.log('Trivial Issue Prevention v2.0 - Global hooks installed');
