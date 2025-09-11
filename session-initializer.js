/**
 * Auto Session Initializer for Claude
 * 새 대화 세션 시작 시 자동으로 컨텍스트를 로드하는 시스템
 * 
 * @version 1.0.0
 * @date 2025-09-08
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class SessionInitializer {
    constructor() {
        this.projectPath = 'C:\\palantir\\math';
        this.sessionPromptPath = path.join(this.projectPath, 'CLAUDE_SESSION_PROMPT_V4.md');
        this.statusPath = path.join(this.projectPath, 'AUTO_SYNC_STATUS.json');
        this.projectStatusPath = path.join(this.projectPath, 'PROJECT_STATUS_20250908.md');
    }

    /**
     * Generate current session context
     */
    async generateSessionContext() {
        console.log(' Generating session context...');
        
        // Read current status
        const status = JSON.parse(fs.readFileSync(this.statusPath, 'utf8'));
        const projectStatus = fs.readFileSync(this.projectStatusPath, 'utf8');
        
        // Get running processes
        let runningProcesses = [];
        try {
            const { stdout } = await execAsync('tasklist | findstr node');
            runningProcesses = stdout.split('\n').filter(line => line.includes('node'));
        } catch (error) {
            // No node processes running
        }
        
        // Get recent git commits
        let recentCommits = [];
        try {
            const { stdout } = await execAsync('git log --oneline -5');
            recentCommits = stdout.split('\n').filter(line => line.length > 0);
        } catch (error) {
            // Git not available or no commits
        }
        
        // Build context object
        const context = {
            timestamp: new Date().toISOString(),
            project: {
                path: this.projectPath,
                name: 'Math Learning Platform',
                version: '3.4.0',
                innovationScore: status.innovation_score || 98
            },
            status: {
                overall: status.system_health?.overall || 'excellent',
                lastTask: status.current_task,
                progress: status.progress,
                integration: status.integration_status
            },
            activeSystems: {
                trivialIssuePrevention: status.trivial_issue_prevention?.active || false,
                documentSync: status.document_sync?.active || false,
                selfImprovement: status.self_improvement?.active || false,
                monitoring: runningProcesses.some(p => p.includes('monitoring'))
            },
            statistics: {
                issuesFixed: status.trivial_issue_prevention?.issues_fixed || 0,
                filesMonitored: status.trivial_issue_prevention?.files_monitored || 0,
                documentsUpdated: status.documents_updated?.length || 0
            },
            recentActivity: {
                lastSync: status.document_sync?.lastSync,
                commits: recentCommits.slice(0, 3)
            },
            pendingTasks: this.extractPendingTasks(projectStatus),
            criticalFiles: [
                'AUTO_SYNC_STATUS.json',
                'PROJECT_STATUS_20250908.md',
                'UNIFIED_DOCUMENTATION.md',
                'CLAUDE_SESSION_PROMPT_V4.md'
            ]
        };
        
        return context;
    }

    /**
     * Extract pending tasks from project status
     */
    extractPendingTasks(projectStatus) {
        const tasks = [];
        const lines = projectStatus.split('\n');
        
        lines.forEach(line => {
            if (line.includes('- [ ]')) {
                tasks.push(line.replace('- [ ]', '').trim());
            }
        });
        
        return tasks.slice(0, 5); // Return top 5 pending tasks
    }

    /**
     * Update session prompt with current context
     */
    async updateSessionPrompt() {
        console.log(' Updating session prompt...');
        
        const context = await this.generateSessionContext();
        const template = fs.readFileSync(this.sessionPromptPath, 'utf8');
        
        // Update specific sections in the prompt
        let updated = template;
        
        // Update innovation score
        updated = updated.replace(
            /Innovation Score\*\*: \d+\/100/g,
            `Innovation Score**: ${context.project.innovationScore}/100`
        );
        
        // Update current task
        updated = updated.replace(
            /\*\*Current Task\*\*:.*/,
            `**Current Task**: ${context.status.lastTask || 'Continue development'}`
        );
        
        // Update statistics
        if (context.statistics.issuesFixed > 0) {
            updated = updated.replace(
                /\((\d+) issues auto-fixed\)/,
                `(${context.statistics.issuesFixed} issues auto-fixed)`
            );
        }
        
        // Add timestamp
        updated = updated.replace(
            /\*\*Last Updated\*\*:.*/,
            `**Last Updated**: ${new Date().toISOString()}`
        );
        
        // Save updated prompt
        fs.writeFileSync(this.sessionPromptPath, updated);
        
        // Also create a quick context file
        const quickContext = `# Quick Session Context
Generated: ${new Date().toISOString()}

## Current Status
- Innovation Score: ${context.project.innovationScore}/100
- System Health: ${context.status.overall}
- Last Task: ${context.status.lastTask}

## Active Systems
- Trivial Issue Prevention: ${context.activeSystems.trivialIssuePrevention ? '✅' : '❌'}
- Document Sync: ${context.activeSystems.documentSync ? '✅' : '❌'}
- Self-Improvement: ${context.activeSystems.selfImprovement ? '✅' : '❌'}

## Statistics
- Issues Fixed: ${context.statistics.issuesFixed}
- Files Monitored: ${context.statistics.filesMonitored}
- Documents Updated: ${context.statistics.documentsUpdated}

## Pending Tasks (Top 5)
${context.pendingTasks.map((task, i) => `${i + 1}. ${task}`).join('\n')}

## Quick Start Commands
\`\`\`bash
cd ${this.projectPath}
node verify-completion.js
cat AUTO_SYNC_STATUS.json
\`\`\`
`;
        
        fs.writeFileSync(
            path.join(this.projectPath, 'QUICK_SESSION_CONTEXT.md'),
            quickContext
        );
        
        return context;
    }

    /**
     * Create auto-start script
     */
    createAutoStartScript() {
        console.log(' Creating auto-start script...');
        
        const script = `#!/bin/bash
# Auto Session Start Script
# Automatically initializes Claude session with full context

echo " Initializing Claude Session..."

# Navigate to project
cd ${this.projectPath}

# Update session context
node session-initializer.js

# Show current status
echo ""
echo " Current Project Status:"
cat QUICK_SESSION_CONTEXT.md

echo ""
echo "✅ Session Ready!"
echo " Copy CLAUDE_SESSION_PROMPT_V4.md content to start new conversation"
echo ""
echo "Quick commands:"
echo "  node verify-completion.js     - Check system health"
echo "  node start-doc-sync.js        - Start document sync"
echo "  node trivial-issue-monitor.js - Start issue prevention"
echo ""
`;
        
        fs.writeFileSync(
            path.join(this.projectPath, 'start-claude-session.sh'),
            script
        );
        
        // Also create Windows batch version
        const batchScript = `@echo off
REM Auto Session Start Script for Windows
REM Automatically initializes Claude session with full context

echo  Initializing Claude Session...

REM Navigate to project
cd /d ${this.projectPath}

REM Update session context
node session-initializer.js

REM Show current status
echo.
echo  Current Project Status:
type QUICK_SESSION_CONTEXT.md

echo.
echo ✅ Session Ready!
echo  Copy CLAUDE_SESSION_PROMPT_V4.md content to start new conversation
echo.
echo Quick commands:
echo   node verify-completion.js     - Check system health
echo   node start-doc-sync.js        - Start document sync
echo   node trivial-issue-monitor.js - Start issue prevention
echo.
pause
`;
        
        fs.writeFileSync(
            path.join(this.projectPath, 'start-claude-session.bat'),
            batchScript
        );
        
        console.log('✅ Auto-start scripts created');
    }

    /**
     * Run initialization
     */
    async initialize() {
        console.log('=== Claude Session Initializer ===\n');
        
        // Generate and update context
        const context = await this.updateSessionPrompt();
        
        // Create auto-start scripts
        this.createAutoStartScript();
        
        // Display summary
        console.log('\n Session Context Summary:');
        console.log(`- Innovation Score: ${context.project.innovationScore}/100`);
        console.log(`- System Health: ${context.status.overall}`);
        console.log(`- Active Systems: ${Object.values(context.activeSystems).filter(v => v).length}`);
        console.log(`- Issues Fixed: ${context.statistics.issuesFixed}`);
        console.log(`- Pending Tasks: ${context.pendingTasks.length}`);
        
        console.log('\n✅ Session initialization complete!');
        console.log(' Files created:');
        console.log('  - CLAUDE_SESSION_PROMPT_V4.md (updated)');
        console.log('  - QUICK_SESSION_CONTEXT.md');
        console.log('  - start-claude-session.bat');
        console.log('  - start-claude-session.sh');
        
        return context;
    }
}

// Export and auto-run if called directly
export default SessionInitializer;

if (process.argv[1] === import.meta.url.slice(7)) {
    const initializer = new SessionInitializer();
    initializer.initialize().catch(console.error);
}