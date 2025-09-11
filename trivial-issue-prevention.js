/**
 * Trivial Issue Prevention System
 * 자동으로 반복되는 문제를 학습하고 방지하는 시스템
 * 
 * @version 1.0.0
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
            es_module_exports: {
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
        
        // 방지 패턴들
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
            },
            validations: {
                check_before_execute: [
                    'Verify export default in ES modules',
                    'Replace && with ; in PowerShell commands',
                    'Use absolute paths or cd first',
                    'Check port availability before binding'
                ]
            }
        };
    }

    /**
     * 이슈 발생 기록
     */
    recordIssue(issueType, context) {
        if (this.knownIssues[issueType]) {
            this.knownIssues[issueType].occurrences++;
            this.knownIssues[issueType].examples.push({
                timestamp: new Date().toISOString(),
                context: context,
                file: context.file || 'unknown'
            });
            
            // 최대 10개 예제만 보관
            if (this.knownIssues[issueType].examples.length > 10) {
                this.knownIssues[issueType].examples.shift();
            }
            
            this.saveIssues();
            
            console.log(`️ Trivial Issue Detected: ${issueType}`);
            console.log(`   Solution: ${this.knownIssues[issueType].solution}`);
            console.log(`   This is occurrence #${this.knownIssues[issueType].occurrences}`);
        }
    }

    /**
     * 코드 검증 및 자동 수정
     */
    validateAndFix(code, fileType = 'js') {
        const fixes = [];
        
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
        if (fileType === 'ps1' || fileType === 'bat') {
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
            console.log(' Auto-fixes applied:');
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
            validatedCommand = `cd C:\\palantir\\math; ${command}`;
            fixes.push('Added cd to ensure correct working directory');
        }
        
        if (fixes.length > 0) {
            console.log(' Command auto-corrected:');
            fixes.forEach(fix => console.log(`   - ${fix}`));
        }
        
        return validatedCommand;
    }

    /**
     * 이슈 데이터 저장
     */
    saveIssues() {
        fs.writeFileSync(this.issuesDB, JSON.stringify(this.knownIssues, null, 2));
    }

    /**
     * 패턴 데이터 저장
     */
    savePatterns() {
        fs.writeFileSync(this.patternsDB, JSON.stringify(this.preventionPatterns, null, 2));
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
            if (error.message.includes('export named')) {
                this.recordIssue('import_errors', { 
                    error: error.message,
                    stack: error.stack
                });
            }
        });
        
        console.log('✅ Trivial Issue Prevention System Activated');
        console.log(' Current Statistics:');
        const report = this.generateReport();
        console.log(`   Total issues prevented: ${report.totalIssues}`);
        if (report.topIssues.length > 0) {
            console.log('   Top issues:');
            report.topIssues.forEach(issue => {
                console.log(`   - ${issue.type}: ${issue.count} occurrences`);
            });
        }
    }
}

// Export for use in other modules
export default TrivialIssuePrevention;

// Auto-activate if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const prevention = new TrivialIssuePrevention();
    prevention.enableRealTimeMonitoring();
    
    // Example usage
    console.log('\n Testing prevention system...\n');
    
    // Test ES module fix
    const badCode = `export class MyClass {
    constructor() {}
}`;
    
    const fixed = prevention.preWriteValidation('test.js', badCode);
    console.log('Original:', badCode);
    console.log('Fixed:', fixed);
    
    // Test command fix
    const badCommand = 'cd C:\\palantir\\math && npm start';
    const fixedCommand = prevention.preCommandValidation(badCommand);
    console.log('\nOriginal command:', badCommand);
    console.log('Fixed command:', fixedCommand);
}
