/**
 * Khan Academy Curriculum Mapper with AI
 * 학습 경로 자동 생성 및 진도 추적
 */

import fs from 'fs/promises';
import { EventEmitter } from 'events';
import AICollaborationOrchestrator from './ai-collaboration-orchestrator.js';

class KhanCurriculumMapper extends EventEmitter {
    constructor() {
        super();
        
        this.curriculum = null;
        this.aiOrchestrator = new AICollaborationOrchestrator();
        
        // 학습 경로 그래프
        this.learningGraph = new Map();
        
        // 선수 학습 매핑
        this.prerequisites = new Map();
        
        // 학생별 진도
        this.studentProgress = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎓 Khan Academy Curriculum Mapper 초기화...');
        
        // 커리큘럼 데이터 로드
        await this.loadCurriculum();
        
        // 학습 경로 그래프 구축
        this.buildLearningGraph();
        
        // 선수 학습 관계 분석
        await this.analyzePrerequisites();
        
        console.log('✅ Curriculum Mapper 준비 완료');
    }
    
    async loadCurriculum() {
        try {
            const data = await fs.readFile('khan-academy-curriculum.json', 'utf-8');
            this.curriculum = JSON.parse(data);
            console.log(`📚 ${Object.keys(this.curriculum.grades).length}개 학년 커리큘럼 로드됨`);
        } catch (error) {
            console.error('커리큘럼 로드 실패:', error);
        }
    }
    
    buildLearningGraph() {
        if (!this.curriculum) return;
        
        let nodeCount = 0;
        
        Object.entries(this.curriculum.grades).forEach(([gradeKey, grade]) => {
            const gradeNode = {
                id: gradeKey,
                type: 'grade',
                name: grade.name,
                units: [],
                next: this.getNextGrade(gradeKey)
            };
            
            this.learningGraph.set(gradeKey, gradeNode);
            
            grade.units.forEach((unit, unitIndex) => {
                const unitId = `${gradeKey}_unit_${unitIndex}`;
                const unitNode = {
                    id: unitId,
                    type: 'unit',
                    name: unit.name,
                    grade: gradeKey,
                    subunits: [],
                    prerequisites: []
                };
                
                gradeNode.units.push(unitId);
                this.learningGraph.set(unitId, unitNode);
                
                if (unit.subunits) {
                    unit.subunits.forEach((subunit, subIndex) => {
                        const subunitId = `${unitId}_sub_${subIndex}`;
                        const subunitNode = {
                            id: subunitId,
                            type: 'subunit',
                            name: subunit,
                            unit: unitId,
                            grade: gradeKey,
                            skills: [],
                            prerequisites: []
                        };
                        
                        unitNode.subunits.push(subunitId);
                        this.learningGraph.set(subunitId, subunitNode);
                        nodeCount++;
                    });
                }
            });
        });
        
        console.log(`🌐 학습 그래프 구축: ${nodeCount}개 노드`);
    }
    
    getNextGrade(currentGrade) {
        const gradeOrder = [
            'grade5', 'grade6', 'grade7', 'grade8',
            'algebra1', 'geometry', 'algebra2', 'precalculus',
            'ap_calculus_ab', 'ap_calculus_bc', 'ap_statistics'
        ];
        
        const currentIndex = gradeOrder.indexOf(currentGrade);
        return currentIndex < gradeOrder.length - 1 ? gradeOrder[currentIndex + 1] : null;
    }
    
    async analyzePrerequisites() {
        // AI를 통한 선수 학습 관계 분석
        const mathTopics = [
            { topic: 'fractions', prereq: ['counting', 'addition'] },
            { topic: 'algebra', prereq: ['arithmetic', 'variables'] },
            { topic: 'geometry', prereq: ['algebra', 'measurement'] },
            { topic: 'trigonometry', prereq: ['geometry', 'algebra'] },
            { topic: 'calculus', prereq: ['algebra', 'trigonometry', 'functions'] },
            { topic: 'statistics', prereq: ['algebra', 'probability'] }
        ];
        
        for (const topic of mathTopics) {
            this.prerequisites.set(topic.topic, topic.prereq);
        }
        
        console.log(`🔗 ${this.prerequisites.size}개 선수 학습 관계 분석됨`);
    }
    
    /**
     * 학생 맞춤형 학습 경로 생성
     */
    async generateLearningPath(studentId, currentLevel, targetLevel) {
        const student = this.getOrCreateStudent(studentId);
        
        // AI 분석을 통한 최적 경로 생성
        const analysis = await this.aiOrchestrator.analyze(
            JSON.stringify({
                student: student,
                current: currentLevel,
                target: targetLevel,
                curriculum: this.getRelevantCurriculum(currentLevel, targetLevel)
            }),
            { task: 'learning_path_generation' }
        );
        
        const path = this.buildOptimalPath(currentLevel, targetLevel, analysis);
        
        // 학생 프로필에 경로 저장
        student.learningPath = path;
        student.currentNode = path[0];
        
        this.emit('pathGenerated', { studentId, path });
        
        return path;
    }
    
    buildOptimalPath(start, end, aiAnalysis) {
        const path = [];
        let current = this.learningGraph.get(start);
        const target = this.learningGraph.get(end);
        
        if (!current || !target) return [];
        
        // BFS로 최단 경로 찾기
        const queue = [{ node: current, path: [current.id] }];
        const visited = new Set();
        
        while (queue.length > 0) {
            const { node, path: currentPath } = queue.shift();
            
            if (node.id === target.id) {
                return this.enrichPathWithDetails(currentPath);
            }
            
            if (visited.has(node.id)) continue;
            visited.add(node.id);
            
            // 다음 가능한 노드들
            const nextNodes = this.getNextNodes(node);
            
            for (const next of nextNodes) {
                if (!visited.has(next.id)) {
                    queue.push({
                        node: next,
                        path: [...currentPath, next.id]
                    });
                }
            }
        }
        
        return path;
    }
    
    enrichPathWithDetails(pathIds) {
        return pathIds.map(id => {
            const node = this.learningGraph.get(id);
            return {
                id: node.id,
                type: node.type,
                name: node.name,
                estimatedTime: this.estimateTime(node),
                difficulty: this.assessDifficulty(node),
                prerequisites: this.prerequisites.get(node.id) || []
            };
        });
    }
    
    getNextNodes(node) {
        const nextNodes = [];
        
        if (node.type === 'grade' && node.units) {
            node.units.forEach(unitId => {
                nextNodes.push(this.learningGraph.get(unitId));
            });
        } else if (node.type === 'unit' && node.subunits) {
            node.subunits.forEach(subunitId => {
                nextNodes.push(this.learningGraph.get(subunitId));
            });
        }
        
        // 다음 학년으로
        if (node.type === 'grade' && node.next) {
            nextNodes.push(this.learningGraph.get(node.next));
        }
        
        return nextNodes.filter(n => n !== undefined);
    }
    
    estimateTime(node) {
        // 노드 타입별 예상 학습 시간 (시간)
        const times = {
            grade: 200,
            unit: 20,
            subunit: 2
        };
        return times[node.type] || 1;
    }
    
    assessDifficulty(node) {
        // 난이도 평가 (1-10)
        const gradeLevel = {
            grade5: 1, grade6: 2, grade7: 3, grade8: 4,
            algebra1: 5, geometry: 6, algebra2: 7,
            precalculus: 8, ap_calculus_ab: 9,
            ap_calculus_bc: 10, ap_statistics: 9
        };
        
        const grade = node.grade || node.id;
        return gradeLevel[grade] || 5;
    }
    
    /**
     * 학생 진도 추적
     */
    trackProgress(studentId, nodeId, score, timeSpent) {
        const student = this.getOrCreateStudent(studentId);
        
        const progress = {
            nodeId,
            score,
            timeSpent,
            timestamp: new Date(),
            mastery: score >= 80 ? 'mastered' : score >= 60 ? 'proficient' : 'learning'
        };
        
        student.progress.push(progress);
        
        // 다음 추천 노드 결정
        if (progress.mastery === 'mastered') {
            this.moveToNextNode(student);
        } else {
            this.recommendRemediation(student, nodeId);
        }
        
        this.emit('progressUpdated', { studentId, progress });
        
        return progress;
    }
    
    moveToNextNode(student) {
        const currentIndex = student.learningPath.findIndex(
            node => node.id === student.currentNode
        );
        
        if (currentIndex < student.learningPath.length - 1) {
            student.currentNode = student.learningPath[currentIndex + 1].id;
            console.log(`✅ ${student.id} 다음 노드로 이동: ${student.currentNode}`);
        } else {
            console.log(`🎉 ${student.id} 학습 경로 완료!`);
            student.pathCompleted = true;
        }
    }
    
    async recommendRemediation(student, nodeId) {
        // AI 기반 보충 학습 추천
        const node = this.learningGraph.get(nodeId);
        const analysis = await this.aiOrchestrator.analyze(
            JSON.stringify({
                student: student,
                failedNode: node,
                progress: student.progress
            }),
            { task: 'remediation_recommendation' }
        );
        
        student.remediation = analysis.recommendations || [];
        
        console.log(`📚 ${student.id}에게 보충 학습 추천: ${student.remediation.length}개`);
    }
    
    getOrCreateStudent(studentId) {
        if (!this.studentProgress.has(studentId)) {
            this.studentProgress.set(studentId, {
                id: studentId,
                progress: [],
                learningPath: [],
                currentNode: null,
                pathCompleted: false,
                remediation: [],
                createdAt: new Date()
            });
        }
        return this.studentProgress.get(studentId);
    }
    
    getRelevantCurriculum(start, end) {
        // 관련 커리큘럼 부분만 추출
        const relevant = {};
        const startGrade = start.split('_')[0];
        const endGrade = end.split('_')[0];
        
        Object.entries(this.curriculum.grades).forEach(([key, value]) => {
            if (this.isGradeBetween(key, startGrade, endGrade)) {
                relevant[key] = value;
            }
        });
        
        return relevant;
    }
    
    isGradeBetween(grade, start, end) {
        const order = [
            'grade5', 'grade6', 'grade7', 'grade8',
            'algebra1', 'geometry', 'algebra2', 'precalculus',
            'ap_calculus_ab', 'ap_calculus_bc', 'ap_statistics'
        ];
        
        const gradeIdx = order.indexOf(grade);
        const startIdx = order.indexOf(start);
        const endIdx = order.indexOf(end);
        
        return gradeIdx >= startIdx && gradeIdx <= endIdx;
    }
    
    /**
     * 학습 분석 리포트
     */
    generateAnalytics(studentId) {
        const student = this.studentProgress.get(studentId);
        if (!student) return null;
        
        const analytics = {
            studentId,
            totalProgress: student.progress.length,
            completedNodes: student.progress.filter(p => p.mastery === 'mastered').length,
            averageScore: this.calculateAverage(student.progress, 'score'),
            totalTimeSpent: student.progress.reduce((sum, p) => sum + p.timeSpent, 0),
            currentLevel: this.assessCurrentLevel(student),
            strengths: this.identifyStrengths(student),
            weaknesses: this.identifyWeaknesses(student),
            recommendations: student.remediation
        };
        
        return analytics;
    }
    
    calculateAverage(array, property) {
        if (array.length === 0) return 0;
        const sum = array.reduce((total, item) => total + item[property], 0);
        return sum / array.length;
    }
    
    assessCurrentLevel(student) {
        if (!student.currentNode) return 'Not started';
        
        const node = this.learningGraph.get(student.currentNode);
        return node ? node.name : 'Unknown';
    }
    
    identifyStrengths(student) {
        return student.progress
            .filter(p => p.score >= 90)
            .map(p => this.learningGraph.get(p.nodeId)?.name)
            .filter(Boolean)
            .slice(-3);
    }
    
    identifyWeaknesses(student) {
        return student.progress
            .filter(p => p.score < 60)
            .map(p => this.learningGraph.get(p.nodeId)?.name)
            .filter(Boolean)
            .slice(-3);
    }
    
    /**
     * 적응형 학습 속도 조절
     */
    async adjustLearningPace(studentId) {
        const student = this.getOrCreateStudent(studentId);
        const recentProgress = student.progress.slice(-10);
        
        if (recentProgress.length < 5) return 'normal';
        
        const avgScore = this.calculateAverage(recentProgress, 'score');
        const avgTime = this.calculateAverage(recentProgress, 'timeSpent');
        
        let pace = 'normal';
        
        if (avgScore >= 85 && avgTime < 30) {
            pace = 'accelerated';
            console.log(`⚡ ${studentId} 학습 속도 가속`);
        } else if (avgScore < 60 || avgTime > 60) {
            pace = 'slower';
            console.log(`🐢 ${studentId} 학습 속도 감속`);
        }
        
        student.learningPace = pace;
        return pace;
    }
}

export default KhanCurriculumMapper;

// 실행 예시
if (import.meta.url === `file://${process.argv[1]}`) {
    const mapper = new KhanCurriculumMapper();
    
    // 학습 경로 생성 테스트
    setTimeout(async () => {
        console.log('\n📊 Khan Academy Curriculum Mapper 테스트\n');
        
        // 학생 1: 5학년에서 대수 1까지
        const path1 = await mapper.generateLearningPath(
            'student_001',
            'grade5',
            'algebra1'
        );
        
        console.log('\n학생 1 학습 경로:');
        path1.slice(0, 5).forEach(node => {
            console.log(`  - ${node.name} (예상 시간: ${node.estimatedTime}시간)`);
        });
        
        // 진도 추적 시뮬레이션
        mapper.trackProgress('student_001', 'grade5_unit_0', 85, 45);
        mapper.trackProgress('student_001', 'grade5_unit_1', 72, 55);
        
        // 분석 리포트
        const analytics = mapper.generateAnalytics('student_001');
        console.log('\n학습 분석:');
        console.log(`  평균 점수: ${analytics.averageScore.toFixed(1)}`);
        console.log(`  총 학습 시간: ${analytics.totalTimeSpent}분`);
        console.log(`  현재 레벨: ${analytics.currentLevel}`);
    }, 2000);
}

export default KhanCurriculumMapper;