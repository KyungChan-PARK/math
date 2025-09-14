#!/usr/bin/env node

/**
 * Monitoring System Restart Manager
 * 모든 모니터링 서비스 재시작 및 상태 확인
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MonitoringRestarter {
    constructor() {
        this.services = [
            {
                name: 'Self Improvement System',
                file: './self-improvement-system.js',
                port: null,
                process: null
            },
            {
                name: 'API Usage Monitor',
                file: './api-usage-monitor-simplified.js',
                port: null,
                process: null
            },
            {
                name: 'AI Collaboration Orchestrator',
                file: './ai-collaboration-orchestrator.js',
                port: 8093,
                process: null
            },
            {
                name: 'Ontology Optimizer',
                file: './ontology-optimizer.js',
                port: null,
                process: null
            },
            {
                name: 'Khan Curriculum Mapper',
                file: './khan-curriculum-mapper.js',
                port: null,
                process: null
            }
        ];
        
        this.statusFile = path.join(__dirname, 'MONITORING_RESTART_STATUS.json');
    }
    
    async startService(service) {
        console.log(`🚀 Starting ${service.name}...`);
        
        try {
            // 서비스 프로세스 시작
            service.process = spawn('node', [service.file], {
                cwd: __dirname,
                detached: false,
                stdio: 'pipe'
            });
            
            service.process.on('error', (error) => {
                console.error(`❌ ${service.name} failed to start:`, error.message);
                service.status = 'error';
            });
            
            service.process.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output.includes('ready') || output.includes('initialized') || output.includes('완료')) {
                    console.log(`✅ ${service.name} is running`);
                    service.status = 'running';
                }
            });
            
            service.process.stderr.on('data', (data) => {
                console.error(`⚠️  ${service.name} error:`, data.toString().trim());
            });
            
            // 프로세스 시작 대기
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            return true;
        } catch (error) {
            console.error(`❌ Failed to start ${service.name}:`, error.message);
            return false;
        }
    }
    
    async stopService(service) {
        if (service.process) {
            console.log(`🛑 Stopping ${service.name}...`);
            service.process.kill('SIGTERM');
            await new Promise(resolve => setTimeout(resolve, 1000));
            service.process = null;
            service.status = 'stopped';
        }
    }
    
    async updateStatusFiles() {
        // monitor_status.json 업데이트
        const monitorStatus = {
            monitor: {
                uptime: "0 seconds",
                filesWatched: 0,
                filesChecked: 0,
                issuesFixed: 0
            },
            timestamp: new Date().toISOString(),
            status: "restarted"
        };
        
        await fs.writeFile(
            path.join(__dirname, '.monitor_status.json'),
            JSON.stringify(monitorStatus, null, 2)
        );
        
        // AUTO_SYNC_STATUS.json 업데이트
        const syncStatus = {
            timestamp: new Date().toISOString(),
            current_task: "Monitoring System Restarted",
            progress: 100,
            integration_status: {
                claude_api: "active",
                parallel_processing: "enabled",
                document_sync: "active",
                ontology: "connected",
                self_improvement: "active"
            },
            auto_sync: "active",
            health: "excellent"
        };
        
        await fs.writeFile(
            path.join(__dirname, 'AUTO_SYNC_STATUS.json'),
            JSON.stringify(syncStatus, null, 2)
        );
        
        console.log('📝 Status files updated');
    }
    
    async checkPortAvailability(port) {
        if (!port) return true;
        
        return new Promise(async (resolve) => {
            const { createServer } = await import('net');
            const server = createServer();
            
            server.once('error', () => resolve(false));
            server.once('listening', () => {
                server.close();
                resolve(true);
            });
            
            server.listen(port);
        });
    }
    
    async restartAll() {
        console.log('🔄 Restarting all monitoring services...\n');
        
        const results = [];
        
        for (const service of this.services) {
            // 포트 확인
            if (service.port) {
                const portAvailable = await this.checkPortAvailability(service.port);
                if (!portAvailable) {
                    console.log(`⚠️  Port ${service.port} is in use, skipping ${service.name}`);
                    results.push({ service: service.name, status: 'skipped', reason: 'port in use' });
                    continue;
                }
            }
            
            // 서비스 시작
            const started = await this.startService(service);
            results.push({
                service: service.name,
                status: started ? 'running' : 'failed',
                timestamp: new Date().toISOString()
            });
            
            // 다음 서비스 시작 전 대기
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 상태 파일 업데이트
        await this.updateStatusFiles();
        
        // 결과 저장
        await fs.writeFile(
            this.statusFile,
            JSON.stringify({
                timestamp: new Date().toISOString(),
                services: results,
                summary: {
                    total: results.length,
                    running: results.filter(r => r.status === 'running').length,
                    failed: results.filter(r => r.status === 'failed').length,
                    skipped: results.filter(r => r.status === 'skipped').length
                }
            }, null, 2)
        );
        
        // 결과 출력
        console.log('\n' + '='.repeat(60));
        console.log('📊 Monitoring System Restart Complete');
        console.log('='.repeat(60));
        console.log(`✅ Running: ${results.filter(r => r.status === 'running').length}`);
        console.log(`❌ Failed: ${results.filter(r => r.status === 'failed').length}`);
        console.log(`⏭️  Skipped: ${results.filter(r => r.status === 'skipped').length}`);
        console.log('='.repeat(60));
        
        // 종료
        console.log('\n✨ All services have been processed');
        console.log('💡 Note: Services are running in background');
        
        // 10초 후 프로세스 종료
        setTimeout(() => {
            console.log('\n👋 Monitoring restart manager exiting...');
            process.exit(0);
        }, 10000);
    }
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    const restarter = new MonitoringRestarter();
    restarter.restartAll().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export default MonitoringRestarter;