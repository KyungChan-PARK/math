// Palantir Math - Self-Improvement Mechanism
// 프로젝트 상태 자동 모니터링 및 개선 시스템

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class SelfImprovementSystem {
    constructor() {
        this.projectRoot = __dirname;
        this.statusFile = path.join(this.projectRoot, 'PROJECT_STATUS.md');
        this.checkpointFile = path.join(this.projectRoot, 'checkpoint.json');
        this.improvementLog = path.join(this.projectRoot, 'self-improvement.log');
        
        this.metrics = {
            codeQuality: 0,
            documentation: 0,
            performance: 0,
            organization: 0
        };
    }
    
    // 프로젝트 상태 평가
    async evaluateProject() {
        console.log('\n🔍 Evaluating Project Status...\n');
        
        // 1. 코드 품질 체크
        await this.checkCodeQuality();
        
        // 2. 문서화 상태 체크
        await this.checkDocumentation();
        
        // 3. 성능 메트릭 체크
        await this.checkPerformance();
        
        // 4. 파일 구조 체크
        await this.checkOrganization();
        
        return this.metrics;
    }
    
    async checkCodeQuality() {
        console.log('📝 Checking code quality...');
        
        let score = 100;
        const issues = [];
        
        // 주요 파일 검사
        const keyFiles = [
            'optimized-qwen-client.js',
            'orchestration/qwen-orchestrator-optimized.js'
        ];
        
        for (const file of keyFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                
                // 코드 품질 체크
                if (!content.includes('try')) {
                    issues.push(`${file}: No error handling`);
                    score -= 10;
                }
                if (!content.includes('console.log')) {
                    issues.push(`${file}: No logging`);
                    score -= 5;
                }
                if (content.includes('TODO') || content.includes('FIXME')) {
                    issues.push(`${file}: Has TODO/FIXME comments`);
                    score -= 5;
                }
            }
        }
        
        this.metrics.codeQuality = Math.max(0, score);
        console.log(`  Code Quality Score: ${this.metrics.codeQuality}%`);
        
        if (issues.length > 0) {
            console.log('  Issues found:');
            issues.forEach(issue => console.log(`    - ${issue}`));
        }
    }    
    async checkDocumentation() {
        console.log('📚 Checking documentation...');
        
        let score = 100;
        const docs = ['README.md', 'PROJECT_STATUS.md', 'QUICKSTART.md'];
        const missing = [];
        
        for (const doc of docs) {
            const docPath = path.join(this.projectRoot, doc);
            if (!fs.existsSync(docPath)) {
                missing.push(doc);
                score -= 20;
            } else {
                const stat = fs.statSync(docPath);
                const daysSinceUpdate = (Date.now() - stat.mtime) / (1000 * 60 * 60 * 24);
                
                if (daysSinceUpdate > 7) {
                    console.log(`    ${doc}: ${Math.round(daysSinceUpdate)} days old`);
                    score -= 5;
                }
            }
        }
        
        this.metrics.documentation = Math.max(0, score);
        console.log(`  Documentation Score: ${this.metrics.documentation}%`);
        
        if (missing.length > 0) {
            console.log(`  Missing docs: ${missing.join(', ')}`);
        }
    }
    
    async checkPerformance() {
        console.log('⚡ Checking performance...');
        
        let score = 100;
        
        // API 헬스체크
        try {
            const response = await fetch('http://localhost:8093/api/health');
            if (response.ok) {
                const data = await response.json();
                console.log(`  API Status: ${data.status}`);
            } else {
                score -= 30;
                console.log('  API not responding properly');
            }
        } catch (error) {
            score -= 50;
            console.log('  API service not running');
        }
        
        // 캐시 상태 확인
        const cacheDir = path.join(this.projectRoot, 'cache', 'qwen');
        if (fs.existsSync(cacheDir)) {
            const cacheFiles = fs.readdirSync(cacheDir);
            console.log(`  Cache files: ${cacheFiles.length}`);
            
            if (cacheFiles.length < 10) {
                score -= 10;
                console.log('  Low cache utilization');
            }
        }
        
        this.metrics.performance = Math.max(0, score);
        console.log(`  Performance Score: ${this.metrics.performance}%`);
    }
    
    async checkOrganization() {
        console.log('📁 Checking file organization...');
        
        let score = 100;
        const rootFiles = fs.readdirSync(this.projectRoot)
            .filter(f => fs.statSync(path.join(this.projectRoot, f)).isFile());
        
        console.log(`  Files in root: ${rootFiles.length}`);
        
        if (rootFiles.length > 50) {
            score -= 30;
            console.log('  Too many files in root directory');
        }
        
        // 중복 파일 체크
        const testFiles = rootFiles.filter(f => f.includes('test'));
        if (testFiles.length > 10) {
            score -= 20;
            console.log(`  Too many test files in root: ${testFiles.length}`);
        }
        
        this.metrics.organization = Math.max(0, score);
        console.log(`  Organization Score: ${this.metrics.organization}%`);
    }