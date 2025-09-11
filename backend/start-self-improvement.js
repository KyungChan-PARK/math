#!/usr/bin/env node
// start-self-improvement.js - 진짜 자가개선 시스템 시작

import RealTimeSelfImprovementEngine from './src/services/RealTimeSelfImprovementEngine.js';
import chalk from 'chalk';
import ora from 'ora';
import { logger } from './src/utils/logger.js';

console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════╗
║     Real-Time Self-Improvement System v2.0       ║
║     코드-문서 양방향 자동 동기화 시스템           ║
╚══════════════════════════════════════════════════╝
`));

async function startSystem() {
  const spinner = ora('시스템 초기화 중...').start();
  
  try {
    // 엔진 초기화
    const engine = new RealTimeSelfImprovementEngine();
    
    // 이벤트 리스너 설정
    engine.on('improvement', (data) => {
      console.log(chalk.green('\n✨ 자가개선 실행:'));
      console.log(chalk.white(`  파일: ${data.file}`));
      console.log(chalk.yellow(`  변경: ${data.changes.additions.length} 추가, ${data.changes.deletions.length} 삭제, ${data.changes.modifications.length} 수정`));
      console.log(chalk.cyan(`  영향: ${data.impact.direct.length} 직접, ${data.impact.indirect.length} 간접`));
      
      if (data.issues.length > 0) {
        console.log(chalk.red(`  이슈: ${data.issues.length}개 감지`));
        for (const issue of data.issues.slice(0, 3)) {
          console.log(chalk.gray(`    - ${issue.type}: ${issue.message}`));
        }
      }
      
      if (data.fixes.length > 0) {
        console.log(chalk.green(`  수정: ${data.fixes.length}개 적용`));
      }
    });
    
    // 시스템 시작
    await engine.initialize();
    
    spinner.succeed('시스템 초기화 완료');
    
    // 상태 표시
    const status = engine.getStatus();
    console.log(chalk.blue('\n 시스템 상태:'));
    console.log(chalk.white(`  • 프로젝트 노드: ${status.nodes}개`));
    console.log(chalk.white(`  • 대기 중인 이슈: ${status.issues}개`));
    console.log(chalk.white(`  • 변경 이력: ${status.changes}개`));
    
    console.log(chalk.green('\n✅ 자가개선 시스템이 실행 중입니다'));
    console.log(chalk.gray('종료하려면 Ctrl+C를 누르세요\n'));
    
    // 주기적 상태 리포트
    setInterval(() => {
      const currentStatus = engine.getStatus();
      if (currentStatus.processing) {
        console.log(chalk.yellow(`️ 처리 중... (이슈: ${currentStatus.issues}개)`));
      }
    }, 30000);
    
  } catch (error) {
    spinner.fail('시스템 초기화 실패');
    console.error(chalk.red('오류:'), error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n시스템 종료 중...'));
  process.exit(0);
});

// 실행
startSystem().catch(error => {
  console.error(chalk.red('치명적 오류:'), error);
  process.exit(1);
});
