#!/bin/bash

# 인증 설정 도우미 스크립트

echo "=========================================="
echo "GCP 인증 설정 도우미"
echo "=========================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "\n${YELLOW}현재 인증된 계정 목록:${NC}"
gcloud auth list

echo -e "\n${CYAN}=========================================="
echo "인증 설정 단계:"
echo "==========================================${NC}"

echo -e "\n${GREEN}1. 브라우저에서 Google 계정 로그인:${NC}"
echo "   gcloud auth login"

echo -e "\n${GREEN}2. 계정 확인:${NC}"
echo "   gcloud auth list"

echo -e "\n${GREEN}3. 활성 계정 설정:${NC}"
echo "   gcloud config set account [YOUR-EMAIL]"

echo -e "\n${GREEN}4. 프로젝트 설정:${NC}"
echo "   gcloud config set project math-project-472006"

echo -e "\n${GREEN}5. Application Default Credentials 설정:${NC}"
echo "   gcloud auth application-default login"

echo -e "\n${YELLOW}=========================================="
echo "자동 설정 시도"
echo "==========================================${NC}"

# 사용자 이메일 입력 받기
echo -e "\n${CYAN}Google 계정 이메일을 입력하세요:${NC}"
read -r USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
    echo -e "${RED}이메일이 입력되지 않았습니다.${NC}"
    exit 1
fi

# 계정이 존재하는지 확인
if gcloud auth list --filter="account:${USER_EMAIL}" --format="value(account)" | grep -q "${USER_EMAIL}"; then
    echo -e "${GREEN}✓ 계정 발견: ${USER_EMAIL}${NC}"

    # 활성 계정으로 설정
    echo -e "\n${YELLOW}활성 계정으로 설정 중...${NC}"
    gcloud config set account ${USER_EMAIL}

    # 프로젝트 설정
    echo -e "\n${YELLOW}프로젝트 설정 중...${NC}"
    gcloud config set project math-project-472006

    # 현재 설정 확인
    echo -e "\n${GREEN}현재 설정:${NC}"
    echo "활성 계정: $(gcloud config get-value account)"
    echo "활성 프로젝트: $(gcloud config get-value project)"

    echo -e "\n${GREEN}✓ 인증 설정 완료!${NC}"
else
    echo -e "${RED}✗ 계정을 찾을 수 없습니다: ${USER_EMAIL}${NC}"
    echo -e "${YELLOW}먼저 'gcloud auth login'을 실행해주세요.${NC}"
    exit 1
fi