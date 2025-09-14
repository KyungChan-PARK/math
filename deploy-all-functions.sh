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
