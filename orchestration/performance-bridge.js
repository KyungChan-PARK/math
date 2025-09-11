/**
 * Performance Integration Bridge
 * Connects Performance Tracker with Self-Improving System
 */

import SelfImprovingDevelopmentSystem from './self-improving-development-system.js';
import PerformanceTracker from './performance-tracker.js';
import chalk from 'chalk';

// Create performance tracker instance
const performanceTracker = new PerformanceTracker();

// Store original methods for wrapping
const originalHandleIssue = SelfImprovingDevelopmentSystem.prototype.handleIssue;
const originalLearnFromResolution = SelfImprovingDevelopmentSystem.prototype.learnFromResolution;
const originalRecognizePatterns = SelfImprovingDevelopmentSystem.prototype.recognizePatterns;

// Track issue resolution performance
SelfImprovingDevelopmentSystem.prototype.handleIssue = async function(error, context = {}) {
    const startTime = Date.now();
    console.log(chalk.blue('\n⏱️  Performance tracking started'));
    
    // Call original method
    const result = await originalHandleIssue.call(this, error, context);
    
    // Track performance
    const timeSpent = Date.now() - startTime;
    performanceTracker.trackIssueResolution(
        { type: this.categorizeError(error) },
        { 
            type: result.success ? 'auto' : 'manual',
            success: result.success,
            automated: result.solutionId && result.solutionId.includes('auto'),
            agentUsed: context.agentUsed || 'none'
        },
        timeSpent
    );
    
    console.log(chalk.blue(`⏱️  Resolution completed in ${timeSpent}ms`));
    
    return result;
};

// Track learning performance
SelfImprovingDevelopmentSystem.prototype.learnFromResolution = async function(analysis, solution, result) {
    console.log(chalk.blue(' Tracking learning performance'));
    
    // Call original method
    await originalLearnFromResolution.call(this, analysis, solution, result);
    
    // Track learning metrics
    const lessonId = `lesson_${Date.now()}`;
    const applications = 1; // Initial application
    const successes = result.success ? 1 : 0;
    
    performanceTracker.trackLearning(lessonId, applications, successes);
    
    return true;
};

// Track pattern recognition performance
SelfImprovingDevelopmentSystem.prototype.recognizePatterns = async function(analysis) {
    console.log(chalk.blue(' Tracking pattern recognition'));
    
    // Call original method
    await originalRecognizePatterns.call(this, analysis);
    
    // Track pattern metrics
    const recentIssues = this.issues
        .filter(i => i.type === analysis.type)
        .slice(-10);
        
    if (recentIssues.length >= 5) {
        performanceTracker.trackPatternRecognition(
            { type: analysis.type },
            recentIssues.length,
            0 // Prevented count would be tracked over time
        );
    }
    
    return true;
};

// Add method to generate performance report
SelfImprovingDevelopmentSystem.prototype.generatePerformanceReport = function() {
    return performanceTracker.generateReport();
};

console.log(chalk.green('✅ Performance Tracking Integrated'));

export default SelfImprovingDevelopmentSystem;
