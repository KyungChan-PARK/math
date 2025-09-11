/**
 * µWebSockets Performance Benchmark
 * 목표: 100 → 850 msg/sec 달성 확인
 */

import WebSocket from 'ws';
import msgpack from 'msgpack-lite';

class WebSocketBenchmark {
  constructor(url = 'ws://localhost:8080') {
    this.url = url;
    this.clients = [];
    this.metrics = {
      sent: 0,
      received: 0,
      errors: 0,
      startTime: null,
      endTime: null
    };
  }

  async runBenchmark(numClients = 10, messagesPerClient = 1000) {
    console.log(' Starting µWebSockets Benchmark');
    console.log(`   Clients: ${numClients}`);
    console.log(`   Messages per client: ${messagesPerClient}`);
    console.log(`   Total messages: ${numClients * messagesPerClient}\n`);

    this.metrics.startTime = Date.now();

    // 클라이언트 생성
    await this.createClients(numClients);
    
    // 메시지 전송
    await this.sendMessages(messagesPerClient);
    
    // 결과 대기
    await this.waitForCompletion();
    
    this.metrics.endTime = Date.now();
    
    // 결과 출력
    this.printResults();
  }

  createClients(num) {
    return Promise.all(
      Array(num).fill(0).map(() => this.createClient())
    );
  }

  createClient() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      
      ws.on('open', () => {
        this.clients.push(ws);
        resolve(ws);
      });
      
      ws.on('message', (data) => {
        this.metrics.received++;
      });
      
      ws.on('error', (err) => {
        this.metrics.errors++;
        reject(err);
      });
    });
  }

  async sendMessages(messagesPerClient) {
    const promises = [];
    
    for (const client of this.clients) {
      for (let i = 0; i < messagesPerClient; i++) {
        const message = msgpack.encode({
          type: 'benchmark',
          payload: {
            id: i,
            timestamp: Date.now(),
            data: 'x'.repeat(100) // 100 bytes payload
          }
        });
        
        promises.push(
          new Promise((resolve) => {
            client.send(message, (err) => {
              if (err) {
                this.metrics.errors++;
              } else {
                this.metrics.sent++;
              }
              resolve();
            });
          })
        );
      }
    }
    
    await Promise.all(promises);
  }

  waitForCompletion() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.metrics.received >= this.metrics.sent * 0.95) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 30000);
    });
  }

  printResults() {
    const duration = (this.metrics.endTime - this.metrics.startTime) / 1000;
    const messagesPerSecond = this.metrics.sent / duration;
    const throughput = (this.metrics.sent * 100) / duration / 1024; // KB/s
    
    console.log('\n Benchmark Results:');
    console.log('════════════════════════════════');
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`Messages sent: ${this.metrics.sent}`);
    console.log(`Messages received: ${this.metrics.received}`);
    console.log(`Errors: ${this.metrics.errors}`);
    console.log(`\nPerformance:`);
    console.log(`  Messages/sec: ${messagesPerSecond.toFixed(2)}`);
    console.log(`  Throughput: ${throughput.toFixed(2)} KB/s`);
    console.log(`  Latency: < ${(1000 / messagesPerSecond).toFixed(2)}ms avg`);
    
    // 성능 목표 확인
    console.log('\n Performance Targets:');
    if (messagesPerSecond >= 850) {
      console.log('  ✅ µWebSockets target achieved! (850 msg/sec)');
    } else if (messagesPerSecond >= 400) {
      console.log('  ✅ 4x optimization achieved! (400 msg/sec)');
    } else {
      console.log('  ️  Performance below target');
    }
    
    const multiplier = (messagesPerSecond / 100).toFixed(2);
    console.log(`   Performance multiplier: ${multiplier}x`);
    
    // 클라이언트 정리
    this.cleanup();
  }

  cleanup() {
    for (const client of this.clients) {
      client.close();
    }
    this.clients = [];
  }
}

// 실행
async function main() {
  const benchmark = new WebSocketBenchmark();
  
  // 점진적 테스트
  console.log('Test 1: Light load\n');
  await benchmark.runBenchmark(5, 100);
  
  console.log('\n\nTest 2: Medium load\n');
  await benchmark.runBenchmark(10, 500);
  
  console.log('\n\nTest 3: Heavy load\n');
  await benchmark.runBenchmark(20, 1000);
}

// 서버가 실행 중인지 확인 후 벤치마크 실행
const testConnection = new WebSocket('ws://localhost:8080');

testConnection.on('open', () => {
  testConnection.close();
  main().catch(console.error);
});

testConnection.on('error', () => {
  console.error('❌ WebSocket server not running on port 8080');
  console.log('Please start the server first: npm start');
  process.exit(1);
});
