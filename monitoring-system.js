/**
 * 통합 모니터링 시스템
 * 1인 개발자를 위한 경량 모니터링
 * 수학 교육 플랫폼 전용
 */

const { Logging } = require('@google-cloud/logging');
const { MetricServiceClient } = require('@google-cloud/monitoring');
const { Firestore } = require('@google-cloud/firestore');
const { EventEmitter } = require('events');

class MathEducationMonitoringSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Google Cloud 서비스 초기화
        this.projectId = config.projectId || 'math-project-472006';
        this.logging = new Logging({ projectId: this.projectId });
        this.metrics = new MetricServiceClient();
        this.firestore = new Firestore();
        
        // 로그 이름
        this.logName = 'math-education-platform';
        this.log = this.logging.log(this.logName);
        
        // 메트릭 수집 간격
        this.metricsInterval = config.metricsInterval || 60000; // 1분
        
        // 핵심 모니터링 지표
        this.kpis = {
            // 학습 지표
            problemsGenerated: 0,
            problemsSolved: 0,
            correctAnswers: 0,
            hintsProvided: 0,
            
            // 시스템 지표
            apiCalls: 0,
            cacheHits: 0,
            errors: 0,
            latency: [],
            
            // 비용 지표
            vertexAICalls: 0,
            firestoreReads: 0,
            firestoreWrites: 0,
            estimatedCost: 0
        };
        
        // 알림 임계값
        this.thresholds = {
            errorRate: 0.05,      // 5% 이상 에러율
            latency: 3000,        // 3초 이상 지연
            dailyCost: 5,         // $5/일 초과
            lowEngagement: 10     // 일일 활동 10회 미만
        };
        
        // 실시간 대시보드 데이터
        this.dashboard = {
            realtime: {},
            hourly: {},
            daily: {}
        };
        
        console.log('📊 모니터링 시스템 초기화 완료');
        this.startMonitoring();
    }
    
    /**
     * 모니터링 시작
     */
    startMonitoring() {
        // 메트릭 수집 시작
        this.metricsCollector = setInterval(() => {
            this.collectMetrics();
        }, this.metricsInterval);
        
        // 실시간 모니터링
        this.setupRealtimeMonitoring();
        
        // 일일 리포트
        this.scheduleDailyReport();
        
        console.log('🚀 모니터링 시작됨');
    }
    
    /**
     * 학습 활동 추적
     */
    trackLearningActivity(activity) {
        const { type, studentId, grade, topic, result, duration } = activity;
        
        // KPI 업데이트
        switch (type) {
            case 'problem_generated':
                this.kpis.problemsGenerated++;
                break;
            case 'problem_solved':
                this.kpis.problemsSolved++;
                if (result.correct) this.kpis.correctAnswers++;
                break;
            case 'hint_used':
                this.kpis.hintsProvided++;
                break;
        }
        
        // 구조화된 로그 기록
        const logEntry = {
            severity: 'INFO',
            jsonPayload: {
                event: 'learning_activity',
                type,
                studentId,
                grade,
                topic,
                result,
                duration,
                timestamp: new Date().toISOString()
            },
            resource: {
                type: 'cloud_function',
                labels: {
                    function_name: 'math-education',
                    region: 'asia-northeast3'
                }
            }
        };
        
        this.log.write(logEntry);
        
        // 실시간 대시보드 업데이트
        this.updateDashboard('learning', activity);
        
        // 학습 분석
        this.analyzeLearningPattern(activity);
    }
    
    /**
     * API 호출 모니터링
     */
    trackAPICall(api, latency, success) {
        this.kpis.apiCalls++;
        this.kpis.latency.push(latency);
        
        if (!success) {
            this.kpis.errors++;
        }
        
        // API별 카운트
        switch (api) {
            case 'vertex_ai':
                this.kpis.vertexAICalls++;
                this.kpis.estimatedCost += 0.001; // 예상 비용
                break;
            case 'firestore_read':
                this.kpis.firestoreReads++;
                break;
            case 'firestore_write':
                this.kpis.firestoreWrites++;
                break;
        }
        
        // 지연 시간 체크
        if (latency > this.thresholds.latency) {
            this.emit('alert', {
                type: 'high_latency',
                api,
                latency,
                threshold: this.thresholds.latency
            });
        }
        
        // 로그 기록
        this.log.write({
            severity: success ? 'INFO' : 'ERROR',
            jsonPayload: {
                event: 'api_call',
                api,
                latency,
                success,
                timestamp: new Date().toISOString()
            }
        });
    }
    
    /**
     * 에러 추적
     */
    trackError(error, context) {
        this.kpis.errors++;
        
        const errorEntry = {
            severity: 'ERROR',
            jsonPayload: {
                event: 'error',
                message: error.message,
                stack: error.stack,
                context,
                timestamp: new Date().toISOString()
            }
        };
        
        this.log.write(errorEntry);
        
        // 에러율 체크
        const errorRate = this.kpis.errors / this.kpis.apiCalls;
        if (errorRate > this.thresholds.errorRate) {
            this.emit('alert', {
                type: 'high_error_rate',
                rate: errorRate,
                threshold: this.thresholds.errorRate
            });
        }
        
        // Firestore에 저장 (분석용)
        this.firestore.collection('errors').add({
            ...errorEntry.jsonPayload,
            resolved: false
        });
    }
    
    /**
     * 비용 모니터링
     */
    async monitorCosts() {
        const costs = {
            vertexAI: this.kpis.vertexAICalls * 0.001,
            firestore: {
                reads: this.kpis.firestoreReads * 0.00006,
                writes: this.kpis.firestoreWrites * 0.00018
            },
            cloudFunctions: this.kpis.apiCalls * 0.0000004,
            total: 0
        };
        
        costs.total = costs.vertexAI + 
                     costs.firestore.reads + 
                     costs.firestore.writes + 
                     costs.cloudFunctions;
        
        // 일일 비용 체크
        if (costs.total > this.thresholds.dailyCost) {
            this.emit('alert', {
                type: 'cost_overrun',
                dailyCost: costs.total,
                threshold: this.thresholds.dailyCost,
                breakdown: costs
            });
        }
        
        // 비용 추세 저장
        await this.firestore.collection('cost_tracking').add({
            ...costs,
            timestamp: new Date(),
            date: new Date().toLocaleDateString('ko-KR')
        });
        
        return costs;
    }
    
    /**
     * 실시간 모니터링 설정
     */
    setupRealtimeMonitoring() {
        // Firestore 실시간 리스너
        this.firestore.collection('realtime_metrics')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        this.dashboard.realtime = data;
                        this.emit('realtime_update', data);
                    }
                });
            });
    }
    
    /**
     * 학습 패턴 분석
     */
    analyzeLearningPattern(activity) {
        // 간단한 패턴 분석
        const patterns = {
            struggling: activity.duration > 300000 && !activity.result?.correct,
            fast_learner: activity.duration < 30000 && activity.result?.correct,
            hint_dependent: this.kpis.hintsProvided / this.kpis.problemsSolved > 0.5
        };
        
        for (const [pattern, detected] of Object.entries(patterns)) {
            if (detected) {
                this.emit('pattern_detected', {
                    pattern,
                    studentId: activity.studentId,
                    recommendation: this.getRecommendation(pattern)
                });
            }
        }
    }
    
    /**
     * 추천 사항 생성
     */
    getRecommendation(pattern) {
        const recommendations = {
            struggling: '더 쉬운 문제부터 시작하거나 개념 설명을 제공하세요.',
            fast_learner: '심화 문제를 제공하여 도전 의식을 높이세요.',
            hint_dependent: '힌트 없이 먼저 시도하도록 유도하세요.'
        };
        
        return recommendations[pattern] || '학습 진도를 관찰하세요.';
    }
    
    /**
     * 메트릭 수집
     */
    async collectMetrics() {
        const metrics = {
            timestamp: new Date(),
            kpis: { ...this.kpis },
            avgLatency: this.calculateAvgLatency(),
            successRate: this.calculateSuccessRate(),
            learningEfficiency: this.calculateLearningEfficiency()
        };
        
        // Firestore에 저장
        await this.firestore.collection('metrics').add(metrics);
        
        // 커스텀 메트릭 전송 (Cloud Monitoring)
        await this.sendCustomMetrics(metrics);
        
        // 대시보드 업데이트
        this.updateDashboard('metrics', metrics);
        
        // KPI 리셋 (시간별)
        if (new Date().getMinutes() === 0) {
            this.resetHourlyKPIs();
        }
    }
    
    /**
     * 커스텀 메트릭 전송
     */
    async sendCustomMetrics(metrics) {
        try {
            const projectPath = this.metrics.projectPath(this.projectId);
            
            const timeSeries = [
                {
                    metric: {
                        type: 'custom.googleapis.com/math_education/problems_generated',
                        labels: { environment: 'production' }
                    },
                    points: [{
                        interval: {
                            endTime: {
                                seconds: Math.floor(Date.now() / 1000)
                            }
                        },
                        value: {
                            int64Value: metrics.kpis.problemsGenerated
                        }
                    }]
                }
            ];
            
            await this.metrics.createTimeSeries({
                name: projectPath,
                timeSeries
            });
            
        } catch (error) {
            console.error('메트릭 전송 실패:', error);
        }
    }
    
    /**
     * 대시보드 업데이트
     */
    updateDashboard(category, data) {
        this.dashboard.realtime[category] = data;
        
        // 시간별 집계
        const hour = new Date().getHours();
        if (!this.dashboard.hourly[hour]) {
            this.dashboard.hourly[hour] = {};
        }
        this.dashboard.hourly[hour][category] = data;
        
        // 웹소켓으로 실시간 전송 (구현 시)
        this.emit('dashboard_update', this.dashboard);
    }
    
    /**
     * 일일 리포트 스케줄링
     */
    scheduleDailyReport() {
        // 매일 자정에 실행
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = tomorrow - now;
        
        setTimeout(() => {
            this.generateDailyReport();
            // 다음 날 스케줄링
            setInterval(() => this.generateDailyReport(), 86400000);
        }, msUntilMidnight);
    }
    
    /**
     * 일일 리포트 생성
     */
    async generateDailyReport() {
        const report = {
            date: new Date().toLocaleDateString('ko-KR'),
            summary: {
                totalActivities: this.kpis.problemsGenerated + this.kpis.problemsSolved,
                successRate: this.calculateSuccessRate(),
                avgLatency: this.calculateAvgLatency(),
                totalCost: await this.monitorCosts()
            },
            learningMetrics: {
                problemsGenerated: this.kpis.problemsGenerated,
                problemsSolved: this.kpis.problemsSolved,
                correctAnswers: this.kpis.correctAnswers,
                accuracy: (this.kpis.correctAnswers / this.kpis.problemsSolved * 100).toFixed(2) + '%'
            },
            systemMetrics: {
                apiCalls: this.kpis.apiCalls,
                cacheHitRate: (this.kpis.cacheHits / this.kpis.apiCalls * 100).toFixed(2) + '%',
                errors: this.kpis.errors,
                errorRate: (this.kpis.errors / this.kpis.apiCalls * 100).toFixed(2) + '%'
            },
            recommendations: this.generateRecommendations()
        };
        
        // 리포트 저장
        await this.firestore.collection('daily_reports').add(report);
        
        // 로그 기록
        this.log.write({
            severity: 'NOTICE',
            jsonPayload: {
                event: 'daily_report',
                report
            }
        });
        
        // 이메일 알림 (선택적)
        this.emit('daily_report', report);
        
        console.log('📈 일일 리포트 생성 완료:', report);
        
        // KPI 리셋
        this.resetDailyKPIs();
    }
    
    /**
     * 추천사항 생성
     */
    generateRecommendations() {
        const recommendations = [];
        
        // 낮은 참여도
        if (this.kpis.problemsSolved < this.thresholds.lowEngagement) {
            recommendations.push('학생 참여도가 낮습니다. 게임화 요소를 추가해보세요.');
        }
        
        // 높은 오답률
        const accuracy = this.kpis.correctAnswers / this.kpis.problemsSolved;
        if (accuracy < 0.6) {
            recommendations.push('정답률이 낮습니다. 난이도 조정이 필요합니다.');
        }
        
        // 비용 최적화
        if (this.kpis.cacheHits / this.kpis.apiCalls < 0.3) {
            recommendations.push('캐시 히트율이 낮습니다. 캐싱 전략을 개선하세요.');
        }
        
        return recommendations;
    }
    
    /**
     * 헬퍼 함수들
     */
    calculateAvgLatency() {
        if (this.kpis.latency.length === 0) return 0;
        const sum = this.kpis.latency.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.kpis.latency.length);
    }
    
    calculateSuccessRate() {
        if (this.kpis.apiCalls === 0) return 100;
        return ((this.kpis.apiCalls - this.kpis.errors) / this.kpis.apiCalls * 100).toFixed(2);
    }
    
    calculateLearningEfficiency() {
        if (this.kpis.problemsSolved === 0) return 0;
        return (this.kpis.correctAnswers / this.kpis.problemsSolved * 100).toFixed(2);
    }
    
    resetHourlyKPIs() {
        this.kpis.latency = [];
        // 시간별로 리셋할 다른 메트릭들
    }
    
    resetDailyKPIs() {
        Object.keys(this.kpis).forEach(key => {
            if (Array.isArray(this.kpis[key])) {
                this.kpis[key] = [];
            } else {
                this.kpis[key] = 0;
            }
        });
    }
    
    /**
     * 모니터링 중지
     */
    stopMonitoring() {
        if (this.metricsCollector) {
            clearInterval(this.metricsCollector);
        }
        console.log('🛑 모니터링 중지됨');
    }
    
    /**
     * 현재 상태 조회
     */
    getStatus() {
        return {
            kpis: this.kpis,
            dashboard: this.dashboard,
            health: {
                monitoring: 'active',
                lastUpdate: new Date().toISOString()
            }
        };
    }
}

// 사용 예제
async function demonstrateMonitoring() {
    const monitor = new MathEducationMonitoringSystem();
    
    // 학습 활동 추적
    monitor.trackLearningActivity({
        type: 'problem_generated',
        studentId: 'student123',
        grade: 6,
        topic: '비와 비율',
        duration: 0
    });
    
    // API 호출 추적
    monitor.trackAPICall('vertex_ai', 250, true);
    
    // 알림 리스너
    monitor.on('alert', (alert) => {
        console.log('🚨 알림:', alert);
    });
    
    // 패턴 감지 리스너
    monitor.on('pattern_detected', (pattern) => {
        console.log('🔍 패턴 감지:', pattern);
    });
    
    // 현재 상태
    console.log('📊 현재 상태:', monitor.getStatus());
}

module.exports = MathEducationMonitoringSystem;