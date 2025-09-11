import { App } from 'uWebSockets.js';

// µWebSockets 마이그레이션 테스트
const app = App();

app.ws('/*', {
    compression: 0,
    maxPayloadLength: 16 * 1024,
    
    open: (ws) => {
        console.log('✅ 클라이언트 연결됨');
        ws.send(JSON.stringify({
            type: 'CONNECTED',
            message: 'µWebSockets v20.44.0 작동 중',
            performance: '850 msg/sec 목표'
        }));
    },
    
    message: (ws, message, isBinary) => {
        const data = JSON.parse(Buffer.from(message).toString());
        console.log(' 받은 메시지:', data);
        
        // Echo back with latency info
        ws.send(JSON.stringify({
            type: 'ECHO',
            original: data,
            timestamp: Date.now()
        }));
    },
    
    close: (ws) => {
        console.log('❌ 클라이언트 연결 해제');
    }
});

app.listen(8081, (token) => {
    if (token) {
        console.log(' µWebSockets 서버 포트 8081에서 실행 중');
        console.log(' 타겟 성능: 850 msg/sec');
    } else {
        console.log('❌ 서버 시작 실패');
    }
});
