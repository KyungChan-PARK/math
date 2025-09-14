#!/usr/bin/env node
/**
 * Claude-Qwen-Gemini 협업 파일 정리 시스템
 * 각 AI의 강점을 활용한 최적화 계획
 */

const fs = require('fs');
const path = require('path');

class CollaborativeCleanup {
    constructor() {
        this.report = JSON.parse(fs.readFileSync('./cleanup-report-2025-09-12T08-30-09-310Z.json', 'utf8'));
        this.cleanupPlan = {
            phase1_immediate: [],  // 즉시 실행
            phase2_consolidation: [],  // 통합 작업
            phase3_refactoring: [],  // 리팩토링
            phase4_optimization: []  // 최적화
        };
    }

    async generateDetailedPlan() {
        console.log('🤖 Claude-Qwen-Gemini 협업 분석 시작\n');
        console.log('=' .repeat(60) + '\n');

        // Phase 1: 즉시 삭제/정리
        this.phase1Analysis();
        
        // Phase 2: 파일 통합
        this.phase2Consolidation();
        
        // Phase 3: 리팩토링
        this.phase3Refactoring();
        
        // Phase 4: 최적화
        this.phase4Optimization();
        
        this.printPlan();
        this.generateCleanupScript();
    }

    phase1Analysis() {
        console.log('📌 Phase 1: 즉시 정리 대상\n');
        
        // 삭제 대상
        this.cleanupPlan.phase1_immediate.push({
            action: 'DELETE',
            files: [
                './cloud-api/main_backup.py',
                './cloud-api/backup_20250911_141538/main.py',
                './backup-2025-09-11/phase1-neo4j-setup.py'
            ],
            reason: '백업 파일 - Git 버전 관리로 대체'
        });

        // venv 폴더 정리
        this.cleanupPlan.phase1_immediate.push({
            action: 'CLEANUP',
            target: 'venv folders',
            command: 'rm -rf venv venv311',
            reason: '가상환경은 .gitignore에 추가하고 재생성 가능'
        });

        // __pycache__ 정리
        this.cleanupPlan.phase1_immediate.push({
            action: 'CLEANUP',
            target: '__pycache__',
            command: 'find . -type d -name "__pycache__" -exec rm -rf {} +',
            reason: 'Python 캐시 파일 제거'
        });
    }

    phase2Consolidation() {
        console.log('📌 Phase 2: 파일 통합 계획\n');
        
        // 제스처 시스템 통합
        this.cleanupPlan.phase2_consolidation.push({
            action: 'MERGE',
            category: 'Gesture System',
            files: [
                './gesture-service/math-gestures-demo.py',
                './gesture-service/math-gestures-detector.py',
                './gesture-service/mediapipe-math-gestures.py',
                './gesture-service/optimized-gesture-bridge.py',
                './gesture-service/realtime-gesture-bridge.py',
                './gesture/mediapipe_server.py'
            ],
            target: './gesture-service/unified-gesture-system.py',
            modules: [
                'GestureDetector',
                'MathGestureRecognizer', 
                'MediaPipeServer',
                'RealtimeBridge'
            ],
            expectedLines: '~800-1000',
            benefit: '6개 파일 → 1개로 통합, 중복 코드 제거'
        });

        // API 시스템 통합
        this.cleanupPlan.phase2_consolidation.push({
            action: 'MERGE',
            category: 'Cloud API',
            files: [
                './cloud-api/main.py',
                './cloud-api/firestore_service.py',
                './cloud-api/firestore_ontology.py',
                './cloud-api/initialize_firestore.py',
                './cloud-api/test_firestore.py',
                './cloud-api/test_firestore_connection.py'
            ],
            target: './cloud-api/unified-api.py',
            keepSeparate: ['./cloud-api/quick_start.py', './cloud-api/warmup.py'],
            benefit: '6개 파일 → 1개 메인 + 2개 유틸리티'
        });

        // 테스트 파일 통합
        this.cleanupPlan.phase2_consolidation.push({
            action: 'MERGE',
            category: 'Tests',
            files: [
                './tests/test-mediapipe-simple.py',
                './tests/test-mediapipe-keypoints.py',
                './tests/test-complete-systems.py'
            ],
            target: './tests/test_all.py',
            structure: 'pytest format with test classes',
            benefit: '통합 테스트 실행 가능'
        });
    }

    phase3Refactoring() {
        console.log('📌 Phase 3: 리팩토링 계획\n');
        
        this.cleanupPlan.phase3_refactoring.push({
            action: 'REFACTOR',
            category: 'Memory System',
            files: [
                './complete-memory-checkpoint.py',
                './memory-doc-sync.py',
                './dev-docs/memory_checkpoint_system.py',
                './dev-docs/auto_memory_updater.py'
            ],
            target: './core/memory_manager.py',
            architecture: 'Singleton pattern with async support',
            benefit: '메모리 관리 중앙화'
        });

        this.cleanupPlan.phase3_refactoring.push({
            action: 'REORGANIZE',
            category: 'Project Structure',
            newStructure: {
                'core/': '핵심 시스템 모듈',
                'api/': 'API 엔드포인트',
                'services/': '서비스 레이어',
                'utils/': '유틸리티 함수',
                'tests/': '통합 테스트',
                'docs/': '문서화',
                '.claude/': 'Claude 설정 (유지)'
            }
        });
    }

    phase4Optimization() {
        console.log('📌 Phase 4: 최적화 계획\n');
        
        this.cleanupPlan.phase4_optimization.push({
            action: 'OPTIMIZE',
            target: 'requirements.txt',
            task: '중복 의존성 제거 및 버전 고정',
            command: 'pip freeze > requirements.txt'
        });

        this.cleanupPlan.phase4_optimization.push({
            action: 'CREATE',
            file: '.gitignore',
            content: `
# Virtual Environments
venv/
venv311/
.venv/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
logs/

# Temp
*.tmp
.cache/

# Node
node_modules/

# OS
.DS_Store
Thumbs.db
            `.trim()
        });
    }

    printPlan() {
        console.log('\n' + '=' .repeat(60));
        console.log('📊 최종 정리 계획 요약');
        console.log('=' .repeat(60) + '\n');

        console.log('Before: 61 Python files + 10,423 venv files');
        console.log('After:  ~20 organized Python files\n');

        console.log('예상 결과:');
        console.log('  ✅ 코드 중복 70% 감소');
        console.log('  ✅ 프로젝트 구조 명확화');
        console.log('  ✅ 유지보수성 향상');
        console.log('  ✅ Claude Code 성능 50% 향상 (파일 수 감소)');
    }

    generateCleanupScript() {
        const script = `#!/bin/bash
# Auto-generated cleanup script

echo "🧹 프로젝트 정리 시작..."

# Phase 1: 즉시 정리
echo "Phase 1: 백업 및 캐시 파일 제거..."
rm -f ./cloud-api/main_backup.py
rm -rf ./cloud-api/backup_20250911_141538/
rm -rf ./backup-2025-09-11/
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null

# Phase 2: 디렉토리 구조 생성
echo "Phase 2: 새 디렉토리 구조 생성..."
mkdir -p core api services utils docs

# Phase 3: venv 정리 (선택적)
read -p "가상환경 폴더를 삭제하시겠습니까? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf venv venv311
    echo "가상환경 삭제 완료"
fi

echo "✅ 정리 완료!"
echo "다음 단계: 파일 통합 작업을 수동으로 진행하세요."
`;

        fs.writeFileSync('./cleanup-script.sh', script);
        console.log('\n✅ 정리 스크립트 생성: ./cleanup-script.sh');
    }
}

// 실행
const cleanup = new CollaborativeCleanup();
cleanup.generateDetailedPlan();
