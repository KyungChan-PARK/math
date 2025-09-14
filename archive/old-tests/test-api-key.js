// API Key Test Script
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import chalk from 'chalk';

// .env 파일 로드
dotenv.config();

console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.cyan.bold(' API Key Test'));
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

// API 키 확인
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
    console.log(chalk.red('❌ ANTHROPIC_API_KEY not found in environment'));
    process.exit(1);
}

console.log(chalk.green(`✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`));

// Anthropic 클라이언트 생성
const anthropic = new Anthropic({
    apiKey: apiKey
});

// 간단한 테스트 호출
async function testAPI() {
    try {
        console.log(chalk.yellow('\n📡 Testing API connection...'));
        
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 100,
            messages: [{
                role: 'user',
                content: 'Say "API test successful" if you can read this.'
            }]
        });
        
        console.log(chalk.green('✅ API Connection Successful!'));
        console.log(chalk.blue('Response:', response.content[0].text));
        
        return true;
    } catch (error) {
        console.log(chalk.red('❌ API Error:'));
        console.log(chalk.red(error.message));
        
        if (error.status === 401) {
            console.log(chalk.yellow('\n⚠️  The API key appears to be invalid or expired.'));
            console.log(chalk.yellow('Please check your API key at: https://console.anthropic.com/'));
        }
        
        return false;
    }
}

// 테스트 실행
testAPI().then(success => {
    if (success) {
        console.log(chalk.green('\n✨ API Key is valid and working!'));
    } else {
        console.log(chalk.red('\n❌ API Key validation failed.'));
    }
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
});
