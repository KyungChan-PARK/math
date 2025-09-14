/**
 * 수학 교육 요구사항 명확화 시스템
 * 자연어 요구사항을 수학 교육 전문가 수준으로 분석
 */

class MathEducationRequirementsClarifier {
    constructor() {
        // 한국 수학 교육과정 체계
        this.curriculum = {
            elementary: {
                grades: [1, 2, 3, 4, 5, 6],
                domains: ['수와 연산', '도형', '측정', '규칙성', '자료와 가능성'],
                skills: ['계산', '이해', '문제해결', '추론', '의사소통']
            },
            middle: {
                grades: [7, 8, 9],
                domains: ['수와 연산', '문자와 식', '함수', '기하', '확률과 통계'],
                skills: ['개념이해', '절차수행', '문제해결', '추론', '의사소통', '연결성']
            },
            high: {
                grades: [10, 11, 12],
                domains: ['대수', '함수', '기하', '확률과 통계', '미적분'],
                subjects: ['수학', '수학I', '수학II', '미적분', '확률과 통계', '기하']
            }
        };

        // 교육 목적 분류
        this.educationalPurposes = {
            '개념학습': ['개념 설명', '원리 이해', '정의 학습'],
            '문제풀이': ['연습문제', '응용문제', '심화문제'],
            '평가': ['진단평가', '형성평가', '총괄평가'],
            '보충학습': ['오답노트', '개념복습', '취약점 보완'],
            '심화학습': ['창의문제', '경시대회', '영재교육']
        };

        // 명확화 질문 템플릿
        this.clarificationTemplates = {
            grade: "어느 학년을 대상으로 하시나요? (예: 초6, 중2, 고1)",
            topic: "구체적으로 어떤 단원/주제인가요? (예: 비와 비율, 이차함수, 미분)",
            difficulty: "난이도는 어느 정도로 설정하시겠습니까? (기초/보통/심화)",
            quantity: "몇 개의 문제/자료가 필요하신가요?",
            format: "어떤 형식을 원하시나요? (문제지/해설/동영상스크립트/학습지)",
            objective: "학습 목표는 무엇인가요? (개념이해/문제해결능력/계산력)",
            studentLevel: "학생의 현재 수준은 어떠한가요? (상/중/하)",
            timeFrame: "학습 기간은 얼마나 되나요? (단기/중기/장기)",
            assessment: "평가 방식은 어떻게 하시겠습니까? (객관식/주관식/서술형)",
            realWorld: "실생활 연계가 필요한가요? (필요/불필요)"
        };
    }

    /**
     * 요구사항 분석 및 명확화
     */
    async clarifyRequirements(userInput) {
        console.log('\n🔍 수학 교육 요구사항 분석 시작...');
        console.log(`사용자 입력: "${userInput}"`);
        
        // 1단계: 자연어 파싱
        const parsed = this.parseNaturalLanguage(userInput);
        
        // 2단계: 누락된 정보 확인
        const missing = this.identifyMissingInfo(parsed);
        
        // 3단계: 명확화 질문 생성
        const questions = this.generateClarificationQuestions(missing, parsed);
        
        // 4단계: 교육학적 추천 제공
        const recommendations = this.provideEducationalRecommendations(parsed);
        
        return {
            understood: parsed,
            missingInfo: missing,
            clarificationNeeded: questions,
            recommendations,
            confidence: this.calculateConfidence(parsed)
        };
    }

    /**
     * 자연어 파싱
     */
    parseNaturalLanguage(input) {
        const result = {
            grade: null,
            topic: null,
            purpose: null,
            difficulty: null,
            format: null,
            quantity: null,
            special: []
        };

        // 학년 추출
        const gradePatterns = [
            /초([1-6])/g, /초등([1-6])/g, /([1-6])학년/g,
            /중([1-3])/g, /중학([1-3])/g, /중등/g,
            /고([1-3])/g, /고등([1-3])/g
        ];
        
        for (const pattern of gradePatterns) {
            const match = input.match(pattern);
            if (match) {
                result.grade = this.normalizeGrade(match[0]);
                break;
            }
        }

        // 주제 추출
        const topics = [
            '비와 비율', '비례', '분수', '소수', '도형', '넓이', '부피',
            '방정식', '함수', '이차함수', '삼각함수', '미분', '적분',
            '확률', '통계', '순열', '조합', '벡터', '행렬'
        ];
        
        for (const topic of topics) {
            if (input.includes(topic)) {
                result.topic = topic;
                break;
            }
        }

        // 목적 추출
        const purposes = {
            '문제': 'problem_generation',
            '설명': 'concept_explanation',
            '평가': 'assessment',
            '복습': 'review',
            '연습': 'practice',
            '심화': 'advanced',
            '보충': 'remedial'
        };
        
        for (const [keyword, purpose] of Object.entries(purposes)) {
            if (input.includes(keyword)) {
                result.purpose = purpose;
                break;
            }
        }

        // 난이도 추출
        if (input.includes('쉬') || input.includes('기초')) result.difficulty = 'basic';
        else if (input.includes('어려') || input.includes('심화')) result.difficulty = 'advanced';
        else if (input.includes('보통') || input.includes('중간')) result.difficulty = 'intermediate';

        // 수량 추출
        const quantityMatch = input.match(/(\d+)개|(\d+)문제/);
        if (quantityMatch) {
            result.quantity = parseInt(quantityMatch[1] || quantityMatch[2]);
        }

        // 특수 요구사항
        if (input.includes('실생활')) result.special.push('real_world');
        if (input.includes('창의')) result.special.push('creative');
        if (input.includes('서술')) result.special.push('descriptive');
        if (input.includes('단계')) result.special.push('step_by_step');

        return result;
    }

    /**
     * 누락 정보 식별
     */
    identifyMissingInfo(parsed) {
        const required = ['grade', 'topic', 'purpose'];
        const optional = ['difficulty', 'quantity', 'format'];
        
        const missing = {
            critical: required.filter(field => !parsed[field]),
            optional: optional.filter(field => !parsed[field]),
            clarity: []
        };

        // 명확성 검사
        if (parsed.topic && this.isVagueTopic(parsed.topic)) {
            missing.clarity.push('topic_specificity');
        }

        if (parsed.grade && this.isVagueGrade(parsed.grade)) {
            missing.clarity.push('grade_specificity');
        }

        return missing;
    }

    /**
     * 명확화 질문 생성
     */
    generateClarificationQuestions(missing, parsed) {
        const questions = [];

        // 필수 정보 질문
        if (missing.critical.includes('grade')) {
            questions.push({
                type: 'grade',
                question: "📚 어느 학년 학생을 대상으로 하시나요?",
                options: ['초등 1-3학년', '초등 4-6학년', '중학교', '고등학교'],
                priority: 'high'
            });
        }

        if (missing.critical.includes('topic')) {
            questions.push({
                type: 'topic',
                question: "📖 어떤 수학 단원/개념을 다루시려고 하나요?",
                suggestions: this.getTopicSuggestions(parsed.grade),
                priority: 'high'
            });
        }

        if (missing.critical.includes('purpose')) {
            questions.push({
                type: 'purpose',
                question: "🎯 주요 목적이 무엇인가요?",
                options: [
                    '새로운 개념 학습',
                    '문제 풀이 연습',
                    '평가/시험 준비',
                    '복습 및 보충',
                    '심화 학습'
                ],
                priority: 'high'
            });
        }

        // 선택 정보 질문
        if (missing.optional.includes('difficulty')) {
            questions.push({
                type: 'difficulty',
                question: "💡 학생의 현재 수준은 어떠한가요?",
                options: ['상위권 (심화)', '중위권 (표준)', '하위권 (기초)'],
                priority: 'medium'
            });
        }

        if (missing.optional.includes('quantity')) {
            questions.push({
                type: 'quantity',
                question: "🔢 몇 개의 문제/자료가 필요하신가요?",
                default: 10,
                priority: 'low'
            });
        }

        return questions;
    }

    /**
     * 교육학적 추천
     */
    provideEducationalRecommendations(parsed) {
        const recommendations = [];

        // 학년별 추천
        if (parsed.grade) {
            const gradeNum = this.extractGradeNumber(parsed.grade);
            
            if (gradeNum <= 6) {
                recommendations.push({
                    type: 'approach',
                    suggestion: "구체적 조작물과 시각적 자료를 활용한 학습이 효과적입니다.",
                    rationale: "초등학생은 구체적 조작기에 있어 실물과 그림이 이해를 돕습니다."
                });
            } else if (gradeNum <= 9) {
                recommendations.push({
                    type: 'approach',
                    suggestion: "개념과 원리를 단계적으로 설명하고 다양한 예제를 제공하세요.",
                    rationale: "중학생은 형식적 조작기 초기로 추상적 사고가 발달하는 시기입니다."
                });
            } else {
                recommendations.push({
                    type: 'approach',
                    suggestion: "실생활 응용과 대학 연계 내용을 포함시키세요.",
                    rationale: "고등학생은 진로와 연계된 심화 학습이 동기부여가 됩니다."
                });
            }
        }

        // 주제별 추천
        if (parsed.topic) {
            recommendations.push(this.getTopicSpecificRecommendation(parsed.topic));
        }

        // 목적별 추천
        if (parsed.purpose) {
            recommendations.push(this.getPurposeSpecificRecommendation(parsed.purpose));
        }

        return recommendations;
    }

    /**
     * 학년 정규화
     */
    normalizeGrade(gradeStr) {
        const mapping = {
            '초1': 'elementary_1', '초2': 'elementary_2', '초3': 'elementary_3',
            '초4': 'elementary_4', '초5': 'elementary_5', '초6': 'elementary_6',
            '중1': 'middle_1', '중2': 'middle_2', '중3': 'middle_3',
            '고1': 'high_1', '고2': 'high_2', '고3': 'high_3'
        };
        
        for (const [key, value] of Object.entries(mapping)) {
            if (gradeStr.includes(key.substring(0, 1))) {
                return value;
            }
        }
        
        return gradeStr;
    }

    /**
     * 학년 숫자 추출
     */
    extractGradeNumber(grade) {
        if (grade.includes('elementary')) return parseInt(grade.split('_')[1]);
        if (grade.includes('middle')) return parseInt(grade.split('_')[1]) + 6;
        if (grade.includes('high')) return parseInt(grade.split('_')[1]) + 9;
        return 0;
    }

    /**
     * 주제 제안
     */
    getTopicSuggestions(grade) {
        if (!grade) return [];
        
        const gradeNum = this.extractGradeNumber(grade);
        
        if (gradeNum <= 6) {
            return this.curriculum.elementary.domains;
        } else if (gradeNum <= 9) {
            return this.curriculum.middle.domains;
        } else {
            return this.curriculum.high.domains;
        }
    }

    /**
     * 주제별 추천
     */
    getTopicSpecificRecommendation(topic) {
        const recommendations = {
            '비와 비율': {
                suggestion: "실생활 예시(요리 레시피, 지도 축척)를 활용하세요.",
                materials: ['비례식 카드', '비율 막대', '백분율 원판']
            },
            '함수': {
                suggestion: "그래프와 표를 함께 사용하여 관계를 시각화하세요.",
                materials: ['그래프 용지', '함수 계산기', '동적 기하 소프트웨어']
            },
            '도형': {
                suggestion: "구체적 모형과 작도 활동을 병행하세요.",
                materials: ['도형 모형', '자와 컴퍼스', '종이접기 자료']
            }
        };

        return recommendations[topic] || {
            suggestion: "다양한 표현 방식을 활용하여 개념을 설명하세요.",
            materials: []
        };
    }

    /**
     * 목적별 추천
     */
    getPurposeSpecificRecommendation(purpose) {
        const recommendations = {
            'problem_generation': {
                suggestion: "난이도를 점진적으로 높이는 문제를 구성하세요.",
                structure: ['기본 개념 확인', '표준 응용', '심화 사고']
            },
            'concept_explanation': {
                suggestion: "정의 → 예시 → 비예시 → 연습 순서로 구성하세요.",
                structure: ['도입', '전개', '정리', '확인']
            },
            'assessment': {
                suggestion: "평가 목표를 명확히 하고 채점 기준을 제시하세요.",
                structure: ['진단 문항', '핵심 문항', '도전 문항']
            }
        };

        return recommendations[purpose] || {
            suggestion: "학습 목표를 명확히 설정하세요.",
            structure: []
        };
    }

    /**
     * 신뢰도 계산
     */
    calculateConfidence(parsed) {
        let score = 0;
        const weights = {
            grade: 25,
            topic: 25,
            purpose: 20,
            difficulty: 15,
            quantity: 10,
            format: 5
        };

        for (const [field, weight] of Object.entries(weights)) {
            if (parsed[field]) score += weight;
        }

        return score;
    }

    /**
     * 모호한 주제 검사
     */
    isVagueTopic(topic) {
        const vagueTerms = ['수학', '계산', '문제', '공부'];
        return vagueTerms.includes(topic);
    }

    /**
     * 모호한 학년 검사
     */
    isVagueGrade(grade) {
        const vagueTerms = ['초등', '중등', '고등', '학생'];
        return vagueTerms.includes(grade);
    }

    /**
     * 대화형 명확화 프로세스
     */
    async interactiveClarification(userInput, userResponses = {}) {
        const analysis = await this.clarifyRequirements(userInput);
        
        // 모든 필수 정보가 있으면 완료
        if (analysis.confidence >= 70 && analysis.missingInfo.critical.length === 0) {
            return {
                status: 'complete',
                finalRequirements: this.buildFinalRequirements(analysis.understood, userResponses),
                confidence: analysis.confidence
            };
        }

        // 다음 질문 선택
        const nextQuestion = analysis.clarificationNeeded.find(q => 
            q.priority === 'high' && !userResponses[q.type]
        ) || analysis.clarificationNeeded[0];

        return {
            status: 'incomplete',
            nextQuestion,
            currentUnderstanding: analysis.understood,
            remainingQuestions: analysis.clarificationNeeded.length,
            confidence: analysis.confidence
        };
    }

    /**
     * 최종 요구사항 구성
     */
    buildFinalRequirements(parsed, responses) {
        return {
            ...parsed,
            ...responses,
            timestamp: new Date().toISOString(),
            verified: true
        };
    }
}

// 전역 인스턴스 생성 및 내보내기
const clarifier = new MathEducationRequirementsClarifier();

// 사용 예제
async function demonstrateClarification() {
    // 예제 1: 모호한 요청
    const vague = "수학 문제 만들어줘";
    console.log("\n=== 모호한 요청 ===");
    const result1 = await clarifier.clarifyRequirements(vague);
    console.log("분석 결과:", result1);

    // 예제 2: 부분적으로 명확한 요청
    const partial = "초6 비와 비율 문제 10개";
    console.log("\n=== 부분적 요청 ===");
    const result2 = await clarifier.clarifyRequirements(partial);
    console.log("분석 결과:", result2);

    // 예제 3: 명확한 요청
    const clear = "중2 일차함수 개념 설명과 기초 연습문제 5개, 실생활 예시 포함";
    console.log("\n=== 명확한 요청 ===");
    const result3 = await clarifier.clarifyRequirements(clear);
    console.log("분석 결과:", result3);
}

module.exports = clarifier;