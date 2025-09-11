// Palantir Math - Project State Management System
// 프로젝트 상태를 저장하고 복원하는 핵심 시스템

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectStateManager {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.stateFile = path.join(this.projectRoot, 'PROJECT_STATE.json');
        this.checkpointDir = path.join(this.projectRoot, 'checkpoints');
        this.currentState = this.loadState();
        
        // 체크포인트 디렉토리 생성
        if (!fs.existsSync(this.checkpointDir)) {
            fs.mkdirSync(this.checkpointDir, { recursive: true });
        }
        
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan.bold(' Project State Manager Initialized'));
        console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    }
    
    // 현재 프로젝트 상태 구조
    getDefaultState() {
        return {
            project: {
                name: 'Palantir Math',
                version: '2.0.0',
                description: '혁신적인 수학 교육 플랫폼 - After Effects + AI',
                startDate: '2024-11-15',
                lastUpdated: new Date().toISOString()
            },
            
            currentPhase: {
                number: 1,
                name: 'Foundation',
                status: 'IN_PROGRESS',
                completionPercentage: 85,
                activeTask: null
            },
            
            infrastructure: {
                databases: {
                    mongodb: {
                        status: 'CONNECTED',
                        uri: 'mongodb://localhost:27017/mathDB',
                        collections: ['sessions', 'users', 'problems', 'visualizations']
                    },
                    neo4j: {
                        status: 'CONNECTED',
                        uri: 'bolt://localhost:7687',
                        graphs: ['knowledge', 'learning_paths', 'concept_relations']
                    }
                },
                
                servers: {
                    orchestrator: {
                        status: 'RUNNING',
                        port: 8093,
                        endpoints: 13,
                        uptime: null
                    },
                    websocket: {
                        status: 'RUNNING',
                        port: 8094,
                        connections: 0
                    }
                },
                
                ai: {
                    claude: {
                        model: 'Claude Opus 4.1',
                        apiKey: 'Configured',
                        role: 'Strategic Intelligence'
                    },
                    qwen: {
                        model: 'Qwen3-Max-Preview',
                        apiKey: 'sk-f2ab784cfdc7467495fa72ced5477c2a',
                        role: 'Execution Engine',
                        agents: 75
                    },
                    collaboration: {
                        enabled: true,
                        mode: '5-Step Process'
                    }
                }
            },
            
            components: {
                completed: [
                    {
                        name: '75 AI Agents System',
                        completedDate: '2025-09-09',
                        files: [
                            'qwen-agents-75-complete.js',
                            'qwen-orchestrator-enhanced.js'
                        ]
                    },
                    {
                        name: 'Claude-Qwen Collaboration',
                        completedDate: '2025-09-09',
                        files: [
                            'claude-qwen-collaborative-solver.js'
                        ]
                    },
                    {
                        name: 'After Effects CEP Framework',
                        completedDate: '2024-12-01',
                        files: [
                            'extension/index.html',
                            'extension/js/main.js'
                        ]
                    }
                ],
                
                inProgress: [
                    {
                        name: 'Gesture Recognition Integration',
                        progress: 60,
                        blockers: ['MediaPipe calibration needed'],
                        nextSteps: ['Test with real hand tracking data']
                    },
                    {
                        name: 'Real-time Collaboration',
                        progress: 40,
                        blockers: [],
                        nextSteps: ['Implement WebRTC for P2P']
                    }
                ],
                
                planned: [
                    {
                        name: 'AR/VR Support',
                        priority: 'LOW',
                        estimatedDays: 30
                    },
                    {
                        name: 'Mobile App',
                        priority: 'MEDIUM',
                        estimatedDays: 45
                    }
                ]
            },
            
            recentActivities: [],
            
            issues: {
                open: [],
                resolved: []
            },
            
            metrics: {
                totalFiles: 0,
                totalLines: 0,
                apiCalls: 0,
                totalCost: 0,
                successRate: 0
            },
            
            checkpoints: [],
            
            notes: []
        };
    }
    
    // 상태 로드
    loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = fs.readFileSync(this.stateFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.log(chalk.yellow('No existing state found, creating new...'));
        }
        return this.getDefaultState();
    }
    
    // 상태 저장
    saveState() {
        try {
            this.currentState.lastUpdated = new Date().toISOString();
            fs.writeFileSync(
                this.stateFile, 
                JSON.stringify(this.currentState, null, 2)
            );
            console.log(chalk.green('✅ State saved successfully'));
            return true;
        } catch (error) {
            console.error(chalk.red('Failed to save state:'), error);
            return false;
        }
    }
    
    // 체크포인트 생성
    createCheckpoint(message) {
        const checkpointId = crypto.randomBytes(8).toString('hex');
        const checkpoint = {
            id: checkpointId,
            message: message,
            timestamp: new Date().toISOString(),
            state: JSON.parse(JSON.stringify(this.currentState))
        };
        
        // 체크포인트 파일 저장
        const checkpointFile = path.join(
            this.checkpointDir, 
            `checkpoint_${checkpointId}.json`
        );
        
        fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2));
        
        // 현재 상태에 체크포인트 기록
        this.currentState.checkpoints.push({
            id: checkpointId,
            message: message,
            timestamp: checkpoint.timestamp
        });
        
        // 최대 10개 체크포인트 유지
        if (this.currentState.checkpoints.length > 10) {
            this.currentState.checkpoints.shift();
        }
        
        this.saveState();
        
        console.log(chalk.green(`✅ Checkpoint created: ${checkpointId}`));
        console.log(chalk.gray(`   Message: ${message}`));
        
        return checkpointId;
    }
    
    // 체크포인트 복원
    restoreCheckpoint(checkpointId) {
        const checkpointFile = path.join(
            this.checkpointDir, 
            `checkpoint_${checkpointId}.json`
        );
        
        if (!fs.existsSync(checkpointFile)) {
            console.error(chalk.red(`Checkpoint ${checkpointId} not found`));
            return false;
        }
        
        try {
            const checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf8'));
            this.currentState = checkpoint.state;
            this.saveState();
            
            console.log(chalk.green(`✅ Restored to checkpoint: ${checkpointId}`));
            console.log(chalk.gray(`   Message: ${checkpoint.message}`));
            console.log(chalk.gray(`   Time: ${checkpoint.timestamp}`));
            
            return true;
        } catch (error) {
            console.error(chalk.red('Failed to restore checkpoint:'), error);
            return false;
        }
    }
    
    // 활동 기록
    logActivity(activity) {
        const entry = {
            timestamp: new Date().toISOString(),
            activity: activity,
            sessionId: crypto.randomBytes(4).toString('hex')
        };
        
        this.currentState.recentActivities.unshift(entry);
        
        // 최대 50개 활동 유지
        if (this.currentState.recentActivities.length > 50) {
            this.currentState.recentActivities.pop();
        }
        
        this.saveState();
        return entry;
    }
    
    // 이슈 추가
    addIssue(issue) {
        const issueEntry = {
            id: crypto.randomBytes(4).toString('hex'),
            description: issue,
            timestamp: new Date().toISOString(),
            status: 'OPEN'
        };
        
        this.currentState.issues.open.push(issueEntry);
        this.saveState();
        
        console.log(chalk.yellow(`⚠️ Issue added: ${issueEntry.id}`));
        return issueEntry.id;
    }
    
    // 이슈 해결
    resolveIssue(issueId, solution) {
        const issueIndex = this.currentState.issues.open.findIndex(
            i => i.id === issueId
        );
        
        if (issueIndex === -1) {
            console.error(chalk.red(`Issue ${issueId} not found`));
            return false;
        }
        
        const issue = this.currentState.issues.open.splice(issueIndex, 1)[0];
        issue.status = 'RESOLVED';
        issue.solution = solution;
        issue.resolvedAt = new Date().toISOString();
        
        this.currentState.issues.resolved.push(issue);
        this.saveState();
        
        console.log(chalk.green(`✅ Issue resolved: ${issueId}`));
        return true;
    }
    
    // 진행 상황 업데이트
    updateProgress(componentName, progress, nextSteps = []) {
        const component = this.currentState.components.inProgress.find(
            c => c.name === componentName
        );
        
        if (component) {
            component.progress = progress;
            if (nextSteps.length > 0) {
                component.nextSteps = nextSteps;
            }
            
            // 100% 완료시 completed로 이동
            if (progress >= 100) {
                const index = this.currentState.components.inProgress.indexOf(component);
                this.currentState.components.inProgress.splice(index, 1);
                this.currentState.components.completed.push({
                    name: componentName,
                    completedDate: new Date().toISOString().split('T')[0],
                    files: []
                });
            }
            
            this.saveState();
            console.log(chalk.blue(`📊 Progress updated: ${componentName} - ${progress}%`));
            return true;
        }
        
        return false;
    }
    
    // 노트 추가
    addNote(note, category = 'general') {
        const noteEntry = {
            id: crypto.randomBytes(4).toString('hex'),
            category: category,
            content: note,
            timestamp: new Date().toISOString()
        };
        
        this.currentState.notes.push(noteEntry);
        
        // 최대 100개 노트 유지
        if (this.currentState.notes.length > 100) {
            this.currentState.notes.shift();
        }
        
        this.saveState();
        console.log(chalk.magenta(`📝 Note added: ${noteEntry.id}`));
        return noteEntry.id;
    }
    
    // 현재 상태 요약
    getSummary() {
        const state = this.currentState;
        
        return {
            project: state.project.name,
            phase: `${state.currentPhase.name} (${state.currentPhase.completionPercentage}%)`,
            infrastructure: {
                databases: Object.keys(state.infrastructure.databases)
                    .map(db => `${db}: ${state.infrastructure.databases[db].status}`),
                servers: Object.keys(state.infrastructure.servers)
                    .map(s => `${s}: ${state.infrastructure.servers[s].status}`),
                ai: {
                    claude: state.infrastructure.ai.claude.model,
                    qwen: `${state.infrastructure.ai.qwen.model} (${state.infrastructure.ai.qwen.agents} agents)`,
                    collaboration: state.infrastructure.ai.collaboration.enabled
                }
            },
            progress: {
                completed: state.components.completed.length,
                inProgress: state.components.inProgress.length,
                planned: state.components.planned.length
            },
            issues: {
                open: state.issues.open.length,
                resolved: state.issues.resolved.length
            },
            recentActivity: state.recentActivities[0] || 'No recent activity',
            lastUpdated: state.lastUpdated
        };
    }
    
    // 상태 내보내기 (마크다운)
    exportToMarkdown() {
        const state = this.currentState;
        const summary = this.getSummary();
        
        let markdown = `# ${state.project.name} - Project State\n\n`;
        markdown += `> Last Updated: ${state.lastUpdated}\n\n`;
        
        markdown += `## 📊 Current Status\n\n`;
        markdown += `- **Phase**: ${summary.phase}\n`;
        markdown += `- **Active Task**: ${state.currentPhase.activeTask || 'None'}\n\n`;
        
        markdown += `## 🏗️ Infrastructure\n\n`;
        markdown += `### Databases\n`;
        summary.infrastructure.databases.forEach(db => {
            markdown += `- ${db}\n`;
        });
        
        markdown += `\n### Servers\n`;
        summary.infrastructure.servers.forEach(server => {
            markdown += `- ${server}\n`;
        });
        
        markdown += `\n### AI Models\n`;
        markdown += `- Claude: ${summary.infrastructure.ai.claude}\n`;
        markdown += `- Qwen: ${summary.infrastructure.ai.qwen}\n`;
        markdown += `- Collaboration: ${summary.infrastructure.ai.collaboration ? 'Enabled' : 'Disabled'}\n\n`;
        
        markdown += `## 📈 Progress\n\n`;
        
        markdown += `### ✅ Completed Components (${state.components.completed.length})\n`;
        state.components.completed.forEach(comp => {
            markdown += `- ${comp.name} (${comp.completedDate})\n`;
        });
        
        markdown += `\n### 🚧 In Progress (${state.components.inProgress.length})\n`;
        state.components.inProgress.forEach(comp => {
            markdown += `- ${comp.name}: ${comp.progress}%\n`;
            if (comp.nextSteps.length > 0) {
                markdown += `  - Next: ${comp.nextSteps[0]}\n`;
            }
        });
        
        markdown += `\n### 📋 Planned (${state.components.planned.length})\n`;
        state.components.planned.forEach(comp => {
            markdown += `- ${comp.name} (Priority: ${comp.priority})\n`;
        });
        
        markdown += `\n## ⚠️ Open Issues (${state.issues.open.length})\n`;
        state.issues.open.forEach(issue => {
            markdown += `- [${issue.id}] ${issue.description}\n`;
        });
        
        markdown += `\n## 📝 Recent Activities\n`;
        state.recentActivities.slice(0, 5).forEach(activity => {
            markdown += `- ${activity.timestamp}: ${activity.activity}\n`;
        });
        
        markdown += `\n## 🔖 Checkpoints\n`;
        state.checkpoints.forEach(cp => {
            markdown += `- [${cp.id}] ${cp.message} (${cp.timestamp})\n`;
        });
        
        const exportFile = path.join(this.projectRoot, 'PROJECT_STATUS.md');
        fs.writeFileSync(exportFile, markdown);
        
        console.log(chalk.green(`✅ Exported to ${exportFile}`));
        return markdown;
    }
}

// Export for use
export default ProjectStateManager;

// CLI 명령어
if (import.meta.url === `file://${process.argv[1]}`) {
    const manager = new ProjectStateManager();
    const command = process.argv[2];
    
    switch (command) {
        case 'status':
            console.log(manager.getSummary());
            break;
            
        case 'export':
            manager.exportToMarkdown();
            break;
            
        case 'checkpoint':
            const message = process.argv[3] || 'Manual checkpoint';
            manager.createCheckpoint(message);
            break;
            
        case 'restore':
            const checkpointId = process.argv[3];
            if (checkpointId) {
                manager.restoreCheckpoint(checkpointId);
            } else {
                console.log(chalk.red('Please provide checkpoint ID'));
            }
            break;
            
        case 'activity':
            const activity = process.argv.slice(3).join(' ');
            manager.logActivity(activity);
            break;
            
        case 'issue':
            const issue = process.argv.slice(3).join(' ');
            manager.addIssue(issue);
            break;
            
        case 'note':
            const note = process.argv.slice(3).join(' ');
            manager.addNote(note);
            break;
            
        default:
            console.log(chalk.yellow('Available commands:'));
            console.log('  status    - Show current project status');
            console.log('  export    - Export to Markdown');
            console.log('  checkpoint <message> - Create checkpoint');
            console.log('  restore <id> - Restore checkpoint');
            console.log('  activity <description> - Log activity');
            console.log('  issue <description> - Add issue');
            console.log('  note <content> - Add note');
    }
}
