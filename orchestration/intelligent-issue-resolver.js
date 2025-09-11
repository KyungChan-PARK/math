/**
 * Intelligent Issue Resolver System
 * 이슈 발생시 자동으로 해결책을 찾고 사용자에게 옵션 제시
 */

import axios from 'axios';
import chalk from 'chalk';

class IntelligentIssueResolver {
    constructor() {
        this.orchestratorUrl = 'http://localhost:8089';
        this.issueHistory = [];
        this.resolutionPatterns = new Map();
        this.approvalRequired = true; // 항상 사용자 승인 필요
    }

    /**
     * 이슈 감지 및 처리 메인 플로우
     */
    async handleIssue(error, context = {}) {
        console.log(chalk.red('\n️  Issue Detected:'), error.message);
        
        // 1. 이슈 분석
        const issueAnalysis = await this.analyzeIssue(error, context);
        
        // 2. 해결책 검색 (GitHub, Reddit, Anthropic)
        const solutions = await this.searchSolutions(issueAnalysis);
        
        // 3. 옵션 생성 (3-5개)
        const options = await this.generateOptions(solutions);
        
        // 4. 사용자에게 제시
        const choice = await this.presentOptions(options, issueAnalysis);
        
        // 5. 학습 패턴 저장
        await this.learnFromResolution(issueAnalysis, choice);
        
        return choice;
    }

    /**
     * 이슈 분석 및 카테고리화
     */
    async analyzeIssue(error, context) {
        const analysis = {
            type: this.categorizeError(error),
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            severity: this.calculateSeverity(error),
            previousOccurrences: this.checkHistory(error)
        };

        // Claude Orchestrator의 performanceOptimizer에게 분석 요청
        try {
            const response = await axios.post(`${this.orchestratorUrl}/system/analyze`, {
                error: analysis
            });
            analysis.aiAnalysis = response.data;
        } catch (e) {
            console.log(chalk.yellow('Note: Claude Orchestrator analysis unavailable'));
        }

        return analysis;
    }

    /**
     * MCP 도구들을 사용해 해결책 검색
     */
    async searchSolutions(analysis) {
        const solutions = [];
        const searchQueries = this.generateSearchQueries(analysis);

        console.log(chalk.cyan('\n Searching for solutions...'));

        // GitHub, Reddit, Stack Overflow, Anthropic 검색
        // 실제 구현시 brave-search MCP 도구 사용
        const searchPromises = searchQueries.map(async query => {
            return {
                source: query.source,
                query: query.text,
                results: [] // brave-search 결과가 여기 들어감
            };
        });

        const searchResults = await Promise.all(searchPromises);
        
        // 결과 정리 및 우선순위
        searchResults.forEach(result => {
            if (result.results && result.results.length > 0) {
                solutions.push(...this.parseSearchResults(result));
            }
        });

        return solutions;
    }

    /**
     * 3-5개 해결 옵션 생성
     */
    async generateOptions(solutions) {
        const options = [];
        
        // 이전 해결 패턴 확인
        const previousSuccesses = this.resolutionPatterns.get(solutions[0]?.type);
        if (previousSuccesses) {
            options.push({
                id: 0,
                title: ' Previously Successful Solution',
                description: previousSuccesses.description,
                source: 'Memory',
                confidence: 95,
                estimatedTime: previousSuccesses.avgTime,
                steps: previousSuccesses.steps
            });
        }

        // 검색 결과에서 상위 옵션 선택
        solutions.slice(0, 4).forEach((solution, index) => {
            options.push({
                id: index + 1,
                title: solution.title,
                description: solution.description,
                source: solution.source,
                confidence: solution.confidence || 70,
                estimatedTime: solution.estimatedTime || '30 mins',
                steps: solution.steps || []
            });
        });

        // 기본 fallback 옵션
        if (options.length === 0) {
            options.push({
                id: 1,
                title: ' Manual Debug',
                description: 'Step through the code manually to identify the issue',
                source: 'Default',
                confidence: 50,
                estimatedTime: '1-2 hours',
                steps: ['Check logs', 'Add debug statements', 'Test components']
            });
        }

        return options.slice(0, 5); // 최대 5개 옵션
    }

    /**
     * 사용자에게 옵션 제시 및 선택 대기
     */
    async presentOptions(options, analysis) {
        console.log(chalk.yellow('\n' + '='.repeat(60)));
        console.log(chalk.red.bold('️  ACTION REQUIRED - User Approval Needed'));
        console.log(chalk.yellow('='.repeat(60)));
        
        console.log(chalk.white('\n Issue Summary:'));
        console.log(`   Type: ${analysis.type}`);
        console.log(`   Severity: ${analysis.severity}`);
        console.log(`   Message: ${analysis.message}`);
        
        console.log(chalk.white('\n Available Solutions:'));
        
        options.forEach(option => {
            console.log(chalk.cyan(`\n   Option ${option.id}: ${option.title}`));
            console.log(`   Source: ${option.source}`);
            console.log(`   Confidence: ${option.confidence}%`);
            console.log(`   Est. Time: ${option.estimatedTime}`);
            console.log(`   Description: ${option.description}`);
            if (option.steps.length > 0) {
                console.log(`   Steps:`);
                option.steps.forEach(step => console.log(`     - ${step}`));
            }
        });
        
        console.log(chalk.yellow('\n' + '='.repeat(60)));
        console.log(chalk.green.bold('⏸️  WAITING FOR USER DECISION'));
        console.log(chalk.white('Please select an option (0-' + (options.length - 1) + ') or "skip" to continue without fixing'));
        console.log(chalk.yellow('='.repeat(60) + '\n'));
        
        // 실제로는 사용자 입력 대기
        // 여기서는 구조만 표시
        return {
            selectedOption: null,
            awaitingUserInput: true
        };
    }

    /**
     * 해결 패턴 학습 및 저장
     */
    async learnFromResolution(analysis, choice) {
        if (choice.selectedOption !== null) {
            const pattern = {
                errorType: analysis.type,
                solution: choice.selectedOption,
                timestamp: new Date().toISOString(),
                success: true // 나중에 실제 성공 여부 추적
            };
            
            this.issueHistory.push(pattern);
            
            // Memory에 저장
            console.log(chalk.green('✓ Resolution pattern saved to memory'));
        }
    }

    // Helper methods
    categorizeError(error) {
        if (error.message.includes('MODULE_NOT_FOUND')) return 'MODULE_ERROR';
        if (error.message.includes('ECONNREFUSED')) return 'CONNECTION_ERROR';
        if (error.message.includes('EADDRINUSE')) return 'PORT_CONFLICT';
        if (error.message.includes('SyntaxError')) return 'SYNTAX_ERROR';
        return 'UNKNOWN_ERROR';
    }

    calculateSeverity(error) {
        if (error.critical) return 'CRITICAL';
        if (error.stack && error.stack.includes('Fatal')) return 'HIGH';
        return 'MEDIUM';
    }

    checkHistory(error) {
        return this.issueHistory.filter(
            issue => issue.errorType === this.categorizeError(error)
        ).length;
    }

    generateSearchQueries(analysis) {
        const baseQuery = `${analysis.type} ${analysis.message} Node.js solution`;
        return [
            { source: 'GitHub', text: `${baseQuery} site:github.com` },
            { source: 'Reddit', text: `${baseQuery} site:reddit.com` },
            { source: 'StackOverflow', text: `${baseQuery} site:stackoverflow.com` },
            { source: 'Anthropic', text: `Claude ${baseQuery}` }
        ];
    }

    parseSearchResults(result) {
        // 실제 검색 결과 파싱 로직
        return result.results.map(r => ({
            title: r.title,
            description: r.description,
            source: result.source,
            url: r.url,
            confidence: 70
        }));
    }
}

export default IntelligentIssueResolver;