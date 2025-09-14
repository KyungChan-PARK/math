#!/usr/bin/env node

/**
 * API 키 테스트 스크립트
 * Qwen과 Gemini API 키 검증
 */

import axios from 'axios';
import dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

console.log('🔐 API 키 테스트 시작...\n');

// 환경변수 확인
console.log('환경변수 상태:');
console.log(`DASHSCOPE_API_KEY: ${process.env.DASHSCOPE_API_KEY ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ 설정됨' : '❌ 없음'}`);
console.log('');

// Qwen API 테스트
async function testQwenAPI() {
    console.log('📡 Qwen API 테스트...');
    
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
            console.log('✅ Qwen API 정상 작동');
            console.log(`   응답: ${response.data.output.text || response.data.output.choices[0].message.content}`);
        }
    } catch (error) {
        console.log('❌ Qwen API 오류:');
        if (error.response) {
            console.log(`   상태: ${error.response.status}`);
            console.log(`   메시지: ${error.response.data?.message || error.response.data?.code || '알 수 없음'}`);
            if (error.response.status === 401) {
                console.log('   💡 해결: API 키가 유효하지 않습니다. .env 파일의 DASHSCOPE_API_KEY를 확인하세요.');
            }
        } else {
            console.log(`   오류: ${error.message}`);
        }
    }
}

// Gemini API 테스트
async function testGeminiAPI() {
    console.log('\n📡 Gemini API 테스트...');
    
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
        }
    } catch (error) {
        console.log('❌ Gemini API 오류:');
        if (error.response) {
            console.log(`   상태: ${error.response.status}`);
            console.log(`   메시지: ${error.response.data?.error?.message || '알 수 없음'}`);
            if (error.response.status === 400 || error.response.status === 403) {
                console.log('   💡 해결: API 키가 유효하지 않거나 API가 활성화되지 않았습니다.');
                console.log('   1. Google Cloud Console에서 Gemini API 활성화 확인');
                console.log('   2. .env 파일의 GEMINI_API_KEY 확인');
            }
        } else {
            console.log(`   오류: ${error.message}`);
        }
    }
}

// 테스트 실행
async function runTests() {
    await testQwenAPI();
    await testGeminiAPI();
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 테스트 완료');
    console.log('='.repeat(60));
    
    // 권장사항
    console.log('\n💡 권장사항:');
    console.log('1. API 키가 올바른지 확인: .env 파일 검토');
    console.log('2. API 서비스 활성화 상태 확인');
    console.log('3. API 사용량 한도 확인');
    console.log('4. 네트워크 연결 상태 확인');
}

runTests().catch(error => {
    console.error('테스트 실행 오류:', error);
    process.exit(1);
});