#!/bin/bash

# Cloud Functions 배포 스크립트
# 비용 최적화 및 자동 스케일링 설정 포함

PROJECT_ID="math-project-472006"
REGION="asia-northeast3"

echo "🚀 Cloud Functions 배포 시작..."

# 1. AI Orchestrator 함수 배포
echo "📦 AI Orchestrator 배포 중..."
gcloud functions deploy ai-orchestrator \
  --gen2 \
  --runtime nodejs20 \
  --region $REGION \
  --source ./ai-orchestrator \
  --entry-point orchestrateAI \
  --trigger-http \
  --allow-unauthenticated \
  --memory 512MB \
  --timeout 60s \
  --min-instances 0 \
  --max-instances 100 \
  --cpu 0.5 \
  --set-env-vars GCP_PROJECT=$PROJECT_ID \
  --service-account kcpartner@$PROJECT_ID.iam.gserviceaccount.com

# 2. Pub/Sub 트리거 함수 배포
echo "📦 AI Task Processor 배포 중..."
gcloud functions deploy ai-task-processor \
  --gen2 \
  --runtime nodejs20 \
  --region $REGION \
  --source ./ai-orchestrator \
  --entry-point processAITask \
  --trigger-topic ai-orchestration \
  --memory 1GB \
  --timeout 120s \
  --min-instances 0 \
  --max-instances 50 \
  --cpu 1 \
  --retry-on-failure \
  --set-env-vars GCP_PROJECT=$PROJECT_ID

# 3. 결과 조회 함수 배포
echo "📦 Result API 배포 중..."
gcloud functions deploy get-ai-result \
  --gen2 \
  --runtime nodejs20 \
  --region $REGION \
  --source ./ai-orchestrator \
  --entry-point getResult \
  --trigger-http \
  --allow-unauthenticated \
  --memory 256MB \
  --timeout 10s \
  --min-instances 0 \
  --max-instances 100 \
  --cpu 0.25

# 4. 헬스체크 함수 배포
echo "📦 Health Check 배포 중..."
gcloud functions deploy ai-health \
  --gen2 \
  --runtime nodejs20 \
  --region $REGION \
  --source ./ai-orchestrator \
  --entry-point health \
  --trigger-http \
  --allow-unauthenticated \
  --memory 128MB \
  --timeout 5s \
  --min-instances 1 \
  --max-instances 10 \
  --cpu 0.08

# 5. Pub/Sub 토픽 생성
echo "📬 Pub/Sub 토픽 생성 중..."
gcloud pubsub topics create ai-orchestration --if-not-exists

# 6. API Gateway 설정 (선택적)
echo "🔗 API Gateway 구성 중..."
cat > api-config.yaml << EOF
swagger: '2.0'
info:
  title: AI Orchestrator API
  version: 2.0.0
host: ai-orchestrator-$PROJECT_ID.an.gateway.dev
x-google-endpoints:
  - name: ai-orchestrator-$PROJECT_ID.an.gateway.dev
    allowCors: true
paths:
  /orchestrate:
    post:
      summary: Orchestrate AI task
      operationId: orchestrate
      x-google-backend:
        address: https://$REGION-$PROJECT_ID.cloudfunctions.net/ai-orchestrator
      responses:
        '202':
          description: Request accepted
  /results/{requestId}:
    get:
      summary: Get result
      operationId: getResult
      x-google-backend:
        address: https://$REGION-$PROJECT_ID.cloudfunctions.net/get-ai-result
      parameters:
        - in: path
          name: requestId
          required: true
          type: string
      responses:
        '200':
          description: Result retrieved
EOF

# 7. Secret Manager 설정
echo "🔐 Secret Manager 구성 중..."
echo -n "sk-8410f45ec22b4801803782ebd034029f" | gcloud secrets create qwen-api-key \
  --data-file=- \
  --replication-policy="automatic" \
  --if-not-exists

echo -n "AIzaSyCrYioPzm0Yr8bJ8ywEcKpNM1Pa9yqVWLQ" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy="automatic" \
  --if-not-exists

# 8. IAM 권한 설정
echo "🔑 IAM 권한 설정 중..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:kcpartner@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:kcpartner@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:kcpartner@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

echo "✅ Cloud Functions 배포 완료!"
echo "📊 비용 최적화 설정:"
echo "  - 최소 인스턴스: 0 (콜드 스타트 허용)"
echo "  - 자동 스케일링: 0-100 인스턴스"
echo "  - CPU 할당: 0.08-1 vCPU (함수별 최적화)"
echo "  - 메모리: 128MB-1GB (함수별 최적화)"
echo ""
echo "🔗 엔드포인트:"
echo "  - Orchestrator: https://$REGION-$PROJECT_ID.cloudfunctions.net/ai-orchestrator"
echo "  - Results: https://$REGION-$PROJECT_ID.cloudfunctions.net/get-ai-result"
echo "  - Health: https://$REGION-$PROJECT_ID.cloudfunctions.net/ai-health"