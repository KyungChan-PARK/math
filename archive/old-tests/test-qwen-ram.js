#!/usr/bin/env node

const axios = require('axios');

async function testQwenWithRAM() {
    console.log('🐉 Qwen API 테스트 (RAM ID 사용)\n');

    const ramId = '5399657396183158';
    const apiKey = 'sk-667a2e400b824e548c7e1122e99243de';
    const workspaceId = 'llm-odu1qthidmjab4c9';

    console.log('RAM ID (Login Name):', ramId);
    console.log('API Key:', apiKey.substring(0, 30) + '...');
    console.log('Workspace ID:', workspaceId, '\n');

    // RAM 인증 형식 테스트
    const authVariations = [
        {
            name: 'Standard Bearer Token',
            auth: `Bearer ${apiKey}`
        },
        {
            name: 'RAM ID Prefix',
            auth: `Bearer ${ramId}:${apiKey}`
        },
        {
            name: 'RAM Format',
            auth: `RAM ${ramId}:${apiKey}`
        },
        {
            name: 'Basic Auth Style',
            auth: `Basic ${Buffer.from(`${ramId}:${apiKey}`).toString('base64')}`
        }
    ];

    // 다양한 헤더 조합
    for (const authVar of authVariations) {
        console.log(`\n📍 인증 방식: ${authVar.name}`);

        const headerSets = [
            {
                name: 'Simple',
                headers: {
                    'Authorization': authVar.auth,
                    'Content-Type': 'application/json'
                }
            },
            {
                name: 'With RAM Headers',
                headers: {
                    'Authorization': authVar.auth,
                    'Content-Type': 'application/json',
                    'X-DashScope-RAM-Id': ramId,
                    'X-RAM-Id': ramId
                }
            },
            {
                name: 'Full Headers',
                headers: {
                    'Authorization': authVar.auth,
                    'Content-Type': 'application/json',
                    'X-DashScope-WorkSpace': workspaceId,
                    'X-DashScope-RAM-Id': ramId,
                    'X-DashScope-Account-Id': ramId,
                    'X-Account-Id': ramId
                }
            }
        ];

        for (const headerSet of headerSets) {
            console.log(`  테스트: ${headerSet.name}`);

            try {
                const response = await axios.post(
                    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                    {
                        model: 'qwen-turbo',
                        input: {
                            messages: [
                                { role: 'user', content: 'Hello' }
                            ]
                        },
                        parameters: {
                            max_tokens: 10,
                            temperature: 0.7
                        }
                    },
                    {
                        headers: headerSet.headers,
                        timeout: 10000
                    }
                );

                if (response.data) {
                    console.log(`  ✅ 성공!`);
                    const text = response.data.output?.text ||
                               response.data.output?.choices?.[0]?.message?.content;
                    console.log(`  응답: ${text}`);

                    console.log('\n✨ 작동 인증 발견!');
                    console.log('Authorization:', authVar.auth);
                    console.log('Headers:', JSON.stringify(headerSet.headers, null, 2));

                    // 수학 문제 생성 테스트
                    console.log('\n📐 수학 문제 생성 테스트...');
                    const mathResponse = await axios.post(
                        'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                        {
                            model: 'qwen-turbo',
                            input: {
                                messages: [
                                    {
                                        role: 'system',
                                        content: '당신은 수학 교사입니다. JSON 형식으로 답변하세요.'
                                    },
                                    {
                                        role: 'user',
                                        content: '초등학교 6학년 일차방정식 문제 1개를 JSON으로: {"question": "...", "answer": "...", "explanation": "..."}'
                                    }
                                ]
                            },
                            parameters: {
                                max_tokens: 200,
                                temperature: 0.7
                            }
                        },
                        {
                            headers: headerSet.headers,
                            timeout: 15000
                        }
                    );

                    if (mathResponse.data) {
                        console.log('✅ 수학 문제 생성 성공!');
                        const mathText = mathResponse.data.output?.text ||
                                       mathResponse.data.output?.choices?.[0]?.message?.content;
                        console.log('생성된 문제:', mathText);
                    }

                    return {
                        success: true,
                        auth: authVar.auth,
                        headers: headerSet.headers
                    };
                }
            } catch (error) {
                if (error.response) {
                    const errorMsg = error.response.data?.message ||
                                   error.response.data?.error?.message ||
                                   error.response.data?.code ||
                                   error.response.statusText;
                    console.log(`  ❌ 실패: ${errorMsg}`);
                } else {
                    console.log(`  ❌ 네트워크 오류: ${error.message}`);
                }
            }
        }
    }

    // International Edition도 테스트
    console.log('\n\n📍 International Edition 테스트');

    try {
        const response = await axios.post(
            'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                model: 'qwen-turbo',
                input: {
                    messages: [
                        { role: 'user', content: 'Hello' }
                    ]
                },
                parameters: {
                    max_tokens: 10
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${ramId}:${apiKey}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-RAM-Id': ramId,
                    'X-DashScope-WorkSpace': workspaceId
                },
                timeout: 10000
            }
        );

        if (response.data) {
            console.log('✅ International Edition 성공!');
            return { success: true, endpoint: 'International' };
        }
    } catch (error) {
        console.log(`❌ International 실패: ${error.response?.data?.message || error.message}`);
    }

    return { success: false };
}

async function main() {
    const result = await testQwenWithRAM();

    console.log('\n========================================');
    if (result.success) {
        console.log('✅ Qwen API 연결 성공!');
        console.log('\n작동 설정:');
        if (result.auth) {
            console.log('Authorization:', result.auth);
        }
        if (result.headers) {
            console.log('\n필요한 헤더:');
            console.log(JSON.stringify(result.headers, null, 2));
        }

        console.log('\n.env 업데이트 필요:');
        console.log('DASHSCOPE_RAM_ID=5399657396183158');
    } else {
        console.log('❌ RAM ID를 포함해도 모든 테스트 실패');
        console.log('\n확인 필요:');
        console.log('1. RAM ID가 정확한지 (5399657396183158)');
        console.log('2. API 키가 해당 RAM 계정에서 생성되었는지');
        console.log('3. Model Studio 콘솔에서 API 키 상태 확인');
        console.log('4. 계정 타입 확인 (Main Account vs RAM User)');
    }
}

main().catch(console.error);