/**
 * 인수분해 문제 생성 모듈
 * 기초부터 심화까지 scaffolding 적용
 */

class FactorizationProblemGenerator {
    constructor(adaptiveSystem) {
        this.system = adaptiveSystem;
        this.problemSequence = [];
        this.scaffoldingLevels = {
            minimal: 1,
            moderate: 2,
            extensive: 3,
            adaptive: 4 // 학생 반응에 따라 조절
        };
    }
    
    async generateFactorizationSequence(requirements = {}) {
        const config = {
            totalProblems: requirements.problems || 10,
            startLevel: requirements.startLevel || 'basic',
            endLevel: requirements.endLevel || 'application',
            language: requirements.language || 'both',
            scaffolding: requirements.scaffolding || 'adaptive'
        };
        
        // 문제 구조 설계
        const structure = this.designProblemStructure(config);
        
        // 각 그룹별 문제 생성
        for (const group of structure.groups) {
            const problems = await this.generateGroupProblems(group, config);
            this.problemSequence.push(...problems);
        }
        
        // 스파이럴과 브릿지 적용
        this.applyConnectionStrategies();
        
        return this.problemSequence;
    }
    
    designProblemStructure(config) {
        return {
            groups: [
                {
                    id: 'A',
                    name: '기초 개념 구축',
                    problems: [1, 2, 3],
                    connectionType: 'sequential',
                    concepts: ['공통인수', '변수포함', '복합형']
                },
                {
                    id: 'B',
                    name: '이차식 방법들',
                    problems: [4, 5, 6],
                    connectionType: 'parallel',
                    concepts: ['곱셈공식역', '차제곱', '완전제곱']
                },
                {
                    id: 'C',
                    name: '심화 기법',
                    problems: [7, 8],
                    connectionType: 'mixed',
                    concepts: ['계수처리', '음수계수']
                },
                {
                    id: 'D',
                    name: '응용',
                    problems: [9, 10],
                    connectionType: 'sequential',
                    concepts: ['고차다항식', '실생활']
                }
            ],
            bridges: [
                { between: ['A', 'B'], problemIndex: 3.5 },
                { between: ['B', 'C'], problemIndex: 6.5 }
            ],
            spirals: [
                { concept: '공통인수', appearIn: [1, 3, 7] },
                { concept: '패턴인식', appearIn: [4, 5, 6, 8] }
            ]
        };
    }
    
    async generateGroupProblems(group, config) {
        const problems = [];
        
        for (let i = 0; i < group.problems.length; i++) {
            const problemNumber = group.problems[i];
            const concept = group.concepts[i];
            
            const problem = await this.createProblem(
                problemNumber,
                concept,
                group,
                config
            );
            
            problems.push(problem);
        }
        
        return problems;
    }
    
    async createProblem(number, concept, group, config) {
        const problem = {
            id: `factorization_${number}`,
            number: number,
            group: group.id,
            concept: concept,
            content: {},
            scaffolding: {},
            solutions: {},
            metadata: {
                created: new Date().toISOString(),
                difficulty: this.calculateDifficulty(number),
                connectionType: group.connectionType
            }
        };
        
        // 문제 내용 생성
        problem.content = this.generateProblemContent(number, concept);
        
        // Scaffolding 설계
        problem.scaffolding = await this.designScaffolding(problem, config.scaffolding);
        
        // 해설 생성 (한글/영문)
        problem.solutions = this.generateSolutions(problem, config.language);
        
        return problem;
    }
    
    generateProblemContent(number, concept) {
        const contents = {
            korean: {},
            english: {}
        };
        
        // 문제별 구체적 내용
        const problemData = this.getProblemData(number, concept);
        
        contents.korean = {
            question: problemData.question.kr,
            expression: problemData.expression,
            hints: problemData.hints.kr
        };
        
        contents.english = {
            question: problemData.question.en,
            expression: problemData.expression,
            hints: problemData.hints.en
        };
        
        return contents;
    }
    
    getProblemData(number, concept) {
        const problems = {
            1: {
                question: {
                    kr: "다음 식에서 공통인수를 찾아 인수분해하세요:",
                    en: "Factor out the common factor:"
                },
                expression: "2x + 4",
                hints: {
                    kr: ["2와 4의 공통인수는 무엇인가요?", "2로 묶어보세요"],
                    en: ["What is the common factor of 2 and 4?", "Factor out 2"]
                }
            },
            2: {
                question: {
                    kr: "변수가 포함된 공통인수를 찾아 인수분해하세요:",
                    en: "Factor out the common factor with variable:"
                },
                expression: "3x² + 6x",
                hints: {
                    kr: ["3과 6의 공통인수는?", "x²과 x의 공통인수는?"],
                    en: ["Common factor of 3 and 6?", "Common factor of x² and x?"]
                }
            },
            3: {
                question: {
                    kr: "복합적인 공통인수를 찾아 인수분해하세요:",
                    en: "Factor out the composite common factor:"
                },
                expression: "4x²y + 8xy²",
                hints: {
                    kr: ["숫자 부분의 공통인수는?", "변수 부분의 공통인수는?"],
                    en: ["Common numerical factor?", "Common variable factor?"]
                }
            },
            // 브릿지 문제 (3.5)
            3.5: {
                question: {
                    kr: "공통인수를 먼저 빼고, 남은 식을 다시 인수분해하세요:",
                    en: "Factor out common factor first, then factor the remaining:"
                },
                expression: "2x² + 10x + 12",
                hints: {
                    kr: ["먼저 2를 빼보세요", "x² + 5x + 6을 인수분해하세요"],
                    en: ["First factor out 2", "Now factor x² + 5x + 6"]
                }
            },
            4: {
                question: {
                    kr: "이차식을 인수분해하세요 (합과 곱 이용):",
                    en: "Factor the quadratic (sum and product method):"
                },
                expression: "x² + 5x + 6",
                hints: {
                    kr: ["합이 5, 곱이 6인 두 수는?", "2와 3을 확인해보세요"],
                    en: ["Two numbers: sum=5, product=6?", "Check 2 and 3"]
                }
            },
            5: {
                question: {
                    kr: "차제곱 공식을 이용하여 인수분해하세요:",
                    en: "Factor using difference of squares:"
                },
                expression: "x² - 9",
                hints: {
                    kr: ["a² - b² = (a+b)(a-b)", "9 = 3²"],
                    en: ["a² - b² = (a+b)(a-b)", "9 = 3²"]
                }
            },
            6: {
                question: {
                    kr: "완전제곱식임을 확인하고 인수분해하세요:",
                    en: "Identify and factor the perfect square:"
                },
                expression: "x² + 6x + 9",
                hints: {
                    kr: ["(a + b)² = a² + 2ab + b²", "중간항이 2×x×3인지 확인"],
                    en: ["(a + b)² = a² + 2ab + b²", "Check if middle term is 2×x×3"]
                }
            },
            // 브릿지 문제 (6.5)
            6.5: {
                question: {
                    kr: "여러 방법 중 적절한 것을 선택하여 인수분해하세요:",
                    en: "Choose the appropriate method to factor:"
                },
                expression: "4x² - 16",
                hints: {
                    kr: ["공통인수 4를 먼저?", "아니면 차제곱 공식?"],
                    en: ["Factor out 4 first?", "Or use difference of squares?"]
                }
            },
            7: {
                question: {
                    kr: "계수가 1이 아닌 이차식을 인수분해하세요:",
                    en: "Factor with leading coefficient ≠ 1:"
                },
                expression: "2x² + 7x + 3",
                hints: {
                    kr: ["2×3=6, 6을 만드는 두 수로 7을 만들기", "1×6, 2×3 중 어느 것?"],
                    en: ["2×3=6, find factors of 6 that sum to 7", "Try 1×6 or 2×3"]
                }
            },
            8: {
                question: {
                    kr: "음수 계수가 포함된 식을 인수분해하세요:",
                    en: "Factor with negative coefficients:"
                },
                expression: "6x² - 11x - 10",
                hints: {
                    kr: ["6×(-10)=-60", "-60의 인수 중 합이 -11인 것은?"],
                    en: ["6×(-10)=-60", "Which factors of -60 sum to -11?"]
                }
            },
            9: {
                question: {
                    kr: "고차 다항식을 인수분해하세요:",
                    en: "Factor the higher degree polynomial:"
                },
                expression: "x³ - 8",
                hints: {
                    kr: ["a³ - b³ = (a-b)(a² + ab + b²)", "8 = 2³"],
                    en: ["a³ - b³ = (a-b)(a² + ab + b²)", "8 = 2³"]
                }
            },
            10: {
                question: {
                    kr: "정원의 넓이가 x² + 8x + 15 제곱미터일 때, 가로와 세로의 길이를 x를 사용하여 나타내세요.",
                    en: "A garden has area x² + 8x + 15 square meters. Express length and width using x."
                },
                expression: "x² + 8x + 15",
                hints: {
                    kr: ["넓이 = 가로 × 세로", "인수분해하면 두 일차식의 곱"],
                    en: ["Area = length × width", "Factoring gives product of two linear expressions"]
                }
            }
        };
        
        return problems[number] || problems[Math.floor(number)];
    }
    
    calculateDifficulty(number) {
        if (number <= 3) return 'basic';
        if (number <= 6) return 'intermediate';
        if (number <= 8) return 'advanced';
        return 'application';
    }
    
    async designScaffolding(problem, level) {
        const scaffolding = {
            level: level,
            components: []
        };
        
        // 기본 힌트
        scaffolding.components.push({
            type: 'hint',
            content: problem.content.korean.hints,
            trigger: 'on_request'
        });
        
        // 시각적 도구
        if (problem.number >= 4) {
            scaffolding.components.push({
                type: 'visual',
                content: this.generateVisualAid(problem),
                trigger: 'on_struggle'
            });
        }
        
        // 예시 문제
        if (problem.metadata.difficulty === 'advanced' || problem.metadata.difficulty === 'application') {
            scaffolding.components.push({
                type: 'example',
                content: await this.generateExampleProblem(problem),
                trigger: 'on_extended_struggle'
            });
        }
        
        // 단계별 가이드
        scaffolding.components.push({
            type: 'step_guide',
            content: this.generateStepGuide(problem),
            trigger: 'on_give_up'
        });
        
        return scaffolding;
    }
    
    generateVisualAid(problem) {
        // 문제에 따른 시각적 도구 생성
        if (problem.concept.includes('완전제곱')) {
            return {
                type: 'area_model',
                description: '정사각형 넓이 모델',
                svg: this.createSquareModel(problem.content.korean.expression)
            };
        }
        
        return {
            type: 'factor_tree',
            description: '인수 트리',
            structure: this.createFactorTree(problem.content.korean.expression)
        };
    }
    
    createSquareModel(expression) {
        // SVG 형태의 정사각형 모델 생성
        return `<svg viewBox="0 0 200 200">
            <rect x="10" y="10" width="180" height="180" fill="none" stroke="black"/>
            <!-- 실제 구현 시 expression에 따라 동적 생성 -->
        </svg>`;
    }
    
    createFactorTree(expression) {
        // 인수 트리 구조 생성
        return {
            root: expression,
            branches: []
        };
    }
    
    async generateExampleProblem(problem) {
        // 유사하지만 더 쉬운 예시 문제 생성
        const example = {
            korean: {},
            english: {}
        };
        
        // 문제 번호에 따른 예시
        if (problem.number === 7) {
            example.korean = {
                problem: "2x² + 5x + 2를 인수분해해봅시다",
                solution: [
                    "1단계: 2 × 2 = 4",
                    "2단계: 4의 인수 찾기: 1×4, 2×2",
                    "3단계: 합이 5가 되는 조합: 1+4=5 ✓",
                    "4단계: 2x² + x + 4x + 2",
                    "5단계: x(2x + 1) + 2(2x + 1)",
                    "6단계: (x + 2)(2x + 1)"
                ]
            };
            example.english = {
                problem: "Let's factor 2x² + 5x + 2",
                solution: [
                    "Step 1: 2 × 2 = 4",
                    "Step 2: Factors of 4: 1×4, 2×2",
                    "Step 3: Sum to 5: 1+4=5 ✓",
                    "Step 4: 2x² + x + 4x + 2",
                    "Step 5: x(2x + 1) + 2(2x + 1)",
                    "Step 6: (x + 2)(2x + 1)"
                ]
            };
        }
        
        return example;
    }
    
    generateStepGuide(problem) {
        // 문제별 단계별 가이드
        const guides = {
            korean: [],
            english: []
        };
        
        // 문제 유형에 따른 가이드
        switch(problem.concept) {
            case '공통인수':
                guides.korean = [
                    "모든 항을 살펴보세요",
                    "각 항에 공통으로 들어있는 수나 문자를 찾으세요",
                    "그것을 밖으로 빼내세요",
                    "괄호 안에 남은 식을 정리하세요"
                ];
                guides.english = [
                    "Look at all terms",
                    "Find common numbers or variables",
                    "Factor them out",
                    "Simplify what remains in parentheses"
                ];
                break;
            // 다른 개념들도 추가...
        }
        
        return guides;
    }
    
    generateSolutions(problem, language) {
        const solutions = {};
        
        // 전체 해설 생성
        const fullSolution = this.createFullSolution(problem);
        
        if (language === 'both' || language === 'korean') {
            solutions.korean = this.generateKoreanSolution(problem, fullSolution);
        }
        
        if (language === 'both' || language === 'english') {
            solutions.english = this.generateEnglishSolution(problem, fullSolution);
        }
        
        return solutions;
    }
    
    createFullSolution(problem) {
        // 문제별 완전한 풀이 과정
        const solutions = {
            1: {
                steps: ['2x + 4', '= 2(x + 2)'],
                answer: '2(x + 2)'
            },
            2: {
                steps: ['3x² + 6x', '= 3x(x + 2)'],
                answer: '3x(x + 2)'
            },
            // ... 나머지 문제들
        };
        
        return solutions[problem.number];
    }
    
    generateKoreanSolution(problem, fullSolution) {
        return {
            explanation: this.getKoreanExplanation(problem),
            steps: fullSolution.steps.map((step, index) => ({
                step: step,
                description: this.getKoreanStepDescription(problem, index)
            })),
            answer: fullSolution.answer,
            conceptReview: this.getKoreanConceptReview(problem),
            commonMistakes: this.getKoreanCommonMistakes(problem),
            extension: this.getKoreanExtension(problem)
        };
    }
    
    generateEnglishSolution(problem, fullSolution) {
        return {
            explanation: this.getEnglishExplanation(problem),
            steps: fullSolution.steps.map((step, index) => ({
                step: step,
                description: this.getEnglishStepDescription(problem, index)
            })),
            answer: fullSolution.answer,
            conceptReview: this.getEnglishConceptReview(problem),
            commonMistakes: this.getEnglishCommonMistakes(problem),
            extension: this.getEnglishExtension(problem)
        };
    }
    
    // 스파이럴과 브릿지 적용
    applyConnectionStrategies() {
        // 스파이럴 패턴 적용
        this.applySpiral();
        
        // 브릿지 문제 삽입
        this.insertBridges();
    }
    
    applySpiral() {
        // 이전 개념이 후속 문제에서 재등장
        for (let i = 3; i < this.problemSequence.length; i++) {
            const currentProblem = this.problemSequence[i];
            const previousConcepts = this.problemSequence
                .slice(0, i)
                .map(p => p.concept);
            
            currentProblem.spiralConnections = previousConcepts.filter(
                concept => this.isRelatedConcept(concept, currentProblem.concept)
            );
        }
    }
    
    insertBridges() {
        // 그룹 간 전환을 부드럽게 하는 브릿지 문제
        const bridgeProblems = [
            this.getProblemData(3.5, 'bridge_A_to_B'),
            this.getProblemData(6.5, 'bridge_B_to_C')
        ];
        
        // 실제 시퀀스에 삽입
        // 구현 시 인덱스 조정 필요
    }
    
    isRelatedConcept(concept1, concept2) {
        const relations = {
            '공통인수': ['계수처리', '고차다항식'],
            '패턴인식': ['차제곱', '완전제곱', '음수계수']
        };
        
        return relations[concept1]?.includes(concept2) || false;
    }
    
    // Helper 메서드들
    getKoreanExplanation(problem) {
        const explanations = {
            1: "공통인수를 찾는 것은 인수분해의 가장 기본적인 방법입니다. 모든 항에 공통으로 포함된 수나 문자를 찾아 밖으로 빼내는 것입니다."
            // ... 각 문제별 설명
        };
        return explanations[problem.number];
    }
    
    getEnglishExplanation(problem) {
        const explanations = {
            1: "Finding common factors is the most basic factoring method. We identify numbers or variables common to all terms and factor them out."
            // ... 각 문제별 설명
        };
        return explanations[problem.number];
    }
    
    getKoreanStepDescription(problem, stepIndex) {
        // 각 단계별 한국어 설명
        return `${stepIndex + 1}단계 설명`;
    }
    
    getEnglishStepDescription(problem, stepIndex) {
        // 각 단계별 영어 설명
        return `Step ${stepIndex + 1} explanation`;
    }
    
    getKoreanConceptReview(problem) {
        return "핵심 개념 복습 내용";
    }
    
    getEnglishConceptReview(problem) {
        return "Key concept review";
    }
    
    getKoreanCommonMistakes(problem) {
        return ["자주 하는 실수 1", "자주 하는 실수 2"];
    }
    
    getEnglishCommonMistakes(problem) {
        return ["Common mistake 1", "Common mistake 2"];
    }
    
    getKoreanExtension(problem) {
        return "다음 단계로 확장하면...";
    }
    
    getEnglishExtension(problem) {
        return "Extending to the next level...";
    }
}

module.exports = FactorizationProblemGenerator;