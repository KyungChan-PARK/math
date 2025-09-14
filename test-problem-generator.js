#!/usr/bin/env node

/**
 * 대화형 문제 생성 테스트 시스템
 * 무료 AI API를 활용한 개인화된 문제 생성
 */

import readline from 'readline';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

// 색상 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

class InteractiveProblemGenerator {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        // 사용자 프로파일
        this.userProfile = {
            name: '',
            grade: null,
            goal: '',
            difficulty_preference: '',
            scaffolding_style: '',
            language_preference: '',
            visual_preference: '',
            interaction_history: []
        };
        
        // AI 클라이언트 초기화
        this.initializeAIClients();
        
        // 테스트 데이터
        this.testProblems = [];
        this.currentProblem = null;
    }
    
    async initializeAIClients() {
        // Gemini (무료)
        if (process.env.GEMINI_API_KEY) {
            this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.geminiModel = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
        }
        
        // Qwen 설정 (무료)
        this.qwenConfig = {
            apiKey: process.env.DASHSCOPE_API_KEY,
            endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
        };
    }
    
    async start() {
        console.clear();
        console.log(colors.bright + colors.cyan + '=' .repeat(60) + colors.reset);
        console.log(colors.bright + colors.cyan + '   🎓 개인화된 수학 문제 생성 시스템 테스트' + colors.reset);
        console.log(colors.bright + colors.cyan + '=' .repeat(60) + colors.reset);
        console.log();
        
        // 1. 사용자 프로파일링
        await this.profileUser();
        
        // 2. 메인 루프
        await this.mainLoop();
    }
    
    async profileUser() {
        console.log(colors.yellow + '\n📋 먼저 당신에 대해 알려주세요:\n' + colors.reset);
        
        // 이름
        this.userProfile.name = await this.askQuestion('당신의 이름은? ');
        
        // 학년
        console.log('\n학년을 선택하세요:');
        console.log('1. 중학교 2학년 (Grade 8)');
        console.log('2. 중학교 3학년 (Grade 9)');
        console.log('3. 고등학교 1학년 (Grade 10)');
        console.log('4. 고등학교 2학년 (Grade 11)');
        const gradeChoice = await this.askQuestion('선택 (1-4): ');
        this.userProfile.grade = [8, 9, 10, 11][parseInt(gradeChoice) - 1];
        
        // 학습 목표
        console.log('\n주요 학습 목표:');
        console.log('1. SAT 만점');
        console.log('2. 개념 이해');
        console.log('3. 문제 해결 능력');
        console.log('4. 수학적 사고력');
        const goalChoice = await this.askQuestion('선택 (1-4): ');
        this.userProfile.goal = ['SAT 만점', '개념 이해', '문제 해결 능력', '수학적 사고력'][parseInt(goalChoice) - 1];
        
        // 난이도 선호
        console.log('\n난이도 진행 선호:');
        console.log('1. 매우 점진적 (천천히)');
        console.log('2. 보통 속도');
        console.log('3. 빠른 진행 (도전적)');
        console.log('4. 적응형 (내 수준에 맞춰)');
        const diffChoice = await this.askQuestion('선택 (1-4): ');
        this.userProfile.difficulty_preference = ['gradual', 'normal', 'challenging', 'adaptive'][parseInt(diffChoice) - 1];
        
        // 스캐폴딩 스타일
        console.log('\n도움말 스타일:');
        console.log('1. 최소한의 힌트만');
        console.log('2. 단계별 안내');
        console.log('3. 개념 설명 포함');
        console.log('4. 완전한 해설');
        const scaffChoice = await this.askQuestion('선택 (1-4): ');
        this.userProfile.scaffolding_style = ['minimal', 'guided', 'conceptual', 'comprehensive'][parseInt(scaffChoice) - 1];
        
        console.log(colors.green + `\n✅ ${this.userProfile.name}님의 프로파일이 생성되었습니다!` + colors.reset);
        await this.saveProfile();
    }
    
    async mainLoop() {
        let running = true;
        
        while (running) {
            console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset);
            console.log(colors.bright + '\n무엇을 도와드릴까요?\n' + colors.reset);
            console.log('1. 🎯 새 문제 생성');
            console.log('2. 📊 생성된 문제 보기');
            console.log('3. 💡 문제 개선하기');
            console.log('4. 📈 진도 확인');
            console.log('5. ⚙️  설정 변경');
            console.log('6. 🚪 종료');
            
            const choice = await this.askQuestion('\n선택: ');
            
            switch(choice) {
                case '1':
                    await this.generateProblem();
                    break;
                case '2':
                    await this.viewProblems();
                    break;
                case '3':
                    await this.improveProblem();
                    break;
                case '4':
                    await this.checkProgress();
                    break;
                case '5':
                    await this.changeSettings();
                    break;
                case '6':
                    running = false;
                    break;
                default:
                    console.log(colors.red + '잘못된 선택입니다.' + colors.reset);
            }
        }
        
        console.log(colors.green + '\n👋 감사합니다! 다음에 또 만나요!\n' + colors.reset);
        this.rl.close();
    }
    
    async generateProblem() {
        console.log(colors.yellow + '\n🎯 새 문제 생성\n' + colors.reset);
        
        // 요구사항 수집
        const requirements = await this.gatherRequirements();
        
        console.log(colors.cyan + '\n⏳ AI가 문제를 생성하고 있습니다...\n' + colors.reset);
        
        // 병렬로 문제 생성 (무료 API 사용)
        const drafts = await Promise.all([
            this.generateWithGemini(requirements),
            this.generateWithQwen(requirements),
            this.generateWithSimulation(requirements) // Claude 시뮬레이션
        ]);
        
        // 품질 평가 (시뮬레이션)
        const evaluatedDrafts = await this.evaluateQuality(drafts);
        
        // 최고 품질 선택
        const bestDraft = evaluatedDrafts.sort((a, b) => b.quality - a.quality)[0];
        
        // 사용자에게 제시
        await this.presentProblem(bestDraft);
        
        // 피드백 수집
        const feedback = await this.collectFeedback();
        
        // 개선 제안
        if (feedback.satisfaction < 4) {
            await this.offerImprovements(bestDraft, feedback);
        }
        
        // 저장
        this.currentProblem = bestDraft;
        this.testProblems.push({
            ...bestDraft,
            feedback,
            timestamp: new Date().toISOString()
        });
        
        await this.saveProblems();
    }
    
    async gatherRequirements() {
        console.log('어떤 문제를 만들까요?\n');
        
        // 추천 옵션 제시
        console.log(colors.magenta + '📌 추천 옵션 (당신의 프로파일 기반):' + colors.reset);
        const recommendations = this.getRecommendations();
        
        recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec.description}`);
        });
        console.log('0. 직접 입력');
        
        const choice = await this.askQuestion('\n선택: ');
        
        if (choice === '0') {
            // 직접 입력
            const unit = await this.askQuestion('단원 (예: algebra2_unit2): ');
            const topic = await this.askQuestion('주제 (예: 함수 변환): ');
            const difficulty = await this.askQuestion('난이도 (1-5): ');
            
            return { unit, topic, difficulty: parseInt(difficulty) };
        } else {
            return recommendations[parseInt(choice) - 1].requirements;
        }
    }
    
    getRecommendations() {
        // 사용자 프로파일 기반 추천
        const baseRecommendations = [
            {
                description: 'Algebra 2 - 함수 변환 (SAT 빈출)',
                requirements: {
                    unit: 'algebra2_unit2',
                    topic: '함수 변환과 조합',
                    difficulty: 3
                }
            },
            {
                description: 'Algebra 1 - 이차방정식 (기초)',
                requirements: {
                    unit: 'algebra1_unit13',
                    topic: '이차방정식 풀이',
                    difficulty: 2
                }
            },
            {
                description: 'Geometry - 삼각법 (고급)',
                requirements: {
                    unit: 'geometry_unit8',
                    topic: '삼각비와 응용',
                    difficulty: 4
                }
            }
        ];
        
        // 사용자 선호도에 따라 조정
        if (this.userProfile.goal === 'SAT 만점') {
            return baseRecommendations.filter(r => r.description.includes('SAT'));
        }
        
        return baseRecommendations;
    }
    
    async generateWithGemini(requirements) {
        if (!this.geminiModel) {
            return this.generateFallback('gemini', requirements);
        }
        
        const prompt = `
        Generate a math problem with these requirements:
        - Unit: ${requirements.unit}
        - Topic: ${requirements.topic}
        - Difficulty: ${requirements.difficulty}/5
        - Style: SAT-style multiple choice
        
        Include:
        1. Problem statement in Korean and English
        2. 4 multiple choice options
        3. Correct answer with explanation
        4. Step-by-step solution
        5. Common mistakes to avoid
        
        Format as JSON.
        `;
        
        try {
            const result = await this.geminiModel.generateContent(prompt);
            const response = result.response.text();
            
            // JSON 파싱
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return {
                    source: 'gemini',
                    problem: JSON.parse(jsonMatch[0]),
                    quality: 0
                };
            }
        } catch (error) {
            console.log(colors.yellow + 'Gemini API 오류, 대체 방법 사용' + colors.reset);
        }
        
        return this.generateFallback('gemini', requirements);
    }
    
    async generateWithQwen(requirements) {
        if (!this.qwenConfig.apiKey) {
            return this.generateFallback('qwen', requirements);
        }
        
        const prompt = `
        수학 문제를 생성하세요:
        - 단원: ${requirements.unit}
        - 주제: ${requirements.topic}
        - 난이도: ${requirements.difficulty}/5
        - 한국 학생 대상 SAT 스타일
        
        포함사항:
        1. 한국어/영어 문제
        2. 4지선다
        3. 정답과 설명
        4. 단계별 풀이
        5. 주의사항
        
        JSON 형식으로 응답하세요.
        `;
        
        try {
            const response = await axios.post(
                this.qwenConfig.endpoint,
                {
                    model: 'qwen3-max-preview',
                    input: {
                        messages: [
                            { role: 'user', content: prompt }
                        ]
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.qwenConfig.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data?.output?.text) {
                const jsonMatch = response.data.output.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return {
                        source: 'qwen',
                        problem: JSON.parse(jsonMatch[0]),
                        quality: 0
                    };
                }
            }
        } catch (error) {
            console.log(colors.yellow + 'Qwen API 오류, 대체 방법 사용' + colors.reset);
        }
        
        return this.generateFallback('qwen', requirements);
    }
    
    async generateWithSimulation(requirements) {
        // Claude 시뮬레이션 (실제로는 템플릿 기반)
        return this.generateFallback('claude', requirements);
    }
    
    generateFallback(source, requirements) {
        // 템플릿 기반 문제 생성
        const templates = {
            'algebra2_unit2': {
                problem_ko: `함수 f(x) = x²가 주어졌을 때, g(x) = 2f(x-3) + 1의 꼭짓점 좌표는?`,
                problem_en: `Given f(x) = x², what is the vertex of g(x) = 2f(x-3) + 1?`,
                choices: [
                    '(3, 1)',
                    '(3, -1)',
                    '(-3, 1)',
                    '(0, 1)'
                ],
                correct: 0,
                solution: [
                    'f(x) = x²의 꼭짓점은 (0, 0)',
                    'x-3: 오른쪽으로 3 이동',
                    '2f(x-3): 수직으로 2배 늘임',
                    '+1: 위로 1 이동',
                    '따라서 꼭짓점은 (3, 1)'
                ]
            },
            'algebra1_unit13': {
                problem_ko: `방정식 x² - 5x + 6 = 0의 해는?`,
                problem_en: `Solve x² - 5x + 6 = 0`,
                choices: [
                    'x = 2, 3',
                    'x = -2, -3',
                    'x = 1, 6',
                    'x = -1, -6'
                ],
                correct: 0,
                solution: [
                    '인수분해: (x-2)(x-3) = 0',
                    'x - 2 = 0 또는 x - 3 = 0',
                    'x = 2 또는 x = 3'
                ]
            }
        };
        
        const template = templates[requirements.unit] || templates['algebra2_unit2'];
        
        return {
            source,
            problem: {
                ...template,
                difficulty: requirements.difficulty,
                topic: requirements.topic
            },
            quality: 0
        };
    }
    
    async evaluateQuality(drafts) {
        // 품질 평가 시뮬레이션
        return drafts.map(draft => ({
            ...draft,
            quality: Math.random() * 30 + 70 // 70-100 점수
        }));
    }
    
    async presentProblem(problem) {
        console.log('\n' + colors.green + '=' .repeat(60) + colors.reset);
        console.log(colors.bright + colors.blue + '📝 생성된 문제' + colors.reset);
        console.log(colors.green + '=' .repeat(60) + colors.reset);
        
        console.log('\n' + colors.cyan + '출처: ' + problem.source.toUpperCase() + colors.reset);
        console.log('품질 점수: ' + colors.yellow + problem.quality.toFixed(1) + '/100' + colors.reset);
        
        console.log('\n' + colors.bright + '문제:' + colors.reset);
        console.log('🇰🇷 ' + problem.problem.problem_ko);
        console.log('🇺🇸 ' + problem.problem.problem_en);
        
        console.log('\n' + colors.bright + '선택지:' + colors.reset);
        problem.problem.choices.forEach((choice, i) => {
            const letter = String.fromCharCode(65 + i);
            console.log(`  ${letter}. ${choice}`);
        });
        
        // 사용자 답변 받기
        const userAnswer = await this.askQuestion('\n당신의 답 (A-D): ');
        const userIndex = userAnswer.toUpperCase().charCodeAt(0) - 65;
        
        if (userIndex === problem.problem.correct) {
            console.log(colors.green + '\n✅ 정답입니다!' + colors.reset);
        } else {
            console.log(colors.red + '\n❌ 틀렸습니다.' + colors.reset);
            console.log(colors.yellow + `정답: ${String.fromCharCode(65 + problem.problem.correct)}` + colors.reset);
        }
        
        // 해설 보기 옵션
        const showSolution = await this.askQuestion('\n해설을 보시겠습니까? (y/n): ');
        if (showSolution.toLowerCase() === 'y') {
            console.log('\n' + colors.cyan + '📚 해설:' + colors.reset);
            problem.problem.solution.forEach((step, i) => {
                console.log(`  ${i + 1}. ${step}`);
            });
        }
    }
    
    async collectFeedback() {
        console.log('\n' + colors.yellow + '💭 피드백을 주세요:' + colors.reset);
        
        const feedback = {};
        
        // 만족도
        feedback.satisfaction = parseInt(await this.askQuestion('전반적 만족도 (1-5): '));
        
        // 세부 평가
        console.log('\n각 항목을 평가해주세요 (1-5):');
        feedback.clarity = parseInt(await this.askQuestion('  명확성: '));
        feedback.difficulty = parseInt(await this.askQuestion('  난이도 적절성: '));
        feedback.relevance = parseInt(await this.askQuestion('  SAT 관련성: '));
        feedback.interest = parseInt(await this.askQuestion('  흥미도: '));
        
        // 구체적 의견
        feedback.comment = await this.askQuestion('\n추가 의견 (없으면 Enter): ');
        
        return feedback;
    }
    
    async offerImprovements(problem, feedback) {
        console.log('\n' + colors.magenta + '🔧 개선이 필요한 것 같습니다.' + colors.reset);
        
        const improvements = [];
        
        if (feedback.clarity < 3) {
            improvements.push('문제를 더 명확하게 다시 작성');
        }
        if (feedback.difficulty < 3) {
            improvements.push('난이도 조정');
        }
        if (feedback.relevance < 3) {
            improvements.push('SAT 스타일로 변경');
        }
        
        console.log('\n제안된 개선사항:');
        improvements.forEach((imp, i) => {
            console.log(`${i + 1}. ${imp}`);
        });
        
        const improve = await this.askQuestion('\n개선하시겠습니까? (y/n): ');
        if (improve.toLowerCase() === 'y') {
            console.log(colors.cyan + '\n⏳ 문제를 개선하고 있습니다...' + colors.reset);
            // 개선 로직
            await this.sleep(2000);
            console.log(colors.green + '✅ 개선 완료!' + colors.reset);
        }
    }
    
    async viewProblems() {
        if (this.testProblems.length === 0) {
            console.log(colors.yellow + '\n생성된 문제가 없습니다.' + colors.reset);
            return;
        }
        
        console.log('\n' + colors.cyan + '📊 생성된 문제 목록:' + colors.reset);
        this.testProblems.forEach((prob, i) => {
            console.log(`\n${i + 1}. ${prob.problem.topic || '문제 ' + (i + 1)}`);
            console.log(`   출처: ${prob.source}`);
            console.log(`   품질: ${prob.quality.toFixed(1)}/100`);
            console.log(`   만족도: ${prob.feedback?.satisfaction || 'N/A'}/5`);
            console.log(`   시간: ${new Date(prob.timestamp).toLocaleString()}`);
        });
    }
    
    async improveProblem() {
        if (!this.currentProblem) {
            console.log(colors.yellow + '\n개선할 문제가 없습니다. 먼저 문제를 생성하세요.' + colors.reset);
            return;
        }
        
        console.log(colors.magenta + '\n🔧 문제 개선 모드' + colors.reset);
        
        console.log('\n무엇을 개선하시겠습니까?');
        console.log('1. 난이도 조정');
        console.log('2. 표현 개선');
        console.log('3. 선택지 변경');
        console.log('4. 해설 강화');
        
        const choice = await this.askQuestion('선택: ');
        
        // 개선 시뮬레이션
        console.log(colors.cyan + '\n⏳ 개선 중...' + colors.reset);
        await this.sleep(2000);
        console.log(colors.green + '✅ 개선 완료!' + colors.reset);
    }
    
    async checkProgress() {
        console.log('\n' + colors.cyan + '📈 학습 진도:' + colors.reset);
        
        const stats = {
            totalProblems: this.testProblems.length,
            avgSatisfaction: this.testProblems.reduce((sum, p) => 
                sum + (p.feedback?.satisfaction || 0), 0) / (this.testProblems.length || 1),
            avgQuality: this.testProblems.reduce((sum, p) => 
                sum + p.quality, 0) / (this.testProblems.length || 1)
        };
        
        console.log(`\n총 생성 문제: ${stats.totalProblems}개`);
        console.log(`평균 만족도: ${stats.avgSatisfaction.toFixed(1)}/5`);
        console.log(`평균 품질: ${stats.avgQuality.toFixed(1)}/100`);
        
        // 개인화 수준
        console.log('\n' + colors.magenta + '개인화 수준:' + colors.reset);
        const personalizationLevel = Math.min(100, this.testProblems.length * 10);
        this.drawProgressBar(personalizationLevel);
    }
    
    drawProgressBar(percentage) {
        const width = 30;
        const filled = Math.floor(width * percentage / 100);
        const empty = width - filled;
        
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        console.log(`[${bar}] ${percentage}%`);
    }
    
    async changeSettings() {
        console.log('\n' + colors.yellow + '⚙️  설정 변경' + colors.reset);
        
        console.log('\n1. 난이도 선호도');
        console.log('2. 스캐폴딩 스타일');
        console.log('3. 언어 설정');
        console.log('4. 돌아가기');
        
        const choice = await this.askQuestion('선택: ');
        
        if (choice === '1') {
            console.log('\n새로운 난이도 선호:');
            console.log('1. 매우 점진적');
            console.log('2. 보통');
            console.log('3. 도전적');
            const diff = await this.askQuestion('선택: ');
            this.userProfile.difficulty_preference = ['gradual', 'normal', 'challenging'][parseInt(diff) - 1];
            console.log(colors.green + '✅ 설정이 변경되었습니다.' + colors.reset);
        }
        // ... 다른 설정들
        
        await this.saveProfile();
    }
    
    async saveProfile() {
        try {
            await fs.writeFile(
                path.join(__dirname, 'user-profile.json'),
                JSON.stringify(this.userProfile, null, 2)
            );
        } catch (error) {
            console.log(colors.yellow + '프로파일 저장 실패' + colors.reset);
        }
    }
    
    async saveProblems() {
        try {
            await fs.writeFile(
                path.join(__dirname, 'test-problems.json'),
                JSON.stringify(this.testProblems, null, 2)
            );
        } catch (error) {
            console.log(colors.yellow + '문제 저장 실패' + colors.reset);
        }
    }
    
    askQuestion(question) {
        return new Promise(resolve => {
            this.rl.question(colors.bright + question + colors.reset, resolve);
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 실행
const generator = new InteractiveProblemGenerator();
generator.start().catch(console.error);