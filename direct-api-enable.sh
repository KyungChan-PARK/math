#!/bin/bash

# API 직접 활성화 스크립트
# 권한 문제 우회 방법

echo "=========================================="
echo "API 수동 활성화 가이드"
echo "=========================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT="math-project-472006"

echo -e "\n${YELLOW}현재 상태:${NC}"
echo "프로젝트: ${PROJECT}"
echo "계정: $(gcloud config get-value account)"

echo -e "\n${CYAN}=========================================="
echo "방법 1: GCP Console에서 직접 활성화"
echo "==========================================${NC}"

echo -e "\n${GREEN}다음 링크들을 브라우저에서 열어 API를 활성화하세요:${NC}"
echo ""
echo "1. Firestore API:"
echo "   https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=${PROJECT}"
echo ""
echo "2. Cloud Functions API:"
echo "   https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=${PROJECT}"
echo ""
echo "3. Cloud Build API:"
echo "   https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=${PROJECT}"
echo ""
echo "4. Cloud Storage API:"
echo "   https://console.cloud.google.com/apis/library/storage.googleapis.com?project=${PROJECT}"
echo ""
echo "5. Vertex AI API:"
echo "   https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=${PROJECT}"
echo ""
echo "6. Document AI API:"
echo "   https://console.cloud.google.com/apis/library/documentai.googleapis.com?project=${PROJECT}"
echo ""
echo "7. App Engine Admin API (Firestore 필수):"
echo "   https://console.cloud.google.com/apis/library/appengine.googleapis.com?project=${PROJECT}"

echo -e "\n${CYAN}=========================================="
echo "방법 2: 서비스 계정 키 사용"
echo "==========================================${NC}"

echo -e "\n${GREEN}GCP Console에서 서비스 계정 키 생성:${NC}"
echo "1. https://console.cloud.google.com/iam-admin/serviceaccounts?project=${PROJECT}"
echo "2. '서비스 계정 만들기' 클릭"
echo "3. 이름: math-platform-sa"
echo "4. 역할: 프로젝트 > 소유자"
echo "5. 키 생성 (JSON)"
echo "6. 다운로드한 키를 이 디렉토리에 저장"

echo -e "\n${YELLOW}키 파일이 있다면 경로를 입력하세요 (Enter로 건너뛰기):${NC}"
read -r KEY_PATH

if [ -n "$KEY_PATH" ] && [ -f "$KEY_PATH" ]; then
    echo -e "\n${GREEN}서비스 계정 키 활성화...${NC}"
    export GOOGLE_APPLICATION_CREDENTIALS="$KEY_PATH"
    gcloud auth activate-service-account --key-file="$KEY_PATH"

    echo -e "\n${GREEN}API 활성화 시도...${NC}"
    gcloud services enable serviceusage.googleapis.com --project=${PROJECT}

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 권한 확인됨. API 활성화 진행...${NC}"

        # 모든 API 활성화
        gcloud services enable \
            firestore.googleapis.com \
            cloudfunctions.googleapis.com \
            cloudbuild.googleapis.com \
            storage.googleapis.com \
            aiplatform.googleapis.com \
            documentai.googleapis.com \
            appengine.googleapis.com \
            --project=${PROJECT}

        echo -e "${GREEN}✓ API 활성화 완료!${NC}"
    else
        echo -e "${RED}✗ 권한 부족${NC}"
    fi
fi

echo -e "\n${CYAN}=========================================="
echo "방법 3: 프로젝트 소유자 추가"
echo "==========================================${NC}"

echo -e "\n${GREEN}프로젝트 소유자에게 요청:${NC}"
echo "1. https://console.cloud.google.com/iam-admin/iam?project=${PROJECT}"
echo "2. '액세스 권한 부여' 클릭"
echo "3. 새 주체에 이메일 추가"
echo "4. 역할: 기본 > 소유자"
echo ""
echo "현재 사용 중인 서비스 계정:"
echo "kcpartner@math-project-472006.iam.gserviceaccount.com"

echo -e "\n${YELLOW}=========================================="
echo "API 활성화 상태 확인"
echo "==========================================${NC}"

echo -e "\n활성화된 API 목록:"
gcloud services list --enabled --project=${PROJECT} 2>/dev/null | head -20 || echo "권한 부족으로 확인 불가"