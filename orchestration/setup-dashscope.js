// DashScope Setup Helper
// API Key 발급 페이지 자동 열기 및 설정 가이드

import { exec } from 'child_process';
import chalk from 'chalk';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan.bold(' DashScope API Key Setup Assistant'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    console.log(chalk.yellow('\n현재 상황:'));
    console.log(chalk.gray('• AccessKeyId: LTAI5tGKFLf3VhjBVAjUvUo4 (일반 서비스용)'));
    console.log(chalk.gray('• AccessKeySecret: nnvPMQMDAyqT147jTxkQJdET36JUB9'));
    console.log(chalk.red('• DashScope API Key: 없음 (Model Studio용 필요)'));
    
    console.log(chalk.yellow('\n필요한 작업:'));
    console.log(chalk.white('1. DashScope Console에서 API Key 발급'));
    console.log(chalk.white('2. .env 파일에 API Key 추가'));
    
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    // Step 1: 브라우저 열기
    const openBrowser = await question(chalk.yellow('\n🌐 DashScope Console을 브라우저에서 열까요? (y/n): '));
    
    if (openBrowser.toLowerCase() === 'y') {
        const region = await question(chalk.yellow('지역 선택 (1: 싱가포르, 2: 중국): '));
        const url = region === '2' 
            ? 'https://dashscope.console.aliyun.com/api-key'
            : 'https://dashscope-intl.console.aliyun.com/api-key';
        
        console.log(chalk.green(`\n✅ 브라우저 열기: ${url}`));
        
        // Windows
        exec(`start ${url}`, (err) => {
            if (err) {
                console.log(chalk.gray('브라우저를 수동으로 열어주세요.'));
            }
        });
        
        console.log(chalk.yellow('\n📋 브라우저에서 할 일:'));
        console.log(chalk.gray('1. Alibaba Cloud 계정으로 로그인'));
        console.log(chalk.gray('2. "Create API Key" 버튼 클릭'));
        console.log(chalk.gray('3. 생성된 API Key 복사 (sk-xxxxx 형식)'));
    }
    
    // Step 2: API Key 입력
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    const apiKey = await question(chalk.yellow('\n🔑 발급받은 API Key를 입력하세요 (sk-로 시작): '));
    
    if (!apiKey.startsWith('sk-')) {
        console.log(chalk.red('❌ 올바른 API Key 형식이 아닙니다. sk-로 시작해야 합니다.'));
        rl.close();
        return;
    }
    
    // Step 3: .env 파일 업데이트
    const updateEnv = await question(chalk.yellow('\n📝 .env 파일을 자동으로 업데이트할까요? (y/n): '));
    
    if (updateEnv.toLowerCase() === 'y') {
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = '';
        
        try {
            envContent = fs.readFileSync(envPath, 'utf8');
        } catch (err) {
            console.log(chalk.yellow('기존 .env 파일이 없습니다. 새로 생성합니다.'));
        }
        
        // DASHSCOPE_API_KEY가 이미 있는지 확인
        if (envContent.includes('DASHSCOPE_API_KEY=')) {
            // 기존 키 업데이트
            envContent = envContent.replace(
                /DASHSCOPE_API_KEY=.*/,
                `DASHSCOPE_API_KEY=${apiKey}`
            );
            console.log(chalk.green('✅ 기존 API Key를 업데이트했습니다.'));
        } else {
            // 새로 추가
            envContent += `\n# DashScope API Key (Model Studio)\nDASHSCOPE_API_KEY=${apiKey}\n`;
            console.log(chalk.green('✅ API Key를 추가했습니다.'));
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log(chalk.green(`✅ .env 파일 업데이트 완료: ${envPath}`));
    }
    
    // Step 4: 테스트
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    const runTest = await question(chalk.yellow('\n🧪 API 연결을 테스트할까요? (y/n): '));
    
    if (runTest.toLowerCase() === 'y') {
        console.log(chalk.blue('\n테스트 중...'));
        
        // 환경 변수 설정
        process.env.DASHSCOPE_API_KEY = apiKey;
        
        // 테스트 코드 실행
        try {
            const { default: OpenAI } = await import('openai');
            
            const client = new OpenAI({
                apiKey: apiKey,
                baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
            });
            
            const response = await client.chat.completions.create({
                model: 'qwen3-max-preview',
                messages: [
                    { role: 'user', content: 'Say "Hello" in one word.' }
                ],
                max_tokens: 10
            });
            
            console.log(chalk.green('\n✅ 연결 성공!'));
            console.log(chalk.gray(`응답: ${response.choices[0].message.content}`));
            console.log(chalk.green('\n🎉 Qwen3-Max-Preview를 사용할 준비가 완료되었습니다!'));
        } catch (error) {
            console.log(chalk.red('\n❌ 연결 실패:'));
            console.log(chalk.red(error.message));
            
            if (error.message.includes('401')) {
                console.log(chalk.yellow('\n💡 해결 방법:'));
                console.log(chalk.gray('1. API Key가 올바른지 확인하세요'));
                console.log(chalk.gray('2. DashScope Console에서 API Key를 다시 생성해보세요'));
            }
        }
    }
    
    // 완료
    console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green.bold(' 설정 완료!'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    console.log(chalk.white('\n다음 명령으로 서버를 시작하세요:'));
    console.log(chalk.gray('node qwen-orchestrator-75.js'));
    
    rl.close();
}

main().catch(error => {
    console.error(chalk.red('Error:'), error);
    rl.close();
});
