#!/usr/bin/env node

/**
 * GCP 설정 테스트
 * math-project-472006 연결 확인
 */

const { Firestore } = require('@google-cloud/firestore');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

console.log('========================================');
console.log('GCP 프로젝트 설정 테스트');
console.log('========================================\n');

// 환경 변수 확인
console.log('📋 환경 변수 확인:');
console.log(`   PROJECT_ID: ${process.env.GCP_PROJECT_ID || 'NOT SET'}`);
console.log(`   REGION: ${process.env.GCP_REGION || 'NOT SET'}`);
console.log(`   CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'NOT SET'}`);
console.log(`   GEMINI_KEY: ${process.env.GEMINI_API_KEY ? '✓ SET' : '✗ NOT SET'}`);
console.log(`   QWEN_KEY: ${process.env.DASHSCOPE_API_KEY ? '✓ SET' : '✗ NOT SET'}`);

// Firestore 연결 테스트
async function testFirestore() {
    console.log('\n🔥 Firestore 연결 테스트:');
    try {
        const firestore = new Firestore({
            projectId: process.env.GCP_PROJECT_ID || 'math-project-472006',
            databaseId: 'palantir-math',  // Native 모드 데이터베이스 ID
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });

        // 테스트 컬렉션에 문서 쓰기
        const testDoc = {
            test: true,
            timestamp: new Date().toISOString(),
            project: 'math-project-472006',
            message: 'Migration successful!'
        };

        const docRef = await firestore.collection('test').add(testDoc);
        console.log(`   ✅ Firestore 쓰기 성공: ${docRef.id}`);

        // 문서 읽기
        const snapshot = await docRef.get();
        if (snapshot.exists) {
            console.log(`   ✅ Firestore 읽기 성공`);
        }

        // 테스트 문서 삭제
        await docRef.delete();
        console.log(`   ✅ Firestore 삭제 성공`);

        return true;
    } catch (error) {
        console.error(`   ❌ Firestore 오류: ${error.message}`);
        return false;
    }
}

// Gemini API 테스트
async function testGemini() {
    console.log('\n🤖 Gemini API 테스트:');
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent('Say "Hello from math-project-472006"');
        const response = result.response.text();
        console.log(`   ✅ Gemini 응답: ${response.substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.error(`   ❌ Gemini 오류: ${error.message}`);
        return false;
    }
}

// Qwen API 테스트
async function testQwen() {
    console.log('\n🐉 Qwen API 테스트:');
    try {
        const axios = require('axios');

        const endpoint = process.env.DASHSCOPE_ENDPOINT || 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
        const model = process.env.DASHSCOPE_MODEL || 'qwen3-max-preview';

        const response = await axios.post(
            endpoint,
            {
                model: model,
                input: {
                    messages: [
                        { role: 'user', content: 'Say "Hello from math-project-472006"' }
                    ]
                },
                parameters: { max_tokens: 10 }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.output?.text) {
            console.log(`   ✅ Qwen 응답: ${response.data.output.text.substring(0, 50)}`);
            return true;
        } else if (response.data) {
            console.log(`   ✅ Qwen 응답 수신 (토큰 사용: ${response.data.usage?.total_tokens || 'N/A'})`);
            return true;
        }
    } catch (error) {
        console.error(`   ❌ Qwen 오류: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// 메인 실행
async function main() {
    console.log('\n🚀 테스트 시작...\n');

    const results = {
        firestore: await testFirestore(),
        gemini: await testGemini(),
        qwen: await testQwen()
    };

    console.log('\n========================================');
    console.log('테스트 결과 요약');
    console.log('========================================');
    console.log(`Firestore: ${results.firestore ? '✅ 성공' : '❌ 실패'}`);
    console.log(`Gemini API: ${results.gemini ? '✅ 성공' : '❌ 실패'}`);
    console.log(`Qwen API: ${results.qwen ? '✅ 성공' : '❌ 실패'}`);

    const allPassed = Object.values(results).every(r => r);
    if (allPassed) {
        console.log('\n✨ 모든 테스트 통과! math-project-472006 마이그레이션 성공!');
    } else {
        console.log('\n⚠️ 일부 테스트 실패. 설정을 확인하세요.');
    }
}

// axios가 없으면 설치 안내
try {
    require('axios');
} catch (e) {
    console.log('axios 패키지 설치 필요: npm install axios');
}

main().catch(console.error);