#!/usr/bin/env node

/**
 * File Cleanup Analyzer with Ontology
 * 중복 파일, 구버전, 불필요한 파일 감지 및 정리 제안
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

const c = {
    red: (str) => `${colors.red}${str}${colors.reset}`,
    green: (str) => `${colors.green}${str}${colors.reset}`,
    yellow: (str) => `${colors.yellow}${str}${colors.reset}`,
    blue: (str) => `${colors.blue}${str}${colors.reset}`,
    magenta: (str) => `${colors.magenta}${str}${colors.reset}`,
    cyan: (str) => `${colors.cyan}${str}${colors.reset}`,
    white: (str) => `${colors.white}${str}${colors.reset}`,
    gray: (str) => `${colors.gray}${str}${colors.reset}`,
    bold: (str) => `${colors.bright}${str}${colors.reset}`
};

class FileCleanupAnalyzer {
    constructor() {
        this.projectRoot = __dirname;
        this.duplicates = [];
        this.oldVersions = [];
        this.unused = [];
        this.largeFiles = [];
        this.testFiles = [];
        this.recommendations = [];
        this.fileIndex = new Map();
    }
    
    async analyze() {
        console.log(c.cyan('═══════════════════════════════════════════════════════════════════'));
        console.log(c.cyan.bold('                    FILE CLEANUP ANALYZER                          '));
        console.log(c.cyan('═══════════════════════════════════════════════════════════════════'));
        console.log();
        
        // 1. 전체 파일 스캔
        await this.scanAllFiles();
        
        // 2. 중복 파일 감지
        await this.detectDuplicates();
        
        // 3. 구버전 파일 감지
        await this.detectOldVersions();
        
        // 4. 사용하지 않는 파일 감지
        await this.detectUnusedFiles();
        
        // 5. 대용량 파일 감지
        await this.detectLargeFiles();
        
        // 6. 테스트 파일 분류
        await this.categorizeTestFiles();
        
        // 7. 정리 권장사항 생성
        await this.generateRecommendations();
        
        // 8. 보고서 출력
        this.displayReport();
        
        // 9. 정리 계획 저장
        await this.saveCleanupPlan();
    }
    
    async scanAllFiles() {
        console.log(c.magenta(c.bold('📂 SCANNING PROJECT FILES')));
        console.log(c.white('───────────────────────────────────────────────────'));
        
        const scanDir = (dir, fileList = []) => {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const filePath = path.join(dir, file);
                
                // 제외 디렉토리
                if (file === 'node_modules' || file === '.git' || file === 'venv' || file === '.venv') {
                    continue;
                }
                
                try {
                    const stats = fs.statSync(filePath);
                    
                    if (stats.isDirectory()) {
                        scanDir(filePath, fileList);
                    } else {
                        const fileInfo = {
                            path: filePath,
                            name: file,
                            size: stats.size,
                            modified: stats.mtime,
                            ext: path.extname(file),
                            dir: path.dirname(filePath),
                            hash: null
                        };
                        
                        // 작은 파일들만 해시 계산 (성능 고려)
                        if (stats.size < 1024 * 1024) { // 1MB 이하
                            try {
                                const content = fs.readFileSync(filePath);
                                fileInfo.hash = crypto.createHash('md5').update(content).digest('hex');
                            } catch (e) {
                                // 바이너리 파일 등 읽기 실패 무시
                            }
                        }
                        
                        fileList.push(fileInfo);
                        this.fileIndex.set(filePath, fileInfo);
                    }
                } catch (error) {
                    // 접근 권한 없는 파일 무시
                }
            }
            
            return fileList;
        };
        
        const allFiles = scanDir(this.projectRoot);
        console.log(c.green(`  ✓ Total files scanned: ${allFiles.length}`));
        console.log();
        
        return allFiles;
    }
    
    async detectDuplicates() {
        console.log(c.magenta(c.bold('🔍 DETECTING DUPLICATE FILES')));
        console.log(c.white('───────────────────────────────────────────────────'));
        
        const hashMap = new Map();
        const nameMap = new Map();
        
        this.fileIndex.forEach((file, filePath) => {
            // 해시 기반 중복 (완전 동일한 파일)
            if (file.hash) {
                if (!hashMap.has(file.hash)) {
                    hashMap.set(file.hash, []);
                }
                hashMap.get(file.hash).push(filePath);
            }
            
            // 이름 기반 중복 (비슷한 이름)
            const baseName = file.name.toLowerCase()
                .replace(/[-_]\d+$/, '')
                .replace(/\.(old|backup|copy|bak|tmp)/, '')
                .replace(/\.(v\d+)/, '')
                .replace(/test/, '')
                .replace(/temp/, '');
            
            if (!nameMap.has(baseName)) {
                nameMap.set(baseName, []);
            }
            nameMap.get(baseName).push(filePath);
        });
        
        // 완전 중복 파일
        hashMap.forEach((files, hash) => {
            if (files.length > 1) {
                this.duplicates.push({
                    type: 'exact',
                    files: files,
                    hash: hash
                });
            }
        });
        
        // 이름 유사 파일
        nameMap.forEach((files, name) => {
            if (files.length > 1) {
                this.duplicates.push({
                    type: 'similar',
                    baseName: name,
                    files: files
                });
            }
        });
        
        console.log(c.yellow(`  ⚠ Exact duplicates: ${this.duplicates.filter(d => d.type === 'exact').length} groups`));
        console.log(c.yellow(`  ⚠ Similar names: ${this.duplicates.filter(d => d.type === 'similar').length} groups`));
        console.log();
    }
    
    async detectOldVersions() {
        console.log(c.magenta(c.bold('📅 DETECTING OLD VERSIONS')));
        console.log(c.white('───────────────────────────────────────────────────'));
        
        const patterns = [
            /\.old$/i,
            /\.backup$/i,
            /\.bak$/i,
            /-backup/i,
            /-old/i,
            /-copy/i,
            /\.orig$/i,
            /\(copy\)/i,
            /\.v\d+$/i,
            /-v\d+/i
        ];
        
        this.fileIndex.forEach((file, filePath) => {
            const fileName = file.name;
            
            patterns.forEach(pattern => {
                if (pattern.test(fileName)) {
                    this.oldVersions.push({
                        path: filePath,
                        name: fileName,
                        size: file.size,
                        reason: `Matches pattern: ${pattern}`
                    });
                }
            });
        });
        
        console.log(c.yellow(`  ⚠ Old version files: ${this.oldVersions.length}`));
        console.log();
    }
    
    async detectUnusedFiles() {
        console.log(c.magenta(c.bold('🗑️ DETECTING UNUSED FILES')));
        console.log(c.white('───────────────────────────────────────────────────'));
        
        const unusedPatterns = [
            /^\.DS_Store$/,
            /^Thumbs\.db$/,
            /^desktop\.ini$/,
            /~$/,
            /\.tmp$/,
            /\.temp$/,
            /\.cache$/,
            /\.log$/,
            /\.swp$/,
            /\.swo$/
        ];
        
        this.fileIndex.forEach((file, filePath) => {
            const fileName = file.name;
            
            unusedPatterns.forEach(pattern => {
                if (pattern.test(fileName)) {
                    this.unused.push({
                        path: filePath,
                        name: fileName,
                        size: file.size,
                        type: 'system/temp file'
                    });
                }
            });
            
            // 30일 이상 수정되지 않은 임시 파일
            const daysSinceModified = (Date.now() - file.modified) / (1000 * 60 * 60 * 24);
            if (daysSinceModified > 30 && fileName.includes('temp')) {
                this.unused.push({
                    path: filePath,
                    name: fileName,
                    size: file.size,
                    type: 'old temp file',
                    daysSinceModified: Math.floor(daysSinceModified)
                });
            }
        });
        
        console.log(c.yellow(`  ⚠ Unused/temp files: ${this.unused.length}`));
        console.log();
    }
    
    async detectLargeFiles() {
        console.log(c.magenta(c.bold('📦 DETECTING LARGE FILES')));
        console.log(c.white('───────────────────────────────────────────────────'));
        
        const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB
        
        this.fileIndex.forEach((file, filePath) => {
            if (file.size > LARGE_FILE_THRESHOLD) {
                this.largeFiles.push({
                    path: filePath,
                    name: file.name,
                    size: file.size,
                    sizeMB: (file.size / (1024 * 1024)).toFixed(2)
                });
            }
        });
        
        // 크기순 정렬
        this.largeFiles.sort((a, b) => b.size - a.size);
        
        console.log(c.yellow(`  ⚠ Large files (>10MB): ${this.largeFiles.length}`));
        if (this.largeFiles.length > 0) {
            console.log(c.gray(`    Largest: ${this.largeFiles[0].name} (${this.largeFiles[0].sizeMB}MB)`));
        }
        console.log();
    }
    
    async categorizeTestFiles() {
        console.log(c.magenta(c.bold('🧪 CATEGORIZING TEST FILES')));
        console.log(c.white('───────────────────────────────────────────────────'));
        
        const testPatterns = [
            /test/i,
            /spec\./,
            /\.test\./,
            /\.spec\./,
            /tests?\//,
            /^test-/
        ];
        
        this.fileIndex.forEach((file, filePath) => {
            testPatterns.forEach(pattern => {
                if (pattern.test(filePath)) {
                    this.testFiles.push({
                        path: filePath,
                        name: file.name,
                        type: 'test'
                    });
                }
            });
        });
        
        console.log(c.green(`  ✓ Test files: ${this.testFiles.length}`));
        console.log();
    }
    
    async generateRecommendations() {
        console.log(c.magenta(c.bold('💡 GENERATING CLEANUP RECOMMENDATIONS')));
        console.log(c.white('───────────────────────────────────────────────────'));
        
        let totalSavings = 0;
        
        // 1. 완전 중복 파일 제거
        const exactDuplicates = this.duplicates.filter(d => d.type === 'exact');
        if (exactDuplicates.length > 0) {
            let duplicateSize = 0;
            exactDuplicates.forEach(group => {
                group.files.slice(1).forEach(file => {
                    const fileInfo = this.fileIndex.get(file);
                    if (fileInfo) duplicateSize += fileInfo.size;
                });
            });
            
            this.recommendations.push({
                priority: 'HIGH',
                action: 'Remove exact duplicate files',
                files: exactDuplicates.flatMap(g => g.files.slice(1)),
                savings: duplicateSize,
                savingsMB: (duplicateSize / (1024 * 1024)).toFixed(2)
            });
            
            totalSavings += duplicateSize;
        }
        
        // 2. 구버전 파일 제거
        if (this.oldVersions.length > 0) {
            let oldVersionSize = this.oldVersions.reduce((sum, f) => sum + f.size, 0);
            
            this.recommendations.push({
                priority: 'MEDIUM',
                action: 'Remove old version files',
                files: this.oldVersions.map(f => f.path),
                savings: oldVersionSize,
                savingsMB: (oldVersionSize / (1024 * 1024)).toFixed(2)
            });
            
            totalSavings += oldVersionSize;
        }
        
        // 3. 시스템/임시 파일 제거
        if (this.unused.length > 0) {
            let unusedSize = this.unused.reduce((sum, f) => sum + f.size, 0);
            
            this.recommendations.push({
                priority: 'LOW',
                action: 'Remove system/temp files',
                files: this.unused.map(f => f.path),
                savings: unusedSize,
                savingsMB: (unusedSize / (1024 * 1024)).toFixed(2)
            });
            
            totalSavings += unusedSize;
        }
        
        // 4. 유사 이름 파일 검토
        const similarNames = this.duplicates.filter(d => d.type === 'similar');
        if (similarNames.length > 0) {
            this.recommendations.push({
                priority: 'REVIEW',
                action: 'Review files with similar names',
                groups: similarNames.slice(0, 10), // 상위 10개만
                note: 'Manual review recommended'
            });
        }
        
        console.log(c.green(`  ✓ Total recommendations: ${this.recommendations.length}`));
        console.log(c.green(`  ✓ Potential savings: ${(totalSavings / (1024 * 1024)).toFixed(2)}MB`));
        console.log();
    }
    
    displayReport() {
        console.log(c.cyan('═══════════════════════════════════════════════════════════════════'));
        console.log(c.cyan(c.bold('                        CLEANUP REPORT                             ')));
        console.log(c.cyan('═══════════════════════════════════════════════════════════════════'));
        console.log();
        
        // 요약
        console.log(c.white('SUMMARY:'));
        console.log(c.gray('  • Total files scanned: ') + c.white(this.fileIndex.size));
        console.log(c.gray('  • Duplicate groups: ') + c.yellow(this.duplicates.length));
        console.log(c.gray('  • Old versions: ') + c.yellow(this.oldVersions.length));
        console.log(c.gray('  • Unused files: ') + c.yellow(this.unused.length));
        console.log(c.gray('  • Large files: ') + c.yellow(this.largeFiles.length));
        console.log(c.gray('  • Test files: ') + c.green(this.testFiles.length));
        console.log();
        
        // 권장사항
        console.log(c.white('RECOMMENDATIONS:'));
        this.recommendations.forEach(rec => {
            let icon = '🟢';
            if (rec.priority === 'HIGH') icon = '🔴';
            else if (rec.priority === 'MEDIUM') icon = '🟡';
            else if (rec.priority === 'REVIEW') icon = '🔍';
            
            console.log(`  ${icon} [${rec.priority}] ${rec.action}`);
            if (rec.savingsMB) {
                console.log(c.gray(`     Potential savings: ${rec.savingsMB}MB`));
            }
            if (rec.files && rec.files.length <= 5) {
                rec.files.forEach(f => {
                    console.log(c.gray(`     - ${path.relative(this.projectRoot, f)}`));
                });
            } else if (rec.files) {
                console.log(c.gray(`     ${rec.files.length} files affected`));
            }
        });
        console.log();
        
        // 상위 중복 파일
        if (this.duplicates.length > 0) {
            console.log(c.white('TOP DUPLICATES:'));
            const exactDups = this.duplicates.filter(d => d.type === 'exact').slice(0, 3);
            exactDups.forEach(group => {
                console.log(c.yellow(`  Duplicate group (${group.files.length} files):`));
                group.files.forEach(f => {
                    console.log(c.gray(`    - ${path.relative(this.projectRoot, f)}`));
                });
            });
            console.log();
        }
    }
    
    async saveCleanupPlan() {
        const cleanupPlan = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: this.fileIndex.size,
                duplicates: this.duplicates.length,
                oldVersions: this.oldVersions.length,
                unused: this.unused.length,
                largeFiles: this.largeFiles.length
            },
            recommendations: this.recommendations,
            duplicates: this.duplicates.slice(0, 20),
            oldVersions: this.oldVersions,
            unused: this.unused,
            largeFiles: this.largeFiles
        };
        
        const planPath = path.join(this.projectRoot, 'FILE_CLEANUP_PLAN.json');
        fs.writeFileSync(planPath, JSON.stringify(cleanupPlan, null, 2));
        
        console.log(c.green('═══════════════════════════════════════════════════════════════════'));
        console.log(c.green(`  ✅ Cleanup plan saved to: FILE_CLEANUP_PLAN.json`));
        console.log(c.green('═══════════════════════════════════════════════════════════════════'));
        console.log();
        
        console.log(c.cyan('Next steps:'));
        console.log(c.gray('  1. Review FILE_CLEANUP_PLAN.json'));
        console.log(c.gray('  2. Backup important files'));
        console.log(c.gray('  3. Run cleanup with user confirmation'));
        console.log();
    }
}

// 실행
const analyzer = new FileCleanupAnalyzer();
analyzer.analyze().catch(error => {
    console.error(c.red('Error: '), error.message);
});
