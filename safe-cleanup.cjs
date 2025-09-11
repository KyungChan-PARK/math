/**
 * 안전한 파일 정리 스크립트
 * 백업 생성 후 중복 파일 제거
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class SafeFileCleanup {
    constructor() {
        this.backupDir = path.join('C:\\palantir\\math', 'cleanup-backup', new Date().toISOString().slice(0,10));
        this.stats = {
            backed_up: 0,
            deleted: 0,
            skipped: 0,
            errors: 0,
            spaceSaved: 0
        };
    }

    async start() {
        console.log('═══════════════════════════════════════════════════════════════════');
        console.log('                    SAFE FILE CLEANUP UTILITY                      ');
        console.log('═══════════════════════════════════════════════════════════════════');
        console.log();
        
        // 백업 디렉토리 생성
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log(`✓ Backup directory created: ${this.backupDir}`);
        }
        
        // 정리할 파일 목록 로드
        const cleanupPlan = JSON.parse(fs.readFileSync('C:\\palantir\\math\\FILE_CLEANUP_PLAN.json', 'utf-8'));
        
        console.log('\n📊 Cleanup Summary:');
        console.log(`  • Total files to process: ${cleanupPlan.summary.totalFiles}`);
        console.log(`  • Duplicate files: ${cleanupPlan.summary.duplicates}`);
        console.log(`  • Old version files: ${cleanupPlan.summary.oldVersions}`);
        console.log(`  • Estimated space to save: ${cleanupPlan.recommendations[0].savingsMB} MB`);
        
        // 사용자 확인
        const proceed = await this.askUser('\n⚠️  Proceed with cleanup? (y/n): ');
        if (proceed.toLowerCase() !== 'y') {
            console.log('Cleanup cancelled.');
            process.exit(0);
        }
        
        // 단계별 정리
        await this.cleanupOldVersions(cleanupPlan);
        await this.cleanupEmptyFiles();
        await this.cleanupVenvDuplicates();
        
        this.printReport();
    }
    
    async cleanupOldVersions(cleanupPlan) {
        console.log('\n🔧 Cleaning up old version files...');
        
        const oldVersions = cleanupPlan.recommendations.find(r => r.action === 'Remove old version files');
        if (!oldVersions) return;
        
        for (const file of oldVersions.files.slice(0, 20)) { // 처음 20개만
            try {
                if (fs.existsSync(file)) {
                    const stats = fs.statSync(file);
                    
                    // 백업
                    const backupPath = path.join(this.backupDir, path.basename(file));
                    fs.copyFileSync(file, backupPath);
                    
                    // 삭제
                    fs.unlinkSync(file);
                    
                    this.stats.backed_up++;
                    this.stats.deleted++;
                    this.stats.spaceSaved += stats.size;
                    
                    console.log(`  ✓ Removed: ${path.basename(file)}`);
                }
            } catch (error) {
                this.stats.errors++;
                console.log(`  ✗ Error: ${path.basename(file)}`);
            }
        }
    }
    
    async cleanupEmptyFiles() {
        console.log('\n🔧 Cleaning up empty files...');
        
        const projectRoot = 'C:\\palantir\\math';
        const checkDir = (dir) => {
            try {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const stats = fs.statSync(fullPath);
                    
                    if (stats.isFile() && stats.size === 0 && !file.startsWith('.')) {
                        try {
                            fs.unlinkSync(fullPath);
                            this.stats.deleted++;
                            console.log(`  ✓ Removed empty: ${file}`);
                        } catch (err) {
                            this.stats.errors++;
                        }
                    }
                }
            } catch (error) {
                // Ignore permission errors
            }
        };
        
        checkDir(projectRoot);
    }
    
    async cleanupVenvDuplicates() {
        console.log('\n🔧 Cleaning up Python venv duplicates...');
        
        const venvDir = 'C:\\palantir\\math\\venv311\\Lib\\site-packages';
        const duplicates = [
            '__pycache__',
            '*.pyc',
            'REQUESTED',
            'INSTALLER'
        ];
        
        let cleaned = 0;
        
        // __pycache__ 디렉토리 제거
        const removePycache = (dir) => {
            try {
                if (fs.existsSync(dir)) {
                    const files = fs.readdirSync(dir);
                    for (const file of files) {
                        const fullPath = path.join(dir, file);
                        const stats = fs.statSync(fullPath);
                        
                        if (stats.isDirectory()) {
                            if (file === '__pycache__') {
                                this.removeDirectory(fullPath);
                                cleaned++;
                                console.log(`  ✓ Removed: ${file}`);
                            } else {
                                removePycache(fullPath);
                            }
                        }
                    }
                }
            } catch (error) {
                // Ignore errors
            }
        };
        
        if (fs.existsSync(venvDir)) {
            removePycache(venvDir);
            console.log(`  ✓ Cleaned ${cleaned} __pycache__ directories`);
        }
    }
    
    removeDirectory(dir) {
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach(file => {
                const curPath = path.join(dir, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.removeDirectory(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dir);
        }
    }
    
    askUser(question) {
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }
    
    printReport() {
        console.log('\n═══════════════════════════════════════════════════════════════════');
        console.log('                         CLEANUP REPORT                            ');
        console.log('═══════════════════════════════════════════════════════════════════');
        console.log(`  ✓ Files backed up: ${this.stats.backed_up}`);
        console.log(`  ✓ Files deleted: ${this.stats.deleted}`);
        console.log(`  ○ Files skipped: ${this.stats.skipped}`);
        console.log(`  ✗ Errors: ${this.stats.errors}`);
        console.log(`  💾 Space saved: ${(this.stats.spaceSaved / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  📁 Backup location: ${this.backupDir}`);
        console.log('═══════════════════════════════════════════════════════════════════');
        
        rl.close();
    }
}

// 실행
const cleanup = new SafeFileCleanup();
cleanup.start().catch(console.error);
