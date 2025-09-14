#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

async function testQwenAPI(apiKey, keyName) {
    try {
        console.log(`\n테스트: ${keyName}`);
        console.log(`키: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NOT SET'}`);

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
            console.log('✅ 성공!');
            console.log('응답:', response.data.output.text);
            return true;
        }
    } catch (error) {
        if (error.response) {
            console.log(`❌ 실패: ${error.response.data?.message || error.response.status}`);
        } else {
            console.log(`❌ 네트워크 오류: ${error.message}`);
        }
        return false;
    }
}

async function testWithAccessKeys() {
    console.log('\n🔐 Access Key ID/Secret 방식 테스트');

    try {
        const response = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                model: 'qwen-turbo',
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
                    'X-Access-Key-Id': process.env.DASHSCOPE_ACCESS_KEY_ID,
                    'X-Access-Key-Secret': process.env.DASHSCOPE_ACCESS_KEY_SECRET,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        if (response.data && response.data.output) {
            console.log('✅ Access Key 방식 성공!');
            console.log('응답:', response.data.output.text);
            return true;
        }
    } catch (error) {
        if (error.response) {
            console.log(`❌ Access Key 방식 실패: ${error.response.data?.message || error.response.status}`);
        } else {
            console.log(`❌ 네트워크 오류: ${error.message}`);
        }
        return false;
    }
}

async function main() {
    console.log('🐉 Qwen API 키 종합 테스트\n');
    console.log('환경변수 상태:');
    console.log('DASHSCOPE_API_KEY:', process.env.DASHSCOPE_API_KEY ? '✅' : '❌');
    console.log('DASHSCOPE_ACCESS_KEY_ID:', process.env.DASHSCOPE_ACCESS_KEY_ID ? '✅' : '❌');
    console.log('DASHSCOPE_ACCESS_KEY_SECRET:', process.env.DASHSCOPE_ACCESS_KEY_SECRET ? '✅' : '❌');

    let workingKey = null;

    // 1. Bearer Token 방식
    const bearerResult = await testQwenAPI(process.env.DASHSCOPE_API_KEY, 'DASHSCOPE_API_KEY (Bearer)');
    if (bearerResult) workingKey = 'DASHSCOPE_API_KEY';

    // 2. Access Key 방식
    const accessResult = await testWithAccessKeys();
    if (accessResult) workingKey = 'ACCESS_KEY_ID/SECRET';

    // 3. 다른 모델 테스트
    if (!workingKey) {
        console.log('\n다른 모델로 테스트 (qwen-plus)');
        const response = await testQwenAPI(process.env.DASHSCOPE_API_KEY, 'qwen-plus 모델');
    }

    console.log('\n========================================');
    if (workingKey) {
        console.log(`✅ 작동하는 키: ${workingKey}`);
        console.log('\n권장 설정:');
        if (workingKey === 'ACCESS_KEY_ID/SECRET') {
            console.log('Access Key 방식을 사용하세요.');
        } else {
            console.log('Bearer Token 방식을 사용하세요.');
        }
    } else {
        console.log('❌ 모든 키가 실패했습니다.');
        console.log('\n해결 방법:');
        console.log('1. DashScope 콘솔에서 새 API 키 생성');
        console.log('   https://dashscope.console.aliyun.com/apiKey');
        console.log('2. 무료 크레딧 확인');
        console.log('3. 지역 제한 확인 (중국 본토 외 지역)');
    }
}

main().catch(console.error);