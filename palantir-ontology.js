// Palantir-Inspired Ontology System for Palantir Math Project
// 엔티티-관계 그래프 + 속성 매핑 + 자가개선 메커니즘

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Palantir Ontology System
 * 3계층 구조: Semantic, Kinetic, Dynamic
 */
class PalantirOntologySystem {
    constructor() {
        this.entities = new Map();      // 엔티티 저장소
        this.relationships = new Map();  // 관계 저장소
        this.properties = new Map();     // 속성 저장소
        this.dependencies = new Map();   // 의존성 그래프
        this.semanticIndex = new Map();  // 의미론적 인덱스
        
        this.entityTypes = {
            // 코드 엔티티
            MODULE: 'module',
            CLASS: 'class',
            FUNCTION: 'function',
            COMPONENT: 'component',
            AGENT: 'ai_agent',
            
            // 문서 엔티티
            DOCUMENTATION: 'documentation',
            CONFIG: 'configuration',
            STATE: 'state',
            REPORT: 'report',
            
            // 시스템 엔티티
            SERVICE: 'service',
            DATABASE: 'database',
            API: 'api',
            WORKFLOW: 'workflow'
        };
        
        this.relationshipTypes = {
            DEPENDS_ON: 'depends_on',
            IMPORTS: 'imports',
            EXPORTS: 'exports',
            IMPLEMENTS: 'implements',
            EXTENDS: 'extends',
            USES: 'uses',
            CREATES: 'creates',
            MODIFIES: 'modifies',
            DOCUMENTS: 'documents',
            TESTS: 'tests',
            ORCHESTRATES: 'orchestrates',
            COLLABORATES_WITH: 'collaborates_with'
        };
        
        this.initializeOntology();
    }
    
    initializeOntology() {
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan.bold(' 🏛️ Palantir Ontology System Initializing'));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    }
    
    // ========== Semantic Layer (의미 계층) ==========
    
    /**
     * 엔티티 생성
     */
    createEntity(id, type, metadata = {}) {
        const entity = {
            id: id || this.generateId(),
            type,
            name: metadata.name || id,
            path: metadata.path,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            properties: new Map(),
            relationships: new Set(),
            semantic: {
                category: metadata.category,
                tags: metadata.tags || [],
                description: metadata.description,
                purpose: metadata.purpose,
                complexity: metadata.complexity || 'medium'
            },
            metrics: {
                importance: metadata.importance || 5,
                usage_frequency: 0,
                modification_count: 0,
                dependency_count: 0
            },
            status: metadata.status || 'active'
        };
        
        this.entities.set(entity.id, entity);
        
        // 의미론적 인덱싱
        if (metadata.tags) {
            metadata.tags.forEach(tag => {
                if (!this.semanticIndex.has(tag)) {
                    this.semanticIndex.set(tag, new Set());
                }
                this.semanticIndex.get(tag).add(entity.id);
            });
        }
        
        return entity;
    }
    
    /**
     * 관계 생성
     */
    createRelationship(fromId, toId, type, metadata = {}) {
        const relationshipId = `${fromId}-${type}-${toId}`;
        
        const relationship = {
            id: relationshipId,
            from: fromId,
            to: toId,
            type,
            created: new Date().toISOString(),
            strength: metadata.strength || 1.0,
            bidirectional: metadata.bidirectional || false,
            metadata: metadata
        };
        
        this.relationships.set(relationshipId, relationship);
        
        // 엔티티에 관계 추가
        const fromEntity = this.entities.get(fromId);
        const toEntity = this.entities.get(toId);
        
        if (fromEntity) {
            fromEntity.relationships.add(relationshipId);
            fromEntity.metrics.dependency_count++;
        }
        
        if (toEntity && metadata.bidirectional) {
            toEntity.relationships.add(relationshipId);
            toEntity.metrics.dependency_count++;
        }
        
        // 의존성 그래프 업데이트
        this.updateDependencyGraph(fromId, toId, type);
        
        return relationship;
    }
    
    /**
     * 속성 추가
     */
    addProperty(entityId, key, value) {
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.properties.set(key, {
                value,
                type: typeof value,
                modified: new Date().toISOString()
            });
            entity.modified = new Date().toISOString();
            entity.metrics.modification_count++;
        }
    }
    
    // ========== Kinetic Layer (동작 계층) ==========
    
    /**
     * 파일 분석 및 엔티티 변환
     */
    async analyzeFile(filePath) {
        const stats = await fs.promises.stat(filePath);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const ext = path.extname(filePath);
        const basename = path.basename(filePath);
        
        // 파일 타입 결정
        let entityType = this.entityTypes.MODULE;
        let category = 'code';
        
        if (ext === '.md') {
            entityType = this.entityTypes.DOCUMENTATION;
            category = 'documentation';
        } else if (ext === '.json' && basename.includes('config')) {
            entityType = this.entityTypes.CONFIG;
            category = 'configuration';
        } else if (basename.includes('test')) {
            category = 'test';
        }
        
        // 엔티티 생성
        const entity = this.createEntity(
            basename,
            entityType,
            {
                path: filePath,
                category,
                size: stats.size,
                tags: this.extractTags(content),
                description: this.extractDescription(content),
                complexity: this.calculateComplexity(content)
            }
        );
        
        // 의존성 추출
        const dependencies = this.extractDependencies(content, ext);
        dependencies.forEach(dep => {
            this.createRelationship(
                entity.id,
                dep,
                this.relationshipTypes.DEPENDS_ON,
                { detected: 'import_analysis' }
            );
        });
        
        return entity;
    }
    
    /**
     * 태그 추출
     */
    extractTags(content) {
        const tags = new Set();
        
        // 주요 키워드 추출
        const keywords = [
            'claude', 'qwen', 'ai', 'agent', 'orchestration',
            'collaboration', 'math', 'education', 'visualization',
            'gesture', 'realtime', 'websocket', 'api'
        ];
        
        keywords.forEach(keyword => {
            if (content.toLowerCase().includes(keyword)) {
                tags.add(keyword);
            }
        });
        
        // 특수 패턴 감지
        if (content.includes('export class')) tags.add('class');
        if (content.includes('async function')) tags.add('async');
        if (content.includes('mongoose') || content.includes('neo4j')) tags.add('database');
        if (content.includes('express') || content.includes('fastify')) tags.add('server');
        if (content.includes('React') || content.includes('Vue')) tags.add('frontend');
        
        return Array.from(tags);
    }
    
    /**
     * 설명 추출
     */
    extractDescription(content) {
        // 첫 번째 주석 블록 추출
        const commentMatch = content.match(/\/\*\*([\s\S]*?)\*\//);
        if (commentMatch) {
            return commentMatch[1].replace(/\s*\*\s*/g, ' ').trim();
        }
        
        // 첫 번째 줄 주석 추출
        const lineCommentMatch = content.match(/^\/\/\s*(.+)$/m);
        if (lineCommentMatch) {
            return lineCommentMatch[1];
        }
        
        return null;
    }
    
    /**
     * 복잡도 계산
     */
    calculateComplexity(content) {
        const lines = content.split('\n').length;
        const functions = (content.match(/function\s+\w+/g) || []).length;
        const classes = (content.match(/class\s+\w+/g) || []).length;
        const conditionals = (content.match(/if\s*\(|switch\s*\(|while\s*\(|for\s*\(/g) || []).length;
        
        const score = lines * 0.01 + functions * 2 + classes * 5 + conditionals * 1.5;
        
        if (score < 10) return 'simple';
        if (score < 50) return 'medium';
        return 'complex';
    }
    
    /**
     * 의존성 추출
     */
    extractDependencies(content, ext) {
        const dependencies = new Set();
        
        if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
            // Import 문 분석
            const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                const importPath = match[1];
                if (importPath.startsWith('.')) {
                    dependencies.add(path.basename(importPath));
                } else {
                    dependencies.add(importPath);
                }
            }
            
            // Require 문 분석
            const requireRegex = /require\s*\(['"](.+?)['"]\)/g;
            while ((match = requireRegex.exec(content)) !== null) {
                const requirePath = match[1];
                if (requirePath.startsWith('.')) {
                    dependencies.add(path.basename(requirePath));
                } else {
                    dependencies.add(requirePath);
                }
            }
        }
        
        return Array.from(dependencies);
    }
    
    // ========== Dynamic Layer (동적 계층) ==========
    
    /**
     * 의존성 그래프 업데이트
     */
    updateDependencyGraph(fromId, toId, type) {
        if (!this.dependencies.has(fromId)) {
            this.dependencies.set(fromId, new Set());
        }
        this.dependencies.get(fromId).add({
            target: toId,
            type: type,
            timestamp: Date.now()
        });
    }
    
    /**
     * 영향 분석 (Impact Analysis)
     */
    analyzeImpact(entityId, depth = 3) {
        const impacted = new Set();
        const queue = [{id: entityId, level: 0}];
        const visited = new Set();
        
        while (queue.length > 0) {
            const {id, level} = queue.shift();
            
            if (visited.has(id) || level > depth) continue;
            visited.add(id);
            
            if (level > 0) {
                impacted.add(id);
            }
            
            // 직접 의존성
            const deps = this.dependencies.get(id);
            if (deps) {
                deps.forEach(dep => {
                    queue.push({id: dep.target, level: level + 1});
                });
            }
            
            // 역방향 의존성
            this.relationships.forEach(rel => {
                if (rel.to === id && !visited.has(rel.from)) {
                    queue.push({id: rel.from, level: level + 1});
                }
            });
        }
        
        return Array.from(impacted);
    }
    
    /**
     * 자가개선 제안 생성
     */
    generateImprovements() {
        const improvements = [];
        
        // 1. 고립된 엔티티 찾기
        this.entities.forEach(entity => {
            if (entity.relationships.size === 0) {
                improvements.push({
                    type: 'isolated_entity',
                    entity: entity.id,
                    suggestion: `Consider removing or integrating isolated entity: ${entity.name}`,
                    priority: 'low'
                });
            }
        });
        
        // 2. 순환 의존성 감지
        const cycles = this.detectCycles();
        cycles.forEach(cycle => {
            improvements.push({
                type: 'circular_dependency',
                entities: cycle,
                suggestion: `Circular dependency detected: ${cycle.join(' -> ')}`,
                priority: 'high'
            });
        });
        
        // 3. 복잡도 높은 엔티티
        this.entities.forEach(entity => {
            if (entity.semantic.complexity === 'complex' && entity.metrics.dependency_count > 10) {
                improvements.push({
                    type: 'high_complexity',
                    entity: entity.id,
                    suggestion: `Consider refactoring complex entity with high dependencies: ${entity.name}`,
                    priority: 'medium'
                });
            }
        });
        
        // 4. 중복 가능성
        const duplicates = this.findPotentialDuplicates();
        duplicates.forEach(dup => {
            improvements.push({
                type: 'potential_duplicate',
                entities: dup,
                suggestion: `Potential duplicate entities detected: ${dup.join(', ')}`,
                priority: 'medium'
            });
        });
        
        return improvements;
    }
    
    /**
     * 순환 의존성 감지
     */
    detectCycles() {
        const cycles = [];
        const visited = new Set();
        const stack = new Set();
        
        const dfs = (node, path = []) => {
            if (stack.has(node)) {
                const cycleStart = path.indexOf(node);
                if (cycleStart !== -1) {
                    cycles.push(path.slice(cycleStart));
                }
                return;
            }
            
            if (visited.has(node)) return;
            
            visited.add(node);
            stack.add(node);
            path.push(node);
            
            const deps = this.dependencies.get(node);
            if (deps) {
                deps.forEach(dep => {
                    dfs(dep.target, [...path]);
                });
            }
            
            stack.delete(node);
        };
        
        this.entities.forEach(entity => {
            if (!visited.has(entity.id)) {
                dfs(entity.id);
            }
        });
        
        return cycles;
    }
    
    /**
     * 잠재적 중복 찾기
     */
    findPotentialDuplicates() {
        const duplicates = [];
        const nameGroups = new Map();
        
        this.entities.forEach(entity => {
            const baseName = entity.name.replace(/[-_\d]+$/, '').toLowerCase();
            if (!nameGroups.has(baseName)) {
                nameGroups.set(baseName, []);
            }
            nameGroups.get(baseName).push(entity.id);
        });
        
        nameGroups.forEach(group => {
            if (group.length > 1) {
                duplicates.push(group);
            }
        });
        
        return duplicates;
    }
    
    /**
     * 시맨틱 검색
     */
    searchBySemantics(query) {
        const results = [];
        const queryTags = query.toLowerCase().split(' ');
        
        this.entities.forEach(entity => {
            let score = 0;
            
            // 태그 매칭
            queryTags.forEach(tag => {
                if (entity.semantic.tags.includes(tag)) {
                    score += 10;
                }
                if (entity.name.toLowerCase().includes(tag)) {
                    score += 5;
                }
                if (entity.semantic.description && entity.semantic.description.toLowerCase().includes(tag)) {
                    score += 3;
                }
            });
            
            if (score > 0) {
                results.push({
                    entity: entity,
                    score: score
                });
            }
        });
        
        return results.sort((a, b) => b.score - a.score);
    }
    
    /**
     * 온톨로지 상태 리포트
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            statistics: {
                total_entities: this.entities.size,
                total_relationships: this.relationships.size,
                entity_types: {},
                relationship_types: {},
                complexity_distribution: {
                    simple: 0,
                    medium: 0,
                    complex: 0
                }
            },
            health: {
                isolated_entities: 0,
                circular_dependencies: 0,
                high_complexity_entities: 0,
                potential_duplicates: 0
            },
            top_entities: [],
            semantic_coverage: {}
        };
        
        // 통계 수집
        this.entities.forEach(entity => {
            // 엔티티 타입별 카운트
            if (!report.statistics.entity_types[entity.type]) {
                report.statistics.entity_types[entity.type] = 0;
            }
            report.statistics.entity_types[entity.type]++;
            
            // 복잡도 분포
            report.statistics.complexity_distribution[entity.semantic.complexity]++;
            
            // 고립된 엔티티
            if (entity.relationships.size === 0) {
                report.health.isolated_entities++;
            }
            
            // 높은 복잡도
            if (entity.semantic.complexity === 'complex') {
                report.health.high_complexity_entities++;
            }
        });
        
        // 관계 타입별 카운트
        this.relationships.forEach(rel => {
            if (!report.statistics.relationship_types[rel.type]) {
                report.statistics.relationship_types[rel.type] = 0;
            }
            report.statistics.relationship_types[rel.type]++;
        });
        
        // 상위 엔티티 (중요도 기준)
        const sortedEntities = Array.from(this.entities.values())
            .sort((a, b) => b.metrics.importance - a.metrics.importance)
            .slice(0, 10);
        
        report.top_entities = sortedEntities.map(e => ({
            id: e.id,
            name: e.name,
            type: e.type,
            importance: e.metrics.importance,
            dependencies: e.metrics.dependency_count
        }));
        
        // 시맨틱 커버리지
        this.semanticIndex.forEach((entities, tag) => {
            report.semantic_coverage[tag] = entities.size;
        });
        
        // 건강 지표
        report.health.circular_dependencies = this.detectCycles().length;
        report.health.potential_duplicates = this.findPotentialDuplicates().length;
        
        return report;
    }
    
    /**
     * ID 생성
     */
    generateId() {
        return crypto.randomBytes(8).toString('hex');
    }
    
    /**
     * 온톨로지 저장
     */
    async save(filePath = path.join(__dirname, 'ontology-state.json')) {
        const state = {
            entities: Array.from(this.entities.entries()),
            relationships: Array.from(this.relationships.entries()),
            properties: Array.from(this.properties.entries()),
            dependencies: Array.from(this.dependencies.entries()).map(([key, value]) => [
                key,
                Array.from(value)
            ]),
            semanticIndex: Array.from(this.semanticIndex.entries()).map(([key, value]) => [
                key,
                Array.from(value)
            ]),
            metadata: {
                version: '1.0.0',
                saved: new Date().toISOString(),
                entityCount: this.entities.size,
                relationshipCount: this.relationships.size
            }
        };
        
        await fs.promises.writeFile(filePath, JSON.stringify(state, null, 2));
        console.log(chalk.green(`✅ Ontology saved to ${filePath}`));
    }
    
    /**
     * 온톨로지 로드
     */
    async load(filePath = path.join(__dirname, 'ontology-state.json')) {
        try {
            const data = await fs.promises.readFile(filePath, 'utf-8');
            const state = JSON.parse(data);
            
            this.entities = new Map(state.entities);
            this.relationships = new Map(state.relationships);
            this.properties = new Map(state.properties);
            this.dependencies = new Map(state.dependencies.map(([key, value]) => [
                key,
                new Set(value)
            ]));
            this.semanticIndex = new Map(state.semanticIndex.map(([key, value]) => [
                key,
                new Set(value)
            ]));
            
            console.log(chalk.green(`✅ Ontology loaded from ${filePath}`));
            console.log(chalk.gray(`  Entities: ${this.entities.size}, Relationships: ${this.relationships.size}`));
        } catch (error) {
            console.log(chalk.yellow('⚠️ No existing ontology found, starting fresh'));
        }
    }
}

// Export for use in other modules
export default PalantirOntologySystem;

// Direct execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const ontology = new PalantirOntologySystem();
    
    console.log(chalk.cyan('\n🧪 Testing Ontology System'));
    
    // 테스트 엔티티 생성
    const orchestrator = ontology.createEntity('orchestrator', ontology.entityTypes.SERVICE, {
        name: 'qwen-orchestrator-enhanced.js',
        path: './orchestration/qwen-orchestrator-enhanced.js',
        tags: ['orchestration', 'server', 'api', 'websocket'],
        description: 'Main orchestration server for Qwen agents',
        importance: 10,
        complexity: 'complex'
    });
    
    const agents = ontology.createEntity('agents', ontology.entityTypes.MODULE, {
        name: 'qwen-agents-75-complete.js',
        path: './orchestration/qwen-agents-75-complete.js',
        tags: ['ai', 'agents', 'qwen'],
        description: '75 AI agents implementation',
        importance: 9,
        complexity: 'complex'
    });
    
    const collaboration = ontology.createEntity('collaboration', ontology.entityTypes.MODULE, {
        name: 'claude-qwen-collaborative-solver.js',
        path: './orchestration/claude-qwen-collaborative-solver.js',
        tags: ['collaboration', 'claude', 'qwen'],
        description: 'Claude-Qwen collaboration system',
        importance: 9,
        complexity: 'medium'
    });
    
    // 관계 생성
    ontology.createRelationship(
        'orchestrator',
        'agents',
        ontology.relationshipTypes.IMPORTS
    );
    
    ontology.createRelationship(
        'orchestrator',
        'collaboration',
        ontology.relationshipTypes.IMPORTS
    );
    
    ontology.createRelationship(
        'collaboration',
        'agents',
        ontology.relationshipTypes.USES,
        { bidirectional: true }
    );
    
    // 리포트 생성
    const report = ontology.generateReport();
    console.log(chalk.yellow('\n📊 Ontology Report:'));
    console.log(JSON.stringify(report, null, 2));
    
    // 개선사항 생성
    const improvements = ontology.generateImprovements();
    console.log(chalk.yellow('\n💡 Improvement Suggestions:'));
    improvements.forEach(imp => {
        const icon = imp.priority === 'high' ? '🔴' : imp.priority === 'medium' ? '🟡' : '🟢';
        console.log(`${icon} [${imp.type}] ${imp.suggestion}`);
    });
    
    // 저장
    await ontology.save();
}
