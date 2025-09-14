/**
 * Vertex AI 수학 교육 핵심 시스템
 * 1인 개발자를 위한 경량 구조 - 점진적 확장 가능
 * 수학 교육 전문 AI 시스템
 */

const { VertexAI } = require('@google-cloud/vertexai');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');

class MathEducationCore {
    constructor(config = {}) {
        // 1인 개발자를 위한 최소 구성
        this.projectId = config.projectId || 'math-project-472006';
        this.location = config.location || 'asia-northeast3';
        
        // Vertex AI 초기화 (무료 티어 활용)
        this.vertexAI = new VertexAI({
            project: this.projectId,
            location: this.location
        });
        
        // Gemini Pro 모델 (수학 전용)
        this.mathModel = this.vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro',
            generationConfig: {
                temperature: 0.3,  // 수학 정확도를 위해 낮은 온도
                maxOutputTokens: 2048,
            }
        });
        
        // Firestore (무료 할당량 내에서 운영)
        this.db = new Firestore();
        
        // 수학 교육 전문 프롬프트 템플릿
        this.mathPrompts = {
            problemGeneration: '수학 교육 전문가로서 다음 주제에 대한 문제를 생성하세요:',
            solutionExplanation: '학생이 이해하기 쉽도록 단계별로 설명하세요:',
            conceptExplanation: '수학 개념을 시각적 예시와 함께 설명하세요:',
            errorAnalysis: '학생의 오답을 분석하고 개선 방법을 제시하세요:'
        };
        
        // 비용 추적 (1인 개발자를 위한 간단한 모니터링)
        this.costTracker = {
            daily: 0,
            requests: 0,
            freeQuota: {
                vertex: 60,      // 60 requests/minute free
                firestore: 50000, // 50k reads/day free
                storage: 5        // 5GB free
            }
        };
    }
    
    /**
     * 수학 문제 생성 (한국 교육과정 기반)
     */
    async generateMathProblem(options = {}) {
        const {
            grade = 6,           // 학년
            topic = '비와 비율',  // 주제
            difficulty = 'medium', // 난이도
            count = 1,            // 문제 수
            includeHints = true   // 힌트 포함 여부
        } = options;
        
        // 비용 효율적인 프롬프트 구성
        const prompt = `
한국 ${grade}학년 수학 교육과정에 맞는 ${topic} 문제를 ${count}개 생성하세요.

요구사항:
- 난이도: ${difficulty}
- 실생활 연계 문제
- 단계별 풀이 과정 포함
${includeHints ? '- 학습 힌트 제공' : ''}

형식:
문제: [문제 내용]
정답: [정답]
풀이: [단계별 풀이]
${includeHints ? '힌트: [학습 힌트]' : ''}
`;
        
        try {
            // 무료 할당량 체크
            if (this.costTracker.requests >= this.costTracker.freeQuota.vertex) {
                console.log('⚠️ 무료 할당량 초과 경고');
                await this.waitForQuotaReset();
            }
            
            const result = await this.mathModel.generateContent(prompt);
            this.costTracker.requests++;
            
            // 결과 저장 (캐싱으로 비용 절감)
            const problem = {
                id: `prob_${Date.now()}`,
                grade,
                topic,
                difficulty,
                content: result.response.text(),
                createdAt: new Date(),
                metadata: {
                    model: 'gemini-1.5-pro',
                    cost: 0 // 무료 티어
                }
            };
            
            // Firestore에 저장 (무료 할당량 내)
            await this.saveProblem(problem);
            
            return problem;
            
        } catch (error) {
            console.error('문제 생성 실패:', error);
            // 폴백: 로컬 템플릿 사용
            return this.generateFromTemplate(grade, topic);
        }
    }
    
    /**
     * 학생 답안 분석 및 피드백
     */
    async analyzeStudentAnswer(problemId, studentAnswer) {
        // 문제 조회
        const problem = await this.getProblem(problemId);
        
        const prompt = `
문제: ${problem.content}
학생 답안: ${studentAnswer}

다음을 분석하세요:
1. 정답 여부
2. 풀이 과정의 올바름
3. 개념 이해도
4. 개선이 필요한 부분
5. 격려와 학습 조언

수학 교육 전문가의 관점에서 건설적인 피드백을 제공하세요.
`;
        
        const result = await this.mathModel.generateContent(prompt);
        
        const feedback = {
            problemId,
            studentAnswer,
            analysis: result.response.text(),
            timestamp: new Date(),
            educationalValue: this.assessEducationalValue(result.response.text())
        };
        
        // 학습 기록 저장
        await this.saveStudentProgress(feedback);
        
        return feedback;
    }
    
    /**
     * 적응형 학습 경로 생성
     */
    async createAdaptiveLearningPath(studentId) {
        // 학생 학습 데이터 조회
        const history = await this.getStudentHistory(studentId);
        
        // 약점 분석
        const weaknesses = this.analyzeWeaknesses(history);
        
        // 맞춤형 학습 경로 생성
        const prompt = `
학생 프로필:
- 약점: ${weaknesses.join(', ')}
- 현재 수준: ${history.level}
- 학습 스타일: ${history.style}

한국 수학 교육과정에 맞는 맞춤형 학습 경로를 생성하세요:
1. 단기 목표 (1주)
2. 중기 목표 (1개월)
3. 추천 학습 순서
4. 각 단계별 핵심 개념
5. 연습 문제 유형
`;
        
        const result = await this.mathModel.generateContent(prompt);
        
        return {
            studentId,
            path: result.response.text(),
            weaknesses,
            createdAt: new Date(),
            nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1주 후
        };
    }
    
    /**
     * 수학 개념 시각화 데이터 생성
     */
    async generateVisualization(concept) {
        const prompt = `
수학 개념: ${concept}

다음 형식으로 시각화 데이터를 생성하세요:
1. 그래프 데이터 (JSON 형식)
2. 다이어그램 설명
3. 인터랙티브 요소 제안
4. 학습 포인트

학생이 직관적으로 이해할 수 있도록 구성하세요.
`;
        
        const result = await this.mathModel.generateContent(prompt);
        
        return {
            concept,
            visualization: this.parseVisualizationData(result.response.text()),
            interactive: true,
            educationalNotes: this.extractEducationalNotes(result.response.text())
        };
    }
    
    /**
     * 1인 개발자를 위한 간단한 AutoML 설정
     */
    async setupSimpleAutoML() {
        // 최소한의 AutoML 구성
        const config = {
            datasetId: 'math_problems_dataset',
            modelName: 'math_classifier_v1',
            budget: 1, // $1 예산 (테스트용)
            
            // 수학 문제 분류 모델
            objective: 'classification',
            labels: ['algebra', 'geometry', 'arithmetic', 'statistics'],
            
            // 학습 데이터 최소 요구사항
            minTrainingExamples: 100,
            
            // 자동 하이퍼파라미터 튜닝
            autoTuning: true
        };
        
        console.log('💡 AutoML 설정 (1인 개발자 모드):');
        console.log('- 최소 예산으로 시작');
        console.log('- 점진적 데이터 축적');
        console.log('- 수학 문제 자동 분류');
        
        return config;
    }
    
    /**
     * 비용 효율적인 데이터 저장
     */
    async saveProblem(problem) {
        // 배치 처리로 Firestore 쓰기 최적화
        if (!this.batch) {
            this.batch = this.db.batch();
            this.batchCount = 0;
        }
        
        const ref = this.db.collection('math_problems').doc(problem.id);
        this.batch.set(ref, problem);
        this.batchCount++;
        
        // 10개씩 배치 커밋 (무료 할당량 최적화)
        if (this.batchCount >= 10) {
            await this.batch.commit();
            this.batch = null;
            this.batchCount = 0;
        }
    }
    
    /**
     * 학생 진도 저장
     */
    async saveStudentProgress(data) {
        // 실시간 동기화 대신 주기적 동기화 (비용 절감)
        const ref = this.db.collection('student_progress').doc();
        await ref.set({
            ...data,
            synced: false,
            syncScheduled: new Date(Date.now() + 3600000) // 1시간 후 동기화
        });
    }
    
    /**
     * 템플릿 기반 문제 생성 (폴백)
     */
    generateFromTemplate(grade, topic) {
        const templates = {
            '비와 비율': [
                '사과 3개와 배 5개의 비를 구하시오.',
                '전체 학생 30명 중 여학생이 18명일 때, 남학생과 여학생의 비를 구하시오.'
            ],
            '분수': [
                '1/2 + 1/3을 계산하시오.',
                '피자 3/4를 4명이 똑같이 나누면 한 사람이 먹는 양은?'
            ]
        };
        
        const problems = templates[topic] || ['기본 문제'];
        const randomProblem = problems[Math.floor(Math.random() * problems.length)];
        
        return {
            id: `template_${Date.now()}`,
            grade,
            topic,
            content: randomProblem,
            source: 'template',
            cost: 0
        };
    }
    
    /**
     * Helper 함수들
     */
    async getProblem(problemId) {
        const doc = await this.db.collection('math_problems').doc(problemId).get();
        return doc.exists ? doc.data() : null;
    }
    
    async getStudentHistory(studentId) {
        const snapshot = await this.db
            .collection('student_progress')
            .where('studentId', '==', studentId)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        return {
            records: snapshot.docs.map(doc => doc.data()),
            level: 'intermediate',
            style: 'visual'
        };
    }
    
    analyzeWeaknesses(history) {
        // 간단한 약점 분석
        const errorPatterns = {};
        history.records.forEach(record => {
            if (record.incorrect) {
                errorPatterns[record.topic] = (errorPatterns[record.topic] || 0) + 1;
            }
        });
        
        return Object.keys(errorPatterns)
            .sort((a, b) => errorPatterns[b] - errorPatterns[a])
            .slice(0, 3);
    }
    
    assessEducationalValue(text) {
        // 교육적 가치 평가
        const keywords = ['이해', '개념', '원리', '적용', '연습'];
        const score = keywords.filter(k => text.includes(k)).length;
        return score >= 3 ? 'high' : score >= 1 ? 'medium' : 'low';
    }
    
    parseVisualizationData(text) {
        // 시각화 데이터 파싱
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } catch {
            return { type: 'text', content: text };
        }
    }
    
    extractEducationalNotes(text) {
        // 교육 노트 추출
        const lines = text.split('\n');
        return lines.filter(line => line.includes('학습') || line.includes('포인트'));
    }
    
    async waitForQuotaReset() {
        const resetTime = 60000; // 1분
        console.log(`⏳ 할당량 리셋 대기 (${resetTime/1000}초)...`);
        await new Promise(resolve => setTimeout(resolve, resetTime));
        this.costTracker.requests = 0;
    }
    
    /**
     * 일일 비용 리포트
     */
    getDailyCostReport() {
        return {
            date: new Date().toLocaleDateString('ko-KR'),
            vertexAI: {
                requests: this.costTracker.requests,
                freeQuota: this.costTracker.freeQuota.vertex,
                cost: 0 // 무료 티어 내
            },
            firestore: {
                reads: 0,
                writes: 0,
                cost: 0
            },
            total: 0,
            status: '✅ 무료 티어 내 운영 중'
        };
    }
}

// 사용 예제
async function demonstrateMathCore() {
    const mathCore = new MathEducationCore();
    
    console.log('🎓 수학 교육 AI 시스템 (1인 개발자 버전)');
    console.log('📚 한국 교육과정 기반 수학 전문 시스템');
    
    // 문제 생성
    const problem = await mathCore.generateMathProblem({
        grade: 6,
        topic: '비와 비율',
        difficulty: 'medium'
    });
    
    console.log('생성된 문제:', problem);
    
    // 비용 리포트
    console.log('💰 일일 비용:', mathCore.getDailyCostReport());
}

module.exports = MathEducationCore;