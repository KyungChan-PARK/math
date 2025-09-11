/**
 * PALANTIR v3.1 성능 벤치마크
 * 시스템 응답 시간, 처리량, 지연시간 측정
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// 벤치마크 대상
const TARGETS = {
    palantirAPI: 'https://palantir-ai-api-521122377191.us-central1.run.app',
    mathServer: 'http://localhost:8100'
};

// 벤치마크 결과
const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {}
};

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// 통계 계산
function calculateStats(measurements) {
    const sorted = measurements.sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / sorted.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    return {
        mean: mean.toFixed(2),
        median: median.toFixed(2),
        p95: p95.toFixed(2),
        p99: p99.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2)
    };
}

// 1. API 응답 시간 테스트
async function benchmarkAPIResponse() {
    console.log(`\n${colors.blue}=== API Response Time Benchmark ===${colors.reset}`);
    
    const endpoints = [
        { name: 'Health Check', url: '/health' },
        { name: 'Config', url: '/api/config' },
        { name: 'Agents', url: '/api/agents' },
        { name: 'Status', url: '/api/status' }
    ];
    
    results.tests.apiResponse = {};
    
    for (const endpoint of endpoints) {
        const measurements = [];
        const iterations = 20;
        
        console.log(`Testing ${endpoint.name}...`);
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            try {
                await axios.get(`${TARGETS.palantirAPI}${endpoint.url}`);
                const duration = performance.now() - start;
                measurements.push(duration);
            } catch (error) {
                console.log(`${colors.red}  Error: ${error.message}${colors.reset}`);
            }
        }
        
        if (measurements.length > 0) {
            const stats = calculateStats(measurements);
            results.tests.apiResponse[endpoint.name] = stats;
            
            console.log(`${colors.green}  Mean: ${stats.mean}ms${colors.reset}`);
            console.log(`  Median: ${stats.median}ms`);
            console.log(`  P95: ${stats.p95}ms`);
            console.log(`  P99: ${stats.p99}ms`);
        }
    }
}

// 2. 동시 요청 처리량 테스트
async function benchmarkConcurrency() {
    console.log(`\n${colors.blue}=== Concurrency Benchmark ===${colors.reset}`);
    
    const concurrencyLevels = [1, 5, 10, 20, 50];
    results.tests.concurrency = {};
    
    for (const level of concurrencyLevels) {
        console.log(`Testing with ${level} concurrent requests...`);
        
        const start = performance.now();
        const promises = [];
        
        for (let i = 0; i < level; i++) {
            promises.push(
                axios.get(`${TARGETS.palantirAPI}/health`)
                    .catch(err => ({ error: err.message }))
            );
        }
        
        const responses = await Promise.all(promises);
        const duration = performance.now() - start;
        
        const successful = responses.filter(r => !r.error).length;
        const failed = responses.filter(r => r.error).length;
        const throughput = (successful / (duration / 1000)).toFixed(2);
        
        results.tests.concurrency[`${level}_concurrent`] = {
            totalTime: duration.toFixed(2),
            successful,
            failed,
            throughput: `${throughput} req/s`
        };
        
        console.log(`${colors.green}  Time: ${duration.toFixed(2)}ms${colors.reset}`);
        console.log(`  Success: ${successful}/${level}`);
        console.log(`  Throughput: ${throughput} req/s`);
    }
}

// 3. 페이로드 크기별 성능 테스트
async function benchmarkPayloadSize() {
    console.log(`\n${colors.blue}=== Payload Size Benchmark ===${colors.reset}`);
    
    // Math 서버가 실행 중인지 확인
    try {
        await axios.get(`${TARGETS.mathServer}/`);
    } catch (error) {
        console.log(`${colors.yellow}  Math server not running, skipping payload tests${colors.reset}`);
        return;
    }
    
    const payloadSizes = [
        { name: '1KB', size: 1024 },
        { name: '10KB', size: 10240 },
        { name: '100KB', size: 102400 }
    ];
    
    results.tests.payload = {};
    
    for (const payload of payloadSizes) {
        const data = 'x'.repeat(payload.size);
        const measurements = [];
        
        console.log(`Testing ${payload.name} payload...`);
        
        for (let i = 0; i < 10; i++) {
            const start = performance.now();
            try {
                await axios.post(`${TARGETS.mathServer}/api/test`, { data });
                const duration = performance.now() - start;
                measurements.push(duration);
            } catch (error) {
                // Expected to fail, just measuring time
                const duration = performance.now() - start;
                measurements.push(duration);
            }
        }
        
        const stats = calculateStats(measurements);
        results.tests.payload[payload.name] = stats;
        
        console.log(`${colors.green}  Mean: ${stats.mean}ms${colors.reset}`);
        console.log(`  P95: ${stats.p95}ms`);
    }
}

// 4. 지연시간 분포 테스트
async function benchmarkLatencyDistribution() {
    console.log(`\n${colors.blue}=== Latency Distribution ===${colors.reset}`);
    
    const measurements = [];
    const iterations = 100;
    
    console.log(`Running ${iterations} requests...`);
    
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        try {
            await axios.get(`${TARGETS.palantirAPI}/health`);
            const duration = performance.now() - start;
            measurements.push(duration);
        } catch (error) {
            // Skip failed requests
        }
        
        // Progress indicator
        if ((i + 1) % 20 === 0) {
            process.stdout.write('.');
        }
    }
    console.log();
    
    if (measurements.length > 0) {
        const stats = calculateStats(measurements);
        results.tests.latencyDistribution = stats;
        
        // 히스토그램 생성
        const buckets = [0, 50, 100, 200, 500, 1000, 2000, 5000];
        const histogram = {};
        
        buckets.forEach((bucket, i) => {
            const nextBucket = buckets[i + 1] || Infinity;
            const count = measurements.filter(m => m >= bucket && m < nextBucket).length;
            const percentage = ((count / measurements.length) * 100).toFixed(1);
            
            if (count > 0) {
                const label = nextBucket === Infinity ? `>${bucket}ms` : `${bucket}-${nextBucket}ms`;
                histogram[label] = `${count} (${percentage}%)`;
            }
        });
        
        console.log(`${colors.green}Latency Distribution:${colors.reset}`);
        console.log(`  Mean: ${stats.mean}ms`);
        console.log(`  Median: ${stats.median}ms`);
        console.log(`  P95: ${stats.p95}ms`);
        console.log(`  P99: ${stats.p99}ms`);
        
        console.log(`\n${colors.cyan}Histogram:${colors.reset}`);
        Object.entries(histogram).forEach(([range, count]) => {
            console.log(`  ${range}: ${count}`);
        });
    }
}

// 5. 안정성 테스트
async function benchmarkStability() {
    console.log(`\n${colors.blue}=== Stability Test (60 seconds) ===${colors.reset}`);
    
    const duration = 60000; // 60초
    const interval = 1000; // 1초마다
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;
    const responseTimes = [];
    
    console.log('Running continuous requests for 60 seconds...');
    
    while (Date.now() - startTime < duration) {
        const requestStart = performance.now();
        
        try {
            await axios.get(`${TARGETS.palantirAPI}/health`);
            successCount++;
            const responseTime = performance.now() - requestStart;
            responseTimes.push(responseTime);
        } catch (error) {
            errorCount++;
        }
        
        // Progress indicator
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed % 10 === 0) {
            process.stdout.write(`\r  ${elapsed}s elapsed...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    console.log('\n');
    
    const availability = ((successCount / (successCount + errorCount)) * 100).toFixed(2);
    const stats = responseTimes.length > 0 ? calculateStats(responseTimes) : null;
    
    results.tests.stability = {
        duration: '60s',
        totalRequests: successCount + errorCount,
        successful: successCount,
        failed: errorCount,
        availability: `${availability}%`,
        responseTimeStats: stats
    };
    
    console.log(`${colors.green}Stability Results:${colors.reset}`);
    console.log(`  Availability: ${availability}%`);
    console.log(`  Success: ${successCount}/${successCount + errorCount}`);
    if (stats) {
        console.log(`  Mean Response Time: ${stats.mean}ms`);
        console.log(`  P95 Response Time: ${stats.p95}ms`);
    }
}

// 메인 벤치마크 실행
async function runBenchmarks() {
    console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.yellow}   PALANTIR v3.1 Performance Benchmark${colors.reset}`);
    console.log(`${colors.yellow}   Started: ${new Date().toLocaleString()}${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    
    // 벤치마크 실행
    await benchmarkAPIResponse();
    await benchmarkConcurrency();
    await benchmarkPayloadSize();
    await benchmarkLatencyDistribution();
    await benchmarkStability();
    
    // 요약 생성
    results.summary = {
        totalTests: Object.keys(results.tests).length,
        timestamp: new Date().toISOString(),
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        }
    };
    
    // 결과 저장
    const fs = require('fs').promises;
    const reportPath = `C:/palantir/math/benchmarks/performance-report-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
    
    console.log(`\n${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.yellow}   BENCHMARK COMPLETE${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}Report saved to: ${reportPath}${colors.reset}`);
    
    // 성능 기준 체크
    console.log(`\n${colors.cyan}Performance Criteria Check:${colors.reset}`);
    
    // API 응답 시간 체크 (목표: <100ms)
    if (results.tests.apiResponse && results.tests.apiResponse['Health Check']) {
        const healthMean = parseFloat(results.tests.apiResponse['Health Check'].mean);
        const apiStatus = healthMean < 100 ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
        console.log(`  API Response Time (<100ms): ${healthMean}ms ${apiStatus}`);
    }
    
    // 가용성 체크 (목표: >99%)
    if (results.tests.stability) {
        const availability = parseFloat(results.tests.stability.availability);
        const availStatus = availability > 99 ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
        console.log(`  Availability (>99%): ${availability}% ${availStatus}`);
    }
    
    // P95 지연시간 체크 (목표: <200ms)
    if (results.tests.latencyDistribution) {
        const p95 = parseFloat(results.tests.latencyDistribution.p95);
        const p95Status = p95 < 200 ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
        console.log(`  P95 Latency (<200ms): ${p95}ms ${p95Status}`);
    }
}

// 에러 핸들링
process.on('unhandledRejection', (error) => {
    console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
    process.exit(1);
});

// 실행
runBenchmarks().catch(error => {
    console.error(`${colors.red}Benchmark failed: ${error.message}${colors.reset}`);
    process.exit(1);
});
