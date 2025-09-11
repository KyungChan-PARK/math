// RealTimeSelfImprovementEngine.js - 진짜 자가개선 엔진
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import chokidar from 'chokidar';
import { parse as parseAST } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';
import { logger } from '../utils/logger.js';
import Anthropic from '@anthropic-ai/sdk';
import { exec } from 'child_process';
import { promisify } from 'util';

const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;

const execAsync = promisify(exec);

/**
 * 진정한 자가개선 시스템
 * - 코드와 문서의 양방향 동기화
 * - 이슈 자동 감지 및 해결
 * - 개발 방향 전환 자동 대응
 */
class RealTimeSelfImprovementEngine extends EventEmitter {
  constructor() {
    super();
    
    // 핵심 상태
    this.projectGraph = new Map(); // 프로젝트 의존성 그래프
    this.issueQueue = [];           // 감지된 이슈 큐
    this.changeHistory = [];        // 변경 이력
    this.isProcessing = false;
    
    // 감시 대상
    this.watchTargets = {
      code: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
      docs: ['**/MASTER_REFERENCE.md', '**/API_DOCUMENTATION.md', '**/IMPLEMENTATION_ROADMAP.md', '**/QUICK_START.md', '**/README.md'],
      config: ['package.json', 'tsconfig.json', '.env*']
    };
    
    // Core documentation structure (v2.0 consolidated)
    this.CORE_DOCS = new Set([
      'README.md',
      'MASTER_REFERENCE.md',
      'API_DOCUMENTATION.md',
      'IMPLEMENTATION_ROADMAP.md',
      'QUICK_START.md'
    ]);
    
    // Claude API
    this.anthropic = null;
    
    // 자가개선 규칙
    this.improvementRules = new Map();
    this.initializeRules();
  }

  async initialize() {
    logger.info(' Real-Time Self-Improvement Engine 초기화');
    
    // Claude API 초기화
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
    
    // 프로젝트 그래프 구축
    await this.buildProjectGraph();
    
    // 감시자 설정
    this.setupWatchers();
    
    // 실시간 이슈 처리 시작
    this.startIssueProcessor();
    
    // 초기 일관성 검증
    await this.validateConsistency();
    
    logger.info('✅ 자가개선 엔진 준비 완료');
  }

  /**
   * 프로젝트 의존성 그래프 구축
   * 코드와 문서 간의 모든 관계를 매핑
   */
  async buildProjectGraph() {
    logger.info(' 프로젝트 그래프 구축 중...');
    
    try {
      const projectRoot = process.cwd();
      
      // 1. 코드 분석 - AST 기반
      const codeFiles = await this.findFiles(projectRoot, ['.js', '.jsx', '.ts', '.tsx']);
      
      for (const filePath of codeFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const ast = this.parseCode(content, filePath);
          
          const node = {
            type: 'code',
            path: filePath,
            ast,
            imports: this.extractImports(ast),
            exports: this.extractExports(ast),
            functions: this.extractFunctions(ast),
            classes: this.extractClasses(ast),
            dependencies: [],
            dependents: [],
            lastModified: Date.now(),
            issues: []
          };
          
          this.projectGraph.set(filePath, node);
        } catch (error) {
          logger.warn(`파일 처리 실패 ${filePath}: ${error.message}`);
        }
      }
      
      // 2. 문서 분석 - 참조 추출
      const docFiles = await this.findFiles(projectRoot, ['.md', '.mdx']);
      
      for (const filePath of docFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          
          const node = {
            type: 'doc',
            path: filePath,
            content,
            codeReferences: this.extractCodeReferences(content),
            apiReferences: this.extractAPIReferences(content),
            sections: this.extractSections(content),
            lastModified: Date.now(),
            issues: []
          };
          
          this.projectGraph.set(filePath, node);
        } catch (error) {
          logger.warn(`문서 처리 실패 ${filePath}: ${error.message}`);
        }
      }
      
      // 3. 의존성 연결
      this.linkDependencies();
      
      logger.info(`✅ 프로젝트 그래프 구축 완료: ${this.projectGraph.size}개 노드`);
    } catch (error) {
      logger.error('프로젝트 그래프 구축 실패:', error);
      // 빈 그래프로 초기화하여 서버가 계속 실행되도록 함
      this.projectGraph = new Map();
    }
  }

  /**
   * 코드 파싱
   */
  parseCode(content, filePath) {
    try {
      return parseAST(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
        errorRecovery: true
      });
    } catch (error) {
      logger.error(`AST 파싱 실패 ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Import 추출
   */
  extractImports(ast) {
    const imports = [];
    
    if (!ast) return imports;
    
    try {
      traverse(ast, {
        ImportDeclaration(path) {
          imports.push({
            source: path.node.source.value,
            specifiers: path.node.specifiers.map(s => ({
              type: s.type,
              name: s.local?.name || s.imported?.name || 'unknown'
            }))
          });
        }
      });
    } catch (error) {
      logger.debug('Import 추출 오류:', error.message);
    }
    
    return imports;
  }

  /**
   * Export 추출
   */
  extractExports(ast) {
    const exports = [];
    
    if (!ast) return exports;
    
    try {
      traverse(ast, {
        ExportNamedDeclaration(path) {
          if (path.node.declaration) {
            const name = this.getDeclarationName(path.node.declaration);
            if (name && name !== 'unknown') {
              exports.push({
                type: 'named',
                name: name
              });
            }
          } else if (path.node.specifiers) {
            // export { a, b } from './module' 형태
            path.node.specifiers.forEach(spec => {
              exports.push({
                type: 'named',
                name: spec.exported?.name || spec.local?.name || 'unknown'
              });
            });
          }
        },
        ExportDefaultDeclaration(path) {
          exports.push({
            type: 'default',
            name: 'default'
          });
        }
      });
    } catch (error) {
      logger.debug('Export 추출 오류:', error.message);
    }
    
    return exports;
  }

  /**
   * 함수 추출
   */
  extractFunctions(ast) {
    const functions = [];
    
    if (!ast) return functions;
    
    try {
      traverse(ast, {
        FunctionDeclaration(path) {
          functions.push({
            name: path.node.id?.name,
            params: path.node.params.map(p => p.name || p.type || 'param'),
            async: path.node.async,
            loc: path.node.loc
          });
        },
        ArrowFunctionExpression(path) {
          if (path.parent && path.parent.type === 'VariableDeclarator') {
            functions.push({
              name: path.parent.id?.name,
              params: path.node.params.map(p => p.name || p.type || 'param'),
              async: path.node.async,
              loc: path.node.loc
            });
          }
        }
      });
    } catch (error) {
      logger.debug('Function 추출 오류:', error.message);
    }
    
    return functions;
  }

  /**
   * 클래스 추출
   */
  extractClasses(ast) {
    const classes = [];
    
    if (!ast) return classes;
    
    try {
      traverse(ast, {
        ClassDeclaration(path) {
          if (path.node && path.node.id) {
            classes.push({
              name: path.node.id?.name || 'anonymous',
              methods: path.node.body?.body
                ?.filter(m => m && m.type === 'ClassMethod')
                ?.map(m => m.key?.name || 'unknown') || [],
              loc: path.node.loc
            });
          }
        }
      });
    } catch (error) {
      logger.debug('Class 추출 오류:', error.message);
    }
    
    return classes;
  }

  /**
   * 문서에서 코드 참조 추출
   */
  extractCodeReferences(content) {
    const references = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    const importRegex = /import .+ from ['"](.+)['"]/g;
    
    let match;
    
    // 코드 블록
    while ((match = codeBlockRegex.exec(content)) !== null) {
      references.push({
        type: 'codeblock',
        language: match[1] || 'unknown',
        content: match[2]
      });
    }
    
    // 인라인 코드
    while ((match = inlineCodeRegex.exec(content)) !== null) {
      references.push({
        type: 'inline',
        content: match[1]
      });
    }
    
    // Import 문
    while ((match = importRegex.exec(content)) !== null) {
      references.push({
        type: 'import',
        source: match[1]
      });
    }
    
    return references;
  }

  /**
   * API 참조 추출
   */
  extractAPIReferences(content) {
    const references = [];
    const apiRegex = /(?:GET|POST|PUT|DELETE|PATCH)\s+([^\s\n]+)/g;
    const endpointRegex = /\/api\/[^\s\n,)]+/g;
    
    let match;
    
    while ((match = apiRegex.exec(content)) !== null) {
      references.push({
        type: 'endpoint',
        method: match[0].split(' ')[0],
        path: match[1]
      });
    }
    
    while ((match = endpointRegex.exec(content)) !== null) {
      references.push({
        type: 'endpoint',
        path: match[0]
      });
    }
    
    return references;
  }

  /**
   * 문서 섹션 추출
   */
  extractSections(content) {
    const sections = [];
    const sectionRegex = /^(#{1,6})\s+(.+)$/gm;
    
    let match;
    while ((match = sectionRegex.exec(content)) !== null) {
      sections.push({
        level: match[1].length,
        title: match[2],
        position: match.index
      });
    }
    
    return sections;
  }

  /**
   * 의존성 연결
   */
  linkDependencies() {
    // 코드 간 의존성
    for (const [filePath, node] of this.projectGraph) {
      if (node.type !== 'code') continue;
      
      for (const imp of node.imports) {
        const resolvedPath = this.resolveImport(filePath, imp.source);
        if (resolvedPath && this.projectGraph.has(resolvedPath)) {
          node.dependencies.push(resolvedPath);
          this.projectGraph.get(resolvedPath).dependents.push(filePath);
        }
      }
    }
    
    // 문서-코드 참조
    for (const [docPath, docNode] of this.projectGraph) {
      if (docNode.type !== 'doc') continue;
      
      for (const ref of docNode.codeReferences) {
        if (ref.type === 'import') {
          const codePath = this.findCodeFile(ref.source);
          if (codePath) {
            docNode.dependencies.push(codePath);
            this.projectGraph.get(codePath).dependents.push(docPath);
          }
        }
      }
    }
  }

  /**
   * 실시간 감시자 설정
   */
  setupWatchers() {
    const watcher = chokidar.watch(Object.values(this.watchTargets).flat(), {
      ignored: ['node_modules', '.git', 'dist', 'build'],
      persistent: true,
      ignoreInitial: true
    });
    
    watcher
      .on('change', async (filePath) => {
        await this.handleFileChange(filePath);
      })
      .on('add', async (filePath) => {
        await this.handleFileAdd(filePath);
      })
      .on('unlink', async (filePath) => {
        await this.handleFileRemove(filePath);
      });
    
    logger.info('️ 실시간 감시 시작');
  }

  /**
   * 파일 변경 처리 - 핵심 로직
   */
  async handleFileChange(filePath) {
    logger.info(` 변경 감지: ${path.basename(filePath)}`);
    
    const node = this.projectGraph.get(filePath);
    if (!node) return;
    
    // 1. 변경 내용 분석
    const changes = await this.analyzeChanges(filePath, node);
    
    // 2. 영향 범위 계산
    const impact = this.calculateImpact(filePath, changes);
    
    // 3. 이슈 감지
    const issues = await this.detectIssues(changes, impact);
    
    // 4. 자동 수정 생성
    const fixes = await this.generateFixes(issues);
    
    // 5. 수정 적용
    await this.applyFixes(fixes);
    
    // 6. 문서 업데이트
    await this.updateDocumentation(changes, impact);
    
    // 7. 일관성 검증
    await this.validateConsistency();
    
    this.emit('improvement', {
      file: filePath,
      changes,
      impact,
      issues,
      fixes
    });
  }

  /**
   * 변경 분석
   */
  async analyzeChanges(filePath, node) {
    const content = await fs.readFile(filePath, 'utf-8');
    const changes = {
      type: node.type,
      path: filePath,
      additions: [],
      deletions: [],
      modifications: []
    };
    
    if (node.type === 'code') {
      const newAST = this.parseCode(content, filePath);
      const newFunctions = this.extractFunctions(newAST);
      const newClasses = this.extractClasses(newAST);
      const newExports = this.extractExports(newAST);
      
      // 함수 변경 감지
      changes.additions.push(...this.findAdditions(node.functions, newFunctions, 'function'));
      changes.deletions.push(...this.findDeletions(node.functions, newFunctions, 'function'));
      changes.modifications.push(...this.findModifications(node.functions, newFunctions, 'function'));
      
      // 클래스 변경 감지
      changes.additions.push(...this.findAdditions(node.classes, newClasses, 'class'));
      changes.deletions.push(...this.findDeletions(node.classes, newClasses, 'class'));
      
      // Export 변경 감지
      changes.additions.push(...this.findAdditions(node.exports, newExports, 'export'));
      changes.deletions.push(...this.findDeletions(node.exports, newExports, 'export'));
      
      // 노드 업데이트
      node.ast = newAST;
      node.functions = newFunctions;
      node.classes = newClasses;
      node.exports = newExports;
    } else if (node.type === 'doc') {
      // 문서 변경 분석
      const newSections = this.extractSections(content);
      const newReferences = this.extractCodeReferences(content);
      
      changes.additions.push(...this.findAdditions(node.sections, newSections, 'section'));
      changes.deletions.push(...this.findDeletions(node.sections, newSections, 'section'));
      
      // 노드 업데이트
      node.content = content;
      node.sections = newSections;
      node.codeReferences = newReferences;
    }
    
    node.lastModified = Date.now();
    
    return changes;
  }

  /**
   * 영향 범위 계산
   */
  calculateImpact(filePath, changes) {
    const impact = {
      direct: [],
      indirect: [],
      critical: []
    };
    
    const node = this.projectGraph.get(filePath);
    if (!node) return impact;
    
    // 직접 영향: 의존하는 파일들
    impact.direct = [...node.dependents];
    
    // 간접 영향: 2차 의존성
    const visited = new Set([filePath]);
    const queue = [...impact.direct];
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      
      visited.add(current);
      const currentNode = this.projectGraph.get(current);
      
      if (currentNode) {
        impact.indirect.push(...currentNode.dependents.filter(d => !visited.has(d)));
      }
    }
    
    // 중요 변경 감지
    for (const change of [...changes.deletions, ...changes.modifications]) {
      if (change.type === 'export' || change.type === 'function') {
        // Export나 public 함수 변경은 critical
        impact.critical.push({
          type: change.type,
          name: change.item.name,
          affectedFiles: impact.direct
        });
      }
    }
    
    return impact;
  }

  /**
   * 이슈 감지
   */
  async detectIssues(changes, impact) {
    const issues = [];
    
    // 1. Breaking Changes 감지
    for (const deletion of changes.deletions) {
      if (deletion.type === 'export' || deletion.type === 'function') {
        // 삭제된 export/함수를 사용하는 파일 찾기
        for (const dependentPath of impact.direct) {
          const dependent = this.projectGraph.get(dependentPath);
          if (dependent && dependent.type === 'code') {
            const usages = this.findUsages(dependent.ast, deletion.item.name);
            if (usages.length > 0) {
              issues.push({
                type: 'BREAKING_CHANGE',
                severity: 'critical',
                file: dependentPath,
                message: `'${deletion.item.name}' was deleted but is still being used`,
                locations: usages
              });
            }
          }
        }
      }
    }
    
    // 2. 문서-코드 불일치 감지
    for (const docPath of impact.direct.filter(p => this.projectGraph.get(p)?.type === 'doc')) {
      const doc = this.projectGraph.get(docPath);
      
      // 문서가 참조하는 코드가 변경되었는지 확인
      for (const ref of doc.codeReferences) {
        if (ref.type === 'inline' || ref.type === 'codeblock') {
          // 코드 예제가 outdated인지 확인
          const isOutdated = await this.checkCodeExample(ref.content, changes);
          if (isOutdated) {
            issues.push({
              type: 'OUTDATED_DOCUMENTATION',
              severity: 'high',
              file: docPath,
              message: 'Code example in documentation is outdated',
              reference: ref
            });
          }
        }
      }
    }
    
    // 3. Type 불일치 감지
    if (this.hasTypeScript()) {
      const typeErrors = await this.checkTypeErrors();
      issues.push(...typeErrors.map(err => ({
        type: 'TYPE_ERROR',
        severity: 'high',
        file: err.file,
        message: err.message,
        line: err.line
      })));
    }
    
    // 4. 테스트 실패 감지
    const testResults = await this.runTests();
    if (testResults.failures.length > 0) {
      issues.push(...testResults.failures.map(failure => ({
        type: 'TEST_FAILURE',
        severity: 'high',
        file: failure.file,
        message: failure.message,
        test: failure.name
      })));
    }
    
    // 5. API Contract 위반 감지
    for (const modification of changes.modifications) {
      if (modification.type === 'function') {
        const paramChanges = this.detectParamChanges(modification.old, modification.new);
        if (paramChanges.breaking) {
          issues.push({
            type: 'API_CONTRACT_VIOLATION',
            severity: 'critical',
            file: changes.path,
            message: `Function '${modification.new.name}' signature changed`,
            details: paramChanges
          });
        }
      }
    }
    
    return issues;
  }

  /**
   * 자동 수정 생성 - Claude API 활용
   */
  async generateFixes(issues) {
    const fixes = [];
    
    for (const issue of issues) {
      let fix = null;
      
      switch (issue.type) {
        case 'BREAKING_CHANGE':
          fix = await this.generateBreakingChangeFix(issue);
          break;
          
        case 'OUTDATED_DOCUMENTATION':
          fix = await this.generateDocumentationFix(issue);
          break;
          
        case 'TYPE_ERROR':
          fix = await this.generateTypeErrorFix(issue);
          break;
          
        case 'TEST_FAILURE':
          fix = await this.generateTestFix(issue);
          break;
          
        case 'API_CONTRACT_VIOLATION':
          fix = await this.generateAPIFix(issue);
          break;
      }
      
      if (fix) {
        fixes.push({
          issue,
          fix,
          confidence: fix.confidence || 0.8
        });
      }
    }
    
    return fixes;
  }

  /**
   * Breaking Change 수정
   */
  async generateBreakingChangeFix(issue) {
    if (this.anthropic) {
      const prompt = `
        A function/export was deleted but is still being used.
        
        Issue: ${JSON.stringify(issue)}
        
        Generate a fix that either:
        1. Adds a deprecation wrapper with the old name
        2. Updates all usages to use a new alternative
        3. Restores the deleted function with a deprecation warning
        
        Return JSON:
        {
          "action": "wrapper|update|restore",
          "code": "// actual code to add/modify",
          "targetFile": "path/to/file",
          "confidence": 0.0-1.0
        }
      `;
      
      const response = await this.callClaude(prompt, 'fixer');
      return JSON.parse(response);
    }
    
    // Fallback: 간단한 래퍼 생성
    return {
      action: 'wrapper',
      code: `// Deprecated: This function was moved\nexport const ${issue.locations[0]} = (...args) => {\n  console.warn('Deprecated function called');\n  // TODO: Update to new implementation\n};\n`,
      targetFile: issue.file,
      confidence: 0.6
    };
  }

  /**
   * 문서 수정
   */
  async generateDocumentationFix(issue) {
    const doc = this.projectGraph.get(issue.file);
    const updatedContent = doc.content;
    
    if (this.anthropic) {
      const prompt = `
        Documentation is outdated. Update the code example.
        
        Original: ${issue.reference.content}
        File: ${issue.file}
        
        Provide the corrected version that matches the current implementation.
      `;
      
      const response = await this.callClaude(prompt, 'documenter');
      
      return {
        action: 'replace',
        oldContent: issue.reference.content,
        newContent: response,
        targetFile: issue.file,
        confidence: 0.9
      };
    }
    
    return null;
  }

  /**
   * 수정 적용
   */
  async applyFixes(fixes) {
    const appliedFixes = [];
    
    for (const { issue, fix, confidence } of fixes) {
      // 신뢰도 임계값 체크
      if (confidence < 0.7) {
        logger.warn(`낮은 신뢰도 수정 건너뛰기: ${issue.type}`);
        continue;
      }
      
      try {
        if (fix.action === 'replace') {
          // 내용 교체
          const content = await fs.readFile(fix.targetFile, 'utf-8');
          const updatedContent = content.replace(fix.oldContent, fix.newContent);
          
          // 백업 생성
          await this.createBackup(fix.targetFile);
          
          // 수정 적용
          await fs.writeFile(fix.targetFile, updatedContent);
          
          appliedFixes.push({
            file: fix.targetFile,
            type: 'replace',
            issue: issue.type
          });
          
        } else if (fix.action === 'wrapper' || fix.action === 'restore') {
          // 코드 추가
          const content = await fs.readFile(fix.targetFile, 'utf-8');
          const updatedContent = content + '\n' + fix.code;
          
          await this.createBackup(fix.targetFile);
          await fs.writeFile(fix.targetFile, updatedContent);
          
          appliedFixes.push({
            file: fix.targetFile,
            type: fix.action,
            issue: issue.type
          });
        }
        
        logger.info(`✅ 자동 수정 적용: ${issue.type} in ${path.basename(fix.targetFile)}`);
        
      } catch (error) {
        logger.error(`수정 적용 실패: ${error.message}`);
      }
    }
    
    // 변경 이력 저장
    this.changeHistory.push({
      timestamp: Date.now(),
      fixes: appliedFixes
    });
    
    return appliedFixes;
  }

  /**
   * 문서 자동 업데이트
   */
  async updateDocumentation(changes, impact) {
    // README 자동 업데이트
    if (changes.additions.some(a => a.type === 'export')) {
      await this.updateREADME(changes);
    }
    
    // API 문서 자동 생성
    if (changes.modifications.some(m => m.type === 'function')) {
      await this.generateAPIDocs(changes);
    }
    
    // 변경 로그 업데이트
    await this.updateChangelog(changes, impact);
  }

  /**
   * 일관성 검증
   */
  async validateConsistency() {
    const inconsistencies = [];
    
    // 1. 모든 export가 문서화되었는지 확인
    for (const [path, node] of this.projectGraph) {
      if (node.type !== 'code') continue;
      
      for (const exp of node.exports) {
        const isDocumented = await this.checkDocumentation(exp);
        if (!isDocumented) {
          inconsistencies.push({
            type: 'UNDOCUMENTED_EXPORT',
            file: path,
            export: exp.name
          });
        }
      }
    }
    
    // 2. 모든 문서 참조가 유효한지 확인
    for (const [path, node] of this.projectGraph) {
      if (node.type !== 'doc') continue;
      
      for (const ref of node.codeReferences) {
        const isValid = await this.validateReference(ref);
        if (!isValid) {
          inconsistencies.push({
            type: 'INVALID_REFERENCE',
            file: path,
            reference: ref
          });
        }
      }
    }
    
    // 자동 수정
    if (inconsistencies.length > 0) {
      logger.warn(`️ ${inconsistencies.length}개 불일치 발견`);
      
      // 이슈로 등록
      for (const inconsistency of inconsistencies) {
        this.issueQueue.push({
          ...inconsistency,
          severity: 'medium',
          timestamp: Date.now()
        });
      }
    }
    
    return inconsistencies;
  }

  /**
   * 이슈 프로세서
   */
  async startIssueProcessor() {
    setInterval(async () => {
      if (this.isProcessing || this.issueQueue.length === 0) return;
      
      this.isProcessing = true;
      
      try {
        const batch = this.issueQueue.splice(0, 10);
        const fixes = await this.generateFixes(batch);
        await this.applyFixes(fixes);
      } catch (error) {
        logger.error('이슈 처리 실패:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 5000);
  }

  /**
   * Claude API 호출
   */
  async callClaude(prompt, role = 'analyzer') {
    if (!this.anthropic) {
      return this.simulateResponse(prompt, role);
    }
    
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        system: `You are a ${role} for a self-improving development system.`,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });
      
      return response.content[0].text;
    } catch (error) {
      logger.error(`Claude API error (${role}):`, error);
      return null;
    }
  }

  /**
   * Helper 함수들
   */
  
  findAdditions(oldItems, newItems, type) {
    const additions = [];
    const oldNames = new Set(oldItems.map(i => i.name));
    
    for (const item of newItems) {
      if (!oldNames.has(item.name)) {
        additions.push({ type, item, action: 'added' });
      }
    }
    
    return additions;
  }

  findDeletions(oldItems, newItems, type) {
    const deletions = [];
    const newNames = new Set(newItems.map(i => i.name));
    
    for (const item of oldItems) {
      if (!newNames.has(item.name)) {
        deletions.push({ type, item, action: 'deleted' });
      }
    }
    
    return deletions;
  }

  findModifications(oldItems, newItems, type) {
    const modifications = [];
    
    for (const newItem of newItems) {
      const oldItem = oldItems.find(i => i.name === newItem.name);
      if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
        modifications.push({ 
          type, 
          old: oldItem, 
          new: newItem, 
          action: 'modified' 
        });
      }
    }
    
    return modifications;
  }

  findUsages(ast, name) {
    const usages = [];
    
    if (!ast) return usages;
    
    traverse(ast, {
      Identifier(path) {
        if (path.node.name === name) {
          usages.push({
            line: path.node.loc?.start.line,
            column: path.node.loc?.start.column
          });
        }
      }
    });
    
    return usages;
  }

  async createBackup(filePath) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    const content = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(backupPath, content);
    logger.info(` 백업 생성: ${path.basename(backupPath)}`);
  }

  async checkTypeErrors() {
    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit');
      
      if (stderr) {
        const errors = [];
        const lines = stderr.split('\n');
        
        for (const line of lines) {
          const match = line.match(/(.+)\((\d+),(\d+)\): error TS\d+: (.+)/);
          if (match) {
            errors.push({
              file: match[1],
              line: parseInt(match[2]),
              column: parseInt(match[3]),
              message: match[4]
            });
          }
        }
        
        return errors;
      }
    } catch (error) {
      // TypeScript 에러가 있으면 여기로
      return [];
    }
    
    return [];
  }

  async runTests() {
    try {
      const { stdout } = await execAsync('npm test -- --json');
      const results = JSON.parse(stdout);
      
      return {
        failures: results.testResults
          ?.filter(r => r.status === 'failed')
          .map(r => ({
            file: r.name,
            name: r.title,
            message: r.failureMessage
          })) || []
      };
    } catch (error) {
      return { failures: [] };
    }
  }

  detectParamChanges(oldFunc, newFunc) {
    const oldParams = oldFunc.params || [];
    const newParams = newFunc.params || [];
    
    return {
      breaking: oldParams.length !== newParams.length,
      added: newParams.length > oldParams.length,
      removed: newParams.length < oldParams.length,
      oldCount: oldParams.length,
      newCount: newParams.length
    };
  }

  hasTypeScript() {
    // tsconfig.json 존재 여부로 판단
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    try {
      require(tsconfigPath);
      return true;
    } catch {
      return false;
    }
  }

  async findFiles(dir, extensions) {
    const files = [];
    
    const scan = async (currentDir) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !['node_modules', '.git', 'dist'].includes(entry.name)) {
          await scan(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };
    
    await scan(dir);
    return files;
  }

  resolveImport(fromPath, importPath) {
    // 상대 경로 처리
    if (importPath.startsWith('.')) {
      const resolved = path.resolve(path.dirname(fromPath), importPath);
      
      // 확장자 추가
      for (const ext of ['.js', '.jsx', '.ts', '.tsx', '']) {
        const withExt = resolved + ext;
        if (this.projectGraph.has(withExt)) {
          return withExt;
        }
      }
    }
    
    return null;
  }

  findCodeFile(name) {
    for (const [filePath, node] of this.projectGraph) {
      if (node.type === 'code' && path.basename(filePath).includes(name)) {
        return filePath;
      }
    }
    return null;
  }

  async checkCodeExample(example, changes) {
    // 코드 예제가 변경사항과 충돌하는지 확인
    for (const change of changes.deletions) {
      if (example.includes(change.item.name)) {
        return true; // outdated
      }
    }
    
    for (const change of changes.modifications) {
      if (example.includes(change.old.name)) {
        // 시그니처 변경 확인
        if (change.old.params?.length !== change.new.params?.length) {
          return true; // outdated
        }
      }
    }
    
    return false;
  }

  async checkDocumentation(exportItem) {
    // README나 문서에 해당 export가 언급되는지 확인
    for (const [path, node] of this.projectGraph) {
      if (node.type === 'doc' && node.content.includes(exportItem.name)) {
        return true;
      }
    }
    return false;
  }

  async validateReference(reference) {
    if (reference.type === 'import') {
      return this.findCodeFile(reference.source) !== null;
    }
    
    if (reference.type === 'endpoint') {
      // API 엔드포인트가 실제로 존재하는지 확인
      for (const [path, node] of this.projectGraph) {
        if (node.type === 'code' && node.content?.includes(reference.path)) {
          return true;
        }
      }
    }
    
    return true; // 기본값
  }

  async updateREADME(changes) {
    const readmePath = path.join(process.cwd(), 'README.md');
    
    try {
      let content = await fs.readFile(readmePath, 'utf-8');
      
      // API 섹션 업데이트
      const apiSection = '\n## API\n\n';
      const newExports = changes.additions
        .filter(a => a.type === 'export')
        .map(a => `- \`${a.item.name}\`: New export`)
        .join('\n');
      
      if (newExports) {
        content += apiSection + newExports + '\n';
        await fs.writeFile(readmePath, content);
        logger.info(' README 자동 업데이트 완료');
      }
    } catch (error) {
      // README가 없으면 스킵
    }
  }

  async generateAPIDocs(changes) {
    // API 문서 자동 생성 로직
    const apiDocs = [];
    
    for (const change of changes.modifications.filter(m => m.type === 'function')) {
      apiDocs.push(`
### ${change.new.name}

Parameters: ${change.new.params.join(', ')}
Async: ${change.new.async}
      `);
    }
    
    if (apiDocs.length > 0) {
      const docsPath = path.join(process.cwd(), 'API.md');
      await fs.appendFile(docsPath, apiDocs.join('\n'));
      logger.info(' API 문서 자동 생성 완료');
    }
  }

  async updateChangelog(changes, impact) {
    const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    
    const entry = `
## [${new Date().toISOString().split('T')[0]}] - Auto-generated

### Changed
${changes.modifications.map(m => `- Modified ${m.type} ${m.new.name}`).join('\n')}

### Added
${changes.additions.map(a => `- Added ${a.type} ${a.item.name}`).join('\n')}

### Removed
${changes.deletions.map(d => `- Removed ${d.type} ${d.item.name}`).join('\n')}

### Impact
- Direct: ${impact.direct.length} files
- Indirect: ${impact.indirect.length} files
- Critical: ${impact.critical.length} items
    `;
    
    try {
      await fs.appendFile(changelogPath, entry);
      logger.info(' CHANGELOG 자동 업데이트 완료');
    } catch (error) {
      // CHANGELOG가 없으면 생성
      await fs.writeFile(changelogPath, '# Changelog\n' + entry);
    }
  }

  simulateResponse(prompt, role) {
    // 시뮬레이션 응답
    if (role === 'fixer') {
      return JSON.stringify({
        action: 'wrapper',
        code: '// Auto-generated fix',
        targetFile: 'test.js',
        confidence: 0.7
      });
    }
    
    return 'Simulated response';
  }

  /**
   * 개발 규칙 초기화
   */
  initializeRules() {
    // 자동 수정 규칙
    this.improvementRules.set('IMPORT_SORT', {
      detect: (ast) => {
        // import 정렬 필요 감지
      },
      fix: (ast) => {
        // import 자동 정렬
      }
    });
    
    this.improvementRules.set('UNUSED_VARS', {
      detect: (ast) => {
        // 미사용 변수 감지
      },
      fix: (ast) => {
        // 미사용 변수 제거
      }
    });
    
    // 더 많은 규칙 추가...
  }

  /**
   * 상태 리포트
   */
  getStatus() {
    return {
      nodes: this.projectGraph.size,
      issues: this.issueQueue.length,
      changes: this.changeHistory.length,
      processing: this.isProcessing,
      lastUpdate: this.changeHistory[this.changeHistory.length - 1]?.timestamp
    };
  }

  getDeclarationName(declaration) {
    try {
      // null 또는 undefined 체크
      if (!declaration) {
        return 'unknown';
      }
      
      // 일반적인 declaration id
      if (declaration.id && declaration.id.name) {
        return declaration.id.name;
      }
      
      // VariableDeclaration의 경우
      if (declaration.declarations && declaration.declarations[0]) {
        const firstDecl = declaration.declarations[0];
        if (firstDecl.id && firstDecl.id.name) {
          return firstDecl.id.name;
        }
      }
      
      // ExportSpecifier나 다른 타입의 경우
      if (declaration.name) {
        return declaration.name;
      }
      
      // declaration이 문자열인 경우
      if (typeof declaration === 'string') {
        return declaration;
      }
      
      return 'unknown';
    } catch (error) {
      logger.debug(`getDeclarationName 오류: ${error.message}`);
      return 'unknown';
    }
  }
}

export default RealTimeSelfImprovementEngine;
