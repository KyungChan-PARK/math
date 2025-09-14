#!/usr/bin/env node

/**
 * Cloud Function 로컬 테스트
 * 배포 전 함수 테스트
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Firestore } = require('@google-cloud/firestore');
require('dotenv').config();

// Gemini 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Firestore 초기화
const firestore = new Firestore({
    projectId: 'math-project-472006',
    databaseId: 'palantir-math',
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

async function testMathGenerator() {
    console.log('🔬 수학 문제 생성 함수 테스트\n');

    try {
        // 테스트 요청
        const request = {
            grade: '6',
            topic: '일차방정식',
            difficulty: 'medium',
            count: 3,
            language: 'ko'
        };

        console.log('📋 요청:', request);
        console.log('\n생성 중...\n');

        // Gemini 모델 사용
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
        학년: ${request.grade}학년
        주제: ${request.topic}
        난이도: ${request.difficulty}
        개수: ${request.count}개
        언어: 한국어

        위 조건에 맞는 수학 문제를 JSON 형식으로 생성해주세요.
        형식:
        {
            "problems": [
                {
                    "id": 1,
                    "question": "문제",
                    "answer": "정답",
                    "explanation": "풀이 과정",
                    "difficulty": "난이도"
                }
            ]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // JSON 파싱
        let problems;
        try {
            const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                problems = JSON.parse(jsonMatch[1]);
            } else {
                problems = JSON.parse(response);
            }
        } catch (e) {
            console.log('원본 응답:', response);
            problems = { rawResponse: response };
        }

        console.log('✅ 생성된 문제:\n');
        console.log(JSON.stringify(problems, null, 2));

        // Firestore에 저장 테스트
        if (problems.problems) {
            console.log('\n💾 Firestore 저장 테스트...');
            const docRef = await firestore.collection('math-problems').add({
                ...request,
                problems: problems.problems,
                createdAt: new Date(),
                testMode: true
            });
            console.log('✅ Firestore 저장 성공:', docRef.id);

            // 저장된 문서 읽기
            const doc = await docRef.get();
            console.log('✅ Firestore 읽기 성공');

            // 테스트 문서 삭제
            await docRef.delete();
            console.log('✅ 테스트 문서 삭제 완료');
        }

        console.log('\n✨ 함수 테스트 성공!');
        console.log('배포 준비 완료: ./deploy-function.sh');

    } catch (error) {
        console.error('❌ 오류:', error.message);
    }
}

// 실행
testMathGenerator().catch(console.error);