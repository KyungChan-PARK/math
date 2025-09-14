#!/usr/bin/env node

/**
 * AI Collaboration 통합 테스트
 * Qwen과 Gemini API가 정상 작동하는지 확인
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 AI Collaboration 통합 테스트\n');
console.log('=' .repeat(60));

// Qwen API 테스트
async function testQwen() {
    console.log('📡 Qwen API (International) 테스트...');
    
    try {
        const response = await axios.post(
            'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                model: 'qwen-plus',
                input: {
                    messages: [
                        { role: 'user', content: 'What is 2+2?' }
                    ]
                },
                parameters: {
                    max_tokens: 50
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
            console.log('✅ Qwen API 작동 중');
            const answer = response.data.output.text || response.data.output.choices?.[0]?.message?.content;
            console.log(`   응답: ${answer?.substring(0, 100)}`);
            return true;
        }
    } catch (error) {
        console.log('❌ Qwen API 오류');
        console.log(`   ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Gemini API 테스트
async function testGemini() {
    console.log('\n📡 Gemini API (2.0 Flash Exp) 테스트...');
    
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: 'What is 2+2?'
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
            console.log('✅ Gemini API 작동 중');
            console.log(`   응답: ${response.data.candidates[0].content.parts[0].text.substring(0, 100)}`);
            return true;
        }
    } catch (error) {
        console.log('❌ Gemini API 오류');
        console.log(`   ${error.response?.data?.error?.message || error.message}`);
        return false;
    }
}

// 메인 테스트
async function runTests() {
    const qwenSuccess = await testQwen();
    const geminiSuccess = await testGemini();
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 테스트 결과 요약');
    console.log('=' .repeat(60));
    
    console.log(`\nQwen API:   ${qwenSuccess ? '✅ 정상' : '❌ 오류'}`);
    console.log(`Gemini API: ${geminiSuccess ? '✅ 정상' : '❌ 오류'}`);
    console.log(`Claude:     ✅ 구독으로 무제한 사용`);
    
    if (qwenSuccess && geminiSuccess) {
        console.log('\n🎉 모든 AI API가 정상 작동 중입니다!');
        console.log('프로젝트를 사용할 준비가 완료되었습니다.');
    } else {
        console.log('\n⚠️ 일부 API에 문제가 있습니다.');
        if (!geminiSuccess) {
            console.log('\n💡 Gemini API 키 해결 방법:');
            console.log('1. https://makersuite.google.com/app/apikey 에서 새 키 생성');
            console.log('2. .env 파일의 GEMINI_API_KEY 업데이트');
        }
    }
    
    console.log('\n📌 현재 실행 중인 서비스:');
    console.log('- Ontology Optimizer (백그라운드)');
    console.log('- API Usage Monitor (포트 8105 충돌 문제)');
    console.log('- AI Collaboration Orchestrator (시작 필요)');
}

runTests().catch(console.error);