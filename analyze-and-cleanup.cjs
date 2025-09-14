#!/usr/bin/env node
/**
 * 파일 정리 및 분석 시스템
 * Claude, Qwen, Gemini 협업을 통한 프로젝트 파일 정리
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class ProjectAnalyzer {
    constructor() {
        this.pythonFiles = [];
        this.jsFiles = [];
        this.categories = {
            claude_hooks: [],
            api_backend: [],
            memory_system: [],
            gesture_system: [],
            testing: [],
            orchestration: [],
            documentation: [],
            deprecated: [],
            duplicate: []
        };
    }

    async analyzePythonFiles() {
        console.log('🔍 Python 파일 분석 시작...\n');
        
        // Python 파일 목록 가져오기
        const { stdout } = await execPromise(
            "find . -type f -name '*.py' -not -path './venv*' -not -path './__pycache__*' -not -path './.git*'"
        );
        
        this.pythonFiles = stdout.trim().split('\n').filter(f => f);
        
        // 파일 분류
        for (const file of this.pythonFiles) {
            await this.categorizeFile(file);
        }
        
        return this.generateReport();
    }

    async categorizeFile(filePath) {
        const fileName = path.basename(filePath);
        const dirName = path.dirname(filePath);
        
        // 파일 내용 읽기
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').length;
            const hasMain = content.includes('if __name__');
            const imports = (content.match(/^import |^from /gm) || []).length;
            
            // 카테고리 분류
            if (dirName.includes('.claude/hooks')) {
                this.categories.claude_hooks.push({
                    path: filePath,
                    lines,
                    hasMain,
                    imports,
                    status: 'keep',
                    reason: 'Claude 시스템 필수 파일'
                });
            } else if (dirName.includes('cloud-api') || dirName.includes('backend')) {
                // 백업 파일 체크
                if (fileName.includes('backup') || fileName.includes('_backup')) {
                    this.categories.deprecated.push({
                        path: filePath,
                        lines,
                        status: 'delete',
                        reason: '백업 파일 - 버전 관리로 대체 가능'
                    });
                } else {
                    this.categories.api_backend.push({
                        path: filePath,
                        lines,
                        hasMain,
                        imports,
                        status: 'review',
                        reason: 'API 기능 통합 필요 검토'
                    });
                }
            } else if (dirName.includes('test')) {
                this.categories.testing.push({
                    path: filePath,
                    lines,
                    status: 'consolidate',
                    reason: '테스트 파일 통합 가능'
                });
            } else if (dirName.includes('gesture') || dirName.includes('mediapipe')) {
                this.categories.gesture_system.push({
                    path: filePath,
                    lines,
                    status: 'consolidate',
                    reason: '제스처 시스템 통합 가능'
                });
            } else if (dirName.includes('memory') || fileName.includes('memory')) {
                this.categories.memory_system.push({
                    path: filePath,
                    lines,
                    status: 'review',
                    reason: '메모리 시스템 중복 확인 필요'
                });
            } else if (dirName.includes('dev-docs')) {
                this.categories.documentation.push({
                    path: filePath,
                    lines,
                    status: 'move',
                    reason: '문서 폴더로 이동 필요'
                });
            }
        } catch (error) {
            console.error(`파일 읽기 오류: ${filePath}`, error.message);
        }
    }

    generateReport() {
        const report = {
            summary: {
                total_files: this.pythonFiles.length,
                categories: {}
            },
            recommendations: {
                delete: [],
                merge: [],
                move: [],
                keep: [],
                review: []
            }
        };

        // 카테고리별 요약
        for (const [category, files] of Object.entries(this.categories)) {
            report.summary.categories[category] = files.length;
            
            // 권장사항 분류
            files.forEach(file => {
                switch(file.status) {
                    case 'delete':
                        report.recommendations.delete.push(file);
                        break;
                    case 'consolidate':
                        report.recommendations.merge.push(file);
                        break;
                    case 'move':
                        report.recommendations.move.push(file);
                        break;
                    case 'keep':
                        report.recommendations.keep.push(file);
                        break;
                    case 'review':
                        report.recommendations.review.push(file);
                        break;
                }
            });
        }

        return report;
    }

    async saveReport(report) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = `./cleanup-report-${timestamp}.json`;
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📊 보고서 저장: ${reportPath}`);
        
        // 요약 출력
        console.log('\n=== 파일 정리 계획 ===\n');
        console.log(`총 파일 수: ${report.summary.total_files}`);
        console.log('\n카테고리별 분포:');
        for (const [cat, count] of Object.entries(report.summary.categories)) {
            if (count > 0) {
                console.log(`  ${cat}: ${count}개`);
            }
        }
        
        console.log('\n권장 조치:');
        console.log(`  삭제 대상: ${report.recommendations.delete.length}개`);
        console.log(`  통합 대상: ${report.recommendations.merge.length}개`);
        console.log(`  이동 대상: ${report.recommendations.move.length}개`);
        console.log(`  유지: ${report.recommendations.keep.length}개`);
        console.log(`  검토 필요: ${report.recommendations.review.length}개`);
        
        return reportPath;
    }
}

// 실행
async function main() {
    console.log('🚀 프로젝트 파일 정리 시스템 시작\n');
    console.log('협업: Claude + Qwen + Gemini\n');
    console.log('=' .repeat(50) + '\n');
    
    const analyzer = new ProjectAnalyzer();
    const report = await analyzer.analyzePythonFiles();
    const reportPath = await analyzer.saveReport(report);
    
    console.log('\n✅ 분석 완료!');
    console.log(`📄 상세 보고서: ${reportPath}`);
}

main().catch(console.error);
