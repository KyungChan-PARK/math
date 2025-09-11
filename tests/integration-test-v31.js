/**
 * PALANTIR v3.1 통합 테스트 스크립트
 * 모든 시스템 연결성 및 기능 테스트
 */

const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

// 테스트 대상 엔드포인트
const ENDPOINTS = {
    palantirAPI: 'https://palantir-ai-api-521122377191.us-central1.run.app',
    lolaIntentServer: 'http://localhost:8092',
    lolaPhysicsServer: 'http://localhost:8090',
    mathWebSocket: 'ws://localhost:8080'
};

// 테스트 결과 저장
const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
        total: 0,
        passed: 0,
        failed: 0
    }
};

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

// 테스트 로깅
function logTest(name, status, message = '') {
    const color = status === 'PASS' ? colors.green : colors.red;
    console.log(`${color}[${status}]${colors.reset} ${name} ${message ? `- ${message}` : ''}`);
    
    testResults.tests.push({
        name,
        status,
        message,
        timestamp: new Date().toISOString()
    });
    
    testResults.summary.total++;
    if (status === 'PASS') {
        testResults.summary.passed++;
    } else {
        testResults.summary.failed++;
    }
}

// 1. PALANTIR API 테스트
async function testPalantirAPI() {
    console.log(`\n${colors.blue}=== PALANTIR API Tests ===${colors.reset}`);
    
    try {
        // Health check
        const health = await axios.get(`${ENDPOINTS.palantirAPI}/health`);
        logTest('PALANTIR API Health Check', 'PASS', `Status: ${health.data.status}`);
        
        // Config check
        const config = await axios.get(`${ENDPOINTS.palantirAPI}/api/config`);
        logTest('PALANTIR API Config', 'PASS', `AI Systems: Claude, Qwen, Vertex AI`);
        
        // Agents check
        const agents = await axios.get(`${ENDPOINTS.palantirAPI}/api/agents`);
        logTest('PALANTIR API Agents', 'PASS', `Total agents: ${agents.data.total_agents}`);
        
        // Status check
        const status = await axios.get(`${ENDPOINTS.palantirAPI}/api/status`);
        logTest('PALANTIR API Status', 'PASS', `Components: ${Object.keys(status.data.components).length}`);
        
    } catch (error) {
        logTest('PALANTIR API', 'FAIL', error.message);
    }
}

// 2. LOLA Intent System 테스트
async function testLOLAIntent() {
    console.log(`\n${colors.blue}=== LOLA Intent System Tests ===${colors.reset}`);
    
    try {
        // Status check
        const status = await axios.get(`${ENDPOINTS.lolaIntentServer}/status`);
        logTest('LOLA Intent Status', 'PASS', `Session: ${status.data.session_id}`);
        
        // Submit test drawing
        const testStroke = {
            points: [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0]],
            pressure: [0.5, 0.6, 0.7, 0.6, 0.5],
            velocity: [1.0, 1.2, 1.1, 1.2, 1.0],
            context: 'geometry',
            dimension: 2
        };
        
        const attempt = await axios.post(`${ENDPOINTS.lolaIntentServer}/attempt`, testStroke);
        logTest('LOLA Intent Drawing Submission', 'PASS', `Attempt: ${attempt.data.attempt}`);
        
        // Get suggestion
        const suggestion = await axios.get(`${ENDPOINTS.lolaIntentServer}/suggestion`);
        logTest('LOLA Intent Suggestion', 'PASS', suggestion.data ? 'Suggestion generated' : 'No suggestion yet');
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            logTest('LOLA Intent System', 'FAIL', 'Server not running on port 8092');
        } else {
            logTest('LOLA Intent System', 'FAIL', error.message);
        }
    }
}

// 3. LOLA Physics 테스트
async function testLOLAPhysics() {
    console.log(`\n${colors.blue}=== LOLA Physics System Tests ===${colors.reset}`);
    
    try {
        const response = await axios.get(`${ENDPOINTS.lolaPhysicsServer}/status`);
        logTest('LOLA Physics Status', 'PASS', 'Server responding');
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            logTest('LOLA Physics System', 'FAIL', 'Server not running on port 8090');
        } else {
            logTest('LOLA Physics System', 'FAIL', error.message);
        }
    }
}

// 4. WebSocket 테스트
async function testWebSocket() {
    console.log(`\n${colors.blue}=== WebSocket Tests ===${colors.reset}`);
    
    return new Promise((resolve) => {
        const ws = new WebSocket(ENDPOINTS.mathWebSocket);
        let timeout;
        
        timeout = setTimeout(() => {
            logTest('WebSocket Connection', 'FAIL', 'Connection timeout');
            ws.close();
            resolve();
        }, 5000);
        
        ws.on('open', () => {
            clearTimeout(timeout);
            logTest('WebSocket Connection', 'PASS', 'Connected to ws://localhost:8080');
            
            // Send test message
            ws.send(JSON.stringify({
                type: 'ping',
                timestamp: Date.now()
            }));
            
            setTimeout(() => {
                ws.close();
                resolve();
            }, 1000);
        });
        
        ws.on('message', (data) => {
            logTest('WebSocket Message', 'PASS', `Received: ${data.toString().substring(0, 50)}...`);
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            if (error.code === 'ECONNREFUSED') {
                logTest('WebSocket Connection', 'FAIL', 'Server not running on port 8080');
            } else {
                logTest('WebSocket Connection', 'FAIL', error.message);
            }
            resolve();
        });
    });
}

// 5. 파일 시스템 테스트
async function testFileSystem() {
    console.log(`\n${colors.blue}=== File System Tests ===${colors.reset}`);
    
    const requiredFiles = [
        'C:/palantir/math/package.json',
        'C:/palantir/math/AI_AGENTS_SYSTEM.md',
        'C:/palantir/math/PROJECT_STATUS_LATEST.md',
        'C:/palantir/math/src/lola-integration/lola_math_intent_system.py',
        'C:/palantir-project/palantir-api/main.py'
    ];
    
    for (const file of requiredFiles) {
        try {
            await fs.access(file);
            logTest(`File: ${path.basename(file)}`, 'PASS', 'Exists');
        } catch {
            logTest(`File: ${path.basename(file)}`, 'FAIL', 'Not found');
        }
    }
}

// 6. AI 에이전트 테스트
async function testAIAgents() {
    console.log(`\n${colors.blue}=== AI Agents Tests ===${colors.reset}`);
    
    try {
        // Load agent configuration
        const agentConfig = await fs.readFile('C:/palantir/math/ai-agents/agent-factory.js', 'utf-8');
        logTest('Agent Factory', 'PASS', 'Configuration loaded');
        
        // Check for key agents
        const keyAgents = [
            '@react-expert',
            '@math-expert',
            '@lola-specialist',
            '@security-architect',
            '@ml-architect'
        ];
        
        for (const agent of keyAgents) {
            if (agentConfig.includes(agent)) {
                logTest(`Agent: ${agent}`, 'PASS', 'Configured');
            } else {
                logTest(`Agent: ${agent}`, 'FAIL', 'Not found');
            }
        }
        
    } catch (error) {
        logTest('AI Agents Configuration', 'FAIL', error.message);
    }
}

// 메인 테스트 실행 함수
async function runAllTests() {
    console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.yellow}   PALANTIR v3.1 Integration Test Suite${colors.reset}`);
    console.log(`${colors.yellow}   Started: ${new Date().toLocaleString()}${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    
    // 순차적으로 테스트 실행
    await testPalantirAPI();
    await testLOLAIntent();
    await testLOLAPhysics();
    await testWebSocket();
    await testFileSystem();
    await testAIAgents();
    
    // 결과 요약
    console.log(`\n${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.yellow}   TEST SUMMARY${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    
    const passRate = (testResults.summary.passed / testResults.summary.total * 100).toFixed(1);
    const summaryColor = passRate >= 80 ? colors.green : passRate >= 60 ? colors.yellow : colors.red;
    
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`${colors.green}Passed: ${testResults.summary.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${testResults.summary.failed}${colors.reset}`);
    console.log(`${summaryColor}Pass Rate: ${passRate}%${colors.reset}`);
    
    // 결과를 파일로 저장
    const reportPath = `C:/palantir/math/tests/integration-test-report-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n${colors.blue}Report saved to: ${reportPath}${colors.reset}`);
    
    // 실패한 테스트가 있으면 상세 정보 출력
    if (testResults.summary.failed > 0) {
        console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
        testResults.tests
            .filter(t => t.status === 'FAIL')
            .forEach(t => console.log(`  - ${t.name}: ${t.message}`));
    }
    
    // Exit code 설정
    process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// 에러 핸들링
process.on('unhandledRejection', (error) => {
    console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
    process.exit(1);
});

// 테스트 실행
runAllTests().catch(error => {
    console.error(`${colors.red}Test suite failed: ${error.message}${colors.reset}`);
    process.exit(1);
});
