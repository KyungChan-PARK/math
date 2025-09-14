# 수정된 AI API 비용 최적화 전략

## 실제 API 비용 현황

### 1. 현재 사용 가능한 무료/저비용 리소스

```yaml
ai_apis:
  claude:
    service: Claude Code CLI
    cost: $0  # Claude Max x20 구독으로 무제한 사용
    model: claude-opus-4.1
    notes: "현재 CLI로 무료 사용 중"
    
  qwen:
    service: DashScope API
    cost: $0  # Qwen3-Max-Preview 무료
    model: qwen3-max-preview
    notes: "프리뷰 기간 무료"
    limits: "일일 한도 있음"
    
  gemini:
    service: Google AI Studio
    cost: $0  # Gemini 1.5 Flash 무료 티어
    model: gemini-1.5-flash
    free_tier:
      - "15 RPM (requests per minute)"
      - "1 million TPM (tokens per minute)"
      - "1,500 requests per day"
    notes: "무료 티어로 충분"
```

### 2. 수정된 월간 예산 할당 ($100)

```yaml
revised_monthly_budget: $100

allocation:
  # AI API 비용: $0 (모두 무료!)
  ai_apis:
    claude: $0    # Claude Code CLI (구독)
    qwen: $0      # Qwen3-Max-Preview (무료)
    gemini: $0    # Gemini 1.5 Flash (무료 티어)
    subtotal: $0
  
  # Vertex AI/AutoML에 더 많은 예산 할당 가능 (60%)
  vertex_ai: $60
    automl_models: $20
    custom_training: $15
    predictions: $10
    matching_engine: $5
    experiments: $10
  
  # Google Cloud Infrastructure (40%)
  infrastructure: $40
    cloud_run: $10
    cloud_functions: $10
    firestore: $10
    cloud_storage: $5
    cloud_scheduler: $2
    monitoring: $3

total: $100
savings: "AI API 비용 $0으로 Vertex AI에 더 투자 가능"
```

### 3. 무료 API 활용 전략

```python
# free-api-optimization.py
class FreeAPIOptimizer:
    """
    무료 API 리소스 최적 활용
    """
    
    def __init__(self):
        self.apis = {
            'claude': {
                'available': True,  # CLI 사용 가능
                'rate_limit': None,  # 무제한
                'cost': 0
            },
            'qwen': {
                'available': True,
                'rate_limit': 1000,  # 일일 한도 (예상)
                'daily_usage': 0,
                'cost': 0
            },
            'gemini': {
                'available': True,
                'rate_limit': {
                    'rpm': 15,
                    'tpm': 1000000,
                    'daily': 1500
                },
                'daily_usage': 0,
                'cost': 0
            }
        }
    
    async def smart_api_selection(self, task_type, priority):
        """
        작업 유형과 우선순위에 따른 API 선택
        """
        
        if priority == 'high_quality':
            # 고품질 필요시 Claude 우선
            if self.apis['claude']['available']:
                return 'claude'
        
        elif priority == 'multilingual':
            # 다국어 필요시 Qwen 우선
            if self.check_qwen_quota():
                return 'qwen'
        
        elif priority == 'visualization':
            # 시각화 필요시 Gemini 우선
            if self.check_gemini_quota():
                return 'gemini'
        
        # 기본: 사용 가능한 것 중 선택
        return self.get_available_api()
    
    def check_qwen_quota(self):
        """Qwen 일일 한도 확인"""
        return self.apis['qwen']['daily_usage'] < self.apis['qwen']['rate_limit']
    
    def check_gemini_quota(self):
        """Gemini 무료 티어 한도 확인"""
        limits = self.apis['gemini']['rate_limit']
        usage = self.apis['gemini']['daily_usage']
        return usage < limits['daily']
```

### 4. Claude Code CLI 통합

```javascript
// claude-cli-integration.js
const { spawn } = require('child_process');

class ClaudeCLIIntegration {
    /**
     * Claude Code CLI를 통한 무료 API 사용
     */
    
    async generateWithClaude(prompt) {
        return new Promise((resolve, reject) => {
            const claude = spawn('claude', [
                '--model', 'opus',
                '--max-tokens', '2000',
                '--temperature', '0.7'
            ]);
            
            // 프롬프트 전송
            claude.stdin.write(prompt);
            claude.stdin.end();
            
            let output = '';
            
            claude.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            claude.on('close', (code) => {
                if (code === 0) {
                    resolve({
                        response: output,
                        cost: 0,  // 무료!
                        model: 'claude-opus-4.1'
                    });
                } else {
                    reject(new Error(`Claude CLI exited with code ${code}`));
                }
            });
        });
    }
    
    async streamWithClaude(prompt, onChunk) {
        const claude = spawn('claude', [
            '--model', 'opus',
            '--stream'
        ]);
        
        claude.stdin.write(prompt);
        claude.stdin.end();
        
        claude.stdout.on('data', (chunk) => {
            onChunk(chunk.toString());
        });
        
        return new Promise((resolve) => {
            claude.on('close', () => resolve());
        });
    }
}
```

### 5. Qwen3-Max-Preview 무료 활용

```python
# qwen-free-usage.py
import requests
from datetime import datetime, timedelta

class QwenFreeAPI:
    """
    Qwen3-Max-Preview 무료 사용
    """
    
    def __init__(self):
        self.api_key = os.getenv('DASHSCOPE_API_KEY')
        self.endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
        self.daily_usage = 0
        self.last_reset = datetime.now()
        
    async def generate(self, prompt):
        """
        Qwen3-Max-Preview로 무료 생성
        """
        
        # 일일 한도 리셋 체크
        if datetime.now() - self.last_reset > timedelta(days=1):
            self.daily_usage = 0
            self.last_reset = datetime.now()
        
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': 'qwen3-max-preview',  # 무료 모델
            'input': {
                'messages': [
                    {'role': 'user', 'content': prompt}
                ]
            },
            'parameters': {
                'result_format': 'message'
            }
        }
        
        response = requests.post(
            self.endpoint,
            headers=headers,
            json=data
        )
        
        self.daily_usage += 1
        
        return {
            'response': response.json()['output']['text'],
            'cost': 0,  # 무료!
            'model': 'qwen3-max-preview',
            'usage_today': self.daily_usage
        }
```

### 6. 절약된 예산 재배치

```yaml
# budget-reallocation.yaml
original_plan:
  ai_apis: $50  # 원래 계획
  vertex_ai: $30
  infrastructure: $20

revised_plan:
  ai_apis: $0   # 모두 무료!
  vertex_ai: $60  # 2배 증액 가능
  infrastructure: $40  # 2배 증액 가능

benefits:
  - "더 많은 AutoML 모델 학습 가능"
  - "더 정교한 개인화 모델 구축"
  - "더 많은 A/B 테스트 실행"
  - "더 빠른 응답 시간 (더 많은 인스턴스)"
  - "더 많은 데이터 저장 및 분석"

vertex_ai_enhancement:
  before:
    automl_models: 2
    training_hours: 10
    predictions: 10000
    
  after:
    automl_models: 5  # 2.5배 증가
    training_hours: 25  # 2.5배 증가
    predictions: 25000  # 2.5배 증가
```

### 7. 최적화된 아키텍처

```python
# optimized-architecture.py
class OptimizedAISystem:
    """
    무료 AI API + 강화된 Vertex AI
    """
    
    def __init__(self):
        # 무료 AI APIs
        self.claude = ClaudeCLI()  # $0
        self.qwen = QwenFreeAPI()  # $0
        self.gemini = GeminiFree()  # $0
        
        # 강화된 Vertex AI (예산 2배)
        self.vertex = EnhancedVertexAI(budget=60)
        
    async def generate_problem(self, requirements):
        """
        비용 $0으로 고품질 문제 생성
        """
        
        # 1. 무료 AI로 초안 생성
        drafts = await asyncio.gather(
            self.claude.generate(requirements),  # 무료
            self.qwen.generate(requirements),    # 무료
            self.gemini.generate(requirements)   # 무료
        )
        
        # 2. 강화된 Vertex AI로 품질 평가
        quality_scores = await self.vertex.evaluate_quality(drafts)
        
        # 3. 더 많은 AutoML 모델로 개선
        enhanced = await self.vertex.enhance_with_models([
            'difficulty_classifier_v2',  # 새로 학습
            'quality_evaluator_v2',      # 새로 학습
            'scaffolding_generator_v2',  # 새로 학습
            'error_predictor_v2',        # 새로 학습
            'personalization_model'      # 새로 추가
        ], drafts)
        
        return {
            'problem': enhanced,
            'cost': 0,  # AI API 비용 없음!
            'quality': 'premium'  # Vertex AI 강화
        }
```

### 8. 무료 리소스 모니터링

```javascript
// free-resource-monitor.js
class FreeResourceMonitor {
    constructor() {
        this.usage = {
            claude: { calls: 0, status: 'unlimited' },
            qwen: { calls: 0, limit: 1000, status: 'available' },
            gemini: { calls: 0, limit: 1500, status: 'available' }
        };
    }
    
    async checkAvailability() {
        // Claude: 항상 사용 가능 (CLI)
        this.usage.claude.status = 'unlimited';
        
        // Qwen: 일일 한도 체크
        if (this.usage.qwen.calls >= this.usage.qwen.limit) {
            this.usage.qwen.status = 'quota_exceeded';
            console.log('Qwen 일일 한도 도달, 내일 리셋');
        }
        
        // Gemini: 무료 티어 한도 체크
        if (this.usage.gemini.calls >= this.usage.gemini.limit) {
            this.usage.gemini.status = 'quota_exceeded';
            console.log('Gemini 일일 한도 도달, 내일 리셋');
        }
        
        return this.usage;
    }
    
    async smartRoute(taskType) {
        const availability = await this.checkAvailability();
        
        // 우선순위에 따른 라우팅
        if (taskType === 'high_quality') {
            return 'claude';  // 무제한
        } else if (taskType === 'multilingual' && availability.qwen.status === 'available') {
            return 'qwen';
        } else if (taskType === 'visual' && availability.gemini.status === 'available') {
            return 'gemini';
        } else {
            return 'claude';  // 기본값
        }
    }
}
```

### 9. 실제 월간 비용 요약

```yaml
actual_monthly_cost:
  # AI APIs (전부 무료)
  claude_cli: $0
  qwen_preview: $0
  gemini_free: $0
  
  # Vertex AI (강화)
  vertex_ai_total: $60
    automl_training: $20
    automl_prediction: $15
    custom_models: $15
    experiments: $10
  
  # Infrastructure
  gcp_services: $40
    cloud_run: $10
    cloud_functions: $10
    firestore: $10
    storage: $5
    other: $5
  
  grand_total: $100
  
  savings_vs_original: "$50 saved on AI APIs"
  reinvested_in: "Vertex AI quality enhancement"
```

이제 정확한 비용 구조입니다:
- **Claude**: Claude Code CLI로 무료
- **Qwen**: Qwen3-Max-Preview로 무료  
- **Gemini**: 1.5 Flash 무료 티어
- **절약한 $50**: Vertex AI 품질 향상에 재투자

더 좋은 품질의 문제를 무료로 생성할 수 있습니다!