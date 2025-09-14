const { GoogleGenerativeAI } = require('@google/generative-ai');

// Gemini 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateMathProblem = async (req, res) => {
    // CORS 설정
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    try {
        const {
            grade = '6',
            topic = 'algebra',
            difficulty = 'medium',
            count = 5,
            language = 'ko'
        } = req.body;

        // Gemini 모델 사용
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
        학년: ${grade}학년
        주제: ${topic}
        난이도: ${difficulty}
        개수: ${count}개
        언어: ${language === 'ko' ? '한국어' : '영어'}

        위 조건에 맞는 수학 문제를 JSON 형식으로 생성해주세요.
        형식:
        {
            "problems": [
                {
                    "id": 1,
                    "question": "문제",
                    "answer": "정답",
                    "explanation": "풀이",
                    "difficulty": "난이도"
                }
            ]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // JSON 파싱 시도
        let problems;
        try {
            // JSON 블록 추출
            const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                problems = JSON.parse(jsonMatch[1]);
            } else {
                problems = JSON.parse(response);
            }
        } catch (e) {
            // 파싱 실패시 원본 텍스트 반환
            problems = {
                rawResponse: response,
                error: 'JSON 파싱 실패'
            };
        }

        return res.status(200).json({
            success: true,
            grade,
            topic,
            difficulty,
            count,
            problems: problems.problems || problems,
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};