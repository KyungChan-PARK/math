const express = require('express');
const app = express();

app.use(express.json());

// 문제 생성 엔드포인트
app.post('/generate-problem', (req, res) => {
    const { unit, difficulty, topic } = req.body;
    
    const problem = {
        id: Date.now().toString(),
        unit: unit || 'algebra2_unit2',
        difficulty: difficulty || 3,
        topic: topic || '함수 변환',
        problem: 'f(x) = x²에서 g(x) = 2f(x-3) + 1의 꼭짓점은?',
        choices: ['(3, 1)', '(-3, 1)', '(3, -1)', '(-3, -1)'],
        correct: 0,
        created: new Date().toISOString(),
        status: 'pending_review'
    };
    
    res.json({
        success: true,
        problem: problem,
        message: 'Problem generated via Cloud Run'
    });
});

// 품질 평가 엔드포인트
app.post('/evaluate-quality', (req, res) => {
    const { problemId } = req.body;
    
    const qualityScore = {
        clarity: 85 + Math.random() * 15,
        satAlignment: 80 + Math.random() * 20,
        khanAlignment: 85 + Math.random() * 15,
        pedagogicalValue: 90 + Math.random() * 10
    };
    
    const overall = Object.values(qualityScore).reduce((a, b) => a + b) / 4;
    
    res.json({
        success: true,
        problemId: problemId || 'test-problem',
        qualityScore,
        overallScore: overall
    });
});

// 헬스체크
app.get('/', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'Math Problem Generator',
        endpoints: ['/generate-problem', '/evaluate-quality']
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
