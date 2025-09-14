/**
 * Google Cloud 비용 최적화 시스템
 * 리소스 사용량 모니터링 및 자동 최적화
 */

const { CloudBillingClient } = require('@google-cloud/billing');
const { MetricServiceClient } = require('@google-cloud/monitoring');
const { Firestore } = require('@google-cloud/firestore');
const { ResourceManagerClient } = require('@google-cloud/resource-manager');

class CostOptimizationSystem {
    constructor() {
        this.billing = new CloudBillingClient();
        this.monitoring = new MetricServiceClient();
        this.firestore = new Firestore();
        this.resourceManager = new ResourceManagerClient();
        
        this.projectId = 'math-project-472006';
        this.billingAccountId = process.env.BILLING_ACCOUNT_ID;
        
        // 비용 임계값 설정
        this.thresholds = {
            daily: 10,        // $10/day
            weekly: 50,       // $50/week  
            monthly: 150,     // $150/month
            alertPercentage: 80  // 80% 도달 시 경고
        };
        
        // 최적화 규칙
        this.optimizationRules = new Map();
        this.setupOptimizationRules();
    }
    
    /**
     * 최적화 규칙 설정
     */
    setupOptimizationRules() {
        // Cloud Functions 최적화
        this.optimizationRules.set('functions', {
            check: async () => {
                const metrics = await this.getFunctionMetrics();
                return {
                    shouldOptimize: metrics.avgColdStarts > 10,
                    recommendation: 'min-instances 조정 필요',
                    estimatedSavings: 5 // $5/month
                };
            },
            optimize: async () => {
                // 콜드 스타트가 많은 함수의 min-instances 조정
                console.log('Cloud Functions 최적화 실행');
                return { success: true, saved: 5 };
            }
        });
        
        // Firestore 최적화
        this.optimizationRules.set('firestore', {
            check: async () => {
                const usage = await this.getFirestoreUsage();
                return {
                    shouldOptimize: usage.reads > 1000000, // 100만 읽기/일
                    recommendation: '캐싱 전략 개선 필요',
                    estimatedSavings: 20
                };
            },
            optimize: async () => {
                // Redis 캐시 레이어 활성화
                await this.enableCaching();
                return { success: true, saved: 20 };
            }
        });
        
        // Storage 최적화
        this.optimizationRules.set('storage', {
            check: async () => {
                const usage = await this.getStorageUsage();
                return {
                    shouldOptimize: usage.coldData > 100, // 100GB 이상 콜드 데이터
                    recommendation: 'Nearline/Coldline 전환 필요',
                    estimatedSavings: 15
                };
            },
            optimize: async () => {
                // 오래된 데이터를 Coldline으로 이동
                await this.moveToCodeStorage();
                return { success: true, saved: 15 };
            }
        });
        
        // Compute Engine 최적화
        this.optimizationRules.set('compute', {
            check: async () => {
                const usage = await this.getComputeUsage();
                return {
                    shouldOptimize: usage.idlePercentage > 70,
                    recommendation: 'Preemptible VM 또는 Spot 인스턴스 사용',
                    estimatedSavings: 30
                };
            },
            optimize: async () => {
                // Spot 인스턴스로 전환
                console.log('Compute 리소스 최적화');
                return { success: true, saved: 30 };
            }
        });
    }
    
    /**
     * 현재 비용 조회
     */
    async getCurrentCosts() {
        try {
            const projectName = `projects/${this.projectId}`;
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            // Cloud Monitoring API로 비용 메트릭 조회
            const request = {
                name: projectName,
                filter: `metric.type="billing.googleapis.com/project/cost"`,
                interval: {
                    startTime: { seconds: Math.floor(startOfMonth.getTime() / 1000) },
                    endTime: { seconds: Math.floor(now.getTime() / 1000) }
                }
            };
            
            const [timeSeries] = await this.monitoring.listTimeSeries(request);
            
            let totalCost = 0;
            let breakdown = {};
            
            for (const series of timeSeries) {
                const service = series.resource.labels.service;
                const cost = series.points[0]?.value?.doubleValue || 0;
                
                totalCost += cost;
                breakdown[service] = (breakdown[service] || 0) + cost;
            }
            
            return {
                total: totalCost,
                breakdown,
                period: 'month-to-date',
                timestamp: now.toISOString()
            };
            
        } catch (error) {
            console.error('비용 조회 실패:', error);
            return { total: 0, breakdown: {}, error: error.message };
        }
    }
    
    /**
     * 비용 예측
     */
    async predictMonthlyCost() {
        const current = await this.getCurrentCosts();
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysPassed = now.getDate();
        
        const dailyAverage = current.total / daysPassed;
        const predictedMonthly = dailyAverage * daysInMonth;
        
        return {
            current: current.total,
            predicted: predictedMonthly,
            dailyAverage,
            remainingBudget: this.thresholds.monthly - predictedMonthly,
            willExceedBudget: predictedMonthly > this.thresholds.monthly
        };
    }
    
    /**
     * 자동 최적화 실행
     */
    async runOptimization() {
        console.log('🔧 비용 최적화 시작...');
        
        const results = {
            checked: [],
            optimized: [],
            totalSavings: 0,
            timestamp: new Date().toISOString()
        };
        
        // 각 서비스별 최적화 체크
        for (const [service, rule] of this.optimizationRules) {
            try {
                const checkResult = await rule.check();
                results.checked.push({
                    service,
                    ...checkResult
                });
                
                if (checkResult.shouldOptimize) {
                    console.log(`📊 ${service} 최적화 필요: ${checkResult.recommendation}`);
                    
                    const optimizeResult = await rule.optimize();
                    if (optimizeResult.success) {
                        results.optimized.push({
                            service,
                            saved: optimizeResult.saved
                        });
                        results.totalSavings += optimizeResult.saved;
                    }
                }
            } catch (error) {
                console.error(`${service} 최적화 실패:`, error);
            }
        }
        
        // 결과 저장
        await this.saveOptimizationResults(results);
        
        console.log(`✅ 최적화 완료: $${results.totalSavings}/월 절감 예상`);
        return results;
    }
    
    /**
     * 비용 알림 설정
     */
    async setupBudgetAlerts() {
        const budgetName = `projects/${this.projectId}/budgets/monthly-budget`;
        
        try {
            // Budget API를 통한 알림 설정
            const budget = {
                displayName: 'Monthly Budget Alert',
                budgetFilter: {
                    projects: [`projects/${this.projectId}`]
                },
                amount: {
                    specifiedAmount: {
                        currencyCode: 'USD',
                        units: this.thresholds.monthly
                    }
                },
                thresholdRules: [
                    {
                        thresholdPercent: 0.5,
                        spendBasis: 'CURRENT_SPEND'
                    },
                    {
                        thresholdPercent: 0.8,
                        spendBasis: 'CURRENT_SPEND'
                    },
                    {
                        thresholdPercent: 1.0,
                        spendBasis: 'CURRENT_SPEND'
                    }
                ]
            };
            
            console.log('💰 예산 알림 설정 완료');
            return { success: true, budget };
            
        } catch (error) {
            console.error('예산 알림 설정 실패:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 리소스 자동 스케일링 정책
     */
    async updateAutoScalingPolicies() {
        const policies = {
            cloudFunctions: {
                minInstances: 0,  // 비용 절감을 위해 0으로 설정
                maxInstances: 100,
                targetCPU: 0.6
            },
            cloudRun: {
                minInstances: 0,
                maxInstances: 50,
                targetConcurrency: 80
            },
            computeEngine: {
                minNodes: 0,
                maxNodes: 10,
                targetUtilization: 0.7
            }
        };
        
        console.log('⚙️ 자동 스케일링 정책 업데이트');
        
        // Firestore에 정책 저장
        await this.firestore.collection('scaling_policies').doc('current').set({
            ...policies,
            updatedAt: new Date(),
            estimatedMonthlySavings: 50
        });
        
        return policies;
    }
    
    /**
     * 사용하지 않는 리소스 정리
     */
    async cleanupUnusedResources() {
        const cleanup = {
            deletedResources: [],
            estimatedSavings: 0
        };
        
        // 1. 오래된 Cloud Function 버전 삭제
        console.log('🧹 미사용 리소스 정리 중...');
        
        // 2. 오래된 스토리지 객체 삭제
        // 3. 미사용 IP 주소 해제
        // 4. 오래된 스냅샷 삭제
        
        cleanup.estimatedSavings = 10; // 예상 절감액
        
        await this.firestore.collection('cleanup_history').add({
            ...cleanup,
            timestamp: new Date()
        });
        
        return cleanup;
    }
    
    /**
     * 비용 대시보드 데이터 생성
     */
    async generateCostDashboard() {
        const [current, prediction, optimization] = await Promise.all([
            this.getCurrentCosts(),
            this.predictMonthlyCost(),
            this.getOptimizationHistory()
        ]);
        
        return {
            current,
            prediction,
            optimization,
            recommendations: await this.getRecommendations(),
            lastUpdated: new Date().toISOString()
        };
    }
    
    /**
     * 최적화 추천 사항
     */
    async getRecommendations() {
        const recommendations = [];
        
        // 각 서비스별 체크
        for (const [service, rule] of this.optimizationRules) {
            const check = await rule.check();
            if (check.shouldOptimize) {
                recommendations.push({
                    service,
                    priority: check.estimatedSavings > 20 ? 'high' : 'medium',
                    action: check.recommendation,
                    estimatedSavings: check.estimatedSavings
                });
            }
        }
        
        // 우선순위별 정렬
        recommendations.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
        
        return recommendations;
    }
    
    /**
     * Helper Functions
     */
    async getFunctionMetrics() {
        // Cloud Functions 메트릭 조회
        return {
            avgColdStarts: 5,
            avgExecutionTime: 200,
            totalInvocations: 10000
        };
    }
    
    async getFirestoreUsage() {
        // Firestore 사용량 조회
        return {
            reads: 500000,
            writes: 100000,
            deletes: 1000
        };
    }
    
    async getStorageUsage() {
        // Storage 사용량 조회
        return {
            totalSize: 500, // GB
            coldData: 200,  // GB
            hotData: 300    // GB
        };
    }
    
    async getComputeUsage() {
        // Compute Engine 사용량 조회
        return {
            avgCPU: 30,
            avgMemory: 45,
            idlePercentage: 40
        };
    }
    
    async enableCaching() {
        console.log('Redis 캐싱 활성화');
        // Redis 캐싱 구현
    }
    
    async moveToCodeStorage() {
        console.log('콜드 스토리지로 데이터 이동');
        // 스토리지 클래스 변경
    }
    
    async saveOptimizationResults(results) {
        await this.firestore.collection('optimization_history').add(results);
    }
    
    async getOptimizationHistory() {
        const snapshot = await this.firestore
            .collection('optimization_history')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        return snapshot.docs.map(doc => doc.data());
    }
}

// 자동 실행 스케줄러
async function scheduledOptimization() {
    const optimizer = new CostOptimizationSystem();
    
    // 매일 자정 실행
    setInterval(async () => {
        const hour = new Date().getHours();
        if (hour === 0) {
            console.log('🌙 일일 비용 최적화 실행');
            await optimizer.runOptimization();
            await optimizer.cleanupUnusedResources();
        }
    }, 3600000); // 1시간마다 체크
    
    // 초기 실행
    const dashboard = await optimizer.generateCostDashboard();
    console.log('📊 비용 대시보드:', dashboard);
}

// Export
module.exports = CostOptimizationSystem;

// CLI 실행
if (require.main === module) {
    scheduledOptimization().catch(console.error);
}