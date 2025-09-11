// Fix script for API endpoint issues
// Based on the solution document analysis

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

class APIFixer {
    constructor() {
        this.projectRoot = 'C:\\palantir\\math\\orchestration';
        this.fixes = [];
    }

    async fixParallelExecution() {
        console.log(chalk.cyan('Fixing parallelExecution method...'));
        const filePath = path.join(this.projectRoot, 'ai-agents-75-complete.js');
        
        try {
            let content = await fs.readFile(filePath, 'utf-8');
            
            // Fix parallelExecution to accept task.task
            const oldParallel = `    // 병렬 실행
    async parallelExecution(tasks) {
        const promises = tasks.map(task => 
            this.callAgent(task.agent, task.prompt, task.options)
        );
        return Promise.all(promises);
    }`;
            
            const newParallel = `    // 병렬 실행
    async parallelExecution(tasks) {
        const promises = tasks.map(task => 
            this.callAgent(task.agent, task.task || task.prompt, task.options)
        );
        return Promise.all(promises);
    }`;
            
            if (content.includes(oldParallel)) {
                content = content.replace(oldParallel, newParallel);
                await fs.writeFile(filePath, content, 'utf-8');
                console.log(chalk.green('  ✓ Fixed parallelExecution'));
                this.fixes.push('parallelExecution');
            }
        } catch (error) {
            console.log(chalk.red(`  ✗ Error: ${error.message}`));
        }
    }

    async fixExecuteWorkflow() {
        console.log(chalk.cyan('Fixing executeWorkflow method...'));
        const filePath = path.join(this.projectRoot, 'ai-agents-75-complete.js');
        
        try {
            let content = await fs.readFile(filePath, 'utf-8');
            
            // Fix executeWorkflow to accept step.task
            const oldWorkflow = `    // 워크플로우 실행
    async executeWorkflow(workflow) {
        const results = [];
        let previousResult = null;
        
        for (const step of workflow) {
            const prompt = previousResult 
                ? \`\${step.prompt}\\n\\nPrevious result: \${previousResult}\`
                : step.prompt;
                
            const result = await this.callAgent(step.agent, prompt, step.options);
            results.push(result);
            previousResult = result.response;
        }
        
        return results;
    }`;
            
            const newWorkflow = `    // 워크플로우 실행
    async executeWorkflow(workflow) {
        const results = [];
        let previousResult = null;
        
        for (const step of workflow) {
            const taskContent = step.task || step.prompt;
            const prompt = previousResult 
                ? \`\${taskContent}\\n\\nPrevious result: \${previousResult}\`
                : taskContent;
                
            const result = await this.callAgent(step.agent, prompt, step.options);
            results.push(result);
            previousResult = result.response;
        }
        
        return results;
    }`;
            
            if (content.includes(oldWorkflow)) {
                content = content.replace(oldWorkflow, newWorkflow);
                await fs.writeFile(filePath, content, 'utf-8');
                console.log(chalk.green('  ✓ Fixed executeWorkflow'));
                this.fixes.push('executeWorkflow');
            }
        } catch (error) {
            console.log(chalk.red(`  ✗ Error: ${error.message}`));
        }
    }

    async fixMathSolverEndpoint() {
        console.log(chalk.cyan('Fixing /api/math/solve endpoint...'));
        const filePath = path.join(this.projectRoot, 'claude-orchestrator-75.js');
        
        try {
            let content = await fs.readFile(filePath, 'utf-8');
            
            // Fix math solver to use consistent naming
            const oldMath = `// 6. 수학 교육 특화 엔드포인트
app.post('/api/math/solve', async (req, res) => {
    const { problem, grade = 'high' } = req.body;
    
    const workflow = [
        { agent: 'algebraExpert', prompt: \`문제 분석: \${problem}\` },
        { agent: 'solutionExplainer', prompt: '단계별 해법 생성' },
        { agent: 'graphVisualizer', prompt: '시각화 코드 생성' }
    ];
    
    try {
        const results = await agentSystem.executeWorkflow(workflow);
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});`;
            
            const newMath = `// 6. 수학 교육 특화 엔드포인트
app.post('/api/math/solve', async (req, res) => {
    const { problem, grade = 'high' } = req.body;
    
    const workflow = [
        { agent: 'algebraExpert', task: \`문제 분석: \${problem}\` },
        { agent: 'solutionExplainer', task: '단계별 해법 생성' },
        { agent: 'graphVisualizer', task: '시각화 코드 생성' }
    ];
    
    try {
        const results = await agentSystem.executeWorkflow(workflow);
        res.json({ success: true, solution: results, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});`;
            
            if (content.includes(oldMath)) {
                content = content.replace(oldMath, newMath);
                await fs.writeFile(filePath, content, 'utf-8');
                console.log(chalk.green('  ✓ Fixed /api/math/solve'));
                this.fixes.push('/api/math/solve');
            }
        } catch (error) {
            console.log(chalk.red(`  ✗ Error: ${error.message}`));
        }
    }

    async fixVisualizationEndpoint() {
        console.log(chalk.cyan('Fixing /api/visualize endpoint...'));
        const filePath = path.join(this.projectRoot, 'claude-orchestrator-75.js');
        
        try {
            let content = await fs.readFile(filePath, 'utf-8');
            
            // Fix visualization to return both result and visualization
            const oldViz = `// 9. 시각화 생성
app.post('/api/visualize', async (req, res) => {
    const { concept, type = 'graph' } = req.body;
    
    const agentMap = {
        'graph': 'graphVisualizer',
        '3d': 'shape3DModeler',
        'animation': 'animationChoreographer',
        'diagram': 'diagramArchitect',
        'fractal': 'fractalGenerator'
    };
    
    const agent = agentMap[type] || 'graphVisualizer';
    
    try {
        const result = await agentSystem.callAgent(agent, concept);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});`;
            
            const newViz = `// 9. 시각화 생성
app.post('/api/visualize', async (req, res) => {
    const { concept, data, type = 'graph' } = req.body;
    
    const agentMap = {
        'graph': 'graphVisualizer',
        'function': 'graphVisualizer',
        '3d': 'shape3DModeler',
        'animation': 'animationChoreographer',
        'diagram': 'diagramArchitect',
        'fractal': 'fractalGenerator'
    };
    
    const agent = agentMap[type] || 'graphVisualizer';
    
    try {
        const result = await agentSystem.callAgent(agent, data || concept);
        res.json({ success: true, result, visualization: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});`;
            
            if (content.includes(oldViz)) {
                content = content.replace(oldViz, newViz);
                await fs.writeFile(filePath, content, 'utf-8');
                console.log(chalk.green('  ✓ Fixed /api/visualize'));
                this.fixes.push('/api/visualize');
            }
        } catch (error) {
            console.log(chalk.red(`  ✗ Error: ${error.message}`));
        }
    }

    async fixLessonCreateEndpoint() {
        console.log(chalk.cyan('Fixing /api/lesson/create endpoint...'));
        const filePath = path.join(this.projectRoot, 'claude-orchestrator-75.js');
        
        try {
            let content = await fs.readFile(filePath, 'utf-8');
            
            // Fix lesson create to use task instead of prompt
            const oldLesson = `// 8. 수업 계획 생성
app.post('/api/lesson/create', async (req, res) => {
    const { topic, duration = 45, level = 'intermediate' } = req.body;
    
    const workflow = [
        { agent: 'curriculumDesigner', prompt: \`주제: \${topic}, 수준: \${level}\` },
        { agent: 'lessonPlanner', prompt: \`\${duration}분 수업 계획\` },
        { agent: 'engagementStrategist', prompt: '참여 활동 설계' },
        { agent: 'assessmentCreator', prompt: '평가 문항 생성' }
    ];
    
    try {
        const results = await agentSystem.executeWorkflow(workflow);
        res.json({ success: true, lesson: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});`;
            
            const newLesson = `// 8. 수업 계획 생성
app.post('/api/lesson/create', async (req, res) => {
    const { topic, duration = 45, level = 'intermediate' } = req.body;
    
    const workflow = [
        { agent: 'curriculumDesigner', task: \`주제: \${topic}, 수준: \${level}\` },
        { agent: 'lessonPlanner', task: \`\${duration}분 수업 계획\` },
        { agent: 'engagementStrategist', task: '참여 활동 설계' },
        { agent: 'assessmentCreator', task: '평가 문항 생성' }
    ];
    
    try {
        const results = await agentSystem.executeWorkflow(workflow);
        res.json({ success: true, lesson: results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});`;
            
            if (content.includes(oldLesson)) {
                content = content.replace(oldLesson, newLesson);
                await fs.writeFile(filePath, content, 'utf-8');
                console.log(chalk.green('  ✓ Fixed /api/lesson/create'));
                this.fixes.push('/api/lesson/create');
            }
        } catch (error) {
            console.log(chalk.red(`  ✗ Error: ${error.message}`));
        }
    }

    async runAllFixes() {
        console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan.bold(' API Endpoint Fixer'));
        console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        await this.fixParallelExecution();
        await this.fixExecuteWorkflow();
        await this.fixMathSolverEndpoint();
        await this.fixVisualizationEndpoint();
        await this.fixLessonCreateEndpoint();
        
        console.log(chalk.green.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green.bold(' Summary'));
        console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green(`  ✓ Total fixes applied: ${this.fixes.length}`));
        this.fixes.forEach(fix => {
            console.log(chalk.green(`    - ${fix}`));
        });
        console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        if (this.fixes.length > 0) {
            console.log(chalk.yellow('\n⚠️  Please restart the orchestrator server:'));
            console.log(chalk.yellow('  1. Stop current server (Ctrl+C)'));
            console.log(chalk.yellow('  2. cd orchestration'));
            console.log(chalk.yellow('  3. node claude-orchestrator-75.js'));
        }
    }
}

// Run the fixer
const fixer = new APIFixer();
fixer.runAllFixes().catch(console.error);
