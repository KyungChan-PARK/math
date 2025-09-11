// 수학 문제집 저장 스크립트 (ES Module 버전)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 문제집 생성 함수
function generateFactoringWorksheet() {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    let problems = [];
    
    // 공통인수 문제 생성
    for (let i = 1; i <= 20; i++) {
        const a = rand(2, 15);
        const b = rand(2, 20);
        const gcd = rand(2, 5);
        problems.push({
            number: i,
            type: 'common',
            expression: `${a*gcd}x + ${b*gcd}`
        });
    }
    
    // 차제곱 문제 생성
    for (let i = 21; i <= 30; i++) {
        const squares = [4, 9, 16, 25, 36, 49, 64, 81, 100];
        const b = squares[rand(0, squares.length - 1)];
        problems.push({
            number: i,
            type: 'difference',
            expression: `x² - ${b}`
        });
    }
    
    // 완전제곱 문제 생성
    for (let i = 31; i <= 40; i++) {
        const b = rand(2, 10);
        const sign = Math.random() > 0.5 ? '+' : '-';
        problems.push({
            number: i,
            type: 'perfect',
            expression: `x² ${sign} ${2*b}x + ${b*b}`
        });
    }
    
    // 일반 이차식 문제 생성
    for (let i = 41; i <= 50; i++) {
        const a = rand(2, 6);
        const b = rand(-15, 15);
        const c = rand(-10, 10);
        const bSign = b >= 0 ? '+' : '';
        const cSign = c >= 0 ? '+' : '';
        problems.push({
            number: i,
            type: 'quadratic',
            expression: `${a}x² ${bSign}${b}x ${cSign}${c}`
        });
    }
    
    return problems;
}

function generateRatioWorksheet() {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    let problems = [];
    
    // 기본 비율 문제
    for (let i = 1; i <= 10; i++) {
        problems.push({
            number: i,
            type: 'basic',
            question: `In a class of ${rand(20, 40)} students, ${rand(5, 20)} are boys. What is the ratio of boys to girls?`
        });
    }
    
    // 비례 문제
    for (let i = 11; i <= 20; i++) {
        problems.push({
            number: i,
            type: 'proportion',
            question: `If ${rand(2, 8)} pencils cost $${rand(3, 12)}, how much do ${rand(5, 12)} pencils cost?`
        });
    }
    
    // 축척 문제
    for (let i = 21; i <= 30; i++) {
        problems.push({
            number: i,
            type: 'scale',
            question: `On a map, ${rand(1, 5)} inches represent ${rand(25, 100)} miles. How many miles do ${rand(3, 8)} inches represent?`
        });
    }
    
    // 혼합물 문제
    for (let i = 31; i <= 40; i++) {
        problems.push({
            number: i,
            type: 'mixture',
            question: `A punch recipe calls for fruit juice and soda in a ${rand(1, 4)}:${rand(2, 5)} ratio. If you use ${rand(2, 8)} cups of fruit juice, how much soda do you need?`
        });
    }
    
    // 복합 비율 문제
    for (let i = 41; i <= 50; i++) {
        problems.push({
            number: i,
            type: 'complex',
            question: `In a school, the ratio of teachers to students is 1:${rand(15, 25)}. If there are ${rand(20, 50)} teachers, how many students are there?`
        });
    }
    
    return problems;
}

function generateLinearEquationWorksheet() {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    let problems = [];
    
    // 기본 일차방정식
    for (let i = 1; i <= 10; i++) {
        const a = rand(2, 8);
        const b = rand(-10, 10);
        const c = rand(10, 30);
        const sign = b >= 0 ? '+' : '';
        problems.push({
            number: i,
            type: 'basic',
            equation: `${a}x ${sign}${b} = ${c}`
        });
    }
    
    // 양변에 변수
    for (let i = 11; i <= 20; i++) {
        const a1 = rand(3, 12);
        const b1 = rand(-10, 10);
        const a2 = rand(1, a1-1);
        const b2 = rand(-10, 20);
        const sign1 = b1 >= 0 ? '+' : '';
        const sign2 = b2 >= 0 ? '+' : '';
        problems.push({
            number: i,
            type: 'bothsides',
            equation: `${a1}x ${sign1}${b1} = ${a2}x ${sign2}${b2}`
        });
    }
    
    // 괄호가 있는 방정식
    for (let i = 21; i <= 30; i++) {
        const a = rand(2, 5);
        const b = rand(-5, 5);
        const c = rand(10, 30);
        const sign = b >= 0 ? '+' : '';
        problems.push({
            number: i,
            type: 'parentheses',
            equation: `${a}(x ${sign}${b}) = ${c}`
        });
    }
    
    // 방정식 추론
    for (let i = 31; i <= 40; i++) {
        problems.push({
            number: i,
            type: 'inference',
            question: `Compare equations: A. 2x + 3 = 7, B. x + 3 = 7. How can we get B from A?`
        });
    }
    
    // 응용 문제
    for (let i = 41; i <= 50; i++) {
        problems.push({
            number: i,
            type: 'application',
            question: `The sum of two consecutive integers is ${rand(15, 35)}. Find the integers.`
        });
    }
    
    return problems;
}

// HTML 템플릿 생성 함수
function createHTMLTemplate(title, problems, type) {
    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.8;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            color: #000;
            background: #fff;
        }
        h1 {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 10px;
        }
        .problem {
            margin: 15px 0;
            padding: 10px;
            border: 1px solid #000;
        }
        .problem-number {
            font-weight: bold;
            display: inline-block;
            width: 30px;
        }
        .answer-line {
            display: inline-block;
            border-bottom: 2px solid #000;
            min-width: 150px;
            margin-left: 10px;
            height: 25px;
        }
        @media print {
            .problem {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${problems.map(p => `
    <div class="problem">
        <span class="problem-number">${p.number}.</span>
        ${type === 'factoring' ? `Factor completely: ${p.expression}` :
          type === 'ratio' ? p.question :
          type === 'linear' ? (p.equation ? `Solve: ${p.equation}` : p.question) : ''}
        <br>답: <span class="answer-line"></span>
    </div>
    `).join('')}
</body>
</html>`;
    
    return html;
}

// 파일 저장
function saveWorksheets() {
    const worksheetDir = path.join(__dirname, 'worksheets');
    
    // 디렉토리 생성 (없으면)
    if (!fs.existsSync(worksheetDir)) {
        fs.mkdirSync(worksheetDir, { recursive: true });
    }
    
    const date = new Date().toISOString().slice(0, 10);
    
    // 인수분해 문제집
    const factoringProblems = generateFactoringWorksheet();
    const factoringHTML = createHTMLTemplate('Khan Academy 인수분해 문제집 (50문제)', factoringProblems, 'factoring');
    fs.writeFileSync(path.join(worksheetDir, `인수분해_문제집_${date}.html`), factoringHTML, 'utf8');
    console.log(`✓ 인수분해 문제집 저장 완료: worksheets/인수분해_문제집_${date}.html`);
    
    // 비와 비율 문제집
    const ratioProblems = generateRatioWorksheet();
    const ratioHTML = createHTMLTemplate('Khan Academy 비와 비율 문제집 (50문제)', ratioProblems, 'ratio');
    fs.writeFileSync(path.join(worksheetDir, `비와비율_문제집_${date}.html`), ratioHTML, 'utf8');
    console.log(`✓ 비와 비율 문제집 저장 완료: worksheets/비와비율_문제집_${date}.html`);
    
    // 일차방정식 문제집
    const linearProblems = generateLinearEquationWorksheet();
    const linearHTML = createHTMLTemplate('Khan Academy 일차방정식 문제집 (50문제)', linearProblems, 'linear');
    fs.writeFileSync(path.join(worksheetDir, `일차방정식_문제집_${date}.html`), linearHTML, 'utf8');
    console.log(`✓ 일차방정식 문제집 저장 완료: worksheets/일차방정식_문제집_${date}.html`);
    
    console.log('\n모든 문제집이 성공적으로 저장되었습니다!');
    console.log(`저장 위치: ${worksheetDir}`);
}

// 실행
saveWorksheets();
