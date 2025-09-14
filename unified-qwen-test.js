#!/usr/bin/env node

/**
 * 통합 Qwen API 테스트 스위트
 * 여러 개의 중복 테스트 파일들을 하나로 통합
 * Created: 2025-09-14
 */

const axios = require('axios');
require('dotenv').config();

class QwenTestSuite {
    constructor() {
        this.apiKey = process.env.DASHSCOPE_API_KEY;
        this.baseURL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
        this.models = [
            'qwen-turbo',
            'qwen-plus', 
            'qwen-max',
            'qwen3-max-preview',
            'qwen2-72b-instruct'
        ];
    }

    // 기본 연결 테스트
    async testConnection() {
        console.log('🔌 연결 테스트...');
        try {
            const response = await axios.post(
                this.baseURL,
                {
                    model: 'qwen-turbo',
                    input: {
                        messages: [{ role: 'user', content: 'Hello' }]
                    },
                    parameters: { max_tokens: 10 }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('✅ 연결 성공');
            return true;
        } catch (error) {
            console.error('❌ 연결 실패:', error.message);
            return false;
        }
    }

    // 모델별 테스트
    async testModels() {
        console.log('\n🤖 모델별 테스트...');
        const results = [];
        
        for (const model of this.models) {
            try {
                console.log(`\n테스팅: ${model}`);
                const response = await axios.post(
                    this.baseURL,
                    {
                        model: model,
                        input: {
                            messages: [
                                { role: 'user', content: `모델 ${model} 테스트` }
                            ]
                        },
                        parameters: {
                            max_tokens: 50,
                            temperature: 0.7
                        }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    }
                );
                
                results.push({
                    model: model,
                    status: 'success',
                    tokens: response.data.usage?.total_tokens || 0
                });
                console.log(`✅ ${model}: 성공`);
                
            } catch (error) {
                results.push({
                    model: model,
                    status: 'failed',
                    error: error.message
                });
                console.log(`❌ ${model}: ${error.message}`);
            }
        }
        
        return results;
    }

    // 수학 문제 생성 테스트
    async testMathGeneration() {
        console.log('\n📐 수학 문제 생성 테스트...');
        
        const prompt = `
        고등학교 2학년 수준의 이차함수 문제를 생성해주세요.
        형식:
        - 문제
        - 선택지 4개
        - 정답
        - 해설
        `;
        
        try {
            const response = await axios.post(
                this.baseURL,
                {
                    model: 'qwen-plus',
                    input: {
                        messages: [
                            { role: 'system', content: '당신은 수학 교육 전문가입니다.' },
                            { role: 'user', content: prompt }
                        ]
                    },
                    parameters: {
                        max_tokens: 500,
                        temperature: 0.8
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ 수학 문제 생성 성공');
            console.log('생성된 문제:', response.data.output.text.substring(0, 200) + '...');
            return response.data;
            
        } catch (error) {
            console.error('❌ 수학 문제 생성 실패:', error.message);
            return null;
        }
    }

    // 스트레스 테스트
    async stressTest(requests = 10) {
        console.log(`\n⚡ 스트레스 테스트 (${requests}개 동시 요청)...`);
        
        const promises = [];
        for (let i = 0; i < requests; i++) {
            promises.push(
                axios.post(
                    this.baseURL,
                    {
                        model: 'qwen-turbo',
                        input: {
                            messages: [{ role: 'user', content: `Test ${i}` }]
                        },
                        parameters: { max_tokens: 10 }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    }
                ).catch(err => ({ error: err.message }))
            );
        }
        
        const startTime = Date.now();
        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;
        
        const successful = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error).length;
        
        console.log(`✅ 성공: ${successful}/${requests}`);
        console.log(`❌ 실패: ${failed}/${requests}`);
        console.log(`⏱️ 소요 시간: ${duration}ms`);
        console.log(`📊 평균 응답 시간: ${(duration / requests).toFixed(0)}ms`);
        
        return { successful, failed, duration };
    }

    // 전체 테스트 실행
    async runAllTests() {
        console.log('🚀 Qwen API 통합 테스트 시작\n');
        console.log('='.repeat(50));
        
        if (!this.apiKey) {
            console.error('❌ API 키가 설정되지 않았습니다.');
            console.log('💡 .env 파일에 DASHSCOPE_API_KEY를 설정하세요.');
            return;
        }
        
        console.log(`API Key: ${this.apiKey.substring(0, 20)}...`);
        console.log('='.repeat(50));
        
        // 1. 연결 테스트
        const connectionOk = await this.testConnection();
        if (!connectionOk) {
            console.log('\n테스트를 중단합니다.');
            return;
        }
        
        // 2. 모델별 테스트
        const modelResults = await this.testModels();
        
        // 3. 수학 문제 생성 테스트
        await this.testMathGeneration();
        
        // 4. 스트레스 테스트 (선택적)
        if (process.argv.includes('--stress')) {
            await this.stressTest(20);
        }
        
        // 결과 요약
        console.log('\n' + '='.repeat(50));
        console.log('📊 테스트 결과 요약');
        console.log('='.repeat(50));
        
        const successCount = modelResults.filter(r => r.status === 'success').length;
        console.log(`✅ 성공한 모델: ${successCount}/${modelResults.length}`);
        
        modelResults.forEach(result => {
            const icon = result.status === 'success' ? '✅' : '❌';
            console.log(`${icon} ${result.model}: ${result.status}`);
        });
        
        console.log('\n테스트 완료!');
    }
}

// CLI 실행
if (require.main === module) {
    const tester = new QwenTestSuite();
    
    // 명령행 인자 처리
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
        console.log(`
사용법: node unified-qwen-test.js [옵션]

옵션:
  --help       이 도움말 표시
  --stress     스트레스 테스트 포함
  --models     모델 테스트만 실행
  --math       수학 생성 테스트만 실행
`);
        process.exit(0);
    }
    
    if (args.includes('--models')) {
        tester.testModels().then(() => process.exit(0));
    } else if (args.includes('--math')) {
        tester.testMathGeneration().then(() => process.exit(0));
    } else {
        tester.runAllTests().then(() => process.exit(0));
    }
}

module.exports = QwenTestSuite;