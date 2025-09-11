// Qwen3-Max-Preview with Official DashScope API Authentication
// Alibaba Cloud Model Studio 공식 인증 방식

import OpenAI from 'openai';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ============= 인증 방식 선택 =============
// 방법 1: DashScope API Key (권장 - Model Studio에서 발급)
// 방법 2: AccessKey/Secret (일반 Alibaba Cloud 서비스용)

export class QwenAuthenticatedSystem {
    constructor() {
        // 방법 1: DashScope API Key 사용 (권장)
        if (process.env.DASHSCOPE_API_KEY) {
            this.initWithDashScopeKey();
        } 
        // 방법 2: AccessKey 기반 서명 생성
        else if (process.env.ALIBABA_ACCESS_KEY_ID) {
            this.initWithAccessKey();
        }
        // 방법 3: 직접 API Key 설정
        else {
            this.initWithDirectKey();
        }
        
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan.bold(' Qwen3-Max Authentication Configured'));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    }
    
    // 방법 1: DashScope API Key 사용 (권장)
    initWithDashScopeKey() {
        console.log(chalk.green('Using DashScope API Key authentication'));
        
        this.client = new OpenAI({
            apiKey: process.env.DASHSCOPE_API_KEY,
            baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
            defaultHeaders: {
                'Content-Type': 'application/json'
            }
        });
        
        this.authMethod = 'DashScope API Key';
    }
    
    // 방법 2: AccessKey 기반 서명 생성
    initWithAccessKey() {
        console.log(chalk.yellow('Using AccessKey signature authentication'));
        
        const accessKeyId = process.env.ALIBABA_ACCESS_KEY_ID || 'LTAI5tGKFLf3VhjBVAjUvUo4';
        const accessKeySecret = process.env.ALIBABA_ACCESS_KEY_SECRET || 'nnvPMQMDAyqT147jTxkQJdET36JUB9';
        
        // 서명 생성 (Alibaba Cloud 표준 방식)
        const timestamp = new Date().toISOString();
        const nonce = Math.random().toString(36).substring(7);
        const signatureString = `POST\napplication/json\n${timestamp}\n${nonce}\n/compatible-mode/v1/chat/completions`;
        
        const signature = crypto
            .createHmac('sha256', accessKeySecret)
            .update(signatureString)
            .digest('base64');
        
        // API 키 형식으로 변환
        const apiKey = `${accessKeyId}:${signature}`;
        
        this.client = new OpenAI({
            apiKey: apiKey,
            baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
            defaultHeaders: {
                'X-DashScope-AccessKeyId': accessKeyId,
                'X-DashScope-Signature': signature,
                'X-DashScope-SignatureNonce': nonce,
                'X-DashScope-Timestamp': timestamp
            }
        });
        
        this.authMethod = 'AccessKey Signature';
    }
    
    // 방법 3: 직접 API Key 설정
    initWithDirectKey() {
        console.log(chalk.blue('Using direct API configuration'));
        
        // DashScope에서 직접 발급받은 API Key 사용
        // 형식: sk-xxxxxxxxxxxxxxxxxxxxxxxx
        const directApiKey = 'sk-your-dashscope-api-key-here';
        
        this.client = new OpenAI({
            apiKey: directApiKey,
            baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
        });
        
        this.authMethod = 'Direct API Key';
    }
    
    // API 호출 테스트
    async testConnection() {
        console.log(chalk.yellow('\n🔍 Testing API connection...'));
        
        try {
            const response = await this.client.chat.completions.create({
                model: 'qwen3-max-preview',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Say "Hello" in one word.' }
                ],
                max_tokens: 10
            });
            
            console.log(chalk.green('✅ API connection successful!'));
            console.log(chalk.gray(`Response: ${response.choices[0].message.content}`));
            console.log(chalk.gray(`Auth Method: ${this.authMethod}`));
            return true;
        } catch (error) {
            console.log(chalk.red('❌ API connection failed'));
            console.log(chalk.red(`Error: ${error.message}`));
            
            // 상세 에러 분석
            if (error.message.includes('401')) {
                console.log(chalk.yellow('\n💡 Authentication Error Solutions:'));
                console.log(chalk.gray('1. Get DashScope API Key from: https://dashscope.console.aliyun.com/api-key'));
                console.log(chalk.gray('2. Set environment variable: DASHSCOPE_API_KEY=sk-xxxxx'));
                console.log(chalk.gray('3. Or use AccessKey method with proper signature'));
            }
            
            return false;
        }
    }
    
    // HTTP 직접 호출 방식 (대안)
    async directHttpCall(prompt) {
        console.log(chalk.yellow('\n📡 Trying direct HTTP call...'));
        
        const accessKeyId = process.env.ALIBABA_ACCESS_KEY_ID || 'LTAI5tGKFLf3VhjBVAjUvUo4';
        const accessKeySecret = process.env.ALIBABA_ACCESS_KEY_SECRET || 'nnvPMQMDAyqT147jTxkQJdET36JUB9';
        
        // HTTP 서명 생성
        const timestamp = new Date().toISOString();
        const nonce = Math.random().toString(36).substring(7);
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessKeyId}:${accessKeySecret}`, // 간단한 방식
            'X-DashScope-AccessKeyId': accessKeyId,
            'X-DashScope-Timestamp': timestamp,
            'X-DashScope-SignatureNonce': nonce
        };
        
        const body = {
            model: 'qwen3-max-preview',
            input: {
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: prompt }
                ]
            },
            parameters: {
                max_tokens: 1000,
                temperature: 0.7
            }
        };
        
        try {
            const response = await axios.post(
                'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                body,
                { headers }
            );
            
            console.log(chalk.green('✅ Direct HTTP call successful!'));
            return response.data;
        } catch (error) {
            console.log(chalk.red('❌ Direct HTTP call failed'));
            console.log(chalk.red(`Error: ${error.response?.data?.message || error.message}`));
            return null;
        }
    }
}

// 메인 테스트 함수
async function main() {
    console.log(chalk.magenta.bold('\n🚀 Qwen3-Max-Preview Authentication Test'));
    console.log(chalk.gray('Testing multiple authentication methods\n'));
    
    const system = new QwenAuthenticatedSystem();
    
    // 1. OpenAI SDK 방식 테스트
    const sdkSuccess = await system.testConnection();
    
    // 2. 직접 HTTP 호출 테스트 (SDK 실패시)
    if (!sdkSuccess) {
        console.log(chalk.yellow('\n💡 Trying alternative authentication...'));
        const httpResult = await system.directHttpCall('Hello, test');
        
        if (httpResult) {
            console.log(chalk.green('Alternative method succeeded!'));
        }
    }
    
    // 3. 설정 가이드 출력
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan.bold(' Authentication Setup Guide'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    console.log(chalk.white('\n📋 Method 1: DashScope API Key (Recommended)'));
    console.log(chalk.gray('1. Visit: https://dashscope.console.aliyun.com/'));
    console.log(chalk.gray('2. Create an API Key (format: sk-xxxxxxxxxx)'));
    console.log(chalk.gray('3. Add to .env: DASHSCOPE_API_KEY=sk-your-key'));
    
    console.log(chalk.white('\n📋 Method 2: AccessKey (Your Current Keys)'));
    console.log(chalk.gray('AccessKeyId: LTAI5tGKFLf3VhjBVAjUvUo4'));
    console.log(chalk.gray('AccessKeySecret: nnvPMQMDAyqT147jTxkQJdET36JUB9'));
    console.log(chalk.gray('Note: May need additional permissions for Model Studio'));
    
    console.log(chalk.white('\n📋 Method 3: HTTP Direct Call'));
    console.log(chalk.gray('Use DashScope REST API directly with proper headers'));
    
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

// Export for use
export default QwenAuthenticatedSystem;

// 직접 실행시 테스트
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
