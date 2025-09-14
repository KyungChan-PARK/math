#!/bin/bash

# Firestore 백업 실행 스크립트
# math-project-472006의 데이터를 백업

set -e

echo "=========================================="
echo "Firestore 데이터 백업 실행"
echo "=========================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

OLD_PROJECT="math-project-472006"
NEW_PROJECT="math-project-472006"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BUCKET="gs://${NEW_PROJECT}-firestore-backup"
BACKUP_PATH="${BACKUP_BUCKET}/backup_${TIMESTAMP}"

echo -e "\n${YELLOW}[1/4] 현재 프로젝트 설정${NC}"
gcloud config set project ${OLD_PROJECT}

echo -e "\n${YELLOW}[2/4] 백업 버킷 생성${NC}"
echo "버킷 생성: ${BACKUP_BUCKET}"
gsutil mb -p ${NEW_PROJECT} ${BACKUP_BUCKET} 2>/dev/null || {
    echo "버킷이 이미 존재하거나 권한 문제 발생"
}

echo -e "\n${YELLOW}[3/4] Firestore 데이터 익스포트${NC}"
echo "백업 경로: ${BACKUP_PATH}"
echo ""
echo -e "${RED}주의: 이 작업은 Firestore Export API를 사용합니다.${NC}"
echo "진행하시겠습니까? (y/n)"
read -r response

if [[ "$response" == "y" || "$response" == "Y" ]]; then
    gcloud firestore export ${BACKUP_PATH} \
        --project=${OLD_PROJECT} \
        --async || {
        echo -e "${RED}백업 실패!${NC}"
        echo "가능한 원인:"
        echo "1. Firestore Export/Import Admin 권한 부족"
        echo "2. 프로젝트에 Firestore가 활성화되지 않음"
        echo "3. 버킷 접근 권한 부족"
        exit 1
    }

    echo -e "\n${GREEN}백업이 시작되었습니다!${NC}"
    echo ""
    echo "진행 상황 확인:"
    echo "  ${YELLOW}gcloud firestore operations list --project=${OLD_PROJECT}${NC}"
    echo ""
    echo "백업 완료 후 새 프로젝트로 복원:"
    echo "  ${YELLOW}gcloud firestore import ${BACKUP_PATH} --project=${NEW_PROJECT}${NC}"

    # 백업 정보 저장
    cat > firestore-backup-${TIMESTAMP}.json << EOF
{
  "timestamp": "${TIMESTAMP}",
  "source_project": "${OLD_PROJECT}",
  "target_project": "${NEW_PROJECT}",
  "backup_path": "${BACKUP_PATH}",
  "created_at": "$(date -Iseconds)",
  "status": "in_progress",
  "notes": "Check operation status with: gcloud firestore operations list --project=${OLD_PROJECT}"
}
EOF

    echo -e "\n${GREEN}백업 정보가 firestore-backup-${TIMESTAMP}.json에 저장되었습니다.${NC}"
else
    echo -e "${YELLOW}백업이 취소되었습니다.${NC}"
fi