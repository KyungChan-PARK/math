#!/bin/bash

# Firestore 데이터 백업 스크립트
# math-project-472006에서 데이터를 백업

set -e

echo "=========================================="
echo "Firestore 데이터 백업 스크립트"
echo "=========================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

OLD_PROJECT="math-project-472006"
BACKUP_BUCKET="gs://math-project-firestore-backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_BUCKET}/backup_${TIMESTAMP}"

echo -e "\n${YELLOW}[1/3] 백업 버킷 생성 확인${NC}"
gsutil mb -p ${OLD_PROJECT} ${BACKUP_BUCKET} 2>/dev/null || {
    echo "버킷이 이미 존재하거나 생성 실패"
}

echo -e "\n${YELLOW}[2/3] Firestore 데이터 익스포트${NC}"
echo "백업 위치: ${BACKUP_PATH}"
gcloud firestore export ${BACKUP_PATH} \
    --project=${OLD_PROJECT} \
    --async || {
    echo -e "${RED}백업 실패. 권한을 확인하세요.${NC}"
    exit 1
}

echo -e "\n${GREEN}백업이 시작되었습니다.${NC}"
echo "진행 상황 확인:"
echo "  gcloud firestore operations list --project=${OLD_PROJECT}"
echo ""
echo "백업 완료 후 복원 명령:"
echo "  gcloud firestore import ${BACKUP_PATH} --project=math-project"

# 백업 정보 저장
cat > firestore-backup-info.json << EOF
{
  "timestamp": "${TIMESTAMP}",
  "source_project": "${OLD_PROJECT}",
  "backup_path": "${BACKUP_PATH}",
  "created_at": "$(date -Iseconds)"
}
EOF

echo -e "\n${GREEN}백업 정보가 firestore-backup-info.json에 저장되었습니다.${NC}"