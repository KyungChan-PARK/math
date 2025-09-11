const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs').promises;
const path = require('path');
const AdaptiveMathProblemSystem = require('./adaptive-math-system.cjs');
const FactorizationProblemGenerator = require('./factorization-generator.cjs');

class InteractiveMathService {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: { origin: "*" }
        });
        this.port = 8099;
        
        // 시스템 초기화
        this.adaptiveSystem = new AdaptiveMathProblemSystem();
        this.factorGenerator = new FactorizationProblemGenerator(this.adaptiveSystem);
        
        // 사용자 상호작용 추적
        this.interactions = {
            sessions: new Map(),
            feedback: [],
            improvements: []
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }
    
    setupRoutes() {
        // 메인 대시보드
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // 문제 생성 API
        this.app.post('/api/generate', async (req, res) => {
            try {
                const requirements = req.body;
                
                // 사용자와 상호작용하여 요구사항 명확화
                const clarification = await this.clarifyRequirements(requirements);
                
                if (!clarification.confirmed) {
                    return res.json({
                        status: 'clarification_needed',
                        questions: clarification.questions
                    });
                }
                
                // 문제 생성
                const problems = await this.factorGenerator.generateFactorizationSequence(requirements);
                
                res.json({
                    status: 'success',
                    problems: problems,
                    sessionId: this.createSession(problems)
                });
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // 요구사항 확인 API
        this.app.post('/api/clarify', async (req, res) => {
            const { sessionId, answers } = req.body;
            
            // 답변 처리 및 추가 질문 생성
            const nextQuestions = await this.processAnswers(sessionId, answers);
            
            res.json({
                status: nextQuestions.length > 0 ? 'more_questions' : 'ready',
                questions: nextQuestions
            });
        });
        
        // 피드백 API
        this.app.post('/api/feedback', async (req, res) => {
            const { sessionId, problemId, feedback } = req.body;
            
            // 피드백 저장
            this.interactions.feedback.push({
                sessionId,
                problemId,
                feedback,
                timestamp: new Date().toISOString()
            });
            
            // 시스템 개선
            const improvement = await this.adaptiveSystem.improveSystem(feedback);
            
            res.json({
                status: 'received',
                improvement: improvement
            });
        });
        
        // 학습 분석 API
        this.app.get('/api/analytics', (req, res) => {
            res.json({
                totalSessions: this.interactions.sessions.size,
                feedbackCount: this.interactions.feedback.length,
                improvements: this.interactions.improvements,
                systemMetrics: this.adaptiveSystem.improvementMetrics
            });
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('User connected:', socket.id);
            
            // 실시간 상호작용
            socket.on('requirement_input', async (data) => {
                const questions = await this.generateClarificationQuestions(data);
                socket.emit('clarification_questions', questions);
            });
            
            socket.on('problem_interaction', async (data) => {
                const response = await this.handleProblemInteraction(data);
                socket.emit('interaction_response', response);
            });
            
            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
            });
        });
    }
    
    async clarifyRequirements(requirements) {
        const clarification = {
            confirmed: false,
            questions: []
        };
        
        // 요구사항이 명확한지 확인
        if (!requirements.topic) {
            clarification.questions.push({
                id: 'topic',
                question: '어떤 주제의 문제를 생성하시겠습니까?',
                options: ['인수분해', '방정식', '함수', '기하', '미적분']
            });
        }
        
        if (!requirements.problemCount) {
            clarification.questions.push({
                id: 'count',
                question: '몇 개의 문제를 생성하시겠습니까?',
                type: 'number',
                default: 10
            });
        }
        
        if (!requirements.scaffoldingLevel) {
            clarification.questions.push({
                id: 'scaffolding',
                question: 'Scaffolding 수준을 선택하세요:',
                options: [
                    { value: 'minimal', label: '최소 (힌트만)' },
                    { value: 'moderate', label: '중간 (단계별 가이드)' },
                    { value: 'extensive', label: '광범위 (시각적 도구 + 예시)' },
                    { value: 'adaptive', label: '적응형 (학생 반응에 따라)' }
                ]
            });
        }
        
        if (!requirements.connectionStrategy) {
            clarification.questions.push({
                id: 'connection',
                question: '문제 간 연결 방식:',
                options: [
                    { value: 'A', label: '계열성 (점진적 확장)' },
                    { value: 'B', label: '병렬 (다양한 방법)' },
                    { value: 'C', label: '혼합형' }
                ]
            });
        }
        
        clarification.confirmed = clarification.questions.length === 0;
        
        return clarification;
    }
    
    async generateClarificationQuestions(data) {
        // Claude-Qwen 협업으로 더 정확한 질문 생성
        const analysis = await this.adaptiveSystem.collaborativeAnalysis(
            'requirement_analysis',
            data
        );
        
        return analysis.questions || [];
    }
    
    async processAnswers(sessionId, answers) {
        const session = this.interactions.sessions.get(sessionId);
        if (!session) return [];
        
        // 답변 저장
        session.answers = { ...session.answers, ...answers };
        
        // 추가 질문이 필요한지 확인
        const analysis = await this.adaptiveSystem.collaborativeAnalysis(
            'answer_analysis',
            { sessionId, answers }
        );
        
        return analysis.additionalQuestions || [];
    }
    
    async handleProblemInteraction(data) {
        const { sessionId, problemId, action, content } = data;
        
        // 상호작용 유형에 따른 처리
        switch(action) {
            case 'request_hint':
                return await this.provideHint(sessionId, problemId, content);
                
            case 'check_answer':
                return await this.checkAnswer(sessionId, problemId, content);
                
            case 'request_example':
                return await this.provideExample(sessionId, problemId);
                
            case 'struggle_detected':
                return await this.handleStruggle(sessionId, problemId, content);
                
            default:
                return { status: 'unknown_action' };
        }
    }
    
    async provideHint(sessionId, problemId, currentWork) {
        // 학생의 현재 작업 분석
        const analysis = await this.adaptiveSystem.collaborativeAnalysis(
            'hint_generation',
            { sessionId, problemId, currentWork }
        );
        
        return {
            type: 'hint',
            content: analysis.hint,
            level: analysis.hintLevel
        };
    }
    
    async checkAnswer(sessionId, problemId, answer) {
        // 답안 검증
        const verification = await this.adaptiveSystem.collaborativeAnalysis(
            'answer_verification',
            { sessionId, problemId, answer }
        );
        
        return {
            type: 'verification',
            correct: verification.correct,
            feedback: verification.feedback,
            nextStep: verification.nextStep
        };
    }
    
    async provideExample(sessionId, problemId) {
        // 예시 문제 생성
        const example = await this.adaptiveSystem.collaborativeAnalysis(
            'example_generation',
            { sessionId, problemId }
        );
        
        return {
            type: 'example',
            problem: example.problem,
            solution: example.solution
        };
    }
    
    async handleStruggle(sessionId, problemId, struggleData) {
        // 어려움 분석 및 맞춤 지원
        const support = await this.adaptiveSystem.collaborativeAnalysis(
            'struggle_analysis',
            { sessionId, problemId, struggleData }
        );
        
        return {
            type: 'adaptive_support',
            diagnosis: support.diagnosis,
            intervention: support.intervention
        };
    }
    
    createSession(problems) {
        const sessionId = `session_${Date.now()}`;
        
        this.interactions.sessions.set(sessionId, {
            id: sessionId,
            problems: problems,
            startTime: new Date().toISOString(),
            interactions: [],
            answers: {}
        });
        
        return sessionId;
    }
    
    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Adaptive Math Problem System</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Noto Sans KR', -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        h1 {
            color: white;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        
        .card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .requirement-form {
            display: grid;
            gap: 20px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
        }
        
        label {
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }
        
        input, select, textarea {
            padding: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1em;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1em;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .problem-container {
            display: none;
            margin-top: 30px;
        }
        
        .problem {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        
        .problem-number {
            font-weight: bold;
            color: #667eea;
            font-size: 1.2em;
            margin-bottom: 10px;
        }
        
        .problem-content {
            margin: 15px 0;
            font-size: 1.1em;
        }
        
        .scaffolding-tools {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .tool-btn {
            padding: 8px 15px;
            background: #e0e0e0;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .tool-btn:hover {
            background: #d0d0d0;
        }
        
        .hint-box, .example-box {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            display: none;
        }
        
        .solution-box {
            background: #d4edda;
            border: 1px solid #28a745;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            display: none;
        }
        
        .clarification-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 90%;
            display: none;
            z-index: 1000;
        }
        
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: none;
            z-index: 999;
        }
        
        .feedback-section {
            margin-top: 20px;
            padding: 20px;
            background: #f0f0f0;
            border-radius: 8px;
        }
        
        .improvement-indicator {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 적응형 수학 문제 생성 시스템</h1>
        
        <div class="card">
            <h2>문제 생성 요구사항</h2>
            <div class="requirement-form">
                <div class="form-group">
                    <label>주제 선택</label>
                    <select id="topic">
                        <option value="">선택하세요...</option>
                        <option value="factorization">인수분해</option>
                        <option value="equation">방정식</option>
                        <option value="function">함수</option>
                        <option value="geometry">기하</option>
                        <option value="custom">직접 입력</option>
                    </select>
                </div>
                
                <div class="form-group" id="customTopicGroup" style="display:none;">
                    <label>직접 입력</label>
                    <textarea id="customTopic" rows="3" placeholder="예: 인수분해 개념이 기초개념부터 심화 및 응용문제에 적용이 어떻게 되어가는가"></textarea>
                </div>
                
                <div class="form-group">
                    <label>문제 수</label>
                    <input type="number" id="problemCount" value="10" min="1" max="50">
                </div>
                
                <div class="form-group">
                    <label>Scaffolding 수준</label>
                    <select id="scaffoldingLevel">
                        <option value="adaptive">적응형 (추천)</option>
                        <option value="minimal">최소</option>
                        <option value="moderate">중간</option>
                        <option value="extensive">광범위</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>언어</label>
                    <select id="language">
                        <option value="both">한국어 + English</option>
                        <option value="korean">한국어만</option>
                        <option value="english">English only</option>
                    </select>
                </div>
                
                <button class="btn" onclick="generateProblems()">문제 생성</button>
            </div>
        </div>
        
        <div class="problem-container" id="problemContainer">
            <!-- 생성된 문제들이 여기에 표시됩니다 -->
        </div>
        
        <div class="modal-overlay" id="modalOverlay"></div>
        <div class="clarification-modal" id="clarificationModal">
            <h3>요구사항 확인</h3>
            <div id="clarificationQuestions"></div>
            <button class="btn" onclick="submitClarifications()">확인</button>
        </div>
        
        <div class="improvement-indicator" id="improvementIndicator">
            시스템이 개선되었습니다!
        </div>
    </div>
    
    <script>
        const socket = io();
        let currentSessionId = null;
        let currentProblems = [];
        
        // MathJax 설정
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']]
            }
        };
        
        // 주제 선택 변경 처리
        document.getElementById('topic').addEventListener('change', function() {
            const customGroup = document.getElementById('customTopicGroup');
            if (this.value === 'custom') {
                customGroup.style.display = 'block';
            } else {
                customGroup.style.display = 'none';
            }
        });
        
        async function generateProblems() {
            const topic = document.getElementById('topic').value;
            const customTopic = document.getElementById('customTopic').value;
            const problemCount = document.getElementById('problemCount').value;
            const scaffoldingLevel = document.getElementById('scaffoldingLevel').value;
            const language = document.getElementById('language').value;
            
            const requirements = {
                topic: topic === 'custom' ? customTopic : topic,
                problems: parseInt(problemCount),
                scaffolding: scaffoldingLevel,
                language: language
            };
            
            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requirements)
                });
                
                const data = await response.json();
                
                if (data.status === 'clarification_needed') {
                    showClarificationModal(data.questions);
                } else if (data.status === 'success') {
                    currentSessionId = data.sessionId;
                    currentProblems = data.problems;
                    displayProblems(data.problems);
                }
                
            } catch (error) {
                alert('문제 생성 중 오류: ' + error.message);
            }
        }
        
        function showClarificationModal(questions) {
            const modal = document.getElementById('clarificationModal');
            const overlay = document.getElementById('modalOverlay');
            const container = document.getElementById('clarificationQuestions');
            
            container.innerHTML = '';
            
            questions.forEach(q => {
                const div = document.createElement('div');
                div.className = 'form-group';
                
                if (q.options) {
                    div.innerHTML = \`
                        <label>\${q.question}</label>
                        <select id="clarify_\${q.id}">
                            \${q.options.map(opt => 
                                typeof opt === 'string' 
                                    ? \`<option value="\${opt}">\${opt}</option>\`
                                    : \`<option value="\${opt.value}">\${opt.label}</option>\`
                            ).join('')}
                        </select>
                    \`;
                } else {
                    div.innerHTML = \`
                        <label>\${q.question}</label>
                        <input type="\${q.type || 'text'}" id="clarify_\${q.id}" value="\${q.default || ''}">
                    \`;
                }
                
                container.appendChild(div);
            });
            
            modal.style.display = 'block';
            overlay.style.display = 'block';
        }
        
        async function submitClarifications() {
            const modal = document.getElementById('clarificationModal');
            const overlay = document.getElementById('modalOverlay');
            const inputs = modal.querySelectorAll('input, select');
            
            const answers = {};
            inputs.forEach(input => {
                if (input.id.startsWith('clarify_')) {
                    const key = input.id.replace('clarify_', '');
                    answers[key] = input.value;
                }
            });
            
            // 답변 제출
            const response = await fetch('/api/clarify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: currentSessionId, answers })
            });
            
            const data = await response.json();
            
            if (data.status === 'more_questions') {
                showClarificationModal(data.questions);
            } else {
                modal.style.display = 'none';
                overlay.style.display = 'none';
                // 문제 재생성
                generateProblems();
            }
        }
        
        function displayProblems(problems) {
            const container = document.getElementById('problemContainer');
            container.innerHTML = '';
            container.style.display = 'block';
            
            problems.forEach((problem, index) => {
                const problemDiv = createProblemElement(problem, index);
                container.appendChild(problemDiv);
            });
            
            // MathJax 렌더링
            MathJax.typesetPromise();
        }
        
        function createProblemElement(problem, index) {
            const div = document.createElement('div');
            div.className = 'problem';
            
            const content = problem.content.korean || problem.content.english;
            
            div.innerHTML = \`
                <div class="problem-number">문제 \${problem.number}</div>
                <div class="problem-content">
                    <p>\${content.question}</p>
                    <p style="font-size: 1.3em; margin: 10px 0;">$$\${content.expression}$$</p>
                </div>
                <div class="scaffolding-tools">
                    <button class="tool-btn" onclick="showHint(\${index})">💡 힌트</button>
                    <button class="tool-btn" onclick="showExample(\${index})">📝 예시</button>
                    <button class="tool-btn" onclick="showSolution(\${index})">✅ 해설</button>
                    <button class="tool-btn" onclick="reportStruggle(\${index})">🤔 어려워요</button>
                </div>
                <div class="hint-box" id="hint_\${index}"></div>
                <div class="example-box" id="example_\${index}"></div>
                <div class="solution-box" id="solution_\${index}"></div>
            \`;
            
            return div;
        }
        
        async function showHint(index) {
            const hintBox = document.getElementById(\`hint_\${index}\`);
            const problem = currentProblems[index];
            
            if (hintBox.style.display === 'block') {
                hintBox.style.display = 'none';
            } else {
                // 서버에 힌트 요청
                socket.emit('problem_interaction', {
                    sessionId: currentSessionId,
                    problemId: problem.id,
                    action: 'request_hint'
                });
                
                // 임시로 기본 힌트 표시
                const hints = problem.content.korean?.hints || problem.content.english?.hints || [];
                hintBox.innerHTML = '<h4>💡 힌트</h4>' + hints.map(h => \`<p>• \${h}</p>\`).join('');
                hintBox.style.display = 'block';
            }
        }
        
        async function showExample(index) {
            const exampleBox = document.getElementById(\`example_\${index}\`);
            
            if (exampleBox.style.display === 'block') {
                exampleBox.style.display = 'none';
            } else {
                socket.emit('problem_interaction', {
                    sessionId: currentSessionId,
                    problemId: currentProblems[index].id,
                    action: 'request_example'
                });
                
                exampleBox.innerHTML = '<h4>📝 예시 문제</h4><p>로딩 중...</p>';
                exampleBox.style.display = 'block';
            }
        }
        
        function showSolution(index) {
            const solutionBox = document.getElementById(\`solution_\${index}\`);
            const problem = currentProblems[index];
            
            if (solutionBox.style.display === 'block') {
                solutionBox.style.display = 'none';
            } else {
                const solution = problem.solutions?.korean || problem.solutions?.english || {};
                solutionBox.innerHTML = \`
                    <h4>✅ 해설</h4>
                    <p>\${solution.explanation || '해설 준비 중'}</p>
                \`;
                solutionBox.style.display = 'block';
            }
        }
        
        async function reportStruggle(index) {
            const problem = currentProblems[index];
            
            socket.emit('problem_interaction', {
                sessionId: currentSessionId,
                problemId: problem.id,
                action: 'struggle_detected',
                content: {
                    timeSpent: Date.now() - problem.startTime,
                    hintsUsed: 1
                }
            });
            
            // 피드백 표시
            showImprovementIndicator('맞춤형 도움을 준비 중입니다...');
        }
        
        function showImprovementIndicator(message) {
            const indicator = document.getElementById('improvementIndicator');
            indicator.textContent = message;
            indicator.style.display = 'block';
            
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        }
        
        // Socket 이벤트 처리
        socket.on('interaction_response', (response) => {
            console.log('Interaction response:', response);
            
            if (response.type === 'example') {
                // 예시 문제 표시
                const index = currentProblems.findIndex(p => p.id === response.problemId);
                if (index !== -1) {
                    const exampleBox = document.getElementById(\`example_\${index}\`);
                    exampleBox.innerHTML = \`
                        <h4>📝 예시 문제</h4>
                        <p>\${response.problem}</p>
                        <p>\${response.solution}</p>
                    \`;
                }
            }
        });
        
        socket.on('clarification_questions', (questions) => {
            showClarificationModal(questions);
        });
    </script>
</body>
</html>`;
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════════╗
║         ADAPTIVE MATH PROBLEM SYSTEM - v1.0.0                 ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🌐 Dashboard:     http://localhost:${this.port}                       ║
║                                                                ║
║  Features:                                                     ║
║  ✅ 적응형 문제 생성                                          ║
║  ✅ Claude-Qwen 협업 분석                                     ║
║  ✅ 실시간 Scaffolding                                        ║
║  ✅ 자가개선 시스템                                           ║
║  ✅ Khan Academy 커리큘럼 지원                                ║
║                                                                ║
║  Curriculum Support:                                           ║
║  • Khan Academy (Grade 6-12, Calculus)                        ║
║  • Korean Curriculum (준비중)                                  ║
║  • SAT/AP (준비중)                                            ║
║                                                                ║
║  Connection Strategies:                                        ║
║  • Sequential (A): 계열성 있는 확장                           ║
║  • Parallel (B): 다양한 방법 제시                            ║
║  • Mixed (C): 혼합형                                          ║
║  • Spiral: 개념 재등장                                        ║
║  • Bridge: 부드러운 전환                                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
            `);
        });
    }
}

// 서비스 시작
const service = new InteractiveMathService();
service.start();

module.exports = InteractiveMathService;