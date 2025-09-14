#!/bin/bash

# Small Scale Math Platform - Deployment Script
# Optimized for $100/month budget with quality focus

set -e  # Exit on error

PROJECT_ID="math-platform-small"
REGION="us-central1"
BILLING_ACCOUNT="YOUR_BILLING_ACCOUNT_ID"

echo "🚀 Starting deployment for Small Scale Math Platform"
echo "Budget: $100/month | Students: 10 | Focus: Quality & Teacher Review"
echo "=================================================="

# 1. Setup Project
echo "📋 Step 1: Setting up GCP Project..."
gcloud projects create $PROJECT_ID --name="Math Platform Small" 2>/dev/null || echo "Project already exists"
gcloud config set project $PROJECT_ID
gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT

# 2. Enable APIs (Free tier maximization)
echo "🔧 Step 2: Enabling required APIs..."
gcloud services enable \
  firestore.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudscheduler.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  run.googleapis.com \
  storage.googleapis.com

# 3. Create Firestore Database
echo "💾 Step 3: Creating Firestore database..."
gcloud firestore databases create --region=$REGION --type=FIRESTORE_NATIVE

# Initialize Firestore collections with indexes
cat > firestore.indexes.json << EOF
{
  "indexes": [
    {
      "collectionGroup": "problems",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "grade", "order": "ASCENDING"},
        {"fieldPath": "approved", "order": "ASCENDING"},
        {"fieldPath": "popularity", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "review_queue",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "priority", "order": "ASCENDING"},
        {"fieldPath": "generatedAt", "order": "DESCENDING"}
      ]
    }
  ]
}
EOF

gcloud firestore indexes create --file=firestore.indexes.json

# 4. Create Storage Buckets (Minimal)
echo "📦 Step 4: Creating storage buckets..."
gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://${PROJECT_ID}-problems
gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://${PROJECT_ID}-functions

# Set lifecycle rules for cost optimization
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {"age": 7}
      },
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://${PROJECT_ID}-problems

# 5. Setup Secret Manager
echo "🔐 Step 5: Setting up Secret Manager..."
read -p "Enter your Gemini API Key: " GEMINI_API_KEY
echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy="automatic"

# 6. Deploy Cloud Functions
echo "☁️ Step 6: Deploying Cloud Functions..."

# Package generate-problem function
cd functions/generate-problem
npm install
zip -r ../generate-problem.zip .
gsutil cp ../generate-problem.zip gs://${PROJECT_ID}-functions/

# Deploy function
gcloud functions deploy generate-problem \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=gs://${PROJECT_ID}-functions/generate-problem.zip \
  --entry-point=generateProblem \
  --trigger-http \
  --allow-unauthenticated \
  --memory=256MB \
  --max-instances=1 \
  --set-env-vars="PROJECT_ID=$PROJECT_ID,GEMINI_MODEL=gemini-1.5-flash,MAX_COST_PER_DAY=3" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest"

cd ../..

# 7. Deploy Teacher App (Cloud Run)
echo "🌐 Step 7: Deploying Teacher App..."

# Create simple Dockerfile for teacher app
cat > teacher-app/Dockerfile << EOF
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
EOF

# Build and deploy
cd teacher-app
gcloud builds submit --tag gcr.io/$PROJECT_ID/teacher-app
gcloud run deploy teacher-app \
  --image gcr.io/$PROJECT_ID/teacher-app \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory=256Mi \
  --cpu=0.5 \
  --max-instances=1 \
  --min-instances=0

cd ..

# 8. Setup Cloud Scheduler
echo "⏰ Step 8: Setting up scheduled tasks..."

# Weekly problem generation (Sunday 8PM)
gcloud scheduler jobs create http weekly-generation \
  --location=$REGION \
  --schedule="0 20 * * SUN" \
  --uri="https://generate-problem-${REGION}-${PROJECT_ID}.cloudfunctions.net/generateProblem" \
  --http-method=POST \
  --message-body='{"action":"weekly_batch","count":20}' \
  --time-zone="Asia/Seoul"

# Daily cost reset (Midnight)
gcloud scheduler jobs create http daily-cost-reset \
  --location=$REGION \
  --schedule="0 0 * * *" \
  --uri="https://generate-problem-${REGION}-${PROJECT_ID}.cloudfunctions.net/resetDailyCost" \
  --http-method=POST \
  --time-zone="Asia/Seoul"

# 9. Setup Budget Alert
echo "💰 Step 9: Setting up budget alerts..."
gcloud billing budgets create \
  --billing-account=$BILLING_ACCOUNT \
  --display-name="Math Platform Monthly Budget" \
  --budget-amount=100 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100

# 10. Initialize Sample Data
echo "📚 Step 10: Adding sample templates..."

# Create sample templates
cat > templates.json << EOF
{
  "templates": [
    {
      "grade": 8,
      "unit": "algebra1_unit13",
      "topic": "factoring",
      "problem": {
        "ko": "{{name}}는 정원을 만들려고 합니다. 넓이가 x²+7x+12일 때, 가능한 가로와 세로는?",
        "en": "{{name}} wants to create a garden with area x²+7x+12. Find possible dimensions."
      },
      "answer": "(x+3) and (x+4)",
      "solution": ["Factor x²+7x+12", "Find factors of 12 that sum to 7", "(x+3)(x+4)"],
      "approved": true,
      "popularity": 10
    }
  ]
}
EOF

# Import templates to Firestore
npm install -g @google-cloud/firestore
node -e "
const {Firestore} = require('@google-cloud/firestore');
const fs = require('fs');
const db = new Firestore({projectId: '$PROJECT_ID'});
const data = JSON.parse(fs.readFileSync('templates.json'));
data.templates.forEach(async (t) => {
  await db.collection('templates').add(t);
});
console.log('Templates imported');
"

# 11. Output URLs and Info
echo "✅ Deployment Complete!"
echo "=================================================="
echo "Teacher App URL: $(gcloud run services describe teacher-app --region=$REGION --format='value(status.url)')"
echo "Function URL: https://generate-problem-${REGION}-${PROJECT_ID}.cloudfunctions.net"
echo ""
echo "📊 Cost Breakdown (Estimated):"
echo "- Firestore: ~$10/month (50K reads/day free)"
echo "- Cloud Functions: ~$5/month (2M invocations free)"
echo "- Cloud Run: ~$5/month (2M requests free)"
echo "- Storage: ~$2/month (5GB free)"
echo "- Gemini API: ~$30/month (24K problems)"
echo "- Total: ~$52/month (52% of budget)"
echo ""
echo "🎯 Next Steps:"
echo "1. Visit the Teacher App URL"
echo "2. Generate your first problem set"
echo "3. Review and approve problems"
echo "4. Share with your 10 students"
echo ""
echo "💡 Tips:"
echo "- Use templates to save API costs"
echo "- Batch generate on Sundays"
echo "- Monitor daily budget in dashboard"
echo "- Popular problems auto-save as templates"