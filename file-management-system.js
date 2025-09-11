// Palantir Math - File Management & Self-Improvement System
// 파일 정리, 중복 제거, 자동 문서화, 자가 개선 기능 통합

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileManagementSystem {
    constructor() {
        this.projectRoot = __dirname;
        this.stats = {
            totalFiles: 0,
            duplicates: 0,
            obsolete: 0,
            organized: 0,
            documented: 0
        };
        
        // 중요 파일 패턴
        this.importantPatterns = [
            'optimized-qwen-client.js',
            'qwen-orchestrator-optimized.js',
            'PROJECT_STATUS.md',
            'checkpoint.json',
            '.env',
            'package.json'
        ];
        
        // 임시/테스트 파일 패턴
        this.tempPatterns = [
            /test-.*\.js$/,
            /\.tmp$/,
            /\.bak$/,
            /\-old\./,
            /\-backup\./,
            /\-copy\./
        ];
        
        // 아카이브할 디렉토리
        this.archiveDir = path.join(this.projectRoot, 'archive');
        this.reportDir = path.join(this.projectRoot, 'reports');
    }
    
    // 파일 해시 생성
    generateFileHash(filePath) {
        try {
            const content = fs.readFileSync(filePath);
            return crypto.createHash('md5').update(content).digest('hex');
        } catch (error) {
            return null;
        }
    }
    
    // 중복 파일 찾기
    async findDuplicates() {
        console.log(chalk.cyan('\n📂 Scanning for duplicate files...'));
        const fileMap = new Map();
        const duplicates = [];
        
        const scanDir = (dir) => {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // 제외할 디렉토리
                    if (!['node_modules', '.git', '.venv', 'venv', 'cache'].includes(item)) {
                        scanDir(fullPath);
                    }
                } else if (stat.isFile()) {
                    const hash = this.generateFileHash(fullPath);
                    if (hash) {
                        if (fileMap.has(hash)) {
                            duplicates.push({
                                original: fileMap.get(hash),
                                duplicate: fullPath,
                                size: stat.size
                            });
                        } else {
                            fileMap.set(hash, fullPath);
                        }
                    }
                    this.stats.totalFiles++;
                }
            }
        };
        
        scanDir(this.projectRoot);
        this.stats.duplicates = duplicates.length;
        
        return duplicates;
    }
    
    // 오래된/사용하지 않는 파일 찾기
    async findObsoleteFiles() {
        console.log(chalk.cyan('\n🗑️ Identifying obsolete files...'));
        const obsolete = [];
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        const checkFile = (filePath) => {
            const stat = fs.statSync(filePath);
            const isTemp = this.tempPatterns.some(pattern => pattern.test(path.basename(filePath)));
            const isOld = stat.mtime < thirtyDaysAgo && stat.atime < thirtyDaysAgo;
            
            if (isTemp || isOld) {
                const isImportant = this.importantPatterns.some(pattern => 
                    filePath.includes(pattern)
                );
                
                if (!isImportant) {
                    obsolete.push({
                        path: filePath,
                        reason: isTemp ? 'temporary' : 'old',
                        lastModified: stat.mtime,
                        size: stat.size
                    });
                }
            }
        };
        
        const scanDir = (dir) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    if (!['node_modules', '.git', '.venv', 'venv', 'cache'].includes(item)) {
                        scanDir(fullPath);
                    }
                } else {
                    checkFile(fullPath);
                }
            }
        };
        
        scanDir(this.projectRoot);
        this.stats.obsolete = obsolete.length;
        
        return obsolete;
    }
    
    // 파일 구조 개선
    async reorganizeStructure() {
        console.log(chalk.cyan('\n📁 Reorganizing file structure...'));
        
        // 새 디렉토리 구조 생성
        const directories = [
            'archive',
            'archive/old-tests',
            'archive/backups',
            'docs/auto-generated',
            'reports/daily',
            'reports/analysis'
        ];
        
        for (const dir of directories) {
            const fullPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(chalk.green(`  ✓ Created: ${dir}`));
            }
        }
        
        return directories;
    }
    
    // 파일 이동
    moveFile(source, destination) {
        try {
            const destDir = path.dirname(destination);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            fs.renameSync(source, destination);
            return true;
        } catch (error) {
            console.error(chalk.red(`  ✗ Failed to move: ${source}`));
            return false;
        }
    }    
    // 정리 작업 실행
    async cleanup(options = {}) {
        const { dryRun = true, archiveDuplicates = true, removeObsolete = true } = options;
        
        console.log(chalk.yellow('\n🧹 Starting cleanup process...'));
        console.log(chalk.gray(`  Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`));
        
        // 1. 중복 파일 처리
        if (archiveDuplicates) {
            const duplicates = await this.findDuplicates();
            console.log(chalk.blue(`\n📊 Found ${duplicates.length} duplicate files`));
            
            for (const dup of duplicates.slice(0, 10)) { // 처음 10개만
                console.log(chalk.gray(`  Duplicate: ${path.basename(dup.duplicate)}`));
                console.log(chalk.gray(`  Original:  ${path.basename(dup.original)}`));
                
                if (!dryRun) {
                    const archivePath = path.join(
                        this.archiveDir, 
                        'duplicates',
                        path.basename(dup.duplicate)
                    );
                    this.moveFile(dup.duplicate, archivePath);
                }
            }
        }
        
        // 2. 오래된 파일 처리
        if (removeObsolete) {
            const obsolete = await this.findObsoleteFiles();
            console.log(chalk.blue(`\n📊 Found ${obsolete.length} obsolete files`));
            
            for (const file of obsolete.slice(0, 10)) { // 처음 10개만
                console.log(chalk.gray(`  ${file.reason}: ${path.basename(file.path)}`));
                
                if (!dryRun) {
                    const archivePath = path.join(
                        this.archiveDir,
                        file.reason === 'temporary' ? 'temp' : 'old',
                        path.basename(file.path)
                    );
                    this.moveFile(file.path, archivePath);
                }
            }
        }
        
        return this.stats;
    }    
    // 자동 문서 생성
    async generateDocumentation() {
        console.log(chalk.cyan('\n📝 Generating documentation...'));
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const report = {
            timestamp,
            projectStructure: {},
            statistics: this.stats,
            recommendations: []
        };
        
        // 프로젝트 구조 분석
        const analyzeDir = (dir, level = 0) => {
            const items = fs.readdirSync(dir);
            const structure = {
                files: [],
                directories: {}
            };
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    if (!['node_modules', '.git', 'cache'].includes(item)) {
                        structure.directories[item] = analyzeDir(fullPath, level + 1);
                    }
                } else {
                    structure.files.push({
                        name: item,
                        size: stat.size,
                        modified: stat.mtime
                    });
                }
            }
            
            return structure;
        };
        
        report.projectStructure = analyzeDir(this.projectRoot);
        
        // 추천사항 생성
        if (this.stats.duplicates > 10) {
            report.recommendations.push('Many duplicate files found. Run cleanup to archive them.');
        }
        if (this.stats.obsolete > 20) {
            report.recommendations.push('Many obsolete files detected. Consider archiving old files.');
        }
        
        // 리포트 저장
        const reportPath = path.join(
            this.reportDir,
            `file-management-report-${timestamp}.json`
        );
        
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(chalk.green(`  ✓ Report saved: ${reportPath}`));
        
        return report;
    }
    
    // 자가 개선 모니터링
    async selfImprove() {
        console.log(chalk.cyan('\n🔄 Self-improvement check...'));
        
        const improvements = [];
        
        // 1. 파일 명명 규칙 확인
        const checkNaming = () => {
            const badNames = [];
            const scanDir = (dir) => {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    if (item.includes(' ') || item.includes('-copy') || item.includes('(1)')) {
                        badNames.push(path.join(dir, item));
                    }
                }
            };
            
            scanDir(this.projectRoot);
            
            if (badNames.length > 0) {
                improvements.push({
                    type: 'naming',
                    message: `Found ${badNames.length} files with poor naming`,
                    files: badNames.slice(0, 5)
                });
            }
        };
        
        checkNaming();
        
        // 2. 문서화 상태 확인
        const importantFiles = [
            'optimized-qwen-client.js',
            'qwen-orchestrator-optimized.js',
            'file-management-system.js'
        ];
        
        for (const file of importantFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const hasComments = content.includes('/**') || content.includes('//');
                
                if (!hasComments) {
                    improvements.push({
                        type: 'documentation',
                        message: `${file} needs better documentation`,
                        file
                    });
                }
            }
        }
        
        // 3. 성능 메트릭 확인
        if (this.stats.totalFiles > 100) {
            improvements.push({
                type: 'performance',
                message: 'Too many files in root directory',
                suggestion: 'Consider better organization'
            });
        }
        
        return improvements;
    }
}

// 메인 실행
async function main() {
    const manager = new FileManagementSystem();
    
    console.log(chalk.bold.cyan('\n════════════════════════════════════════════════'));
    console.log(chalk.bold.cyan(' 🚀 Palantir File Management System'));
    console.log(chalk.bold.cyan('════════════════════════════════════════════════'));
    
    // 1. 디렉토리 구조 개선
    await manager.reorganizeStructure();
    
    // 2. 정리 작업 (DRY RUN)
    const stats = await manager.cleanup({ dryRun: true });
    
    // 3. 문서 생성
    const report = await manager.generateDocumentation();
    
    // 4. 자가 개선 체크
    const improvements = await manager.selfImprove();
    
    // 결과 출력
    console.log(chalk.bold.green('\n📊 Summary:'));
    console.log(chalk.white(`  Total files: ${stats.totalFiles}`));
    console.log(chalk.yellow(`  Duplicates: ${stats.duplicates}`));
    console.log(chalk.yellow(`  Obsolete: ${stats.obsolete}`));
    console.log(chalk.green(`  Improvements needed: ${improvements.length}`));
    
    if (improvements.length > 0) {
        console.log(chalk.bold.yellow('\n💡 Improvement Suggestions:'));
        for (const imp of improvements) {
            console.log(chalk.white(`  • ${imp.message}`));
        }
    }
    
    console.log(chalk.bold.cyan('\n════════════════════════════════════════════════'));
    console.log(chalk.gray('Run with --execute flag to perform actual cleanup'));
}

// 명령줄 인자 확인
const args = process.argv.slice(2);
const execute = args.includes('--execute');

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export default FileManagementSystem;