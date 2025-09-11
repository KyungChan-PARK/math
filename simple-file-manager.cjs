// Palantir Math - Simple File Management System
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SimpleFileManager {
    constructor() {
        this.projectRoot = __dirname;
        this.stats = {
            totalFiles: 0,
            jsFiles: 0,
            cjsFiles: 0,
            testFiles: 0,
            oldFiles: 0
        };
    }
    
    scanProject() {
        console.log('\n=== Palantir File Management System ===\n');
        console.log('Scanning project files...\n');
        
        const jsFiles = [];
        const cjsFiles = [];
        const testFiles = [];
        const oldFiles = [];
        
        const scan = (dir, depth = 0) => {
            if (depth > 3) return; // 최대 깊이 제한
            
            try {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    // 제외할 디렉토리
                    if (['node_modules', '.git', '.venv', 'venv', 'cache'].includes(item)) {
                        continue;
                    }
                    
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        scan(fullPath, depth + 1);
                    } else if (stat.isFile()) {
                        this.stats.totalFiles++;
                        
                        if (item.endsWith('.js')) {
                            jsFiles.push(fullPath);
                            this.stats.jsFiles++;
                            
                            if (item.includes('test') || item.startsWith('test-')) {
                                testFiles.push(fullPath);
                                this.stats.testFiles++;
                            }
                        } else if (item.endsWith('.cjs')) {
                            cjsFiles.push(fullPath);
                            this.stats.cjsFiles++;
                        }
                        
                        // 30일 이상 된 파일
                        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                        if (stat.mtime < thirtyDaysAgo) {
                            oldFiles.push(fullPath);
                            this.stats.oldFiles++;
                        }
                    }
                }
            } catch (error) {
                // 권한 오류 등 무시
            }
        };
        
        scan(this.projectRoot);
        
        return { jsFiles, cjsFiles, testFiles, oldFiles };
    }
    
    generateReport() {
        const files = this.scanProject();
        
        console.log('📊 File Statistics:');
        console.log(`  Total files: ${this.stats.totalFiles}`);
        console.log(`  JavaScript files: ${this.stats.jsFiles}`);
        console.log(`  CommonJS files: ${this.stats.cjsFiles}`);
        console.log(`  Test files: ${this.stats.testFiles}`);
        console.log(`  Old files (>30 days): ${this.stats.oldFiles}`);
        
        console.log('\n📁 Key Files:');
        const keyFiles = [
            'optimized-qwen-client.js',
            'qwen-orchestrator-optimized.js',
            'PROJECT_STATUS.md',
            'checkpoint.json'
        ];
        
        for (const file of keyFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                const stat = fs.statSync(filePath);
                console.log(`  ✓ ${file} (${Math.round(stat.size / 1024)}KB)`);
            }
        }
        
        console.log('\n💡 Recommendations:');
        if (this.stats.testFiles > 10) {
            console.log('  • Consider archiving old test files');
        }
        if (this.stats.oldFiles > 20) {
            console.log('  • Many old files detected - cleanup recommended');
        }
        if (this.stats.jsFiles > 50) {
            console.log('  • Large number of JS files - consider better organization');
        }
        
        // 리포트 저장
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            recommendations: []
        };
        
        const reportPath = path.join(this.projectRoot, 'file-management-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n✅ Report saved to: ${reportPath}`);
    }
}

// 실행
const manager = new SimpleFileManager();
manager.generateReport();