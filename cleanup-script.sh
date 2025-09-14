#!/bin/bash
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
