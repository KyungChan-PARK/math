// test-websocket-connection.js - WebSocket 연결 테스트
import WebSocket from 'ws';
import chalk from 'chalk';

console.log(chalk.blue.bold('\n WebSocket 연결 테스트\n'));

const ws = new WebSocket('ws://localhost:8086/ws');

ws.on('open', () => {
  console.log(chalk.green('✅ WebSocket 연결 성공'));
  
  // 테스트 메시지 전송
  const testMessage = {
    type: 'interaction',
    sessionId: 'test-session',
    data: {
      gestureType: 'tap',
      position: { x: 100, y: 100 },
      timestamp: Date.now()
    }
  };
  
  console.log(chalk.yellow(' 테스트 메시지 전송:', JSON.stringify(testMessage, null, 2)));
  ws.send(JSON.stringify(testMessage));
});

ws.on('message', (data) => {
  console.log(chalk.green(' 응답 받음:'), data.toString());
  
  // 연결 종료
  setTimeout(() => {
    ws.close();
    console.log(chalk.blue('\n✅ 테스트 완료!\n'));
    process.exit(0);
  }, 1000);
});

ws.on('error', (error) => {
  console.error(chalk.red('❌ WebSocket 오류:'), error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log(chalk.gray('WebSocket 연결 종료'));
});

// 10초 타임아웃
setTimeout(() => {
  console.log(chalk.red('⏱️ 타임아웃 - 테스트 종료'));
  ws.close();
  process.exit(1);
}, 10000);
