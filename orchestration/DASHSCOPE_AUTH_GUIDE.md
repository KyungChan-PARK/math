# 🔐 Alibaba Cloud DashScope 공식 인증 가이드

## ⚠️ 중요: AccessKey vs API Key 차이점

귀하가 제공하신 인증 정보:
- **AccessKeyId**: [YOUR_ACCESS_KEY_ID]  
- **AccessKeySecret**: [YOUR_ACCESS_KEY_SECRET]

이는 **Alibaba Cloud 일반 서비스용 AccessKey**입니다. 하지만 **Model Studio (DashScope)**는 별도의 **API Key**가 필요합니다.

## 📋 올바른 인증 설정 방법

### Step 1: DashScope API Key 발급

1. **DashScope Console 접속**
   - 싱가포르: https://dashscope-intl.console.aliyun.com/
   - 중국: https://dashscope.console.aliyun.com/

2. **로그인**
   - Alibaba Cloud 계정으로 로그인
   - AccessKey와 동일한 계정 사용

3. **API Key 생성**
   - 좌측 메뉴에서 "API-KEY" 클릭
   - "Create API Key" 버튼 클릭
   - API Key 복사 (형식: `sk-xxxxxxxxxxxxxxxxxxxxxxxx`)

### Step 2: 환경 변수 설정

#### Windows (CMD)
```cmd
set DASHSCOPE_API_KEY=sk-your-api-key-here
```

#### Windows (PowerShell)
```powershell
$env:DASHSCOPE_API_KEY="sk-your-api-key-here"
```

#### .env 파일
```env
# 기존 AccessKey (일반 Alibaba Cloud 서비스용)
ALIBABA_ACCESS_KEY_ID=[YOUR_ACCESS_KEY_ID]
ALIBABA_ACCESS_KEY_SECRET=[YOUR_ACCESS_KEY_SECRET]

# DashScope API Key (Model Studio용) - 이것이 필요!
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: SDK 설치

#### Node.js
```bash
npm install openai
```

#### Python
```bash
pip install openai
pip install dashscope
```

## 💻 코드 예제

### Node.js (OpenAI SDK)
```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,  // sk-xxxxx 형식
    baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
});

const response = await client.chat.completions.create({
    model: 'qwen3-max-preview',
    messages: [
        { role: 'user', content: 'Hello!' }
    ]
});
```

### Python (OpenAI SDK)
```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.getenv("DASHSCOPE_API_KEY"),
    base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
)

response = client.chat.completions.create(
    model="qwen3-max-preview",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)
```

### Python (DashScope SDK)
```python
import dashscope

dashscope.api_key = "sk-your-api-key"

from dashscope import Generation

response = Generation.call(
    model="qwen3-max-preview",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)
```

### cURL (Direct HTTP)
```bash
curl -X POST https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions \
  -H "Authorization: Bearer sk-your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-max-preview",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## 🔍 인증 방식 비교

| 항목 | AccessKey | DashScope API Key |
|------|-----------|-------------------|
| **형식** | LTAI로 시작 | sk-로 시작 |
| **용도** | 일반 Alibaba Cloud 서비스 | Model Studio 전용 |
| **발급처** | RAM Console | DashScope Console |
| **사용 방법** | 서명 생성 필요 | 직접 Bearer 토큰으로 사용 |
| **SDK 지원** | 복잡한 서명 과정 | OpenAI 호환 간단 사용 |

## ❗ 자주 발생하는 오류

### Error: 401 Incorrect API key provided
- **원인**: AccessKey를 API Key로 사용
- **해결**: DashScope Console에서 API Key 발급

### Error: Invalid API-key provided
- **원인**: 잘못된 형식의 키 사용
- **해결**: `sk-`로 시작하는 올바른 API Key 사용

### Error: Model not found
- **원인**: 잘못된 모델명
- **해결**: `qwen3-max-preview` 사용 (대소문자 주의)

## 🚀 빠른 시작

1. **콘솔 접속**: https://dashscope-intl.console.aliyun.com/
2. **API Key 생성**: API-KEY 메뉴에서 생성
3. **테스트 실행**:
   ```bash
   export DASHSCOPE_API_KEY="sk-your-key"
   node test-qwen-auth.js
   ```

## 📞 지원

- **문서**: https://www.alibabacloud.com/help/en/model-studio/
- **API 참조**: https://dashscope.console.aliyun.com/api
- **모델 정보**: https://qwenlm.github.io/

## 💡 팁

1. **무료 할당량**: 신규 계정은 일정량의 무료 토큰 제공
2. **지역 선택**: 싱가포르 리전이 일반적으로 빠름
3. **모델 선택**: 
   - `qwen3-max-preview`: 최고 성능 (1T+ params)
   - `qwen-plus`: 균형잡힌 선택
   - `qwen-turbo`: 빠른 응답

---

*Last Updated: 2025-09-09*
*Version: 1.0*
