#!/usr/bin/env node

/**
 * 빠른 GCP Firestore 연동 테스트
 * 실시간으로 문제를 저장하고 읽기
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

class GCPRealTimeTest {
    constructor() {
        // Firestore 초기화 (기본 인증 사용)
        try {
            initializeApp({
                projectId: 'math-project-472006'
            });
            this.db = getFirestore();
            console.log(colors.green + '✅ Firestore 연결 성공' + colors.reset);
        } catch (error) {
            console.log(colors.red + '❌ Firestore 연결 실패: ' + error.message + colors.reset);
            this.db = null;
        }
        
        // Gemini 초기화
        if (process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        }
    }
    
    async testFirestore() {
        if (!this.db) {
            console.log(colors.yellow + '⚠️ Firestore를 사용할 수 없습니다' + colors.reset);
            return false;
        }
        
        console.log(colors.cyan + '\n📝 Firestore 실시간 테스트...' + colors.reset);
        
        try {
            // 1. 문제 생성 및 저장
            const problemData = {
                unit: 'algebra2_unit2',
                topic: '함수 변환',
                problem: 'f(x) = x²에서 g(x) = 2f(x-3) + 1의 꼭짓점은?',
                choices: ['(3, 1)', '(-3, 1)', '(3, -1)', '(-3, -1)'],
                correct: 0,
                difficulty: 3,
                created: new Date(),
                status: 'pending_review',
                source: 'test_script'
            };
            
            console.log('문제 저장 중...');
            const docRef = await this.db.collection('problems').add(problemData);
            console.log(colors.green + `✅ 문제 저장 완료! ID: ${docRef.id}` + colors.reset);
            
            // 2. 저장된 문제 읽기
            console.log('\n문제 읽기 중...');
            const doc = await docRef.get();
            if (doc.exists) {
                console.log(colors.green + '✅ 문제 읽기 성공:' + colors.reset);
                console.log(doc.data());
            }
            
            // 3. 실시간 리스너 설정
            console.log('\n실시간 모니터링 시작 (5초간)...');
            const unsubscribe = this.db.collection('problems')
                .where('status', '==', 'pending_review')
                .onSnapshot(snapshot => {
                    console.log(colors.cyan + `📊 대기 중인 문제: ${snapshot.size}개` + colors.reset);
                });
            
            // 5초 후 리스너 해제
            setTimeout(() => {
                unsubscribe();
                console.log('모니터링 종료');
            }, 5000);
            
            return true;
        } catch (error) {
            console.log(colors.red + '❌ Firestore 오류: ' + error.message + colors.reset);
            return false;
        }
    }
    
    async testGeminiWithFirestore() {
        if (!this.model || !this.db) {
            console.log(colors.yellow + '⚠️ Gemini 또는 Firestore를 사용할 수 없습니다' + colors.reset);
            return;
        }
        
        console.log(colors.cyan + '\n🤖 Gemini + Firestore 통합 테스트...' + colors.reset);
        
        try {
            // Gemini로 문제 생성
            const prompt = 'Generate a simple SAT math problem about quadratic functions';
            const result = await this.model.generateContent(prompt);
            const problemText = result.response.text();
            
            console.log('AI 생성 문제:', problemText.substring(0, 100) + '...');
            
            // Firestore에 저장
            const docRef = await this.db.collection('ai_problems').add({
                content: problemText,
                model: 'gemini-1.5-flash',
                created: new Date(),
                status: 'auto_generated'
            });
            
            console.log(colors.green + `✅ AI 문제 저장 완료! ID: ${docRef.id}` + colors.reset);
            
        } catch (error) {
            console.log(colors.red + '❌ 통합 테스트 실패: ' + error.message + colors.reset);
        }
    }
    
    async getStatistics() {
        if (!this.db) return;
        
        console.log(colors.cyan + '\n📊 Firestore 통계...' + colors.reset);
        
        try {
            const collections = ['problems', 'reviews', 'students', 'ai_problems'];
            
            for (const collection of collections) {
                const snapshot = await this.db.collection(collection).limit(100).get();
                console.log(`${collection}: ${snapshot.size}개 문서`);
            }
        } catch (error) {
            console.log('통계 조회 실패');
        }
    }
    
    async run() {
        console.log(colors.cyan + '=== GCP 실시간 연동 테스트 ===' + colors.reset);
        console.log('프로젝트: math-project-472006\n');
        
        // Firestore 테스트
        const firestoreWorks = await this.testFirestore();
        
        if (firestoreWorks) {
            // Gemini + Firestore 통합 테스트
            await this.testGeminiWithFirestore();
            
            // 통계 확인
            await this.getStatistics();
            
            console.log(colors.green + '\n🎉 GCP 실시간 연동 성공!' + colors.reset);
            console.log('모든 데이터가 Firestore에 실시간으로 저장되고 있습니다.');
        } else {
            console.log(colors.red + '\n❌ GCP 연동 실패' + colors.reset);
            console.log('인증 설정을 확인해주세요.');
        }
        
        // 5초 후 종료
        setTimeout(() => {
            console.log('\n테스트 종료');
            process.exit(0);
        }, 6000);
    }
}

// 실행
const tester = new GCPRealTimeTest();
tester.run().catch(console.error);