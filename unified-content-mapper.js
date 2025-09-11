// Unified Content Mapping System for Claude-Qwen Collaboration
// 통일된 콘텐츠 매핑 시스템 - 문장 단위 분석 및 의미론적 인덱싱

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import natural from 'natural';

// 통일된 매핑 스키마 (Claude & Qwen 공통)
const UNIFIED_SCHEMA = {
    // 파일 메타데이터
    file: {
        id: '',           // 고유 식별자
        path: '',         // 파일 경로
        type: '',         // 파일 타입
        size: 0,          // 파일 크기
        hash: '',         // 콘텐츠 해시
        lastModified: '', // 수정 시간
        language: '',     // 프로그래밍 언어 또는 문서 언어
    },
    
    // 의미론적 분류
    semantic: {
        category: '',     // 주 카테고리
        subcategory: '',  // 서브 카테고리
        domain: '',       // 도메인 (math, ai, system, etc.)
        purpose: '',      // 파일의 목적
        complexity: '',   // 복잡도 (simple, medium, complex)
        priority: 0,      // 중요도 (1-10)
    },
    
    // 콘텐츠 분석
    content: {
        sentences: [],    // 문장 단위 분석
        keywords: [],     // 핵심 키워드
        entities: [],     // 명명된 엔티티
        functions: [],    // 함수/메서드 목록
        dependencies: [], // 의존성
        apis: [],        // API 엔드포인트
        concepts: [],    // 수학/AI 개념
    },
    
    // 관계 매핑
    relations: {
        imports: [],      // import하는 파일들
        exports: [],      // export하는 항목들
        references: [],   // 참조하는 파일들
        referencedBy: [], // 이 파일을 참조하는 파일들
        similar: [],      // 유사한 파일들
        duplicate: null,  // 중복 파일 여부
    },
    
    // AI 분석 결과
    aiAnalysis: {
        claudeScore: {},  // Claude 분석 점수
        qwenScore: {},    // Qwen 분석 점수
        consensus: {},    // 합의된 분석
        divergence: [],   // 의견 차이
        suggestions: [],  // 개선 제안
    }
};

class UnifiedContentMapper {
    constructor(rootPath) {
        this.rootPath = rootPath;
        this.contentMap = new Map();
        this.semanticIndex = new Map();
        this.functionIndex = new Map();
        this.conceptIndex = new Map();
        this.tokenizer = new natural.SentenceTokenizer();
        this.tfidf = new natural.TfIdf();
        
        // 파일 타입별 파서
        this.parsers = {
            '.js': this.parseJavaScript.bind(this),
            '.ts': this.parseTypeScript.bind(this),
            '.jsx': this.parseJSX.bind(this),
            '.md': this.parseMarkdown.bind(this),
            '.json': this.parseJSON.bind(this),
            '.py': this.parsePython.bind(this),
            '.txt': this.parseText.bind(this),
        };
        
        // 도메인 키워드 매핑
        this.domainKeywords = {
            math: ['algebra', 'geometry', 'calculus', 'statistics', 'trigonometry', 
                   'linear', 'matrix', 'equation', 'formula', 'theorem', 'proof'],
            ai: ['agent', 'model', 'neural', 'learning', 'training', 'inference',
                 'claude', 'qwen', 'gpt', 'llm', 'embedding', 'vector'],
            visualization: ['graph', 'chart', 'plot', 'animation', 'render', 'canvas',
                           'svg', 'after effects', 'cep', 'extendscript'],
            system: ['server', 'api', 'database', 'cache', 'memory', 'performance',
                    'orchestrator', 'websocket', 'http', 'rest'],
            education: ['lesson', 'curriculum', 'assessment', 'pedagogy', 'student',
                       'teacher', 'learning', 'tutorial', 'exercise', 'quiz'],
        };
        
        // 카테고리 패턴
        this.categoryPatterns = {
            'core-system': /orchestrat|server|api|endpoint|route/i,
            'ai-agent': /agent|ai|claude|qwen|llm|model/i,
            'math-engine': /math|algebra|geometry|calculus|equation/i,
            'visualization': /visual|graph|chart|animation|render/i,
            'education': /lesson|curriculum|pedagogy|student|teacher/i,
            'testing': /test|spec|mock|fixture|assert/i,
            'configuration': /config|setup|init|env|settings/i,
            'documentation': /doc|readme|guide|manual|tutorial/i,
            'utility': /util|helper|tool|common|shared/i,
            'integration': /bridge|adapter|connector|integration/i,
        };
    }
    
    // 전체 프로젝트 매핑
    async mapProject() {
        console.log('🔍 Starting unified content mapping...\n');
        
        const startTime = Date.now();
        const files = await this.scanFiles(this.rootPath);
        
        console.log(`📂 Found ${files.length} files to analyze\n`);
        
        let processed = 0;
        for (const file of files) {
            await this.mapFile(file);
            processed++;
            
            if (processed % 10 === 0) {
                const progress = ((processed / files.length) * 100).toFixed(1);
                console.log(`Progress: ${progress}% (${processed}/${files.length})`);
            }
        }
        
        // 관계 분석
        await this.analyzeRelations();
        
        // 유사성 계산
        await this.calculateSimilarities();
        
        // 인덱스 구축
        await this.buildIndices();
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✅ Mapping completed in ${duration}s`);
        
        return this.generateReport();
    }
    
    // 파일 스캔
    async scanFiles(dir, files = []) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // 제외할 디렉토리
                if (['node_modules', '.git', '.venv', 'venv', '__pycache__', 'build', 'dist'].includes(item)) {
                    continue;
                }
                await this.scanFiles(fullPath, files);
            } else {
                const ext = path.extname(item);
                if (this.parsers[ext]) {
                    files.push(fullPath);
                }
            }
        }
        
        return files;
    }
    
    // 파일 매핑
    async mapFile(filePath) {
        const ext = path.extname(filePath);
        const stat = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        const hash = crypto.createHash('md5').update(content).digest('hex');
        
        // 통일된 스키마 복사
        const mapping = JSON.parse(JSON.stringify(UNIFIED_SCHEMA));
        
        // 파일 메타데이터
        mapping.file = {
            id: hash.substring(0, 12),
            path: path.relative(this.rootPath, filePath),
            type: ext,
            size: stat.size,
            hash: hash,
            lastModified: stat.mtime.toISOString(),
            language: this.detectLanguage(ext),
        };
        
        // 파서 실행
        const parser = this.parsers[ext];
        if (parser) {
            const parsed = await parser(content, filePath);
            Object.assign(mapping, parsed);
        }
        
        // 의미론적 분류
        mapping.semantic = this.classifyContent(content, mapping);
        
        // TF-IDF 추가
        this.tfidf.addDocument(content);
        
        // 맵에 저장
        this.contentMap.set(filePath, mapping);
        
        return mapping;
    }
    
    // JavaScript 파서
    async parseJavaScript(content, filePath) {
        const mapping = {
            content: {
                sentences: [],
                keywords: [],
                entities: [],
                functions: [],
                dependencies: [],
                apis: [],
                concepts: [],
            },
            relations: {
                imports: [],
                exports: [],
                references: [],
                referencedBy: [],
                similar: [],
                duplicate: null,
            }
        };
        
        // 문장 단위 분석
        const comments = content.match(/\/\*[\s\S]*?\*\/|\/\/.*$/gm) || [];
        comments.forEach(comment => {
            const cleaned = comment.replace(/^\/\*|\*\/$|^\/\/\s*/g, '').trim();
            if (cleaned) {
                const sentences = this.tokenizer.tokenize(cleaned);
                mapping.content.sentences.push(...sentences);
            }
        });
        
        // 함수 추출
        const functions = content.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=]*)=>|(\w+)\s*\([^)]*\)\s*{)/g) || [];
        mapping.content.functions = functions.map(f => {
            const match = f.match(/(\w+)/);
            return match ? match[1] : null;
        }).filter(Boolean);
        
        // Import 분석
        const imports = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g) || [];
        mapping.relations.imports = imports.map(imp => {
            const match = imp.match(/from\s+['"]([^'"]+)['"]/);
            return match ? match[1] : null;
        }).filter(Boolean);
        
        // Export 분석
        const exports = content.match(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g) || [];
        mapping.relations.exports = exports.map(exp => {
            const match = exp.match(/(\w+)$/);
            return match ? match[1] : null;
        }).filter(Boolean);
        
        // API 엔드포인트 추출
        const apiPatterns = [
            /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g,
            /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g,
        ];
        
        apiPatterns.forEach(pattern => {
            const matches = [...content.matchAll(pattern)];
            matches.forEach(match => {
                mapping.content.apis.push({
                    method: match[1].toUpperCase(),
                    path: match[2]
                });
            });
        });
        
        // 키워드 추출
        mapping.content.keywords = this.extractKeywords(content);
        
        // 수학/AI 개념 추출
        mapping.content.concepts = this.extractConcepts(content);
        
        return mapping;
    }
    
    // TypeScript 파서
    async parseTypeScript(content, filePath) {
        // JavaScript 파서를 기반으로 TypeScript 특화 기능 추가
        const jsMapping = await this.parseJavaScript(content, filePath);
        
        // TypeScript 특화: 인터페이스와 타입 추출
        const interfaces = content.match(/interface\s+(\w+)/g) || [];
        const types = content.match(/type\s+(\w+)\s*=/g) || [];
        
        jsMapping.content.entities.push(
            ...interfaces.map(i => ({ type: 'interface', name: i.match(/interface\s+(\w+)/)[1] })),
            ...types.map(t => ({ type: 'type', name: t.match(/type\s+(\w+)/)[1] }))
        );
        
        return jsMapping;
    }
    
    // JSX 파서
    async parseJSX(content, filePath) {
        const jsMapping = await this.parseJavaScript(content, filePath);
        
        // React 컴포넌트 추출
        const components = content.match(/(?:function|const)\s+([A-Z]\w+)/g) || [];
        jsMapping.content.entities.push(
            ...components.map(c => ({ 
                type: 'react-component', 
                name: c.match(/(?:function|const)\s+([A-Z]\w+)/)[1] 
            }))
        );
        
        return jsMapping;
    }
    
    // Markdown 파서
    async parseMarkdown(content, filePath) {
        const mapping = {
            content: {
                sentences: [],
                keywords: [],
                entities: [],
                functions: [],
                dependencies: [],
                apis: [],
                concepts: [],
            },
            relations: {
                imports: [],
                exports: [],
                references: [],
                referencedBy: [],
                similar: [],
                duplicate: null,
            }
        };
        
        // 제목 추출
        const headers = content.match(/^#{1,6}\s+.+$/gm) || [];
        mapping.content.entities = headers.map(h => ({
            type: 'header',
            level: h.match(/^(#+)/)[1].length,
            text: h.replace(/^#+\s+/, '')
        }));
        
        // 문장 분석
        const textBlocks = content.split(/\n\n+/);
        textBlocks.forEach(block => {
            if (!block.match(/^```|^#{1,6}\s|^\||^-\s|^\*\s|^\d+\./)) {
                const sentences = this.tokenizer.tokenize(block);
                mapping.content.sentences.push(...sentences);
            }
        });
        
        // 코드 블록 분석
        const codeBlocks = content.match(/```(\w+)?\n([\s\S]*?)```/g) || [];
        codeBlocks.forEach(block => {
            const lang = block.match(/```(\w+)/)?.[1] || 'unknown';
            mapping.content.entities.push({ type: 'code-block', language: lang });
        });
        
        // 링크 추출
        const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
        mapping.relations.references = links.map(link => {
            const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
            return { text: match[1], url: match[2] };
        });
        
        // 키워드와 개념 추출
        mapping.content.keywords = this.extractKeywords(content);
        mapping.content.concepts = this.extractConcepts(content);
        
        return mapping;
    }
    
    // JSON 파서
    async parseJSON(content, filePath) {
        const mapping = {
            content: {
                sentences: [],
                keywords: [],
                entities: [],
                functions: [],
                dependencies: [],
                apis: [],
                concepts: [],
            },
            relations: {
                imports: [],
                exports: [],
                references: [],
                referencedBy: [],
                similar: [],
                duplicate: null,
            }
        };
        
        try {
            const json = JSON.parse(content);
            
            // package.json 특별 처리
            if (path.basename(filePath) === 'package.json') {
                mapping.relations.imports = Object.keys(json.dependencies || {});
                mapping.content.entities.push(
                    { type: 'package', name: json.name, version: json.version }
                );
            }
            
            // 키 추출
            const keys = this.extractKeys(json);
            mapping.content.keywords = keys;
            
        } catch (e) {
            console.error(`JSON parse error in ${filePath}`);
        }
        
        return mapping;
    }
    
    // Python 파서
    async parsePython(content, filePath) {
        const mapping = {
            content: {
                sentences: [],
                keywords: [],
                entities: [],
                functions: [],
                dependencies: [],
                apis: [],
                concepts: [],
            },
            relations: {
                imports: [],
                exports: [],
                references: [],
                referencedBy: [],
                similar: [],
                duplicate: null,
            }
        };
        
        // 문장 단위 분석 (docstring과 주석)
        const docstrings = content.match(/"""[\s\S]*?"""|'''[\s\S]*?'''/g) || [];
        const comments = content.match(/#.*$/gm) || [];
        
        [...docstrings, ...comments].forEach(text => {
            const cleaned = text.replace(/^"""?|"""?$|^'''?|'''?$|^#\s*/g, '').trim();
            if (cleaned) {
                const sentences = this.tokenizer.tokenize(cleaned);
                mapping.content.sentences.push(...sentences);
            }
        });
        
        // 함수와 클래스 추출
        const functions = content.match(/def\s+(\w+)\s*\(/g) || [];
        const classes = content.match(/class\s+(\w+)\s*[\(:]/g) || [];
        
        mapping.content.functions = functions.map(f => f.match(/def\s+(\w+)/)[1]);
        mapping.content.entities = classes.map(c => ({
            type: 'class',
            name: c.match(/class\s+(\w+)/)[1]
        }));
        
        // Import 분석
        const imports = content.match(/(?:from\s+[\w.]+\s+)?import\s+.+/g) || [];
        mapping.relations.imports = imports;
        
        // 키워드와 개념 추출
        mapping.content.keywords = this.extractKeywords(content);
        mapping.content.concepts = this.extractConcepts(content);
        
        return mapping;
    }
    
    // 텍스트 파서
    async parseText(content, filePath) {
        const mapping = {
            content: {
                sentences: this.tokenizer.tokenize(content),
                keywords: this.extractKeywords(content),
                entities: [],
                functions: [],
                dependencies: [],
                apis: [],
                concepts: this.extractConcepts(content),
            },
            relations: {
                imports: [],
                exports: [],
                references: [],
                referencedBy: [],
                similar: [],
                duplicate: null,
            }
        };
        
        return mapping;
    }
    
    // 언어 감지
    detectLanguage(ext) {
        const langMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'javascript-react',
            '.tsx': 'typescript-react',
            '.py': 'python',
            '.md': 'markdown',
            '.json': 'json',
            '.txt': 'text',
        };
        return langMap[ext] || 'unknown';
    }
    
    // 콘텐츠 분류
    classifyContent(content, mapping) {
        const contentLower = content.toLowerCase();
        
        // 도메인 결정
        let maxScore = 0;
        let domain = 'general';
        
        for (const [key, keywords] of Object.entries(this.domainKeywords)) {
            const score = keywords.filter(kw => contentLower.includes(kw)).length;
            if (score > maxScore) {
                maxScore = score;
                domain = key;
            }
        }
        
        // 카테고리 결정
        let category = 'misc';
        for (const [cat, pattern] of Object.entries(this.categoryPatterns)) {
            if (pattern.test(content)) {
                category = cat;
                break;
            }
        }
        
        // 복잡도 계산
        const complexity = this.calculateComplexity(content, mapping);
        
        // 우선순위 계산
        const priority = this.calculatePriority(mapping, category, domain);
        
        return {
            category,
            subcategory: this.determineSubcategory(category, content),
            domain,
            purpose: this.determinePurpose(mapping),
            complexity,
            priority,
        };
    }
    
    // 복잡도 계산
    calculateComplexity(content, mapping) {
        const lines = content.split('\n').length;
        const functions = mapping.content?.functions?.length || 0;
        const dependencies = mapping.relations?.imports?.length || 0;
        
        const score = (lines / 100) + (functions * 2) + (dependencies * 3);
        
        if (score < 10) return 'simple';
        if (score < 50) return 'medium';
        return 'complex';
    }
    
    // 우선순위 계산
    calculatePriority(mapping, category, domain) {
        let priority = 5;
        
        // 핵심 시스템 파일은 높은 우선순위
        if (category === 'core-system') priority += 3;
        if (category === 'ai-agent') priority += 2;
        if (domain === 'math' || domain === 'ai') priority += 1;
        
        // 테스트나 문서는 낮은 우선순위
        if (category === 'testing') priority -= 2;
        if (category === 'documentation') priority -= 1;
        
        return Math.max(1, Math.min(10, priority));
    }
    
    // 서브카테고리 결정
    determineSubcategory(category, content) {
        const subcategories = {
            'core-system': ['server', 'orchestrator', 'api', 'database'],
            'ai-agent': ['claude', 'qwen', 'collaboration', 'processing'],
            'math-engine': ['algebra', 'geometry', 'calculus', 'statistics'],
            'visualization': ['graph', 'animation', 'rendering', 'ui'],
        };
        
        const subs = subcategories[category];
        if (!subs) return 'general';
        
        for (const sub of subs) {
            if (content.toLowerCase().includes(sub)) {
                return sub;
            }
        }
        
        return subs[0] || 'general';
    }
    
    // 목적 결정
    determinePurpose(mapping) {
        const functions = mapping.content?.functions || [];
        const apis = mapping.content?.apis || [];
        
        if (apis.length > 0) return 'api-service';
        if (functions.includes('test') || functions.includes('describe')) return 'testing';
        if (functions.includes('render') || functions.includes('draw')) return 'visualization';
        if (functions.includes('train') || functions.includes('predict')) return 'ai-model';
        if (functions.includes('solve') || functions.includes('calculate')) return 'computation';
        
        return 'utility';
    }
    
    // 키워드 추출
    extractKeywords(content) {
        const words = content.match(/\b[a-zA-Z]{4,}\b/g) || [];
        const frequency = {};
        
        words.forEach(word => {
            const lower = word.toLowerCase();
            frequency[lower] = (frequency[lower] || 0) + 1;
        });
        
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word]) => word);
    }
    
    // 개념 추출
    extractConcepts(content) {
        const concepts = [];
        const conceptPatterns = [
            /\b(algebra|geometry|calculus|statistics|trigonometry)\b/gi,
            /\b(neural network|machine learning|deep learning|AI|artificial intelligence)\b/gi,
            /\b(algorithm|data structure|optimization|performance)\b/gi,
            /\b(animation|rendering|visualization|graphics)\b/gi,
        ];
        
        conceptPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            concepts.push(...matches.map(m => m.toLowerCase()));
        });
        
        return [...new Set(concepts)];
    }
    
    // JSON 키 추출
    extractKeys(obj, prefix = '') {
        const keys = [];
        
        for (const key in obj) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            keys.push(fullKey);
            
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                keys.push(...this.extractKeys(obj[key], fullKey));
            }
        }
        
        return keys;
    }
    
    // 관계 분석
    async analyzeRelations() {
        console.log('\n🔗 Analyzing file relations...');
        
        for (const [filePath, mapping] of this.contentMap) {
            // Import 관계 해석
            for (const imp of mapping.relations.imports) {
                const resolved = this.resolveImport(imp, filePath);
                if (resolved && this.contentMap.has(resolved)) {
                    const targetMapping = this.contentMap.get(resolved);
                    targetMapping.relations.referencedBy.push(path.relative(this.rootPath, filePath));
                }
            }
        }
    }
    
    // Import 경로 해석
    resolveImport(importPath, fromFile) {
        if (importPath.startsWith('.')) {
            const dir = path.dirname(fromFile);
            const resolved = path.resolve(dir, importPath);
            
            // 확장자 추가 시도
            const extensions = ['.js', '.ts', '.jsx', '.tsx', '.json'];
            for (const ext of extensions) {
                const withExt = resolved + ext;
                if (fs.existsSync(withExt)) {
                    return withExt;
                }
            }
            
            // index 파일 확인
            const indexPath = path.join(resolved, 'index.js');
            if (fs.existsSync(indexPath)) {
                return indexPath;
            }
        }
        
        return null;
    }
    
    // 유사성 계산
    async calculateSimilarities() {
        console.log('\n🔍 Calculating file similarities...');
        
        const files = Array.from(this.contentMap.keys());
        
        for (let i = 0; i < files.length; i++) {
            const file1 = files[i];
            const mapping1 = this.contentMap.get(file1);
            
            for (let j = i + 1; j < files.length; j++) {
                const file2 = files[j];
                const mapping2 = this.contentMap.get(file2);
                
                const similarity = this.calculateSimilarity(mapping1, mapping2);
                
                if (similarity > 0.7) {
                    mapping1.relations.similar.push({
                        file: path.relative(this.rootPath, file2),
                        score: similarity
                    });
                    mapping2.relations.similar.push({
                        file: path.relative(this.rootPath, file1),
                        score: similarity
                    });
                }
                
                // 완전 중복 체크
                if (mapping1.file.hash === mapping2.file.hash) {
                    mapping1.relations.duplicate = path.relative(this.rootPath, file2);
                    mapping2.relations.duplicate = path.relative(this.rootPath, file1);
                }
            }
        }
    }
    
    // 두 파일 간 유사도 계산
    calculateSimilarity(mapping1, mapping2) {
        let score = 0;
        let factors = 0;
        
        // 카테고리 일치
        if (mapping1.semantic.category === mapping2.semantic.category) {
            score += 0.3;
        }
        factors += 0.3;
        
        // 도메인 일치
        if (mapping1.semantic.domain === mapping2.semantic.domain) {
            score += 0.2;
        }
        factors += 0.2;
        
        // 키워드 유사도
        const keywords1 = new Set(mapping1.content.keywords);
        const keywords2 = new Set(mapping2.content.keywords);
        const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
        const union = new Set([...keywords1, ...keywords2]);
        
        if (union.size > 0) {
            score += (intersection.size / union.size) * 0.3;
        }
        factors += 0.3;
        
        // 함수 유사도
        const funcs1 = new Set(mapping1.content.functions);
        const funcs2 = new Set(mapping2.content.functions);
        const funcIntersection = new Set([...funcs1].filter(x => funcs2.has(x)));
        const funcUnion = new Set([...funcs1, ...funcs2]);
        
        if (funcUnion.size > 0) {
            score += (funcIntersection.size / funcUnion.size) * 0.2;
        }
        factors += 0.2;
        
        return factors > 0 ? score / factors : 0;
    }
    
    // 인덱스 구축
    async buildIndices() {
        console.log('\n📚 Building semantic indices...');
        
        for (const [filePath, mapping] of this.contentMap) {
            // 의미론적 인덱스
            const key = `${mapping.semantic.domain}:${mapping.semantic.category}`;
            if (!this.semanticIndex.has(key)) {
                this.semanticIndex.set(key, []);
            }
            this.semanticIndex.get(key).push(filePath);
            
            // 함수 인덱스
            for (const func of mapping.content.functions) {
                if (!this.functionIndex.has(func)) {
                    this.functionIndex.set(func, []);
                }
                this.functionIndex.get(func).push(filePath);
            }
            
            // 개념 인덱스
            for (const concept of mapping.content.concepts) {
                if (!this.conceptIndex.has(concept)) {
                    this.conceptIndex.set(concept, []);
                }
                this.conceptIndex.get(concept).push(filePath);
            }
        }
        
        console.log(`  ✓ Semantic index: ${this.semanticIndex.size} categories`);
        console.log(`  ✓ Function index: ${this.functionIndex.size} functions`);
        console.log(`  ✓ Concept index: ${this.conceptIndex.size} concepts`);
    }
    
    // 리포트 생성
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: this.contentMap.size,
                semanticCategories: this.semanticIndex.size,
                uniqueFunctions: this.functionIndex.size,
                uniqueConcepts: this.conceptIndex.size,
            },
            statistics: {
                byCategory: {},
                byDomain: {},
                byComplexity: {},
                byLanguage: {},
            },
            duplicates: [],
            highPriority: [],
            recommendations: [],
        };
        
        // 통계 수집
        for (const [filePath, mapping] of this.contentMap) {
            // 카테고리별
            const cat = mapping.semantic.category;
            report.statistics.byCategory[cat] = (report.statistics.byCategory[cat] || 0) + 1;
            
            // 도메인별
            const domain = mapping.semantic.domain;
            report.statistics.byDomain[domain] = (report.statistics.byDomain[domain] || 0) + 1;
            
            // 복잡도별
            const complexity = mapping.semantic.complexity;
            report.statistics.byComplexity[complexity] = (report.statistics.byComplexity[complexity] || 0) + 1;
            
            // 언어별
            const lang = mapping.file.language;
            report.statistics.byLanguage[lang] = (report.statistics.byLanguage[lang] || 0) + 1;
            
            // 중복 파일
            if (mapping.relations.duplicate) {
                report.duplicates.push({
                    file: mapping.file.path,
                    duplicate: mapping.relations.duplicate,
                });
            }
            
            // 높은 우선순위 파일
            if (mapping.semantic.priority >= 8) {
                report.highPriority.push({
                    file: mapping.file.path,
                    priority: mapping.semantic.priority,
                    category: mapping.semantic.category,
                    purpose: mapping.semantic.purpose,
                });
            }
        }
        
        // 권장사항 생성
        report.recommendations = this.generateRecommendations(report);
        
        return report;
    }
    
    // 권장사항 생성
    generateRecommendations(report) {
        const recommendations = [];
        
        // 중복 파일 제거
        if (report.duplicates.length > 0) {
            recommendations.push({
                type: 'cleanup',
                priority: 'high',
                action: `Remove ${report.duplicates.length} duplicate files`,
                details: report.duplicates.slice(0, 5),
            });
        }
        
        // 복잡한 파일 리팩토링
        if (report.statistics.byComplexity.complex > 10) {
            recommendations.push({
                type: 'refactor',
                priority: 'medium',
                action: `Refactor ${report.statistics.byComplexity.complex} complex files`,
                details: 'Consider breaking down complex files into smaller modules',
            });
        }
        
        // 테스트 커버리지
        const testRatio = (report.statistics.byCategory.testing || 0) / report.summary.totalFiles;
        if (testRatio < 0.2) {
            recommendations.push({
                type: 'testing',
                priority: 'high',
                action: 'Increase test coverage',
                details: `Current test ratio: ${(testRatio * 100).toFixed(1)}%, recommended: >20%`,
            });
        }
        
        return recommendations;
    }
    
    // Claude-Qwen 통합 형식으로 내보내기
    async exportForAICollaboration() {
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            project: 'Palantir Math',
            mappings: [],
            indices: {
                semantic: Object.fromEntries(this.semanticIndex),
                functions: Object.fromEntries(this.functionIndex),
                concepts: Object.fromEntries(this.conceptIndex),
            },
            aiInstructions: {
                claude: {
                    focus: ['architecture', 'strategy', 'complex problem solving'],
                    priorityCategories: ['core-system', 'ai-agent', 'math-engine'],
                },
                qwen: {
                    focus: ['implementation', 'optimization', 'execution'],
                    priorityCategories: ['visualization', 'education', 'utility'],
                },
                collaboration: {
                    sharedGoals: ['code quality', 'performance', 'user experience'],
                    communicationFormat: 'unified-schema-v1',
                },
            },
        };
        
        // 매핑 데이터 추가
        for (const [filePath, mapping] of this.contentMap) {
            exportData.mappings.push({
                file: mapping.file,
                semantic: mapping.semantic,
                summary: {
                    sentences: mapping.content.sentences.length,
                    keywords: mapping.content.keywords.slice(0, 10),
                    functions: mapping.content.functions.length,
                    apis: mapping.content.apis.length,
                    concepts: mapping.content.concepts,
                },
                relations: {
                    imports: mapping.relations.imports.length,
                    exports: mapping.relations.exports.length,
                    referencedBy: mapping.relations.referencedBy.length,
                    similar: mapping.relations.similar.length,
                },
            });
        }
        
        return exportData;
    }
}

// 메인 실행
async function main() {
    const rootPath = 'C:\\palantir\\math';
    const mapper = new UnifiedContentMapper(rootPath);
    
    console.log('🚀 Unified Content Mapping System for Claude-Qwen Collaboration');
    console.log('================================================================\n');
    
    try {
        // 프로젝트 매핑
        const report = await mapper.mapProject();
        
        // 리포트 저장
        const reportPath = path.join(rootPath, 'unified-content-map-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Report saved to: ${reportPath}`);
        
        // AI 협업용 데이터 내보내기
        const aiData = await mapper.exportForAICollaboration();
        const aiDataPath = path.join(rootPath, 'ai-collaboration-map.json');
        fs.writeFileSync(aiDataPath, JSON.stringify(aiData, null, 2));
        console.log(`📤 AI collaboration data exported to: ${aiDataPath}`);
        
        // 요약 출력
        console.log('\n📊 Mapping Summary:');
        console.log(`  Total Files: ${report.summary.totalFiles}`);
        console.log(`  Semantic Categories: ${report.summary.semanticCategories}`);
        console.log(`  Unique Functions: ${report.summary.uniqueFunctions}`);
        console.log(`  Unique Concepts: ${report.summary.uniqueConcepts}`);
        
        console.log('\n📈 Distribution:');
        console.log('  By Category:', report.statistics.byCategory);
        console.log('  By Domain:', report.statistics.byDomain);
        console.log('  By Complexity:', report.statistics.byComplexity);
        
        console.log('\n🎯 High Priority Files:', report.highPriority.length);
        console.log('🔄 Duplicate Files:', report.duplicates.length);
        
        console.log('\n💡 Recommendations:');
        report.recommendations.forEach((rec, i) => {
            console.log(`  ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        console.error(error.stack);
    }
}

// 모듈 내보내기
export default UnifiedContentMapper;
export { UNIFIED_SCHEMA };

// 직접 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}