#!/bin/bash

# 계정 전환 스크립트

echo "=========================================="
echo "GCP 계정 전환 도우미"
echo "=========================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "\n${YELLOW}현재 상태:${NC}"
echo "활성 계정: $(gcloud config get-value account)"
echo "활성 프로젝트: $(gcloud config get-value project)"

echo -e "\n${RED}중요: 서비스 계정이 아닌 개인 Google 계정으로 로그인이 필요합니다.${NC}"
echo ""
echo -e "${GREEN}Step 1: 브라우저에서 로그인${NC}"
echo "다음 명령을 실행하고 브라우저에서 Google 계정으로 로그인하세요:"
echo ""
echo -e "${CYAN}gcloud auth login${NC}"
echo ""
echo "로그인 완료 후 Enter를 누르세요..."
read -r

echo -e "\n${GREEN}Step 2: 계정 확인${NC}"
echo "등록된 계정 목록:"
gcloud auth list

echo -e "\n${GREEN}Step 3: 계정 전환${NC}"
echo "사용할 Google 계정 이메일을 입력하세요:"
read -r USER_EMAIL

if [ -n "$USER_EMAIL" ]; then
    echo -e "\n${YELLOW}계정 전환 중...${NC}"
    gcloud config set account ${USER_EMAIL}

    echo -e "\n${YELLOW}프로젝트 설정 중...${NC}"
    gcloud config set project math-project-472006

    echo -e "\n${GREEN}설정 완료!${NC}"
    echo "활성 계정: $(gcloud config get-value account)"
    echo "활성 프로젝트: $(gcloud config get-value project)"

    echo -e "\n${GREEN}Step 4: API 활성화 테스트${NC}"
    echo "serviceusage API 활성화 시도..."
    gcloud services enable serviceusage.googleapis.com --project=math-project-472006

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ API 활성화 권한 확인됨${NC}"
    else
        echo -e "${RED}✗ API 활성화 권한 없음${NC}"
        echo "프로젝트 소유자 권한이 필요합니다."
    fi
else
    echo -e "${RED}이메일이 입력되지 않았습니다.${NC}"
fi

echo -e "\n${CYAN}=========================================="
echo "다음 단계:"
echo "==========================================${NC}"
echo "1. API 활성화: ./migrate-to-math-project.sh"
echo "2. 상태 확인: ./check-migration-status.sh"