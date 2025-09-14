#!/usr/bin/env node

/**
 * 간단한 문제 생성 테스트 (API 키 불필요)
 * 템플릿 기반 시뮬레이션
 */

import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 색상 코드
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

class SimpleProblemTester {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.problems = [];
        this.currentProblem = null;
    }
    
    async start() {
        console.clear();
        console.log(colors.bright + colors.cyan + '=' .repeat(60) + colors.reset);
        console.log(colors.bright + colors.cyan + '   🎓 수학 문제 생성 시스템 간단 테스트' + colors.reset);
        console.log(colors.bright + colors.cyan + '=' .repeat(60) + colors.reset);
        console.log();
        
        await this.generateAndTestProblem();
        
        this.rl.close();
    }
    
    async generateAndTestProblem() {
        console.log(colors.yellow + '\n📝 Algebra 2 Unit 2 샘플 문제 생성\n' + colors.reset);
        
        // 템플릿 기반 문제 생성
        const problem = this.generateSampleProblem();
        
        // 문제 표시
        await this.displayProblem(problem);
        
        // 피드백 수집
        const feedback = await this.collectFeedback();
        
        // 결과 저장
        await this.saveResults(problem, feedback);
        
        console.log(colors.green + '\n✅ 테스트 완료!' + colors.reset);
        console.log('\n다음 단계:');
        console.log('1. API 키 설정 후 전체 테스트 실행');
        console.log('2. Vertex AI 통합으로 품질 향상');
        console.log('3. 교사 리뷰 시스템 구축');
    }
    
    generateSampleProblem() {
        const problems = [
            {
                id: 1,
                unit: 'Algebra 2 Unit 2',
                topic: '함수 변환',
                difficulty: 3,
                problem_ko: `함수 f(x) = x²가 주어졌을 때, g(x) = 2f(x-3) + 1의 그래프는 f(x)의 그래프를 어떻게 변환한 것인가?`,
                problem_en: `Given f(x) = x², how is the graph of g(x) = 2f(x-3) + 1 transformed from f(x)?`,
                choices: [
                    'A) 오른쪽 3, 위로 1, 수직 2배',
                    'B) 왼쪽 3, 위로 1, 수직 2배',
                    'C) 오른쪽 3, 아래로 1, 수직 1/2배',
                    'D) 왼쪽 3, 아래로 1, 수직 2배'
                ],
                correct: 'A',
                scaffolding: {
                    level1: '변환 순서: 수평 이동 → 수직 스트레치 → 수직 이동',
                    level2: 'x-3은 오른쪽 이동, 2f는 수직 2배, +1은 위로 이동',
                    level3: '단계별:\n1) f(x-3): x²를 오른쪽으로 3\n2) 2f(x-3): y값을 2배로\n3) +1: 전체를 위로 1',
                    level4: '꼭짓점 추적:\n원래: (0,0) → (3,0) → (3,0) → (3,1)',
                    level5: '완전 해설:\nf(x) = x²의 꼭짓점 (0,0)에서 시작\nx-3: 수평으로 +3 이동 → (3,0)\n×2: 수직 방향 2배 확대 (꼭짓점은 그대로)\n+1: 수직으로 +1 이동 → (3,1)\n최종 꼭짓점: (3,1)'
                },
                visual: `
    f(x) = x²          g(x) = 2f(x-3) + 1
        |                     |
    4   +                 8   +
        |                     |  
    3   +                 6   +     ___
        |      ___            |    /   \\
    2   +     /   \\       4   +   /     \\
        |    /     \\          |  /       \\
    1   +   /       \\     2   + /         \\
        |  /         \\        |/           \\
    0---+------------     0---+------------
        0   1   2   3         0   3   6   9
                `,
                interpretation: [
                    '함수 변환은 좌표평면에서의 이동과 크기 변경',
                    'x-3은 입력값 조정 (수평 이동)',
                    '×2는 출력값 조정 (수직 스트레치)',
                    '+1은 전체 상하 이동',
                    'SAT에서는 변환 순서와 방향이 핵심'
                ]
            },
            {
                id: 2,
                unit: 'Algebra 2 Unit 2',
                topic: '역함수',
                difficulty: 4,
                problem_ko: `f(x) = 2x + 3일 때, f⁻¹(7) = ?`,
                problem_en: `If f(x) = 2x + 3, what is f⁻¹(7)?`,
                choices: [
                    'A) 2',
                    'B) 17',
                    'C) 5',
                    'D) -2'
                ],
                correct: 'A',
                scaffolding: {
                    level1: 'f⁻¹(7)은 f(x) = 7이 되는 x값',
                    level2: '2x + 3 = 7을 풀면?',
                    level3: '단계:\n1) 2x + 3 = 7\n2) 2x = 4\n3) x = 2',
                    level4: '역함수 구하기:\ny = 2x + 3\nx = 2y + 3 (x↔y)\nx - 3 = 2y\ny = (x-3)/2\nf⁻¹(x) = (x-3)/2\nf⁻¹(7) = (7-3)/2 = 2',
                    level5: '완전 해설:\n역함수는 원함수의 입출력을 바꾼 것\nf(2) = 2(2) + 3 = 7이므로\nf⁻¹(7) = 2\n검증: f(f⁻¹(7)) = f(2) = 7 ✓'
                },
                visual: `
    y = f(x) = 2x + 3     y = f⁻¹(x) = (x-3)/2
         |                        |
    7 ---+---•                7--+-------•
         |   /                   |      /
    5 ---+  /                 5--+     /
         | /                     |    /
    3 ---•                    3--+   •
         |                       |  /
    1 ---+                    1--+ /
         |                       |/
    -----+-----               ---+-------
         0   2                   3   7
                `,
                interpretation: [
                    '역함수: 입력과 출력의 역할 교환',
                    'f(a) = b ↔ f⁻¹(b) = a',
                    '그래프: y = x 대칭',
                    '실생활: 단위 변환의 역과정',
                    'SAT 팁: 역함수 = 방정식 풀기'
                ]
            }
        ];
        
        return problems[Math.floor(Math.random() * problems.length)];
    }
    
    async displayProblem(problem) {
        console.log(colors.green + '=' .repeat(60) + colors.reset);
        console.log(colors.bright + colors.blue + `📚 ${problem.unit} - ${problem.topic}` + colors.reset);
        console.log(`난이도: ${'⭐'.repeat(problem.difficulty)}${'☆'.repeat(5-problem.difficulty)}`);
        console.log(colors.green + '=' .repeat(60) + colors.reset);
        
        console.log('\n' + colors.bright + '문제:' + colors.reset);
        console.log('🇰🇷 ' + problem.problem_ko);
        console.log('🇺🇸 ' + problem.problem_en);
        
        console.log('\n' + colors.bright + '선택지:' + colors.reset);
        problem.choices.forEach(choice => console.log('  ' + choice));
        
        // 시각화
        console.log('\n' + colors.cyan + '📊 시각화:' + colors.reset);
        console.log(problem.visual);
        
        // 사용자 답변
        const answer = await this.askQuestion('\n당신의 답 (A-D): ');
        
        if (answer.toUpperCase() === problem.correct) {
            console.log(colors.green + '\n✅ 정답입니다!' + colors.reset);
        } else {
            console.log(colors.red + '\n❌ 틀렸습니다.' + colors.reset);
            console.log(colors.yellow + `정답: ${problem.correct}` + colors.reset);
        }
        
        // 스캐폴딩 선택
        console.log('\n' + colors.magenta + '💡 도움말 수준 선택:' + colors.reset);
        console.log('1. 최소 힌트');
        console.log('2. 기본 안내');
        console.log('3. 단계별 설명');
        console.log('4. 상세 과정');
        console.log('5. 완전 해설');
        console.log('0. 건너뛰기');
        
        const level = await this.askQuestion('선택 (0-5): ');
        
        if (level !== '0') {
            const scaffoldingKey = `level${level}`;
            if (problem.scaffolding[scaffoldingKey]) {
                console.log('\n' + colors.cyan + '📖 설명:' + colors.reset);
                console.log(problem.scaffolding[scaffoldingKey]);
            }
        }
        
        // 다양한 해석
        console.log('\n' + colors.yellow + '🔍 수학적 해석:' + colors.reset);
        problem.interpretation.forEach((interp, i) => {
            console.log(`${i+1}. ${interp}`);
        });
        
        this.currentProblem = problem;
    }
    
    async collectFeedback() {
        console.log('\n' + colors.yellow + '=' .repeat(60) + colors.reset);
        console.log(colors.bright + '💭 피드백' + colors.reset);
        console.log(colors.yellow + '=' .repeat(60) + colors.reset);
        
        const feedback = {};
        
        console.log('\n각 항목을 1-5점으로 평가해주세요:');
        feedback.clarity = parseInt(await this.askQuestion('명확성 (1-5): ')) || 3;
        feedback.difficulty = parseInt(await this.askQuestion('난이도 적절성 (1-5): ')) || 3;
        feedback.scaffolding = parseInt(await this.askQuestion('스캐폴딩 유용성 (1-5): ')) || 3;
        feedback.visual = parseInt(await this.askQuestion('시각화 도움 (1-5): ')) || 3;
        feedback.overall = parseInt(await this.askQuestion('전반적 만족도 (1-5): ')) || 3;
        
        feedback.comment = await this.askQuestion('\n추가 의견 (Enter로 건너뛰기): ');
        
        // 평균 점수 계산
        const avgScore = (feedback.clarity + feedback.difficulty + 
                         feedback.scaffolding + feedback.visual + feedback.overall) / 5;
        
        console.log('\n' + colors.green + `평균 점수: ${avgScore.toFixed(1)}/5` + colors.reset);
        
        if (avgScore >= 4) {
            console.log(colors.green + '훌륭한 평가입니다! 시스템이 잘 작동하고 있습니다.' + colors.reset);
        } else if (avgScore >= 3) {
            console.log(colors.yellow + '개선의 여지가 있습니다. Vertex AI 통합을 고려해보세요.' + colors.reset);
        } else {
            console.log(colors.red + '많은 개선이 필요합니다. 사용자 요구사항을 재검토하세요.' + colors.reset);
        }
        
        return feedback;
    }
    
    async saveResults(problem, feedback) {
        const result = {
            timestamp: new Date().toISOString(),
            problem: {
                id: problem.id,
                unit: problem.unit,
                topic: problem.topic,
                difficulty: problem.difficulty
            },
            feedback,
            avgScore: (feedback.clarity + feedback.difficulty + 
                      feedback.scaffolding + feedback.visual + feedback.overall) / 5
        };
        
        try {
            // 기존 결과 읽기
            let results = [];
            try {
                const data = await fs.readFile(path.join(__dirname, 'test-results.json'), 'utf-8');
                results = JSON.parse(data);
            } catch (e) {
                // 파일이 없으면 새로 생성
            }
            
            results.push(result);
            
            await fs.writeFile(
                path.join(__dirname, 'test-results.json'),
                JSON.stringify(results, null, 2)
            );
            
            console.log(colors.green + '\n✅ 결과가 test-results.json에 저장되었습니다.' + colors.reset);
        } catch (error) {
            console.log(colors.yellow + '\n⚠️ 결과 저장 실패: ' + error.message + colors.reset);
        }
    }
    
    askQuestion(question) {
        return new Promise(resolve => {
            this.rl.question(colors.bright + question + colors.reset, resolve);
        });
    }
}

// 실행
console.log(colors.cyan + '\n시작하는 중...\n' + colors.reset);
const tester = new SimpleProblemTester();
tester.start().catch(console.error);