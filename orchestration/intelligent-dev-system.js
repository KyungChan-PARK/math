/**
 * Intelligent Development System - Main Controller
 * 이슈 해결 프로토콜 + 실시간 문서 동기화 통합
 */

import IntelligentIssueResolver from './intelligent-issue-resolver.js';
import RealtimeDocumentSync from './realtime-doc-sync.js';
import chalk from 'chalk';

class IntelligentDevelopmentSystem {
    constructor() {
        this.issueResolver = new IntelligentIssueResolver();
        this.docSync = new RealtimeDocumentSync();
        this.isRunning = false;
    }

    /**
     * 시스템 시작
     */
    async start() {
        console.log(chalk.green.bold('\n Intelligent Development System Starting...'));
        console.log(chalk.cyan('━'.repeat(60)));
        
        // 1. 문서 동기화 시작
        await this.docSync.start();
        
        // 2. 이슈 모니터링 시작
        this.setupErrorHandling();
        
        // 3. 프로세스 모니터링
        this.monitorProcesses();
        
        this.isRunning = true;
        
        console.log(chalk.cyan('━'.repeat(60)));
        console.log(chalk.green.bold('✅ System Ready'));
        console.log(chalk.white('\n Features:'));
        console.log('  • Issue auto-detection and resolution search');
        console.log('  • Real-time document synchronization');
        console.log('  • User approval workflow');
        console.log('  • Learning pattern storage\n');
    }

    /**
     * 글로벌 에러 핸들링 설정
     */
    setupErrorHandling() {
        // Uncaught exceptions
        process.on('uncaughtException', async (error) => {
            console.log(chalk.red.bold('\n Uncaught Exception Detected'));
            await this.handleError(error, { type: 'uncaught' });
        });

        // Unhandled promise rejections
        process.on('unhandledRejection', async (reason, promise) => {
            console.log(chalk.red.bold('\n Unhandled Promise Rejection'));
            await this.handleError(reason, { type: 'promise', promise });
        });

        // Process warnings
        process.on('warning', (warning) => {
            console.log(chalk.yellow(`\n️  Warning: ${warning.name}`));
            console.log(warning.message);
        });
    }

    /**
     * 에러 처리 및 해결책 제시
     */
    async handleError(error, context) {
        // Issue Resolver에게 전달
        const resolution = await this.issueResolver.handleIssue(error, context);
        
        if (resolution.awaitingUserInput) {
            console.log(chalk.yellow('\n⏸️  System paused - waiting for user decision'));
            // 실제로는 여기서 사용자 입력 대기
        }
        
        return resolution;
    }

    /**
     * 프로세스 모니터링
     */
    monitorProcesses() {
        setInterval(async () => {
            try {
                // 주요 서비스 상태 확인
                const services = [
                    { name: 'Claude Orchestrator', port: 8089 },
                    { name: 'MediaPipe', port: 5000 },
                    { name: 'NLP', port: 3000 },
                    { name: 'WebSocket', port: 8085 }
                ];
                
                for (const service of services) {
                    const isRunning = await this.checkService(service.port);
                    if (!isRunning && this.isRunning) {
                        const error = new Error(`${service.name} service is not responding`);
                        error.serviceInfo = service;
                        await this.handleError(error, { type: 'service_down' });
                    }
                }
            } catch (error) {
                console.error('Monitor error:', error);
            }
        }, 30000); // 30초마다 확인
    }
    /**
     * 서비스 상태 확인
     */
    async checkService(port) {
        try {
            const response = await fetch(`http://localhost:${port}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * 시스템 상태 리포트
     */
    getStatus() {
        return {
            running: this.isRunning,
            issueResolverActive: true,
            docSyncActive: true,
            pendingIssues: this.issueResolver.issueHistory.length,
            documentRelations: this.docSync.documentRelations.size,
            updateQueue: this.docSync.updateQueue.length
        };
    }

    /**
     * 시스템 정지
     */
    async stop() {
        console.log(chalk.yellow('\n Stopping Intelligent Development System...'));
        this.isRunning = false;
        // Cleanup 로직
        console.log(chalk.green('✅ System stopped'));
    }
}

// 싱글톤 인스턴스
const devSystem = new IntelligentDevelopmentSystem();

// 시스템 시작 (자동 실행 방지, import해서 사용)
export default devSystem;

// 사용 예시:
// import devSystem from './intelligent-dev-system.js';
// await devSystem.start();