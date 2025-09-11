/**
 * Intelligent Development System - Test & Integration
 */

import devSystem from './intelligent-dev-system.js';
import chalk from 'chalk';

async function testSystem() {
    console.log(chalk.blue.bold('\n Testing Intelligent Development System\n'));
    
    try {
        // 1. 시스템 시작
        await devSystem.start();
        
        // 2. 테스트 에러 발생
        setTimeout(() => {
            console.log(chalk.yellow('\n Simulating WebSocket performance issue...'));
            const testError = new Error('WebSocket message rate below threshold: 180 msg/sec (target: 850)');
            testError.type = 'PERFORMANCE_ISSUE';
            devSystem.handleError(testError, {
                type: 'performance',
                current: 180,
                target: 850,
                component: 'WebSocket'
            });
        }, 3000);
        
        // 3. 문서 변경 시뮬레이션
        setTimeout(() => {
            console.log(chalk.yellow('\n Simulating code change...'));
            devSystem.docSync.handleCodeChange('C:\\palantir\\math\\orchestration\\claude-orchestrator.js');
        }, 6000);
        
        // 4. 상태 확인
        setTimeout(() => {
            console.log(chalk.cyan('\n System Status:'));
            console.log(devSystem.getStatus());
        }, 9000);
        
    } catch (error) {
        console.error(chalk.red('Test failed:'), error);
    }
}

// 테스트 실행
if (process.argv[2] === 'test') {
    testSystem();
}

export { testSystem };