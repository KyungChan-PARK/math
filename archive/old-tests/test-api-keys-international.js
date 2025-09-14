#!/usr/bin/env node

/**
 * API 키 테스트 스크립트 - International 버전
 * Qwen과 Gemini API 키 검증 (지역별 엔드포인트 적용)
 */

import axios from 'axios';
import dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

console.log('🔐 API 키 테스트 시작 (International Version)...\n');

// 환경변수 확인
console.log('환경변수 상태:');
console.log(`DASHSCOPE_API_KEY: ${process.env.DASHSCOPE_API_KEY ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ 설정됨' : '❌ 없음'}`);
console.log('');

// Qwen API 테스트 - International endpoint
async function testQwenAPIInternational() {
    console.log('📡 Qwen API 테스트 (International Endpoint)...');
    
    try {
        const response = await axios.post(
            'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                model: 'qwen-max',
                input: {
                    messages: [
                        { role: 'user', content: '1+1=' }
                    ]
                },
                parameters: {
                    max_tokens: 10
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        
        if (response.data && response.data.output) {
            console.log('✅ Qwen API (International) 정상 작동');
            console.log(`   응답: ${response.data.output.text || response.data.output.choices[0].message.content}`);
            return true;
        }
    } catch (error) {
        console.log('❌ Qwen API (International) 오류:');
        if (error.response) {
            console.log(`   상태: ${error.response.status}`);
            console.log(`   메시지: ${error.response.data?.message || error.response.data?.code || '알 수 없음'}`);
        } else {
            console.log(`   오류: ${error.message}`);
        }
        return false;
    }
}

// Qwen API 테스트 - China endpoint
async function testQwenAPIChina() {
    console.log('\n📡 Qwen API 테스트 (China Endpoint)...');
    
    try {
        const response = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                model: 'qwen-max',
                input: {
                    messages: [
                        { role: 'user', content: '1+1=' }
                    ]
                },
                parameters: {
                    max_tokens: 10
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        
        if (response.data && response.data.output) {
            console.log('✅ Qwen API (China) 정상 작동');
            console.log(`   응답: ${response.data.output.text || response.data.output.choices[0].message.content}`);
            return true;
        }
    } catch (error) {
        console.log('❌ Qwen API (China) 오류:');
        if (error.response) {
            console.log(`   상태: ${error.response.status}`);
            console.log(`   메시지: ${error.response.data?.message || error.response.data?.code || '알 수 없음'}`);
        } else {
            console.log(`   오류: ${error.message}`);
        }
        return false;
    }
}

// Qwen API 테스트 - OpenAI Compatible endpoint
async function testQwenAPICompatible() {
    console.log('\n📡 Qwen API 테스트 (OpenAI Compatible Mode)...');
    
    try {
        const response = await axios.post(
            'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            {
                model: 'qwen-max',
                messages: [
                    { role: 'user', content: '1+1=' }
                ],
                max_tokens: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );
        
        if (response.data && response.data.choices) {
            console.log('✅ Qwen API (Compatible Mode) 정상 작동');
            console.log(`   응답: ${response.data.choices[0].message.content}`);
            return true;
        }
    } catch (error) {
        console.log('❌ Qwen API (Compatible Mode) 오류:');
        if (error.response) {
            console.log(`   상태: ${error.response.status}`);
            console.log(`   메시지: ${error.response.data?.message || error.response.data?.error?.message || '알 수 없음'}`);
        } else {
            console.log(`   오류: ${error.message}`);
        }
        return false;
    }
}

// Gemini API 테스트 - 지연 후 재시도
async function testGeminiAPIWithRetry() {
    console.log('\n📡 Gemini API 테스트 (With Retry)...');
    
    const attempts = [0, 5000, 15000]; // 즉시, 5초 후, 15초 후
    
    for (let i = 0; i < attempts.length; i++) {
        if (i > 0) {
            console.log(`   ⏳ ${attempts[i]/1000}초 대기 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, attempts[i]));
        }
        
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    contents: [{
                        parts: [{
                            text: '1+1='
                        }]
                    }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );
            
            if (response.data && response.data.candidates) {
                console.log('✅ Gemini API 정상 작동');
                console.log(`   응답: ${response.data.candidates[0].content.parts[0].text}`);
                return true;
            }
        } catch (error) {
            console.log(`❌ Gemini API 오류 (시도 ${i + 1}):`);
            if (error.response) {
                console.log(`   상태: ${error.response.status}`);
                console.log(`   메시지: ${error.response.data?.error?.message || '알 수 없음'}`);
                
                // 마지막 시도가 아니면 계속
                if (i < attempts.length - 1) continue;
            } else {
                console.log(`   오류: ${error.message}`);
            }
        }
    }
    return false;
}

// 테스트 실행
async function runTests() {
    console.log('=' .repeat(60));
    console.log('테스트 시작: 다양한 엔드포인트 및 방법 시도');
    console.log('=' .repeat(60));
    
    // Qwen 테스트
    const qwenIntlSuccess = await testQwenAPIInternational();
    const qwenChinaSuccess = await testQwenAPIChina();
    const qwenCompatSuccess = await testQwenAPICompatible();
    
    // Gemini 테스트
    const geminiSuccess = await testGeminiAPIWithRetry();
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 테스트 결과 요약');
    console.log('='.repeat(60));
    
    console.log('\nQwen API:');
    console.log(`  International Endpoint: ${qwenIntlSuccess ? '✅ 성공' : '❌ 실패'}`);
    console.log(`  China Endpoint: ${qwenChinaSuccess ? '✅ 성공' : '❌ 실패'}`);
    console.log(`  Compatible Mode: ${qwenCompatSuccess ? '✅ 성공' : '❌ 실패'}`);
    
    console.log('\nGemini API:');
    console.log(`  Standard Endpoint: ${geminiSuccess ? '✅ 성공' : '❌ 실패'}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('💡 분석 및 권장사항');
    console.log('='.repeat(60));
    
    if (!qwenIntlSuccess && !qwenChinaSuccess && !qwenCompatSuccess) {
        console.log('\n🔴 Qwen API 키 문제:');
        console.log('1. API 키가 유효하지 않거나 만료됨');
        console.log('2. 계정이 International/China 지역 제한이 있을 수 있음');
        console.log('3. Alibaba Cloud Console에서 새 키 발급 필요');
        console.log('   https://dashscope.console.aliyun.com');
    } else if (qwenIntlSuccess && !qwenChinaSuccess) {
        console.log('\n🟡 Qwen: International 계정으로 확인됨');
        console.log('   → dashscope-intl.aliyuncs.com 엔드포인트 사용');
    } else if (!qwenIntlSuccess && qwenChinaSuccess) {
        console.log('\n🟡 Qwen: China 계정으로 확인됨');
        console.log('   → dashscope.aliyuncs.com 엔드포인트 사용');
    }
    
    if (!geminiSuccess) {
        console.log('\n🔴 Gemini API 키 문제:');
        console.log('1. API 키 형식이 잘못됨 (AIzaSy로 시작해야 함)');
        console.log('2. Google Cloud Console에서 Gemini API 활성화 필요');
        console.log('3. 새 API 키 생성 필요');
        console.log('   https://makersuite.google.com/app/apikey');
        console.log('4. 또는 다른 Google 계정으로 시도');
    }
}

runTests().catch(error => {
    console.error('테스트 실행 오류:', error);
    process.exit(1);
});