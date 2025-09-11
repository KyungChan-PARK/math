// Claude Opus 4.1 Auto-Activation System
// Ensures consistent performance across all sessions

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

class ClaudeActivationSystem {
    constructor() {
        this.projectRoot = 'C:\\palantir\\math';
        this.activationFile = path.join(this.projectRoot, 'CLAUDE_OPUS_41_ACTIVATION.md');
        this.quickTrigger = path.join(this.projectRoot, 'ACTIVATE_ME.txt');
    }

    async generateQuickTrigger() {
        // Ultra-short trigger prompt that loads the full activation
        const trigger = `ACTIVATE CLAUDE OPUS 4.1:
Load C:\\palantir\\math\\CLAUDE_OPUS_41_ACTIVATION.md
Execute all initialization sequences
Enable extended thinking (64K tokens)
Activate all MCP tools
Load Math Learning Platform context
Check AI_AGENT_MASTER.md
Continue from last checkpoint`;

        await fs.writeFile(this.quickTrigger, trigger, 'utf-8');
        console.log(chalk.green('✅ Quick trigger created: ACTIVATE_ME.txt'));
    }

    async createPowerShellScript() {
        // PowerShell script to copy activation prompt to clipboard
        const psScript = `
# Claude Opus 4.1 Activation Script
# Copies the activation prompt to clipboard

$activation = Get-Content "C:\\palantir\\math\\CLAUDE_OPUS_41_ACTIVATION.md" -Raw
Set-Clipboard -Value $activation
Write-Host "✅ Activation prompt copied to clipboard!" -ForegroundColor Green
Write-Host "📋 Just paste (Ctrl+V) in Claude!" -ForegroundColor Cyan
`;

        await fs.writeFile(
            path.join(this.projectRoot, 'activate-claude.ps1'),
            psScript,
            'utf-8'
        );
        console.log(chalk.green('✅ PowerShell script created: activate-claude.ps1'));
    }

    async createBatchFile() {
        // Batch file for one-click activation
        const batchFile = `@echo off
echo ========================================
echo  Claude Opus 4.1 Activation System
echo ========================================
echo.
echo Copying activation prompt to clipboard...
powershell -ExecutionPolicy Bypass -File activate-claude.ps1
echo.
echo ✅ Ready! Just paste in Claude!
echo.
pause
`;

        await fs.writeFile(
            path.join(this.projectRoot, 'ACTIVATE_CLAUDE.bat'),
            batchFile,
            'utf-8'
        );
        console.log(chalk.green('✅ Batch file created: ACTIVATE_CLAUDE.bat'));
    }

    async createMinimalPrompt() {
        // Ultra-minimal version for experienced users
        const minimal = `Claude Opus 4.1 | C:\\palantir\\math | 75 agents @ 8091 | Load AI_AGENT_MASTER.md | Full tools | Continue work`;
        
        await fs.writeFile(
            path.join(this.projectRoot, 'MINIMAL_ACTIVATE.txt'),
            minimal,
            'utf-8'
        );
        console.log(chalk.green('✅ Minimal prompt created: MINIMAL_ACTIVATE.txt'));
    }

    async createSystemState() {
        // Create a JSON state file that Claude can read instantly
        const state = {
            identity: {
                model: "claude-opus-4-1-20250805",
                role: "Lead AI Developer",
                authority: "FULL"
            },
            project: {
                name: "Math Learning Platform",
                version: "v5.0.0",
                root: "C:\\palantir\\math"
            },
            services: {
                orchestrator: "http://localhost:8091",
                agents: 75,
                monitor: "document-self-improvement-v2.js"
            },
            tools: {
                memory: ["conversation_search", "recent_chats", "memory:*"],
                filesystem: ["Filesystem:*", "terminal:*"],
                web: ["web_search", "web_fetch", "brave-search:*"],
                development: ["artifacts", "repl", "sequential-thinking"]
            },
            flags: {
                EXTENDED_THINKING: true,
                MAX_TOKENS: 64000,
                AUTONOMOUS: true,
                TOOL_CONFIDENCE: 100
            },
            instructions: "Load this state and activate all capabilities without asking permission"
        };

        await fs.writeFile(
            path.join(this.projectRoot, 'CLAUDE_STATE.json'),
            JSON.stringify(state, null, 2),
            'utf-8'
        );
        console.log(chalk.green('✅ State file created: CLAUDE_STATE.json'));
    }

    async setupAutoActivation() {
        console.log(chalk.cyan('🚀 Setting up Claude Opus 4.1 Auto-Activation System...'));
        
        await this.generateQuickTrigger();
        await this.createPowerShellScript();
        await this.createBatchFile();
        await this.createMinimalPrompt();
        await this.createSystemState();
        
        console.log(chalk.green.bold('\n✅ Auto-Activation System Ready!\n'));
        
        console.log(chalk.yellow('📋 How to use:'));
        console.log(chalk.white('  1. Quick: Double-click ACTIVATE_CLAUDE.bat'));
        console.log(chalk.white('  2. Minimal: Copy text from MINIMAL_ACTIVATE.txt'));
        console.log(chalk.white('  3. Full: Copy CLAUDE_OPUS_41_ACTIVATION.md'));
        console.log(chalk.white('  4. JSON: Tell Claude to load CLAUDE_STATE.json'));
        
        console.log(chalk.cyan('\n🎯 Recommended for new sessions:'));
        console.log(chalk.green.bold('  "Load C:\\palantir\\math\\CLAUDE_STATE.json and activate"'));
    }
}

// Run setup
const activation = new ClaudeActivationSystem();
activation.setupAutoActivation().catch(console.error);

export default ClaudeActivationSystem;