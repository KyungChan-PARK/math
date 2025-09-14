#!/usr/bin/env node

/**
 * 수학 문제 생성 서비스
 * Gemini와 Qwen API를 사용한 수학 문제 자동 생성
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Firestore } = require('@google-cloud/firestore');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const firestore = new Firestore({
    projectId: process.env.GCP_PROJECT_ID || 'math-project-472006',
    databaseId: 'palantir-math',
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// Qwen API 호출 함수
async function callQwenAPI(messages, maxTokens = 500) {
    const endpoint = process.env.DASHSCOPE_ENDPOINT || 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    const model = process.env.DASHSCOPE_MODEL || 'qwen3-max-preview';
    const apiKey = process.env.DASHSCOPE_API_KEY;

    try {
        const response = await axios.post(
            endpoint,
            {
                model: model,
                input: { messages },
                parameters: {
                    max_tokens: maxTokens,
                    temperature: 0.7,
                    result_format: 'message'
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

        return response.data.output?.text || response.data.output?.choices?.[0]?.message?.content;
    } catch (error) {
        console.error('Qwen API Error:', error.response?.data || error.message);
        throw error;
    }
}

// Gemini로 수학 문제 생성
async function generateWithGemini(grade, topic, difficulty, count) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    Generate ${count} math problems for grade ${grade} students.
    Topic: ${topic}
    Difficulty: ${difficulty}

    Return ONLY a valid JSON array with this exact format:
    [
        {
            "question": "problem statement",
            "answer": "correct answer",
            "explanation": "step by step solution",
            "difficulty": "${difficulty}"
        }
    ]
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // JSON 추출
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse Gemini response');
}

// Qwen으로 수학 문제 생성
async function generateWithQwen(grade, topic, difficulty, count) {
    const messages = [
        {
            role: 'system',
            content: '당신은 수학 교사입니다. 주어진 조건에 맞는 수학 문제를 JSON 배열 형식으로 생성하세요.'
        },
        {
            role: 'user',
            content: `
학년: ${grade}학년
주제: ${topic}
난이도: ${difficulty}
개수: ${count}개

다음 JSON 형식으로 정확히 ${count}개의 문제를 생성하세요:
[
    {
        "question": "문제",
        "answer": "정답",
        "explanation": "풀이 과정",
        "difficulty": "${difficulty}"
    }
]`
        }
    ];

    const response = await callQwenAPI(messages, 1000);

    // JSON 추출
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse Qwen response');
}

// 문제 생성 엔드포인트
app.post('/generate', async (req, res) => {
    try {
        const {
            grade = 6,
            topic = 'algebra',
            difficulty = 'medium',
            count = 5,
            model = 'auto'  // 'gemini', 'qwen', 'auto'
        } = req.body;

        console.log(`Generating ${count} ${difficulty} ${topic} problems for grade ${grade} using ${model}`);

        let problems;
        let usedModel;

        if (model === 'gemini') {
            problems = await generateWithGemini(grade, topic, difficulty, count);
            usedModel = 'gemini-1.5-flash';
        } else if (model === 'qwen') {
            problems = await generateWithQwen(grade, topic, difficulty, count);
            usedModel = 'qwen3-max-preview';
        } else {
            // Auto: Qwen 먼저 시도, 실패시 Gemini
            try {
                problems = await generateWithQwen(grade, topic, difficulty, count);
                usedModel = 'qwen3-max-preview';
            } catch (error) {
                console.log('Qwen failed, falling back to Gemini');
                problems = await generateWithGemini(grade, topic, difficulty, count);
                usedModel = 'gemini-1.5-flash';
            }
        }

        // Firestore에 저장
        const sessionId = `session_${Date.now()}`;
        await firestore.collection('math_problems').doc(sessionId).set({
            grade,
            topic,
            difficulty,
            count,
            problems,
            model: usedModel,
            createdAt: new Date().toISOString()
        });

        res.json({
            success: true,
            sessionId,
            grade,
            topic,
            difficulty,
            count,
            model: usedModel,
            problems
        });

    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 세션 조회 엔드포인트
app.get('/session/:id', async (req, res) => {
    try {
        const doc = await firestore.collection('math_problems').doc(req.params.id).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }

        res.json({
            success: true,
            data: doc.data()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 헬스체크
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        apis: {
            gemini: !!process.env.GEMINI_API_KEY,
            qwen: !!process.env.DASHSCOPE_API_KEY,
            firestore: !!process.env.GCP_PROJECT_ID
        }
    });
});

// 서버 시작
const PORT = process.env.PORT || 8100;
app.listen(PORT, () => {
    console.log(`✨ Math Generator Service running on port ${PORT}`);
    console.log(`📊 APIs configured:`);
    console.log(`   - Gemini: ${process.env.GEMINI_API_KEY ? '✓' : '✗'}`);
    console.log(`   - Qwen: ${process.env.DASHSCOPE_API_KEY ? '✓' : '✗'}`);
    console.log(`   - Firestore: ${process.env.GCP_PROJECT_ID || 'math-project-472006'}`);
});