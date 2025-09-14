#!/bin/bash

# Cloud Functions 배포 스크립트
# math-project에 함수 배포

set -e

echo "=========================================="
echo "Cloud Functions 배포 스크립트"
echo "=========================================="

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT="math-project-472006"
REGION="us-central1"

# 배포할 함수 목록
declare -A FUNCTIONS=(
    ["generateMathProblems"]="cloud-functions/math-generator"
    ["aiOrchestrator"]="cloud-functions/ai-orchestrator"
    ["documentProcessor"]="cloud-functions/document-processor"
    ["userDataSync"]="cloud-functions/user-sync"
)

echo -e "\n${YELLOW}프로젝트 설정 확인${NC}"
gcloud config set project ${PROJECT}

# Cloud Functions 디렉토리 생성
echo -e "\n${YELLOW}Cloud Functions 디렉토리 구조 생성${NC}"

for func_name in "${!FUNCTIONS[@]}"; do
    func_dir="${FUNCTIONS[$func_name]}"

    echo -e "\n${GREEN}함수: ${func_name}${NC}"
    echo "디렉토리: ${func_dir}"

    # 디렉토리 생성
    mkdir -p ${func_dir}

    # package.json 생성
    if [ ! -f "${func_dir}/package.json" ]; then
        cat > ${func_dir}/package.json << EOF
{
  "name": "${func_name}",
  "version": "1.0.0",
  "description": "Cloud Function for ${func_name}",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "@google-cloud/firestore": "^7.0.0",
    "@google-cloud/aiplatform": "^3.0.0",
    "axios": "^1.6.0"
  },
  "engines": {
    "node": "20"
  }
}
EOF
    fi

    # index.js 생성 (없는 경우)
    if [ ! -f "${func_dir}/index.js" ]; then
        cat > ${func_dir}/index.js << EOF
const { Firestore } = require('@google-cloud/firestore');

// Firestore 초기화
const firestore = new Firestore({
    projectId: '${PROJECT}'
});

exports.${func_name} = async (req, res) => {
    try {
        // CORS 설정
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }

        // 함수 로직 구현
        const result = {
            success: true,
            function: '${func_name}',
            timestamp: new Date().toISOString(),
            project: '${PROJECT}'
        };

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: error.message
        });
    }
};
EOF
    fi

    # .gcloudignore 생성
    if [ ! -f "${func_dir}/.gcloudignore" ]; then
        cat > ${func_dir}/.gcloudignore << EOF
.gcloudignore
.git
.gitignore
node_modules/
test/
*.test.js
.env
.env.*
EOF
    fi
done

echo -e "\n${YELLOW}배포 스크립트 생성${NC}"
cat > deploy-all-functions.sh << 'EOF'
#!/bin/bash

PROJECT="math-project-472006"
REGION="us-central1"

echo "모든 Cloud Functions 배포 시작..."

# generateMathProblems 배포
echo "배포 중: generateMathProblems"
gcloud functions deploy generateMathProblems \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --region ${REGION} \
    --source cloud-functions/math-generator \
    --entry-point generateMathProblems \
    --project ${PROJECT} \
    --memory 512MB \
    --timeout 60s

# aiOrchestrator 배포
echo "배포 중: aiOrchestrator"
gcloud functions deploy aiOrchestrator \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --region ${REGION} \
    --source cloud-functions/ai-orchestrator \
    --entry-point aiOrchestrator \
    --project ${PROJECT} \
    --memory 1GB \
    --timeout 120s

# documentProcessor 배포
echo "배포 중: documentProcessor"
gcloud functions deploy documentProcessor \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --region ${REGION} \
    --source cloud-functions/document-processor \
    --entry-point documentProcessor \
    --project ${PROJECT} \
    --memory 512MB \
    --timeout 60s

# userDataSync 배포
echo "배포 중: userDataSync"
gcloud functions deploy userDataSync \
    --runtime nodejs20 \
    --trigger-http \
    --allow-unauthenticated \
    --region ${REGION} \
    --source cloud-functions/user-sync \
    --entry-point userDataSync \
    --project ${PROJECT} \
    --memory 256MB \
    --timeout 30s

echo "모든 함수 배포 완료!"
echo ""
echo "배포된 함수 확인:"
gcloud functions list --project ${PROJECT}
EOF

chmod +x deploy-all-functions.sh

echo -e "\n${GREEN}=========================================="
echo "Cloud Functions 구조 생성 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. 각 함수의 로직 구현"
echo "2. 환경 변수 설정"
echo "3. 배포 실행: ${YELLOW}./deploy-all-functions.sh${NC}"
echo ""
echo -e "${GREEN}✨ Cloud Functions 준비 완료!${NC}"