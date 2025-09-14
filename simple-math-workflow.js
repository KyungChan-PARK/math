/**
 * Simple Math Generation Workflow
 * 1인 개발자용 즉시 실행 가능한 수학 문제 생성 시스템
 * Samsung Galaxy Book 4 Pro 360 최적화
 */

const express = require('express');
// Qwen API Client 직접 구현
class QwenAPI {
  constructor() {
    this.apiKey = process.env.DASHSCOPE_API_KEY || 'sk-832a0ba1a9b64ec39887028eef0b28d7';
    this.endpoint = 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
  }

  async generateProblems(requirements) {
    const { grade, topic, count, difficulty } = requirements;
    const prompt = `
      학년: ${grade}
      주제: ${topic}
      난이도: ${difficulty}
      ${count}개의 수학 문제를 생성하세요.
      각 문제는 명확한 문제와 정답을 포함해야 합니다.
      JSON 형식으로 반환: [{"question": "...", "answer": "..."}]
    `;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'qwen3-max-preview',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;

      // JSON 파싱 시도
      try {
        return JSON.parse(content);
      } catch {
        // 파싱 실패시 기본 문제 반환
        return Array.from({ length: count }, (_, i) => ({
          question: `${topic} 문제 ${i + 1}`,
          answer: `정답 ${i + 1}`
        }));
      }
    } catch (error) {
      console.error('Qwen API 오류:', error);
      // 오류시 기본 문제 반환
      return Array.from({ length: count }, (_, i) => ({
        question: `${topic} 문제 ${i + 1}`,
        answer: `정답 ${i + 1}`
      }));
    }
  }
}
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class SimpleMathWorkflow {
  constructor() {
    this.app = express();
    this.qwen = new QwenAPI();
    this.app.use(express.json());
    this.app.use(express.static('public'));
    this.setupRoutes();
  }

  setupRoutes() {
    // 메인 페이지
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // 문제 생성 (사용자 승인 필요)
    this.app.post('/generate', this.generateWithApproval.bind(this));
    
    // PDF 생성
    this.app.post('/create-pdf', this.createPDF.bind(this));
    
    // 터치 데이터 수집
    this.app.post('/touch-data', this.collectTouchData.bind(this));
  }

  /**
   * 사용자 승인과 함께 문제 생성
   */
  async generateWithApproval(req, res) {
    const { grade, topic, count, difficulty } = req.body;
    
    console.log(`📝 ${grade}학년 ${topic} 문제 ${count}개 생성 요청`);
    
    try {
      // Qwen으로 초안 생성
      const draft = await this.qwen.generateProblems({
        grade,
        topic,
        count,
        difficulty
      });
      
      // 사용자에게 승인 요청
      res.json({
        status: 'draft',
        problems: draft,
        message: '생성된 문제를 검토해주세요'
      });
    } catch (error) {
      console.error('문제 생성 실패:', error);
      res.status(500).json({ error: '문제 생성 실패' });
    }
  }

  /**
   * PDF 생성 (A4 출력용)
   */
  async createPDF(req, res) {
    const { problems, studentName, title } = req.body;
    
    console.log(`📄 PDF 생성 중: ${title}`);
    
    const doc = new PDFDocument({ size: 'A4' });
    const filename = `worksheet_${Date.now()}.pdf`;
    const filepath = path.join(__dirname, 'output', filename);
    
    // output 디렉토리 생성
    if (!fs.existsSync(path.join(__dirname, 'output'))) {
      fs.mkdirSync(path.join(__dirname, 'output'));
    }
    
    doc.pipe(fs.createWriteStream(filepath));
    
    // 헤더
    doc.fontSize(20).text(title || '수학 문제지', { align: 'center' });
    doc.fontSize(12).text(`이름: ${studentName || '_________'}`, 50, 100);
    doc.text(`날짜: ${new Date().toLocaleDateString('ko-KR')}`, 50, 120);
    doc.moveDown(2);
    
    // 문제 출력
    problems.forEach((problem, index) => {
      doc.fontSize(12).text(`${index + 1}. ${problem.question}`, 50, doc.y);
      doc.moveDown(3); // 답 쓸 공간
      
      if (doc.y > 700) { // 페이지 넘김
        doc.addPage();
      }
    });
    
    // 정답 페이지
    doc.addPage();
    doc.fontSize(16).text('정답', { align: 'center' });
    doc.moveDown();
    
    problems.forEach((problem, index) => {
      doc.fontSize(10).text(`${index + 1}. ${problem.answer}`);
    });
    
    doc.end();
    
    res.json({
      success: true,
      filename,
      path: `/output/${filename}`
    });
  }

  /**
   * 터치 데이터 수집 (Galaxy Book 최적화)
   */
  collectTouchData(req, res) {
    const touchData = req.body;
    
    // 터치 데이터 저장 (나중에 분석용)
    const dataFile = path.join(__dirname, 'touch-data', `${Date.now()}.json`);
    
    if (!fs.existsSync(path.join(__dirname, 'touch-data'))) {
      fs.mkdirSync(path.join(__dirname, 'touch-data'));
    }
    
    fs.writeFileSync(dataFile, JSON.stringify(touchData, null, 2));
    
    res.json({ saved: true });
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`✅ 수학 워크플로우 서버 실행: http://localhost:${port}`);
      console.log(`📱 Galaxy Book 터치 지원 활성화`);
    });
  }
}

// 즉시 실행
if (require.main === module) {
  const workflow = new SimpleMathWorkflow();
  workflow.start();
}

module.exports = SimpleMathWorkflow;