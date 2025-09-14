// Qwen3-Max-Preview 시스템 테스트
import chalk from 'chalk';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:8093';
const WS_URL = 'ws://localhost:8094';

// 테스트 시나리오
const testScenarios = {
    // 1. 기본 수학 문제
    mathProblem: {
        endpoint: '/api/math/solve',
        data: {
            problem: 'x^2 + 5x + 6 = 0 방정식을 풀고 그래프를 그려주세요',
            grade: 'high',
            detailed: true
        }
    },
    
    // 2. 시각화 생성
    visualization: {
        endpoint: '/api/visualize',
        data: {
            concept: 'y = sin(x) + cos(2x) 함수',
            type: 'graph',
            includeCode: true
        }
    },
    
    // 3. 수업 계획
    lessonPlan: {
        endpoint: '/api/lesson/create',
        data: {
            topic: '미적분 기초 - 도함수의 개념',
            duration: 45,
            level: 'intermediate',
            language: 'ko'
        }
    },
    
    // 4. 코드 생성
    codeGeneration: {
        endpoint: '/api/code/generate',
        data: {
            description: '포물선 y = ax^2 + bx + c를 After Effects에서 애니메이션으로 그리기',
            language: 'extendscript',
            purpose: 'visualization'
        }
    },
    
    // 5. 병렬 처리 테스트
    parallelExecution: {
        endpoint: '/api/agent/parallel',
        data: {
            tasks: [
                { agent: 'algebraExpert', task: '이차방정식의 판별식 설명' },
                { agent: 'geometryExpert', task: '피타고라스 정리 증명' },
                { agent: 'calculusExpert', task: '극한의 개념 설명' }
            ]
        }
    },
    
    // 6. 제스처 인식
    gestureRecognition: {
        endpoint: '/api/gesture/interpret',
        data: {
            keypoints: [
                { x: 0.5, y: 0.5, z: 0 },  // 손목
                { x: 0.45, y: 0.48, z: 0 }, // 엄지 CMC
                { x: 0.42, y: 0.46, z: 0 }, // 엄지 MCP
                { x: 0.40, y: 0.44, z: 0 }, // 엄지 IP
                { x: 0.38, y: 0.42, z: 0 }, // 엄지 끝
                // ... 나머지 16개 키포인트 (간략화)
            ]
        }
    }
};

// 색상 있는 로그 함수
function logSection(title) {
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan.bold(` ${title}`));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
}

// 테스트 실행 함수
async function runTest(name, config) {
    try {
        console.log(chalk.yellow(`\n🧪 Testing: ${name}`));
        console.log(chalk.gray(`   Endpoint: ${config.endpoint}`));
        
        const startTime = Date.now();
        const response = await axios.post(`${BASE_URL}${config.endpoint}`, config.data);
        const duration = Date.now() - startTime;
        
        if (response.data.success) {
            console.log(chalk.green(`   ✅ Success (${duration}ms)`));
            
            // 비용 정보 출력 (있는 경우)
            if (response.data.totalCost) {
                console.log(chalk.blue(`   💰 Cost: $${response.data.totalCost}`));
            }
            
            // 결과 요약 출력
            if (response.data.result) {
                const result = response.data.result;
                if (result.response) {
                    const preview = result.response.substring(0, 150) + '...';
                    console.log(chalk.gray(`   Preview: ${preview}`));
                }
                if (result.cost) {
                    console.log(chalk.blue(`   Tokens: ${result.cost.inputTokens} in / ${result.cost.outputTokens} out`));
                }
            }
            
            return { success: true, duration, data: response.data };
        } else {
            console.log(chalk.red(`   ❌ Failed: ${response.data.error}`));
            return { success: false, error: response.data.error };
        }
    } catch (error) {
        console.log(chalk.red(`   ❌ Error: ${error.message}`));
        return { success: false, error: error.message };
    }
}

// 헬스체크
async function healthCheck() {
    try {
        const response = await axios.get(`${BASE_URL}/api/health`);
        return response.data;
    } catch (error) {
        return null;
    }
}

// 메인 테스트 함수
async function runAllTests() {
    logSection('Qwen3-Max-Preview System Test Suite');
    
    // 1. 헬스체크
    console.log(chalk.yellow('🔍 Checking system health...'));
    const health = await healthCheck();
    
    if (!health) {
        console.log(chalk.red('❌ System is not running!'));
        console.log(chalk.yellow('💡 Please start the server first:'));
        console.log(chalk.gray('   node qwen-orchestrator-75.js'));
        return;
    }
    
    console.log(chalk.green('✅ System is healthy'));
    console.log(chalk.gray(`   Model: ${health.model}`));
    console.log(chalk.gray(`   Agents: ${health.agents}`));
    console.log(chalk.gray(`   Context: ${health.contextWindow}`));
    
    // 2. 에이전트 목록 확인
    logSection('Agent System Information');
    try {
        const agentsResponse = await axios.get(`${BASE_URL}/api/agents`);
        const agents = agentsResponse.data;
        console.log(chalk.green(`Total Agents: ${agents.total}`));
        console.log(chalk.yellow('Categories:'));
        Object.entries(agents.categories).forEach(([cat, count]) => {
            console.log(chalk.gray(`  - ${cat}: ${count} agents`));
        });
        console.log(chalk.blue('Complexity Distribution:'));
        Object.entries(agents.complexity).forEach(([level, count]) => {
            console.log(chalk.gray(`  - ${level}: ${count} agents`));
        });
    } catch (error) {
        console.log(chalk.red('Failed to get agent list'));
    }
    
    // 3. 테스트 시나리오 실행
    logSection('Running Test Scenarios');
    
    const results = {};
    let totalDuration = 0;
    let successCount = 0;
    
    for (const [name, config] of Object.entries(testScenarios)) {
        const result = await runTest(name, config);
        results[name] = result;
        if (result.success) {
            successCount++;
            totalDuration += result.duration;
        }
        
        // 속도 제한 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 4. 결과 요약
    logSection('Test Results Summary');
    
    const totalTests = Object.keys(testScenarios).length;
    const successRate = (successCount / totalTests * 100).toFixed(1);
    const avgDuration = Math.round(totalDuration / successCount);
    
    console.log(chalk.white('Test Results:'));
    Object.entries(results).forEach(([name, result]) => {
        const status = result.success 
            ? chalk.green('✅ PASS') 
            : chalk.red('❌ FAIL');
        const time = result.duration 
            ? chalk.gray(`(${result.duration}ms)`) 
            : '';
        console.log(`  ${status} ${name} ${time}`);
    });
    
    console.log(chalk.white(`\nOverall:`));
    console.log(chalk.green(`  Success Rate: ${successRate}% (${successCount}/${totalTests})`));
    console.log(chalk.blue(`  Average Response Time: ${avgDuration}ms`));
    
    // 5. 성능 비교
    logSection('Performance Comparison');
    console.log(chalk.yellow('Qwen3-Max-Preview vs Claude Models:'));
    console.log(chalk.gray('  Qwen3-Max: 1T+ params, 262K context, ~${avgDuration}ms'));
    console.log(chalk.gray('  Claude Opus: Unknown params, 200K context, ~2000ms'));
    console.log(chalk.gray('  Claude Sonnet: Unknown params, 200K context, ~1000ms'));
    console.log(chalk.gray('  Claude Haiku: Unknown params, 200K context, ~500ms'));
    
    console.log(chalk.green('\n✨ Qwen3-Max-Preview Advantages:'));
    console.log(chalk.cyan('  • Blazing fast response (reported by users)'));
    console.log(chalk.cyan('  • Larger context window (262K vs 200K)'));
    console.log(chalk.cyan('  • Cost-effective for large-scale operations'));
    console.log(chalk.cyan('  • Strong reasoning despite being "non-reasoning" model'));
}

// 메인 실행
async function main() {
    console.log(chalk.magenta.bold('\n🚀 Qwen3-Max-Preview Test Suite'));
    console.log(chalk.gray('Testing 75 AI Agents with 1T+ parameter model\n'));
    
    await runAllTests();
    
    console.log(chalk.magenta('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.magenta.bold(' Test Complete!'));
    console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

// 실행
main().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
});
