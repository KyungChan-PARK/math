/**
 * 비와 비율 문제 생성 모듈
 * Ratio & Proportion Problem Generator with Adaptive Scaffolding
 */

class RatioProblemGenerator {
    constructor(adaptiveSystem) {
        this.system = adaptiveSystem;
        this.problemDatabase = new Map();
        this.studentProgress = new Map();
        
        // 문제 유형 분류
        this.problemTypes = {
            visual: ['basic_ratio', 'simplification', 'geometric_ratio'],
            numerical: ['mixture', 'speed_distance', 'scale_map'],
            application: ['recipe', 'graph_analysis', 'complex_comparison', 'non_proportional']
        };
        
        // Scaffolding 전략
        this.scaffoldingStrategy = {
            minimal: ['hint'],
            moderate: ['hint', 'step_guide'],
            extensive: ['hint', 'visual_tool', 'example'],
            adaptive: [] // 학생 반응에 따라 동적 결정
        };
        
        this.initializeProblems();
    }
    
    initializeProblems() {
        // 10개 문제 데이터베이스
        this.problemDatabase.set(1, {
            id: 'ratio_1',
            type: 'visual',
            subtype: 'basic_ratio',
            difficulty: 'basic',
            concepts: ['ratio_notation', 'fraction_form', 'verbal_expression'],
            context: {
                korean: {
                    situation: '김민수는 빨간 사과 3개와 초록 사과 2개를 가지고 있습니다.',
                    question: '빨간 사과와 초록 사과의 비를 구하고, 이를 세 가지 방법으로 표현하세요.',
                    data: { red: 3, green: 2 }
                },
                english: {
                    situation: 'Minsu has 3 red apples and 2 green apples.',
                    question: 'Find the ratio of red apples to green apples and express it in three ways.',
                    data: { red: 3, green: 2 }
                }
            },
            answers: {
                ratio: '3:2',
                fraction: '3/2',
                verbal: ['빨간 사과 3개당 초록 사과 2개', '초록 사과 2개마다 빨간 사과 3개']
            },
            scaffolding: {
                hints: [
                    '비는 두 양을 비교하는 방법입니다.',
                    '3개와 2개의 관계를 생각해보세요.'
                ],
                visual: {
                    type: 'ratio_bar',
                    data: { part1: 3, part2: 2, colors: ['red', 'green'] }
                },
                example: {
                    problem: '파란 공 4개와 노란 공 3개',
                    solution: '4:3, 4/3, 노란 공 3개마다 파란 공 4개'
                }
            }
        });
        
        this.problemDatabase.set(2, {
            id: 'ratio_2',
            type: 'visual',
            subtype: 'simplification',
            difficulty: 'basic',
            concepts: ['simplifying_ratios', 'gcd', 'part_to_whole'],
            context: {
                korean: {
                    situation: '교실에 남학생 12명과 여학생 18명이 있습니다.',
                    question: '남학생과 여학생의 비를 가장 간단한 형태로 나타내세요.',
                    data: { boys: 12, girls: 18 }
                },
                english: {
                    situation: 'There are 12 boys and 18 girls in a classroom.',
                    question: 'Express the ratio of boys to girls in simplest form.',
                    data: { boys: 12, girls: 18 }
                }
            },
            answers: {
                simplified: '2:3',
                boys_to_total: '2/5',
                gcd: 6
            },
            scaffolding: {
                hints: [
                    '두 수의 최대공약수(GCD)를 찾으세요.',
                    '12 = 2×6, 18 = 3×6'
                ],
                visual: {
                    type: 'gcd_visualization',
                    data: { num1: 12, num2: 18 }
                }
            }
        });
        
        this.problemDatabase.set(3, {
            id: 'ratio_3',
            type: 'visual',
            subtype: 'geometric_ratio',
            difficulty: 'intermediate',
            concepts: ['proportion', 'scaling', 'perimeter'],
            context: {
                korean: {
                    situation: '직사각형의 가로와 세로의 비가 5:3입니다.',
                    question: '가로가 15cm일 때, 세로의 길이는? 둘레는?',
                    data: { ratio_width: 5, ratio_height: 3, actual_width: 15 }
                },
                english: {
                    situation: 'A rectangle has width to height ratio of 5:3.',
                    question: 'If width is 15cm, what is the height and perimeter?',
                    data: { ratio_width: 5, ratio_height: 3, actual_width: 15 }
                }
            },
            answers: {
                height: 9,
                perimeter: 48,
                scale_factor: 3
            }
        });
        
        this.problemDatabase.set(4, {
            id: 'ratio_4',
            type: 'numerical',
            subtype: 'mixture',
            difficulty: 'intermediate',
            concepts: ['mixture_ratio', 'scaling_up', 'total_parts'],
            context: {
                korean: {
                    situation: '설탕과 물을 2:5의 비율로 섞어 설탕물을 만듭니다.',
                    question: '설탕 40g을 사용한다면, 물은 몇 ml? 전체는?',
                    data: { sugar_ratio: 2, water_ratio: 5, sugar_amount: 40 }
                },
                english: {
                    situation: 'Sugar and water are mixed in a 2:5 ratio.',
                    question: 'If using 40g sugar, how much water? Total?',
                    data: { sugar_ratio: 2, water_ratio: 5, sugar_amount: 40 }
                }
            },
            answers: {
                water: 100,
                total: 140,
                unit_value: 20
            }
        });
        
        this.problemDatabase.set(5, {
            id: 'ratio_5',
            type: 'numerical',
            subtype: 'speed_distance',
            difficulty: 'intermediate',
            concepts: ['unit_rate', 'speed', 'proportional_reasoning'],
            context: {
                korean: {
                    situation: '자동차가 3시간 동안 240km를 달렸습니다.',
                    question: '시속은? 5시간 후 거리는?',
                    data: { time: 3, distance: 240 }
                },
                english: {
                    situation: 'A car traveled 240km in 3 hours.',
                    question: 'Speed? Distance after 5 hours?',
                    data: { time: 3, distance: 240 }
                }
            },
            answers: {
                speed: 80,
                distance_5h: 400
            }
        });
        
        this.problemDatabase.set(6, {
            id: 'ratio_6',
            type: 'numerical',
            subtype: 'scale_map',
            difficulty: 'advanced',
            concepts: ['scale', 'unit_conversion', 'map_reading'],
            context: {
                korean: {
                    situation: '지도의 축척이 1:50,000입니다.',
                    question: '지도상 3cm는 실제 몇 km? 실제 10km는 지도상 몇 cm?',
                    data: { scale: 50000, map_distance: 3, real_distance: 10 }
                },
                english: {
                    situation: 'A map has scale 1:50,000.',
                    question: '3cm on map = ? km real. 10km real = ? cm on map.',
                    data: { scale: 50000, map_distance: 3, real_distance: 10 }
                }
            },
            answers: {
                real_km: 1.5,
                map_cm: 20
            }
        });
        
        this.problemDatabase.set(7, {
            id: 'ratio_7',
            type: 'application',
            subtype: 'recipe',
            difficulty: 'advanced',
            concepts: ['proportional_scaling', 'constant_of_proportionality'],
            context: {
                korean: {
                    situation: '케이크 레시피: 밀가루 250g, 설탕 150g, 버터 100g',
                    question: '밀가루 400g으로 만들려면 다른 재료는?',
                    data: { flour_original: 250, sugar_original: 150, butter_original: 100, flour_new: 400 }
                },
                english: {
                    situation: 'Cake recipe: flour 250g, sugar 150g, butter 100g',
                    question: 'If using 400g flour, other ingredients?',
                    data: { flour_original: 250, sugar_original: 150, butter_original: 100, flour_new: 400 }
                }
            },
            answers: {
                sugar: 240,
                butter: 160,
                k: 1.6
            }
        });
        
        this.problemDatabase.set(8, {
            id: 'ratio_8',
            type: 'application',
            subtype: 'graph_analysis',
            difficulty: 'advanced',
            concepts: ['proportional_relationship', 'graph_interpretation', 'constant_rate'],
            context: {
                korean: {
                    situation: '시간-거리 그래프가 원점을 지나는 직선입니다.',
                    question: '비례 관계인가? 비례상수는?',
                    data: { points: [[1,60], [2,120], [3,180], [4,240]] }
                },
                english: {
                    situation: 'Time-distance graph is a line through origin.',
                    question: 'Proportional? Constant?',
                    data: { points: [[1,60], [2,120], [3,180], [4,240]] }
                }
            },
            answers: {
                proportional: true,
                constant: 60
            }
        });
        
        this.problemDatabase.set(9, {
            id: 'ratio_9',
            type: 'application',
            subtype: 'complex_comparison',
            difficulty: 'advanced',
            concepts: ['compound_ratios', 'unit_analysis', 'multi_step'],
            context: {
                korean: {
                    situation: '5명이 3일 캠핑에 물 15병 필요',
                    question: '8명이 5일 캠핑하면 물 몇 병?',
                    data: { people1: 5, days1: 3, bottles1: 15, people2: 8, days2: 5 }
                },
                english: {
                    situation: '5 people need 15 bottles for 3 days camping',
                    question: 'How many bottles for 8 people for 5 days?',
                    data: { people1: 5, days1: 3, bottles1: 15, people2: 8, days2: 5 }
                }
            },
            answers: {
                bottles: 40,
                per_person_per_day: 1
            }
        });
        
        this.problemDatabase.set(10, {
            id: 'ratio_10',
            type: 'application',
            subtype: 'non_proportional',
            difficulty: 'advanced',
            concepts: ['non_proportional', 'step_function', 'real_world'],
            context: {
                korean: {
                    situation: '온라인 쇼핑: 3만원 미만 배송비 3천원, 이상 무료',
                    question: '25,000원과 35,000원 상품의 총 비용 비는?',
                    data: { threshold: 30000, shipping: 3000, price1: 25000, price2: 35000 }
                },
                english: {
                    situation: 'Online shop: Under 30k shipping 3k, over free',
                    question: 'Total cost ratio for 25k and 35k items?',
                    data: { threshold: 30000, shipping: 3000, price1: 25000, price2: 35000 }
                }
            },
            answers: {
                ratio: '4:5',
                total1: 28000,
                total2: 35000,
                proportional: false
            }
        });
    }
    
    async generateProblemSet(requirements) {
        const {
            count = 10,
            focus = 'mixed', // visual, numerical, application, mixed
            scaffolding = 'adaptive',
            language = 'both',
            studentId = null
        } = requirements;
        
        // 학생 프로필 분석
        const studentProfile = await this.analyzeStudent(studentId);
        
        // 문제 선택 전략
        const strategy = this.determineStrategy(studentProfile, focus);
        
        // 문제 생성
        const problems = [];
        for (let i = 1; i <= count; i++) {
            const problem = await this.createAdaptiveProblem(i, strategy, studentProfile);
            problems.push(problem);
        }
        
        // 연결 전략 적용
        this.applyConnectionStrategies(problems, strategy);
        
        return {
            problems,
            sessionId: this.createSession(studentId, problems),
            strategy
        };
    }
    
    async analyzeStudent(studentId) {
        if (!studentId) {
            return {
                level: 'unknown',
                strengths: [],
                weaknesses: [],
                preferredScaffolding: 'extensive'
            };
        }
        
        const progress = this.studentProgress.get(studentId) || {
            completed: [],
            correct: [],
            struggles: [],
            hintsUsed: 0,
            averageTime: 0
        };
        
        // Claude-Qwen 협업 분석
        const analysis = await this.system.collaborativeAnalysis('student_profile', {
            studentId,
            progress
        });
        
        return {
            level: this.determineLevel(progress),
            strengths: analysis.strengths || [],
            weaknesses: analysis.weaknesses || [],
            preferredScaffolding: this.determineScaffolding(progress),
            nextConcepts: analysis.recommendations || []
        };
    }
    
    determineLevel(progress) {
        const correctRate = progress.correct.length / Math.max(progress.completed.length, 1);
        
        if (correctRate > 0.8 && progress.averageTime < 120) return 'advanced';
        if (correctRate > 0.6) return 'intermediate';
        return 'basic';
    }
    
    determineScaffolding(progress) {
        const hintRate = progress.hintsUsed / Math.max(progress.completed.length, 1);
        
        if (hintRate < 0.3) return 'minimal';
        if (hintRate < 0.6) return 'moderate';
        return 'extensive';
    }
    
    determineStrategy(profile, focus) {
        return {
            problemSelection: this.selectProblemSequence(profile, focus),
            scaffoldingLevel: profile.preferredScaffolding,
            connectionType: this.selectConnectionType(profile),
            adaptations: this.planAdaptations(profile)
        };
    }
    
    selectProblemSequence(profile, focus) {
        const sequence = [];
        
        if (focus === 'mixed') {
            // 균형잡힌 선택
            sequence.push(
                ...this.problemTypes.visual.slice(0, 3),
                ...this.problemTypes.numerical.slice(0, 3),
                ...this.problemTypes.application.slice(0, 4)
            );
        } else if (this.problemTypes[focus]) {
            // 특정 유형 집중
            sequence.push(...this.problemTypes[focus]);
        }
        
        // 학생 수준에 따라 조정
        if (profile.level === 'basic') {
            // 쉬운 문제 더 많이
            sequence.unshift('basic_ratio', 'simplification');
        } else if (profile.level === 'advanced') {
            // 어려운 문제 더 많이
            sequence.push('complex_comparison', 'non_proportional');
        }
        
        return sequence;
    }
    
    selectConnectionType(profile) {
        // 학생 특성에 따른 연결 전략
        if (profile.weaknesses.includes('conceptual_understanding')) {
            return 'sequential'; // 점진적 확장
        }
        if (profile.strengths.includes('pattern_recognition')) {
            return 'parallel'; // 다양한 방법
        }
        return 'mixed';
    }
    
    planAdaptations(profile) {
        const adaptations = {
            hints: [],
            visualTools: [],
            examples: [],
            pacing: 'normal'
        };
        
        // 약점에 대한 추가 지원
        profile.weaknesses.forEach(weakness => {
            switch(weakness) {
                case 'calculation':
                    adaptations.hints.push('step_by_step_calculation');
                    adaptations.visualTools.push('calculator');
                    break;
                case 'conceptual':
                    adaptations.examples.push('multiple_examples');
                    adaptations.visualTools.push('visual_representation');
                    break;
                case 'application':
                    adaptations.hints.push('real_world_connection');
                    adaptations.examples.push('similar_context');
                    break;
            }
        });
        
        // 학습 속도 조정
        if (profile.averageTime > 180) {
            adaptations.pacing = 'slower';
        } else if (profile.averageTime < 60) {
            adaptations.pacing = 'faster';
        }
        
        return adaptations;
    }
    
    async createAdaptiveProblem(index, strategy, profile) {
        const baseProblem = this.problemDatabase.get(index);
        if (!baseProblem) return null;
        
        // 문제 난이도 조정
        const adjustedProblem = this.adjustDifficulty(baseProblem, profile);
        
        // Scaffolding 맞춤화
        const customScaffolding = await this.customizeScaffolding(
            adjustedProblem,
            strategy.scaffoldingLevel,
            profile
        );
        
        // 피드백 전략 설정
        const feedbackStrategy = this.createFeedbackStrategy(profile);
        
        return {
            ...adjustedProblem,
            scaffolding: customScaffolding,
            feedback: feedbackStrategy,
            adaptations: strategy.adaptations
        };
    }
    
    adjustDifficulty(problem, profile) {
        const adjusted = { ...problem };
        
        if (profile.level === 'basic' && problem.difficulty === 'advanced') {
            // 숫자 단순화
            if (adjusted.context.korean.data) {
                Object.keys(adjusted.context.korean.data).forEach(key => {
                    if (typeof adjusted.context.korean.data[key] === 'number') {
                        adjusted.context.korean.data[key] = 
                            Math.round(adjusted.context.korean.data[key] / 10) * 10;
                    }
                });
            }
        }
        
        return adjusted;
    }
    
    async customizeScaffolding(problem, level, profile) {
        const scaffolding = {
            immediate: [],
            onStruggle: [],
            onGiveUp: []
        };
        
        // 즉시 제공할 지원
        if (level === 'extensive' || profile.weaknesses.includes(problem.subtype)) {
            scaffolding.immediate.push({
                type: 'concept_review',
                content: await this.generateConceptReview(problem.concepts)
            });
        }
        
        // 어려움 감지 시 제공
        scaffolding.onStruggle.push({
            type: 'hint_sequence',
            hints: problem.scaffolding.hints || [],
            delay: level === 'minimal' ? 60 : 30 // 초
        });
        
        if (level !== 'minimal') {
            scaffolding.onStruggle.push({
                type: 'visual_tool',
                content: problem.scaffolding.visual || null
            });
        }
        
        // 포기 시 제공
        scaffolding.onGiveUp.push({
            type: 'worked_example',
            content: await this.generateWorkedExample(problem)
        });
        
        return scaffolding;
    }
    
    async generateConceptReview(concepts) {
        // 개념 복습 자료 생성
        const review = {
            concepts: [],
            examples: []
        };
        
        for (const concept of concepts) {
            const explanation = await this.system.collaborativeAnalysis(
                'concept_explanation',
                { concept }
            );
            review.concepts.push(explanation);
        }
        
        return review;
    }
    
    async generateWorkedExample(problem) {
        // 단계별 풀이 예시 생성
        return await this.system.collaborativeAnalysis('worked_example', {
            problem: problem.context,
            answers: problem.answers
        });
    }
    
    createFeedbackStrategy(profile) {
        return {
            correct: {
                message: this.getSuccessMessage(profile),
                nextStep: 'advance'
            },
            incorrect: {
                message: this.getEncouragementMessage(profile),
                scaffolding: 'increase',
                retry: true
            },
            partial: {
                message: 'Good progress! Let\'s refine your answer.',
                hint: 'specific'
            }
        };
    }
    
    getSuccessMessage(profile) {
        const messages = {
            basic: '훌륭해요! 정답입니다! 🎉',
            intermediate: '정확합니다! 다음 문제로 넘어갈까요?',
            advanced: '✓ 정답. 효율적인 풀이였습니다.'
        };
        return messages[profile.level] || messages.intermediate;
    }
    
    getEncouragementMessage(profile) {
        const messages = {
            basic: '아직 정답이 아니에요. 힌트를 확인해보세요! 💡',
            intermediate: '다시 한번 확인해보세요. 가까워지고 있어요!',
            advanced: '재검토가 필요합니다. 접근 방법을 다시 생각해보세요.'
        };
        return messages[profile.level] || messages.intermediate;
    }
    
    applyConnectionStrategies(problems, strategy) {
        const connectionType = strategy.connectionType;
        
        switch(connectionType) {
            case 'sequential':
                this.applySequentialConnections(problems);
                break;
            case 'parallel':
                this.applyParallelConnections(problems);
                break;
            case 'mixed':
                this.applyMixedConnections(problems);
                break;
        }
        
        // 스파이럴 패턴 추가
        this.applySpiralPattern(problems);
    }
    
    applySequentialConnections(problems) {
        for (let i = 1; i < problems.length; i++) {
            problems[i].connections = {
                previous: problems[i-1].id,
                type: 'builds_on',
                relationship: this.identifyRelationship(problems[i-1], problems[i])
            };
        }
    }
    
    applyParallelConnections(problems) {
        // 유사한 문제들을 그룹화
        const groups = this.groupSimilarProblems(problems);
        
        groups.forEach(group => {
            group.forEach(problem => {
                problem.connections = {
                    group: group.map(p => p.id),
                    type: 'alternative_method',
                    focus: problem.subtype
                };
            });
        });
    }
    
    applyMixedConnections(problems) {
        // 일부는 순차적, 일부는 병렬적
        this.applySequentialConnections(problems.slice(0, 5));
        this.applyParallelConnections(problems.slice(5));
    }
    
    applySpiralPattern(problems) {
        const conceptMap = new Map();
        
        // 개념별로 문제 매핑
        problems.forEach(problem => {
            problem.concepts.forEach(concept => {
                if (!conceptMap.has(concept)) {
                    conceptMap.set(concept, []);
                }
                conceptMap.get(concept).push(problem.id);
            });
        });
        
        // 스파이럴 연결 추가
        problems.forEach(problem => {
            problem.spirals = [];
            problem.concepts.forEach(concept => {
                const related = conceptMap.get(concept);
                if (related.length > 1) {
                    problem.spirals.push({
                        concept,
                        appearances: related
                    });
                }
            });
        });
    }
    
    identifyRelationship(prob1, prob2) {
        // 두 문제 간의 관계 파악
        if (prob1.subtype === prob2.subtype) {
            return 'same_concept_deeper';
        }
        
        const sharedConcepts = prob1.concepts.filter(c => 
            prob2.concepts.includes(c)
        );
        
        if (sharedConcepts.length > 0) {
            return `extends_${sharedConcepts[0]}`;
        }
        
        return 'new_concept';
    }
    
    groupSimilarProblems(problems) {
        const groups = [];
        const used = new Set();
        
        problems.forEach(problem => {
            if (used.has(problem.id)) return;
            
            const group = [problem];
            used.add(problem.id);
            
            problems.forEach(other => {
                if (!used.has(other.id) && this.areSimilar(problem, other)) {
                    group.push(other);
                    used.add(other.id);
                }
            });
            
            if (group.length > 1) {
                groups.push(group);
            }
        });
        
        return groups;
    }
    
    areSimilar(prob1, prob2) {
        // 유사성 판단
        return prob1.type === prob2.type || 
               prob1.concepts.some(c => prob2.concepts.includes(c));
    }
    
    createSession(studentId, problems) {
        const sessionId = `ratio_session_${Date.now()}`;
        
        const session = {
            id: sessionId,
            studentId,
            problems,
            startTime: new Date().toISOString(),
            interactions: [],
            progress: {
                completed: [],
                correct: [],
                attempts: new Map(),
                hintsUsed: new Map(),
                timeSpent: new Map()
            }
        };
        
        // 세션 저장
        this.system.interactions.sessions.set(sessionId, session);
        
        return sessionId;
    }
    
    // 자동 채점 메서드
    async evaluateAnswer(sessionId, problemId, answer) {
        const session = this.system.interactions.sessions.get(sessionId);
        if (!session) return null;
        
        const problem = session.problems.find(p => p.id === problemId);
        if (!problem) return null;
        
        // 답안 분석
        const evaluation = await this.analyzeAnswer(problem, answer);
        
        // 진행 상황 업데이트
        this.updateProgress(session, problemId, evaluation);
        
        // 피드백 생성
        const feedback = await this.generateFeedback(problem, evaluation, session);
        
        // 다음 단계 추천
        const nextStep = this.recommendNextStep(session, evaluation);
        
        return {
            evaluation,
            feedback,
            nextStep
        };
    }
    
    async analyzeAnswer(problem, answer) {
        // Claude-Qwen 협업으로 답안 분석
        const analysis = await this.system.collaborativeAnalysis('answer_evaluation', {
            problem: problem.context,
            expected: problem.answers,
            submitted: answer
        });
        
        return {
            correct: analysis.correct || false,
            partial: analysis.partial || false,
            score: analysis.score || 0,
            errors: analysis.errors || [],
            strengths: analysis.strengths || []
        };
    }
    
    updateProgress(session, problemId, evaluation) {
        const progress = session.progress;
        
        // 시도 횟수 증가
        const attempts = progress.attempts.get(problemId) || 0;
        progress.attempts.set(problemId, attempts + 1);
        
        // 정답 처리
        if (evaluation.correct && !progress.completed.includes(problemId)) {
            progress.completed.push(problemId);
            if (evaluation.score >= 0.8) {
                progress.correct.push(problemId);
            }
        }
        
        // 학생 프로필 업데이트
        if (session.studentId) {
            this.updateStudentProfile(session.studentId, problemId, evaluation);
        }
    }
    
    updateStudentProfile(studentId, problemId, evaluation) {
        const profile = this.studentProgress.get(studentId) || {
            completed: [],
            correct: [],
            struggles: [],
            hintsUsed: 0,
            averageTime: 0,
            conceptMastery: new Map()
        };
        
        // 개념별 숙달도 업데이트
        const problem = this.problemDatabase.get(parseInt(problemId.split('_')[1]));
        if (problem) {
            problem.concepts.forEach(concept => {
                const mastery = profile.conceptMastery.get(concept) || 0;
                const newMastery = evaluation.correct ? 
                    Math.min(mastery + 0.2, 1) : 
                    Math.max(mastery - 0.1, 0);
                profile.conceptMastery.set(concept, newMastery);
            });
        }
        
        this.studentProgress.set(studentId, profile);
    }
    
    async generateFeedback(problem, evaluation, session) {
        const feedback = {
            immediate: '',
            detailed: '',
            scaffolding: []
        };
        
        if (evaluation.correct) {
            feedback.immediate = problem.feedback.correct.message;
            feedback.detailed = `Great work! You demonstrated understanding of ${problem.concepts.join(', ')}.`;
        } else if (evaluation.partial) {
            feedback.immediate = problem.feedback.partial.message;
            feedback.detailed = await this.generatePartialFeedback(problem, evaluation);
            feedback.scaffolding = await this.selectScaffolding(problem, evaluation, session);
        } else {
            feedback.immediate = problem.feedback.incorrect.message;
            feedback.detailed = await this.generateErrorFeedback(problem, evaluation);
            feedback.scaffolding = await this.selectScaffolding(problem, evaluation, session);
        }
        
        return feedback;
    }
    
    async generatePartialFeedback(problem, evaluation) {
        return await this.system.collaborativeAnalysis('partial_feedback', {
            problem,
            evaluation,
            focus: 'improvement_suggestions'
        });
    }
    
    async generateErrorFeedback(problem, evaluation) {
        return await this.system.collaborativeAnalysis('error_feedback', {
            problem,
            errors: evaluation.errors,
            focus: 'misconception_addressing'
        });
    }
    
    async selectScaffolding(problem, evaluation, session) {
        const attempts = session.progress.attempts.get(problem.id) || 1;
        const scaffolding = [];
        
        // 시도 횟수에 따라 점진적으로 더 많은 도움 제공
        if (attempts === 1) {
            scaffolding.push({
                type: 'hint',
                content: problem.scaffolding.immediate[0] || problem.scaffolding.onStruggle[0]
            });
        } else if (attempts === 2) {
            scaffolding.push({
                type: 'visual',
                content: problem.scaffolding.onStruggle.find(s => s.type === 'visual_tool')
            });
        } else {
            scaffolding.push({
                type: 'worked_example',
                content: problem.scaffolding.onGiveUp[0]
            });
        }
        
        return scaffolding;
    }
    
    recommendNextStep(session, evaluation) {
        const recommendations = [];
        
        if (evaluation.correct) {
            // 다음 문제로
            const currentIndex = session.problems.findIndex(p => 
                session.progress.completed.includes(p.id)
            );
            
            if (currentIndex < session.problems.length - 1) {
                recommendations.push({
                    action: 'next_problem',
                    problemId: session.problems[currentIndex + 1].id
                });
            }
        } else {
            // 추가 연습 또는 복습
            if (evaluation.errors.includes('conceptual')) {
                recommendations.push({
                    action: 'review_concept',
                    resources: this.getConceptResources(evaluation.errors)
                });
            }
            
            recommendations.push({
                action: 'retry',
                withScaffolding: true
            });
        }
        
        return recommendations;
    }
    
    getConceptResources(errors) {
        // 오류 유형에 따른 학습 자료 추천
        const resources = [];
        
        errors.forEach(error => {
            switch(error) {
                case 'ratio_notation':
                    resources.push({
                        type: 'video',
                        url: '/resources/ratio-notation-explained',
                        title: '비의 표기법 이해하기'
                    });
                    break;
                case 'simplification':
                    resources.push({
                        type: 'interactive',
                        url: '/resources/gcd-practice',
                        title: '최대공약수 찾기 연습'
                    });
                    break;
                // 추가 리소스...
            }
        });
        
        return resources;
    }
}

module.exports = RatioProblemGenerator;