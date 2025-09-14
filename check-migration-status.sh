#!/bin/bash

# 마이그레이션 상태 확인 스크립트

echo "=========================================="
echo "마이그레이션 상태 확인"
echo "=========================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

OLD_PROJECT="math-project-472006"
NEW_PROJECT="math-project-472006"

echo -e "\n${YELLOW}[1/5] 현재 인증 상태${NC}"
echo "활성 계정:"
gcloud auth list --filter=status:ACTIVE --format="value(account)"

echo -e "\n${YELLOW}[2/5] 프로젝트 접근 가능 여부${NC}"
echo "OLD PROJECT (${OLD_PROJECT}):"
gcloud projects describe ${OLD_PROJECT} --format="value(name)" 2>/dev/null && echo -e "${GREEN}✓ 접근 가능${NC}" || echo -e "${RED}✗ 접근 불가${NC}"

echo ""
echo "NEW PROJECT (${NEW_PROJECT}):"
gcloud projects describe ${NEW_PROJECT} --format="value(name)" 2>/dev/null && echo -e "${GREEN}✓ 접근 가능${NC}" || echo -e "${RED}✗ 접근 불가${NC}"

echo -e "\n${YELLOW}[3/5] 필수 API 활성화 상태 (${NEW_PROJECT})${NC}"
APIS=(
    "firestore.googleapis.com"
    "cloudfunctions.googleapis.com"
    "cloudbuild.googleapis.com"
    "storage.googleapis.com"
    "aiplatform.googleapis.com"
    "documentai.googleapis.com"
)

for api in "${APIS[@]}"; do
    if gcloud services list --enabled --filter="name:${api}" --project=${NEW_PROJECT} --format="value(name)" 2>/dev/null | grep -q ${api}; then
        echo -e "${GREEN}✓${NC} ${api}"
    else
        echo -e "${RED}✗${NC} ${api}"
    fi
done

echo -e "\n${YELLOW}[4/5] Firestore 상태${NC}"
echo "OLD PROJECT (${OLD_PROJECT}):"
gcloud firestore databases list --project=${OLD_PROJECT} 2>/dev/null && echo -e "${GREEN}Firestore 활성화됨${NC}" || echo -e "${YELLOW}Firestore 없음 또는 접근 불가${NC}"

echo ""
echo "NEW PROJECT (${NEW_PROJECT}):"
gcloud firestore databases list --project=${NEW_PROJECT} 2>/dev/null && echo -e "${GREEN}Firestore 활성화됨${NC}" || echo -e "${YELLOW}Firestore 없음 또는 접근 불가${NC}"

echo -e "\n${YELLOW}[5/5] Cloud Functions 목록${NC}"
echo "OLD PROJECT (${OLD_PROJECT}):"
gcloud functions list --project=${OLD_PROJECT} --format="table(name,state)" 2>/dev/null || echo "함수 없음 또는 접근 불가"

echo ""
echo "NEW PROJECT (${NEW_PROJECT}):"
gcloud functions list --project=${NEW_PROJECT} --format="table(name,state)" 2>/dev/null || echo "함수 없음 또는 접근 불가"

echo -e "\n${GREEN}=========================================="
echo "상태 확인 완료"
echo "==========================================${NC}"