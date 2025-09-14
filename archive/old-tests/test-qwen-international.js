#!/usr/bin/env node

const axios = require('axios');

async function testQwenInternational() {
    console.log('🌍 Qwen API International Edition 테스트\n');

    const apiKey = 'sk-667a2e400b824e548c7e1122e99243de';
    const workspaceId = 'llm-odu1qthidmjab4c9';

    console.log('API Key:', apiKey.substring(0, 30) + '...');
    console.log('Workspace ID:', workspaceId);
    console.log('Edition: International\n');

    // International Edition 엔드포인트들
    const endpoints = [
        {
            name: 'International DashScope',
            url: 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            region: 'International'
        },
        {
            name: 'Singapore Region',
            url: 'https://dashscope.ap-southeast-1.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            region: 'ap-southeast-1'
        },
        {
            name: 'US Region',
            url: 'https://dashscope.us-west-1.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            region: 'us-west-1'
        },
        {
            name: 'OpenAI Compatible International',
            url: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
            region: 'International',
            isOpenAI: true
        }
    ];

    // 테스트할 모델들
    const models = ['qwen-turbo', 'qwen-plus', 'qwen-max'];

    for (const endpoint of endpoints) {
        console.log(`\n📍 테스트: ${endpoint.name}`);
        console.log(`Region: ${endpoint.region}`);
        console.log(`URL: ${endpoint.url}\n`);

        for (const model of models) {
            console.log(`  모델: ${model}`);

            try {
                let requestBody;
                let headers = {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                };

                // Workspace ID 추가 시도
                const headersWithWorkspace = {
                    ...headers,
                    'X-DashScope-WorkSpace': workspaceId,
                    'X-Workspace-Id': workspaceId
                };

                if (endpoint.isOpenAI) {
                    // OpenAI 호환 형식
                    requestBody = {
                        model: model,
                        messages: [
                            { role: 'user', content: 'Say hello in 3 words' }
                        ],
                        max_tokens: 20,
                        temperature: 0.7
                    };
                } else {
                    // DashScope 형식
                    requestBody = {
                        model: model,
                        input: {
                            messages: [
                                { role: 'user', content: 'Say hello in 3 words' }
                            ]
                        },
                        parameters: {
                            max_tokens: 20,
                            temperature: 0.7,
                            result_format: 'message'
                        }
                    };
                }

                // 먼저 Workspace 헤더 없이 시도
                let response;
                try {
                    response = await axios.post(endpoint.url, requestBody, {
                        headers: headers,
                        timeout: 10000
                    });
                } catch (error) {
                    if (error.response?.status === 401) {
                        // Workspace 헤더와 함께 재시도
                        console.log('    Workspace 헤더 추가 후 재시도...');
                        response = await axios.post(endpoint.url, requestBody, {
                            headers: headersWithWorkspace,
                            timeout: 10000
                        });
                    } else {
                        throw error;
                    }
                }

                if (response && response.data) {
                    console.log(`  ✅ ${model} 성공!`);

                    // 응답 파싱
                    const text = response.data.output?.text ||
                               response.data.output?.choices?.[0]?.message?.content ||
                               response.data.choices?.[0]?.message?.content ||
                               response.data.text;

                    console.log(`  응답: ${text || JSON.stringify(response.data).substring(0, 100)}`);

                    if (response.data.usage) {
                        console.log(`  토큰: 입력=${response.data.usage.input_tokens}, 출력=${response.data.usage.output_tokens}`);
                    }

                    // 수학 문제 생성 테스트
                    console.log('\n  📐 수학 문제 생성 테스트...');
                    const mathRequest = endpoint.isOpenAI ? {
                        model: model,
                        messages: [
                            {
                                role: 'system',
                                content: 'You are a math teacher. Generate problems in JSON format.'
                            },
                            {
                                role: 'user',
                                content: 'Create one simple algebra equation problem for grade 6 in JSON: {"question": "...", "answer": "...", "explanation": "..."}'
                            }
                        ],
                        max_tokens: 200
                    } : {
                        model: model,
                        input: {
                            messages: [
                                {
                                    role: 'system',
                                    content: '당신은 수학 교사입니다. JSON 형식으로 문제를 생성하세요.'
                                },
                                {
                                    role: 'user',
                                    content: '초등학교 6학년 일차방정식 문제 1개를 JSON으로: {"question": "...", "answer": "...", "explanation": "..."}'
                                }
                            ]
                        },
                        parameters: {
                            max_tokens: 200
                        }
                    };

                    const mathResponse = await axios.post(endpoint.url, mathRequest, {
                        headers: response.config.headers, // 성공한 헤더 재사용
                        timeout: 15000
                    });

                    if (mathResponse.data) {
                        console.log('  ✅ 수학 문제 생성 성공!');
                        const mathText = mathResponse.data.output?.text ||
                                       mathResponse.data.output?.choices?.[0]?.message?.content ||
                                       mathResponse.data.choices?.[0]?.message?.content;
                        console.log('  생성된 문제:', mathText ? mathText.substring(0, 200) : '...');
                    }

                    return {
                        success: true,
                        endpoint: endpoint.name,
                        url: endpoint.url,
                        model: model,
                        region: endpoint.region
                    };
                }
            } catch (error) {
                if (error.response) {
                    const errorMsg = error.response.data?.message ||
                                   error.response.data?.error?.message ||
                                   error.response.data?.code ||
                                   error.response.statusText;
                    console.log(`  ❌ ${model} 실패: ${errorMsg}`);
                } else {
                    console.log(`  ❌ ${model} 네트워크 오류: ${error.message}`);
                }
            }
        }
    }

    return { success: false };
}

async function main() {
    const result = await testQwenInternational();

    console.log('\n========================================');
    if (result.success) {
        console.log('✅ Qwen International API 연결 성공!');
        console.log(`\n작동 정보:`);
        console.log(`- 엔드포인트: ${result.endpoint}`);
        console.log(`- Region: ${result.region}`);
        console.log(`- 모델: ${result.model}`);
        console.log(`- URL: ${result.url}`);
        console.log('\n.env 업데이트 필요:');
        console.log(`DASHSCOPE_ENDPOINT=${result.url}`);
        console.log(`DASHSCOPE_MODEL=${result.model}`);
    } else {
        console.log('❌ 모든 International 엔드포인트 실패');
        console.log('\n확인사항:');
        console.log('1. Model Studio가 International Edition인지 확인');
        console.log('2. API 키가 International Edition용인지 확인');
        console.log('3. 지역 설정 확인 (China 외 지역)');
        console.log('4. https://modelstudio.console.aliyun.com 에서 확인');
    }
}

main().catch(console.error);