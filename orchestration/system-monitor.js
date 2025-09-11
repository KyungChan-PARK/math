/**
 * Real-time Monitoring Dashboard for Self-Improving Development System
 * Monitors system health, issue resolution, and performance metrics
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';

class SystemMonitor {
    constructor() {
        this.basePath = 'C:\\palantir\\math';
        this.docsPath = path.join(this.basePath, 'dev-docs');
        
        // Database paths
        this.issueDB = path.join(this.docsPath, '.issues_learned.json');
        this.lessonDB = path.join(this.docsPath, '.lessons_applied.json');
        this.patternDB = path.join(this.docsPath, '.patterns_recognized.json');
        
        // Service endpoints
        this.services = {
            orchestrator: 'http://localhost:8089',
            mediapipe: 'http://localhost:5000',
            nlp: 'http://localhost:3000',
            websocket: 'http://localhost:8085'
        };
        
        // Metrics
        this.startTime = Date.now();
        this.metrics = {
            uptime: 0,
            issuesProcessed: 0,
            lessonsLearned: 0,
            patternsRecognized: 0,
            autoFixesApplied: 0,
            docsUpdated: 0,
            serviceHealth: {}
        };
        
        this.refreshInterval = 5000; // 5 seconds
    }
    
    async start() {
        console.clear();
        console.log(chalk.cyan('═══════════════════════════════════════════════════════'));
        console.log(chalk.cyan('       SELF-IMPROVING SYSTEM MONITORING DASHBOARD       '));
        console.log(chalk.cyan('═══════════════════════════════════════════════════════'));
        
        await this.updateMetrics();
        setInterval(() => this.updateMetrics(), this.refreshInterval);
    }
    
    async updateMetrics() {
        // Update uptime
        this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Load database stats
        try {
            const issues = JSON.parse(fs.readFileSync(this.issueDB, 'utf8'));
            const lessons = JSON.parse(fs.readFileSync(this.lessonDB, 'utf8'));
            const patterns = JSON.parse(fs.readFileSync(this.patternDB, 'utf8'));
            
            this.metrics.issuesProcessed = issues.length;
            this.metrics.lessonsLearned = lessons.length;
            this.metrics.patternsRecognized = patterns.length;
            
            // Count auto-fixes
            this.metrics.autoFixesApplied = lessons.filter(l => 
                l.result && l.result.success && l.solution && 
                l.solution.id && l.solution.id.includes('auto')
            ).length;
            
            // Count doc updates
            this.metrics.docsUpdated = new Set(
                lessons.map(l => l.documentsUpdated || []).flat()
            ).size;
        } catch (err) {
            // Databases might not exist yet
        }
        
        // Check service health
        await this.checkServices();
        
        // Display dashboard
        this.displayDashboard();
    }
    
    async checkServices() {
        for (const [name, url] of Object.entries(this.services)) {
            try {
                const response = await axios.get(`${url}/health`, { timeout: 1000 });
                this.metrics.serviceHealth[name] = response.status === 200 ? 'online' : 'error';
            } catch (err) {
                this.metrics.serviceHealth[name] = 'offline';
            }
        }
    }
    
    displayDashboard() {
        console.clear();
        
        // Header
        console.log(chalk.cyan('═══════════════════════════════════════════════════════'));
        console.log(chalk.cyan('       SELF-IMPROVING SYSTEM MONITORING DASHBOARD       '));
        console.log(chalk.cyan('═══════════════════════════════════════════════════════'));
        console.log(chalk.gray(`Last Updated: ${new Date().toLocaleTimeString()}`));
        console.log(chalk.gray(`Uptime: ${this.formatUptime(this.metrics.uptime)}`));
        console.log();
        
        // System Metrics
        console.log(chalk.yellow(' SYSTEM METRICS'));
        console.log(chalk.white('├─ Issues Processed:    '), this.formatNumber(this.metrics.issuesProcessed));
        console.log(chalk.white('├─ Lessons Learned:     '), this.formatNumber(this.metrics.lessonsLearned));
        console.log(chalk.white('├─ Patterns Recognized: '), this.formatNumber(this.metrics.patternsRecognized));
        console.log(chalk.white('├─ Auto-Fixes Applied:  '), this.formatNumber(this.metrics.autoFixesApplied));
        console.log(chalk.white('└─ Documents Updated:   '), this.formatNumber(this.metrics.docsUpdated));
        console.log();
        
        // Service Status
        console.log(chalk.yellow(' SERVICE STATUS'));
        for (const [name, status] of Object.entries(this.metrics.serviceHealth)) {
            const icon = status === 'online' ? '✅' : status === 'error' ? '️' : '❌';
            const color = status === 'online' ? chalk.green : status === 'error' ? chalk.yellow : chalk.red;
            console.log(`├─ ${name.padEnd(12)} ${icon} ${color(status.toUpperCase())}`);
        }
        console.log();
        
        // Performance Indicators
        console.log(chalk.yellow(' PERFORMANCE'));
        const successRate = this.calculateSuccessRate();
        const learningRate = this.calculateLearningRate();
        
        console.log('├─ Success Rate:  ', this.formatPercentage(successRate));
        console.log('├─ Learning Rate: ', this.formatPercentage(learningRate));
        console.log('└─ Efficiency:    ', this.getEfficiencyRating());
        console.log();
        
        // Recent Activity
        console.log(chalk.yellow(' RECENT ACTIVITY'));
        this.displayRecentActivity();
        console.log();
        
        // Footer
        console.log(chalk.cyan('═══════════════════════════════════════════════════════'));
        console.log(chalk.gray('Press Ctrl+C to exit monitoring'));
    }
    
    calculateSuccessRate() {
        if (this.metrics.issuesProcessed === 0) return 0;
        return (this.metrics.autoFixesApplied / this.metrics.issuesProcessed) * 100;
    }
    
    calculateLearningRate() {
        if (this.metrics.issuesProcessed === 0) return 0;
        return (this.metrics.lessonsLearned / this.metrics.issuesProcessed) * 100;
    }
    
    getEfficiencyRating() {
        const score = (this.calculateSuccessRate() + this.calculateLearningRate()) / 2;
        if (score >= 80) return chalk.green('EXCELLENT');
        if (score >= 60) return chalk.yellow('GOOD');
        if (score >= 40) return chalk.yellow('MODERATE');
        return chalk.red('NEEDS IMPROVEMENT');
    }
    
    displayRecentActivity() {
        try {
            const issues = JSON.parse(fs.readFileSync(this.issueDB, 'utf8'));
            const recentIssues = issues.slice(-3);
            
            if (recentIssues.length === 0) {
                console.log(chalk.gray('No recent activity'));
                return;
            }
            
            recentIssues.forEach((issue, idx) => {
                const timestamp = new Date(issue.timestamp).toLocaleTimeString();
                const prefix = idx === recentIssues.length - 1 ? '└─' : '├─';
                console.log(`${prefix} [${timestamp}] ${issue.type}: ${issue.message.substring(0, 40)}...`);
            });
        } catch (err) {
            console.log(chalk.gray('No activity data available'));
        }
    }
    
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    }
    
    formatNumber(num) {
        return chalk.cyan(num.toString().padStart(4, ' '));
    }
    
    formatPercentage(percent) {
        const color = percent >= 80 ? chalk.green : percent >= 50 ? chalk.yellow : chalk.red;
        return color(`${percent.toFixed(1)}%`);
    }
}

// Start monitoring
const monitor = new SystemMonitor();
monitor.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n Monitoring session ended'));
    process.exit(0);
});
