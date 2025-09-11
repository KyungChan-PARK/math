/**
 * Palantir 스타일 통합 테스트
 */

import OrchestrationEngine from '../orchestration/orchestration-engine.js';

async function testPalantirIntegration() {
  console.log(' Testing Palantir-style Integration...\n');
  
  const orchestrator = new OrchestrationEngine();
  
  // 초기화 테스트
  console.log('1. Initializing Orchestration Engine...');
  const initialized = await orchestrator.initialize();
  
  if (!initialized) {
    console.error('Failed to initialize. Check Neo4j connection.');
    process.exit(1);
  }
  
  // 추천사항 확인
  console.log('\n2. Getting recommendations...');
  const recommendations = await orchestrator.getRecommendations();
  console.log('Recommendations:', recommendations);
  
  // 컴포지션 생성 테스트
  console.log('\n3. Testing CREATE_COMPOSITION action...');
  try {
    const comp = await orchestrator.deployAction('CREATE_COMPOSITION', {
      name: 'Test Composition',
      width: 1920,
      height: 1080,
      frameRate: 30,
      duration: 10
    });
    console.log('✅ Composition created:', comp);
  } catch (error) {
    console.error('❌ Action failed:', error.message);
  }
  
  // 상태 확인
  console.log('\n4. Current state:', orchestrator.state);
  
  // 종료
  await orchestrator.shutdown();
  console.log('\n✅ Test complete');
}

// 실행
testPalantirIntegration().catch(console.error);
