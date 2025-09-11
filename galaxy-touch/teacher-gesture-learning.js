/**
 * 교사 제스처 실시간 학습 및 자동화 시스템
 * 1인 교사의 모든 제스처를 학습하여 패턴화
 */

class TeacherGestureLearning {
    constructor() {
        this.gestureDatabase = {
            teacherId: 'teacher_001',
            recordedGestures: [],
            patterns: {},
            automations: [],
            realTimeBuffer: []
        };
        
        // 실시간 버퍼 (30fps)
        this.bufferSize = 30;
        this.frameRate = 30;
        
        // 패턴 인식 임계값
        this.thresholds = {
            similarity: 0.85,  // 85% 유사도
            frequency: 5,      // 5회 이상 반복
            speed: 0.5,        // 속도 편차 50%
            size: 0.3          // 크기 편차 30%
        };
    }

    // 실시간 제스처 기록
    recordGesture(landmarks, timestamp) {
        const gesture = {
            timestamp: timestamp,
            landmarks: this.normalizeLandmarks(landmarks),
            speed: this.calculateSpeed(landmarks),
            size: this.calculateSize(landmarks),
            angles: this.calculateAngles(landmarks)
        };
        
        // 실시간 버퍼에 추가
        this.realTimeBuffer.push(gesture);
        if (this.realTimeBuffer.length > this.bufferSize) {
            this.realTimeBuffer.shift();
        }
        
        // 패턴 감지
        const pattern = this.detectPattern();
        if (pattern) {
            this.addToPatternLibrary(pattern);
        }
        
        return gesture;
    }

    // 랜드마크 정규화 (크기/위치 무관하게)
    normalizeLandmarks(landmarks) {
        // 손목을 원점으로
        const wrist = landmarks[0];
        const normalized = landmarks.map(point => ({
            x: point.x - wrist.x,
            y: point.y - wrist.y,
            z: point.z - wrist.z || 0
        }));
        
        // 스케일 정규화 (중지 길이 기준)
        const middleLength = Math.sqrt(
            Math.pow(normalized[12].x - normalized[0].x, 2) +
            Math.pow(normalized[12].y - normalized[0].y, 2)
        );
        
        return normalized.map(point => ({
            x: point.x / middleLength,
            y: point.y / middleLength,
            z: point.z / middleLength
        }));
    }

    // 패턴 감지
    detectPattern() {
        if (this.realTimeBuffer.length < 10) return null;
        
        const currentSequence = this.realTimeBuffer.slice(-10);
        
        // 기존 패턴과 비교
        for (const [name, pattern] of Object.entries(this.patterns)) {
            const similarity = this.calculateSimilarity(currentSequence, pattern.sequence);
            
            if (similarity > this.thresholds.similarity) {
                pattern.frequency++;
                pattern.lastSeen = Date.now();
                
                // 자주 사용하는 패턴 -> 자동화 제안
                if (pattern.frequency >= this.thresholds.frequency) {
                    this.suggestAutomation(name, pattern);
                }
                
                return { name, similarity, pattern };
            }
        }
        
        // 새로운 패턴 발견
        return this.createNewPattern(currentSequence);
    }

    // 패턴 유사도 계산
    calculateSimilarity(seq1, seq2) {
        if (seq1.length !== seq2.length) return 0;
        
        let totalSimilarity = 0;
        
        for (let i = 0; i < seq1.length; i++) {
            const landmarkSim = this.compareLandmarks(seq1[i].landmarks, seq2[i].landmarks);
            const speedSim = 1 - Math.abs(seq1[i].speed - seq2[i].speed) / Math.max(seq1[i].speed, seq2[i].speed);
            const sizeSim = 1 - Math.abs(seq1[i].size - seq2[i].size) / Math.max(seq1[i].size, seq2[i].size);
            
            totalSimilarity += (landmarkSim * 0.6 + speedSim * 0.2 + sizeSim * 0.2);
        }
        
        return totalSimilarity / seq1.length;
    }

    // 랜드마크 비교
    compareLandmarks(landmarks1, landmarks2) {
        let totalDistance = 0;
        
        for (let i = 0; i < landmarks1.length; i++) {
            const distance = Math.sqrt(
                Math.pow(landmarks1[i].x - landmarks2[i].x, 2) +
                Math.pow(landmarks1[i].y - landmarks2[i].y, 2)
            );
            totalDistance += distance;
        }
        
        // 거리를 유사도로 변환 (0-1)
        return Math.max(0, 1 - totalDistance / landmarks1.length);
    }

    // 새 패턴 생성
    createNewPattern(sequence) {
        const patternId = `pattern_${Date.now()}`;
        
        this.patterns[patternId] = {
            sequence: sequence,
            frequency: 1,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            avgSpeed: this.calculateAvgSpeed(sequence),
            avgSize: this.calculateAvgSize(sequence),
            category: this.categorizeGesture(sequence)
        };
        
        return {
            name: patternId,
            similarity: 1.0,
            pattern: this.patterns[patternId]
        };
    }

    // 제스처 분류
    categorizeGesture(sequence) {
        // 손가락 상태 분석
        const fingerStates = this.analyzeFingerStates(sequence);
        
        if (fingerStates.threeUp) return 'triangle';
        if (fingerStates.okSign) return 'circle';
        if (fingerStates.pinch) return 'resize';
        if (fingerStates.spread) return 'rotate';
        if (fingerStates.grab) return 'move';
        
        return 'unknown';
    }

    // 손가락 상태 분석
    analyzeFingerStates(sequence) {
        const states = {
            threeUp: false,
            okSign: false,
            pinch: false,
            spread: false,
            grab: false
        };
        
        // 시퀀스의 중간 프레임 분석
        const midFrame = sequence[Math.floor(sequence.length / 2)];
        const landmarks = midFrame.landmarks;
        
        // 세 손가락 위로 (삼각형)
        if (this.isFingerUp(landmarks, 'index') && 
            this.isFingerUp(landmarks, 'middle') && 
            this.isFingerUp(landmarks, 'ring')) {
            states.threeUp = true;
        }
        
        // OK 사인 (원)
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) + 
            Math.pow(thumbTip.y - indexTip.y, 2)
        );
        
        if (distance < 0.1) {
            states.okSign = true;
        }
        
        return states;
    }

    // 손가락 펴짐 확인
    isFingerUp(landmarks, finger) {
        const fingerIndices = {
            thumb: [1, 4],
            index: [5, 8],
            middle: [9, 12],
            ring: [13, 16],
            pinky: [17, 20]
        };
        
        const [base, tip] = fingerIndices[finger];
        return landmarks[tip].y < landmarks[base].y;
    }

    // 자동화 제안
    suggestAutomation(patternName, pattern) {
        const automation = {
            id: `auto_${Date.now()}`,
            pattern: patternName,
            frequency: pattern.frequency,
            action: this.determineAction(pattern),
            shortcut: this.generateShortcut(pattern),
            created: Date.now()
        };
        
        this.automations.push(automation);
        
        // UI에 제안 표시
        this.showAutomationSuggestion(automation);
        
        return automation;
    }

    // 액션 결정
    determineAction(pattern) {
        const category = pattern.category;
        
        const actions = {
            'triangle': 'CREATE_TRIANGLE',
            'circle': 'CREATE_CIRCLE',
            'resize': 'RESIZE_SHAPE',
            'rotate': 'ROTATE_SHAPE',
            'move': 'MOVE_SHAPE',
            'unknown': 'CUSTOM_ACTION'
        };
        
        return actions[category] || 'CUSTOM_ACTION';
    }

    // 단축키 생성
    generateShortcut(pattern) {
        const baseShortcuts = {
            'triangle': 'Ctrl+Shift+T',
            'circle': 'Ctrl+Shift+C',
            'resize': 'Ctrl+Shift+R',
            'rotate': 'Ctrl+Shift+O',
            'move': 'Ctrl+Shift+M'
        };
        
        return baseShortcuts[pattern.category] || `Ctrl+Shift+${pattern.frequency}`;
    }

    // 자동화 제안 UI
    showAutomationSuggestion(automation) {
        console.log(`
 자동화 제안!
━━━━━━━━━━━━━━━━━━━━━
패턴: ${automation.pattern}
빈도: ${automation.frequency}회 사용
제안: "${automation.action}"을(를) 단축키 ${automation.shortcut}로 등록
━━━━━━━━━━━━━━━━━━━━━
수락하시겠습니까? (Y/N)
        `);
    }

    // 속도 계산
    calculateSpeed(landmarks) {
        if (!this.previousLandmarks) {
            this.previousLandmarks = landmarks;
            return 0;
        }
        
        let totalMovement = 0;
        for (let i = 0; i < landmarks.length; i++) {
            const distance = Math.sqrt(
                Math.pow(landmarks[i].x - this.previousLandmarks[i].x, 2) +
                Math.pow(landmarks[i].y - this.previousLandmarks[i].y, 2)
            );
            totalMovement += distance;
        }
        
        this.previousLandmarks = landmarks;
        return totalMovement / landmarks.length;
    }

    // 크기 계산
    calculateSize(landmarks) {
        // 손목에서 중지 끝까지 거리
        return Math.sqrt(
            Math.pow(landmarks[12].x - landmarks[0].x, 2) +
            Math.pow(landmarks[12].y - landmarks[0].y, 2)
        );
    }

    // 각도 계산
    calculateAngles(landmarks) {
        const angles = {};
        
        // 주요 관절 각도 계산
        angles.thumbIndex = this.getAngleBetweenPoints(
            landmarks[4], landmarks[0], landmarks[8]
        );
        angles.indexMiddle = this.getAngleBetweenPoints(
            landmarks[8], landmarks[5], landmarks[12]
        );
        
        return angles;
    }

    // 세 점 사이 각도
    getAngleBetweenPoints(p1, center, p2) {
        const v1 = { x: p1.x - center.x, y: p1.y - center.y };
        const v2 = { x: p2.x - center.x, y: p2.y - center.y };
        
        const dot = v1.x * v2.x + v1.y * v2.y;
        const cross = v1.x * v2.y - v1.y * v2.x;
        
        return Math.atan2(cross, dot) * 180 / Math.PI;
    }

    // 평균 속도
    calculateAvgSpeed(sequence) {
        const speeds = sequence.map(frame => frame.speed);
        return speeds.reduce((a, b) => a + b, 0) / speeds.length;
    }

    // 평균 크기
    calculateAvgSize(sequence) {
        const sizes = sequence.map(frame => frame.size);
        return sizes.reduce((a, b) => a + b, 0) / sizes.length;
    }

    // 학습 데이터 저장
    saveLearnedPatterns() {
        const data = {
            teacherId: this.gestureDatabase.teacherId,
            patterns: this.patterns,
            automations: this.automations,
            statistics: this.getStatistics(),
            savedAt: Date.now()
        };
        
        // 로컬 스토리지
        localStorage.setItem('teacherGestures', JSON.stringify(data));
        
        // 서버 동기화
        this.syncToServer(data);
        
        return data;
    }

    // 통계
    getStatistics() {
        return {
            totalPatterns: Object.keys(this.patterns).length,
            totalAutomations: this.automations.length,
            mostUsedPattern: this.getMostUsedPattern(),
            avgGestureSpeed: this.getAvgGestureSpeed(),
            adaptationLevel: this.calculateAdaptationLevel()
        };
    }

    // 가장 많이 사용한 패턴
    getMostUsedPattern() {
        let maxFreq = 0;
        let mostUsed = null;
        
        for (const [name, pattern] of Object.entries(this.patterns)) {
            if (pattern.frequency > maxFreq) {
                maxFreq = pattern.frequency;
                mostUsed = name;
            }
        }
        
        return { name: mostUsed, frequency: maxFreq };
    }

    // 평균 제스처 속도
    getAvgGestureSpeed() {
        const speeds = Object.values(this.patterns).map(p => p.avgSpeed);
        if (speeds.length === 0) return 0;
        
        return speeds.reduce((a, b) => a + b, 0) / speeds.length;
    }

    // 적응도 계산
    calculateAdaptationLevel() {
        const patternCount = Object.keys(this.patterns).length;
        const automationCount = this.automations.length;
        const totalUsage = Object.values(this.patterns)
            .reduce((sum, p) => sum + p.frequency, 0);
        
        // 0-100 scale
        const level = Math.min(100, 
            (patternCount * 2) + 
            (automationCount * 5) + 
            (totalUsage * 0.5)
        );
        
        return level;
    }

    // 서버 동기화
    async syncToServer(data) {
        try {
            const response = await fetch('/api/teacher-gestures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                console.log('✅ Gestures synced to server');
            }
        } catch (error) {
            console.error('❌ Sync failed:', error);
        }
    }
}

export default TeacherGestureLearning;