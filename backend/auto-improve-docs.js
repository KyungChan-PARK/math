#!/usr/bin/env node
// auto-improve-docs.js - 자동 문서 개선 스크립트

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chokidar from 'chokidar';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const CONFIG = {
  backendUrl: 'http://localhost:8086',
  watchedDocs: [
    'README.md',
    'IMPLEMENTATION_PLAN_AI_MATH_EDUCATION.md',
    'EXECUTION_GUIDE.md',
    'backend/src/**/*.js',
    'frontend/src/**/*.{js,jsx,ts,tsx}'
  ],
  excludePatterns: ['node_modules', '.git', 'dist', 'build'],
  autoApplyThreshold: 0.8, // 자동 적용 신뢰도 임계값
  checkInterval: 60000, // 1분마다 체크
  orchestrationMode: 'sequential' // 'sequential' or 'parallel'
};

// Document cache to track changes
const documentCache = new Map();

class DocumentAutoImprover {
  constructor() {
    this.spinner = null;
    this.improvementQueue = [];
    this.isProcessing = false;
    this.stats = {
      documentsAnalyzed: 0,
      improvementsFound: 0,
      improvementsApplied: 0,
      lastRun: null
    };
  }

  async initialize() {
    console.log(chalk.cyan.bold('\n 문서 자가개선 시스템 시작\n'));
    
    // Backend 연결 확인
    await this.checkBackendConnection();
    
    // 초기 문서 스캔
    await this.initialScan();
    
    // 파일 감시 시작
    this.startWatching();
    
    // 주기적 개선 체크
    this.startPeriodicImprovement();
    
    console.log(chalk.green('✅ 시스템 초기화 완료\n'));
  }

  async checkBackendConnection() {
    try {
      const response = await axios.get(`${CONFIG.backendUrl}/health`);
      if (response.data.status === 'healthy') {
        console.log(chalk.green('✅ 백엔드 연결 성공'));
        
        // 오케스트레이션 모드 설정
        await axios.post(`${CONFIG.backendUrl}/api/docs/improvement/mode`, {
          mode: CONFIG.orchestrationMode
        });
        
        console.log(chalk.blue(` 오케스트레이션 모드: ${CONFIG.orchestrationMode}`));
      }
    } catch (error) {
      console.error(chalk.red('❌ 백엔드 연결 실패:'), error.message);
      console.log(chalk.yellow(' 백엔드 서버를 먼저 시작하세요: npm start'));
      process.exit(1);
    }
  }

  async initialScan() {
    console.log(chalk.cyan('\n 초기 문서 스캔 시작...\n'));
    
    const documents = await this.findDocuments();
    console.log(chalk.blue(` ${documents.length}개 문서 발견\n`));
    
    for (const docPath of documents) {
      await this.cacheDocument(docPath);
    }
    
    // 초기 분석 실행
    await this.analyzeAllDocuments();
  }

  async findDocuments() {
    const documents = [];
    const mainDocs = ['README.md', 'IMPLEMENTATION_PLAN_AI_MATH_EDUCATION.md', 'EXECUTION_GUIDE.md'];
    
    for (const docName of mainDocs) {
      const docPath = path.join(projectRoot, docName);
      try {
        await fs.access(docPath);
        documents.push(docPath);
      } catch (error) {
        // 문서가 없으면 스킵
      }
    }
    
    // JavaScript 파일들 추가
    const jsFiles = await this.findJSFiles();
    documents.push(...jsFiles);
    
    return documents;
  }

  async findJSFiles() {
    const files = [];
    const directories = [
      path.join(projectRoot, 'backend', 'src'),
      path.join(projectRoot, 'frontend', 'src')
    ];
    
    for (const dir of directories) {
      try {
        const dirFiles = await this.scanDirectory(dir, ['.js', '.jsx', '.ts', '.tsx']);
        files.push(...dirFiles);
      } catch (error) {
        // 디렉토리가 없으면 스킵
      }
    }
    
    return files;
  }

  async scanDirectory(dir, extensions) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !CONFIG.excludePatterns.includes(entry.name)) {
          const subFiles = await this.scanDirectory(fullPath, extensions);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error scanning directory ${dir}:`), error.message);
    }
    
    return files;
  }

  async cacheDocument(docPath) {
    try {
      const content = await fs.readFile(docPath, 'utf-8');
      const hash = createHash('md5').update(content).digest('hex');
      
      documentCache.set(docPath, {
        hash,
        content,
        lastModified: Date.now(),
        improvements: []
      });
    } catch (error) {
      console.error(chalk.red(`Error caching ${docPath}:`), error.message);
    }
  }

  async analyzeAllDocuments() {
    const spinner = ora('문서 분석 중...').start();
    
    for (const [docPath, docData] of documentCache) {
      const fileName = path.basename(docPath);
      spinner.text = `분석 중: ${fileName}`;
      
      try {
        const response = await axios.post(`${CONFIG.backendUrl}/api/docs/analyze`, {
          documentPath: docPath,
          content: docData.content
        });
        
        if (response.data.success && response.data.improvements) {
          const improvements = response.data.improvements.improvements || [];
          
          if (improvements.length > 0) {
            docData.improvements = improvements;
            this.stats.improvementsFound += improvements.length;
            
            const highPriority = improvements.filter(imp => imp.priority === 'high').length;
            
            if (highPriority > 0) {
              spinner.warn(`${fileName}: ${highPriority}개 고우선순위 개선사항 발견`);
            } else {
              spinner.succeed(`${fileName}: ${improvements.length}개 개선사항 발견`);
            }
            
            // 자동 적용 체크
            await this.checkAutoApply(docPath, improvements);
          } else {
            spinner.succeed(`${fileName}: 개선사항 없음 ✨`);
          }
        }
        
        this.stats.documentsAnalyzed++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        spinner.fail(`${fileName} 분석 실패: ${error.message}`);
      }
    }
    
    spinner.stop();
    this.printStats();
  }

  async checkAutoApply(docPath, improvements) {
    const highPriorityImprovements = improvements.filter(imp => imp.priority === 'high');
    
    if (highPriorityImprovements.length === 0) return;
    
    console.log(chalk.yellow(`\n ${path.basename(docPath)}에 대한 개선사항:`));
    
    for (const improvement of highPriorityImprovements.slice(0, 3)) {
      console.log(chalk.gray('  •'), improvement.reasoning || improvement.summary || 'Improvement suggested');
    }
    
    // 여기서 실제로 개선사항을 적용할 수 있지만, 안전을 위해 수동 확인 필요
    console.log(chalk.cyan('   개선사항을 수동으로 검토하세요\n'));
  }

  startWatching() {
    console.log(chalk.cyan('️  파일 감시 시작...\n'));
    
    const watcher = chokidar.watch(CONFIG.watchedDocs.map(pattern => 
      path.join(projectRoot, pattern)
    ), {
      ignored: CONFIG.excludePatterns,
      persistent: true,
      ignoreInitial: true
    });
    
    watcher
      .on('change', async (filePath) => {
        console.log(chalk.yellow(` 파일 변경 감지: ${path.basename(filePath)}`));
        await this.handleFileChange(filePath);
      })
      .on('add', async (filePath) => {
        console.log(chalk.green(`➕ 새 파일 추가: ${path.basename(filePath)}`));
        await this.handleFileAdd(filePath);
      });
  }

  async handleFileChange(filePath) {
    await this.cacheDocument(filePath);
    
    // 변경된 문서 분석
    const docData = documentCache.get(filePath);
    if (docData) {
      try {
        const response = await axios.post(`${CONFIG.backendUrl}/api/docs/analyze`, {
          documentPath: filePath,
          content: docData.content
        });
        
        if (response.data.success && response.data.improvements) {
          const improvements = response.data.improvements.improvements || [];
          
          if (improvements.length > 0) {
            console.log(chalk.blue(`   ${improvements.length}개 개선사항 발견`));
            docData.improvements = improvements;
            this.stats.improvementsFound += improvements.length;
          } else {
            console.log(chalk.green(`  ✨ 개선사항 없음`));
          }
        }
      } catch (error) {
        console.error(chalk.red(`  ❌ 분석 실패:`), error.message);
      }
    }
  }

  async handleFileAdd(filePath) {
    await this.cacheDocument(filePath);
    await this.handleFileChange(filePath);
  }

  startPeriodicImprovement() {
    setInterval(async () => {
      console.log(chalk.cyan('\n⏰ 정기 개선 체크 실행\n'));
      await this.analyzeAllDocuments();
      
      // 개선 이력 저장
      this.stats.lastRun = new Date().toISOString();
      await this.saveStats();
    }, CONFIG.checkInterval);
  }

  async saveStats() {
    const statsPath = path.join(projectRoot, '.improvement-stats.json');
    try {
      await fs.writeFile(statsPath, JSON.stringify(this.stats, null, 2));
    } catch (error) {
      console.error(chalk.red('통계 저장 실패:'), error.message);
    }
  }

  printStats() {
    console.log(chalk.cyan('\n 개선 통계:\n'));
    console.log(chalk.white(`  • 분석된 문서: ${this.stats.documentsAnalyzed}개`));
    console.log(chalk.white(`  • 발견된 개선사항: ${this.stats.improvementsFound}개`));
    console.log(chalk.white(`  • 적용된 개선사항: ${this.stats.improvementsApplied}개`));
    
    if (this.stats.lastRun) {
      console.log(chalk.gray(`  • 마지막 실행: ${new Date(this.stats.lastRun).toLocaleString()}`));
    }
    console.log();
  }

  async exportImprovements() {
    const improvements = [];
    
    for (const [docPath, docData] of documentCache) {
      if (docData.improvements && docData.improvements.length > 0) {
        improvements.push({
          document: path.relative(projectRoot, docPath),
          improvements: docData.improvements,
          timestamp: docData.lastModified
        });
      }
    }
    
    const exportPath = path.join(projectRoot, 'document-improvements.json');
    await fs.writeFile(exportPath, JSON.stringify(improvements, null, 2));
    
    console.log(chalk.green(`✅ 개선사항 내보내기 완료: ${exportPath}`));
    return exportPath;
  }
}

// CLI 명령 처리
async function handleCommand(command) {
  const improver = new DocumentAutoImprover();
  
  switch (command) {
    case 'start':
      await improver.initialize();
      break;
      
    case 'analyze':
      await improver.checkBackendConnection();
      await improver.initialScan();
      break;
      
    case 'export':
      await improver.checkBackendConnection();
      await improver.initialScan();
      await improver.exportImprovements();
      break;
      
    case 'stats':
      await improver.checkBackendConnection();
      improver.printStats();
      break;
      
    default:
      console.log(chalk.yellow('사용법:'));
      console.log('  node auto-improve-docs.js start   - 자동 개선 시스템 시작');
      console.log('  node auto-improve-docs.js analyze - 단일 분석 실행');
      console.log('  node auto-improve-docs.js export  - 개선사항 내보내기');
      console.log('  node auto-improve-docs.js stats   - 통계 보기');
  }
}

// Main execution
const command = process.argv[2] || 'start';

handleCommand(command).catch(error => {
  console.error(chalk.red('오류:'), error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n 문서 자가개선 시스템 종료\n'));
  process.exit(0);
});
