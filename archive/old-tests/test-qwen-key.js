#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

async function testQwenKey(apiKey) {
    try {
        const response = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                model: 'qwen-turbo',  // 무료 모델
                input: {
                    messages: [
                        { role: 'user', content: 'Say hello' }
                    ]
                },
                parameters: {
                    max_tokens: 10
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        if (response.data && response.data.output) {
            return { success: true, message: '✅ API 키 유효함', response: response.data.output.text };
        }
    } catch (error) {
        if (error.response) {
            return {
                success: false,
                message: `❌ 오류: ${error.response.data?.message || error.response.status}`,
                status: error.response.status
            };
        }
        return { success: false, message: `❌ 네트워크 오류: ${error.message}` };
    }
}

async function main() {
    console.log('🔐 Qwen API 키 테스트\n');

    // 현재 .env의 키
    const currentKey = process.env.DASHSCOPE_API_KEY;
    console.log('현재 키 테스트:', currentKey ? currentKey.substring(0, 10) + '...' : 'NOT SET');
    const result1 = await testQwenKey(currentKey);
    console.log(result1.message);
    if (result1.response) console.log('응답:', result1.response);

    console.log('\n대체 키 테스트 옵션:');
    console.log('1. DashScope 콘솔에서 새 키 생성: https://dashscope.console.aliyun.com/apiKey');
    console.log('2. 무료 모델 사용: qwen-turbo, qwen-plus');
    console.log('3. OpenAI API 호환 모드 사용 가능');

    // 무료 모델 목록
    console.log('\n📋 사용 가능한 무료 모델:');
    console.log('- qwen-turbo (가장 빠름)');
    console.log('- qwen-plus (균형)');
    console.log('- qwen-max (고품질)');
}

main().catch(console.error);