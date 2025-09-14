#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

async function testQwen3Max() {
    console.log('🐉 Qwen3-max-preview 모델 테스트\n');

    const apiKey = process.env.DASHSCOPE_API_KEY || 'sk-f2ab784cfdc7467495fa72ced5477c2a';
    console.log(`API Key: ${apiKey.substring(0, 20)}...`);
    console.log('Model: qwen3-max-preview\n');

    try {
        console.log('테스트 1: 간단한 메시지');
        const response = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                model: 'qwen3-max-preview',  // 정확한 모델명
                input: {
                    messages: [
                        { role: 'user', content: 'Say "Hello from Qwen3"' }
                    ]
                },
                parameters: {
                    max_tokens: 20,
                    temperature: 0.7
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        if (response.data && response.data.output) {
            console.log('✅ 성공!');
            console.log('응답:', response.data.output.text || response.data.output.choices?.[0]?.message?.content);
            console.log('\n전체 응답 구조:');
            console.log(JSON.stringify(response.data, null, 2));

            // 수학 문제 생성 테스트
            console.log('\n테스트 2: 수학 문제 생성');
            const mathResponse = await axios.post(
                'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                {
                    model: 'qwen3-max-preview',
                    input: {
                        messages: [
                            {
                                role: 'user',
                                content: '초등학교 6학년 수준의 일차방정식 문제 1개를 JSON 형식으로 만들어줘. 형식: {"question": "문제", "answer": "답", "explanation": "풀이"}'
                            }
                        ]
                    },
                    parameters: {
                        max_tokens: 200,
                        temperature: 0.7
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );

            if (mathResponse.data && mathResponse.data.output) {
                console.log('✅ 수학 문제 생성 성공!');
                console.log('응답:', mathResponse.data.output.text || mathResponse.data.output.choices?.[0]?.message?.content);
            }

            return true;
        }
    } catch (error) {
        console.log('❌ 실패');
        if (error.response) {
            console.log('상태 코드:', error.response.status);
            console.log('오류 메시지:', error.response.data?.message || error.response.data);

            // 상세 오류 정보
            if (error.response.data) {
                console.log('\n상세 오류:');
                console.log(JSON.stringify(error.response.data, null, 2));
            }
        } else {
            console.log('네트워크 오류:', error.message);
        }
        return false;
    }
}

// 사용 가능한 모델 목록 확인
async function checkAvailableModels() {
    console.log('\n📋 사용 가능한 Qwen 모델 목록:');
    const models = [
        'qwen-turbo',
        'qwen-plus',
        'qwen-max',
        'qwen3-max-preview',
        'qwen-7b-chat',
        'qwen-14b-chat',
        'qwen-72b-chat'
    ];

    for (const model of models) {
        process.stdout.write(`- ${model}: `);
        try {
            const response = await axios.post(
                'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                {
                    model: model,
                    input: {
                        messages: [{ role: 'user', content: 'Hi' }]
                    },
                    parameters: { max_tokens: 1 }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY || 'sk-f2ab784cfdc7467495fa72ced5477c2a'}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );
            console.log('✅ 사용 가능');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('❌ 인증 실패');
            } else if (error.response?.status === 400) {
                console.log('❌ 모델 없음');
            } else {
                console.log('❌ 오류');
            }
        }
    }
}

async function main() {
    const result = await testQwen3Max();

    if (!result) {
        await checkAvailableModels();
    }

    console.log('\n========================================');
    if (result) {
        console.log('✅ Qwen3-max-preview 모델 작동 확인!');
        console.log('\n.env 파일 업데이트 필요:');
        console.log('DASHSCOPE_MODEL=qwen3-max-preview');
    } else {
        console.log('❌ API 키 또는 모델명 확인 필요');
        console.log('\n가능한 원인:');
        console.log('1. API 키가 만료되었거나 유효하지 않음');
        console.log('2. 모델명이 정확하지 않음');
        console.log('3. 계정에 해당 모델 접근 권한이 없음');
    }
}

main().catch(console.error);