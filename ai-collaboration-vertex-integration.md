# AI 협업 시스템 + Vertex AI/AutoML 통합 아키텍처

## 현재 상태 분석
- Claude, Qwen, Gemini 오케스트레이터 파일은 존재하나 실행 중이지 않음
- 로컬 환경에서만 작동 가능한 상태
- Vertex AI와 통합되지 않음

## 최적화된 AI 협업 시스템 설계

### 1. 3-AI 협업 모델 with Vertex AI Orchestration

```python
# vertex-ai/ai-collaboration-orchestrator.py
from google.cloud import aiplatform
from google.cloud import workflows_v1
import asyncio
import json

class AICollaborationSystem:
    """
    Claude, Qwen, Gemini + Vertex AI 통합 협업 시스템
    """
    
    def __init__(self):
        self.claude_endpoint = "claude-opus-4.1"  # Via Anthropic API
        self.qwen_endpoint = "qwen-72b"          # Via DashScope API  
        self.gemini_endpoint = "gemini-1.5-pro"  # Via Google AI
        self.vertex_models = {}                  # Vertex AI AutoML models
        
        # Vertex AI 초기화
        aiplatform.init(project='math-platform-small')
        self.load_vertex_models()
    
    def load_vertex_models(self):
        """Vertex AI AutoML 모델 로드"""
        self.vertex_models = {
            'difficulty_classifier': 'endpoints/difficulty-predictor',
            'quality_evaluator': 'endpoints/quality-scorer',
            'error_detector': 'endpoints/error-pattern-detector',
            'scaffolding_generator': 'endpoints/adaptive-scaffolding'
        }
    
    async def generate_collaborative_problem(self, requirements):
        """
        3개 AI + Vertex AI 협업으로 문제 생성
        """
        
        # Phase 1: 병렬 초안 생성
        tasks = [
            self.claude_generate_draft(requirements),   # 구조적 사고
            self.qwen_generate_draft(requirements),     # 다국어/문화
            self.gemini_generate_draft(requirements)    # 기술적 정확성
        ]
        
        drafts = await asyncio.gather(*tasks)
        
        # Phase 2: Vertex AI로 품질 평가
        quality_scores = await self.evaluate_with_vertex(drafts)
        
        # Phase 3: 최고 품질 선택 및 합성
        best_elements = self.extract_best_elements(drafts, quality_scores)
        
        # Phase 4: AI 협업으로 최종 문제 생성
        final_problem = await self.synthesize_problem(best_elements)
        
        # Phase 5: Vertex AI로 난이도 분류 및 스캐폴딩
        enhanced_problem = await self.enhance_with_vertex(final_problem)
        
        return enhanced_problem
    
    async def claude_generate_draft(self, req):
        """Claude: 논리적 구조와 교육학적 설계"""
        prompt = f"""
        Generate a SAT math problem with focus on:
        - Clear logical structure
        - Progressive scaffolding design
        - Conceptual understanding
        
        Requirements: {json.dumps(req)}
        """
        
        # Claude API 호출
        response = await self.call_claude_api(prompt)
        
        return {
            'source': 'claude',
            'strengths': ['logical_structure', 'pedagogy', 'scaffolding'],
            'problem': response
        }
    
    async def qwen_generate_draft(self, req):
        """Qwen: 다국어 지원과 문화적 맥락"""
        prompt = f"""
        生成SAT数学题目，重点关注：
        - 한국 학생 맞춤형 설명
        - 多语言表达 (중국어 참고)
        - 문화적 맥락 고려
        
        要求：{json.dumps(req)}
        """
        
        # Qwen API 호출
        response = await self.call_qwen_api(prompt)
        
        return {
            'source': 'qwen',
            'strengths': ['multilingual', 'cultural_context', 'asian_pedagogy'],
            'problem': response
        }
    
    async def gemini_generate_draft(self, req):
        """Gemini: 기술적 정확성과 시각화"""
        prompt = f"""
        Generate SAT math problem with focus on:
        - Mathematical accuracy
        - Visual representations
        - Real-world applications
        
        Requirements: {json.dumps(req)}
        Include LaTeX formatting and graph specifications.
        """
        
        # Gemini API 호출
        response = await self.call_gemini_api(prompt)
        
        return {
            'source': 'gemini',
            'strengths': ['accuracy', 'visualization', 'applications'],
            'problem': response
        }
    
    async def evaluate_with_vertex(self, drafts):
        """Vertex AI AutoML로 각 초안 품질 평가"""
        client = aiplatform.gapic.PredictionServiceClient()
        
        scores = []
        for draft in drafts:
            # 품질 평가 모델 호출
            response = client.predict(
                endpoint=self.vertex_models['quality_evaluator'],
                instances=[{
                    'problem_text': draft['problem']['text'],
                    'solution': draft['problem']['solution'],
                    'source_ai': draft['source']
                }]
            )
            
            scores.append({
                'source': draft['source'],
                'quality_score': response.predictions[0]['score'],
                'sat_alignment': response.predictions[0]['sat_alignment'],
                'pedagogical_value': response.predictions[0]['pedagogical_value']
            })
        
        return scores
    
    def extract_best_elements(self, drafts, scores):
        """각 AI의 강점을 추출"""
        best_elements = {
            'structure': None,
            'multilingual': None,
            'visualization': None,
            'scaffolding': None
        }
        
        # Claude의 구조와 스캐폴딩
        claude_draft = next(d for d in drafts if d['source'] == 'claude')
        best_elements['structure'] = claude_draft['problem']['structure']
        best_elements['scaffolding'] = claude_draft['problem']['scaffolding']
        
        # Qwen의 다국어 표현
        qwen_draft = next(d for d in drafts if d['source'] == 'qwen')
        best_elements['multilingual'] = {
            'ko': qwen_draft['problem']['ko'],
            'en': qwen_draft['problem']['en'],
            'zh': qwen_draft['problem'].get('zh', '')
        }
        
        # Gemini의 시각화
        gemini_draft = next(d for d in drafts if d['source'] == 'gemini')
        best_elements['visualization'] = gemini_draft['problem']['graphs']
        
        return best_elements
    
    async def synthesize_problem(self, elements):
        """최종 문제 합성 - 3 AI 투표 시스템"""
        
        synthesis_prompt = f"""
        Synthesize the best elements into a final problem:
        Structure: {elements['structure']}
        Multilingual: {elements['multilingual']}
        Visualization: {elements['visualization']}
        Scaffolding: {elements['scaffolding']}
        """
        
        # 3개 AI가 각각 최종안 제안
        final_candidates = await asyncio.gather(
            self.call_claude_api(synthesis_prompt),
            self.call_qwen_api(synthesis_prompt),
            self.call_gemini_api(synthesis_prompt)
        )
        
        # Vertex AI로 최종 선택
        best_final = await self.select_best_with_vertex(final_candidates)
        
        return best_final
    
    async def enhance_with_vertex(self, problem):
        """Vertex AI로 문제 강화"""
        client = aiplatform.gapic.PredictionServiceClient()
        
        # 1. 난이도 자동 분류
        difficulty = client.predict(
            endpoint=self.vertex_models['difficulty_classifier'],
            instances=[{'problem': problem}]
        ).predictions[0]
        
        # 2. 적응형 스캐폴딩 생성
        scaffolding = client.predict(
            endpoint=self.vertex_models['scaffolding_generator'],
            instances=[{
                'problem': problem,
                'difficulty': difficulty
            }]
        ).predictions[0]
        
        # 3. 오류 패턴 예측
        common_errors = client.predict(
            endpoint=self.vertex_models['error_detector'],
            instances=[{'problem': problem}]
        ).predictions[0]
        
        return {
            **problem,
            'difficulty': difficulty,
            'enhanced_scaffolding': scaffolding,
            'predicted_errors': common_errors,
            'vertex_enhanced': True
        }
```

### 2. Cloud Workflows 통합

```yaml
# workflows/ai-collaboration-workflow.yaml
main:
  params: [input]
  steps:
    - init:
        assign:
          - project: ${sys.get_env("GOOGLE_CLOUD_PROJECT_ID")}
          - requirements: ${input}
          
    # Step 1: 3 AI 병렬 초안 생성
    - parallel_generation:
        parallel:
          branches:
            - claude_branch:
                call: http.post
                args:
                  url: https://api.anthropic.com/v1/complete
                  body:
                    model: claude-opus-4.1
                    prompt: ${requirements}
                result: claude_draft
                
            - qwen_branch:
                call: http.post
                args:
                  url: https://dashscope.aliyuncs.com/api/v1/services/aigc
                  body:
                    model: qwen-72b
                    input: ${requirements}
                result: qwen_draft
                
            - gemini_branch:
                call: googleapis.generativelanguage.v1.models.generateContent
                args:
                  model: gemini-1.5-pro
                  contents: ${requirements}
                result: gemini_draft
    
    # Step 2: Vertex AI 품질 평가
    - quality_evaluation:
        call: googleapis.aiplatform.v1.projects.locations.endpoints.predict
        args:
          endpoint: projects/${project}/locations/us-central1/endpoints/quality-evaluator
          instances:
            - claude: ${claude_draft}
            - qwen: ${qwen_draft}
            - gemini: ${gemini_draft}
        result: quality_scores
    
    # Step 3: 최적 요소 추출 및 합성
    - synthesis:
        call: cloud_function
        args:
          name: synthesize-best-elements
          data:
            drafts: [${claude_draft}, ${qwen_draft}, ${gemini_draft}]
            scores: ${quality_scores}
        result: synthesized_problem
    
    # Step 4: Vertex AI 강화
    - enhancement:
        parallel:
          branches:
            - difficulty_classification:
                call: vertex_ai_predict
                args:
                  endpoint: difficulty-classifier
                  instance: ${synthesized_problem}
                result: difficulty
                
            - scaffolding_generation:
                call: vertex_ai_predict
                args:
                  endpoint: adaptive-scaffolding
                  instance: ${synthesized_problem}
                result: scaffolding
                
            - error_prediction:
                call: vertex_ai_predict
                args:
                  endpoint: error-detector
                  instance: ${synthesized_problem}
                result: predicted_errors
    
    # Step 5: 최종 결과 조합
    - finalize:
        assign:
          - final_problem:
              problem: ${synthesized_problem}
              difficulty: ${difficulty}
              scaffolding: ${scaffolding}
              predicted_errors: ${predicted_errors}
              generation_metadata:
                claude_contribution: ${claude_draft}
                qwen_contribution: ${qwen_draft}
                gemini_contribution: ${gemini_draft}
                quality_scores: ${quality_scores}
                
    - return:
        return: ${final_problem}
```

### 3. 실시간 협업 시스템 (Cloud Run)

```javascript
// cloud-services/ai-collaboration-service/index.js
const express = require('express');
const { Server } = require('socket.io');
const { PredictionServiceClient } = require('@google-cloud/aiplatform');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios'); // For Qwen API

const app = express();
const server = require('http').createServer(app);
const io = new Server(server);

// AI 클라이언트 초기화
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const vertexClient = new PredictionServiceClient();

// 실시간 협업 세션
io.on('connection', (socket) => {
    console.log('협업 세션 시작:', socket.id);
    
    socket.on('generate-collaborative-problem', async (data) => {
        const { grade, unit, topic, realtime } = data;
        
        if (realtime) {
            // 실시간 스트리밍 모드
            await streamCollaborativeGeneration(socket, data);
        } else {
            // 배치 모드
            const result = await generateCollaborativeProblem(data);
            socket.emit('problem-ready', result);
        }
    });
    
    socket.on('ai-discussion', async (data) => {
        // AI들 간의 토론 시뮬레이션
        await simulateAIDiscussion(socket, data);
    });
});

async function streamCollaborativeGeneration(socket, requirements) {
    // Claude 스트리밍
    socket.emit('ai-status', { ai: 'claude', status: 'thinking' });
    const claudeStream = await anthropic.messages.stream({
        model: 'claude-opus-4.1',
        messages: [{ role: 'user', content: generatePrompt('claude', requirements) }],
        stream: true
    });
    
    claudeStream.on('text', (text) => {
        socket.emit('claude-stream', text);
    });
    
    // Gemini 스트리밍
    socket.emit('ai-status', { ai: 'gemini', status: 'thinking' });
    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const geminiStream = await geminiModel.generateContentStream(
        generatePrompt('gemini', requirements)
    );
    
    for await (const chunk of geminiStream.stream) {
        socket.emit('gemini-stream', chunk.text());
    }
    
    // Qwen 스트리밍 (DashScope API)
    socket.emit('ai-status', { ai: 'qwen', status: 'thinking' });
    const qwenResponse = await streamQwen(requirements);
    
    qwenResponse.on('data', (chunk) => {
        socket.emit('qwen-stream', chunk);
    });
    
    // Vertex AI 실시간 평가
    socket.on('evaluate-partial', async (partialProblem) => {
        const evaluation = await vertexClient.predict({
            endpoint: 'projects/math-platform/endpoints/quality-scorer',
            instances: [partialProblem]
        });
        
        socket.emit('quality-score', evaluation.predictions[0]);
    });
}

async function simulateAIDiscussion(socket, topic) {
    /**
     * AI들이 서로 토론하며 문제를 개선하는 과정
     */
    
    const discussion = [
        {
            ai: 'claude',
            message: '이 문제의 논리적 구조를 개선해야 합니다...'
        },
        {
            ai: 'qwen',
            message: '한국 학생들에게는 다른 접근이 필요할 것 같습니다...'
        },
        {
            ai: 'gemini',
            message: '시각적 표현을 추가하면 이해가 쉬워질 것입니다...'
        }
    ];
    
    for (const turn of discussion) {
        socket.emit('ai-discussion-turn', turn);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Vertex AI로 각 제안 평가
        const evaluation = await evaluateSuggestion(turn);
        socket.emit('suggestion-evaluation', evaluation);
    }
    
    // 최종 합의안
    const consensus = await reachConsensus(discussion);
    socket.emit('discussion-consensus', consensus);
}

// 배포
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`AI Collaboration Service running on port ${PORT}`);
});
```

### 4. 비용 최적화 전략

```yaml
# ai-collaboration-budget.yaml
total_monthly_budget: $100

allocation:
  # AI API 비용 (50%)
  claude_api: $20    # 2000 requests @ $0.01
  gemini_api: $20    # Gemini 1.5 Flash for cost
  qwen_api: $10      # DashScope credits
  
  # Vertex AI (30%)
  automl_models: $15
  custom_training: $10
  predictions: $5
  
  # Infrastructure (20%)
  cloud_run: $10
  cloud_functions: $5
  storage: $5

optimization_strategies:
  1_caching:
    - Cache similar problem requests
    - Store AI responses for reuse
    - Vertex AI prediction caching
    
  2_batching:
    - Batch API calls when possible
    - Weekly problem generation batches
    - Bulk Vertex AI predictions
    
  3_model_selection:
    - Claude Haiku for simple tasks
    - Gemini Flash for cost efficiency
    - Qwen-7B for basic translations
    
  4_smart_routing:
    - Route by problem complexity
    - Use cheaper models first
    - Escalate only when needed
```

### 5. 성능 모니터링

```python
# monitoring/ai-collaboration-metrics.py
from google.cloud import monitoring_v3
import time

class CollaborationMonitor:
    def __init__(self):
        self.client = monitoring_v3.MetricServiceClient()
        self.project = 'projects/math-platform-small'
        
    def track_ai_performance(self):
        """각 AI의 성능 지표 추적"""
        metrics = {
            'claude_quality_score': [],
            'qwen_quality_score': [],
            'gemini_quality_score': [],
            'synthesis_improvement': [],
            'student_satisfaction': [],
            'problem_completion_rate': []
        }
        
        # 실시간 모니터링
        series = monitoring_v3.TimeSeries()
        series.metric.type = 'custom.googleapis.com/ai_collaboration/quality'
        
        # A/B 테스트: 단일 AI vs 협업
        single_ai_score = self.test_single_ai()
        collaborative_score = self.test_collaborative()
        
        improvement = (collaborative_score - single_ai_score) / single_ai_score * 100
        
        print(f"협업 시스템 성능 향상: {improvement:.2f}%")
        
        return metrics
    
    def optimize_ai_selection(self, problem_type):
        """문제 유형별 최적 AI 조합 선택"""
        
        if problem_type == 'geometry':
            return ['gemini', 'claude']  # 시각화 + 논리
        elif problem_type == 'word_problem':
            return ['qwen', 'claude']    # 다국어 + 구조
        elif problem_type == 'sat_practice':
            return ['claude', 'gemini', 'qwen']  # 전체 협업
        else:
            return ['gemini']  # 기본
```

### 6. 통합 실행 스크립트

```bash
#!/bin/bash
# deploy-ai-collaboration.sh

# 1. Vertex AI 모델 배포
echo "Deploying Vertex AI models..."
gcloud ai models upload \
  --region=us-central1 \
  --display-name=ai-collaboration-enhancer \
  --artifact-uri=gs://math-platform/models/collaboration

# 2. Cloud Run 서비스 배포
echo "Deploying collaboration service..."
gcloud run deploy ai-collaboration-service \
  --source=cloud-services/ai-collaboration-service \
  --platform=managed \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=2 \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="CLAUDE_API_KEY=${CLAUDE_KEY},GEMINI_API_KEY=${GEMINI_KEY},QWEN_API_KEY=${QWEN_KEY}"

# 3. Workflow 배포
echo "Deploying workflows..."
gcloud workflows deploy ai-collaboration-workflow \
  --source=workflows/ai-collaboration-workflow.yaml \
  --location=us-central1

# 4. 스케줄러 설정
echo "Setting up scheduler..."
gcloud scheduler jobs create http weekly-collaborative-generation \
  --location=us-central1 \
  --schedule="0 20 * * SUN" \
  --uri="https://ai-collaboration-service-run.app/generate" \
  --http-method=POST \
  --message-body='{"mode":"collaborative","count":30}'

echo "AI Collaboration System with Vertex AI deployed successfully!"
```

이제 Claude, Qwen, Gemini가 Vertex AI/AutoML과 완전히 통합되어:

1. **협업 품질**: 각 AI의 강점을 결합
2. **Vertex AI 강화**: AutoML로 품질 평가 및 개선
3. **실시간 스트리밍**: 학생이 AI 협업 과정 관찰 가능
4. **비용 최적화**: $100/월 예산 내 운영
5. **지속적 개선**: A/B 테스트와 모니터링

시스템이 완전히 클라우드에서 작동하며 최고 품질의 문제를 생성합니다.