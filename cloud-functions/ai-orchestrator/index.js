/**
 * Google Cloud Functions - AI Orchestrator
 * 서버리스 아키텍처로 전환된 AI 협업 시스템
 * 비용 최적화 및 자동 스케일링 지원
 */

const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');
const { PubSub } = require('@google-cloud/pubsub');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const axios = require('axios');

// Initialize services
const firestore = new Firestore();
const pubsub = new PubSub();
const secretManager = new SecretManagerServiceClient();

// Cache for API keys
let apiKeysCache = null;
let cacheExpiry = 0;

/**
 * API 키 로드 (Secret Manager 사용)
 */
async function loadAPIKeys() {
    const now = Date.now();
    if (apiKeysCache && now < cacheExpiry) {
        return apiKeysCache;
    }

    const projectId = process.env.GCP_PROJECT || 'math-project-472006';
    
    try {
        const [qwenSecret] = await secretManager.accessSecretVersion({
            name: `projects/${projectId}/secrets/qwen-api-key/versions/latest`
        });
        
        const [geminiSecret] = await secretManager.accessSecretVersion({
            name: `projects/${projectId}/secrets/gemini-api-key/versions/latest`
        });

        apiKeysCache = {
            qwen: qwenSecret.payload.data.toString(),
            gemini: geminiSecret.payload.data.toString()
        };
        
        cacheExpiry = now + 3600000; // 1시간 캐시
        return apiKeysCache;
    } catch (error) {
        console.error('API 키 로드 실패:', error);
        throw error;
    }
}

/**
 * 메인 오케스트레이터 함수 (HTTP 트리거)
 */
functions.http('orchestrateAI', async (req, res) => {
    // CORS 설정
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }

    try {
        const { task, context, priority = 'normal' } = req.body;
        
        if (!task) {
            return res.status(400).json({ error: 'Task is required' });
        }

        // 요청 ID 생성
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Firestore에 요청 기록
        await firestore.collection('ai_requests').doc(requestId).set({
            task,
            context,
            priority,
            status: 'processing',
            createdAt: new Date(),
            source: 'http'
        });

        // 비동기 처리를 위해 Pub/Sub에 발행
        const topic = pubsub.topic('ai-orchestration');
        await topic.publishMessage({
            json: {
                requestId,
                task,
                context,
                priority
            }
        });

        // 즉시 응답 반환 (비동기 처리)
        res.status(202).json({
            requestId,
            status: 'accepted',
            message: 'Request queued for processing',
            resultUrl: `/api/results/${requestId}`
        });

    } catch (error) {
        console.error('Orchestration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Pub/Sub 트리거 함수 - 실제 AI 처리
 */
functions.cloudEvent('processAITask', async (cloudEvent) => {
    const { requestId, task, context, priority } = cloudEvent.data.message.json;
    
    console.log(`Processing task ${requestId} with priority ${priority}`);
    
    try {
        // API 키 로드
        const apiKeys = await loadAPIKeys();
        
        // 병렬 AI 처리
        const [qwenResponse, geminiResponse] = await Promise.allSettled([
            processWithQwen(task, context, apiKeys.qwen),
            processWithGemini(task, context, apiKeys.gemini)
        ]);

        // 결과 통합
        const result = mergeResponses(qwenResponse, geminiResponse);
        
        // Firestore에 결과 저장
        await firestore.collection('ai_requests').doc(requestId).update({
            status: 'completed',
            result,
            completedAt: new Date(),
            processingTime: Date.now() - parseInt(requestId.split('_')[1])
        });

        // 실시간 알림 (선택적)
        if (priority === 'high') {
            await notifyCompletion(requestId, result);
        }

    } catch (error) {
        console.error(`Error processing task ${requestId}:`, error);
        
        // 에러 상태 업데이트
        await firestore.collection('ai_requests').doc(requestId).update({
            status: 'failed',
            error: error.message,
            failedAt: new Date()
        });
    }
});

/**
 * Qwen API 처리
 */
async function processWithQwen(task, context, apiKey) {
    try {
        const response = await axios.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                model: 'qwen-max',
                input: {
                    messages: [
                        { role: 'system', content: 'You are a helpful AI assistant specialized in mathematics education.' },
                        { role: 'user', content: `Task: ${task}\nContext: ${JSON.stringify(context)}` }
                    ]
                },
                parameters: {
                    max_tokens: 2000,
                    temperature: 0.7
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        return {
            model: 'qwen',
            response: response.data.output.text,
            confidence: 0.6 // 가중치
        };
    } catch (error) {
        console.error('Qwen API error:', error);
        throw error;
    }
}

/**
 * Gemini API 처리
 */
async function processWithGemini(task, context, apiKey) {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: `Task: ${task}\nContext: ${JSON.stringify(context)}`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 2000,
                    temperature: 0.7
                }
            },
            {
                timeout: 30000
            }
        );

        return {
            model: 'gemini',
            response: response.data.candidates[0].content.parts[0].text,
            confidence: 0.4 // 가중치
        };
    } catch (error) {
        console.error('Gemini API error:', error);
        throw error;
    }
}

/**
 * 응답 통합 (가중 평균)
 */
function mergeResponses(qwenResult, geminiResult) {
    const responses = [];
    let finalResponse = '';

    if (qwenResult.status === 'fulfilled') {
        responses.push(qwenResult.value);
    }
    
    if (geminiResult.status === 'fulfilled') {
        responses.push(geminiResult.value);
    }

    if (responses.length === 0) {
        throw new Error('All AI models failed');
    }

    // 가중치 기반 선택 또는 통합
    if (responses.length === 1) {
        finalResponse = responses[0].response;
    } else {
        // 더 높은 가중치를 가진 응답 선택
        finalResponse = responses.reduce((prev, curr) => 
            curr.confidence > prev.confidence ? curr : prev
        ).response;
    }

    return {
        finalResponse,
        models: responses.map(r => r.model),
        timestamp: new Date().toISOString()
    };
}

/**
 * 완료 알림
 */
async function notifyCompletion(requestId, result) {
    // Firestore 실시간 업데이트를 통한 알림
    await firestore.collection('notifications').add({
        requestId,
        type: 'completion',
        result: result.finalResponse.substring(0, 100) + '...',
        createdAt: new Date()
    });
}

/**
 * 결과 조회 함수 (HTTP)
 */
functions.http('getResult', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    
    const requestId = req.path.split('/').pop();
    
    if (!requestId) {
        return res.status(400).json({ error: 'Request ID required' });
    }

    try {
        const doc = await firestore.collection('ai_requests').doc(requestId).get();
        
        if (!doc.exists) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const data = doc.data();
        res.json({
            requestId,
            status: data.status,
            result: data.result,
            processingTime: data.processingTime,
            timestamp: data.completedAt || data.createdAt
        });

    } catch (error) {
        console.error('Error fetching result:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * 헬스체크 함수
 */
functions.http('health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'ai-orchestrator',
        version: '2.0.0',
        serverless: true,
        timestamp: new Date().toISOString()
    });
});