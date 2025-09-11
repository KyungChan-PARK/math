"""
Qwen3-Max-Preview Authentication with DashScope SDK
Alibaba Cloud Model Studio 공식 Python 인증
"""

import os
import hmac
import hashlib
import base64
import datetime
import json
import requests
from typing import Optional, Dict, Any

# OpenAI SDK (권장)
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("OpenAI SDK not installed. Run: pip install openai")

# DashScope SDK (공식)
try:
    import dashscope
    from dashscope import Generation
    DASHSCOPE_AVAILABLE = True
except ImportError:
    DASHSCOPE_AVAILABLE = False
    print("DashScope SDK not installed. Run: pip install dashscope")


class QwenAuthenticationSystem:
    """Qwen3-Max-Preview 인증 시스템"""
    
    def __init__(self):
        # 환경 변수에서 인증 정보 로드
        self.dashscope_api_key = os.getenv("DASHSCOPE_API_KEY")
        self.access_key_id = os.getenv("ALIBABA_ACCESS_KEY_ID", "LTAI5tGKFLf3VhjBVAjUvUo4")
        self.access_key_secret = os.getenv("ALIBABA_ACCESS_KEY_SECRET", "nnvPMQMDAyqT147jTxkQJdET36JUB9")
        
        # 지역별 엔드포인트
        self.endpoints = {
            "singapore": "https://dashscope-intl.aliyuncs.com",
            "beijing": "https://dashscope.aliyuncs.com"
        }
        
        self.region = "singapore"  # 기본값
        self.model = "qwen3-max-preview"
        
        print("=" * 50)
        print(" Qwen3-Max-Preview Authentication System")
        print("=" * 50)
    
    # ========== 방법 1: OpenAI SDK 사용 (권장) ==========
    def init_openai_client(self, api_key: Optional[str] = None) -> Optional[OpenAI]:
        """OpenAI 호환 클라이언트 초기화"""
        if not OPENAI_AVAILABLE:
            print("❌ OpenAI SDK not available")
            return None
        
        api_key = api_key or self.dashscope_api_key
        if not api_key:
            print("❌ No API key provided")
            return None
        
        client = OpenAI(
            api_key=api_key,
            base_url=f"{self.endpoints[self.region]}/compatible-mode/v1"
        )
        
        print(f"✅ OpenAI client initialized (Region: {self.region})")
        return client
    
    def test_openai_sdk(self) -> bool:
        """OpenAI SDK 테스트"""
        print("\n🔍 Testing OpenAI SDK...")
        
        client = self.init_openai_client()
        if not client:
            return False
        
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Say hello in one word."}
                ],
                max_tokens=10
            )
            
            print(f"✅ Success! Response: {response.choices[0].message.content}")
            return True
            
        except Exception as e:
            print(f"❌ Failed: {str(e)}")
            return False
    
    # ========== 방법 2: DashScope SDK 사용 (공식) ==========
    def init_dashscope(self, api_key: Optional[str] = None) -> bool:
        """DashScope SDK 초기화"""
        if not DASHSCOPE_AVAILABLE:
            print("❌ DashScope SDK not available")
            return False
        
        api_key = api_key or self.dashscope_api_key
        if not api_key:
            print("❌ No API key provided")
            return False
        
        dashscope.api_key = api_key
        print(f"✅ DashScope SDK initialized")
        return True
    
    def test_dashscope_sdk(self) -> bool:
        """DashScope SDK 테스트"""
        print("\n🔍 Testing DashScope SDK...")
        
        if not self.init_dashscope():
            return False
        
        try:
            response = Generation.call(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Say hello in one word."}
                ]
            )
            
            if response.status_code == 200:
                print(f"✅ Success! Response: {response.output.text}")
                return True
            else:
                print(f"❌ Failed with status: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Failed: {str(e)}")
            return False
    
    # ========== 방법 3: HTTP 직접 호출 ==========
    def generate_signature(self, method: str, path: str, headers: Dict) -> str:
        """Alibaba Cloud 서명 생성"""
        timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        nonce = str(os.urandom(16).hex())
        
        # 서명 문자열 생성
        sign_str = f"{method}\n{path}\n{timestamp}\n{nonce}"
        
        # HMAC-SHA256 서명
        signature = base64.b64encode(
            hmac.new(
                self.access_key_secret.encode(),
                sign_str.encode(),
                hashlib.sha256
            ).digest()
        ).decode()
        
        return signature, timestamp, nonce
    
    def test_http_direct(self) -> bool:
        """HTTP 직접 호출 테스트"""
        print("\n🔍 Testing Direct HTTP...")
        
        # 서명 생성
        signature, timestamp, nonce = self.generate_signature(
            "POST",
            "/api/v1/services/aigc/text-generation/generation",
            {}
        )
        
        # 헤더 구성
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.dashscope_api_key or f'{self.access_key_id}:{signature}'}",
            "X-DashScope-AccessKeyId": self.access_key_id,
            "X-DashScope-Signature": signature,
            "X-DashScope-SignatureNonce": nonce,
            "X-DashScope-Timestamp": timestamp
        }
        
        # 요청 본문
        body = {
            "model": self.model,
            "input": {
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": "Say hello in one word."}
                ]
            },
            "parameters": {
                "max_tokens": 10
            }
        }
        
        try:
            response = requests.post(
                f"{self.endpoints[self.region]}/api/v1/services/aigc/text-generation/generation",
                headers=headers,
                json=body,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Success! Response: {result.get('output', {}).get('text', 'No text')}")
                return True
            else:
                print(f"❌ Failed with status: {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Failed: {str(e)}")
            return False
    
    # ========== 통합 테스트 ==========
    def test_all_methods(self):
        """모든 인증 방법 테스트"""
        print("\n" + "=" * 50)
        print(" Testing All Authentication Methods")
        print("=" * 50)
        
        results = {
            "OpenAI SDK": self.test_openai_sdk(),
            "DashScope SDK": self.test_dashscope_sdk(),
            "Direct HTTP": self.test_http_direct()
        }
        
        print("\n" + "=" * 50)
        print(" Test Results Summary")
        print("=" * 50)
        
        for method, success in results.items():
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{method:15} : {status}")
        
        # 설정 가이드
        if not any(results.values()):
            self.print_setup_guide()
    
    def print_setup_guide(self):
        """설정 가이드 출력"""
        print("\n" + "=" * 50)
        print(" Setup Guide")
        print("=" * 50)
        
        print("\n📋 Step 1: Get DashScope API Key")
        print("1. Visit: https://dashscope.console.aliyun.com/")
        print("2. Register/Login with Alibaba Cloud account")
        print("3. Navigate to API-KEY section")
        print("4. Create new API Key (format: sk-xxxxxxxxxx)")
        
        print("\n📋 Step 2: Install SDK")
        print("pip install openai        # For OpenAI compatible")
        print("pip install dashscope     # For DashScope official")
        
        print("\n📋 Step 3: Set Environment Variables")
        print("export DASHSCOPE_API_KEY='sk-your-api-key'")
        print("# OR in Python:")
        print("os.environ['DASHSCOPE_API_KEY'] = 'sk-your-api-key'")
        
        print("\n📋 Your AccessKey Credentials:")
        print(f"AccessKeyId: {self.access_key_id}")
        print(f"AccessKeySecret: {self.access_key_secret[:10]}...")
        print("Note: These may need Model Studio permissions")


# ========== 사용 예제 ==========
def example_usage():
    """사용 예제"""
    
    # 1. OpenAI SDK 방식 (권장)
    if OPENAI_AVAILABLE:
        print("\n🎯 Example 1: OpenAI SDK")
        client = OpenAI(
            api_key=os.getenv("DASHSCOPE_API_KEY"),
            base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
        )
        
        response = client.chat.completions.create(
            model="qwen3-max-preview",
            messages=[
                {"role": "user", "content": "What is 2+2?"}
            ]
        )
        print(f"Answer: {response.choices[0].message.content}")
    
    # 2. DashScope SDK 방식
    if DASHSCOPE_AVAILABLE:
        print("\n🎯 Example 2: DashScope SDK")
        dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
        
        response = Generation.call(
            model="qwen3-max-preview",
            messages=[
                {"role": "user", "content": "What is 2+2?"}
            ]
        )
        
        if response.status_code == 200:
            print(f"Answer: {response.output.text}")


if __name__ == "__main__":
    # 테스트 실행
    system = QwenAuthenticationSystem()
    system.test_all_methods()
    
    # 사용 예제 (SDK 설치시)
    # example_usage()
