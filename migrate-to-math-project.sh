#!/bin/bash

# GCP 프로젝트 마이그레이션 스크립트
# math-project-472006 → math-project

set -e

echo "=========================================="
echo "GCP 프로젝트 마이그레이션 시작"
echo "FROM: math-project-472006"
echo "TO: math-project"
echo "=========================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 새 프로젝트 정보
OLD_PROJECT="math-project-472006"
NEW_PROJECT="math-project-472006"
NEW_REGION="us-central1"

# 1. 현재 프로젝트 확인
echo -e "\n${YELLOW}[1/8] 현재 GCP 설정 확인${NC}"
echo "현재 프로젝트:"
gcloud config get-value project || true

# 2. 새 프로젝트로 전환
echo -e "\n${YELLOW}[2/8] 새 프로젝트로 전환${NC}"
echo "math-project-472006으로 전환 중..."
gcloud config set project ${NEW_PROJECT} 2>/dev/null || {
    echo -e "${RED}프로젝트 전환 실패. math-project-472006이 생성되었는지 확인하세요.${NC}"
    exit 1
}

# 3. 필요한 API 활성화
echo -e "\n${YELLOW}[3/8] 필요한 API 활성화${NC}"
APIS=(
    "firestore.googleapis.com"
    "cloudfunctions.googleapis.com"
    "cloudbuild.googleapis.com"
    "documentai.googleapis.com"
    "aiplatform.googleapis.com"
    "storage.googleapis.com"
    "cloudscheduler.googleapis.com"
    "appengine.googleapis.com"
)

for api in "${APIS[@]}"; do
    echo "활성화 중: $api"
    gcloud services enable $api --project=${NEW_PROJECT} || true
done

# 4. Firestore 설정
echo -e "\n${YELLOW}[4/8] Firestore 데이터베이스 설정${NC}"
echo "Firestore 초기화 중..."
gcloud app create --region=${NEW_REGION} --project=${NEW_PROJECT} 2>/dev/null || {
    echo "App Engine이 이미 생성되었거나 오류 발생 (무시 가능)"
}
gcloud firestore databases create --region=${NEW_REGION} --project=${NEW_PROJECT} 2>/dev/null || {
    echo "Firestore가 이미 생성되었거나 오류 발생"
}

# 5. 서비스 계정 생성
echo -e "\n${YELLOW}[5/8] 서비스 계정 설정${NC}"
SERVICE_ACCOUNT_NAME="math-platform-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${NEW_PROJECT}.iam.gserviceaccount.com"

gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
    --display-name="Math Platform Service Account" \
    --project=${NEW_PROJECT} 2>/dev/null || {
    echo "서비스 계정이 이미 존재함"
}

# IAM 역할 부여
ROLES=(
    "roles/firestore.admin"
    "roles/cloudfunctions.admin"
    "roles/aiplatform.user"
    "roles/documentai.apiUser"
    "roles/storage.admin"
)

for role in "${ROLES[@]}"; do
    echo "역할 부여 중: $role"
    gcloud projects add-iam-policy-binding ${NEW_PROJECT} \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="$role" \
        --quiet 2>/dev/null || true
done

# 6. 서비스 계정 키 생성
echo -e "\n${YELLOW}[6/8] 서비스 계정 키 생성${NC}"
KEY_FILE="math-project-credentials.json"
gcloud iam service-accounts keys create ${KEY_FILE} \
    --iam-account=${SERVICE_ACCOUNT_EMAIL} \
    --project=${NEW_PROJECT} 2>/dev/null || {
    echo "키 생성 실패 또는 이미 존재"
}

# 7. 환경 변수 파일 업데이트
echo -e "\n${YELLOW}[7/8] 환경 변수 파일 생성${NC}"
cat > .env.math-project << EOF
# GCP 프로젝트 설정
GCP_PROJECT_ID=${NEW_PROJECT}
GCP_REGION=${NEW_REGION}
GOOGLE_APPLICATION_CREDENTIALS=./${KEY_FILE}

# Firestore 설정
FIRESTORE_PROJECT_ID=${NEW_PROJECT}
FIRESTORE_DATABASE_ID=(default)

# Cloud Functions 설정
FUNCTIONS_REGION=${NEW_REGION}

# 기존 API 키 (변경 불필요)
DASHSCOPE_ACCESS_KEY_ID=LTAI5tGKFLf3VhjBVAjUvUo4
DASHSCOPE_ACCESS_KEY_SECRET=nnvPMQMDAyqT147jTxkQJdET36JUB9
DASHSCOPE_API_KEY=sk-8410f45ec22b4801803782ebd034029f
GEMINI_API_KEY=AIzaSyCrYioPzm0Yr8bJ8ywEcKpNM1Pa9yqVWLQ

# 서비스 포트
PORT=8100
ORCHESTRATOR_PORT=8093
WEBSOCKET_PORT=8094
MEDIAPIPE_PORT=5000
EOF

echo -e "${GREEN}환경 변수 파일 생성 완료: .env.math-project${NC}"

# 8. 마이그레이션 스크립트 생성
echo -e "\n${YELLOW}[8/8] 코드 업데이트 스크립트 생성${NC}"
cat > update-project-references.js << 'EOF'
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const OLD_PROJECT = 'math-project-472006';
const NEW_PROJECT = 'math-project';

// 업데이트할 파일 패턴
const patterns = [
    '**/*.js',
    '**/*.json',
    '**/*.md',
    '**/*.sh',
    '**/*.yaml',
    '**/*.yml',
    '**/*.env'
];

// 제외할 디렉토리
const ignore = [
    'node_modules/**',
    'venv*/**',
    '.git/**',
    '*.log'
];

console.log('프로젝트 참조 업데이트 시작...');

patterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore });

    files.forEach(file => {
        try {
            let content = fs.readFileSync(file, 'utf8');
            const originalContent = content;

            // 프로젝트 ID 교체
            content = content.replace(new RegExp(OLD_PROJECT, 'g'), NEW_PROJECT);

            if (content !== originalContent) {
                fs.writeFileSync(file, content);
                console.log(`✅ 업데이트: ${file}`);
            }
        } catch (err) {
            console.error(`❌ 오류: ${file} - ${err.message}`);
        }
    });
});

console.log('프로젝트 참조 업데이트 완료!');
EOF

echo -e "\n${GREEN}=========================================="
echo "마이그레이션 준비 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. 코드 내 프로젝트 참조 업데이트:"
echo "   ${YELLOW}node update-project-references.js${NC}"
echo ""
echo "2. 새 환경 변수 적용:"
echo "   ${YELLOW}cp .env.math-project .env${NC}"
echo ""
echo "3. Cloud Functions 배포:"
echo "   ${YELLOW}cd cloud-functions && ./deploy.sh${NC}"
echo ""
echo "4. Firestore 데이터 마이그레이션 (필요시):"
echo "   ${YELLOW}gcloud firestore export gs://[BUCKET_NAME]/firestore-backup${NC}"
echo "   ${YELLOW}gcloud firestore import gs://[BUCKET_NAME]/firestore-backup${NC}"
echo ""
echo -e "${GREEN}✨ math-project로 마이그레이션 준비 완료!${NC}"