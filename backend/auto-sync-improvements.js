// auto-sync-improvements.js - 자동 개선 스크립트
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.blue.bold('\n 자동 동기화 개선 시작...\n'));

async function autoSyncImprovements() {
  const improvements = [];
  
  try {
    // 1. Health 엔드포인트 추가
    console.log(chalk.yellow('1. Health 엔드포인트 확인 및 추가...'));
    
    const serverPath = 'src/server.js';
    const serverContent = await fs.readFile(serverPath, 'utf-8');
    
    if (!serverContent.includes('/api/health')) {
      console.log(chalk.gray('   → Health 엔드포인트 추가 중...'));
      
      const healthEndpoint = `
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoClient ? 'connected' : 'disconnected',
      neo4j: neo4jDriver ? 'connected' : 'disconnected',
      selfImprovement: selfImprovementEngine ? 'active' : 'inactive'
    }
  });
});
`;
      
      // app.listen 전에 추가
      const modifiedContent = serverContent.replace(
        'app.listen(PORT',
        healthEndpoint + '\napp.listen(PORT'
      );
      
      await fs.writeFile(serverPath, modifiedContent);
      console.log(chalk.green('   ✓ Health 엔드포인트 추가 완료'));
      improvements.push('Added /api/health endpoint');
    } else {
      console.log(chalk.green('   ✓ Health 엔드포인트 이미 존재'));
    }
    
    // 2. 문서 업데이트
    console.log(chalk.yellow('\n2. API 문서 업데이트...'));
    
    const apiDocPath = 'API.md';
    const apiDoc = `# API Documentation

## Health Check
- **GET** \`/api/health\`
  - Returns server health status

## Self-Improvement Endpoints
- **POST** \`/api/self-improvement/handle\`
  - Handle detected issues automatically
  
- **GET** \`/api/self-improvement/status\`
  - Get current self-improvement status
  
- **GET** \`/api/self-improvement/metrics\`
  - Get self-improvement metrics
  
- **GET** \`/api/self-improvement/history\`
  - Get self-improvement history

## Document Improvement
- **POST** \`/api/docs/analyze\`
  - Analyze document for improvements
  
- **GET** \`/api/docs/improvement/status\`
  - Get document improvement status

## WebSocket
- **WS** \`ws://localhost:8086/ws\`
  - Real-time interaction logging

---
*Last updated: ${new Date().toISOString()}*
`;
    
    await fs.writeFile(apiDocPath, apiDoc);
    console.log(chalk.green('   ✓ API 문서 업데이트 완료'));
    improvements.push('Updated API documentation');
    
    // 3. 마스터 문서에 API 섹션 확인
    console.log(chalk.yellow('\n3. 마스터 문서 동기화 확인...'));
    
    const masterDocPath = '../AI_COMPLETE_MASTER_REFERENCE.md';
    const masterContent = await fs.readFile(masterDocPath, 'utf-8');
    
    if (!masterContent.includes('/api/health')) {
      console.log(chalk.yellow('    마스터 문서에 API 섹션 업데이트 필요'));
      // 여기서는 수동 업데이트 권장
      improvements.push('Master document needs API section update');
    } else {
      console.log(chalk.green('   ✓ 마스터 문서 동기화 완료'));
    }
    
    // 4. 결과 요약
    console.log(chalk.blue.bold('\n 개선 결과:\n'));
    if (improvements.length > 0) {
      improvements.forEach((imp, i) => {
        console.log(chalk.green(`   ${i+1}. ${imp}`));
      });
    } else {
      console.log(chalk.green('   모든 항목이 이미 동기화되어 있습니다!'));
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ 개선 실패:'), error);
  }
}

// 실행
autoSyncImprovements()
  .then(() => {
    console.log(chalk.green.bold('\n✅ 자동 동기화 개선 완료!\n'));
    process.exit(0);
  })
  .catch(error => {
    console.error(chalk.red('\n❌ 오류:'), error);
    process.exit(1);
  });