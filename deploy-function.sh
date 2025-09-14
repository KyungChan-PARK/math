#!/bin/bash

# Cloud Function 배포 스크립트

echo "=========================================="
echo "Cloud Functions 배포"
echo "=========================================="

PROJECT="math-project-472006"
REGION="us-central1"

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "\n${YELLOW}프로젝트 설정: ${PROJECT}${NC}"
gcloud config set project ${PROJECT}

echo -e "\n${YELLOW}generateMathProblems 함수 배포 중...${NC}"

cd cloud-functions/math-generator

# npm 패키지 설치
npm install

# 함수 배포
gcloud functions deploy generateMathProblems \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --region ${REGION} \
    --entry-point generateMathProblems \
    --project ${PROJECT} \
    --memory 512MB \
    --timeout 60s \
    --env-vars-file .env.yaml

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ 배포 성공!${NC}"
    echo ""
    echo "함수 URL:"
    echo "https://${REGION}-${PROJECT}.cloudfunctions.net/generateMathProblems"
    echo ""
    echo "테스트 명령:"
    echo 'curl -X POST https://'${REGION}'-'${PROJECT}'.cloudfunctions.net/generateMathProblems \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '"'"'{"grade": "6", "topic": "algebra", "count": 3}'"'"
else
    echo -e "\n${RED}❌ 배포 실패${NC}"
fi

cd ../..