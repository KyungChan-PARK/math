#!/usr/bin/env node

const axios = require('axios');

async function testQwenWorkspace() {
    console.log('🐉 Qwen Model Studio API 테스트\n');

    const apiKey = 'sk-667a2e400b824e548c7e1122e99243de';
    const workspaceId = 'llm-odu1qthidmjab4c9';
    const workspaceName = 'palantir-math';

    console.log('Workspace:', workspaceName);
    console.log('Workspace ID:', workspaceId);
    console.log('API Key:', apiKey.substring(0, 25) + '...\n');

    // 테스트할 모델들
    const models = [
        'qwen-turbo',
        'qwen-plus',
        'qwen-max',
        'qwen-7b-chat',
        'qwen-14b-chat',
        'qwen-72b-chat',
        'qwen1.5-7b-chat',
        'qwen1.5-14b-chat',
        'qwen1.5-72b-chat',
        'qwen2-7b-instruct',
        'qwen2-72b-instruct'
    ];

    let workingModel = null;

    for (const model of models) {
        console.log(`테스트: ${model}`);

        try {
            const response = await axios.post(
                'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                {
                    model: model,
                    input: {
                        messages: [
                            {
                                role: 'user',
                                content: 'Reply with "Hello from Qwen" in exactly 4 words'
                            }
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
                        'Content-Type': 'application/json',
                        'X-Workspace-Id': workspaceId  // Workspace ID 추가
                    },
                    timeout: 15000
                }
            );

            if (response.data && response.data.output) {
                console.log(`✅ ${model} 성공!`);
                const text = response.data.output.text ||
                           response.data.output.choices?.[0]?.message?.content ||
                           response.data.output.finish_reason;
                console.log('응답:', text);

                if (response.data.usage) {
                    console.log('토큰 사용:', response.data.usage);
                }

                workingModel = model;
                break;
            }
        } catch (error) {
            if (error.response) {
                const errorMsg = error.response.data?.message ||
                               error.response.data?.error?.message ||
                               error.response.statusText;
                console.log(`❌ 실패: ${errorMsg}`);

                // 400 에러는 모델이 없다는 의미일 수 있음
                if (error.response.status === 400) {
                    console.log('   (모델이 존재하지 않거나 접근 권한 없음)');
                }
            } else {
                console.log(`❌ 네트워크 오류: ${error.message}`);
            }
        }
        console.log('');
    }

    // 수학 문제 생성 테스트
    if (workingModel) {
        console.log('\n📐 수학 문제 생성 테스트');
        console.log(`사용 모델: ${workingModel}\n`);

        try {
            const response = await axios.post(
                'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                {
                    model: workingModel,
                    input: {
                        messages: [
                            {
                                role: 'system',
                                content: '당신은 수학 교사입니다. JSON 형식으로 답변하세요.'
                            },
                            {
                                role: 'user',
                                content: `초등학교 6학년 수준의 일차방정식 문제 1개를 다음 JSON 형식으로 만들어주세요:
{
  "question": "문제",
  "answer": "정답",
  "explanation": "풀이 과정"
}`
                            }
                        ]
                    },
                    parameters: {
                        max_tokens: 300,
                        temperature: 0.7
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'X-Workspace-Id': workspaceId
                    },
                    timeout: 15000
                }
            );

            if (response.data && response.data.output) {
                console.log('✅ 수학 문제 생성 성공!');
                const text = response.data.output.text ||
                           response.data.output.choices?.[0]?.message?.content;
                console.log('\n생성된 문제:');
                console.log(text);
            }
        } catch (error) {
            console.log('❌ 수학 문제 생성 실패:', error.response?.data?.message || error.message);
        }
    }

    console.log('\n========================================');
    if (workingModel) {
        console.log('✅ Qwen API 작동 확인!');
        console.log(`작동 모델: ${workingModel}`);
        console.log('\n환경 변수 설정 완료:');
        console.log(`DASHSCOPE_API_KEY=${apiKey}`);
        console.log(`DASHSCOPE_WORKSPACE_ID=${workspaceId}`);
        console.log(`DASHSCOPE_MODEL=${workingModel}`);
    } else {
        console.log('❌ 모든 모델 테스트 실패');
        console.log('\n가능한 원인:');
        console.log('1. API 키가 유효하지 않음');
        console.log('2. Workspace ID가 올바르지 않음');
        console.log('3. 계정에 사용 가능한 모델이 없음');
        console.log('4. 크레딧이 부족함');
    }
}

testQwenWorkspace().catch(console.error);