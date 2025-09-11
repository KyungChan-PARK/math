// Qwen3-Max-Preview 의존성 설치 스크립트
import { exec } from 'child_process';
import chalk from 'chalk';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function installDependencies() {
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.cyan.bold(' Installing Qwen3-Max Dependencies'));
    console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    const packages = [
        'openai',          // OpenAI 호환 클라이언트
        'crypto',          // 서명 생성용
        'axios',           // HTTP 요청용
        '@alicloud/openapi-client', // Alibaba Cloud SDK
        '@alicloud/bailian20231229', // Alibaba Model Studio SDK
    ];
    
    for (const pkg of packages) {
        try {
            console.log(chalk.yellow(`Installing ${pkg}...`));
            const { stdout, stderr } = await execAsync(`npm install ${pkg}`);
            if (stderr) {
                console.log(chalk.red(`Warning: ${stderr}`));
            }
            console.log(chalk.green(`✓ ${pkg} installed`));
        } catch (error) {
            console.log(chalk.red(`Error installing ${pkg}: ${error.message}`));
        }
    }
    
    console.log(chalk.green('\n✅ All dependencies installed successfully!'));
}

installDependencies().catch(console.error);
