const { Firestore } = require('@google-cloud/firestore');

// Firestore 초기화
const firestore = new Firestore({
    projectId: 'math-project-472006'
});

exports.userDataSync = async (req, res) => {
    try {
        // CORS 설정
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }

        // 함수 로직 구현
        const result = {
            success: true,
            function: 'userDataSync',
            timestamp: new Date().toISOString(),
            project: 'math-project-472006'
        };

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: error.message
        });
    }
};
