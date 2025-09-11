// test-sync-system.js - 동기화 시스템 테스트
import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

console.log(chalk.blue.bold('\n 문서-코드 동기화 시스템 테스트\n'));

async function testSyncSystem() {
  const results = {
    docsChecked: 0,
    codeFilesChecked: 0,
    inconsistencies: [],
    fixed: 0,
    failed: 0
  };
  
  try {
    // 1. 주요 문서 파일 확인
    console.log(chalk.yellow('1. 문서 파일 확인...'));
    const docFiles = [
      'AI_COMPLETE_MASTER_REFERENCE.md',
      'README.md',
      'AI_STARTUP_PROTOCOL.md'
    ];
    
    for (const docFile of docFiles) {
      const docPath = path.join('..', docFile);
      try {
        const content = await fs.readFile(docPath, 'utf-8');
        results.docsChecked++;
        
        // 코드 참조 추출 (예: 파일 경로, 함수명 등)
        const codeRefs = extractCodeReferences(content);
        
        // 각 참조가 실제로 존재하는지 확인
        for (const ref of codeRefs) {
          const exists = await checkCodeReference(ref);
          if (!exists) {
            results.inconsistencies.push({
              type: 'missing_code',
              doc: docFile,
              reference: ref
            });
          }
        }
      } catch (error) {
        console.log(chalk.red(`   ✗ ${docFile}: ${error.message}`));
      }
    }
    
    // 2. 코드 파일의 문서화 확인
    console.log(chalk.yellow('\n2. 코드 파일 문서화 확인...'));
    const codeFiles = [
      'src/services/MCPIntegratedSelfImprovementEngine.js',
      'src/services/RealTimeSelfImprovementEngine.js',
      'src/services/DocumentImprovementService.js'
    ];
    
    for (const codeFile of codeFiles) {
      try {
        const content = await fs.readFile(codeFile, 'utf-8');
        results.codeFilesChecked++;
        
        // JSDoc 또는 주석 확인
        const hasDocumentation = checkDocumentation(content);
        if (!hasDocumentation) {
          results.inconsistencies.push({
            type: 'missing_docs',
            file: codeFile,
            issue: 'No documentation found'
          });
        }
      } catch (error) {
        console.log(chalk.gray(`   - ${codeFile}: 건너뜀`));
      }
    }
    
    // 3. API 엔드포인트와 문서 동기화 확인
    console.log(chalk.yellow('\n3. API 엔드포인트 동기화 확인...'));
    try {
      const response = await axios.get('http://localhost:8086/api/health');
      console.log(chalk.green('   ✓ Backend 서버 응답 정상'));
    } catch (error) {
      console.log(chalk.red('   ✗ Backend 서버 응답 없음'));
      results.inconsistencies.push({
        type: 'api_unavailable',
        endpoint: '/api/health'
      });
    }
    
    // 4. 결과 요약
    console.log(chalk.blue.bold('\n 동기화 테스트 결과:\n'));
    console.log(chalk.cyan(`   문서 확인: ${results.docsChecked}개`));
    console.log(chalk.cyan(`   코드 확인: ${results.codeFilesChecked}개`));
    console.log(chalk.red(`   불일치 발견: ${results.inconsistencies.length}개`));
    
    if (results.inconsistencies.length > 0) {
      console.log(chalk.yellow('\n 발견된 불일치:'));
      results.inconsistencies.forEach((issue, i) => {
        console.log(chalk.gray(`   ${i+1}. [${issue.type}] ${issue.doc || issue.file || issue.endpoint}`));
      });
    }
    
    // 5. 자동 수정 제안
    if (results.inconsistencies.length > 0) {
      console.log(chalk.yellow('\n 자동 수정 제안:'));
      console.log(chalk.gray('   1. 누락된 문서 자동 생성'));
      console.log(chalk.gray('   2. 오래된 참조 업데이트'));
      console.log(chalk.gray('   3. API 문서 재생성'));
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ 테스트 실패:'), error);
  }
  
  return results;
}

function extractCodeReferences(content) {
  const refs = [];
  // 파일 경로 패턴 매칭
  const filePattern = /(?:src\/|backend\/|frontend\/)[\w\/]+\.\w+/g;
  const matches = content.match(filePattern) || [];
  return [...new Set(matches)];
}

async function checkCodeReference(ref) {
  try {
    await fs.access(ref);
    return true;
  } catch {
    return false;
  }
}

function checkDocumentation(content) {
  // JSDoc 또는 주석 확인
  return content.includes('/**') || content.includes('//');
}

// 실행
testSyncSystem()
  .then(results => {
    if (results.inconsistencies.length === 0) {
      console.log(chalk.green.bold('\n✅ 모든 문서와 코드가 동기화되어 있습니다!\n'));
    } else {
      console.log(chalk.yellow.bold('\n️ 동기화 필요한 항목이 있습니다.\n'));
    }
  })
  .catch(error => {
    console.error(chalk.red('\n❌ 오류:'), error);
  });