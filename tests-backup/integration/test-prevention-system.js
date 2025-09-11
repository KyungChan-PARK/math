// Test the Trivial Issue Prevention System v2.0
import prevention from './auto-prevention.js';
import { safeMemoryAdd } from './safe-memory-helper.js';

console.log('\n=== Testing Trivial Issue Prevention System v2.0 ===\n');

// Test 1: Korean text handling
console.log('Test 1: Korean Text');
console.log('ChromaDB 연결 성공! 테스트 완료.');
// Should output: ChromaDB connection success! test complete.

// Test 2: Memory preparation
console.log('\nTest 2: Memory Preparation');
const testData = {
    status: '성공',
    message: 'ChromaDB 통합 완료 ',
    error: null,
    items: ['테스트', '서버', '연결']
};

const safeData = safeMemoryAdd([{
    entityName: 'Test_Entity',
    contents: [JSON.stringify(testData)]
}]);

console.log('Original:', testData);
console.log('Cleaned:', safeData);

// Test 3: Command validation
console.log('\nTest 3: Command Validation');
const commands = [
    'cd C:\\palantir\\math && npm start',
    'npm install',
    'node server.js'
];

commands.forEach(cmd => {
    const safe = prevention.validateCommand(cmd);
    console.log(`Original: ${cmd}`);
    console.log(`Fixed: ${safe}`);
});

// Test 4: Code fixing
console.log('\nTest 4: Code Auto-Fix');
const badCode = `export default class TestClass {
    constructor() {
        this.message = "안녕하세요 ";
    }
}`;

const fixedCode = prevention.preWriteValidation('test.js', badCode);
console.log('Original code:', badCode);
console.log('Fixed code:', fixedCode);

console.log('\n=== All tests completed ===');
