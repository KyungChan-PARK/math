/**
 * Adaptive Math Learning System v2.0
 * 통합 서비스 - 모든 모듈 연결
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

// 핵심 모듈
const AdaptiveMathProblemSystem = require('./adaptive-math-system.cjs');
const FactorizationProblemGenerator = require('./factorization-generator.cjs');
const RatioProblemGenerator = require('./ratio-problem-generator.cjs');
const { addRatioRoutes } = require('./ratio-routes.cjs');

class IntegratedMathLearningSystem {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.PORT || 8100;
        console.log('🔧 Using port:', this.port);
        
        // 시스템 컴포넌트 초기화
        this.initializeComponents();
        
        // 미들웨어 설정
        this.setupMiddleware();
        
        // 라우트 설정
        this.setupRoutes();
        
        // WebSocket 핸들러
        this.setupSocketHandlers();
        
        // 분석 엔진
        this.setupAnalytics();
    }
    
    async initializeComponents() {
        console.log('🚀 시스템 컴포넌트 초기화 중...');
        
        // 적응형 시스템
        this.adaptiveSystem = new AdaptiveMathProblemSystem();
        
        // 문제 생성기
        this.generators = {
            factorization: new FactorizationProblemGenerator(this.adaptiveSystem),
            ratio: new RatioProblemGenerator(this.adaptiveSystem)
        };
        
        // 데이터 저장소
        this.dataStore = {
            sessions: new Map(),
            students: new Map(),
            analytics: new Map(),
            reports: new Map()
        };
        
        console.log('✅ 컴포넌트 초기화 완료');
    }
    
    setupMiddleware() {
        // CORS 설정
        this.app.use(cors());
        
        // Body parser
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Static files
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // 로깅
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }
    
    setupRoutes() {
        // 메인 페이지
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'));
        });
        
        // 비와 비율 문제 페이지
        this.app.get('/ratio-problems', (req, res) => {
            res.sendFile(path.join(__dirname, 'ratio-proportion-problems.html'));
        });
        
        // 대시보드
        this.app.get('/dashboard', (req, res) => {
            res.sendFile(path.join(__dirname, 'ratio-dashboard.html'));
        });
        
        // API 라우트
        this.setupAPIRoutes();
        
        // 비와 비율 전용 라우트
        addRatioRoutes(this.app, this.adaptiveSystem).then(({ setupRatioWebSocket }) => {
            setupRatioWebSocket(this.io, this.generators.ratio);
        });
    }
    
    setupAPIRoutes() {
        const router = express.Router();
        
        // 학생 등록/조회
        router.post('/students/register', async (req, res) => {
            try {
                const { name, grade, class: className } = req.body;
                const studentId = `student_${Date.now()}`;
                
                const student = {
                    id: studentId,
                    name,
                    grade,
                    class: className,
                    created: new Date().toISOString(),
                    profile: {
                        level: 'intermediate',
                        strengths: [],
                        weaknesses: [],
                        preferredScaffolding: 'moderate'
                    },
                    progress: {
                        completed: [],
                        correct: [],
                        conceptMastery: new Map()
                    }
                };
                
                this.dataStore.students.set(studentId, student);
                
                res.json({
                    status: 'success',
                    studentId,
                    message: '학생 등록 완료'
                });
                
            } catch (error) {
                res.status(500).json({
                    status: 'error',
                    message: error.message
                });
            }
        });
        
        // 학생 목록 조회
        router.get('/students', (req, res) => {
            const students = Array.from(this.dataStore.students.values());
            res.json({
                status: 'success',
                data: students
            });
        });
        
        // 세션 생성
        router.post('/sessions/create', async (req, res) => {
            try {
                const { studentId, topic, problemCount } = req.body;
                const sessionId = `session_${Date.now()}`;
                
                // 문제 생성
                let problems = [];
                if (topic === 'ratio') {
                    const result = await this.generators.ratio.generateProblemSet({
                        count: problemCount || 10,
                        studentId
                    });
                    problems = result.problems;
                } else if (topic === 'factorization') {
                    problems = await this.generators.factorization.generateFactorizationSequence({
                        problems: problemCount || 10
                    });
                }
                
                const session = {
                    id: sessionId,
                    studentId,
                    topic,
                    problems,
                    startTime: new Date().toISOString(),
                    progress: {
                        completed: [],
                        correct: [],
                        attempts: new Map()
                    }
                };
                
                this.dataStore.sessions.set(sessionId, session);
                this.adaptiveSystem.interactions.sessions.set(sessionId, session);
                
                res.json({
                    status: 'success',
                    sessionId,
                    problems
                });
                
            } catch (error) {
                res.status(500).json({
                    status: 'error',
                    message: error.message
                });
            }
        });
        
        // 분석 데이터 조회
        router.get('/analytics', async (req, res) => {
            try {
                const analytics = {
                    totalSessions: this.dataStore.sessions.size,
                    totalStudents: this.dataStore.students.size,
                    activeToday: this.getActiveStudentsToday(),
                    averageAccuracy: this.calculateGlobalAccuracy(),
                    conceptMastery: this.getConceptMasteryStats(),
                    problemTypeStats: this.getProblemTypeStats()
                };
                
                res.json({
                    status: 'success',
                    data: analytics
                });
                
            } catch (error) {
                res.status(500).json({
                    status: 'error',
                    message: error.message
                });
            }
        });
        
        // 보고서 생성
        router.post('/reports/generate', async (req, res) => {
            try {
                const { type, period, format } = req.body;
                
                const report = await this.generateReport(type, period);
                
                if (format === 'json') {
                    res.json({
                        status: 'success',
                        report
                    });
                } else if (format === 'html') {
                    const html = this.generateHTMLReport(report);
                    res.send(html);
                }
                
            } catch (error) {
                res.status(500).json({
                    status: 'error',
                    message: error.message
                });
            }
        });
        
        this.app.use('/api', router);
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`✨ 새 연결: ${socket.id}`);
            
            // 학생 인증
            socket.on('authenticate', (data) => {
                const { studentId } = data;
                socket.studentId = studentId;
                socket.join(`student_${studentId}`);
                
                socket.emit('authenticated', {
                    message: '인증 완료',
                    studentId
                });
            });
            
            // 실시간 문제 상호작용
            socket.on('problem_attempt', async (data) => {
                const { sessionId, problemId, answer, timeSpent } = data;
                
                // 답안 평가
                const evaluation = await this.evaluateAnswer(
                    sessionId,
                    problemId,
                    answer
                );
                
                // 결과 전송
                socket.emit('evaluation_result', evaluation);
                
                // 대시보드 업데이트
                this.io.to('dashboard').emit('student_progress', {
                    studentId: socket.studentId,
                    problemId,
                    result: evaluation.correct
                });
            });
            
            // 힌트 요청
            socket.on('request_hint', async (data) => {
                const { sessionId, problemId, hintLevel } = data;
                
                const hint = await this.generateHint(
                    sessionId,
                    problemId,
                    hintLevel
                );
                
                socket.emit('hint_provided', hint);
            });
            
            // 학습 상태 동기화
            socket.on('sync_progress', (data) => {
                const { sessionId } = data;
                const session = this.dataStore.sessions.get(sessionId);
                
                if (session) {
                    socket.emit('progress_synced', {
                        progress: session.progress
                    });
                }
            });
            
            // 연결 해제
            socket.on('disconnect', () => {
                console.log(`👋 연결 해제: ${socket.id}`);
            });
        });
    }
    
    setupAnalytics() {
        // 1분마다 분석 데이터 업데이트
        setInterval(() => {
            this.updateAnalytics();
        }, 60000);
    }
    
    async updateAnalytics() {
        const analytics = {
            timestamp: new Date().toISOString(),
            activeStudents: this.getActiveStudentsCount(),
            completedProblems: this.getCompletedProblemsCount(),
            averageAccuracy: this.calculateGlobalAccuracy()
        };
        
        this.dataStore.analytics.set(Date.now(), analytics);
        
        // 대시보드에 실시간 전송
        this.io.to('dashboard').emit('analytics_update', analytics);
    }
    
    // Helper 메서드들
    getActiveStudentsToday() {
        const today = new Date().toDateString();
        let count = 0;
        
        this.dataStore.sessions.forEach(session => {
            const sessionDate = new Date(session.startTime).toDateString();
            if (sessionDate === today) {
                count++;
            }
        });
        
        return count;
    }
    
    getActiveStudentsCount() {
        // 최근 5분 이내 활동한 학생 수
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        let count = 0;
        
        this.dataStore.sessions.forEach(session => {
            if (session.lastActivity && session.lastActivity > fiveMinutesAgo) {
                count++;
            }
        });
        
        return count;
    }
    
    getCompletedProblemsCount() {
        let total = 0;
        
        this.dataStore.sessions.forEach(session => {
            total += session.progress.completed.length;
        });
        
        return total;
    }
    
    calculateGlobalAccuracy() {
        let totalCorrect = 0;
        let totalAttempts = 0;
        
        this.dataStore.sessions.forEach(session => {
            totalCorrect += session.progress.correct.length;
            totalAttempts += session.progress.completed.length;
        });
        
        return totalAttempts > 0 ? (totalCorrect / totalAttempts) : 0;
    }
    
    getConceptMasteryStats() {
        const conceptStats = new Map();
        
        this.dataStore.students.forEach(student => {
            if (student.progress.conceptMastery) {
                student.progress.conceptMastery.forEach((mastery, concept) => {
                    if (!conceptStats.has(concept)) {
                        conceptStats.set(concept, []);
                    }
                    conceptStats.get(concept).push(mastery);
                });
            }
        });
        
        // 평균 계산
        const averages = {};
        conceptStats.forEach((values, concept) => {
            averages[concept] = values.reduce((a, b) => a + b, 0) / values.length;
        });
        
        return averages;
    }
    
    getProblemTypeStats() {
        const stats = {
            visual: { attempted: 0, correct: 0 },
            numerical: { attempted: 0, correct: 0 },
            application: { attempted: 0, correct: 0 }
        };
        
        // 세션별로 통계 수집
        this.dataStore.sessions.forEach(session => {
            session.problems.forEach(problem => {
                if (session.progress.completed.includes(problem.id)) {
                    stats[problem.type].attempted++;
                    if (session.progress.correct.includes(problem.id)) {
                        stats[problem.type].correct++;
                    }
                }
            });
        });
        
        return stats;
    }
    
    async evaluateAnswer(sessionId, problemId, answer) {
        const session = this.dataStore.sessions.get(sessionId);
        if (!session) return null;
        
        // 적절한 생성기 선택
        const generator = session.topic === 'ratio' 
            ? this.generators.ratio 
            : this.generators.factorization;
        
        return await generator.evaluateAnswer(sessionId, problemId, answer);
    }
    
    async generateHint(sessionId, problemId, hintLevel) {
        const session = this.dataStore.sessions.get(sessionId);
        if (!session) return null;
        
        const problem = session.problems.find(p => p.id === problemId);
        if (!problem) return null;
        
        // Claude-Qwen 협업으로 힌트 생성
        return await this.adaptiveSystem.collaborativeAnalysis('hint_generation', {
            problem,
            hintLevel,
            sessionContext: session.progress
        });
    }
    
    async generateReport(type, period) {
        const report = {
            type,
            period,
            generated: new Date().toISOString(),
            data: {}
        };
        
        switch (type) {
            case 'student':
                report.data = await this.generateStudentReport(period);
                break;
            case 'class':
                report.data = await this.generateClassReport(period);
                break;
            case 'concept':
                report.data = await this.generateConceptReport(period);
                break;
            default:
                report.data = await this.generateGeneralReport(period);
        }
        
        return report;
    }
    
    async generateStudentReport(period) {
        // 학생별 상세 보고서
        const reports = [];
        
        this.dataStore.students.forEach(student => {
            reports.push({
                studentId: student.id,
                name: student.name,
                progress: student.progress,
                recommendations: this.generateRecommendations(student)
            });
        });
        
        return reports;
    }
    
    async generateClassReport(period) {
        // 학급별 종합 보고서
        return {
            averageProgress: this.calculateAverageProgress(),
            topPerformers: this.getTopPerformers(),
            needsSupport: this.getStudentsNeedingSupport(),
            conceptMastery: this.getConceptMasteryStats()
        };
    }
    
    async generateConceptReport(period) {
        // 개념별 학습 현황 보고서
        return this.getConceptMasteryStats();
    }
    
    async generateGeneralReport(period) {
        // 전체 종합 보고서
        return {
            totalStudents: this.dataStore.students.size,
            totalSessions: this.dataStore.sessions.size,
            averageAccuracy: this.calculateGlobalAccuracy(),
            problemStats: this.getProblemTypeStats()
        };
    }
    
    generateRecommendations(student) {
        const recommendations = [];
        
        // 약점 분석
        if (student.profile.weaknesses.length > 0) {
            recommendations.push({
                type: 'practice',
                focus: student.profile.weaknesses,
                priority: 'high'
            });
        }
        
        // 강점 활용
        if (student.profile.strengths.length > 0) {
            recommendations.push({
                type: 'challenge',
                focus: student.profile.strengths,
                priority: 'medium'
            });
        }
        
        return recommendations;
    }
    
    calculateAverageProgress() {
        let total = 0;
        let count = 0;
        
        this.dataStore.students.forEach(student => {
            if (student.progress.completed.length > 0) {
                total += (student.progress.correct.length / student.progress.completed.length);
                count++;
            }
        });
        
        return count > 0 ? (total / count) : 0;
    }
    
    getTopPerformers(limit = 5) {
        const students = Array.from(this.dataStore.students.values());
        
        return students
            .sort((a, b) => {
                const accuracyA = a.progress.correct.length / Math.max(a.progress.completed.length, 1);
                const accuracyB = b.progress.correct.length / Math.max(b.progress.completed.length, 1);
                return accuracyB - accuracyA;
            })
            .slice(0, limit)
            .map(s => ({ id: s.id, name: s.name, accuracy: s.progress.correct.length / Math.max(s.progress.completed.length, 1) }));
    }
    
    getStudentsNeedingSupport() {
        const threshold = 0.6; // 60% 미만 정답률
        const students = [];
        
        this.dataStore.students.forEach(student => {
            const accuracy = student.progress.correct.length / Math.max(student.progress.completed.length, 1);
            if (accuracy < threshold && student.progress.completed.length > 0) {
                students.push({
                    id: student.id,
                    name: student.name,
                    accuracy,
                    weaknesses: student.profile.weaknesses
                });
            }
        });
        
        return students;
    }
    
    generateHTMLReport(report) {
        return `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <title>학습 보고서 - ${report.type}</title>
            <style>
                body { font-family: 'Noto Sans KR', sans-serif; padding: 20px; }
                h1 { color: #667eea; }
                .section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
                .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 5px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            </style>
        </head>
        <body>
            <h1>학습 보고서</h1>
            <div class="section">
                <h2>보고서 정보</h2>
                <p>유형: ${report.type}</p>
                <p>기간: ${report.period}</p>
                <p>생성일: ${new Date(report.generated).toLocaleString('ko-KR')}</p>
            </div>
            <div class="section">
                <h2>주요 지표</h2>
                ${JSON.stringify(report.data, null, 2)}
            </div>
        </body>
        </html>
        `;
    }
    
    // 메인 HTML 페이지 생성
    async createIndexHTML() {
        const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Adaptive Math Learning System v2.0</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Noto Sans KR', -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 800px;
            width: 90%;
        }
        
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 10px;
        }
        
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 40px;
        }
        
        .menu-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .menu-item {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            color: #333;
        }
        
        .menu-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .menu-icon {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .menu-title {
            font-size: 1.1em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .menu-desc {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .stats {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 10px;
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
        }
        
        .stat-item {
            text-align: center;
            padding: 10px;
        }
        
        .stat-value {
            font-size: 1.8em;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 Adaptive Math Learning System</h1>
        <p class="subtitle">자가개선형 수학 문제 생성 및 학습 분석 시스템 v2.0</p>
        
        <div class="menu-grid">
            <a href="/ratio-problems" class="menu-item">
                <div class="menu-icon">📊</div>
                <div class="menu-title">비와 비율</div>
                <div class="menu-desc">10개 문제 세트</div>
            </a>
            
            <a href="/dashboard" class="menu-item">
                <div class="menu-icon">📈</div>
                <div class="menu-title">학습 대시보드</div>
                <div class="menu-desc">실시간 분석</div>
            </a>
            
            <a href="#" class="menu-item" onclick="startFactorization()">
                <div class="menu-icon">🔢</div>
                <div class="menu-title">인수분해</div>
                <div class="menu-desc">적응형 문제</div>
            </a>
            
            <a href="#" class="menu-item" onclick="viewReports()">
                <div class="menu-icon">📝</div>
                <div class="menu-title">학습 보고서</div>
                <div class="menu-desc">개인별 분석</div>
            </a>
        </div>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-value" id="totalStudents">0</div>
                <div class="stat-label">전체 학생</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="activeToday">0</div>
                <div class="stat-label">오늘 활동</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="avgAccuracy">0%</div>
                <div class="stat-label">평균 정답률</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="totalProblems">0</div>
                <div class="stat-label">생성된 문제</div>
            </div>
        </div>
    </div>
    
    <script>
        // 통계 로드
        async function loadStats() {
            try {
                const response = await fetch('/api/analytics');
                const data = await response.json();
                
                if (data.status === 'success') {
                    document.getElementById('totalStudents').textContent = data.data.totalStudents || 0;
                    document.getElementById('activeToday').textContent = data.data.activeToday || 0;
                    document.getElementById('avgAccuracy').textContent = 
                        Math.round((data.data.averageAccuracy || 0) * 100) + '%';
                    document.getElementById('totalProblems').textContent = 
                        (data.data.totalSessions || 0) * 10;
                }
            } catch (error) {
                console.error('Stats loading error:', error);
            }
        }
        
        function startFactorization() {
            alert('인수분해 문제 생성 모듈 준비 중...');
        }
        
        function viewReports() {
            window.location.href = '/api/reports/generate?type=general&period=week&format=html';
        }
        
        // 페이지 로드 시 통계 로드
        window.onload = loadStats;
        
        // 30초마다 통계 업데이트
        setInterval(loadStats, 30000);
    </script>
</body>
</html>`;
        
        await fs.writeFile(path.join(__dirname, 'index.html'), html);
        console.log('✅ index.html 생성 완료');
    }
    
    async start() {
        // HTML 파일 생성
        await this.createIndexHTML();
        
        // 서버 시작
        this.server.listen(this.port, () => {
            console.log(`
╔════════════════════════════════════════════════════════════════╗
║       ADAPTIVE MATH LEARNING SYSTEM v2.0 - INTEGRATED         ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🌐 메인 페이지:      http://localhost:${this.port}                    ║
║  📊 비와 비율:        http://localhost:${this.port}/ratio-problems     ║
║  📈 대시보드:         http://localhost:${this.port}/dashboard          ║
║                                                                ║
║  주요 기능:                                                    ║
║  ✅ Claude-Qwen 협업 시스템                                   ║
║  ✅ 실시간 학습 분석                                          ║
║  ✅ 개인화 Scaffolding                                        ║
║  ✅ 자동 채점 및 피드백                                       ║
║  ✅ 진도 추적 대시보드                                        ║
║                                                                ║
║  확장 계획:                                                    ║
║  • 테스트 시스템 통합                                          ║
║  • 학부모 포털 추가                                           ║
║  • AI 튜터 대화 기능                                          ║
║  • 다국어 지원 확대                                           ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
            `);
        });
    }
}

// 시스템 시작
const system = new IntegratedMathLearningSystem();
system.start();

// 우아한 종료 처리
process.on('SIGINT', () => {
    console.log('\n🛑 시스템 종료 중...');
    process.exit(0);
});

module.exports = IntegratedMathLearningSystem;