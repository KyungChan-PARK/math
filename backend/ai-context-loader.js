#!/usr/bin/env node
// ai-context-loader.js - AI 세션 컨텍스트 자동 로더

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * AI 세션 시작 시 자동으로 실행되는 컨텍스트 로더
 * 이전 세션의 모든 정보를 복원하고 현재 상태를 파악
 */
class AIContextLoader {
  constructor() {
    this.contextPath = path.join(__dirname, '..', 'AI_SESSION_CONTEXT.md');
    this.statePath = path.join(__dirname, '..', '.ai_state.json');
    this.lessonsPath = path.join(__dirname, '..', '.lessons');
    this.context = {};
    this.state = {};
    this.lessons = [];
  }

  async load() {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════╗
║     AI Session Context Loader v2.0               ║
║     프로젝트 상태 자동 복원 시스템               ║
╚══════════════════════════════════════════════════╝
`));

    try {
      // 1. 컨텍스트 문서 로드
      await this.loadContextDocument();
      
      // 2. 프로젝트 상태 로드
      await this.loadProjectState();
      
      // 3. 학습된 교훈 로드
      await this.loadLessons();
      
      // 4. 현재 이슈 확인
      await this.checkCurrentIssues();
      
      // 5. 시스템 상태 검증
      await this.validateSystemStatus();
      
      // 6. 요약 출력
      this.printSummary();
      
      // 7. 상태 저장
      await this.saveState();
      
      console.log(chalk.green.bold('\n✅ AI 컨텍스트 로드 완료!\n'));
      
      return this.context;
      
    } catch (error) {
      console.error(chalk.red('컨텍스트 로드 실패:'), error);
      throw error;
    }
  }

  async loadContextDocument() {
    try {
      const content = await fs.readFile(this.contextPath, 'utf-8');
      
      // 핵심 정보 추출
      this.context.projectName = this.extractSection(content, '프로젝트명');
      this.context.currentPhase = this.extractSection(content, '현재 단계');
      this.context.aiRole = this.extractSection(content, 'AI 역할 정의');
      this.context.systemStructure = this.extractSection(content, '현재 시스템 구조');
      
      console.log(chalk.green('✓ 컨텍스트 문서 로드 완료'));
    } catch (error) {
      console.error(chalk.yellow(' 컨텍스트 문서 없음, 새로 생성 필요'));
    }
  }

  async loadProjectState() {
    try {
      const stateContent = await fs.readFile(this.statePath, 'utf-8');
      this.state = JSON.parse(stateContent);
      
      console.log(chalk.green('✓ 프로젝트 상태 로드 완료'));
      console.log(chalk.gray(`  - 마지막 세션: ${new Date(this.state.lastSession).toLocaleString()}`));
      console.log(chalk.gray(`  - 해결된 이슈: ${this.state.resolvedIssues || 0}개`));
      console.log(chalk.gray(`  - 학습된 교훈: ${this.state.lessonsLearned || 0}개`));
    } catch (error) {
      // 상태 파일이 없으면 초기화
      this.state = {
        lastSession: Date.now(),
        resolvedIssues: 0,
        lessonsLearned: 0,
        currentMode: 'development',
        activeServices: []
      };
    }
  }

  async loadLessons() {
    try {
      const files = await fs.readdir(this.lessonsPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(
            path.join(this.lessonsPath, file),
            'utf-8'
          );
          this.lessons.push(JSON.parse(content));
        }
      }
      
      console.log(chalk.green(`✓ ${this.lessons.length}개 교훈 로드 완료`));
      
      // 최근 교훈 표시
      const recentLessons = this.lessons
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);
      
      if (recentLessons.length > 0) {
        console.log(chalk.cyan('\n 최근 학습된 교훈:'));
        recentLessons.forEach((lesson, idx) => {
          console.log(chalk.gray(`  ${idx + 1}. ${lesson.summary || lesson.issueType}`));
        });
      }
    } catch (error) {
      console.log(chalk.yellow(' 교훈 디렉토리 없음'));
      this.lessons = [];
    }
  }

  async checkCurrentIssues() {
    // 현재 해결되지 않은 이슈 확인
    const issuesPath = path.join(__dirname, '..', '.current_issues.json');
    
    try {
      const content = await fs.readFile(issuesPath, 'utf-8');
      const issues = JSON.parse(content);
      
      if (issues.length > 0) {
        console.log(chalk.yellow(`\n️ 해결 대기 중인 이슈: ${issues.length}개`));
        issues.slice(0, 3).forEach((issue, idx) => {
          console.log(chalk.gray(`  ${idx + 1}. ${issue.type}: ${issue.message}`));
        });
      } else {
        console.log(chalk.green('\n✓ 현재 해결 대기 중인 이슈 없음'));
      }
    } catch (error) {
      console.log(chalk.green('\n✓ 이슈 큐 비어있음'));
    }
  }

  async validateSystemStatus() {
    console.log(chalk.cyan('\n 시스템 상태 검증:'));
    
    const checks = [
      { name: 'Frontend', path: path.join(__dirname, '..', '..', 'frontend', 'package.json'), status: false },
      { name: 'Backend', path: path.join(__dirname, '..', 'package.json'), status: false },
      { name: 'MongoDB', command: 'mongod --version', status: false },
      { name: 'MCP Engine', path: path.join(__dirname, 'services', 'MCPIntegratedSelfImprovementEngine.js'), status: false }
    ];
    
    for (const check of checks) {
      try {
        if (check.path) {
          await fs.access(check.path);
          check.status = true;
        }
      } catch (error) {
        check.status = false;
      }
      
      const status = check.status ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${status} ${check.name}`);
    }
    
    this.state.systemStatus = checks;
  }

  printSummary() {
    console.log(chalk.blue.bold('\n 프로젝트 요약:'));
    console.log(chalk.white('━'.repeat(50)));
    
    console.log(chalk.white('프로젝트: AI-in-the-Loop 지능형 수학 교육 시스템'));
    console.log(chalk.white('현재 단계: Phase 3 - MCP 통합 완료'));
    console.log(chalk.white(`학습된 교훈: ${this.lessons.length}개`));
    console.log(chalk.white(`해결된 이슈: ${this.state.resolvedIssues}개`));
    
    console.log(chalk.white('\n️ 사용 가능한 기능:'));
    console.log(chalk.gray('  • MCP 도구 (brave-search, memory, filesystem)'));
    console.log(chalk.gray('  • 자가개선 엔진 (이슈 자동 해결)'));
    console.log(chalk.gray('  • 실시간 문서 동기화'));
    console.log(chalk.gray('  • RLHF 학습 시스템'));
    
    console.log(chalk.white('\n 주요 파일 위치:'));
    console.log(chalk.gray('  • 메인 서버: /backend/src/server.js'));
    console.log(chalk.gray('  • MCP 엔진: /backend/src/services/MCPIntegratedSelfImprovementEngine.js'));
    console.log(chalk.gray('  • 프론트엔드: /frontend/src/App.tsx'));
    console.log(chalk.gray('  • AI 컨텍스트: /AI_SESSION_CONTEXT.md'));
  }

  async saveState() {
    // 현재 상태 저장
    this.state.lastSession = Date.now();
    this.state.lessonsCount = this.lessons.length;
    
    await fs.writeFile(
      this.statePath,
      JSON.stringify(this.state, null, 2)
    );
  }

  extractSection(content, sectionName) {
    const regex = new RegExp(`${sectionName}[:\s]+(.+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  // 새 세션 시작 시 자동 실행되는 초기화
  async autoInitialize() {
    console.log(chalk.magenta.bold('\n AI 자동 초기화 시작...\n'));
    
    // 1. 컨텍스트 로드
    await this.load();
    
    // 2. 필요한 서비스 시작 제안
    console.log(chalk.cyan('\n 권장 실행 명령:'));
    console.log(chalk.gray('  1. cd backend && npm start'));
    console.log(chalk.gray('  2. cd frontend && npm start'));
    console.log(chalk.gray('  3. node test-mcp-integration.js'));
    
    // 3. AI 역할 재확인
    console.log(chalk.yellow.bold('\n 내 역할:'));
    console.log(chalk.white('나는 이 프로젝트의 수석 AI 아키텍트입니다.'));
    console.log(chalk.white('- 모든 이슈를 자동으로 해결합니다'));
    console.log(chalk.white('- MCP 도구를 활용하여 웹에서 해결책을 찾습니다'));
    console.log(chalk.white('- 교훈을 저장하고 재사용합니다'));
    console.log(chalk.white('- 문서를 실시간으로 업데이트합니다'));
    
    return this.context;
  }
}

// 자동 실행
if (import.meta.url === `file://${__filename}`) {
  const loader = new AIContextLoader();
  loader.autoInitialize().catch(console.error);
}

export default AIContextLoader;
