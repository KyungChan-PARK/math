#!/usr/bin/env node

const axios = require('axios');

async function testQwen() {
    const apiKey = 'sk-f2ab784cfdc7467495fa72ced5477c2a';
    console.log('🐉 Qwen API 테스트 (새 키)\n');
    console.log(`API Key: ${apiKey.substring(0, 25)}...`);

    // 다양한 모델 테스트
    const models = ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen1.5-7b-chat'];

    for (const model of models) {
        console.log(`\n테스트 모델: ${model}`);

        try {
            const response = await axios.post(
                'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                {
                    model: model,
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
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            if (response.data && response.data.output) {
                console.log(`✅ ${model} 성공!`);
                console.log('응답:', response.data.output.text || response.data.output.choices?.[0]?.message?.content);

                // 사용량 정보
                if (response.data.usage) {
                    console.log('토큰 사용:', response.data.usage);
                }

                return { success: true, model, apiKey };
            }
        } catch (error) {
            if (error.response) {
                console.log(`❌ ${model} 실패: ${error.response.data?.message || error.response.status}`);
                if (error.response.data?.code) {
                    console.log(`   코드: ${error.response.data.code}`);
                }
            } else {
                console.log(`❌ ${model} 네트워크 오류: ${error.message}`);
            }
        }
    }

    return { success: false };
}

async function main() {
    const result = await testQwen();

    console.log('\n========================================');
    if (result.success) {
        console.log(`✅ API 키 작동 확인!`);
        console.log(`작동 모델: ${result.model}`);
        console.log(`\n.env 파일 업데이트:`);
        console.log(`DASHSCOPE_API_KEY=${result.apiKey}`);
        console.log(`DASHSCOPE_MODEL=${result.model}`);
    } else {
        console.log('❌ 모든 모델 테스트 실패');
        console.log('\n새 API 키가 유효하지 않거나 권한이 없습니다.');
    }
}

main().catch(console.error);