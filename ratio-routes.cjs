// 기존 서비스에 비와 비율 모듈 통합
const RatioProblemGenerator = require('./ratio-problem-generator.cjs');

// interactive-math-service.cjs 파일 수정 - 라우트 추가 부분
async function addRatioRoutes(app, adaptiveSystem) {
    const ratioGenerator = new RatioProblemGenerator(adaptiveSystem);
    
    // 비와 비율 문제 생성 API
    app.post('/api/ratio/generate', async (req, res) => {
        try {
            const requirements = {
                count: req.body.count || 10,
                focus: req.body.focus || 'mixed',
                scaffolding: req.body.scaffolding || 'adaptive',
                language: req.body.language || 'both',
                studentId: req.body.studentId || null
            };
            
            const result = await ratioGenerator.generateProblemSet(requirements);
            
            res.json({
                status: 'success',
                ...result
            });
            
        } catch (error) {
            res.status(500).json({ 
                status: 'error',
                message: error.message 
            });
        }
    });
    
    // 답안 제출 및 자동 채점 API
    app.post('/api/ratio/submit', async (req, res) => {
        try {
            const { sessionId, problemId, answer } = req.body;
            
            const evaluation = await ratioGenerator.evaluateAnswer(
                sessionId,
                problemId,
                answer
            );
            
            res.json({
                status: 'success',
                ...evaluation
            });
            
        } catch (error) {
            res.status(500).json({ 
                status: 'error',
                message: error.message 
            });
        }
    });
    
    // 학습 진도 조회 API
    app.get('/api/ratio/progress/:sessionId', async (req, res) => {
        try {
            const session = adaptiveSystem.interactions.sessions.get(req.params.sessionId);
            
            if (!session) {
                return res.status(404).json({ 
                    status: 'error',
                    message: 'Session not found' 
                });
            }
            
            res.json({
                status: 'success',
                progress: session.progress,
                recommendations: await ratioGenerator.getProgressRecommendations(session)
            });
            
        } catch (error) {
            res.status(500).json({ 
                status: 'error',
                message: error.message 
            });
        }
    });
    
    // 학생 프로필 조회 API
    app.get('/api/ratio/student/:studentId', async (req, res) => {
        try {
            const profile = await ratioGenerator.analyzeStudent(req.params.studentId);
            
            res.json({
                status: 'success',
                profile
            });
            
        } catch (error) {
            res.status(500).json({ 
                status: 'error',
                message: error.message 
            });
        }
    });
    
    // 개인화된 다음 문제 추천 API
    app.post('/api/ratio/next-problem', async (req, res) => {
        try {
            const { sessionId, studentId } = req.body;
            
            const session = adaptiveSystem.interactions.sessions.get(sessionId);
            const profile = await ratioGenerator.analyzeStudent(studentId);
            
            // 학습 상태 분석
            const analysis = await adaptiveSystem.collaborativeAnalysis('next_problem_recommendation', {
                session,
                profile,
                focus: 'ratio_proportion'
            });
            
            // 맞춤형 문제 생성
            const nextProblem = await ratioGenerator.createAdaptiveProblem(
                session.problems.length + 1,
                analysis.strategy,
                profile
            );
            
            res.json({
                status: 'success',
                problem: nextProblem,
                reason: analysis.reasoning
            });
            
        } catch (error) {
            res.status(500).json({ 
                status: 'error',
                message: error.message 
            });
        }
    });
    
    // 실시간 힌트 요청 API
    app.post('/api/ratio/hint', async (req, res) => {
        try {
            const { sessionId, problemId, currentWork, hintLevel } = req.body;
            
            const session = adaptiveSystem.interactions.sessions.get(sessionId);
            const problem = session.problems.find(p => p.id === problemId);
            
            // 현재 작업 분석
            const analysis = await adaptiveSystem.collaborativeAnalysis('hint_generation', {
                problem,
                currentWork,
                hintLevel: hintLevel || 1
            });
            
            res.json({
                status: 'success',
                hint: analysis.hint,
                nextHintAvailable: analysis.hasMore
            });
            
        } catch (error) {
            res.status(500).json({ 
                status: 'error',
                message: error.message 
            });
        }
    });
    
    // 학습 분석 리포트 API
    app.get('/api/ratio/report/:sessionId', async (req, res) => {
        try {
            const session = adaptiveSystem.interactions.sessions.get(req.params.sessionId);
            
            if (!session) {
                return res.status(404).json({ 
                    status: 'error',
                    message: 'Session not found' 
                });
            }
            
            // 종합 분석 리포트 생성
            const report = await adaptiveSystem.collaborativeAnalysis('learning_report', {
                session,
                focus: 'ratio_proportion'
            });
            
            res.json({
                status: 'success',
                report: {
                    summary: report.summary,
                    strengths: report.strengths,
                    improvements: report.improvements,
                    conceptMastery: report.conceptMastery,
                    recommendations: report.recommendations,
                    visualizations: report.charts
                }
            });
            
        } catch (error) {
            res.status(500).json({ 
                status: 'error',
                message: error.message 
            });
        }
    });
    
    // WebSocket 실시간 상호작용
    function setupRatioWebSocket(io, ratioGenerator) {
        io.on('connection', (socket) => {
            // 실시간 문제 상호작용
            socket.on('ratio_problem_start', async (data) => {
                const { sessionId, problemId } = data;
                
                // 시작 시간 기록
                const session = adaptiveSystem.interactions.sessions.get(sessionId);
                if (session) {
                    session.progress.startTimes = session.progress.startTimes || new Map();
                    session.progress.startTimes.set(problemId, Date.now());
                }
                
                socket.emit('problem_ready', { problemId });
            });
            
            // 실시간 작업 추적
            socket.on('ratio_work_update', async (data) => {
                const { sessionId, problemId, work } = data;
                
                // 작업 분석
                const analysis = await adaptiveSystem.collaborativeAnalysis('work_analysis', {
                    problemId,
                    work,
                    realtime: true
                });
                
                // 즉각적 피드백 제공
                if (analysis.needsIntervention) {
                    socket.emit('immediate_feedback', {
                        type: analysis.interventionType,
                        content: analysis.feedback
                    });
                }
            });
            
            // 어려움 감지
            socket.on('ratio_struggle_detected', async (data) => {
                const { sessionId, problemId, indicators } = data;
                
                // 어려움 분석
                const support = await adaptiveSystem.collaborativeAnalysis('struggle_support', {
                    problemId,
                    indicators,
                    sessionId
                });
                
                socket.emit('adaptive_support', {
                    type: support.type,
                    content: support.content,
                    scaffolding: support.scaffolding
                });
            });
            
            // 진도 동기화
            socket.on('ratio_sync_progress', async (data) => {
                const { sessionId } = data;
                const session = adaptiveSystem.interactions.sessions.get(sessionId);
                
                if (session) {
                    socket.emit('progress_update', {
                        completed: session.progress.completed.length,
                        total: session.problems.length,
                        accuracy: session.progress.correct.length / Math.max(session.progress.completed.length, 1)
                    });
                }
            });
        });
    }
    
    return { ratioGenerator, setupRatioWebSocket };
}

module.exports = { addRatioRoutes };