#!/usr/bin/env node

const axios = require('axios');

async function testNewQwenKey() {
    console.log('🐉 Qwen API 테스트 (새 API 키)\n');

    const apiKey = 'sk-832a0ba1a9b64ec39887028eef0b28d7';
    const workspaceName = 'math-palantir';
    const ramId = '5399657396183158';

    console.log('API Key:', apiKey.substring(0, 30) + '...');
    console.log('Workspace:', workspaceName);
    console.log('RAM ID:', ramId, '\n');

    // 테스트할 모델들 (qwen3-max-preview만 승인됨)
    const models = ['qwen3-max-preview', 'qwen-max', 'qwen-plus', 'qwen-turbo'];

    // 엔드포인트들
    const endpoints = [
        {
            name: 'China Standard',
            url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
        },
        {
            name: 'International',
            url: 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
        }
    ];

    for (const endpoint of endpoints) {
        console.log(`\n📍 테스트: ${endpoint.name}`);
        console.log(`URL: ${endpoint.url}\n`);

        for (const model of models) {
            console.log(`  모델: ${model}`);

            // 다양한 헤더 조합 시도
            const headerVariations = [
                {
                    name: 'Simple',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                },
                {
                    name: 'With Workspace',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'X-DashScope-WorkSpace': workspaceName
                    }
                },
                {
                    name: 'With RAM ID',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'X-DashScope-WorkSpace': workspaceName,
                        'X-DashScope-RAM-Id': ramId
                    }
                }
            ];

            for (const headerVar of headerVariations) {
                try {
                    const response = await axios.post(
                        endpoint.url,
                        {
                            model: model,
                            input: {
                                messages: [
                                    { role: 'user', content: 'Say hello in exactly 3 words' }
                                ]
                            },
                            parameters: {
                                max_tokens: 20,
                                temperature: 0.7
                            }
                        },
                        {
                            headers: headerVar.headers,
                            timeout: 10000
                        }
                    );

                    if (response.data && response.data.output) {
                        console.log(`  ✅ ${model} 성공! (${headerVar.name})`);
                        const text = response.data.output.text ||
                                   response.data.output.choices?.[0]?.message?.content;
                        console.log(`  응답: ${text}`);

                        if (response.data.usage) {
                            console.log(`  토큰: 입력=${response.data.usage.input_tokens}, 출력=${response.data.usage.output_tokens}`);
                        }

                        // 수학 문제 생성 테스트
                        console.log('\n  📐 수학 문제 생성 테스트...');
                        const mathResponse = await axios.post(
                            endpoint.url,
                            {
                                model: model,
                                input: {
                                    messages: [
                                        {
                                            role: 'system',
                                            content: '당신은 수학 교사입니다. JSON 형식으로 답변하세요.'
                                        },
                                        {
                                            role: 'user',
                                            content: '초등학교 6학년 일차방정식 문제 1개를 다음 JSON 형식으로 만들어주세요: {"question": "문제", "answer": "정답", "explanation": "풀이"}'
                                        }
                                    ]
                                },
                                parameters: {
                                    max_tokens: 300,
                                    temperature: 0.7
                                }
                            },
                            {
                                headers: headerVar.headers,
                                timeout: 15000
                            }
                        );

                        if (mathResponse.data) {
                            console.log('  ✅ 수학 문제 생성 성공!');
                            const mathText = mathResponse.data.output.text ||
                                           mathResponse.data.output.choices?.[0]?.message?.content;
                            console.log('  생성된 문제:');
                            console.log('  ', mathText.substring(0, 200));
                        }

                        return {
                            success: true,
                            endpoint: endpoint.url,
                            model: model,
                            headers: headerVar.headers,
                            apiKey: apiKey,
                            workspace: workspaceName
                        };
                    }
                } catch (error) {
                    // 에러는 조용히 처리하고 다음 시도
                    if (error.response?.status !== 401 && error.response?.status !== 400) {
                        // 401, 400이 아닌 에러만 표시
                        console.log(`  ❌ ${model}: ${error.response?.data?.message || error.message}`);
                    }
                }
            }
        }
    }

    // OpenAI Compatible 모드 테스트
    console.log('\n📍 OpenAI Compatible 모드 테스트\n');

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
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        if (response.data) {
            console.log('✅ OpenAI Compatible 모드 성공!');
            const text = response.data.choices?.[0]?.message?.content;
            console.log('응답:', text);

            return {
                success: true,
                endpoint: 'OpenAI Compatible',
                model: 'qwen-turbo',
                apiKey: apiKey
            };
        }
    } catch (error) {
        console.log(`❌ OpenAI Compatible 실패: ${error.response?.data?.error?.message || error.message}`);
    }

    return { success: false };
}

async function main() {
    const result = await testNewQwenKey();

    console.log('\n========================================');
    if (result.success) {
        console.log('✅ Qwen API 연결 성공!');
        console.log(`\n작동 정보:`);
        console.log(`- 엔드포인트: ${result.endpoint}`);
        console.log(`- 모델: ${result.model}`);
        console.log(`- Workspace: ${result.workspace || 'N/A'}`);

        console.log('\n.env 업데이트:');
        console.log(`DASHSCOPE_API_KEY=${result.apiKey}`);
        console.log(`DASHSCOPE_MODEL=${result.model}`);
        console.log(`DASHSCOPE_WORKSPACE_NAME=${result.workspace || 'math-palantir'}`);
        console.log(`DASHSCOPE_ENDPOINT=${result.endpoint}`);
    } else {
        console.log('❌ 새 API 키도 실패');
        console.log('\n확인사항:');
        console.log('1. API 키가 정확히 복사되었는지');
        console.log('2. Model Studio에서 키가 활성화 상태인지');
        console.log('3. 계정에 크레딧이 있는지');
        console.log('4. Workspace 이름이 맞는지 (math-palantir)');
    }
}

main().catch(console.error);