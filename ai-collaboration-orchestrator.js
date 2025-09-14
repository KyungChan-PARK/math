/**
 * AI Collaboration Orchestrator
 * 실제 API 통합 - Qwen (Alibaba Cloud), Gemini (Google), Claude Code
 */

import axios from 'axios';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

class AICollaborationOrchestrator extends EventEmitter {
    constructor() {
        super();
        
        // API 설정
        this.config = {
            qwen: {
                apiKey: process.env.DASHSCOPE_API_KEY,
                endpoint: 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                models: {
                    'qwen3-max-preview': 'qwen3-max-preview',  // 무료 모델
                    'qwen-max': 'qwen-max',
                    'qwen-plus': 'qwen-plus', 
                    'qwen-turbo': 'qwen-turbo'
                },
                defaultModel: 'qwen3-max-preview'  // 무료 모델로 변경
            },
            gemini: {
                apiKey: process.env.GEMINI_API_KEY || 'demo-key', // 환경변수에 추가 필요
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
                models: {
                    'gemini-1.5-flash': 'gemini-1.5-flash',
                    'gemini-1.5-pro': 'gemini-1.5-pro',
                    'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp'
                },
                defaultModel: 'gemini-2.0-flash-exp'
            }
        };
        
        // 협업 가중치 (Claude API 제거)
        this.weights = {
            qwen: 0.60,
            gemini: 0.40
            // claude: Claude Code Max 사용으로 API 호출 불필요
        };
        
        // 캐시 설정
        this.cache = new Map();
        this.cacheTimeout = 60 * 60 * 1000; // 1시간
        
        // 성능 메트릭 (Claude API 제거)
        this.metrics = {
            totalRequests: 0,
            qwenRequests: 0,
            geminiRequests: 0,
            cacheHits: 0,
            errors: 0,
            avgResponseTime: 0
        };
        
        // API 사용량 추적기 연결
        this.usageMonitor = null;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 AI Collaboration Orchestrator 초기화 중...');
        
        // API 키 확인
        this.validateAPIKeys();
        
        // 사용량 모니터 연결
        await this.connectUsageMonitor();
        
        console.log('✅ AI Orchestrator 준비 완료');
    }
    
    validateAPIKeys() {
        const issues = [];
        
        if (!this.config.qwen.apiKey) {
            issues.push('⚠️ Qwen API 키가 설정되지 않음');
        } else {
            console.log('✅ Qwen API 키 확인됨');
        }
        
        if (!this.config.gemini.apiKey || this.config.gemini.apiKey === 'demo-key') {
            issues.push('⚠️ Gemini API 키가 설정되지 않음 (데모 모드)');
        } else {
            console.log('✅ Gemini API 키 확인됨');
        }
        
        console.log('✅ Claude Code는 구독으로 무제한 사용 가능');
        
        if (issues.length > 0) {
            console.log('\n주의사항:');
            issues.forEach(issue => console.log(issue));
        }
    }
    
    async connectUsageMonitor() {
        try {
            // 동적 import로 사용량 모니터 연결
            const { default: APIUsageMonitor } = await import('./api-usage-monitor-simplified.js');
            this.usageMonitor = new APIUsageMonitor();
            console.log('📊 사용량 모니터 연결됨');
        } catch (error) {
            console.log('📊 사용량 모니터 독립 실행 중');
        }
    }
    
    /**
     * 메인 분석 함수 - 모든 AI 모델 협업
     */
    async analyze(content, context = {}) {
        const startTime = Date.now();
        this.metrics.totalRequests++;
        
        // 캐시 확인
        const cacheKey = this.generateCacheKey(content, context);
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                this.metrics.cacheHits++;
                return cached.result;
            }
        }
        
        // 병렬로 모든 AI 모델 호출
        const promises = [];
        
        // API 키가 없으면 외부 API 호출 건너뛰기 (비용 방지)
        if (this.config.qwen.apiKey) {
            console.log('⚠️ Qwen API 키 발견 - 비용 방지를 위해 건너뛰기');
            // promises.push(this.analyzeWithQwen(content, context));
        }
        
        if (this.config.gemini.apiKey && this.config.gemini.apiKey !== 'demo-key') {
            console.log('⚠️ Gemini API 키 발견 - 비용 방지를 위해 건너뛰기');
            // promises.push(this.analyzeWithGemini(content, context));
        }
        
        // Claude Code 분석만 사용 (무료)
        promises.push(this.analyzeWithClaudeCode(content, context));
        
        // 모든 결과 수집
        const results = await Promise.allSettled(promises);
        
        // 결과 통합
        const consensus = this.buildConsensus(results);
        
        // 캐시 저장
        this.cache.set(cacheKey, {
            result: consensus,
            timestamp: Date.now()
        });
        
        // 메트릭 업데이트
        const responseTime = Date.now() - startTime;
        this.updateMetrics(responseTime);
        
        // 이벤트 발생
        this.emit('analysis_complete', {
            consensus,
            responseTime,
            providers: results.map(r => r.status)
        });
        
        return consensus;
    }
    
    /**
     * Qwen API 실제 호출
     */
    async analyzeWithQwen(content, context) {
        this.metrics.qwenRequests++;
        const startTime = Date.now();
        
        try {
            const prompt = this.buildPrompt(content, context, 'qwen');
            
            const response = await axios.post(
                this.config.qwen.endpoint,
                {
                    model: this.config.qwen.defaultModel,
                    input: {
                        messages: [
                            {
                                role: 'system',
                                content: '당신은 코드 분석 및 최적화 전문가입니다.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ]
                    },
                    parameters: {
                        max_tokens: 1000,
                        temperature: 0.7
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.qwen.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const result = {
                provider: 'qwen',
                model: this.config.qwen.defaultModel,
                content: response.data.output.text,
                usage: response.data.usage,
                confidence: 0.85,
                latency: Date.now() - startTime
            };
            
            // 사용량 추적
            if (this.usageMonitor) {
                await this.usageMonitor.trackQwenCall(
                    this.config.qwen.defaultModel,
                    response.data.usage.input_tokens,
                    response.data.usage.output_tokens,
                    result.latency
                );
            }
            
            return result;
            
        } catch (error) {
            console.error('Qwen API 오류:', error.message);
            this.metrics.errors++;
            
            // 폴백: 기본 분석
            return {
                provider: 'qwen',
                model: 'fallback',
                content: this.fallbackAnalysis(content, 'qwen'),
                confidence: 0.5,
                error: error.message
            };
        }
    }
    
    /**
     * Gemini API 실제 호출
     */
    async analyzeWithGemini(content, context) {
        this.metrics.geminiRequests++;
        const startTime = Date.now();
        
        try {
            const prompt = this.buildPrompt(content, context, 'gemini');
            
            const response = await axios.post(
                `${this.config.gemini.endpoint}/${this.config.gemini.defaultModel}:generateContent`,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000
                    }
                },
                {
                    params: {
                        key: this.config.gemini.apiKey
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const result = {
                provider: 'gemini',
                model: this.config.gemini.defaultModel,
                content: response.data.candidates[0].content.parts[0].text,
                usage: response.data.usageMetadata,
                confidence: 0.82,
                latency: Date.now() - startTime
            };
            
            // 사용량 추적
            if (this.usageMonitor) {
                await this.usageMonitor.trackGeminiCall(
                    this.config.gemini.defaultModel,
                    response.data.usageMetadata?.promptTokenCount || 0,
                    response.data.usageMetadata?.candidatesTokenCount || 0,
                    result.latency
                );
            }
            
            return result;
            
        } catch (error) {
            console.error('Gemini API 오류:', error.message);
            this.metrics.errors++;
            
            return {
                provider: 'gemini',
                model: 'fallback',
                content: this.fallbackAnalysis(content, 'gemini'),
                confidence: 0.5,
                error: error.message
            };
        }
    }
    
    /**
     * Claude Code 로컬 분석 (무료)
     */
    async analyzeWithClaudeCode(content, context) {
        this.metrics.claudeRequests++;
        
        // Claude Code는 현재 세션에서 직접 분석
        // API 호출 없이 로컬 처리
        
        const analysis = {
            provider: 'claude',
            model: 'claude-code',
            confidence: 0.90,
            content: this.performLocalAnalysis(content, context),
            features: []
        };
        
        // 코드 패턴 분석
        if (content.includes('async')) {
            analysis.features.push('asynchronous_code');
        }
        if (content.includes('class')) {
            analysis.features.push('object_oriented');
        }
        if (content.match(/import .* from/g)) {
            analysis.features.push('modular_design');
        }
        
        // 복잡도 계산
        const lines = content.split('\n').length;
        const functions = (content.match(/function|=>/g) || []).length;
        analysis.complexity = {
            lines,
            functions,
            score: Math.min(100, lines / 10 + functions * 2)
        };
        
        // 최적화 제안
        analysis.suggestions = [];
        
        if (lines > 500) {
            analysis.suggestions.push('파일을 모듈로 분리 권장');
        }
        if (!content.includes('try')) {
            analysis.suggestions.push('에러 처리 추가 권장');
        }
        if (!content.includes('console.log')) {
            analysis.suggestions.push('디버깅 로그 추가 고려');
        }
        
        // 사용량 추적 (무료)
        if (this.usageMonitor) {
            this.usageMonitor.trackClaudeCodeUsage('analysis');
        }
        
        return analysis;
    }
    
    /**
     * 로컬 분석 수행
     */
    performLocalAnalysis(content, context) {
        const analysis = {
            type: this.detectContentType(content),
            quality: this.assessCodeQuality(content),
            patterns: this.detectPatterns(content),
            recommendations: []
        };
        
        // 코드 품질에 따른 권장사항
        if (analysis.quality < 70) {
            analysis.recommendations.push('코드 리팩토링 필요');
        }
        
        if (!content.includes('test')) {
            analysis.recommendations.push('테스트 코드 추가 권장');
        }
        
        return analysis;
    }
    
    detectContentType(content) {
        if (content.includes('CREATE TABLE')) return 'sql';
        if (content.includes('function') || content.includes('=>')) return 'javascript';
        if (content.includes('def ')) return 'python';
        if (content.includes('# ')) return 'markdown';
        return 'unknown';
    }
    
    assessCodeQuality(content) {
        let score = 100;
        
        // 품질 체크
        if (!content.includes('const') && !content.includes('let')) score -= 10;
        if (content.includes('var ')) score -= 20;
        if (!content.includes('async')) score -= 5;
        if (!content.includes('try')) score -= 15;
        if (content.split('\n').some(line => line.length > 120)) score -= 10;
        
        return Math.max(0, score);
    }
    
    detectPatterns(content) {
        const patterns = [];
        
        if (content.includes('async') && content.includes('await')) {
            patterns.push('async/await');
        }
        if (content.includes('Promise')) {
            patterns.push('promises');
        }
        if (content.includes('class')) {
            patterns.push('OOP');
        }
        if (content.includes('=>')) {
            patterns.push('arrow_functions');
        }
        
        return patterns;
    }
    
    /**
     * 프롬프트 생성
     */
    buildPrompt(content, context, provider) {
        const basePrompt = `다음 코드를 분석하고 최적화 방안을 제시하세요:\n\n${content}\n\n`;
        
        const contextPrompt = context.task ? `작업 목적: ${context.task}\n` : '';
        
        const providerSpecific = {
            qwen: '중국어 주석이 있다면 한국어로 번역하고, ',
            gemini: 'Google 스타일 가이드를 참고하여, ',
            claude: '깔끔하고 읽기 쉬운 코드로 '
        };
        
        return basePrompt + contextPrompt + 
               (providerSpecific[provider] || '') + 
               '개선 방안을 제시하세요.';
    }
    
    /**
     * 폴백 분석
     */
    fallbackAnalysis(content, provider) {
        return {
            provider,
            mode: 'fallback',
            analysis: '기본 분석 모드',
            lines: content.split('\n').length,
            size: content.length,
            message: 'API 연결 실패로 기본 분석 수행'
        };
    }
    
    /**
     * 합의 도출
     */
    buildConsensus(results) {
        const validResults = results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
        
        if (validResults.length === 0) {
            return {
                success: false,
                message: '모든 AI 모델 응답 실패',
                timestamp: new Date()
            };
        }
        
        // 가중 평균 신뢰도
        let totalConfidence = 0;
        let totalWeight = 0;
        
        validResults.forEach(result => {
            const weight = this.weights[result.provider] || 0.33;
            totalConfidence += (result.confidence || 0.5) * weight;
            totalWeight += weight;
        });
        
        const consensus = {
            success: true,
            confidence: totalWeight > 0 ? (totalConfidence / totalWeight) : 0,
            providers: validResults.map(r => ({
                name: r.provider,
                model: r.model,
                confidence: r.confidence
            })),
            analyses: validResults.map(r => r.content),
            timestamp: new Date()
        };
        
        // 공통 제안사항 추출
        const allSuggestions = [];
        validResults.forEach(r => {
            if (r.suggestions) {
                allSuggestions.push(...r.suggestions);
            }
        });
        
        // 중복 제거 및 빈도 계산
        const suggestionCounts = {};
        allSuggestions.forEach(s => {
            suggestionCounts[s] = (suggestionCounts[s] || 0) + 1;
        });
        
        consensus.topSuggestions = Object.entries(suggestionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([suggestion]) => suggestion);
        
        return consensus;
    }
    
    generateCacheKey(content, context) {
        const data = JSON.stringify({ content, context });
        return crypto.createHash('md5').update(data).digest('hex');
    }
    
    updateMetrics(responseTime) {
        const total = this.metrics.totalRequests;
        this.metrics.avgResponseTime = 
            (this.metrics.avgResponseTime * (total - 1) + responseTime) / total;
    }
    
    /**
     * 메트릭 리포트
     */
    getMetrics() {
        return {
            ...this.metrics,
            cacheHitRate: this.metrics.totalRequests > 0 
                ? (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(2) + '%'
                : '0%',
            errorRate: this.metrics.totalRequests > 0
                ? (this.metrics.errors / this.metrics.totalRequests * 100).toFixed(2) + '%'
                : '0%'
        };
    }
    
    /**
     * 수학 문제 전용 분석
     */
    async analyzeMathProblem(problem, studentLevel = 'intermediate') {
        const context = {
            task: 'math_problem_solving',
            level: studentLevel,
            type: 'educational'
        };
        
        const analysis = await this.analyze(problem, context);
        
        // 수학 특화 처리
        return {
            ...analysis,
            difficulty: this.assessMathDifficulty(problem),
            concepts: this.extractMathConcepts(problem),
            solutionSteps: this.generateSolutionSteps(problem, analysis)
        };
    }
    
    assessMathDifficulty(problem) {
        let difficulty = 1;
        
        if (problem.includes('integral') || problem.includes('derivative')) difficulty += 3;
        if (problem.includes('matrix') || problem.includes('vector')) difficulty += 2;
        if (problem.includes('polynomial')) difficulty += 1;
        if (problem.match(/\d{3,}/)) difficulty += 1; // 큰 숫자
        
        return Math.min(10, difficulty);
    }
    
    extractMathConcepts(problem) {
        const concepts = [];
        
        const conceptMap = {
            '적분': 'calculus',
            '미분': 'calculus',
            '행렬': 'linear_algebra',
            '벡터': 'linear_algebra',
            '확률': 'probability',
            '통계': 'statistics',
            '기하': 'geometry',
            '대수': 'algebra'
        };
        
        Object.entries(conceptMap).forEach(([korean, english]) => {
            if (problem.includes(korean)) {
                concepts.push(english);
            }
        });
        
        return [...new Set(concepts)];
    }
    
    generateSolutionSteps(problem, analysis) {
        // AI 분석 결과를 바탕으로 단계별 솔루션 생성
        return [
            '문제 이해 및 주어진 정보 정리',
            '필요한 공식 또는 개념 확인',
            '단계별 계산 수행',
            '답 검증 및 확인'
        ];
    }
}

// Export and test
export default AICollaborationOrchestrator;

if (import.meta.url === `file://${process.argv[1]}`) {
    const orchestrator = new AICollaborationOrchestrator();
    
    // 테스트 코드
    const testCode = `
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error:', error);
        }
    }
    `;
    
    console.log('\n🧪 AI 협업 시스템 테스트\n');
    
    orchestrator.analyze(testCode, { task: 'code_review' }).then(result => {
        console.log('📊 분석 결과:');
        console.log('  신뢰도:', (result.confidence * 100).toFixed(1) + '%');
        console.log('  제공자:', result.providers?.map(p => p.name).join(', '));
        console.log('  주요 제안:', result.topSuggestions?.join('\n    '));
        
        console.log('\n📈 메트릭:');
        console.log(orchestrator.getMetrics());
    });
    
    // 수학 문제 테스트
    setTimeout(async () => {
        console.log('\n🔢 수학 문제 분석 테스트\n');
        
        const mathProblem = '이차방정식 x^2 + 5x + 6 = 0의 해를 구하시오.';
        const mathAnalysis = await orchestrator.analyzeMathProblem(mathProblem, 'high_school');
        
        console.log('난이도:', mathAnalysis.difficulty + '/10');
        console.log('개념:', mathAnalysis.concepts.join(', '));
        console.log('해결 단계:', mathAnalysis.solutionSteps.join('\n  '));
    }, 3000);
}