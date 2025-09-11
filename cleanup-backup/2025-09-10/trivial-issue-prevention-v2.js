/**
 * Trivial Issue Prevention System v2.0
 * 자동으로 반복되는 문제를 학습하고 방지하는 시스템
 * 한국어 인코딩 문제 자동 처리 추가
 * 
 * @version 2.0.0
 */

import fs from 'fs';
import path from 'path';

class TrivialIssuePrevention {
    constructor() {
        this.issuesDB = path.join(process.cwd(), '.trivial_issues.json');
        this.patternsDB = path.join(process.cwd(), '.prevention_patterns.json');
        this.knownIssues = this.loadIssues();
        this.preventionPatterns = this.loadPatterns();
    }

    loadIssues() {
        try {
            if (fs.existsSync(this.issuesDB)) {
                return JSON.parse(fs.readFileSync(this.issuesDB, 'utf8'));
            }
        } catch (error) {
            console.error('Error loading issues:', error);
        }
        
        // 초기 학습된 이슈들
        return {
            korean_encoding: {
                pattern: /[\u3131-\uD79D]/,
                solution: 'Remove Korean characters or escape them properly for non-UTF8 systems',
                occurrences: 0,
                examples: []
            },            es_module_exports: {
                pattern: /export\s+class\s+\w+\s*{|module\.exports/,
                solution: 'Always use: export default class',
                occurrences: 0,
                examples: []
            },
            powershell_commands: {
                pattern: /&&/,
                solution: 'Use semicolon (;) instead of && in PowerShell',
                occurrences: 0,
                examples: []
            },
            working_directory: {
                pattern: /\.\/|^\w+\//,
                solution: 'Always use absolute paths or cd first',
                occurrences: 0,
                examples: []
            },
            port_conflicts: {
                pattern: /:8080|:8081|:8082/,
                solution: 'Check port availability first, use dynamic port allocation',
                occurrences: 0,
                examples: []
            },
            import_errors: {
                pattern: /does not provide an export named/,
                solution: 'Check export/import consistency - use export default',
                occurrences: 0,
                examples: []
            },
            emoji_in_code: {
                pattern: /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u,
                solution: 'Remove emojis from code - use ASCII comments only',
                occurrences: 0,
                examples: []
            }
        };
    }

    loadPatterns() {
        try {
            if (fs.existsSync(this.patternsDB)) {
                return JSON.parse(fs.readFileSync(this.patternsDB, 'utf8'));
            }
        } catch (error) {
            console.error('Error loading patterns:', error);
        }
        
        return {
            file_templates: {
                es_module: `export default class ClassName {
    constructor() {
        // Initialize
    }
}`,
                powershell_cmd: 'cd C:\\palantir\\math; command',
                port_check: `
const getAvailablePort = async (startPort = 8080) => {
    const net = require('net');
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
        server.on('error', () => {
            resolve(getAvailablePort(startPort + 1));
        });
    });
};`
            },            validations: {
                check_before_execute: [
                    'Remove Korean characters from non-UTF8 contexts',
                    'Remove emojis from production code',
                    'Verify export default in ES modules',
                    'Replace && with ; in PowerShell commands',
                    'Use absolute paths or cd first',
                    'Check port availability before binding'
                ]
            }
        };
    }

    /**
     * 한국어/이모지 제거 함수
     */
    removeNonAsciiForLogs(text) {
        // 한국어를 영어로 간단히 매핑
        const koreanToEnglish = {
            '성공': 'success',
            '실패': 'failed',
            '완료': 'complete',
            '오류': 'error',
            '시작': 'start',
            '종료': 'end',
            '테스트': 'test',
            '서버': 'server',
            '연결': 'connection',
            '통합': 'integration'
        };
        
        let result = text;
        
        // 알려진 한국어 단어 치환
        Object.entries(koreanToEnglish).forEach(([korean, english]) => {
            result = result.replace(new RegExp(korean, 'g'), english);
        });
        
        // 나머지 한국어 제거 또는 [KR] 표시
        result = result.replace(/[\u3131-\uD79D]+/g, '[KR]');
        
        // 이모지 제거
        result = result.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '');
        
        return result;
    }

    /**
     * 이슈 발생 기록
     */
    recordIssue(issueType, context) {
        if (this.knownIssues[issueType]) {
            this.knownIssues[issueType].occurrences++;
            this.knownIssues[issueType].examples.push({
                timestamp: new Date().toISOString(),
                context: this.removeNonAsciiForLogs(JSON.stringify(context)),
                file: context.file || 'unknown'
            });
            
            // 최대 10개 예제만 보관
            if (this.knownIssues[issueType].examples.length > 10) {
                this.knownIssues[issueType].examples.shift();
            }
            
            this.saveIssues();
            
            console.log(`Warning: Trivial Issue Detected: ${issueType}`);
            console.log(`   Solution: ${this.knownIssues[issueType].solution}`);
            console.log(`   This is occurrence #${this.knownIssues[issueType].occurrences}`);
        }
    }

    /**
     * 코드 검증 및 자동 수정
     */
    validateAndFix(code, fileType = 'js') {
        const fixes = [];
        
        // 한국어 처리
        if (code.match(/[\u3131-\uD79D]/)) {
            const koreanCount = (code.match(/[\u3131-\uD79D]/g) || []).length;
            // 주석이 아닌 곳의 한국어만 처리
            if (!code.includes('//') || fileType === 'json') {
                code = this.removeNonAsciiForLogs(code);
                fixes.push(`Fixed: Removed ${koreanCount} Korean characters from code`);
            }
        }
        
        // 이모지 제거
        if (code.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u)) {
            code = code.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '');
            fixes.push('Fixed: Removed emojis from code');
        }        
        // ES Module export 체크
        if (fileType === 'js' && code.includes('export')) {
            if (code.match(/export\s+class\s+(\w+)\s*{/) && !code.includes('export default')) {
                const className = code.match(/export\s+class\s+(\w+)/)[1];
                code = code.replace(/export\s+class/, 'export default class');
                fixes.push(`Fixed: Changed 'export class ${className}' to 'export default class ${className}'`);
            }
            
            if (code.includes('module.exports')) {
                code = code.replace(/module\.exports\s*=\s*/, 'export default ');
                fixes.push('Fixed: Changed module.exports to export default');
            }
        }
        
        // PowerShell 명령어 체크
        if (fileType === 'ps1' || fileType === 'bat' || fileType === 'sh') {
            if (code.includes('&&')) {
                code = code.replace(/&&/g, ';');
                fixes.push('Fixed: Replaced && with ; for PowerShell');
            }
        }
        
        // 상대 경로를 절대 경로로
        if (code.includes('./') || code.includes('../')) {
            fixes.push('Warning: Relative paths detected - consider using absolute paths');
        }
        
        return { code, fixes };
    }

    /**
     * 파일 생성 전 검증
     */
    preWriteValidation(filePath, content) {
        const ext = path.extname(filePath).slice(1);
        const { code, fixes } = this.validateAndFix(content, ext);
        
        if (fixes.length > 0) {
            console.log('Auto-fixes applied:');
            fixes.forEach(fix => console.log(`   - ${fix}`));
        }
        
        return code;
    }
    /**
     * 명령 실행 전 검증
     */
    preCommandValidation(command) {
        let validatedCommand = command;
        const fixes = [];
        
        // PowerShell && 수정
        if (command.includes('&&')) {
            validatedCommand = command.replace(/&&/g, ';');
            fixes.push('Replaced && with ; for PowerShell');
        }
        
        // cd 없이 npm/node 실행 방지
        if ((command.includes('npm') || command.includes('node')) && !command.includes('cd ')) {
            if (!command.startsWith('cd ')) {
                validatedCommand = `cd C:\\palantir\\math; ${command}`;
                fixes.push('Added cd to ensure correct working directory');
            }
        }
        
        if (fixes.length > 0) {
            console.log('Command auto-corrected:');
            fixes.forEach(fix => console.log(`   - ${fix}`));
        }
        
        return validatedCommand;
    }

    /**
     * Memory 저장용 텍스트 정리
     */
    prepareForMemory(content) {
        // 메모리 저장시 한국어/이모지 문제 방지
        if (typeof content === 'string') {
            return this.removeNonAsciiForLogs(content);
        }
        
        if (Array.isArray(content)) {
            return content.map(item => this.prepareForMemory(item));
        }
        
        if (typeof content === 'object' && content !== null) {
            const cleaned = {};
            for (const [key, value] of Object.entries(content)) {
                cleaned[key] = this.prepareForMemory(value);
            }
            return cleaned;
        }
        
        return content;
    }
    /**
     * 이슈 데이터 저장
     */
    saveIssues() {
        // 저장 전 한국어 제거
        const cleanedIssues = this.prepareForMemory(this.knownIssues);
        fs.writeFileSync(this.issuesDB, JSON.stringify(cleanedIssues, null, 2));
    }

    /**
     * 패턴 데이터 저장
     */
    savePatterns() {
        const cleanedPatterns = this.prepareForMemory(this.preventionPatterns);
        fs.writeFileSync(this.patternsDB, JSON.stringify(cleanedPatterns, null, 2));
    }

    /**
     * 학습 리포트 생성
     */
    generateReport() {
        const report = {
            totalIssues: 0,
            topIssues: [],
            recommendations: []
        };
        
        Object.entries(this.knownIssues).forEach(([key, issue]) => {
            report.totalIssues += issue.occurrences;
            if (issue.occurrences > 0) {
                report.topIssues.push({
                    type: key,
                    count: issue.occurrences,
                    solution: issue.solution
                });
            }
        });
        
        report.topIssues.sort((a, b) => b.count - a.count);
        
        // 추천사항 생성
        if (report.topIssues.length > 0) {
            report.recommendations.push('Focus on preventing these top issues:');
            report.topIssues.slice(0, 3).forEach(issue => {
                report.recommendations.push(`- ${issue.type}: ${issue.solution}`);
            });
        }
        
        return report;
    }
    /**
     * 실시간 모니터링
     */
    enableRealTimeMonitoring() {
        // 프로세스 오류 캐치
        process.on('uncaughtException', (error) => {
            const errorMsg = this.removeNonAsciiForLogs(error.message);
            
            if (errorMsg.includes('export named')) {
                this.recordIssue('import_errors', { 
                    error: errorMsg,
                    stack: this.removeNonAsciiForLogs(error.stack || '')
                });
            } else if (errorMsg.includes('encoding')) {
                this.recordIssue('korean_encoding', {
                    error: errorMsg,
                    stack: this.removeNonAsciiForLogs(error.stack || '')
                });
            }
        });
        
        console.log('Trivial Issue Prevention System v2.0 Activated');
        console.log('Current Statistics:');
        const report = this.generateReport();
        console.log(`   Total issues prevented: ${report.totalIssues}`);
        if (report.topIssues.length > 0) {
            console.log('   Top issues:');
            report.topIssues.forEach(issue => {
                console.log(`   - ${issue.type}: ${issue.count} occurrences`);
            });
        }
        console.log('   NEW: Korean/Emoji auto-removal enabled');
    }

    /**
     * Express/Koa 미들웨어
     */
    middleware() {
        return (req, res, next) => {
            // Request body 정리
            if (req.body) {
                req.body = this.prepareForMemory(req.body);
            }
            
            // Response 정리
            const originalJson = res.json;
            res.json = (data) => {
                const cleaned = this.prepareForMemory(data);
                return originalJson.call(res, cleaned);
            };
            
            next();
        };
    }
}

// Export for use in other modules
export default TrivialIssuePrevention;

// Auto-activate if run directly
if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    const prevention = new TrivialIssuePrevention();
    prevention.enableRealTimeMonitoring();
    
    // Test examples
    console.log('\nTesting prevention system v2.0...\n');
    
    // Test Korean removal
    const koreanText = "ChromaDB 통합 완료";
    const cleaned = prevention.removeNonAsciiForLogs(koreanText);
    console.log('Korean text:', koreanText);
    console.log('Cleaned:', cleaned);
    
    // Test memory preparation
    const memoryData = {
        status: "성공",
        message: "ChromaDB 연결 완료 ",
        items: ["테스트", "완료"]
    };
    
    const preparedData = prevention.prepareForMemory(memoryData);
    console.log('\nMemory data:', memoryData);
    console.log('Prepared:', preparedData);
}
