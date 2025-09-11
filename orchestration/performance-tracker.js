/**
 * Performance Measurement System for Self-Improving Development
 * Tracks and analyzes system improvement metrics over time
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

class PerformanceTracker {
    constructor() {
        this.basePath = 'C:\\palantir\\math';
        this.metricsPath = path.join(this.basePath, 'orchestration', '.performance-metrics.json');
        this.benchmarkPath = path.join(this.basePath, 'orchestration', '.performance-benchmarks.json');
        
        // Load or initialize metrics
        this.metrics = this.loadMetrics();
        this.benchmarks = this.loadBenchmarks();
        
        // Performance indicators
        this.kpis = {
            // Time-based metrics
            avgIssueResolutionTime: 0,
            avgDocUpdateTime: 0,
            avgPatternRecognitionTime: 0,
            
            // Success metrics
            autoFixSuccessRate: 0,
            firstAttemptSuccessRate: 0,
            documentationAccuracy: 0,
            
            // Learning metrics
            issuesPerPattern: 0,
            lessonApplicationRate: 0,
            patternPreventionRate: 0,
            
            // Efficiency metrics
            codeQualityScore: 0,
            systemUptimePercentage: 0,
            resourceUtilization: 0
        };
        
        // Historical data for trends
        this.history = [];
        this.startTime = Date.now();
        
        console.log(chalk.cyan(' Performance Tracking System Initialized'));
    }
    
    loadMetrics() {
        try {
            if (fs.existsSync(this.metricsPath)) {
                return JSON.parse(fs.readFileSync(this.metricsPath, 'utf8'));
            }
        } catch (err) {
            console.log(chalk.yellow('Creating new metrics database'));
        }
        return {
            sessions: [],
            issues: [],
            resolutions: [],
            patterns: [],
            improvements: []
        };
    }
    
    loadBenchmarks() {
        try {
            if (fs.existsSync(this.benchmarkPath)) {
                return JSON.parse(fs.readFileSync(this.benchmarkPath, 'utf8'));
            }
        } catch (err) {
            console.log(chalk.yellow('Creating new benchmarks'));
        }
        return {
            baseline: {
                issueResolutionTime: 300000, // 5 minutes baseline
                docUpdateTime: 60000, // 1 minute baseline
                successRate: 0.5, // 50% baseline
                patternThreshold: 5 // 5 issues before pattern
            },
            targets: {
                issueResolutionTime: 60000, // 1 minute target
                docUpdateTime: 10000, // 10 seconds target
                successRate: 0.9, // 90% target
                patternThreshold: 3 // 3 issues before pattern
            }
        };
    }
    
    trackIssueResolution(issue, resolution, timeSpent) {
        const metric = {
            timestamp: Date.now(),
            issueType: issue.type,
            resolutionType: resolution.type,
            timeSpent: timeSpent,
            success: resolution.success,
            automated: resolution.automated || false,
            agentUsed: resolution.agentUsed || 'none'
        };
        
        this.metrics.resolutions.push(metric);
        this.updateKPIs();
        this.saveMetrics();
        
        // Calculate improvement
        const improvement = this.calculateImprovement('resolution', timeSpent);
        if (improvement > 0) {
            console.log(chalk.green(`   ${improvement.toFixed(1)}% faster than baseline!`));
        }
        
        return metric;
    }
    
    trackPatternRecognition(pattern, issueCount, preventedCount) {
        const metric = {
            timestamp: Date.now(),
            patternType: pattern.type,
            issueCount: issueCount,
            preventedCount: preventedCount || 0,
            preventionRate: preventedCount / issueCount
        };
        
        this.metrics.patterns.push(metric);
        this.updateKPIs();
        this.saveMetrics();
        
        console.log(chalk.cyan(`   Pattern efficiency: ${(metric.preventionRate * 100).toFixed(1)}%`));
        
        return metric;
    }
    
    trackLearning(lessonId, applicationCount, successCount) {
        const metric = {
            timestamp: Date.now(),
            lessonId: lessonId,
            applications: applicationCount,
            successes: successCount,
            successRate: successCount / applicationCount
        };
        
        this.metrics.improvements.push(metric);
        this.updateKPIs();
        this.saveMetrics();
        
        if (metric.successRate > 0.8) {
            console.log(chalk.green(`   High-value lesson: ${(metric.successRate * 100).toFixed(1)}% success`));
        }
        
        return metric;
    }
    
    updateKPIs() {
        // Calculate average resolution time
        const recentResolutions = this.metrics.resolutions.slice(-20);
        if (recentResolutions.length > 0) {
            const avgTime = recentResolutions.reduce((sum, r) => sum + r.timeSpent, 0) / recentResolutions.length;
            this.kpis.avgIssueResolutionTime = avgTime;
            
            // Success rates
            const successful = recentResolutions.filter(r => r.success).length;
            this.kpis.autoFixSuccessRate = successful / recentResolutions.length;
            
            const firstAttempt = recentResolutions.filter(r => r.automated).length;
            this.kpis.firstAttemptSuccessRate = firstAttempt / recentResolutions.length;
        }
        
        // Pattern metrics
        if (this.metrics.patterns.length > 0) {
            const avgPrevention = this.metrics.patterns.reduce((sum, p) => sum + p.preventionRate, 0) / this.metrics.patterns.length;
            this.kpis.patternPreventionRate = avgPrevention;
            
            const avgIssuesPerPattern = this.metrics.patterns.reduce((sum, p) => sum + p.issueCount, 0) / this.metrics.patterns.length;
            this.kpis.issuesPerPattern = avgIssuesPerPattern;
        }
        
        // Learning metrics
        if (this.metrics.improvements.length > 0) {
            const avgApplication = this.metrics.improvements.reduce((sum, i) => sum + i.successRate, 0) / this.metrics.improvements.length;
            this.kpis.lessonApplicationRate = avgApplication;
        }
        
        // System metrics
        const uptime = Date.now() - this.startTime;
        this.kpis.systemUptimePercentage = 1; // Always 100% for this session
        
        // Calculate overall quality score
        this.kpis.codeQualityScore = this.calculateQualityScore();
    }
    
    calculateQualityScore() {
        const weights = {
            successRate: 0.3,
            speed: 0.2,
            learning: 0.2,
            prevention: 0.2,
            automation: 0.1
        };
        
        const scores = {
            successRate: this.kpis.autoFixSuccessRate,
            speed: Math.min(1, this.benchmarks.baseline.issueResolutionTime / Math.max(1, this.kpis.avgIssueResolutionTime)),
            learning: this.kpis.lessonApplicationRate,
            prevention: this.kpis.patternPreventionRate,
            automation: this.kpis.firstAttemptSuccessRate
        };
        
        let totalScore = 0;
        for (const [key, weight] of Object.entries(weights)) {
            totalScore += scores[key] * weight;
        }
        
        return totalScore;
    }
    
    calculateImprovement(type, currentValue) {
        const baseline = this.benchmarks.baseline;
        const baseValue = type === 'resolution' ? baseline.issueResolutionTime : baseline.docUpdateTime;
        
        const improvement = ((baseValue - currentValue) / baseValue) * 100;
        return Math.max(0, improvement);
    }
    
    generateReport() {
        console.log(chalk.cyan('\n═══════════════════════════════════════════════════════'));
        console.log(chalk.cyan('            PERFORMANCE MEASUREMENT REPORT              '));
        console.log(chalk.cyan('═══════════════════════════════════════════════════════'));
        
        // Time Metrics
        console.log(chalk.yellow('\n⏱️  TIME METRICS'));
        console.log(`  Avg Resolution Time: ${this.formatTime(this.kpis.avgIssueResolutionTime)}`);
        console.log(`  Baseline:           ${this.formatTime(this.benchmarks.baseline.issueResolutionTime)}`);
        console.log(`  Target:             ${this.formatTime(this.benchmarks.targets.issueResolutionTime)}`);
        
        // Success Metrics
        console.log(chalk.yellow('\n✅ SUCCESS METRICS'));
        console.log(`  Auto-Fix Success:   ${this.formatPercent(this.kpis.autoFixSuccessRate)}`);
        console.log(`  First Attempt:      ${this.formatPercent(this.kpis.firstAttemptSuccessRate)}`);
        console.log(`  Target:             ${this.formatPercent(this.benchmarks.targets.successRate)}`);
        
        // Learning Metrics
        console.log(chalk.yellow('\n LEARNING METRICS'));
        console.log(`  Lesson Application: ${this.formatPercent(this.kpis.lessonApplicationRate)}`);
        console.log(`  Pattern Prevention: ${this.formatPercent(this.kpis.patternPreventionRate)}`);
        console.log(`  Issues/Pattern:     ${this.kpis.issuesPerPattern.toFixed(1)}`);
        
        // Overall Score
        console.log(chalk.yellow('\n OVERALL PERFORMANCE'));
        const score = this.kpis.codeQualityScore * 100;
        const scoreColor = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;
        console.log(`  Quality Score:      ${scoreColor(score.toFixed(1) + '%')}`);
        console.log(`  Rating:             ${this.getRating(score)}`);
        
        // Trends
        this.displayTrends();
        
        console.log(chalk.cyan('\n═══════════════════════════════════════════════════════'));
        
        return this.kpis;
    }
    
    displayTrends() {
        console.log(chalk.yellow('\n TRENDS'));
        
        // Calculate trends over last 10 resolutions
        if (this.metrics.resolutions.length >= 10) {
            const recent = this.metrics.resolutions.slice(-5);
            const previous = this.metrics.resolutions.slice(-10, -5);
            
            const recentAvg = recent.reduce((sum, r) => sum + r.timeSpent, 0) / recent.length;
            const previousAvg = previous.reduce((sum, r) => sum + r.timeSpent, 0) / previous.length;
            
            const trend = ((previousAvg - recentAvg) / previousAvg) * 100;
            const trendIcon = trend > 0 ? '' : trend < 0 ? '' : '➡️';
            const trendColor = trend > 0 ? chalk.green : trend < 0 ? chalk.red : chalk.yellow;
            
            console.log(`  Speed Trend:        ${trendIcon} ${trendColor(trend.toFixed(1) + '%')}`);
        } else {
            console.log(`  Speed Trend:        Insufficient data`);
        }
    }
    
    getRating(score) {
        if (score >= 90) return chalk.green('EXCELLENT');
        if (score >= 75) return chalk.green('VERY GOOD');
        if (score >= 60) return chalk.yellow('GOOD');
        if (score >= 45) return chalk.yellow('FAIR');
        return chalk.red('NEEDS IMPROVEMENT');
    }
    
    formatTime(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    }
    
    formatPercent(value) {
        const percent = value * 100;
        const color = percent >= 80 ? chalk.green : percent >= 50 ? chalk.yellow : chalk.red;
        return color(`${percent.toFixed(1)}%`);
    }
    
    saveMetrics() {
        try {
            fs.writeFileSync(this.metricsPath, JSON.stringify(this.metrics, null, 2));
        } catch (err) {
            console.error(chalk.red('Failed to save metrics:', err.message));
        }
    }
}

// Export for use in other modules
export default PerformanceTracker;

// If run directly, show report
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
    const tracker = new PerformanceTracker();
    
    // Simulate some metrics for demonstration
    if (process.argv[2] === 'demo') {
        tracker.trackIssueResolution(
            { type: 'CONNECTION_ERROR' },
            { type: 'auto', success: true, automated: true },
            45000
        );
        
        tracker.trackPatternRecognition(
            { type: 'PORT_CONFLICT' },
            5,
            3
        );
        
        tracker.trackLearning('lesson_001', 10, 8);
    }
    
    // Generate report
    tracker.generateReport();
}
