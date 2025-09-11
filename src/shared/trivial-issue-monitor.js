/**
 * Trivial Issue Prevention Monitor
 * 실시간 모니터링 및 자동 방지 시스템
 * @version 1.0.0
 */

import TrivialIssuePrevention from './trivial-issue-prevention-v2.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TrivialIssueMonitor {
    constructor() {
        this.prevention = new TrivialIssuePrevention();
        this.watchedFiles = new Set();
        this.monitorInterval = null;
        this.stats = {
            filesChecked: 0,
            issuesFixed: 0,
            startTime: Date.now()
        };
    }

    /**
     * 파일 감시 시작
     */
    watchFile(filePath) {
        if (this.watchedFiles.has(filePath)) return;
        
        this.watchedFiles.add(filePath);
        
        fs.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
                this.checkAndFixFile(filePath);
            }
        });
        
        console.log(`Watching: ${path.basename(filePath)}`);
    }

    /**
     * 파일 검사 및 자동 수정
     */
    async checkAndFixFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const ext = path.extname(filePath).slice(1);
            const { code, fixes } = this.prevention.validateAndFix(content, ext);
            
            if (fixes.length > 0) {
                console.log(`\nAuto-fixing ${path.basename(filePath)}:`);
                fixes.forEach(fix => console.log(`  - ${fix}`));
                
                fs.writeFileSync(filePath, code, 'utf8');
                this.stats.issuesFixed += fixes.length;
                
                // 이슈 기록
                fixes.forEach(fix => {
                    const issueType = this.detectIssueType(fix);
                    if (issueType) {
                        this.prevention.recordIssue(issueType, {
                            file: filePath,
                            fix: fix
                        });
                    }
                });
            }
            
            this.stats.filesChecked++;
        } catch (error) {
            console.error(`Error checking ${filePath}:`, error.message);
        }
    }

    /**
     * 이슈 타입 감지
     */
    detectIssueType(fix) {
        if (fix.includes('Korean')) return 'korean_encoding';
        if (fix.includes('emoji')) return 'emoji_in_code';
        if (fix.includes('export')) return 'es_module_exports';
        if (fix.includes('PowerShell')) return 'powershell_commands';
        if (fix.includes('path')) return 'working_directory';
        if (fix.includes('port')) return 'port_conflicts';
        return null;
    }

    /**
     * 프로젝트 전체 스캔
     */
    async scanProject() {
        const excludeDirs = ['node_modules', '.git', '.venv', 'venv', 'cache'];
        const filesToCheck = [];
        
        function scanDir(dir) {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    if (!excludeDirs.includes(item)) {
                        scanDir(fullPath);
                    }
                } else if (stat.isFile()) {
                    const ext = path.extname(item);
                    if (['.js', '.ts', '.json', '.py', '.bat', '.sh', '.ps1'].includes(ext)) {
                        filesToCheck.push(fullPath);
                    }
                }
            }
        }
        
        console.log('Scanning project for trivial issues...');
        scanDir(__dirname);
        
        console.log(`Found ${filesToCheck.length} files to check`);
        
        for (const file of filesToCheck) {
            await this.checkAndFixFile(file);
        }
        
        return filesToCheck;
    }

    /**
     * 상태 리포트 생성
     */
    generateStatusReport() {
        const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
        const report = this.prevention.generateReport();
        
        return {
            monitor: {
                uptime: `${uptime} seconds`,
                filesWatched: this.watchedFiles.size,
                filesChecked: this.stats.filesChecked,
                issuesFixed: this.stats.issuesFixed
            },
            prevention: report,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 실시간 모니터링 시작
     */
    async startMonitoring() {
        console.log('=== Trivial Issue Prevention Monitor v1.0 ===\n');
        
        // 시스템 활성화
        this.prevention.enableRealTimeMonitoring();
        
        // 초기 스캔
        const files = await this.scanProject();
        
        // 주요 파일 감시
        const importantFiles = files.filter(f => 
            f.includes('integration') || 
            f.includes('test') || 
            f.includes('server') ||
            f.includes('index')
        );
        
        importantFiles.forEach(file => this.watchFile(file));
        
        // 주기적 상태 리포트
        this.monitorInterval = setInterval(() => {
            const report = this.generateStatusReport();
            
            console.log('\n=== Monitor Status ===');
            console.log(`Uptime: ${report.monitor.uptime}`);
            console.log(`Files watched: ${report.monitor.filesWatched}`);
            console.log(`Files checked: ${report.monitor.filesChecked}`);
            console.log(`Issues fixed: ${report.monitor.issuesFixed}`);
            
            if (report.prevention.topIssues.length > 0) {
                console.log('\nTop Issues:');
                report.prevention.topIssues.slice(0, 3).forEach(issue => {
                    console.log(`  ${issue.type}: ${issue.count} occurrences`);
                });
            }
            
            // 상태 파일 저장
            fs.writeFileSync(
                path.join(__dirname, '.monitor_status.json'),
                JSON.stringify(report, null, 2)
            );
        }, 30000); // 30초마다 리포트
        
        console.log('\nMonitoring started. Press Ctrl+C to stop.\n');
    }

    /**
     * 모니터링 중지
     */
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        
        this.watchedFiles.forEach(file => {
            fs.unwatchFile(file);
        });
        
        console.log('\nMonitoring stopped.');
        
        const report = this.generateStatusReport();
        console.log('\nFinal Report:');
        console.log(`Total files checked: ${report.monitor.filesChecked}`);
        console.log(`Total issues fixed: ${report.monitor.issuesFixed}`);
        
        this.prevention.saveIssues();
        this.prevention.savePatterns();
    }
}

// 메인 실행
if (process.argv[1] === __filename) {
    const monitor = new TrivialIssueMonitor();
    
    // 종료 시그널 처리
    process.on('SIGINT', () => {
        console.log('\nReceived SIGINT, shutting down gracefully...');
        monitor.stopMonitoring();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\nReceived SIGTERM, shutting down gracefully...');
        monitor.stopMonitoring();
        process.exit(0);
    });
    
    // 모니터링 시작
    monitor.startMonitoring().catch(error => {
        console.error('Monitor error:', error);
        process.exit(1);
    });
}

export default TrivialIssueMonitor;