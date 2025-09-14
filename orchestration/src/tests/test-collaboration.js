// Test Claude-Qwen Collaboration System
import axios from 'axios';
import chalk from 'chalk';

const BASE_URL = 'http://localhost:8093';

async function testCollaboration() {
    console.log(chalk.magenta('╔══════════════════════════════════════════════╗'));
    console.log(chalk.magenta('║   Testing Claude-Qwen Collaboration System  ║'));
    console.log(chalk.magenta('╚══════════════════════════════════════════════╝'));
    
    // Test 1: 협업 분석
    console.log(chalk.yellow('\n📊 Test 1: Collaborative Problem Analysis'));
    try {
        const analysisResponse = await axios.post(`${BASE_URL}/api/collaborate/analyze`, {
            problem: 'After Effects에서 수학 그래프 애니메이션이 부자연스럽게 움직이는 문제'
        });
        
        console.log(chalk.green('✅ Analysis successful!'));
        console.log(chalk.blue('\nClaude Analysis:'));
        console.log(chalk.gray(JSON.stringify(analysisResponse.data.claudeAnalysis, null, 2).substring(0, 200) + '...'));
        console.log(chalk.blue('\nQwen Analysis:'));
        console.log(chalk.gray(JSON.stringify(analysisResponse.data.qwenAnalysis, null, 2).substring(0, 200) + '...'));
        console.log(chalk.yellow('\nPrimary Cause:'), analysisResponse.data.primaryCause || 'Synthesized');
        
    } catch (error) {
        console.log(chalk.red('❌ Analysis failed:'), error.message);
    }
    
    // Test 2: 협업 문제 해결
    console.log(chalk.yellow('\n🤝 Test 2: Full Collaborative Problem Solving'));
    try {
        const solveResponse = await axios.post(`${BASE_URL}/api/collaborate/solve`, {
            problem: '학생이 이차방정식의 그래프와 해를 동시에 이해하지 못하는 교육적 문제',
            includeSearch: false
        });
        
        console.log(chalk.green('✅ Collaborative solving successful!'));
        console.log(chalk.blue('\nModels involved:'), solveResponse.data.collaboration.models);
        console.log(chalk.blue('Method:'), solveResponse.data.collaboration.method);
        
        if (solveResponse.data.recommendation) {
            const rec = solveResponse.data.recommendation;
            console.log(chalk.yellow('\n🎯 Top Recommendation:'));
            if (rec.recommendations && rec.recommendations[0]) {
                console.log(chalk.white(`  Type: ${rec.recommendations[0].type}`));
                console.log(chalk.white(`  Approach: ${rec.recommendations[0].approach}`));
                console.log(chalk.white(`  Confidence: ${rec.recommendations[0].confidence}%`));
            }
        }
        
    } catch (error) {
        console.log(chalk.red('❌ Solving failed:'), error.message);
    }
    
    // Test 3: 수학 문제 협업 해결
    console.log(chalk.yellow('\n📐 Test 3: Math Problem with Collaboration'));
    try {
        const mathResponse = await axios.post(`${BASE_URL}/api/math/solve`, {
            problem: 'x² - 5x + 6 = 0의 해를 구하고 그래프로 표현하세요',
            grade: 'high',
            detailed: true,
            useCollaboration: true
        });
        
        console.log(chalk.green('✅ Math collaboration successful!'));
        console.log(chalk.blue('Mode:'), mathResponse.data.mode);
        console.log(chalk.blue('Confidence:'), mathResponse.data.confidence);
        
        if (mathResponse.data.allApproaches) {
            console.log(chalk.yellow('\nAll Approaches Generated:'));
            mathResponse.data.allApproaches.forEach((approach, idx) => {
                console.log(chalk.gray(`  ${idx + 1}. ${approach.type} (${approach.source})`));
            });
        }
        
    } catch (error) {
        console.log(chalk.red('❌ Math collaboration failed:'), error.message);
    }
    
    // Test 4: 협업 통계
    console.log(chalk.yellow('\n📈 Test 4: Collaboration Statistics'));
    try {
        const statsResponse = await axios.get(`${BASE_URL}/api/collaborate/stats`);
        
        console.log(chalk.green('✅ Stats retrieved!'));
        console.log(chalk.blue('Collaboration Enabled:'), statsResponse.data.collaborationEnabled);
        console.log(chalk.blue('Strategic Model:'), statsResponse.data.models.strategic);
        console.log(chalk.blue('Execution Model:'), statsResponse.data.models.execution);
        console.log(chalk.blue('Features:'));
        statsResponse.data.features.forEach(feature => {
            console.log(chalk.gray(`  • ${feature}`));
        });
        
    } catch (error) {
        console.log(chalk.red('❌ Stats failed:'), error.message);
    }
    
    console.log(chalk.magenta('\n╚══════════════════════════════════════════════╝'));
}

// 실행
testCollaboration().catch(console.error);
