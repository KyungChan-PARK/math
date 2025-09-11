/**
 * 1인 교사 맞춤형 개인화 엔진
 * 교사의 패턴을 학습하고 점진적으로 개선
 */

class TeacherPersonalizationEngine {
    constructor() {
        this.teacherProfile = {
            id: 'teacher_001',
            preferences: {},
            patterns: [],
            frequentConcepts: [],
            commonRequests: [],
            sessionHistory: []
        };
        
        this.learningMode = true;
        this.adaptationLevel = 0; // 0-100 적응도
    }

    // 교사와의 첫 상호작용 - 프로파일 구축
    async initializeProfile() {
        console.log(" 선생님 맞춤 설정을 시작합니다...\n");
        
        const questions = [
            {
                id: 'grade_level',
                question: "어떤 학년을 가르치시나요?",
                type: 'select',
                options: ['초등 3-4', '초등 5-6', '중등 1', '중등 2', '중등 3', '고등']
            },
            {
                id: 'main_topics',
                question: "주로 다루는 수학 영역은? (복수 선택)",
                type: 'multi',
                options: ['도형/기하', '수와 연산', '함수', '확률/통계', '방정식', '측정']
            },
            {
                id: 'pain_points',
                question: "수업 준비에서 가장 어려운 점은?",
                type: 'text'
            },
            {
                id: 'visualization_needs',
                question: "시각화가 가장 필요한 개념 3가지는?",
                type: 'text'
            },
            {
                id: 'interaction_style',
                question: "선호하는 제어 방식은?",
                type: 'select',
                options: ['음성 명령', '타이핑', '제스처', '혼합']
            }
        ];

        // 답변 저장
        for (const q of questions) {
            this.teacherProfile.preferences[q.id] = await this.askQuestion(q);
        }

        return this.teacherProfile;
    }

    // 실시간 학습 - 모든 상호작용에서 학습
    async learnFromInteraction(interaction) {
        const { type, content, context, result, feedback } = interaction;
        
        // 패턴 추출
        const pattern = this.extractPattern(interaction);
        
        // 빈도 분석
        this.updateFrequency(pattern);
        
        // 선호도 학습
        if (feedback) {
            this.adjustPreferences(pattern, feedback);
        }
        
        // 적응도 증가
        this.adaptationLevel = Math.min(100, this.adaptationLevel + 0.5);
        
        // 메모리에 저장
        await this.saveToMemory(pattern);
        
        return {
            learned: pattern,
            adaptationLevel: this.adaptationLevel,
            suggestion: this.generateSuggestion(pattern)
        };
    }

    // 패턴 추출
    extractPattern(interaction) {
        const pattern = {
            timestamp: Date.now(),
            type: interaction.type,
            concept: this.identifyConcept(interaction.content),
            action: this.identifyAction(interaction.content),
            frequency: 1,
            success: interaction.result?.success || false
        };

        // 시간대별 패턴
        const hour = new Date().getHours();
        if (hour >= 9 && hour <= 12) {
            pattern.timeContext = 'morning_class';
        } else if (hour >= 13 && hour <= 16) {
            pattern.timeContext = 'afternoon_class';
        }

        return pattern;
    }

    // 개념 식별
    identifyConcept(content) {
        const concepts = {
            '삼각형': 'triangle',
            '각도': 'angle',
            '변': 'side',
            '평행': 'parallel',
            '수직': 'perpendicular',
            '원': 'circle',
            '사각형': 'rectangle',
            '다각형': 'polygon',
            '함수': 'function',
            '그래프': 'graph'
        };

        for (const [korean, english] of Object.entries(concepts)) {
            if (content.includes(korean)) {
                return english;
            }
        }

        return 'unknown';
    }

    // 액션 식별
    identifyAction(content) {
        const actions = {
            '그려': 'draw',
            '보여': 'show',
            '크게': 'scale_up',
            '작게': 'scale_down',
            '회전': 'rotate',
            '이동': 'move',
            '색': 'color',
            '측정': 'measure',
            '비교': 'compare',
            '변환': 'transform'
        };

        for (const [korean, english] of Object.entries(actions)) {
            if (content.includes(korean)) {
                return english;
            }
        }

        return 'unknown';
    }

    // 빈도 업데이트
    updateFrequency(pattern) {
        // 자주 사용하는 개념 추적
        const existing = this.teacherProfile.frequentConcepts.find(
            c => c.concept === pattern.concept
        );

        if (existing) {
            existing.count++;
            existing.lastUsed = Date.now();
        } else {
            this.teacherProfile.frequentConcepts.push({
                concept: pattern.concept,
                count: 1,
                lastUsed: Date.now()
            });
        }

        // 상위 10개만 유지
        this.teacherProfile.frequentConcepts.sort((a, b) => b.count - a.count);
        this.teacherProfile.frequentConcepts = this.teacherProfile.frequentConcepts.slice(0, 10);
    }

    // 선호도 조정
    adjustPreferences(pattern, feedback) {
        const { positive, negative, neutral } = feedback;
        
        if (positive) {
            // 긍정적 피드백 - 이 패턴을 강화
            pattern.weight = (pattern.weight || 1) * 1.2;
        } else if (negative) {
            // 부정적 피드백 - 이 패턴을 약화
            pattern.weight = (pattern.weight || 1) * 0.8;
        }

        // 선호 스타일 학습
        if (pattern.type === 'gesture' && positive) {
            this.teacherProfile.preferences.preferredInput = 'gesture';
        }
    }

    // 제안 생성 - 학습한 패턴 기반
    generateSuggestion(pattern) {
        const suggestions = [];
        
        // 자주 사용하는 개념 기반 제안
        if (pattern.concept === 'triangle') {
            const triangleUsage = this.teacherProfile.frequentConcepts.find(
                c => c.concept === 'triangle'
            );
            
            if (triangleUsage && triangleUsage.count > 5) {
                suggestions.push("삼각형 템플릿을 즐겨찾기에 추가할까요?");
                suggestions.push("자주 사용하는 '이등변삼각형' 프리셋을 만들까요?");
            }
        }

        // 시간대별 제안
        if (pattern.timeContext === 'morning_class') {
            suggestions.push("오전 수업용 기본 설정을 적용할까요?");
        }

        // 연관 개념 제안
        if (pattern.concept === 'angle') {
            suggestions.push("각도기 도구를 함께 표시할까요?");
            suggestions.push("각의 이등분선도 그려볼까요?");
        }

        return suggestions;
    }

    // 맞춤형 도구 생성
    async createPersonalizedTools() {
        const tools = [];
        
        // 자주 사용하는 개념으로 빠른 도구 생성
        for (const concept of this.teacherProfile.frequentConcepts.slice(0, 5)) {
            tools.push({
                name: `Quick ${concept.concept}`,
                shortcut: this.generateShortcut(concept.concept),
                action: () => this.quickCreate(concept.concept)
            });
        }

        // 선호 스타일 기반 도구
        if (this.teacherProfile.preferences.preferredInput === 'gesture') {
            tools.push({
                name: 'Gesture Mode',
                enabled: true,
                sensitivity: 'high'
            });
        }

        return tools;
    }

    // 세션 분석 - 수업 후 개선점 찾기
    async analyzeSession(session) {
        const analysis = {
            duration: session.duration,
            conceptsCovered: [],
            bottlenecks: [],
            improvements: []
        };

        // 시간이 오래 걸린 작업 찾기
        const slowTasks = session.interactions.filter(i => i.duration > 5000);
        if (slowTasks.length > 0) {
            analysis.bottlenecks = slowTasks.map(t => ({
                task: t.content,
                duration: t.duration,
                suggestion: `'${t.content}' 작업을 단축키로 등록하시겠어요?`
            }));
        }

        // 반복 작업 찾기
        const repeated = this.findRepeatedActions(session.interactions);
        if (repeated.length > 0) {
            analysis.improvements.push({
                type: 'automation',
                actions: repeated,
                suggestion: '반복 작업을 매크로로 만들어드릴까요?'
            });
        }

        // 다음 수업 예측
        analysis.nextPrediction = this.predictNextLesson();

        return analysis;
    }

    // 반복 작업 찾기
    findRepeatedActions(interactions) {
        const actionCounts = {};
        
        interactions.forEach(i => {
            const key = `${i.type}_${i.concept}`;
            actionCounts[key] = (actionCounts[key] || 0) + 1;
        });

        return Object.entries(actionCounts)
            .filter(([_, count]) => count > 3)
            .map(([action, count]) => ({ action, count }));
    }

    // 다음 수업 예측
    predictNextLesson() {
        // 요일별 패턴
        const dayOfWeek = new Date().getDay();
        const previousLessons = this.teacherProfile.sessionHistory.filter(
            s => new Date(s.date).getDay() === dayOfWeek
        );

        if (previousLessons.length > 0) {
            const commonTopics = this.extractCommonTopics(previousLessons);
            return {
                likely: commonTopics[0],
                confidence: 0.7,
                preparation: `${commonTopics[0]} 관련 자료를 미리 준비해둘까요?`
            };
        }

        return null;
    }

    // 공통 주제 추출
    extractCommonTopics(lessons) {
        const topics = {};
        
        lessons.forEach(lesson => {
            lesson.concepts.forEach(concept => {
                topics[concept] = (topics[concept] || 0) + 1;
            });
        });

        return Object.entries(topics)
            .sort((a, b) => b[1] - a[1])
            .map(([topic, _]) => topic);
    }

    // 메모리 저장
    async saveToMemory(pattern) {
        // Neo4j나 로컬 스토리지에 저장
        console.log('Saving pattern to memory:', pattern);
        
        // 세션 히스토리 업데이트
        this.teacherProfile.sessionHistory.push({
            date: new Date(),
            pattern: pattern,
            adaptationLevel: this.adaptationLevel
        });

        // 최근 100개 세션만 유지
        if (this.teacherProfile.sessionHistory.length > 100) {
            this.teacherProfile.sessionHistory.shift();
        }
    }

    // 질문 (실제로는 UI를 통해)
    async askQuestion(question) {
        console.log(`❓ ${question.question}`);
        if (question.options) {
            console.log('   옵션:', question.options.join(', '));
        }
        // 실제로는 UI 입력을 받아야 함
        return 'placeholder_answer';
    }

    // 바로가기 생성
    generateShortcut(concept) {
        const shortcuts = {
            'triangle': 'Ctrl+T',
            'angle': 'Ctrl+A',
            'circle': 'Ctrl+C',
            'rectangle': 'Ctrl+R'
        };
        return shortcuts[concept] || 'Ctrl+Shift+' + concept[0].toUpperCase();
    }

    // 빠른 생성
    quickCreate(concept) {
        console.log(`Creating ${concept} with personalized settings...`);
        // After Effects 명령 생성
        return {
            script: `// Quick create ${concept}`,
            settings: this.teacherProfile.preferences
        };
    }

    // 적응도 리포트
    getAdaptationReport() {
        return {
            level: this.adaptationLevel,
            status: this.adaptationLevel > 80 ? '완전 적응' :
                   this.adaptationLevel > 50 ? '학습 중' :
                   this.adaptationLevel > 20 ? '초기 학습' : '프로파일링',
            learnedPatterns: this.teacherProfile.patterns.length,
            frequentConcepts: this.teacherProfile.frequentConcepts,
            personalizedTools: this.teacherProfile.patterns.filter(p => p.weight > 1.5).length,
            suggestions: this.generateCurrentSuggestions()
        };
    }

    // 현재 제안사항
    generateCurrentSuggestions() {
        const suggestions = [];
        
        // 적응도에 따른 제안
        if (this.adaptationLevel < 20) {
            suggestions.push("더 많은 상호작용이 필요해요. 자유롭게 명령해주세요!");
        } else if (this.adaptationLevel < 50) {
            suggestions.push("선생님의 스타일을 파악 중이에요. 자주 사용하는 기능을 알려주세요.");
        } else {
            suggestions.push("선생님 맞춤 단축키를 설정해드릴 수 있어요.");
        }

        return suggestions;
    }
}

// Export
export default TeacherPersonalizationEngine;