#!/usr/bin/env node

const axios = require('axios');

async function testQwenWithUID() {
    console.log('🐉 Qwen API 테스트 (UID 포함)\n');

    const apiKey = 'sk-667a2e400b824e548c7e1122e99243de';
    const workspaceId = 'llm-odu1qthidmjab4c9';
    const uid = '5399657396183158';

    console.log('UID:', uid);
    console.log('API Key:', apiKey.substring(0, 30) + '...');
    console.log('Workspace ID:', workspaceId, '\n');

    // 다양한 헤더 조합 테스트
    const headerVariations = [
        {
            name: 'UID in X-UID header',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-UID': uid
            }
        },
        {
            name: 'UID in X-DashScope-UID',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-UID': uid
            }
        },
        {
            name: 'UID + Workspace',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-WorkSpace': workspaceId,
                'X-DashScope-UID': uid
            }
        },
        {
            name: 'All identifiers',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-WorkSpace': workspaceId,
                'X-DashScope-UID': uid,
                'X-UID': uid,
                'X-User-Id': uid
            }
        }
    ];

    // 엔드포인트 테스트
    const endpoints = [
        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    ];

    for (const endpoint of endpoints) {
        console.log(`\n📍 엔드포인트: ${endpoint}\n`);

        for (const variant of headerVariations) {
            console.log(`테스트: ${variant.name}`);

            try {
                const response = await axios.post(
                    endpoint,
                    {
                        model: 'qwen-turbo',
                        input: {
                            messages: [
                                { role: 'user', content: 'Say hello in 3 words' }
                            ]
                        },
                        parameters: {
                            max_tokens: 20,
                            temperature: 0.7
                        }
                    },
                    {
                        headers: variant.headers,
                        timeout: 10000
                    }
                );

                if (response.data) {
                    console.log(`✅ 성공!`);
                    const text = response.data.output?.text ||
                               response.data.output?.choices?.[0]?.message?.content;
                    console.log(`응답: ${text}`);

                    console.log('\n✨ 작동 설정 발견!');
                    console.log('Headers:', JSON.stringify(variant.headers, null, 2));
                    return {
                        success: true,
                        headers: variant.headers,
                        endpoint: endpoint
                    };
                }
            } catch (error) {
                if (error.response) {
                    const errorMsg = error.response.data?.message ||
                                   error.response.data?.error?.message ||
                                   error.response.statusText;
                    console.log(`❌ 실패: ${errorMsg}`);
                } else {
                    console.log(`❌ 네트워크 오류: ${error.message}`);
                }
            }
        }
    }

    // OpenAI Compatible 모드도 테스트
    console.log('\n📍 OpenAI Compatible 모드 테스트\n');

    for (const variant of headerVariations) {
        console.log(`테스트: ${variant.name}`);

        try {
            const response = await axios.post(
                'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
                {
                    model: 'qwen-turbo',
                    messages: [
                        { role: 'user', content: 'Say hello in 3 words' }
                    ],
                    max_tokens: 20
                },
                {
                    headers: variant.headers,
                    timeout: 10000
                }
            );

            if (response.data) {
                console.log(`✅ 성공!`);
                const text = response.data.choices?.[0]?.message?.content;
                console.log(`응답: ${text}`);

                console.log('\n✨ 작동 설정 발견!');
                console.log('Headers:', JSON.stringify(variant.headers, null, 2));
                return {
                    success: true,
                    headers: variant.headers,
                    endpoint: 'OpenAI Compatible'
                };
            }
        } catch (error) {
            if (error.response) {
                const errorMsg = error.response.data?.error?.message ||
                               error.response.statusText;
                console.log(`❌ 실패: ${errorMsg}`);
            } else {
                console.log(`❌ 네트워크 오류: ${error.message}`);
            }
        }
    }

    return { success: false };
}

async function main() {
    const result = await testQwenWithUID();

    console.log('\n========================================');
    if (result.success) {
        console.log('✅ Qwen API 연결 성공!');
        console.log(`엔드포인트: ${result.endpoint}`);
        console.log('\n필요한 헤더:');
        console.log(JSON.stringify(result.headers, null, 2));
    } else {
        console.log('❌ UID를 포함해도 실패');
        console.log('\nModel Studio 콘솔에서 확인 필요:');
        console.log('1. UID가 맞는지 확인');
        console.log('2. API 키 활성화 상태');
        console.log('3. 계정 권한 설정');
    }
}

main().catch(console.error);