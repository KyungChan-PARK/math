/**
 * Firestore 실시간 동기화 시스템
 * 1인 개발자를 위한 효율적인 구현
 * 수학 학습 데이터 실시간 동기화
 */

const { Firestore } = require('@google-cloud/firestore');
const { EventEmitter } = require('events');

class FirestoreRealtimeSync extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Firestore 초기화
        this.db = new Firestore({
            projectId: config.projectId || 'math-project-472006',
            ...config.firestoreConfig
        });
        
        // 실시간 리스너 관리
        this.listeners = new Map();
        this.subscriptions = new Map();
        
        // 비용 최적화 설정
        this.costOptimization = {
            batchSize: 10,           // 배치 쓰기 크기
            debounceTime: 1000,      // 디바운스 시간 (ms)
            maxListeners: 10,        // 최대 리스너 수
            cacheTimeout: 300000,    // 캐시 타임아웃 (5분)
            offlineMode: false       // 오프라인 모드
        };
        
        // 로컬 캐시 (읽기 비용 절감)
        this.cache = new Map();
        
        // 수학 학습 컬렉션
        this.collections = {
            students: 'students',
            problems: 'math_problems',
            sessions: 'learning_sessions',
            progress: 'student_progress',
            realtime: 'realtime_updates'
        };
        
        // 오프라인 지원
        this.db.settings({
            ignoreUndefinedProperties: true,
            cacheSizeBytes: Firestore.CACHE_SIZE_UNLIMITED
        });
        
        console.log('🔄 Firestore 실시간 동기화 시스템 초기화');
    }
    
    /**
     * 학생 학습 세션 실시간 동기화
     */
    async syncLearningSession(studentId, sessionData) {
        const sessionId = `session_${studentId}_${Date.now()}`;
        const docRef = this.db.collection(this.collections.sessions).doc(sessionId);
        
        // 실시간 리스너 설정
        const unsubscribe = docRef.onSnapshot(
            { includeMetadataChanges: true },
            (snapshot) => {
                if (snapshot.metadata.hasPendingWrites) {
                    console.log('📝 로컬 쓰기 대기 중...');
                    return;
                }
                
                if (snapshot.exists) {
                    const data = snapshot.data();
                    this.emit('sessionUpdate', {
                        sessionId,
                        studentId,
                        data,
                        source: snapshot.metadata.fromCache ? 'cache' : 'server'
                    });
                    
                    // 캐시 업데이트
                    this.updateCache(`session_${sessionId}`, data);
                }
            },
            (error) => {
                console.error('세션 동기화 오류:', error);
                this.emit('syncError', { sessionId, error });
            }
        );
        
        // 리스너 관리
        this.listeners.set(sessionId, unsubscribe);
        
        // 초기 데이터 설정
        await docRef.set({
            ...sessionData,
            studentId,
            startTime: Firestore.FieldValue.serverTimestamp(),
            lastUpdate: Firestore.FieldValue.serverTimestamp(),
            status: 'active',
            syncEnabled: true
        });
        
        return {
            sessionId,
            unsubscribe: () => this.unsubscribeSession(sessionId)
        };
    }
    
    /**
     * 실시간 문제 풀이 추적
     */
    async trackProblemSolving(sessionId, problemId, updates) {
        const trackingRef = this.db
            .collection(this.collections.realtime)
            .doc(`${sessionId}_${problemId}`);
        
        // 실시간 업데이트 리스너
        const unsubscribe = trackingRef.onSnapshot((snapshot) => {
            if (snapshot.exists) {
                const data = snapshot.data();
                
                // 학습 분석 이벤트 발생
                this.analyzeLearningPattern(data);
                
                // UI 업데이트 이벤트
                this.emit('problemProgress', {
                    sessionId,
                    problemId,
                    ...data
                });
            }
        });
        
        this.listeners.set(`problem_${problemId}`, unsubscribe);
        
        // 디바운스된 업데이트 (비용 절감)
        this.debouncedUpdate(trackingRef, {
            ...updates,
            timestamp: Firestore.FieldValue.serverTimestamp()
        });
    }
    
    /**
     * 학생 진도 실시간 동기화
     */
    async syncStudentProgress(studentId) {
        const progressRef = this.db
            .collection(this.collections.progress)
            .where('studentId', '==', studentId)
            .orderBy('timestamp', 'desc')
            .limit(1);
        
        // 실시간 쿼리 리스너
        const unsubscribe = progressRef.onSnapshot(
            { includeMetadataChanges: false }, // 메타데이터 변경 무시 (비용 절감)
            (querySnapshot) => {
                const changes = [];
                
                querySnapshot.docChanges().forEach(change => {
                    const data = change.doc.data();
                    
                    switch (change.type) {
                        case 'added':
                            console.log('➕ 새 진도 추가:', data);
                            this.emit('progressAdded', { studentId, data });
                            break;
                        case 'modified':
                            console.log('✏️ 진도 수정:', data);
                            this.emit('progressModified', { studentId, data });
                            break;
                        case 'removed':
                            console.log('❌ 진도 삭제:', data);
                            this.emit('progressRemoved', { studentId, data });
                            break;
                    }
                    
                    changes.push({ type: change.type, data });
                });
                
                // 배치 업데이트 처리
                if (changes.length > 0) {
                    this.processBatchChanges(studentId, changes);
                }
            }
        );
        
        this.subscriptions.set(`progress_${studentId}`, unsubscribe);
        
        return unsubscribe;
    }
    
    /**
     * 협업 학습 실시간 동기화
     */
    async syncCollaborativeLearning(roomId) {
        const roomRef = this.db.collection('collaborative_rooms').doc(roomId);
        const participantsRef = roomRef.collection('participants');
        const messagesRef = roomRef.collection('messages');
        
        // 방 상태 실시간 동기화
        const roomUnsubscribe = roomRef.onSnapshot((snapshot) => {
            if (snapshot.exists) {
                this.emit('roomUpdate', {
                    roomId,
                    data: snapshot.data()
                });
            }
        });
        
        // 참가자 실시간 동기화
        const participantsUnsubscribe = participantsRef.onSnapshot((snapshot) => {
            const participants = [];
            snapshot.forEach(doc => participants.push({
                id: doc.id,
                ...doc.data()
            }));
            
            this.emit('participantsUpdate', {
                roomId,
                participants,
                count: participants.length
            });
        });
        
        // 메시지 실시간 동기화 (최근 50개만)
        const messagesUnsubscribe = messagesRef
            .orderBy('timestamp', 'desc')
            .limit(50)
            .onSnapshot((snapshot) => {
                const messages = [];
                snapshot.forEach(doc => messages.push({
                    id: doc.id,
                    ...doc.data()
                }));
                
                this.emit('messagesUpdate', {
                    roomId,
                    messages: messages.reverse()
                });
            });
        
        // 리스너 그룹 관리
        const unsubscribeAll = () => {
            roomUnsubscribe();
            participantsUnsubscribe();
            messagesUnsubscribe();
        };
        
        this.listeners.set(`room_${roomId}`, unsubscribeAll);
        
        return unsubscribeAll;
    }
    
    /**
     * 오프라인 동기화 큐
     */
    async queueOfflineUpdate(collection, docId, data) {
        if (!this.costOptimization.offlineMode) {
            // 온라인 모드: 즉시 동기화
            return this.db.collection(collection).doc(docId).set(data, { merge: true });
        }
        
        // 오프라인 모드: 로컬 큐에 저장
        const queueKey = `${collection}_${docId}`;
        const queue = this.cache.get('offlineQueue') || [];
        
        queue.push({
            collection,
            docId,
            data,
            timestamp: Date.now()
        });
        
        this.cache.set('offlineQueue', queue);
        
        console.log(`📦 오프라인 큐에 추가: ${queueKey}`);
        
        // 온라인 복귀 시 자동 동기화
        this.scheduleSync();
    }
    
    /**
     * 배치 동기화 (비용 최적화)
     */
    async batchSync(updates) {
        const batch = this.db.batch();
        let operationCount = 0;
        
        updates.forEach(update => {
            const ref = this.db.collection(update.collection).doc(update.docId);
            
            switch (update.operation) {
                case 'set':
                    batch.set(ref, update.data, { merge: true });
                    break;
                case 'update':
                    batch.update(ref, update.data);
                    break;
                case 'delete':
                    batch.delete(ref);
                    break;
            }
            
            operationCount++;
            
            // Firestore 배치 제한 (500개)
            if (operationCount >= 500) {
                batch.commit();
                batch = this.db.batch();
                operationCount = 0;
            }
        });
        
        if (operationCount > 0) {
            await batch.commit();
        }
        
        console.log(`✅ ${updates.length}개 업데이트 배치 동기화 완료`);
    }
    
    /**
     * 실시간 학습 분석
     */
    analyzeLearningPattern(data) {
        // 학습 패턴 분석
        const patterns = {
            timeSpent: data.timeSpent || 0,
            attempts: data.attempts || 0,
            hints: data.hintsUsed || 0,
            correctness: data.isCorrect || false
        };
        
        // 실시간 피드백 생성
        if (patterns.attempts > 3 && !patterns.correctness) {
            this.emit('learningAlert', {
                type: 'struggling',
                message: '학생이 어려워하고 있습니다. 힌트를 제공하세요.',
                data: patterns
            });
        }
        
        if (patterns.timeSpent < 30 && patterns.correctness) {
            this.emit('learningAlert', {
                type: 'fast',
                message: '빠른 해결! 더 어려운 문제를 제공해보세요.',
                data: patterns
            });
        }
    }
    
    /**
     * 디바운스 업데이트 (쓰기 비용 절감)
     */
    debouncedUpdate(ref, data) {
        const key = ref.path;
        
        // 기존 타이머 취소
        if (this.updateTimers && this.updateTimers[key]) {
            clearTimeout(this.updateTimers[key]);
        }
        
        // 새 타이머 설정
        this.updateTimers = this.updateTimers || {};
        this.updateTimers[key] = setTimeout(() => {
            ref.set(data, { merge: true })
                .then(() => console.log(`✅ 디바운스 업데이트 완료: ${key}`))
                .catch(error => console.error(`❌ 업데이트 실패: ${error}`));
            
            delete this.updateTimers[key];
        }, this.costOptimization.debounceTime);
    }
    
    /**
     * 캐시 업데이트
     */
    updateCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expires: Date.now() + this.costOptimization.cacheTimeout
        });
        
        // 만료된 캐시 정리
        this.cleanExpiredCache();
    }
    
    /**
     * 만료된 캐시 정리
     */
    cleanExpiredCache() {
        const now = Date.now();
        
        for (const [key, value] of this.cache.entries()) {
            if (value.expires && value.expires < now) {
                this.cache.delete(key);
            }
        }
    }
    
    /**
     * 오프라인 동기화 스케줄링
     */
    scheduleSync() {
        if (this.syncTimer) return;
        
        this.syncTimer = setTimeout(async () => {
            const queue = this.cache.get('offlineQueue') || [];
            
            if (queue.length > 0 && !this.costOptimization.offlineMode) {
                console.log(`🔄 ${queue.length}개 오프라인 업데이트 동기화 중...`);
                
                const updates = queue.map(item => ({
                    collection: item.collection,
                    docId: item.docId,
                    data: item.data,
                    operation: 'set'
                }));
                
                await this.batchSync(updates);
                
                // 큐 비우기
                this.cache.delete('offlineQueue');
            }
            
            this.syncTimer = null;
        }, 5000); // 5초 후 동기화
    }
    
    /**
     * 배치 변경사항 처리
     */
    processBatchChanges(studentId, changes) {
        // 변경사항 집계
        const summary = {
            added: changes.filter(c => c.type === 'added').length,
            modified: changes.filter(c => c.type === 'modified').length,
            removed: changes.filter(c => c.type === 'removed').length,
            total: changes.length
        };
        
        this.emit('batchUpdate', {
            studentId,
            summary,
            changes
        });
        
        // 중요 변경사항 알림
        if (summary.removed > 0) {
            console.warn(`⚠️ ${summary.removed}개 진도 데이터 삭제됨`);
        }
    }
    
    /**
     * 세션 구독 해제
     */
    unsubscribeSession(sessionId) {
        const unsubscribe = this.listeners.get(sessionId);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(sessionId);
            console.log(`🔌 세션 구독 해제: ${sessionId}`);
        }
    }
    
    /**
     * 모든 리스너 정리
     */
    cleanup() {
        console.log('🧹 모든 실시간 리스너 정리 중...');
        
        // 모든 리스너 해제
        for (const unsubscribe of this.listeners.values()) {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        }
        
        for (const unsubscribe of this.subscriptions.values()) {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        }
        
        this.listeners.clear();
        this.subscriptions.clear();
        this.cache.clear();
        
        console.log('✅ 정리 완료');
    }
    
    /**
     * 연결 상태 모니터링
     */
    monitorConnection() {
        // Firestore 연결 상태 체크
        setInterval(() => {
            this.db.collection('_health').doc('check').set({
                timestamp: Firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                if (this.costOptimization.offlineMode) {
                    console.log('🟢 온라인 복귀');
                    this.costOptimization.offlineMode = false;
                    this.scheduleSync();
                }
            })
            .catch(() => {
                if (!this.costOptimization.offlineMode) {
                    console.log('🔴 오프라인 모드 전환');
                    this.costOptimization.offlineMode = true;
                }
            });
        }, 10000); // 10초마다 체크
    }
    
    /**
     * 통계 조회
     */
    getStats() {
        return {
            activeListeners: this.listeners.size,
            activeSubscriptions: this.subscriptions.size,
            cacheSize: this.cache.size,
            offlineMode: this.costOptimization.offlineMode,
            pendingUpdates: (this.cache.get('offlineQueue') || []).length
        };
    }
}

// 사용 예제
async function demonstrateRealtimeSync() {
    const sync = new FirestoreRealtimeSync();
    
    // 연결 모니터링 시작
    sync.monitorConnection();
    
    // 학습 세션 동기화
    const session = await sync.syncLearningSession('student123', {
        subject: '수학',
        grade: 6,
        topic: '비와 비율'
    });
    
    // 실시간 이벤트 리스너
    sync.on('sessionUpdate', (data) => {
        console.log('📊 세션 업데이트:', data);
    });
    
    sync.on('learningAlert', (alert) => {
        console.log('🚨 학습 알림:', alert);
    });
    
    // 통계 확인
    console.log('📈 동기화 통계:', sync.getStats());
    
    // 정리 (프로세스 종료 시)
    process.on('SIGINT', () => {
        sync.cleanup();
        process.exit(0);
    });
}

module.exports = FirestoreRealtimeSync;