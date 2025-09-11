// test-integration.js - 통합 테스트
import axios from 'axios';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_URL = 'http://localhost:8086';
const WS_URL = 'ws://localhost:8086/ws';

// 색상 코드
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// 테스트 결과
let passedTests = 0;
let failedTests = 0;

// 테스트 헬퍼 함수
function testCase(name, fn) {
  console.log(`\n${colors.yellow}테스트: ${name}${colors.reset}`);
  return fn()
    .then(() => {
      console.log(`${colors.green}✓ 성공${colors.reset}`);
      passedTests++;
    })
    .catch((error) => {
      console.log(`${colors.red}✗ 실패: ${error.message}${colors.reset}`);
      failedTests++;
    });
}

// 1. Health Check 테스트
async function testHealthCheck() {
  const response = await axios.get(`${BACKEND_URL}/health`);
  if (response.data.status !== 'healthy') {
    throw new Error('Health check failed');
  }
  console.log('서비스 상태:', response.data.services);
}

// 2. Session 생성 테스트
async function testCreateSession() {
  const response = await axios.post(`${BACKEND_URL}/api/session/start`, {
    userId: 'test_user_' + uuidv4(),
    metadata: {
      device: 'Samsung Galaxy Book 4 Pro 360',
      test: true
    }
  });
  
  if (!response.data.sessionId) {
    throw new Error('Session ID not returned');
  }
  
  console.log('세션 생성됨:', response.data.sessionId);
  return response.data.sessionId;
}

// 3. 상호작용 로그 테스트
async function testInteractionLog(sessionId) {
  const interactionLog = {
    log_id: uuidv4(),
    session_id: sessionId,
    timestamp: Date.now(),
    user_id: 'test_user',
    event_type: 'USER_GESTURE',
    user_action: {
      gesture_type: 'DRAG',
      parameters: {
        x: 100,
        y: 200,
        objectId: 'obj_123'
      }
    },
    scene_state_before: {
      objects: [
        {
          id: 'obj_123',
          type: 'cube',
          position: { x: 0, y: 1, z: 0 }
        }
      ]
    },
    scene_state_after: {
      objects: [
        {
          id: 'obj_123',
          type: 'cube',
          position: { x: 2, y: 1, z: 0 }
        }
      ]
    }
  };

  const response = await axios.post(`${BACKEND_URL}/api/interactions`, [interactionLog]);
  
  if (!response.data.success) {
    throw new Error('Failed to log interaction');
  }
  
  console.log('상호작용 로그 처리됨:', response.data.processed, '개');
}

// 4. AI Agent Action 테스트
async function testAIAgentAction() {
  const sceneState = {
    objects: [
      {
        id: 'obj_456',
        type: 'sphere',
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      }
    ],
    camera: {
      position: { x: 5, y: 5, z: 5 },
      rotation: { x: 0, y: 0, z: 0 }
    }
  };

  const response = await axios.post(`${BACKEND_URL}/api/agent/action`, {
    sceneState,
    context: {
      mode: 'teaching',
      topic: 'geometry'
    }
  });
  
  if (!response.data.action) {
    throw new Error('No action returned from AI agent');
  }
  
  console.log('AI 에이전트 액션:', response.data.action);
}

// 5. WebSocket 연결 테스트
async function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timeout'));
    }, 5000);

    ws.on('open', () => {
      console.log('WebSocket 연결 성공');
      
      // 테스트 메시지 전송
      ws.send(JSON.stringify({
        type: 'SESSION_START',
        sessionId: uuidv4(),
        userId: 'test_user'
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('WebSocket 메시지 수신:', message.type);
      
      if (message.type === 'CONNECTED' || message.type === 'SESSION_STARTED') {
        clearTimeout(timeout);
        ws.close();
        resolve();
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// 6. Training Data 조회 테스트
async function testGetTrainingData(sessionId) {
  const response = await axios.get(`${BACKEND_URL}/api/training/data`, {
    params: {
      sessionId,
      limit: 10
    }
  });
  
  if (!response.data.success) {
    throw new Error('Failed to get training data');
  }
  
  console.log('트레이닝 데이터 조회:', response.data.count, '개');
}

// 7. Scene State 저장 테스트
async function testSaveSceneState(sessionId) {
  const sceneState = {
    objects: [
      {
        id: uuidv4(),
        type: 'cylinder',
        position: { x: 3, y: 1, z: -2 },
        rotation: { x: 0, y: Math.PI / 4, z: 0 },
        scale: { x: 1, y: 2, z: 1 },
        material: {
          color: '#ff00ff',
          opacity: 0.8
        }
      }
    ],
    camera: {
      position: { x: 7, y: 7, z: 7 },
      rotation: { x: -Math.PI / 6, y: 0, z: 0 }
    },
    timestamp: Date.now()
  };

  const response = await axios.post(`${BACKEND_URL}/api/scene/state`, {
    sessionId,
    state: sceneState
  });
  
  if (!response.data.success) {
    throw new Error('Failed to save scene state');
  }
  
  console.log('씬 상태 저장 완료');
}

// 8. Session 종료 테스트
async function testEndSession(sessionId) {
  const response = await axios.post(`${BACKEND_URL}/api/session/end`, {
    sessionId
  });
  
  if (!response.data.success) {
    throw new Error('Failed to end session');
  }
  
  console.log('세션 종료됨:', sessionId);
}

// 메인 테스트 실행
async function runTests() {
  console.log('========================================');
  console.log('  지능형 수학 교육 시스템 통합 테스트');
  console.log('========================================');
  
  try {
    // 서버가 준비될 때까지 대기
    console.log('\n서버 연결 대기 중...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 테스트 실행
    await testCase('Health Check', testHealthCheck);
    
    const sessionId = await testCase('Session 생성', () => testCreateSession());
    
    if (sessionId) {
      await testCase('상호작용 로그', () => testInteractionLog(sessionId));
      await testCase('AI Agent Action', testAIAgentAction);
      await testCase('WebSocket 연결', testWebSocketConnection);
      await testCase('씬 상태 저장', () => testSaveSceneState(sessionId));
      await testCase('Training Data 조회', () => testGetTrainingData(sessionId));
      await testCase('Session 종료', () => testEndSession(sessionId));
    }
    
  } catch (error) {
    console.error(`${colors.red}테스트 중 오류 발생:${colors.reset}`, error.message);
  }
  
  // 테스트 결과 요약
  console.log('\n========================================');
  console.log('  테스트 결과');
  console.log('========================================');
  console.log(`${colors.green}성공: ${passedTests}개${colors.reset}`);
  console.log(`${colors.red}실패: ${failedTests}개${colors.reset}`);
  
  const successRate = (passedTests / (passedTests + failedTests)) * 100;
  console.log(`성공률: ${successRate.toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log(`\n${colors.green}✓ 모든 테스트가 성공했습니다!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✗ 일부 테스트가 실패했습니다.${colors.reset}`);
  }
}

// 테스트 실행
runTests().catch(console.error);
