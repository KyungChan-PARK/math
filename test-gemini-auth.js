#!/usr/bin/env node

/**
 * Gemini API 인증 테스트
 * 서비스 계정 정보를 사용한 API 키 검증
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔐 Gemini API 인증 테스트...\n');

// 서비스 계정 정보
const serviceAccountInfo = {
    email: 'kcpartner@math-project-472006.iam.gserviceaccount.com',
    uniqueId: '109841649961643177688',
    keyId: '9434f1f3f836d10ac4ab07d651300e9cde2aa98c'
};

console.log('📋 서비스 계정 정보:');
console.log(`  Email: ${serviceAccountInfo.email}`);
console.log(`  Unique ID: ${serviceAccountInfo.uniqueId}`);
console.log(`  Key ID: ${serviceAccountInfo.keyId}`);
console.log('');

// 현재 환경변수의 Gemini API 키
const currentApiKey = process.env.GEMINI_API_KEY;
console.log(`현재 GEMINI_API_KEY: ${currentApiKey ? currentApiKey.substring(0, 10) + '...' : '❌ 없음'}\n`);

// Gemini API 테스트 함수
async function testGeminiAPI(apiKey, description) {
    console.log(`\n🧪 테스트: ${description}`);
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : 'None'}`);
    
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: 'Say "Hello" in one word'
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
            console.log('   ✅ 성공!');
            console.log(`   응답: ${response.data.candidates[0].content.parts[0].text}`);
            return true;
        }
    } catch (error) {
        console.log('   ❌ 실패');
        if (error.response) {
            console.log(`   상태 코드: ${error.response.status}`);
            console.log(`   오류: ${error.response.data?.error?.message || '알 수 없음'}`);
            
            // 상세 오류 정보
            if (error.response.data?.error?.details) {
                console.log('   상세 정보:', JSON.stringify(error.response.data.error.details, null, 2));
            }
        } else {
            console.log(`   네트워크 오류: ${error.message}`);
        }
        return false;
    }
}

// 가능한 API 키 형식들 테스트
async function runTests() {
    console.log('=' .repeat(60));
    console.log('Gemini API 키 형식 테스트');
    console.log('=' .repeat(60));
    
    // 테스트할 키들
    const keysToTest = [
        {
            key: currentApiKey,
            description: '현재 환경변수 키'
        },
        {
            key: 'AIzaSyDTtCgkUVxe5UFSV7OInchTzaCyPEZ7SBE',
            description: 'CLAUDE.md에 저장된 키'
        },
        {
            key: serviceAccountInfo.keyId,
            description: '서비스 계정 Key ID (직접 사용)'
        }
    ];
    
    const results = [];
    for (const testCase of keysToTest) {
        if (testCase.key) {
            const success = await testGeminiAPI(testCase.key, testCase.description);
            results.push({ ...testCase, success });
        }
    }
    
    // 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 테스트 결과 요약');
    console.log('='.repeat(60));
    
    const successfulKey = results.find(r => r.success);
    if (successfulKey) {
        console.log('\n✅ 작동하는 API 키 발견!');
        console.log(`   설명: ${successfulKey.description}`);
        console.log(`   키: ${successfulKey.key.substring(0, 15)}...`);
        console.log('\n💡 권장사항:');
        console.log(`   .env 파일의 GEMINI_API_KEY를 다음으로 업데이트하세요:`);
        console.log(`   GEMINI_API_KEY=${successfulKey.key}`);
    } else {
        console.log('\n❌ 작동하는 API 키를 찾지 못함');
        console.log('\n💡 해결 방법:');
        console.log('1. Google AI Studio에서 새 API 키 생성:');
        console.log('   https://makersuite.google.com/app/apikey');
        console.log('2. 생성된 키는 "AIzaSy"로 시작해야 함');
        console.log('3. .env 파일에 GEMINI_API_KEY=<your-key> 추가');
        console.log('\n📝 참고:');
        console.log('- 서비스 계정 Key ID는 직접 API 키로 사용할 수 없음');
        console.log('- Gemini API는 Google AI Studio에서 발급한 API 키 필요');
        console.log('- Vertex AI와 Gemini API는 다른 인증 방식 사용');
    }
}

// 테스트 실행
runTests().catch(error => {
    console.error('테스트 실행 오류:', error);
    process.exit(1);
});