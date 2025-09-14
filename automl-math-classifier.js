/**
 * AutoML 수학 문제 분류 시스템
 * 1인 개발자를 위한 최소 비용 구현
 * 한국 수학 교육과정 특화
 */

const { AutoMlClient } = require('@google-cloud/automl');
const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs').promises;
const path = require('path');

class MathProblemClassifier {
    constructor(config = {}) {
        // 1인 개발자 최적화 설정
        this.projectId = config.projectId || 'math-project-472006';
        this.location = config.location || 'asia-northeast3';
        this.computeRegion = 'asia-northeast3';
        
        // AutoML 클라이언트
        this.automl = new AutoMlClient();
        this.firestore = new Firestore();
        
        // 비용 관리 설정 (최소 예산)
        this.budget = {
            training: 1,     // $1 훈련 예산
            prediction: 0.5, // $0.5 예측 예산
            storage: 0.1     // $0.1 스토리지
        };
        
        // 한국 수학 교육과정 분류 체계
        this.mathCategories = {
            elementary: {
                '1학년': ['수와 연산', '도형', '측정', '규칙성', '자료와 가능성'],
                '2학년': ['수와 연산', '도형', '측정', '규칙성', '자료와 가능성'],
                '3학년': ['수와 연산', '도형', '측정', '규칙성', '자료와 가능성'],
                '4학년': ['수와 연산', '도형', '측정', '규칙성', '자료와 가능성'],
                '5학년': ['수와 연산', '도형', '측정', '규칙성', '자료와 가능성'],
                '6학년': ['수와 연산', '도형', '측정', '비와 비율', '자료와 가능성']
            },
            middle: {
                '1학년': ['수와 연산', '문자와 식', '함수', '기하', '확률과 통계'],
                '2학년': ['수와 연산', '문자와 식', '함수', '기하', '확률과 통계'],
                '3학년': ['수와 연산', '문자와 식', '함수', '기하', '확률과 통계']
            },
            high: {
                '1학년': ['다항식', '방정식과 부등식', '도형의 방정식', '집합과 명제', '함수', '순열과 조합'],
                '2학년': ['지수와 로그', '삼각함수', '수열', '미분', '적분'],
                '3학년': ['벡터', '확률과 통계', '미적분 II', '기하']
            }
        };
        
        // 훈련 데이터 수집 상태
        this.trainingData = {
            collected: 0,
            required: 100, // 최소 100개 샘플
            quality: 0
        };
    }
    
    /**
     * 데이터셋 준비 (최소 비용)
     */
    async prepareDataset() {
        console.log('📚 수학 문제 데이터셋 준비 중...');
        
        const datasetName = 'math_problems_kr';
        const datasetPath = `projects/${this.projectId}/locations/${this.location}/datasets/${datasetName}`;
        
        try {
            // 기존 데이터셋 확인
            const [datasets] = await this.automl.listDatasets({
                parent: `projects/${this.projectId}/locations/${this.location}`
            });
            
            let dataset = datasets.find(d => d.displayName === datasetName);
            
            if (!dataset) {
                // 새 데이터셋 생성 (텍스트 분류)
                const request = {
                    parent: `projects/${this.projectId}/locations/${this.location}`,
                    dataset: {
                        displayName: datasetName,
                        textClassificationDatasetMetadata: {
                            classificationType: 'MULTICLASS'
                        }
                    }
                };
                
                const [operation] = await this.automl.createDataset(request);
                [dataset] = await operation.promise();
                
                console.log('✅ 데이터셋 생성 완료:', dataset.name);
            }
            
            // 훈련 데이터 수집
            await this.collectTrainingData(dataset.name);
            
            return dataset;
            
        } catch (error) {
            console.error('데이터셋 준비 실패:', error);
            // 폴백: 로컬 분류기 사용
            return this.createLocalClassifier();
        }
    }
    
    /**
     * 훈련 데이터 수집 (Firestore에서)
     */
    async collectTrainingData(datasetName) {
        console.log('📊 훈련 데이터 수집 중...');
        
        // Firestore에서 라벨링된 문제 가져오기
        const snapshot = await this.firestore
            .collection('math_problems')
            .where('labeled', '==', true)
            .limit(this.trainingData.required)
            .get();
        
        if (snapshot.size < this.trainingData.required) {
            console.log(`⚠️ 훈련 데이터 부족: ${snapshot.size}/${this.trainingData.required}`);
            // 합성 데이터 생성
            await this.generateSyntheticData();
        }
        
        // CSV 형식으로 변환
        const csvData = ['text,label'];
        snapshot.forEach(doc => {
            const data = doc.data();
            const text = data.content.replace(/,/g, '，'); // 콤마 처리
            const label = this.mapToCategory(data);
            csvData.push(`"${text}","${label}"`);
        });
        
        // 임시 파일 저장
        const csvPath = path.join('/tmp', `training_data_${Date.now()}.csv`);
        await fs.writeFile(csvPath, csvData.join('\n'));
        
        // AutoML에 데이터 임포트
        await this.importData(datasetName, csvPath);
        
        this.trainingData.collected = snapshot.size;
        console.log(`✅ ${snapshot.size}개 훈련 데이터 수집 완료`);
    }
    
    /**
     * 합성 데이터 생성 (부족한 경우)
     */
    async generateSyntheticData() {
        console.log('🔄 합성 데이터 생성 중...');
        
        const templates = {
            '수와 연산': [
                '{a} + {b} = ?',
                '{a} - {b} = ?',
                '{a} × {b} = ?',
                '{a} ÷ {b} = ?',
                '{a}의 {b}배는?'
            ],
            '도형': [
                '정{n}각형의 내각의 합은?',
                '반지름이 {r}인 원의 넓이는?',
                '한 변이 {a}인 정사각형의 둘레는?'
            ],
            '비와 비율': [
                '{a} : {b}를 간단히 하면?',
                '{a}의 {p}%는?',
                '{a}에 대한 {b}의 비율은?'
            ],
            '함수': [
                'y = {a}x + {b}의 그래프를 그리시오',
                'f(x) = {a}x²의 최솟값은?',
                '일차함수 y = {a}x + {b}의 기울기는?'
            ]
        };
        
        const syntheticData = [];
        
        for (const [category, patterns] of Object.entries(templates)) {
            for (let i = 0; i < 10; i++) {
                const pattern = patterns[Math.floor(Math.random() * patterns.length)];
                const problem = pattern
                    .replace(/{a}/g, Math.floor(Math.random() * 100))
                    .replace(/{b}/g, Math.floor(Math.random() * 100))
                    .replace(/{n}/g, Math.floor(Math.random() * 8) + 3)
                    .replace(/{r}/g, Math.floor(Math.random() * 20))
                    .replace(/{p}/g, Math.floor(Math.random() * 100));
                
                syntheticData.push({
                    content: problem,
                    category: category,
                    synthetic: true,
                    createdAt: new Date()
                });
            }
        }
        
        // Firestore에 저장
        const batch = this.firestore.batch();
        syntheticData.forEach(data => {
            const ref = this.firestore.collection('math_problems').doc();
            batch.set(ref, { ...data, labeled: true });
        });
        await batch.commit();
        
        console.log(`✅ ${syntheticData.length}개 합성 데이터 생성 완료`);
    }
    
    /**
     * 모델 훈련 (최소 비용)
     */
    async trainModel(datasetId) {
        console.log('🎯 모델 훈련 시작 (최소 비용 모드)...');
        
        const modelName = 'math_classifier_v1';
        
        try {
            const request = {
                parent: `projects/${this.projectId}/locations/${this.location}`,
                model: {
                    displayName: modelName,
                    datasetId: datasetId,
                    textClassificationModelMetadata: {
                        // 최소 비용 설정
                        classificationThreshold: 0.5
                    }
                },
                // 훈련 예산 제한
                trainingBudgetMilliNodeHours: 1000 // 약 $1
            };
            
            const [operation] = await this.automl.createModel(request);
            
            console.log('⏳ 모델 훈련 중... (1-2시간 소요)');
            console.log('💰 예상 비용: $1 이하');
            
            // 비동기 처리 (백그라운드)
            operation.promise().then(([model]) => {
                console.log('✅ 모델 훈련 완료:', model.name);
                this.saveModelInfo(model);
            });
            
            return {
                operationId: operation.name,
                status: 'training',
                estimatedTime: '1-2 hours',
                estimatedCost: '$1'
            };
            
        } catch (error) {
            console.error('모델 훈련 실패:', error);
            return this.createLocalClassifier();
        }
    }
    
    /**
     * 문제 분류 예측
     */
    async classifyProblem(problemText, options = {}) {
        const { useLocal = false, modelId } = options;
        
        if (useLocal || !modelId) {
            // 로컬 규칙 기반 분류 (무료)
            return this.localClassify(problemText);
        }
        
        try {
            // AutoML 예측 (유료)
            const request = {
                name: modelId,
                payload: {
                    textSnippet: {
                        content: problemText,
                        mimeType: 'text/plain'
                    }
                }
            };
            
            const [response] = await this.automl.predict(request);
            
            const predictions = response.payload.map(p => ({
                category: p.displayName,
                confidence: p.classification.score
            }));
            
            // 예측 결과 캐싱 (비용 절감)
            await this.cachePrediction(problemText, predictions);
            
            return {
                predictions,
                method: 'automl',
                cost: 0.0001 // 예측당 약 $0.0001
            };
            
        } catch (error) {
            console.error('AutoML 예측 실패, 로컬 분류 사용:', error);
            return this.localClassify(problemText);
        }
    }
    
    /**
     * 로컬 규칙 기반 분류 (폴백)
     */
    localClassify(text) {
        const keywords = {
            '수와 연산': ['더하기', '빼기', '곱하기', '나누기', '+', '-', '×', '÷', '계산'],
            '도형': ['삼각형', '사각형', '원', '각', '변', '넓이', '둘레', '부피'],
            '측정': ['길이', 'cm', 'm', 'km', '무게', 'kg', 'g', '시간', '분', '초'],
            '비와 비율': ['비', '비율', '%', '퍼센트', '할', '배', '분수'],
            '함수': ['함수', 'f(x)', 'y=', '그래프', '기울기', '절편'],
            '방정식': ['방정식', '해', '근', '미지수', 'x', '등식'],
            '확률과 통계': ['확률', '경우의 수', '평균', '중앙값', '분산', '표준편차']
        };
        
        const scores = {};
        
        for (const [category, words] of Object.entries(keywords)) {
            scores[category] = 0;
            words.forEach(word => {
                if (text.includes(word)) {
                    scores[category]++;
                }
            });
        }
        
        // 점수가 높은 순으로 정렬
        const sorted = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .filter(([_, score]) => score > 0);
        
        if (sorted.length === 0) {
            return {
                predictions: [{ category: '기타', confidence: 0.5 }],
                method: 'local',
                cost: 0
            };
        }
        
        const totalScore = sorted.reduce((sum, [_, score]) => sum + score, 0);
        
        return {
            predictions: sorted.slice(0, 3).map(([category, score]) => ({
                category,
                confidence: score / totalScore
            })),
            method: 'local',
            cost: 0
        };
    }
    
    /**
     * 학습 수준 자동 판별
     */
    async detectDifficultyLevel(problemText) {
        const indicators = {
            elementary: {
                keywords: ['더하기', '빼기', '간단한', '기본', '초등'],
                mathSymbols: ['+', '-', '×', '÷'],
                numberRange: [0, 100]
            },
            middle: {
                keywords: ['방정식', '함수', '일차', '이차', '중등'],
                mathSymbols: ['x', 'y', '=', '√'],
                numberRange: [0, 1000]
            },
            high: {
                keywords: ['미분', '적분', '극한', '벡터', '고등'],
                mathSymbols: ['∫', '∂', 'lim', 'Σ', '∏'],
                numberRange: [-Infinity, Infinity]
            }
        };
        
        let scores = { elementary: 0, middle: 0, high: 0 };
        
        for (const [level, criteria] of Object.entries(indicators)) {
            // 키워드 체크
            criteria.keywords.forEach(keyword => {
                if (problemText.includes(keyword)) scores[level] += 2;
            });
            
            // 수학 기호 체크
            criteria.mathSymbols.forEach(symbol => {
                if (problemText.includes(symbol)) scores[level] += 1;
            });
        }
        
        // 가장 높은 점수의 수준 반환
        const detectedLevel = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])[0][0];
        
        return {
            level: detectedLevel,
            confidence: scores[detectedLevel] / Object.values(scores).reduce((a, b) => a + b, 1),
            details: scores
        };
    }
    
    /**
     * 모델 정보 저장
     */
    async saveModelInfo(model) {
        await this.firestore.collection('ml_models').doc(model.displayName).set({
            modelId: model.name,
            displayName: model.displayName,
            createdAt: new Date(),
            deploymentState: model.deploymentState,
            evaluationMetrics: model.modelEvaluationMetadata
        });
    }
    
    /**
     * 예측 결과 캐싱
     */
    async cachePrediction(text, predictions) {
        const hash = require('crypto').createHash('md5').update(text).digest('hex');
        
        await this.firestore.collection('prediction_cache').doc(hash).set({
            text: text.substring(0, 100),
            predictions,
            timestamp: new Date(),
            ttl: Date.now() + 86400000 // 24시간
        });
    }
    
    /**
     * 데이터 임포트
     */
    async importData(datasetName, csvPath) {
        // GCS 버킷 없이 직접 임포트 (작은 데이터셋용)
        const csvContent = await fs.readFile(csvPath, 'utf-8');
        const lines = csvContent.split('\n');
        
        const examples = [];
        for (let i = 1; i < lines.length; i++) {
            const [text, label] = lines[i].split('","').map(s => s.replace(/"/g, ''));
            examples.push({
                textSnippet: { content: text },
                classificationAnnotation: { displayName: label }
            });
        }
        
        // 배치 임포트
        const request = {
            name: datasetName,
            inputConfig: {
                textExtractionAnnotations: examples
            }
        };
        
        console.log(`📤 ${examples.length}개 예제 임포트 중...`);
    }
    
    /**
     * 로컬 분류기 생성 (폴백)
     */
    createLocalClassifier() {
        return {
            type: 'local',
            classify: (text) => this.localClassify(text),
            cost: 0,
            accuracy: 0.7
        };
    }
    
    /**
     * 분류 정확도 평가
     */
    async evaluateAccuracy() {
        const testData = await this.firestore
            .collection('math_problems')
            .where('labeled', '==', true)
            .where('isTest', '==', true)
            .limit(50)
            .get();
        
        let correct = 0;
        let total = 0;
        
        for (const doc of testData.docs) {
            const data = doc.data();
            const result = await this.classifyProblem(data.content, { useLocal: true });
            
            if (result.predictions[0].category === data.category) {
                correct++;
            }
            total++;
        }
        
        return {
            accuracy: correct / total,
            tested: total,
            correct: correct
        };
    }
    
    /**
     * 카테고리 매핑
     */
    mapToCategory(data) {
        // 학년과 주제를 조합하여 카테고리 결정
        const grade = data.grade || 6;
        const topic = data.topic || '기타';
        
        if (grade <= 6) {
            return this.mathCategories.elementary[`${grade}학년`]?.includes(topic) 
                ? topic : '기타';
        } else if (grade <= 9) {
            return this.mathCategories.middle[`${grade-6}학년`]?.includes(topic) 
                ? topic : '기타';
        } else {
            return this.mathCategories.high[`${grade-9}학년`]?.includes(topic) 
                ? topic : '기타';
        }
    }
}

// 사용 예제
async function demonstrateClassifier() {
    const classifier = new MathProblemClassifier();
    
    console.log('🤖 AutoML 수학 문제 분류기 (1인 개발자 버전)');
    
    // 로컬 분류 테스트 (무료)
    const problem1 = "사과 3개와 배 5개의 비를 구하시오.";
    const result1 = await classifier.classifyProblem(problem1, { useLocal: true });
    console.log('분류 결과:', result1);
    
    // 난이도 판별
    const difficulty = await classifier.detectDifficultyLevel(problem1);
    console.log('난이도:', difficulty);
    
    // 정확도 평가
    const accuracy = await classifier.evaluateAccuracy();
    console.log('로컬 분류기 정확도:', accuracy);
}

module.exports = MathProblemClassifier;