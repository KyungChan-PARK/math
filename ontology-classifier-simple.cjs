// Palantir Ontology 기반 파일 분류 시스템 (Simplified)
// Ontology-Based File Classification System for Claude-Qwen Collaboration

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Palantir Ontology 핵심 개념 구현:
 * 1. Object Types: 파일을 의미있는 객체로 분류
 * 2. Properties: 각 객체의 속성 정의
 * 3. Link Types: 객체 간 관계 매핑
 * 4. Semantic Analysis: 의미론적 분석
 */

class OntologyClassifier {
    constructor(projectPath) {
        this.projectPath = projectPath;
        
        // Ontology 정의
        this.ontology = {
            objectTypes: {
                'SourceCode': ['*.js', '*.ts', '*.jsx', '*.tsx'],
                'Documentation': ['*.md', '*.txt'],
                'Configuration': ['*.json', '*.yml', '*.yaml', '.env*'],
                'Test': ['test-*.js', '*.test.js', '*.spec.js'],
                'AIAgent': ['*agent*.js', '*Agent*.js'],
                'Script': ['*.bat', '*.sh', '*.ps1'],
                'Style': ['*.css', '*.scss', '*.less'],
                'Asset': ['*.png', '*.jpg', '*.svg', '*.gif']
            }
        };
        
        this.results = {
            objects: [],
            relationships: [],
            statistics: {},
            recommendations: []
        };
    }
    
    // 파일 분류
    classifyFile(filePath, content) {
        const fileName = path.basename(filePath);
        const ext = path.extname(filePath);
        const stat = fs.statSync(filePath);
        
        // 객체 타입 결정
        let objectType = 'Unknown';
        for (const [type, patterns] of Object.entries(this.ontology.objectTypes)) {
            for (const pattern of patterns) {
                const regex = new RegExp(pattern.replace('*', '.*'));
                if (regex.test(fileName)) {
                    objectType = type;
                    break;
                }
            }
            if (objectType !== 'Unknown') break;
        }
        
        // 특수 케이스 처리
        if (fileName.includes('test') || fileName.includes('spec')) {
            objectType = 'Test';
        } else if (content && content.includes('agent') && content.includes('Agent')) {
            objectType = 'AIAgent';
        }
        
        // 파일 객체 생성
        const fileObject = {
            id: crypto.createHash('md5').update(filePath).digest('hex').substring(0, 8),
            type: objectType,
            properties: {
                fileName: fileName,
                filePath: path.relative(this.projectPath, filePath),
                extension: ext,
                size: stat.size,
                created: stat.birthtime,
                modified: stat.mtime
            }
        };
        
        // 내용 분석 (텍스트 파일만)
        if (this.isTextFile(ext) && content) {
            fileObject.analysis = this.analyzeContent(content, objectType);
        }
        
        return fileObject;
    }
    
    // 텍스트 파일 여부 확인
    isTextFile(ext) {
        const textExtensions = ['.js', '.ts', '.jsx', '.tsx', '.md', '.txt', '.json', 
                               '.yml', '.yaml', '.css', '.html', '.xml', '.sh', '.bat', '.ps1'];
        return textExtensions.includes(ext);
    }
    
    // 내용 분석
    analyzeContent(content, objectType) {
        const analysis = {
            lines: content.split('\n').length,
            complexity: 0,
            keywords: [],
            imports: [],
            exports: []
        };
        
        // JavaScript/TypeScript 분석
        if (objectType === 'SourceCode' || objectType === 'AIAgent' || objectType === 'Test') {
            // Import 추출
            const importMatches = content.match(/(?:import|require)\s*\(?\s*['"`]([^'"`]+)['"`]/g) || [];
            analysis.imports = importMatches.map(m => {
                const match = m.match(/['"`]([^'"`]+)['"`]/);
                return match ? match[1] : null;
            }).filter(Boolean);
            
            // Export 추출
            analysis.hasExports = content.includes('export ') || content.includes('module.exports');
            
            // 복잡도 계산
            analysis.complexity = this.calculateComplexity(content);
            
            // 키워드 추출
            const keywords = ['async', 'await', 'class', 'function', 'const', 'let', 'var',
                             'if', 'else', 'for', 'while', 'try', 'catch'];
            analysis.keywords = keywords.filter(kw => content.includes(kw));
        }
        
        // Markdown 분석
        if (objectType === 'Documentation') {
            const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
            analysis.headings = headings.map(h => h.replace(/^#+\s+/, ''));
            
            const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
            analysis.linkCount = links.length;
        }
        
        return analysis;
    }
    
    // 복잡도 계산
    calculateComplexity(content) {
        let complexity = 1; // 기본 복잡도
        
        // 조건문
        complexity += (content.match(/\bif\b/g) || []).length;
        complexity += (content.match(/\belse\b/g) || []).length;
        complexity += (content.match(/\bswitch\b/g) || []).length * 2;
        
        // 반복문
        complexity += (content.match(/\bfor\b/g) || []).length;
        complexity += (content.match(/\bwhile\b/g) || []).length;
        
        // 예외 처리
        complexity += (content.match(/\btry\b/g) || []).length;
        
        // 논리 연산자
        complexity += (content.match(/&&|\|\|/g) || []).length;
        
        return complexity;
    }
    
    // 관계 분석
    analyzeRelationships() {
        for (const obj of this.results.objects) {
            if (!obj.analysis) continue;
            
            // Import 관계
            if (obj.analysis.imports) {
                for (const imp of obj.analysis.imports) {
                    // 내부 파일 찾기
                    const targetObj = this.results.objects.find(o => 
                        o.properties.fileName.includes(path.basename(imp))
                    );
                    
                    if (targetObj) {
                        this.results.relationships.push({
                            from: obj.id,
                            to: targetObj.id,
                            type: 'IMPORTS',
                            detail: imp
                        });
                    }
                }
            }
            
            // 테스트 관계
            if (obj.type === 'Test') {
                const testTarget = obj.properties.fileName
                    .replace('.test', '')
                    .replace('-test', '')
                    .replace('test-', '');
                
                const targetObj = this.results.objects.find(o =>
                    o.properties.fileName.includes(testTarget) && o.type !== 'Test'
                );
                
                if (targetObj) {
                    this.results.relationships.push({
                        from: obj.id,
                        to: targetObj.id,
                        type: 'TESTS'
                    });
                }
            }
        }
    }
    
    // 프로젝트 스캔
    async scanProject() {
        console.log('🔍 Scanning project with Ontology classifier...\n');
        
        const scanDir = (dir, level = 0) => {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // 제외 디렉토리
                    if (!['node_modules', '.git', '.venv', 'venv', '__pycache__', '.vs'].includes(file)) {
                        scanDir(fullPath, level + 1);
                    }
                } else {
                    try {
                        const ext = path.extname(file);
                        let content = null;
                        
                        if (this.isTextFile(ext) && stat.size < 1024 * 1024) { // 1MB 이하만
                            content = fs.readFileSync(fullPath, 'utf-8');
                        }
                        
                        const fileObject = this.classifyFile(fullPath, content);
                        this.results.objects.push(fileObject);
                        
                    } catch (error) {
                        // 에러 무시
                    }
                }
            }
        };
        
        scanDir(this.projectPath);
        
        // 관계 분석
        this.analyzeRelationships();
        
        // 통계 생성
        this.generateStatistics();
        
        // 추천 생성
        this.generateRecommendations();
        
        return this.results;
    }
    
    // 통계 생성
    generateStatistics() {
        const stats = {
            totalFiles: this.results.objects.length,
            byType: {},
            complexity: {
                high: [],
                medium: [],
                low: []
            },
            largeFiles: [],
            relationships: this.results.relationships.length
        };
        
        // 타입별 통계
        for (const obj of this.results.objects) {
            if (!stats.byType[obj.type]) {
                stats.byType[obj.type] = 0;
            }
            stats.byType[obj.type]++;
            
            // 복잡도 분류
            if (obj.analysis && obj.analysis.complexity) {
                if (obj.analysis.complexity > 20) {
                    stats.complexity.high.push(obj.properties.fileName);
                } else if (obj.analysis.complexity > 10) {
                    stats.complexity.medium.push(obj.properties.fileName);
                } else {
                    stats.complexity.low.push(obj.properties.fileName);
                }
            }
            
            // 큰 파일
            if (obj.properties.size > 100 * 1024) { // 100KB 이상
                stats.largeFiles.push({
                    file: obj.properties.fileName,
                    size: (obj.properties.size / 1024).toFixed(2) + ' KB'
                });
            }
        }
        
        this.results.statistics = stats;
    }
    
    // 추천 생성
    generateRecommendations() {
        const recommendations = [];
        
        // 1. 복잡도 높은 파일 리팩토링
        if (this.results.statistics.complexity.high.length > 0) {
            recommendations.push({
                type: 'REFACTOR',
                priority: 'HIGH',
                message: `${this.results.statistics.complexity.high.length} files have high complexity and should be refactored`,
                files: this.results.statistics.complexity.high.slice(0, 5)
            });
        }
        
        // 2. 테스트 없는 소스 파일
        const sourceFiles = this.results.objects.filter(o => o.type === 'SourceCode');
        const testedFiles = new Set(
            this.results.relationships
                .filter(r => r.type === 'TESTS')
                .map(r => r.to)
        );
        
        const untestedFiles = sourceFiles.filter(f => !testedFiles.has(f.id));
        if (untestedFiles.length > 0) {
            recommendations.push({
                type: 'ADD_TESTS',
                priority: 'MEDIUM',
                message: `${untestedFiles.length} source files lack test coverage`,
                files: untestedFiles.slice(0, 5).map(f => f.properties.fileName)
            });
        }
        
        // 3. 문서화 필요
        const docCount = this.results.objects.filter(o => o.type === 'Documentation').length;
        const codeCount = this.results.objects.filter(o => o.type === 'SourceCode').length;
        
        if (docCount < codeCount * 0.1) {
            recommendations.push({
                type: 'ADD_DOCUMENTATION',
                priority: 'MEDIUM',
                message: 'Project lacks sufficient documentation',
                suggestion: `Only ${docCount} documentation files for ${codeCount} source files`
            });
        }
        
        // 4. 대용량 파일 최적화
        if (this.results.statistics.largeFiles.length > 0) {
            recommendations.push({
                type: 'OPTIMIZE',
                priority: 'LOW',
                message: `${this.results.statistics.largeFiles.length} files are larger than 100KB`,
                files: this.results.statistics.largeFiles.slice(0, 5)
            });
        }
        
        this.results.recommendations = recommendations;
    }
    
    // 결과 출력
    printResults() {
        console.log('\n📊 Ontology Classification Results:');
        console.log('=====================================\n');
        
        // 타입별 통계
        console.log('Object Types:');
        for (const [type, count] of Object.entries(this.results.statistics.byType)) {
            console.log(`  ${type}: ${count}`);
        }
        
        console.log(`\nTotal Files: ${this.results.statistics.totalFiles}`);
        console.log(`Relationships Found: ${this.results.statistics.relationships}`);
        
        // 복잡도 분포
        console.log('\nComplexity Distribution:');
        console.log(`  High: ${this.results.statistics.complexity.high.length}`);
        console.log(`  Medium: ${this.results.statistics.complexity.medium.length}`);
        console.log(`  Low: ${this.results.statistics.complexity.low.length}`);
        
        // 추천사항
        if (this.results.recommendations.length > 0) {
            console.log('\n📋 Recommendations:');
            for (const rec of this.results.recommendations) {
                console.log(`\n  [${rec.priority}] ${rec.type}`);
                console.log(`  ${rec.message}`);
                if (rec.files && rec.files.length > 0) {
                    console.log(`  Files: ${rec.files.join(', ')}`);
                }
            }
        }
        
        // Claude-Qwen 협업 컨텍스트
        console.log('\n🤝 Claude-Qwen Collaboration Context:');
        console.log('  Object types mapped for unified understanding');
        console.log('  Relationships identified for dependency analysis');
        console.log('  Semantic analysis ready for AI processing');
    }
}

// 메인 실행
async function main() {
    const projectPath = 'C:\\palantir\\math';
    const classifier = new OntologyClassifier(projectPath);
    
    console.log('🚀 Palantir Ontology-Based Classification System');
    console.log('================================================\n');
    
    try {
        // 프로젝트 스캔
        const results = await classifier.scanProject();
        
        // 결과 출력
        classifier.printResults();
        
        // 결과 저장
        const reportPath = path.join(projectPath, 'ontology-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        // Claude-Qwen 컨텍스트 파일 생성
        const context = {
            timestamp: new Date().toISOString(),
            ontology: classifier.ontology,
            objects: results.objects.slice(0, 100), // 상위 100개만
            relationships: results.relationships.slice(0, 100),
            statistics: results.statistics,
            recommendations: results.recommendations
        };
        
        const contextPath = path.join(projectPath, 'claude-qwen-ontology-context.json');
        fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
        console.log(`📄 Claude-Qwen context saved to: ${contextPath}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// 실행
if (require.main === module) {
    main().catch(console.error);
}

module.exports = OntologyClassifier;