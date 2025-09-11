// sync-docs-code.js - 문서와 코드 동기화 스크립트
import RealTimeSelfImprovementEngine from './src/services/RealTimeSelfImprovementEngine.js';
import { logger } from './src/utils/logger.js';
import chalk from 'chalk';

console.log(chalk.blue.bold('\n 문서-코드 동기화 시작...\n'));

async function syncDocsAndCode() {
  try {
    // 1. 자가개선 엔진 초기화
    console.log(chalk.yellow('1. 자가개선 엔진 초기화...'));
    const engine = new RealTimeSelfImprovementEngine();
    await engine.initialize();
    
    // 2. 불일치 감지
    console.log(chalk.yellow('\n2. 불일치 감지 중...'));
    const inconsistencies = await engine.detectInconsistencies();
    console.log(chalk.red(`   발견된 불일치: ${inconsistencies.length}개`));
    
    if (inconsistencies.length === 0) {
      console.log(chalk.green('✅ 모든 문서와 코드가 동기화되어 있습니다!'));
      return;
    }
    
    // 3. 각 불일치 항목 처리
    console.log(chalk.yellow('\n3. 불일치 항목 처리 중...\n'));
    
    for (let i = 0; i < inconsistencies.length; i++) {
      const issue = inconsistencies[i];
      console.log(chalk.cyan(`[${i+1}/${inconsistencies.length}] ${issue.type}: ${issue.description}`));
      
      try {
        // 4. 자동 수정 시도
        if (issue.autoFixable) {
          console.log(chalk.gray('   → 자동 수정 시도...'));
          await engine.autoFix(issue);
          console.log(chalk.green('   ✓ 자동 수정 완료'));
        } else {
          console.log(chalk.yellow('    수동 수정 필요'));
          console.log(chalk.gray(`     제안: ${issue.suggestion}`));
        }
      } catch (error) {
        console.log(chalk.red(`   ✗ 수정 실패: ${error.message}`));
      }
    }
    
    // 5. 동기화 결과 요약
    console.log(chalk.blue.bold('\n 동기화 결과 요약:\n'));
    const summary = await engine.getSyncSummary();
    console.log(chalk.green(`   ✓ 성공: ${summary.fixed}개`));
    console.log(chalk.yellow(`    수동 필요: ${summary.manual}개`));
    console.log(chalk.red(`   ✗ 실패: ${summary.failed}개`));
    
    // 6. 문서 업데이트
    if (summary.fixed > 0) {
      console.log(chalk.yellow('\n4. 문서 업데이트 중...'));
      await engine.updateDocumentation();
      console.log(chalk.green('   ✓ 문서 업데이트 완료'));
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ 동기화 실패:'), error);
    process.exit(1);
  }
}

// 실행
syncDocsAndCode()
  .then(() => {
    console.log(chalk.green.bold('\n✅ 동기화 완료!\n'));
    process.exit(0);
  })
  .catch(error => {
    console.error(chalk.red('\n❌ 오류:'), error);
    process.exit(1);
  });