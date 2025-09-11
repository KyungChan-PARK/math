/**
 * µWebSockets Performance Optimization
 * Target: 100 msg/sec → 850 msg/sec
 */

import uWS from 'uWebSockets.js';
import msgpack from 'msgpack-lite';

export class UWebSocketsAdapter {
  constructor(port = 8080) {
    this.port = port;
    this.app = null;
    this.connections = new Map();
    this.metrics = {
      messagesPerSecond: 0,
      totalMessages: 0,
      startTime: Date.now(),
      lastReset: Date.now()
    };
  }

  async initialize() {
    console.log(' Initializing µWebSockets...');
    
    this.app = uWS.App({
      // 최적화 설정
      compression: uWS.DISABLED, // 압축 비활성화로 속도 향상
      maxPayloadLength: 10 * 1024 * 1024, // 10MB
      idleTimeout: 60,
      maxBackpressure: 1024 * 1024
    });

    // WebSocket 핸들러 설정
    this.app.ws('/*', {
      // 연결 설정
      compression: uWS.DISABLED,
      maxPayloadLength: 10 * 1024 * 1024,
      idleTimeout: 60,
      
      // 연결 이벤트
      open: (ws) => {
        const id = this.generateId();
        ws.id = id;
        ws.subscribe('broadcast');
        
        this.connections.set(id, {
          ws,
          connected: Date.now(),
          lastPing: Date.now()
        });
        
        console.log(`✅ Client connected: ${id}`);
        ws.send(msgpack.encode({
          type: 'connected',
          id,
          timestamp: Date.now()
        }));
      },
      
      // 메시지 수신
      message: (ws, message, isBinary) => {
        this.metrics.totalMessages++;
        
        try {
          const data = isBinary 
            ? msgpack.decode(Buffer.from(message))
            : JSON.parse(Buffer.from(message).toString());
          
          // 성능 측정
          const processingStart = process.hrtime.bigint();
          
          this.handleMessage(ws, data);
          
          // 처리 시간 계산
          const processingTime = Number(process.hrtime.bigint() - processingStart) / 1000000;
          
          if (processingTime > 10) {
            console.warn(`️ Slow message processing: ${processingTime}ms`);
          }
        } catch (error) {
          console.error('❌ Message processing error:', error);
          ws.send(msgpack.encode({
            type: 'error',
            message: error.message
          }));
        }
      },
      
      // 연결 종료
      close: (ws, code, message) => {
        if (ws.id && this.connections.has(ws.id)) {
          this.connections.delete(ws.id);
          console.log(`Client disconnected: ${ws.id}`);
        }
      },
      
      // 핑/퐁
      ping: (ws, message) => {
        if (ws.id && this.connections.has(ws.id)) {
          this.connections.get(ws.id).lastPing = Date.now();
        }
      },
      
      pong: (ws, message) => {
        // µWebSockets가 자동으로 처리
      }
    });
    
    // HTTP 상태 엔드포인트
    this.app.get('/status', (res, req) => {
      res.writeStatus('200 OK');
      res.writeHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(this.getMetrics()));
    });
    
    return new Promise((resolve, reject) => {
      this.app.listen(this.port, (token) => {
        if (token) {
          console.log(`✅ µWebSockets server running on port ${this.port}`);
          console.log(` Target: 850 msg/sec (8.5x improvement)`);
          this.startMetricsTimer();
          resolve();
        } else {
          reject(new Error(`Failed to listen on port ${this.port}`));
        }
      });
    });
  }

  handleMessage(ws, data) {
    // 메시지 타입별 처리
    switch (data.type) {
      case 'nlp':
        this.handleNLPMessage(ws, data);
        break;
      case 'gesture':
        this.handleGestureMessage(ws, data);
        break;
      case 'batch':
        this.handleBatchMessage(ws, data);
        break;
      default:
        // Echo for benchmarking
        ws.send(msgpack.encode({
          type: 'echo',
          data: data.payload,
          timestamp: Date.now()
        }));
    }
  }

  handleNLPMessage(ws, data) {
    // 자연어 처리 최적화
    const response = {
      type: 'nlp_result',
      result: `Processed: ${data.payload}`,
      timestamp: Date.now()
    };
    
    // 바이너리 전송으로 속도 향상
    ws.send(msgpack.encode(response));
  }

  handleGestureMessage(ws, data) {
    // 제스처 데이터 처리
    this.app.publish('broadcast', msgpack.encode({
      type: 'gesture_broadcast',
      data: data.payload,
      from: ws.id
    }));
  }

  handleBatchMessage(ws, data) {
    // 배치 처리 최적화
    const results = [];
    for (const item of data.items) {
      results.push(this.processItem(item));
    }
    
    ws.send(msgpack.encode({
      type: 'batch_result',
      results,
      count: results.length
    }));
  }

  processItem(item) {
    // 간단한 처리 시뮬레이션
    return {
      id: item.id,
      processed: true,
      result: item.value * 2
    };
  }

  getMetrics() {
    const now = Date.now();
    const uptime = (now - this.metrics.startTime) / 1000;
    const timeSinceReset = (now - this.metrics.lastReset) / 1000;
    
    const messagesPerSecond = timeSinceReset > 0 
      ? (this.metrics.totalMessages / timeSinceReset).toFixed(2)
      : 0;
    
    return {
      implementation: 'µWebSockets',
      connections: this.connections.size,
      messagesPerSecond,
      totalMessages: this.metrics.totalMessages,
      uptime: `${uptime.toFixed(0)}s`,
      performanceMultiplier: (messagesPerSecond / 100).toFixed(2) + 'x'
    };
  }

  startMetricsTimer() {
    // 10초마다 메트릭 리셋
    setInterval(() => {
      const metrics = this.getMetrics();
      console.log(` Performance: ${metrics.messagesPerSecond} msg/sec (${metrics.performanceMultiplier})`);
      
      this.metrics.totalMessages = 0;
      this.metrics.lastReset = Date.now();
    }, 10000);
  }

  generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  broadcast(message) {
    const encoded = msgpack.encode(message);
    this.app.publish('broadcast', encoded);
  }

  close() {
    if (this.app) {
      console.log('Closing µWebSockets server...');
      // µWebSockets doesn't have a direct close method
      // Need to use process termination
    }
  }
}

export default UWebSocketsAdapter;
