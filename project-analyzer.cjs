// Palantir Math Project Reorganizer
// 프로젝트 파일 정리 및 자가개선 시스템

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Chalk 대신 간단한 컬러 출력
const colors = {
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    magenta: (text) => `\x1b[35m${text}\x1b[0m`,
    gray: (text) => `\x1b[90m${text}\x1b[0m`,
    white: (text) => `\x1b[37m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
};

class ProjectReorganizer {
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.stats = {
            totalFiles: 0,
            duplicates: [],
            oldVersions: [],
            categorized: {},
            moved: 0,
            deleted: 0
        };
        
        // 새로운 디렉토리 구조
        this.newStructure = {
            'src': ['*.js', '*.ts', '*.jsx', '*.tsx'],
            'tests': ['test-*.js', '*-test.js', '*.test.js'],
            'docs': ['*.md', '*.txt', '*.pdf'],
            'scripts': ['activate-*.js', 'auto-*.js', 'start-*.js', '*.bat', '*.sh', '*.ps1'],
            'config': ['.env*', '*.json', '*.yml', '*.yaml'],
            'archive': [], // 구버전 파일들
            'temp': ['*.tmp', '*.log', '*.cache'],
            'assets': ['*.png', '*.jpg', '*.svg', '*.gif'],
            'build': ['dist/', 'build/'],
            '_deprecated': [] // 제거 예정 파일들
        };
        
        this.fileHashes = new Map();
        this.versionPatterns = [
            /-v\d+\./,
            /-old\./,
            /-backup\./,
            /-copy\./,
            /\(\d+\)\./,
            /-deprecated\./
        ];
    }
    
    // 파일 해시 계산 (중복 탐지용)
    getFileHash(filePath) {
        try {
            const content = fs.readFileSync(filePath);
            return crypto.createHash('md5').update(content).digest('hex');
        } catch (err) {
            return null;
        }
    }
    
    // 파일 카테고리 결정
    categorizeFile(fileName) {
        // 특수 케이스 먼저 체크
        if (fileName.startsWith('CLAUDE_')) return 'docs';
        if (fileName.startsWith('test-') || fileName.includes('.test.')) return 'tests';
        if (fileName.startsWith('activate-') || fileName.startsWith('auto-')) return 'scripts';
        
        // 확장자 기반 분류
        const ext = path.extname(fileName).toLowerCase();
        
        // 간단한 확장자 매칭
        if (['.md', '.txt', '.pdf'].includes(ext)) return 'docs';
        if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
            if (fileName.startsWith('test-')) return 'tests';
            return 'src';
        }
        if (['.json', '.yml', '.yaml'].includes(ext)) return 'config';
        if (['.bat', '.sh', '.ps1'].includes(ext)) return 'scripts';
        if (['.log', '.tmp', '.cache'].includes(ext)) return 'temp';
        if (['.png', '.jpg', '.svg', '.gif'].includes(ext)) return 'assets';
        
        return 'misc'; // 분류되지 않은 파일
    }
    
    // 구버전 파일 탐지
    isOldVersion(fileName) {
        return this.versionPatterns.some(pattern => pattern.test(fileName));
    }
    
    // 파일 스캔 및 분석
    async scanFiles(dirPath = this.rootPath, level = 0) {
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // 특정 디렉토리는 건너뛰기
                if (['node_modules', '.git', '.venv', 'venv', '__pycache__', '.vs'].includes(file)) {
                    continue;
                }
                await this.scanFiles(fullPath, level + 1);
            } else {
                this.stats.totalFiles++;
                
                // 파일 해시 계산 (작은 파일만)
                if (stat.size < 10 * 1024 * 1024) { // 10MB 이하
                    const hash = this.getFileHash(fullPath);
                    if (hash) {
                        if (this.fileHashes.has(hash)) {
                            // 중복 파일 발견
                            const original = this.fileHashes.get(hash);
                            this.stats.duplicates.push({
                                original: original,
                                duplicate: fullPath,
                                size: stat.size
                            });
                        } else {
                            this.fileHashes.set(hash, fullPath);
                        }
                    }
                }
                
                // 구버전 파일 체크
                if (this.isOldVersion(file)) {
                    this.stats.oldVersions.push(fullPath);
                }
                
                // 카테고리 분류
                const category = this.categorizeFile(file);
                if (!this.stats.categorized[category]) {
                    this.stats.categorized[category] = [];
                }
                this.stats.categorized[category].push({
                    path: fullPath,
                    name: file,
                    size: stat.size,
                    modified: stat.mtime
                });
            }
        }
    }
    
    // 분석 리포트 생성
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: this.stats.totalFiles,
                duplicatesFound: this.stats.duplicates.length,
                oldVersionsFound: this.stats.oldVersions.length,
                categories: Object.keys(this.stats.categorized).length
            },
            duplicates: this.stats.duplicates.slice(0, 10), // 상위 10개만
            oldVersions: this.stats.oldVersions.slice(0, 10),
            categorySummary: {}
        };
        
        for (const [category, files] of Object.entries(this.stats.categorized)) {
            report.categorySummary[category] = {
                count: files.length,
                totalSize: files.reduce((sum, f) => sum + f.size, 0),
                examples: files.slice(0, 3).map(f => f.name)
            };
        }
        
        return report;
    }
    
    // 실제 정리 작업 수행 (dry-run 옵션)
    async reorganize(dryRun = true) {
        console.log(colors.cyan('🔍 Scanning project files...'));
        await this.scanFiles();
        
        const report = this.generateReport();
        
        console.log(colors.green('\n📊 Analysis Complete:'));
        console.log(colors.white(`  Total Files: ${report.summary.totalFiles}`));
        console.log(colors.yellow(`  Duplicates Found: ${report.summary.duplicatesFound}`));
        console.log(colors.red(`  Old Versions Found: ${report.summary.oldVersionsFound}`));
        console.log(colors.blue(`  Categories: ${report.summary.categories}`));
        
        console.log(colors.cyan('\n📁 Category Summary:'));
        for (const [category, data] of Object.entries(report.categorySummary)) {
            const sizeInMB = (data.totalSize / 1024 / 1024).toFixed(2);
            console.log(colors.white(`  ${category}: ${data.count} files (${sizeInMB} MB)`));
            if (data.examples.length > 0) {
                console.log(colors.gray(`    Examples: ${data.examples.join(', ')}`));
            }
        }
        
        // 중복 파일 리스트
        if (report.duplicates.length > 0) {
            console.log(colors.yellow('\n🔄 Duplicate Files Found:'));
            report.duplicates.forEach(dup => {
                const origName = path.basename(dup.original);
                const dupName = path.basename(dup.duplicate);
                console.log(colors.gray(`  ${dupName} = ${origName}`));
            });
        }
        
        // 구버전 파일 리스트
        if (report.oldVersions.length > 0) {
            console.log(colors.red('\n📦 Old Version Files:'));
            report.oldVersions.forEach(old => {
                console.log(colors.gray(`  ${path.basename(old)}`));
            });
        }
        
        if (!dryRun) {
            console.log(colors.magenta('\n🚀 Starting reorganization...'));
            await this.performReorganization();
        } else {
            console.log(colors.gray('\n💡 This was a dry run. Use reorganize(false) to perform actual changes.'));
        }
        
        return report;
    }
    
    // 실제 파일 이동 및 정리
    async performReorganization() {
        // 실제 파일 이동은 위험할 수 있으므로 보류
        console.log(colors.yellow('\n⚠️ Actual file reorganization is disabled for safety.'));
        console.log(colors.gray('Please review the report and manually move files if needed.'));
    }
}

// 메인 실행
async function main() {
    const rootPath = 'C:\\palantir\\math';
    
    console.log(colors.cyan(colors.bold('🚀 Palantir Math Project Analyzer')));
    console.log(colors.gray('================================================\n'));
    
    try {
        // 1. 프로젝트 정리
        const reorganizer = new ProjectReorganizer(rootPath);
        const report = await reorganizer.reorganize(true); // dry-run 모드
        
        // 2. 리포트 저장
        const reportPath = path.join(rootPath, 'project-analysis-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(colors.green(`\n📄 Detailed report saved to: ${reportPath}`));
        
        // 3. 권장사항 출력
        console.log(colors.magenta('\n📋 Recommendations:'));
        console.log(colors.white('1. Move duplicate files to _deprecated folder'));
        console.log(colors.white('2. Archive old version files (files with -v2, -old, -backup)'));
        console.log(colors.white('3. Organize scripts into /scripts folder'));
        console.log(colors.white('4. Move test files to /tests folder'));
        console.log(colors.white('5. Consolidate documentation in /docs folder'));
        
    } catch (error) {
        console.error(colors.red('Error:'), error.message);
    }
}

// 실행
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ProjectReorganizer };