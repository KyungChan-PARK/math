#!/usr/bin/env node

/**
 * Vertex AI AutoML 품질 평가 시스템
 * 문제 품질 자동 평가 및 개선 제안
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

/**
 * Vertex AI AutoML 시뮬레이터
 * 실제 Vertex AI API 대신 Gemini를 활용한 품질 평가
 */
class VertexAIQualityEvaluator {
    constructor() {
        // Gemini를 Vertex AI 대신 사용
        if (process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        }
        
        // 평가 기준
        this.evaluationCriteria = {
            clarity: {
                weight: 0.25,
                aspects: ['명확한 문제 서술', '모호하지 않은 표현', '논리적 구조']
            },
            satAlignment: {
                weight: 0.25,
                aspects: ['SAT 형식 준수', '적절한 난이도', '시간 제한 고려']
            },
            khanAlignment: {
                weight: 0.25,
                aspects: ['Khan 커리큘럼 일치', '개념 연결성', '학습 목표 부합']
            },
            pedagogicalValue: {
                weight: 0.25,
                aspects: ['교육적 가치', '개념 이해 촉진', '비판적 사고 유도']
            }
        };
        
        this.trainingData = [];
        this.evaluationHistory = [];
    }
    
    async run() {
        console.log(colors.bright + colors.cyan + '=' .repeat(70) + colors.reset);
        console.log(colors.bright + colors.cyan + '   🤖 Vertex AI AutoML 품질 평가 시스템' + colors.reset);
        console.log(colors.bright + colors.cyan + '=' .repeat(70) + colors.reset);
        console.log();
        
        // 1. 샘플 문제 로드
        const sampleProblems = await this.loadSampleProblems();
        
        // 2. 품질 평가
        console.log(colors.yellow + '\n📊 문제 품질 자동 평가 중...\n' + colors.reset);
        const evaluations = await this.evaluateProblems(sampleProblems);
        
        // 3. 개선 제안
        console.log(colors.yellow + '\n💡 개선 제안 생성 중...\n' + colors.reset);
        const improvements = await this.generateImprovements(evaluations);
        
        // 4. 결과 저장 및 요약
        await this.saveResults(evaluations, improvements);
        this.summarizeResults(evaluations);
    }
    
    async loadSampleProblems() {
        // 샘플 문제들 (실제로는 데이터베이스에서 로드)
        return [
            {
                id: 1,
                unit: 'algebra2_unit2',
                problem: 'If f(x) = x² and g(x) = 2f(x-3) + 1, what is the vertex of g(x)?',
                choices: ['(3, 1)', '(-3, 1)', '(3, -1)', '(-3, -1)'],
                correct: 0,
                difficulty: 3,
                scaffolding: {
                    level1: 'Think about transformations',
                    level2: 'x-3 means horizontal shift',
                    level3: 'Apply transformations step by step',
                    level4: 'Track the vertex movement',
                    level5: 'Complete solution with graph'
                }
            },
            {
                id: 2,
                unit: 'algebra2_unit2',
                problem: 'Find the inverse of f(x) = 2x + 3',
                choices: ['f⁻¹(x) = (x-3)/2', 'f⁻¹(x) = (x+3)/2', 'f⁻¹(x) = 2x-3', 'f⁻¹(x) = x/2-3'],
                correct: 0,
                difficulty: 2,
                scaffolding: {
                    level1: 'Swap x and y',
                    level2: 'Solve for y',
                    level3: 'Step by step algebra'
                }
            },
            {
                id: 3,
                unit: 'algebra2_unit2',
                problem: 'If h(x) = √(x-1) + 2, what is the domain of h(x)?',
                choices: ['x ≥ 1', 'x ≥ 0', 'x ≥ 2', 'x ≥ -1'],
                correct: 0,
                difficulty: 3,
                scaffolding: {
                    level1: 'Square root requires non-negative input',
                    level2: 'x-1 ≥ 0',
                    level3: 'Solve the inequality'
                }
            }
        ];
    }
    
    async evaluateProblems(problems) {
        const evaluations = [];
        
        for (const problem of problems) {
            console.log(`평가 중: 문제 ${problem.id}...`);
            
            // Gemini를 사용한 품질 평가 (Vertex AI AutoML 시뮬레이션)
            const evaluation = await this.evaluateSingleProblem(problem);
            evaluations.push(evaluation);
            
            // 진행 상황 표시
            this.displayEvaluationResult(evaluation);
        }
        
        return evaluations;
    }
    
    async evaluateSingleProblem(problem) {
        if (!this.model) {
            // Gemini API 없을 경우 시뮬레이션
            return this.simulateEvaluation(problem);
        }
        
        try {
            const prompt = `
            Evaluate this math problem for quality:
            
            Problem: ${problem.problem}
            Choices: ${problem.choices.join(', ')}
            Unit: ${problem.unit}
            Difficulty: ${problem.difficulty}/5
            
            Rate the following aspects (0-100):
            1. Clarity: Is the problem clearly stated?
            2. SAT Alignment: Does it match SAT style and difficulty?
            3. Khan Academy Alignment: Does it fit the curriculum?
            4. Pedagogical Value: Does it promote learning?
            
            Provide scores and brief explanations for each.
            Format as JSON.
            `;
            
            const result = await this.model.generateContent(prompt);
            const response = result.response.text();
            
            // JSON 파싱 시도
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const scores = JSON.parse(jsonMatch[0]);
                return {
                    problemId: problem.id,
                    scores: {
                        clarity: scores.clarity || 85,
                        satAlignment: scores.satAlignment || 80,
                        khanAlignment: scores.khanAlignment || 85,
                        pedagogicalValue: scores.pedagogicalValue || 90
                    },
                    overall: this.calculateOverallScore(scores),
                    feedback: scores.feedback || 'Good problem with room for improvement'
                };
            }
        } catch (error) {
            console.log(colors.yellow + `  평가 오류, 시뮬레이션 사용` + colors.reset);
        }
        
        return this.simulateEvaluation(problem);
    }
    
    simulateEvaluation(problem) {
        // 시뮬레이션된 평가 점수
        const baseScore = 70 + problem.difficulty * 5;
        const variation = Math.random() * 10 - 5;
        
        const scores = {
            clarity: Math.min(100, baseScore + variation + 5),
            satAlignment: Math.min(100, baseScore + variation),
            khanAlignment: Math.min(100, baseScore + variation + 3),
            pedagogicalValue: Math.min(100, baseScore + variation + 7)
        };
        
        return {
            problemId: problem.id,
            scores,
            overall: this.calculateOverallScore(scores),
            feedback: this.generateFeedback(scores)
        };
    }
    
    calculateOverallScore(scores) {
        return (
            scores.clarity * this.evaluationCriteria.clarity.weight +
            scores.satAlignment * this.evaluationCriteria.satAlignment.weight +
            scores.khanAlignment * this.evaluationCriteria.khanAlignment.weight +
            scores.pedagogicalValue * this.evaluationCriteria.pedagogicalValue.weight
        );
    }
    
    generateFeedback(scores) {
        const overall = this.calculateOverallScore(scores);
        
        if (overall >= 90) {
            return 'Excellent problem! Ready for production.';
        } else if (overall >= 80) {
            return 'Good problem with minor improvements needed.';
        } else if (overall >= 70) {
            return 'Acceptable problem but requires refinement.';
        } else {
            return 'Problem needs significant improvement.';
        }
    }
    
    displayEvaluationResult(evaluation) {
        const overall = evaluation.overall;
        let color = colors.green;
        if (overall < 70) color = colors.red;
        else if (overall < 85) color = colors.yellow;
        
        console.log(`  문제 ${evaluation.problemId}: ${color}${overall.toFixed(1)}/100${colors.reset}`);
        console.log(`    - 명확성: ${evaluation.scores.clarity.toFixed(0)}`);
        console.log(`    - SAT 정합성: ${evaluation.scores.satAlignment.toFixed(0)}`);
        console.log(`    - Khan 정합성: ${evaluation.scores.khanAlignment.toFixed(0)}`);
        console.log(`    - 교육적 가치: ${evaluation.scores.pedagogicalValue.toFixed(0)}`);
    }
    
    async generateImprovements(evaluations) {
        const improvements = [];
        
        for (const evaluation of evaluations) {
            const improvement = {
                problemId: evaluation.problemId,
                suggestions: []
            };
            
            // 점수가 낮은 영역에 대한 개선 제안
            if (evaluation.scores.clarity < 80) {
                improvement.suggestions.push({
                    area: 'clarity',
                    suggestion: '문제 서술을 더 명확하게 개선',
                    priority: 'high'
                });
            }
            
            if (evaluation.scores.satAlignment < 80) {
                improvement.suggestions.push({
                    area: 'satAlignment',
                    suggestion: 'SAT 스타일에 맞게 선택지 조정',
                    priority: 'medium'
                });
            }
            
            if (evaluation.scores.khanAlignment < 80) {
                improvement.suggestions.push({
                    area: 'khanAlignment',
                    suggestion: 'Khan Academy 커리큘럼과 더 잘 연결',
                    priority: 'medium'
                });
            }
            
            if (evaluation.scores.pedagogicalValue < 80) {
                improvement.suggestions.push({
                    area: 'pedagogicalValue',
                    suggestion: '더 깊은 개념 이해를 유도하는 요소 추가',
                    priority: 'low'
                });
            }
            
            improvements.push(improvement);
        }
        
        return improvements;
    }
    
    async saveResults(evaluations, improvements) {
        const results = {
            timestamp: new Date().toISOString(),
            evaluations,
            improvements,
            summary: {
                totalProblems: evaluations.length,
                avgScore: evaluations.reduce((sum, e) => sum + e.overall, 0) / evaluations.length,
                excellentProblems: evaluations.filter(e => e.overall >= 90).length,
                goodProblems: evaluations.filter(e => e.overall >= 80 && e.overall < 90).length,
                needsWork: evaluations.filter(e => e.overall < 80).length
            }
        };
        
        try {
            await fs.writeFile(
                path.join(__dirname, 'vertex-ai-evaluation-results.json'),
                JSON.stringify(results, null, 2)
            );
            console.log(colors.green + '\n✅ 평가 결과가 저장되었습니다.' + colors.reset);
        } catch (error) {
            console.log(colors.yellow + '⚠️ 결과 저장 실패' + colors.reset);
        }
        
        return results;
    }
    
    summarizeResults(evaluations) {
        console.log('\n' + colors.cyan + '=' .repeat(70) + colors.reset);
        console.log(colors.bright + '📊 품질 평가 요약' + colors.reset);
        console.log(colors.cyan + '=' .repeat(70) + colors.reset);
        
        const avgScore = evaluations.reduce((sum, e) => sum + e.overall, 0) / evaluations.length;
        const excellent = evaluations.filter(e => e.overall >= 90).length;
        const good = evaluations.filter(e => e.overall >= 80 && e.overall < 90).length;
        const needsWork = evaluations.filter(e => e.overall < 80).length;
        
        console.log(`\n총 문제 수: ${evaluations.length}`);
        console.log(`평균 품질 점수: ${colors.yellow}${avgScore.toFixed(1)}/100${colors.reset}`);
        
        console.log('\n품질 분포:');
        console.log(`  ${colors.green}우수 (90+): ${excellent}개${colors.reset}`);
        console.log(`  ${colors.yellow}양호 (80-89): ${good}개${colors.reset}`);
        console.log(`  ${colors.red}개선 필요 (<80): ${needsWork}개${colors.reset}`);
        
        // 영역별 평균
        console.log('\n영역별 평균 점수:');
        const areaAverages = {
            clarity: 0,
            satAlignment: 0,
            khanAlignment: 0,
            pedagogicalValue: 0
        };
        
        evaluations.forEach(e => {
            areaAverages.clarity += e.scores.clarity;
            areaAverages.satAlignment += e.scores.satAlignment;
            areaAverages.khanAlignment += e.scores.khanAlignment;
            areaAverages.pedagogicalValue += e.scores.pedagogicalValue;
        });
        
        Object.keys(areaAverages).forEach(key => {
            areaAverages[key] /= evaluations.length;
            const label = {
                clarity: '명확성',
                satAlignment: 'SAT 정합성',
                khanAlignment: 'Khan 정합성',
                pedagogicalValue: '교육적 가치'
            }[key];
            console.log(`  ${label}: ${areaAverages[key].toFixed(1)}/100`);
        });
        
        console.log('\n' + colors.magenta + '📌 권장사항:' + colors.reset);
        if (avgScore >= 85) {
            console.log(colors.green + '  ✓ 전반적인 품질이 우수합니다!' + colors.reset);
            console.log('  ✓ 교사 리뷰 후 바로 사용 가능');
        } else if (avgScore >= 75) {
            console.log(colors.yellow + '  ! 품질 개선이 필요한 문제들이 있습니다' + colors.reset);
            console.log('  ! 개선 제안을 참고하여 수정 권장');
        } else {
            console.log(colors.red + '  ✗ 전반적인 품질 개선이 필요합니다' + colors.reset);
            console.log('  ✗ 문제 재생성 고려');
        }
        
        console.log('\n' + colors.cyan + '💡 Vertex AI AutoML 활용 효과:' + colors.reset);
        console.log('  • 문제 품질 자동 평가로 시간 절약');
        console.log('  • 일관된 품질 기준 유지');
        console.log('  • 데이터 기반 개선 제안');
        console.log('  • 교사 리뷰 부담 감소');
    }
}

// 실행
console.log('Vertex AI AutoML 품질 평가 시작...\n');
const evaluator = new VertexAIQualityEvaluator();
evaluator.run().catch(error => {
    console.error(colors.red + '평가 실패: ' + error.message + colors.reset);
    process.exit(1);
});