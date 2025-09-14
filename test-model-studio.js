#!/usr/bin/env node

const axios = require('axios');

async function testModelStudio() {
    console.log('🐉 Alibaba Cloud Model Studio API 테스트\n');

    const apiKey = 'sk-667a2e400b824e548c7e1122e99243de';
    const workspaceId = 'llm-odu1qthidmjab4c9';

    console.log('API Key:', apiKey.substring(0, 30) + '...');
    console.log('Workspace ID:', workspaceId, '\n');

    // 다양한 엔드포인트 시도
    const endpoints = [
        {
            name: 'DashScope Standard',
            url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        },
        {
            name: 'DashScope with Workspace',
            url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-WorkSpace': workspaceId
            }
        },
        {
            name: 'Model Studio Direct',
            url: `https://dashscope.aliyuncs.com/api/v1/apps/${workspaceId}/completion`,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        },
        {
            name: 'OpenAI Compatible',
            url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        }
    ];

    for (const endpoint of endpoints) {
        console.log(`\n테스트: ${endpoint.name}`);
        console.log(`URL: ${endpoint.url}`);

        try {
            let requestBody;

            if (endpoint.name === 'OpenAI Compatible') {
                // OpenAI 형식
                requestBody = {
                    model: 'qwen-turbo',
                    messages: [
                        { role: 'user', content: 'Hello' }
                    ],
                    max_tokens: 10
                };
            } else {
                // DashScope 형식
                requestBody = {
                    model: 'qwen-turbo',
                    input: {
                        messages: [
                            { role: 'user', content: 'Hello' }
                        ]
                    },
                    parameters: {
                        max_tokens: 10
                    }
                };
            }

            const response = await axios.post(
                endpoint.url,
                requestBody,
                {
                    headers: endpoint.headers,
                    timeout: 10000
                }
            );

            if (response.data) {
                console.log('✅ 성공!');
                console.log('응답 구조:', Object.keys(response.data));

                // 응답 내용 파싱
                const text = response.data.output?.text ||
                           response.data.output?.choices?.[0]?.message?.content ||
                           response.data.choices?.[0]?.message?.content ||
                           response.data.text ||
                           JSON.stringify(response.data);

                console.log('응답 내용:', text.substring(0, 100));
                console.log('\n전체 응답:');
                console.log(JSON.stringify(response.data, null, 2));

                return {
                    success: true,
                    endpoint: endpoint.name,
                    url: endpoint.url
                };
            }
        } catch (error) {
            if (error.response) {
                console.log(`❌ 실패: ${error.response.status}`);
                console.log('오류:', error.response.data?.message ||
                                   error.response.data?.error?.message ||
                                   error.response.data);
            } else {
                console.log(`❌ 네트워크 오류: ${error.message}`);
            }
        }
    }

    return { success: false };
}

async function main() {
    const result = await testModelStudio();

    console.log('\n========================================');
    if (result.success) {
        console.log('✅ API 연결 성공!');
        console.log(`작동 엔드포인트: ${result.endpoint}`);
        console.log(`URL: ${result.url}`);
    } else {
        console.log('❌ 모든 엔드포인트 실패');
        console.log('\n확인 필요사항:');
        console.log('1. Model Studio 콘솔에서 API 키 확인');
        console.log('2. Workspace ID 확인');
        console.log('3. API 키 권한 및 활성화 상태 확인');
        console.log('4. 사용 가능한 모델 및 크레딧 확인');
    }
}

main().catch(console.error);