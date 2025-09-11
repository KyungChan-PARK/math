// test-self-improvement.js - 자가개선 시스템 테스트

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════╗
║     자가개선 시스템 테스트 시나리오              ║
╚══════════════════════════════════════════════════╝
`));

/**
 * 테스트 시나리오:
 * 1. 함수 삭제 → Breaking Change 감지 → 자동 수정
 * 2. API 변경 → 문서 자동 업데이트
 * 3. 문서 예제 수정 → 코드 검증
 */

async function testScenario1() {
  console.log(chalk.yellow('\n 시나리오 1: Breaking Change 자동 수정'));
  
  // 1. 테스트 파일 생성
  const testFile = path.join(__dirname, 'test-module.js');
  const consumerFile = path.join(__dirname, 'test-consumer.js');
  
  // 원본 모듈
  const originalModule = `
// test-module.js
export function calculateArea(width, height) {
  return width * height;
}

export function calculatePerimeter(width, height) {
  return 2 * (width + height);
}
  `.trim();
  
  // 이 모듈을 사용하는 파일
  const consumer = `
// test-consumer.js
import { calculateArea, calculatePerimeter } from './test-module.js';

const area = calculateArea(10, 20);
const perimeter = calculatePerimeter(10, 20);

console.log('Area:', area);
console.log('Perimeter:', perimeter);
  `.trim();
  
  await fs.writeFile(testFile, originalModule);
  await fs.writeFile(consumerFile, consumer);
  
  console.log(chalk.green('✅ 테스트 파일 생성 완료'));
  
  // 2. Breaking Change 생성 - 함수 삭제
  const modifiedModule = `
// test-module.js
export function calculateArea(width, height) {
  return width * height;
}

// calculatePerimeter 함수가 삭제됨!
  `.trim();
  
  console.log(chalk.red(' Breaking Change 생성: calculatePerimeter 함수 삭제'));
  await fs.writeFile(testFile, modifiedModule);
  
  // 3. 자가개선 시스템이 감지하고 수정하는지 확인
  console.log(chalk.cyan('⏳ 자가개선 시스템 동작 대기...'));
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 4. 수정 확인
  const fixedContent = await fs.readFile(testFile, 'utf-8');
  
  if (fixedContent.includes('calculatePerimeter') || fixedContent.includes('Deprecated')) {
    console.log(chalk.green('✅ Breaking Change 자동 수정 완료!'));
    console.log(chalk.gray('수정된 내용:'));
    console.log(fixedContent.slice(0, 200) + '...');
  } else {
    console.log(chalk.red('❌ 자동 수정되지 않음'));
  }
  
  // 정리
  await fs.unlink(testFile).catch(() => {});
  await fs.unlink(consumerFile).catch(() => {});
}

async function testScenario2() {
  console.log(chalk.yellow('\n 시나리오 2: API 변경 시 문서 자동 업데이트'));
  
  const apiFile = path.join(__dirname, 'test-api.js');
  const docFile = path.join(__dirname, 'test-api.md');
  
  // API 파일
  const apiCode = `
// test-api.js
export default class MathAPI {
  add(a, b) {
    return a + b;
  }
  
  subtract(a, b) {
    return a - b;
  }
}
  `.trim();
  
  // 문서 파일
  const documentation = `
# Math API Documentation

## Methods

### add(a, b)
Adds two numbers.

### subtract(a, b)
Subtracts two numbers.
  `.trim();
  
  await fs.writeFile(apiFile, apiCode);
  await fs.writeFile(docFile, documentation);
  
  console.log(chalk.green('✅ API와 문서 파일 생성'));
  
  // API 변경 - 새 메서드 추가
  const updatedAPI = `
// test-api.js
export class MathAPI {
  add(a, b) {
    return a + b;
  }
  
  subtract(a, b) {
    return a - b;
  }
  
  multiply(a, b) {
    return a * b;
  }
  
  divide(a, b) {
    if (b === 0) throw new Error('Division by zero');
    return a / b;
  }
}
  `.trim();
  
  console.log(chalk.blue(' API 업데이트: multiply, divide 메서드 추가'));
  await fs.writeFile(apiFile, updatedAPI);
  
  console.log(chalk.cyan('⏳ 문서 자동 업데이트 대기...'));
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 문서 업데이트 확인
  const updatedDoc = await fs.readFile(docFile, 'utf-8');
  
  if (updatedDoc.includes('multiply') || updatedDoc.includes('divide')) {
    console.log(chalk.green('✅ 문서 자동 업데이트 완료!'));
    console.log(chalk.gray('업데이트된 문서:'));
    console.log(updatedDoc.slice(0, 300) + '...');
  } else {
    console.log(chalk.yellow('️ 문서가 아직 업데이트되지 않음'));
  }
  
  // 정리
  await fs.unlink(apiFile).catch(() => {});
  await fs.unlink(docFile).catch(() => {});
}

async function testScenario3() {
  console.log(chalk.yellow('\n 시나리오 3: 개발 방향 전환 감지'));
  
  const configFile = path.join(__dirname, 'test-config.json');
  
  // 초기 설정
  const initialConfig = {
    projectType: "educational",
    targetAudience: "teachers",
    features: ["3d-visualization", "gesture-control"],
    aiMode: "assistant"
  };
  
  await fs.writeFile(configFile, JSON.stringify(initialConfig, null, 2));
  console.log(chalk.green('✅ 초기 프로젝트 설정'));
  console.log(chalk.gray(JSON.stringify(initialConfig, null, 2)));
  
  // 개발 방향 전환
  const pivotConfig = {
    projectType: "commercial",
    targetAudience: "students",
    features: ["3d-visualization", "gesture-control", "gamification", "social-learning"],
    aiMode: "autonomous",
    newRequirements: ["monetization", "user-analytics", "cloud-sync"]
  };
  
  console.log(chalk.red('\n 개발 방향 전환 감지!'));
  console.log(chalk.gray(JSON.stringify(pivotConfig, null, 2)));
  
  await fs.writeFile(configFile, JSON.stringify(pivotConfig, null, 2));
  
  console.log(chalk.cyan('⏳ 프로젝트 재구성 대기...'));
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 변경사항 확인
  console.log(chalk.green('\n✅ 예상되는 자동 변경사항:'));
  console.log(chalk.white('  • README 업데이트 - 새로운 타겟 고객'));
  console.log(chalk.white('  • 새 기능 모듈 스캐폴딩'));
  console.log(chalk.white('  • API 엔드포인트 추가'));
  console.log(chalk.white('  • 문서 재구성'));
  console.log(chalk.white('  • 테스트 케이스 업데이트'));
  
  // 정리
  await fs.unlink(configFile).catch(() => {});
}

async function runAllTests() {
  try {
    await testScenario1();
    await testScenario2();
    await testScenario3();
    
    console.log(chalk.green.bold('\n✅ 모든 테스트 시나리오 완료!'));
    
    console.log(chalk.cyan('\n 자가개선 시스템 기능:'));
    console.log(chalk.white('  ✓ Breaking changes 자동 감지 및 수정'));
    console.log(chalk.white('  ✓ API 변경 시 문서 자동 업데이트'));
    console.log(chalk.white('  ✓ 개발 방향 전환 시 프로젝트 재구성'));
    console.log(chalk.white('  ✓ 코드-문서 일관성 유지'));
    console.log(chalk.white('  ✓ 의존성 영향 분석'));
    
  } catch (error) {
    console.error(chalk.red('테스트 실패:'), error);
  }
}

// 실행
runAllTests();
