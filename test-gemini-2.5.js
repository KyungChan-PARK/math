#!/usr/bin/env node

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Gemini 2.0 Flash Experimental 모델 테스트...\n');

const apiKey = process.env.GEMINI_API_KEY;

async function testModel(modelName) {
    console.log(`\n📡 테스트 모델: ${modelName}`);
    
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: '2+2='
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
            console.log('✅ 성공!');
            console.log(`응답: ${response.data.candidates[0].content.parts[0].text}`);
            return true;
        }
    } catch (error) {
        console.log('❌ 실패');
        if (error.response) {
            console.log(`상태: ${error.response.status}`);
            console.log(`오류: ${error.response.data?.error?.message || '알 수 없음'}`);
        } else {
            console.log(`오류: ${error.message}`);
        }
        return false;
    }
}

// 사용 가능한 모델들 테스트
const models = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash', 
    'gemini-1.5-pro'
];

async function runTests() {
    console.log('사용 가능한 Gemini 모델 테스트');
    console.log('='.repeat(50));
    
    for (const model of models) {
        await testModel(model);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('💡 gemini-2.0-flash-exp가 최신 모델입니다');
    console.log('   (gemini-2.5-pro는 아직 출시되지 않음)');
}

runTests().catch(console.error);