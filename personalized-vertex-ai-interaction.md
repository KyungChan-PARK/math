# 개인화된 Vertex AI/AutoML 상호작용 시스템

## 핵심 원칙: 사용자와의 지속적 상호작용

### 1. 초기 프로파일링 상호작용

```python
# vertex-ai/user-profiling-interaction.py
class PersonalizedLearningSystem:
    """
    사용자와 상호작용하며 학습하는 시스템
    """
    
    def __init__(self, user_id):
        self.user_id = user_id
        self.interaction_history = []
        self.preferences = {}
        self.learning_style = None
        
    async def initial_profiling(self):
        """초기 사용자 프로파일링 - 대화형"""
        
        questions = [
            {
                "id": "learning_goal",
                "question": "당신의 주요 학습 목표는 무엇입니까?",
                "options": [
                    "SAT 만점",
                    "개념 이해",
                    "문제 해결 능력",
                    "수학적 사고력"
                ]
            },
            {
                "id": "difficulty_preference",
                "question": "어떤 난이도 진행을 선호하십니까?",
                "options": [
                    "매우 점진적 (천천히 어려워짐)",
                    "보통 속도",
                    "빠른 진행 (도전적)",
                    "적응형 (내 수준에 맞춰)"
                ]
            },
            {
                "id": "scaffolding_style",
                "question": "도움말을 어떻게 받고 싶으십니까?",
                "options": [
                    "최소한의 힌트만",
                    "단계별 안내",
                    "개념 설명 포함",
                    "완전한 해설"
                ]
            },
            {
                "id": "visual_preference",
                "question": "시각적 자료를 얼마나 선호하십니까?",
                "options": [
                    "텍스트 위주",
                    "적당한 그래프",
                    "많은 시각화",
                    "인터랙티브 시각화"
                ]
            },
            {
                "id": "language_preference",
                "question": "설명 언어 선호도는?",
                "options": [
                    "한국어만",
                    "한국어 위주 + 영어 병기",
                    "영어 위주 + 한국어 보조",
                    "상황에 따라 유연하게"
                ]
            }
        ]
        
        # 사용자와 상호작용
        for q in questions:
            response = await self.ask_user(q)
            self.preferences[q['id']] = response
            
            # Vertex AI로 즉시 분석
            await self.analyze_preference(q['id'], response)
        
        # 프로파일 생성
        self.learning_style = await self.create_learning_profile()
        
        return self.learning_style
    
    async def ask_user(self, question):
        """사용자에게 질문하고 응답 받기"""
        print(f"\n🤔 {question['question']}")
        for i, option in enumerate(question['options'], 1):
            print(f"  {i}. {option}")
        
        # 실제 구현에서는 웹 인터페이스나 CLI
        choice = input("선택 (1-4): ")
        return question['options'][int(choice) - 1]
    
    async def analyze_preference(self, preference_type, choice):
        """Vertex AI로 선호도 분석"""
        from google.cloud import aiplatform
        
        client = aiplatform.gapic.PredictionServiceClient()
        
        # 선호도를 Vertex AI 모델로 분석
        analysis = client.predict(
            endpoint='projects/math-platform/endpoints/preference-analyzer',
            instances=[{
                'user_id': self.user_id,
                'preference_type': preference_type,
                'choice': choice,
                'timestamp': datetime.now().isoformat()
            }]
        )
        
        # 분석 결과 저장
        self.interaction_history.append({
            'type': 'preference',
            'data': analysis.predictions[0]
        })
```

### 2. 문제 품질 향상 상호작용

```python
# vertex-ai/interactive-quality-enhancement.py
class InteractiveQualityEnhancer:
    """
    사용자 피드백 기반 품질 향상
    """
    
    def __init__(self, user_profile):
        self.user_profile = user_profile
        self.quality_model = self.load_personalized_model()
        
    async def enhance_problem_with_user(self, initial_problem):
        """사용자와 상호작용하며 문제 개선"""
        
        current_problem = initial_problem
        iteration = 0
        max_iterations = 3
        
        while iteration < max_iterations:
            # 1. 현재 문제 제시
            await self.present_problem(current_problem)
            
            # 2. 사용자 피드백 요청
            feedback = await self.get_user_feedback()
            
            if feedback['satisfaction'] >= 4:  # 5점 만점
                break
            
            # 3. Vertex AI로 개선점 분석
            improvements = await self.analyze_feedback(feedback)
            
            # 4. 사용자와 개선 방향 논의
            direction = await self.discuss_improvements(improvements)
            
            # 5. 문제 개선
            current_problem = await self.improve_problem(
                current_problem, 
                direction
            )
            
            iteration += 1
        
        # 6. 최종 확인
        final_confirmation = await self.get_final_confirmation(current_problem)
        
        # 7. 학습 데이터로 저장 (AutoML 재학습용)
        await self.save_improvement_data(
            initial_problem,
            current_problem,
            feedback,
            final_confirmation
        )
        
        return current_problem
    
    async def present_problem(self, problem):
        """문제를 사용자에게 제시"""
        print("\n" + "="*50)
        print("📝 현재 문제:")
        print(f"문제: {problem['text_ko']}")
        print(f"Problem: {problem['text_en']}")
        print(f"난이도: {problem['difficulty']}")
        print(f"예상 시간: {problem['estimated_time']}분")
        
        # 그래프가 있으면 표시
        if problem.get('graph'):
            print(f"📊 그래프: {problem['graph']['description']}")
    
    async def get_user_feedback(self):
        """구체적인 피드백 수집"""
        feedback = {}
        
        # 만족도
        satisfaction = input("\n만족도 (1-5): ")
        feedback['satisfaction'] = int(satisfaction)
        
        # 구체적 피드백
        aspects = [
            ("clarity", "문제의 명확성은 어떻습니까?"),
            ("difficulty", "난이도는 적절합니까?"),
            ("relevance", "SAT와의 관련성은?"),
            ("interest", "흥미도는 어떻습니까?")
        ]
        
        for aspect, question in aspects:
            print(f"\n{question}")
            print("1. 매우 부족")
            print("2. 부족")
            print("3. 보통")
            print("4. 좋음")
            print("5. 매우 좋음")
            feedback[aspect] = int(input("선택: "))
        
        # 구체적 개선 요청
        feedback['specific_request'] = input("\n구체적 개선 요청 (없으면 Enter): ")
        
        return feedback
    
    async def analyze_feedback(self, feedback):
        """Vertex AI로 피드백 분석"""
        from google.cloud import aiplatform
        
        client = aiplatform.gapic.PredictionServiceClient()
        
        # 피드백 분석 모델 호출
        analysis = client.predict(
            endpoint='projects/math-platform/endpoints/feedback-analyzer',
            instances=[{
                'user_profile': self.user_profile,
                'feedback': feedback,
                'context': self.get_context()
            }]
        )
        
        improvements = analysis.predictions[0]['suggested_improvements']
        
        return improvements
    
    async def discuss_improvements(self, improvements):
        """개선 방향 사용자와 논의"""
        print("\n🔧 제안된 개선사항:")
        
        for i, imp in enumerate(improvements, 1):
            print(f"{i}. {imp['description']}")
            print(f"   예상 효과: {imp['expected_impact']}")
        
        print("\n어떤 개선을 적용하시겠습니까?")
        print("0. 모두 적용")
        print("1-N. 선택적 적용")
        print("X. 직접 입력")
        
        choice = input("선택: ")
        
        if choice == '0':
            return improvements
        elif choice.upper() == 'X':
            custom = input("원하는 개선사항을 설명해주세요: ")
            return [{'type': 'custom', 'description': custom}]
        else:
            selected = [improvements[int(c)-1] for c in choice.split(',')]
            return selected
    
    async def improve_problem(self, problem, improvements):
        """선택된 개선사항 적용"""
        
        # 3개 AI 협업으로 개선
        improved_versions = await asyncio.gather(
            self.improve_with_claude(problem, improvements),
            self.improve_with_gemini(problem, improvements),
            self.improve_with_qwen(problem, improvements)
        )
        
        # 사용자에게 선택권 제공
        print("\n📚 개선된 버전들:")
        for i, version in enumerate(improved_versions, 1):
            print(f"\n버전 {i} ({version['ai']}):")
            print(f"  {version['problem']['text_ko'][:100]}...")
        
        choice = input("\n어느 버전을 선택하시겠습니까? (1-3): ")
        
        return improved_versions[int(choice) - 1]['problem']
```

### 3. 맞춤형 스캐폴딩 상호작용

```python
# vertex-ai/personalized-scaffolding.py
class PersonalizedScaffoldingSystem:
    """
    실시간 상호작용 기반 스캐폴딩
    """
    
    def __init__(self, user_profile):
        self.user_profile = user_profile
        self.scaffolding_history = []
        self.effectiveness_scores = {}
        
    async def provide_adaptive_scaffolding(self, problem, student_attempt):
        """학생 시도를 보고 맞춤형 스캐폴딩 제공"""
        
        # 1. 학생의 현재 상태 파악
        student_state = await self.assess_student_state(
            problem, 
            student_attempt
        )
        
        # 2. 필요한 도움 수준 결정
        help_level = await self.determine_help_level(student_state)
        
        # 3. 사용자와 상호작용
        print("\n🤝 도움이 필요하신 것 같습니다.")
        print(f"현재 상태: {student_state['description']}")
        print("\n어떤 형태의 도움을 원하시나요?")
        
        options = self.generate_help_options(help_level)
        for i, opt in enumerate(options, 1):
            print(f"{i}. {opt['description']}")
        
        choice = input("선택: ")
        selected_help = options[int(choice) - 1]
        
        # 4. Vertex AI로 맞춤형 스캐폴딩 생성
        scaffolding = await self.generate_personalized_scaffolding(
            problem,
            student_state,
            selected_help
        )
        
        # 5. 스캐폴딩 제공 후 피드백
        await self.present_scaffolding(scaffolding)
        
        # 6. 효과성 측정
        effectiveness = await self.measure_effectiveness()
        
        # 7. 학습 (AutoML 모델 개선)
        await self.update_scaffolding_model(
            problem,
            student_state,
            scaffolding,
            effectiveness
        )
        
        return scaffolding
    
    async def assess_student_state(self, problem, attempt):
        """Vertex AI로 학생 상태 평가"""
        
        # AutoML Vision으로 손글씨 분석 (있다면)
        if attempt.get('handwriting_image'):
            error_patterns = await self.analyze_handwriting(
                attempt['handwriting_image']
            )
        
        # AutoML NLP로 텍스트 답변 분석
        if attempt.get('text_answer'):
            understanding = await self.analyze_text_response(
                attempt['text_answer']
            )
        
        # 종합 평가
        state = {
            'understanding_level': understanding.get('level', 'unknown'),
            'error_types': error_patterns.get('errors', []),
            'confidence': attempt.get('confidence', 0.5),
            'time_spent': attempt.get('time_spent', 0),
            'previous_hints_used': len(self.scaffolding_history)
        }
        
        # 상태 설명 생성
        if state['understanding_level'] == 'low':
            state['description'] = "개념 이해에 어려움이 있으신 것 같습니다"
        elif 'calculation' in state['error_types']:
            state['description'] = "계산 과정에서 실수가 있었습니다"
        elif state['confidence'] < 0.3:
            state['description'] = "확신이 부족하신 것 같습니다"
        else:
            state['description'] = "거의 다 오셨습니다!"
        
        return state
    
    async def generate_help_options(self, help_level):
        """사용자 수준에 맞는 도움 옵션 생성"""
        
        if help_level == 'minimal':
            return [
                {'type': 'hint', 'description': '작은 힌트만'},
                {'type': 'check', 'description': '지금까지 맞는지 확인'},
                {'type': 'none', 'description': '혼자 해보기'}
            ]
        elif help_level == 'moderate':
            return [
                {'type': 'next_step', 'description': '다음 단계 힌트'},
                {'type': 'concept', 'description': '관련 개념 설명'},
                {'type': 'example', 'description': '유사 예제 보기'},
                {'type': 'visual', 'description': '시각적 설명'}
            ]
        else:  # intensive
            return [
                {'type': 'walkthrough', 'description': '단계별 안내'},
                {'type': 'explanation', 'description': '전체 개념 설명'},
                {'type': 'video', 'description': '동영상 해설'},
                {'type': 'practice', 'description': '더 쉬운 연습문제'}
            ]
    
    async def present_scaffolding(self, scaffolding):
        """스캐폴딩을 단계적으로 제시"""
        
        print("\n💡 도움말:")
        
        # 점진적 공개
        for i, step in enumerate(scaffolding['steps'], 1):
            print(f"\n단계 {i}: {step['content']}")
            
            if step.get('visual'):
                print(f"📊 시각 자료: {step['visual']}")
            
            if step.get('formula'):
                print(f"📐 공식: {step['formula']}")
            
            # 각 단계 후 이해도 확인
            if i < len(scaffolding['steps']):
                understood = input("\n이해하셨나요? (y/n/더 자세히): ")
                
                if understood.lower() == 'n':
                    # 더 자세한 설명
                    await self.provide_detailed_explanation(step)
                elif understood == '더 자세히':
                    # 추가 설명
                    await self.provide_additional_context(step)
    
    async def measure_effectiveness(self):
        """스캐폴딩 효과 측정"""
        
        print("\n📊 도움이 되셨나요?")
        
        metrics = {}
        
        # 이해도
        metrics['understanding'] = int(input("이해도 향상 (1-5): "))
        
        # 자신감
        metrics['confidence'] = int(input("자신감 향상 (1-5): "))
        
        # 다음 시도 성공 여부
        retry = input("다시 시도하시겠습니까? (y/n): ")
        if retry.lower() == 'y':
            success = input("성공하셨나요? (y/n): ")
            metrics['retry_success'] = success.lower() == 'y'
        
        return metrics
    
    async def update_scaffolding_model(self, problem, state, scaffolding, effectiveness):
        """AutoML 모델 업데이트를 위한 데이터 저장"""
        
        training_data = {
            'user_id': self.user_profile['user_id'],
            'problem': problem,
            'student_state': state,
            'scaffolding_provided': scaffolding,
            'effectiveness': effectiveness,
            'timestamp': datetime.now().isoformat()
        }
        
        # Firestore에 저장
        from google.cloud import firestore
        db = firestore.Client()
        
        db.collection('scaffolding_training_data').add(training_data)
        
        # 일정 데이터 쌓이면 AutoML 재학습
        count = db.collection('scaffolding_training_data')\
                  .where('user_id', '==', self.user_profile['user_id'])\
                  .count()
        
        if count >= 100:  # 100개 상호작용 후
            await self.retrain_personal_model()
```

### 4. 지속적 개인화 학습 루프

```python
# vertex-ai/continuous-personalization.py
class ContinuousPersonalizationLoop:
    """
    사용자와의 모든 상호작용을 학습하는 시스템
    """
    
    def __init__(self, user_id):
        self.user_id = user_id
        self.personal_model = None
        self.interaction_count = 0
        
    async def interaction_loop(self):
        """메인 상호작용 루프"""
        
        while True:
            # 1. 사용자 의도 파악
            intent = await self.understand_user_intent()
            
            if intent == 'generate_problem':
                # 2. 문제 생성 요청
                requirements = await self.gather_requirements()
                
                # 3. 개인화된 문제 생성
                problem = await self.generate_personalized_problem(requirements)
                
                # 4. 품질 향상 상호작용
                enhanced = await self.enhance_with_user(problem)
                
                # 5. 스캐폴딩 제공
                await self.provide_scaffolding(enhanced)
                
            elif intent == 'review_progress':
                # 진도 검토
                await self.review_and_adjust()
                
            elif intent == 'change_preferences':
                # 선호도 업데이트
                await self.update_preferences()
                
            elif intent == 'exit':
                break
            
            # 6. 상호작용 학습
            await self.learn_from_interaction()
            
            self.interaction_count += 1
            
            # 7. 주기적 모델 업데이트
            if self.interaction_count % 10 == 0:
                await self.update_personal_model()
    
    async def understand_user_intent(self):
        """사용자 의도 파악"""
        print("\n" + "="*50)
        print("무엇을 도와드릴까요?")
        print("1. 새 문제 생성")
        print("2. 진도 확인")
        print("3. 설정 변경")
        print("4. 종료")
        
        choice = input("선택: ")
        
        intents = {
            '1': 'generate_problem',
            '2': 'review_progress',
            '3': 'change_preferences',
            '4': 'exit'
        }
        
        return intents.get(choice, 'generate_problem')
    
    async def gather_requirements(self):
        """대화형으로 요구사항 수집"""
        
        print("\n어떤 문제를 만들까요?")
        
        # 이전 선호도 기반 제안
        suggestions = await self.get_personalized_suggestions()
        
        print("\n📌 추천 옵션 (당신의 학습 패턴 기반):")
        for i, sug in enumerate(suggestions, 1):
            print(f"{i}. {sug['description']}")
        print("0. 직접 입력")
        
        choice = input("선택: ")
        
        if choice == '0':
            # 직접 입력
            requirements = {
                'grade': input("학년: "),
                'unit': input("단원: "),
                'topic': input("주제: "),
                'difficulty': input("난이도 (1-5): ")
            }
        else:
            requirements = suggestions[int(choice) - 1]['requirements']
        
        # 추가 커스터마이징
        customize = input("\n추가로 조정하시겠습니까? (y/n): ")
        if customize.lower() == 'y':
            requirements = await self.customize_requirements(requirements)
        
        return requirements
    
    async def learn_from_interaction(self):
        """매 상호작용에서 학습"""
        
        # 상호작용 데이터 수집
        interaction_data = {
            'timestamp': datetime.now().isoformat(),
            'user_id': self.user_id,
            'interaction_type': 'problem_generation',
            'user_satisfaction': await self.get_satisfaction(),
            'time_spent': self.get_time_spent(),
            'success_rate': self.calculate_success_rate()
        }
        
        # Vertex AI로 패턴 분석
        from google.cloud import aiplatform
        
        client = aiplatform.gapic.PredictionServiceClient()
        
        pattern = client.predict(
            endpoint='projects/math-platform/endpoints/pattern-analyzer',
            instances=[interaction_data]
        )
        
        # 개인화 프로파일 업데이트
        await self.update_user_profile(pattern.predictions[0])
    
    async def update_personal_model(self):
        """개인 맞춤 모델 업데이트"""
        
        print("\n🔄 개인 맞춤 모델을 업데이트하고 있습니다...")
        
        # AutoML로 개인 모델 재학습
        from google.cloud import aiplatform
        
        # 사용자 데이터 수집
        training_data = await self.collect_user_data()
        
        # 개인 모델 학습
        job = aiplatform.CustomTrainingJob(
            display_name=f"personal-model-{self.user_id}",
            script_path="train_personal_model.py",
            container_uri="gcr.io/cloud-aiplatform/training/tf-cpu.2-8:latest"
        )
        
        model = job.run(
            dataset=training_data,
            model_display_name=f"user-{self.user_id}-model",
            machine_type="n1-standard-4",
            replica_count=1
        )
        
        self.personal_model = model
        
        print("✅ 모델 업데이트 완료! 더 나은 맞춤형 서비스를 제공합니다.")
```

### 5. 실시간 상호작용 인터페이스

```javascript
// interactive-ui/personalized-interaction.js
class PersonalizedInteractionUI {
    constructor(userId) {
        this.userId = userId;
        this.socket = io('https://ai-collaboration-service.run.app');
        this.currentProblem = null;
        this.interactionHistory = [];
    }
    
    async startInteraction() {
        // 초기 프로파일링
        if (!this.hasProfile()) {
            await this.initialProfiling();
        }
        
        // 메인 상호작용 루프
        this.showMainMenu();
    }
    
    showMainMenu() {
        const menu = `
        <div class="interaction-menu">
            <h2>안녕하세요! 무엇을 도와드릴까요?</h2>
            
            <div class="personalized-suggestions">
                <h3>📌 맞춤 추천 (당신의 학습 패턴 기반)</h3>
                ${this.getPersonalizedSuggestions()}
            </div>
            
            <div class="options">
                <button onclick="generateProblem()">문제 생성</button>
                <button onclick="reviewProgress()">진도 확인</button>
                <button onclick="adjustSettings()">설정 조정</button>
            </div>
            
            <div class="real-time-feedback">
                <input type="text" id="feedback" placeholder="즉시 피드백...">
                <button onclick="sendFeedback()">전송</button>
            </div>
        </div>
        `;
        
        document.getElementById('app').innerHTML = menu;
    }
    
    async generateProblem() {
        // 1. 요구사항 대화형 수집
        const requirements = await this.gatherRequirements();
        
        // 2. AI 협업 과정 실시간 표시
        this.showAICollaboration();
        
        // 3. 문제 생성
        this.socket.emit('generate-collaborative-problem', {
            userId: this.userId,
            requirements: requirements,
            realtime: true
        });
        
        // 4. 스트리밍 수신
        this.socket.on('claude-stream', (text) => {
            this.updateAIStream('claude', text);
        });
        
        this.socket.on('qwen-stream', (text) => {
            this.updateAIStream('qwen', text);
        });
        
        this.socket.on('gemini-stream', (text) => {
            this.updateAIStream('gemini', text);
        });
        
        // 5. 품질 점수 실시간 표시
        this.socket.on('quality-score', (score) => {
            this.showQualityScore(score);
        });
        
        // 6. 최종 문제 수신
        this.socket.on('problem-ready', async (problem) => {
            this.currentProblem = problem;
            
            // 7. 사용자와 품질 향상 상호작용
            await this.enhanceWithUser(problem);
        });
    }
    
    async enhanceWithUser(problem) {
        let satisfied = false;
        let iteration = 0;
        
        while (!satisfied && iteration < 3) {
            // 문제 표시
            this.displayProblem(problem);
            
            // 피드백 수집
            const feedback = await this.collectFeedback();
            
            if (feedback.satisfaction >= 4) {
                satisfied = true;
                break;
            }
            
            // 개선 옵션 제시
            const improvements = await this.getImprovements(feedback);
            
            // 사용자 선택
            const selected = await this.selectImprovements(improvements);
            
            // 문제 개선
            problem = await this.improveProblem(problem, selected);
            
            iteration++;
        }
        
        // 최종 확인
        await this.finalizeProb
        
        return problem;
    }
    
    async collectFeedback() {
        const feedback = await this.showFeedbackForm();
        
        // Vertex AI로 즉시 분석
        this.socket.emit('analyze-feedback', {
            userId: this.userId,
            feedback: feedback
        });
        
        return feedback;
    }
    
    showFeedbackForm() {
        return new Promise((resolve) => {
            const form = `
            <div class="feedback-form">
                <h3>이 문제는 어떠신가요?</h3>
                
                <div class="rating-grid">
                    <label>명확성</label>
                    <input type="range" id="clarity" min="1" max="5">
                    
                    <label>난이도</label>
                    <input type="range" id="difficulty" min="1" max="5">
                    
                    <label>흥미도</label>
                    <input type="range" id="interest" min="1" max="5">
                    
                    <label>SAT 관련성</label>
                    <input type="range" id="relevance" min="1" max="5">
                </div>
                
                <textarea id="specific" placeholder="구체적인 개선 요청..."></textarea>
                
                <button onclick="submitFeedback()">제출</button>
            </div>
            `;
            
            // ... 폼 처리 로직
        });
    }
}
```

### 6. 개인화 데이터 플로우

```yaml
# personalization-flow.yaml
interaction_flow:
  1_initial:
    - user_profiling
    - preference_collection
    - learning_style_analysis
    
  2_generation:
    - requirement_gathering
    - personalized_problem_creation
    - real_time_ai_collaboration
    
  3_enhancement:
    - problem_presentation
    - feedback_collection
    - iterative_improvement
    - user_choice
    
  4_scaffolding:
    - attempt_analysis
    - help_level_determination
    - option_presentation
    - adaptive_support
    
  5_learning:
    - interaction_recording
    - pattern_analysis
    - model_update
    - profile_refinement

data_collection:
  every_interaction:
    - user_choices
    - time_spent
    - success_rate
    - satisfaction
    
  periodic_analysis:
    - learning_patterns
    - preference_evolution
    - effectiveness_metrics
    
  model_retraining:
    - trigger: every_100_interactions
    - data: personalized_training_set
    - validation: user_feedback
```

이제 시스템이 완전히 당신과 상호작용하며:

1. **초기에 당신의 선호도를 파악**
2. **매 문제마다 피드백을 받아 개선**
3. **당신의 선택을 학습하여 점점 더 맞춤화**
4. **스캐폴딩도 당신의 스타일에 맞게 조정**
5. **모든 상호작용이 개인 모델 개선에 활용**

시스템이 당신과 함께 성장합니다.