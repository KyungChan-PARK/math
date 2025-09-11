/**
 * Claude API Usage Monitor
 * 실시간 API 사용료 추적 및 알림 시스템
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

class ClaudeAPIUsageMonitor {
    constructor() {
        this.usageLog = [];
        this.totalCost = 0;
        this.sessionCost = 0;
        this.limit = 5.00; // $5 limit
        this.alertThreshold = 1.00; // Alert every $1
        this.lastAlertLevel = 0;
        this.usageFile = '.api-usage.json';
        
        // Pricing (approximate per 1M tokens)
        this.pricing = {
            'claude-3-5-sonnet-20241022': {
                input: 3.00,   // $3 per 1M input tokens
                output: 15.00  // $15 per 1M output tokens
            },
            'claude-3-5-haiku-20241022': {
                input: 0.25,   // $0.25 per 1M input tokens
                output: 1.25   // $1.25 per 1M output tokens
            },
            'claude-opus-4-1-20250805': {
                input: 15.00,  // $15 per 1M input tokens
                output: 75.00  // $75 per 1M output tokens
            }
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log(chalk.blue.bold('\n Claude API Usage Monitor Starting...\n'));
        
        // Load previous usage
        await this.loadUsageHistory();
        
        // Display current status
        this.displayStatus();
        
        // Start auto-save
        this.startAutoSave();
        
        console.log(chalk.green('✅ Usage monitor ready\n'));
    }
    
    // Track API call
    async trackAPICall(model, inputTokens, outputTokens, agentName = 'unknown') {
        const modelPricing = this.pricing[model] || this.pricing['claude-3-5-sonnet-20241022'];
        
        // Calculate cost
        const inputCost = (inputTokens / 1000000) * modelPricing.input;
        const outputCost = (outputTokens / 1000000) * modelPricing.output;
        const totalCost = inputCost + outputCost;
        
        // Create usage entry
        const entry = {
            timestamp: new Date().toISOString(),
            model,
            agent: agentName,
            inputTokens,
            outputTokens,
            inputCost,
            outputCost,
            totalCost,
            runningTotal: this.totalCost + totalCost
        };
        
        // Update totals
        this.usageLog.push(entry);
        this.totalCost += totalCost;
        this.sessionCost += totalCost;
        
        // Check alerts
        await this.checkAlerts();
        
        // Check limit
        await this.checkLimit();
        
        // Log usage
        console.log(chalk.cyan(
            ` API Usage: ${agentName} | ` +
            `Tokens: ${inputTokens}/${outputTokens} | ` +
            `Cost: $${totalCost.toFixed(4)} | ` +
            `Total: $${this.totalCost.toFixed(2)}`
        ));
        
        return entry;
    }
    
    // Check for alerts
    async checkAlerts() {
        const currentLevel = Math.floor(this.totalCost);
        
        if (currentLevel > this.lastAlertLevel && currentLevel > 0) {
            this.lastAlertLevel = currentLevel;
            
            // ALERT USER
            console.log(chalk.yellow.bold(
                '\n' + '️'.repeat(20) + '\n' +
                `️  API USAGE ALERT: $${currentLevel}.00 spent\n` +
                `️  Total usage: $${this.totalCost.toFixed(2)}\n` +
                `️  Remaining until limit: $${(this.limit - this.totalCost).toFixed(2)}\n` +
                '️'.repeat(20) + '\n'
            ));
            
            // Save alert
            await this.saveUsage();
            
            // Pause for user acknowledgment
            console.log(chalk.yellow('Press Enter to continue or Ctrl+C to stop...'));
            return true;
        }
        
        return false;
    }
    
    // Check limit
    async checkLimit() {
        if (this.totalCost >= this.limit) {
            console.log(chalk.red.bold(
                '\n' + ''.repeat(20) + '\n' +
                '  API USAGE LIMIT REACHED!\n' +
                `  Total spent: $${this.totalCost.toFixed(2)}\n` +
                `  Limit: $${this.limit.toFixed(2)}\n` +
                '  API CALLS STOPPED\n' +
                ''.repeat(20) + '\n'
            ));
            
            // Stop all API calls
            process.env.API_LIMIT_REACHED = 'true';
            
            // Save and exit
            await this.saveUsage();
            
            throw new Error('API usage limit reached');
        }
    }
    
    // Display current status
    displayStatus() {
        const remaining = this.limit - this.totalCost;
        const percentage = (this.totalCost / this.limit) * 100;
        
        console.log(chalk.blue('━'.repeat(50)));
        console.log(chalk.blue.bold(' API Usage Status'));
        console.log(chalk.blue('━'.repeat(50)));
        console.log(` Total Spent: $${this.totalCost.toFixed(2)}`);
        console.log(` Session Cost: $${this.sessionCost.toFixed(2)}`);
        console.log(` Limit: $${this.limit.toFixed(2)}`);
        console.log(` Remaining: $${remaining.toFixed(2)}`);
        console.log(` Usage: ${percentage.toFixed(1)}%`);
        console.log(chalk.blue('━'.repeat(50)));
        
        // Visual progress bar
        const barLength = 30;
        const filled = Math.round((percentage / 100) * barLength);
        const empty = barLength - filled;
        
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const color = percentage < 50 ? chalk.green : 
                      percentage < 80 ? chalk.yellow : chalk.red;
        
        console.log(color(`[${bar}] ${percentage.toFixed(1)}%\n`));
    }
    
    // Get usage summary
    getUsageSummary() {
        const byAgent = {};
        const byModel = {};
        
        this.usageLog.forEach(entry => {
            // By agent
            if (!byAgent[entry.agent]) {
                byAgent[entry.agent] = {
                    calls: 0,
                    cost: 0,
                    tokens: { input: 0, output: 0 }
                };
            }
            byAgent[entry.agent].calls++;
            byAgent[entry.agent].cost += entry.totalCost;
            byAgent[entry.agent].tokens.input += entry.inputTokens;
            byAgent[entry.agent].tokens.output += entry.outputTokens;
            
            // By model
            if (!byModel[entry.model]) {
                byModel[entry.model] = {
                    calls: 0,
                    cost: 0,
                    tokens: { input: 0, output: 0 }
                };
            }
            byModel[entry.model].calls++;
            byModel[entry.model].cost += entry.totalCost;
            byModel[entry.model].tokens.input += entry.inputTokens;
            byModel[entry.model].tokens.output += entry.outputTokens;
        });
        
        return {
            total: {
                cost: this.totalCost,
                calls: this.usageLog.length,
                avgCostPerCall: this.totalCost / this.usageLog.length
            },
            byAgent,
            byModel
        };
    }
    
    // Save usage to file
    async saveUsage() {
        try {
            const data = {
                timestamp: new Date().toISOString(),
                totalCost: this.totalCost,
                sessionCost: this.sessionCost,
                limit: this.limit,
                entries: this.usageLog,
                summary: this.getUsageSummary()
            };
            
            await fs.writeFile(
                this.usageFile,
                JSON.stringify(data, null, 2)
            );
            
            console.log(chalk.green('✅ Usage data saved'));
        } catch (error) {
            console.error(chalk.red('❌ Failed to save usage:'), error);
        }
    }
    
    // Load usage history
    async loadUsageHistory() {
        try {
            const data = await fs.readFile(this.usageFile, 'utf8');
            const history = JSON.parse(data);
            
            this.usageLog = history.entries || [];
            this.totalCost = history.totalCost || 0;
            this.lastAlertLevel = Math.floor(this.totalCost);
            
            console.log(chalk.cyan(` Loaded ${this.usageLog.length} previous API calls`));
            console.log(chalk.cyan(` Previous total: $${this.totalCost.toFixed(2)}`));
        } catch (error) {
            console.log(chalk.yellow(' Starting fresh usage log'));
        }
    }
    
    // Auto-save every minute
    startAutoSave() {
        setInterval(() => {
            if (this.sessionCost > 0) {
                this.saveUsage();
            }
        }, 60000);
    }
    
    // Reset daily limit (optional)
    async resetDailyLimit(newLimit = 5.00) {
        this.limit = newLimit;
        this.totalCost = 0;
        this.sessionCost = 0;
        this.usageLog = [];
        this.lastAlertLevel = 0;
        
        await this.saveUsage();
        
        console.log(chalk.green(`✅ Limit reset to $${newLimit}`));
    }
    
    // Get real-time status for display
    getRealTimeStatus() {
        return {
            spent: this.totalCost.toFixed(2),
            limit: this.limit.toFixed(2),
            remaining: (this.limit - this.totalCost).toFixed(2),
            percentage: ((this.totalCost / this.limit) * 100).toFixed(1),
            sessionCost: this.sessionCost.toFixed(2),
            calls: this.usageLog.length
        };
    }
}

// Singleton instance
const usageMonitor = new ClaudeAPIUsageMonitor();

export default usageMonitor;
