#!/usr/bin/env node

/**
 * 통합 수학 교육 시스템 - 데이터 흐름 구현
 * 1. 문제 생성 (Qwen/Gemini)
 * 2. 개인화 (Vertex AI)
 * 3. 배포 (앱 + 프린트)
 * 4. 자동 채점 (Document AI)
 * 5. 분석 & 피드백 (Vertex AI)
 */

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Firestore } = require('@google-cloud/firestore');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

class IntegratedMathSystem {
  constructor() {
    this.app = express();
    this.app.use(express.json());

    // AI 모델 초기화
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.firestore = new Firestore({
      projectId: process.env.GCP_PROJECT_ID || 'math-project-472006',
      databaseId: 'palantir-math'
    });

    this.setupRoutes();
  }

  setupRoutes() {
    // 1단계: 문제 생성
    this.app.post('/api/generate-problems', this.generateProblems.bind(this));

    // 2단계: 개인화
    this.app.post('/api/personalize', this.personalizeProblems.bind(this));

    // 3단계: 배포
    this.app.post('/api/distribute', this.distributeAssignment.bind(this));

    // 4단계: 채점
    this.app.post('/api/grade', this.gradeSubmission.bind(this));

    // 5단계: 분석
    this.app.get('/api/analyze/:studentId', this.analyzePerformance.bind(this));
  }

  // ============= 1단계: 문제 생성 =============
  async generateProblems(req, res) {
    const { grade, topic, difficulty, count, language = 'ko' } = req.body;

    console.log(`\n📝 [Step 1] 문제 생성 시작`);
    console.log(`- 학년: ${grade}, 주제: ${topic}, 난이도: ${difficulty}, 개수: ${count}`);

    try {
      let problems;

      // 언어별 AI 선택
      if (language === 'ko') {
        problems = await this.generateWithQwen(grade, topic, difficulty, count);
      } else {
        problems = await this.generateWithGemini(grade, topic, difficulty, count);
      }

      // 생성된 문제 저장
      const batch = this.firestore.batch();
      const sessionId = `session_${Date.now()}`;

      problems.forEach((problem, index) => {
        const docRef = this.firestore.collection('generated_problems').doc();
        batch.set(docRef, {
          sessionId,
          problemNumber: index + 1,
          ...problem,
          createdAt: new Date()
        });
      });

      await batch.commit();

      console.log(`✅ ${problems.length}개 문제 생성 완료`);

      res.json({
        success: true,
        sessionId,
        problems,
        nextStep: `/api/personalize`
      });

    } catch (error) {
      console.error('❌ 문제 생성 실패:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async generateWithQwen(grade, topic, difficulty, count) {
    const response = await axios.post(
      process.env.DASHSCOPE_ENDPOINT || 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: 'qwen3-max-preview',
        input: {
          messages: [
            {
              role: 'system',
              content: '당신은 한국 수학 교사입니다. 주어진 조건에 맞는 수학 문제를 JSON 형식으로 생성하세요.'
            },
            {
              role: 'user',
              content: `학년: ${grade}, 주제: ${topic}, 난이도: ${difficulty}, 개수: ${count}개
              다음 JSON 형식으로 생성: [{"question": "문제", "answer": "정답", "explanation": "풀이", "difficulty": "${difficulty}"}]`
            }
          ]
        },
        parameters: { max_tokens: 2000, temperature: 0.7 }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.output?.text || response.data.output?.choices?.[0]?.message?.content;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  }

  async generateWithGemini(grade, topic, difficulty, count) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate ${count} math problems for grade ${grade} on ${topic} with ${difficulty} difficulty.
                    Return JSON: [{"question": "", "answer": "", "explanation": "", "difficulty": ""}]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  }

  // ============= 2단계: 개인화 (AutoML 활용) =============
  async personalizeProblems(req, res) {
    const { sessionId, studentId } = req.body;

    console.log(`\n🎯 [Step 2] 개인화 시작`);
    console.log(`- 세션: ${sessionId}, 학생: ${studentId}`);

    try {
      // 학생 프로필 조회
      const profile = await this.getStudentProfile(studentId);

      // AutoML로 난이도 조정
      const adjustedDifficulty = await this.predictOptimalDifficulty(profile);

      // 문제 개인화
      const problemsSnapshot = await this.firestore
        .collection('generated_problems')
        .where('sessionId', '==', sessionId)
        .get();

      const personalizedProblems = [];

      for (const doc of problemsSnapshot.docs) {
        const problem = doc.data();

        // 개인화 적용
        const personalized = await this.applyPersonalization(problem, profile, adjustedDifficulty);
        personalizedProblems.push(personalized);

        // 개인화된 버전 저장
        await this.firestore.collection('personalized_problems').add({
          ...personalized,
          studentId,
          originalId: doc.id,
          personalizedAt: new Date()
        });
      }

      console.log(`✅ ${personalizedProblems.length}개 문제 개인화 완료`);

      res.json({
        success: true,
        studentId,
        personalizedProblems,
        recommendedDifficulty: adjustedDifficulty,
        nextStep: `/api/distribute`
      });

    } catch (error) {
      console.error('❌ 개인화 실패:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getStudentProfile(studentId) {
    const doc = await this.firestore.collection('students').doc(studentId).get();

    if (!doc.exists) {
      // 새 학생인 경우 기본 프로필 생성
      const defaultProfile = {
        studentId,
        grade: 6,
        level: 'intermediate',
        weakAreas: [],
        strongAreas: [],
        averageScore: 70,
        totalProblems: 0,
        createdAt: new Date()
      };

      await this.firestore.collection('students').doc(studentId).set(defaultProfile);
      return defaultProfile;
    }

    return doc.data();
  }

  async predictOptimalDifficulty(profile) {
    // AutoML 시뮬레이션 (실제로는 Vertex AI AutoML 모델 호출)
    const score = profile.averageScore || 70;

    if (score >= 90) return 'hard';
    if (score >= 70) return 'medium';
    return 'easy';
  }

  async applyPersonalization(problem, profile, difficulty) {
    // 약점 영역에 대한 힌트 추가
    const personalized = { ...problem };

    if (profile.weakAreas.includes(problem.topic)) {
      personalized.hint = '힌트: 이 문제는 기본 개념을 차근차근 적용해보세요.';
      personalized.detailedExplanation = true;
    }

    personalized.adjustedDifficulty = difficulty;
    return personalized;
  }

  // ============= 3단계: 배포 (앱 + 프린트) =============
  async distributeAssignment(req, res) {
    const { studentId, problems, format = ['app', 'print'] } = req.body;

    console.log(`\n📤 [Step 3] 과제 배포`);
    console.log(`- 학생: ${studentId}, 형식: ${format.join(', ')}`);

    try {
      const assignmentId = `assignment_${Date.now()}`;
      const results = {};

      // 앱 배포
      if (format.includes('app')) {
        results.app = await this.deployToApp(assignmentId, studentId, problems);
        console.log('✅ 앱 배포 완료');
      }

      // 프린트 생성
      if (format.includes('print')) {
        results.print = await this.generatePrintVersion(assignmentId, studentId, problems);
        console.log('✅ 프린트 버전 생성 완료');
      }

      // 과제 정보 저장
      await this.firestore.collection('assignments').doc(assignmentId).set({
        assignmentId,
        studentId,
        problems,
        format,
        distributedAt: new Date(),
        status: 'distributed',
        ...results
      });

      res.json({
        success: true,
        assignmentId,
        distribution: results,
        nextStep: `/api/grade`
      });

    } catch (error) {
      console.error('❌ 배포 실패:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async deployToApp(assignmentId, studentId, problems) {
    // 실시간 데이터베이스에 푸시
    const appData = {
      assignmentId,
      studentId,
      problems,
      status: 'pending',
      pushedAt: new Date()
    };

    await this.firestore.collection('app_assignments').add(appData);

    // 푸시 알림 시뮬레이션
    return {
      pushed: true,
      notificationSent: true,
      appUrl: `https://math-app.com/assignment/${assignmentId}`
    };
  }

  async generatePrintVersion(assignmentId, studentId, problems) {
    const doc = new PDFDocument({ size: 'A4' });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));

    // PDF 생성
    doc.fontSize(20).text('수학 과제', { align: 'center' });
    doc.fontSize(12).text(`학생 ID: ${studentId}`, { align: 'left' });
    doc.text(`과제 ID: ${assignmentId}`);
    doc.text(`날짜: ${new Date().toLocaleDateString('ko-KR')}`);
    doc.moveDown();

    problems.forEach((problem, index) => {
      doc.fontSize(14).text(`문제 ${index + 1}. ${problem.question}`);
      doc.moveDown();
      doc.strokeColor('#cccccc').lineWidth(0.5);

      // 답안 작성 공간
      for (let i = 0; i < 3; i++) {
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
      }
      doc.moveDown();
    });

    // QR 코드 추가
    const qrData = await QRCode.toDataURL(`https://math-app.com/submit/${assignmentId}`);
    doc.text('제출용 QR 코드:', 50, 700);
    doc.image(qrData, 50, 720, { width: 80 });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);

        // PDF 저장 시뮬레이션
        resolve({
          generated: true,
          pdfSize: pdfBuffer.length,
          pdfUrl: `https://storage.googleapis.com/math-worksheets/${assignmentId}.pdf`,
          pages: Math.ceil(problems.length / 5)
        });
      });
    });
  }

  // ============= 4단계: 자동 채점 =============
  async gradeSubmission(req, res) {
    const { assignmentId, submissionType, answers } = req.body;

    console.log(`\n✅ [Step 4] 자동 채점`);
    console.log(`- 과제: ${assignmentId}, 제출 유형: ${submissionType}`);

    try {
      // 정답 조회
      const assignment = await this.firestore
        .collection('assignments')
        .doc(assignmentId)
        .get();

      const correctAnswers = assignment.data().problems.map(p => p.answer);

      // 채점
      const gradingResult = this.gradeAnswers(answers, correctAnswers);

      // 결과 저장
      await this.firestore.collection('submissions').add({
        assignmentId,
        submissionType,
        answers,
        gradingResult,
        submittedAt: new Date()
      });

      console.log(`✅ 채점 완료: ${gradingResult.score}점`);

      res.json({
        success: true,
        assignmentId,
        ...gradingResult,
        nextStep: `/api/analyze`
      });

    } catch (error) {
      console.error('❌ 채점 실패:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  gradeAnswers(studentAnswers, correctAnswers) {
    let correct = 0;
    const details = [];

    studentAnswers.forEach((answer, index) => {
      const isCorrect = answer === correctAnswers[index];
      if (isCorrect) correct++;

      details.push({
        questionNumber: index + 1,
        studentAnswer: answer,
        correctAnswer: correctAnswers[index],
        isCorrect
      });
    });

    return {
      score: Math.round((correct / correctAnswers.length) * 100),
      correct,
      total: correctAnswers.length,
      details
    };
  }

  // ============= 5단계: 분석 & 피드백 =============
  async analyzePerformance(req, res) {
    const { studentId } = req.params;

    console.log(`\n📊 [Step 5] 성과 분석`);
    console.log(`- 학생: ${studentId}`);

    try {
      // 최근 제출 내역 조회
      const submissions = await this.firestore
        .collection('submissions')
        .where('studentId', '==', studentId)
        .orderBy('submittedAt', 'desc')
        .limit(10)
        .get();

      const performanceData = this.calculatePerformance(submissions.docs);

      // AutoML로 다음 학습 추천
      const recommendations = await this.generateRecommendations(performanceData);

      // 프로필 업데이트
      await this.updateStudentProfile(studentId, performanceData);

      console.log(`✅ 분석 완료`);

      res.json({
        success: true,
        studentId,
        performance: performanceData,
        recommendations,
        nextCycle: 'Ready for new problem generation'
      });

    } catch (error) {
      console.error('❌ 분석 실패:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  calculatePerformance(submissions) {
    const scores = submissions.map(doc => doc.data().gradingResult.score);

    return {
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      trend: this.calculateTrend(scores),
      weakAreas: this.identifyWeakAreas(submissions),
      strongAreas: this.identifyStrongAreas(submissions),
      totalProblems: submissions.length * 10
    };
  }

  calculateTrend(scores) {
    if (scores.length < 2) return 'neutral';
    const recent = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const previous = scores.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
    return recent > previous ? 'improving' : recent < previous ? 'declining' : 'stable';
  }

  identifyWeakAreas(submissions) {
    // 실제로는 더 복잡한 분석 필요
    return ['일차방정식', '분수'];
  }

  identifyStrongAreas(submissions) {
    return ['기본 연산', '도형'];
  }

  async generateRecommendations(performance) {
    return {
      nextDifficulty: performance.averageScore > 80 ? 'hard' : 'medium',
      focusTopics: performance.weakAreas,
      practiceCount: performance.trend === 'declining' ? 10 : 5
    };
  }

  async updateStudentProfile(studentId, performanceData) {
    await this.firestore.collection('students').doc(studentId).update({
      ...performanceData,
      lastUpdated: new Date()
    });
  }

  // 서버 시작
  start() {
    const PORT = process.env.PORT || 8200;
    this.app.listen(PORT, () => {
      console.log(`\n🚀 통합 수학 교육 시스템 시작`);
      console.log(`📍 포트: ${PORT}`);
      console.log(`\n데이터 흐름:`);
      console.log(`1. 문제 생성 → POST /api/generate-problems`);
      console.log(`2. 개인화 → POST /api/personalize`);
      console.log(`3. 배포 → POST /api/distribute`);
      console.log(`4. 채점 → POST /api/grade`);
      console.log(`5. 분석 → GET /api/analyze/:studentId`);
    });
  }
}

// 시스템 시작
const system = new IntegratedMathSystem();
system.start();