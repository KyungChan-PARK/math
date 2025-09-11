#!/usr/bin/env node

/**
 * Self-Improvement System with Real-time Documentation Sync
 * Claude-Qwen 협업 기반 자가개선 메커니즘
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import chalk from 'chalk';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 자가개선 시스템
 * - 파일 변경 감지
 * - 자동 문서 업데이트
 * - 개선 제안 생성
 * - Claude-Qwen 협업 트리거
 */
class SelfImprovementSystem {
    constructor() {
        this.projectRoot = __dirname;
        this.ontologyPath = path.join(__dirname, 'palantir-ontology.js');
        this.stateFile = path.join(__dirname, 'SELF_IMPROVEMENT_STATE.json');
        this.changeLog = [];
        this.improvements = [];
        this.documentIndex = new Map();
        this.watcher = null;
        this.lastUpdateTime = Date.now();
        
        // 감시 대상 디렉토리
        this.watchPaths = [
            'orchestration',
            'ai-agents',
            'server',
            'frontend',
            'gesture'
        ];
        
        // 제외 패턴
        this.ignorePatterns = [
            /node_modules/,
            /\.git/,
            /venv/,
            /\.log$/,
            /\.tmp$/,
            /\.cache/
        ];
        
        this.initializeSystem();
    }
    
    async initializeSystem() {
        console.log(chalk.cyan('═══════════════════════════════════════════════════════════════════'));
        console.log(chalk.cyan.bold('           SELF-IMPROVEMENT SYSTEM INITIALIZING                    '));
        console.log(chalk.cyan('═══════════════════════════════════════════════════════════════════'));
        console.log();
        
        // 기존 상태 로드
        await this.loadState();
        
        // 문서 인덱스 구축
        await this.buildDocumentIndex();
        
        // 파일 감시 시작
        this.startWatching();
        
        // 주기적 개선 체크 (5분마다)
        setInterval(() => this.performImprovementCycle(), 5 * 60 * 1000);
        
        console.log(chalk.green('✅ Self-improvement system ready'));
        console.log(chalk.gray('   Watching for changes...'));
        console.log();
    }
    
    async loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = fs.readFileSync(this.stateFile, 'utf-8');
                const state = JSON.parse(data);
                this.changeLog = state.changeLog || [];
                this.improvements = state.improvements || [];
                this.lastUpdateTime = state.lastUpdateTime || Date.now();
                console.log(chalk.green('  ✓ Previous state loaded'));
            }
        } catch (error) {
            console.log(chalk.yellow('  ○ Starting with fresh state'));
        }
    }
    
    async saveState() {
        const state = {
            lastUpdateTime: this.lastUpdateTime,
            changeLog: this.changeLog.slice(-100), // 최근 100개만 저장
            improvements: this.improvements.slice(-50),
            documentCount: this.documentIndex.size,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
    }
    
    async buildDocumentIndex() {
        console.log(chalk.magenta.bold('📚 BUILDING DOCUMENT INDEX'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        const docPatterns = ['.md', '.json', '.txt'];
        const docsFound = [];
        
        const scanDir = (dir) => {
            if (!fs.existsSync(dir)) return;
            
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory() && !this.shouldIgnore(filePath)) {
                    scanDir(filePath);
                } else if (stat.isFile()) {
                    const ext = path.extname(file);
                    if (docPatterns.includes(ext)) {
                        this.documentIndex.set(filePath, {
                            path: filePath,
                            name: file,
                            type: this.getDocType(file),
                            lastModified: stat.mtime,
                            size: stat.size
                        });
                        docsFound.push(file);
                    }
                }
            });
        };
        
        // 프로젝트 루트와 주요 디렉토리 스캔
        scanDir(this.projectRoot);
        this.watchPaths.forEach(watchPath => {
            scanDir(path.join(this.projectRoot, watchPath));
        });
        
        console.log(chalk.green(`  ✓ Indexed ${this.documentIndex.size} documents`));
        console.log();
    }
    
    getDocType(filename) {
        const name = filename.toLowerCase();
        if (name.includes('readme')) return 'readme';
        if (name.includes('config')) return 'config';
        if (name.includes('state')) return 'state';
        if (name.includes('report')) return 'report';
        if (name.includes('doc')) return 'documentation';
        if (name.includes('guide')) return 'guide';
        if (name.includes('context')) return 'context';
        return 'general';
    }
    
    shouldIgnore(filePath) {
        return this.ignorePatterns.some(pattern => pattern.test(filePath));
    }
    
    startWatching() {
        console.log(chalk.magenta.bold('👁️ STARTING FILE WATCHER'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        const watchPaths = this.watchPaths.map(p => path.join(this.projectRoot, p));
        
        this.watcher = chokidar.watch(watchPaths, {
            ignored: (path) => this.shouldIgnore(path),
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 1000,
                pollInterval: 100
            }
        });
        
        // 파일 추가
        this.watcher.on('add', (filePath) => {
            this.handleFileChange('add', filePath);
        });
        
        // 파일 변경
        this.watcher.on('change', (filePath) => {
            this.handleFileChange('change', filePath);
        });
        
        // 파일 삭제
        this.watcher.on('unlink', (filePath) => {
            this.handleFileChange('delete', filePath);
        });
        
        console.log(chalk.green('  ✓ Watching directories:'));
        this.watchPaths.forEach(p => {
            console.log(chalk.gray(`    - ${p}/`));
        });
        console.log();
    }
    
    async handleFileChange(event, filePath) {
        const relativePath = path.relative(this.projectRoot, filePath);
        const timestamp = new Date().toISOString();
        
        // 변경 로그 기록
        const change = {
            event,
            path: relativePath,
            timestamp,
            fileType: path.extname(filePath)
        };
        
        this.changeLog.push(change);
        
        console.log(chalk.yellow(`\n⚡ File ${event}: ${relativePath}`));
        
        // 변경 타입에 따른 처리
        switch (event) {
            case 'add':
                await this.handleNewFile(filePath);
                break;
            case 'change':
                await this.handleFileUpdate(filePath);
                break;
            case 'delete':
                await this.handleFileDelete(filePath);
                break;
        }
        
        // 상태 저장
        await this.saveState();
    }
    
    async handleNewFile(filePath) {
        const ext = path.extname(filePath);
        const basename = path.basename(filePath);
        
        // 새 파일에 대한 문서 생성 제안
        if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
            const suggestion = {
                type: 'documentation',
                action: 'create',
                target: filePath,
                reason: 'New code file needs documentation',
                priority: 'medium'
            };
            
            this.improvements.push(suggestion);
            console.log(chalk.blue('  💡 Suggestion: Create documentation for new file'));
        }
        
        // README 업데이트 제안
        if (ext === '.js' || ext === '.jsx') {
            await this.suggestReadmeUpdate(filePath);
        }
    }
    
    async handleFileUpdate(filePath) {
        const ext = path.extname(filePath);
        const basename = path.basename(filePath);
        
        // 주요 파일 변경시 관련 문서 업데이트
        if (basename === 'package.json') {
            await this.updateProjectDocumentation('dependencies');
        } else if (basename.includes('config')) {
            await this.updateProjectDocumentation('configuration');
        } else if (this.isOrchestratorFile(filePath)) {
            await this.updateArchitectureDocumentation();
        }
        
        // 코드 파일 변경시 복잡도 체크
        if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
            await this.checkCodeComplexity(filePath);
        }
    }
    
    async handleFileDelete(filePath) {
        const basename = path.basename(filePath);
        
        // 삭제된 파일 참조 제거 제안
        const suggestion = {
            type: 'cleanup',
            action: 'remove_references',
            target: filePath,
            reason: 'File deleted, references should be removed',
            priority: 'high'
        };
        
        this.improvements.push(suggestion);
        console.log(chalk.red('  ⚠ File deleted, checking for broken references...'));
    }
    
    isOrchestratorFile(filePath) {
        return filePath.includes('orchestration') || 
               filePath.includes('qwen') || 
               filePath.includes('claude');
    }
    
    async suggestReadmeUpdate(filePath) {
        const readmePath = path.join(this.projectRoot, 'README.md');
        
        if (fs.existsSync(readmePath)) {
            const suggestion = {
                type: 'documentation',
                action: 'update',
                target: readmePath,
                reason: `New file ${path.basename(filePath)} added`,
                priority: 'low'
            };
            
            this.improvements.push(suggestion);
            console.log(chalk.blue('  💡 Suggestion: Update README with new file info'));
        }
    }
    
    async updateProjectDocumentation(type) {
        const stateFile = path.join(this.projectRoot, 'PROJECT_CURRENT_STATE.json');
        
        if (!fs.existsSync(stateFile)) return;
        
        try {
            const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
            state.lastModified = new Date().toISOString();
            state.autoUpdated = true;
            
            if (type === 'dependencies') {
                // package.json 변경 반영
                const packageJson = JSON.parse(
                    fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf-8')
                );
                state.dependencies = Object.keys(packageJson.dependencies || {});
            } else if (type === 'configuration') {
                state.configurationUpdated = new Date().toISOString();
            }
            
            fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
            console.log(chalk.green(`  ✓ Updated PROJECT_CURRENT_STATE.json (${type})`));
        } catch (error) {
            console.error(chalk.red('  ✗ Failed to update project state:'), error.message);
        }
    }
    
    async updateArchitectureDocumentation() {
        const archDocPath = path.join(this.projectRoot, 'COMPLETE_ARCHITECTURE_HIERARCHY.md');
        
        if (fs.existsSync(archDocPath)) {
            // 문서에 타임스탬프 추가
            const content = fs.readFileSync(archDocPath, 'utf-8');
            const updatedContent = content.replace(
                /^# /,
                `# [Auto-updated: ${new Date().toISOString()}]\n# `
            );
            
            if (content !== updatedContent) {
                fs.writeFileSync(archDocPath, updatedContent);
                console.log(chalk.green('  ✓ Updated architecture documentation timestamp'));
            }
        }
    }
    
    async checkCodeComplexity(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').length;
            const functions = (content.match(/function\s+\w+/g) || []).length;
            const classes = (content.match(/class\s+\w+/g) || []).length;
            const conditionals = (content.match(/if\s*\(|switch\s*\(|while\s*\(|for\s*\(/g) || []).length;
            
            const complexityScore = lines * 0.01 + functions * 2 + classes * 5 + conditionals * 1.5;
            
            if (complexityScore > 100) {
                const suggestion = {
                    type: 'refactoring',
                    action: 'reduce_complexity',
                    target: filePath,
                    reason: `High complexity score: ${complexityScore.toFixed(1)}`,
                    metrics: {
                        lines,
                        functions,
                        classes,
                        conditionals
                    },
                    priority: 'high'
                };
                
                this.improvements.push(suggestion);
                console.log(chalk.yellow(`  ⚠ High complexity detected (score: ${complexityScore.toFixed(1)})`));
            }
        } catch (error) {
            // 파일 읽기 실패 무시
        }
    }
    
    async performImprovementCycle() {
        console.log(chalk.cyan('\n🔄 PERFORMING IMPROVEMENT CYCLE'));
        console.log(chalk.white('───────────────────────────────────────────────────'));
        
        const now = Date.now();
        const timeSinceLastUpdate = now - this.lastUpdateTime;
        const minutesSinceUpdate = Math.floor(timeSinceLastUpdate / 60000);
        
        console.log(chalk.gray(`  Last update: ${minutesSinceUpdate} minutes ago`));
        console.log(chalk.gray(`  Changes logged: ${this.changeLog.length}`));
        console.log(chalk.gray(`  Pending improvements: ${this.improvements.length}`));
        
        // 개선사항 처리
        if (this.improvements.length > 0) {
            await this.processImprovements();
        }
        
        // Claude-Qwen 협업 트리거 체크
        if (this.shouldTriggerCollaboration()) {
            await this.triggerClaudeQwenCollaboration();
        }
        
        // 상태 리포트 생성
        await this.generateImprovementReport();
        
        this.lastUpdateTime = now;
        await this.saveState();
    }
    
    async processImprovements() {
        console.log(chalk.magenta.bold('\n🔧 PROCESSING IMPROVEMENTS'));
        
        // 우선순위별 정렬
        const sorted = this.improvements.sort((a, b) => {
            const priority = { high: 3, medium: 2, low: 1 };
            return (priority[b.priority] || 0) - (priority[a.priority] || 0);
        });
        
        // 상위 5개 처리
        const toProcess = sorted.slice(0, 5);
        
        for (const improvement of toProcess) {
            console.log(chalk.yellow(`\n  Processing: ${improvement.type} - ${improvement.action}`));
            console.log(chalk.gray(`    Target: ${improvement.target}`));
            console.log(chalk.gray(`    Reason: ${improvement.reason}`));
            
            // 실제 개선 작업 (시뮬레이션)
            switch (improvement.type) {
                case 'documentation':
                    await this.improveDocumentation(improvement);
                    break;
                case 'refactoring':
                    await this.suggestRefactoring(improvement);
                    break;
                case 'cleanup':
                    await this.performCleanup(improvement);
                    break;
            }
        }
        
        // 처리된 개선사항 제거
        this.improvements = this.improvements.filter(i => !toProcess.includes(i));
    }
    
    async improveDocumentation(improvement) {
        console.log(chalk.blue('    → Creating/updating documentation...'));
        // 실제 구현시 문서 생성/업데이트 로직
    }
    
    async suggestRefactoring(improvement) {
        console.log(chalk.yellow('    → Generating refactoring suggestions...'));
        // 실제 구현시 리팩토링 제안 생성
    }
    
    async performCleanup(improvement) {
        console.log(chalk.red('    → Checking for broken references...'));
        // 실제 구현시 참조 정리 로직
    }
    
    shouldTriggerCollaboration() {
        // 협업 트리거 조건
        return this.improvements.filter(i => i.priority === 'high').length > 3 ||
               this.changeLog.length > 50;
    }
    
    async triggerClaudeQwenCollaboration() {
        console.log(chalk.magenta.bold('\n🤝 TRIGGERING CLAUDE-QWEN COLLABORATION'));
        
        const collaborationRequest = {
            timestamp: new Date().toISOString(),
            trigger: 'self_improvement',
            context: {
                recentChanges: this.changeLog.slice(-20),
                pendingImprovements: this.improvements.slice(0, 10),
                documentCount: this.documentIndex.size
            },
            requestedActions: [
                'analyze_changes',
                'prioritize_improvements',
                'generate_solutions'
            ]
        };
        
        // 협업 요청 파일 생성
        const requestPath = path.join(this.projectRoot, 'COLLABORATION_REQUEST.json');
        fs.writeFileSync(requestPath, JSON.stringify(collaborationRequest, null, 2));
        
        console.log(chalk.green('  ✓ Collaboration request created'));
        console.log(chalk.gray('    Claude and Qwen will process improvements together'));
    }
    
    async generateImprovementReport() {
        const report = {
            timestamp: new Date().toISOString(),
            systemHealth: {
                status: 'active',
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                documentsIndexed: this.documentIndex.size,
                changesTracked: this.changeLog.length,
                improvementsPending: this.improvements.length
            },
            recentActivity: {
                changes: this.changeLog.slice(-10),
                improvements: this.improvements.slice(0, 5)
            },
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = path.join(this.projectRoot, 'SELF_IMPROVEMENT_REPORT.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(chalk.green('\n  ✓ Improvement report generated'));
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        // 변경 빈도 분석
        const changeFrequency = this.changeLog.length / ((Date.now() - this.lastUpdateTime) / 3600000);
        if (changeFrequency > 10) {
            recommendations.push({
                type: 'stability',
                message: 'High change frequency detected. Consider stabilizing the codebase.',
                priority: 'medium'
            });
        }
        
        // 문서화 비율
        const codeFiles = this.changeLog.filter(c => ['.js', '.jsx', '.ts', '.tsx'].includes(c.fileType)).length;
        const docFiles = this.changeLog.filter(c => ['.md', '.txt'].includes(c.fileType)).length;
        
        if (docFiles < codeFiles * 0.2) {
            recommendations.push({
                type: 'documentation',
                message: 'Documentation updates lagging behind code changes.',
                priority: 'high'
            });
        }
        
        return recommendations;
    }
    
    async shutdown() {
        console.log(chalk.yellow('\n🛑 Shutting down self-improvement system...'));
        
        if (this.watcher) {
            await this.watcher.close();
        }
        
        await this.saveState();
        console.log(chalk.green('  ✓ State saved'));
        console.log(chalk.green('  ✓ Shutdown complete'));
    }
}

// Export for use
export default SelfImprovementSystem;

// 직접 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    const system = new SelfImprovementSystem();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await system.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await system.shutdown();
        process.exit(0);
    });
    
    console.log(chalk.cyan('Press Ctrl+C to stop the self-improvement system'));
}
