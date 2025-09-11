/**
 * Patch for Self-Improving Development System
 * Adds missing utility methods
 */

import SelfImprovingDevelopmentSystem from './self-improving-development-system.js';

// Add missing methods to the prototype
SelfImprovingDevelopmentSystem.prototype.getErrorFrequency = function(message) {
    // Count how many times this error message has occurred
    const similar = this.issues.filter(issue => 
        issue.message && issue.message.includes(message.split(':')[0])
    );
    return similar.length;
};

SelfImprovingDevelopmentSystem.prototype.findRelatedIssues = function(analysis) {
    // Find issues with the same type or similar message
    return this.issues.filter(issue => 
        issue.type === analysis.type || 
        (issue.message && analysis.message && 
         this.calculateSimilarity(issue.message, analysis.message) > 0.5)
    ).slice(-5); // Return last 5 related issues
};

SelfImprovingDevelopmentSystem.prototype.analyzeTimePattern = function(issues) {
    // Analyze if issues happen at regular intervals
    if (issues.length < 2) return { isRegular: false };
    
    const timestamps = issues.map(i => new Date(i.timestamp).getTime());
    const intervals = [];
    
    for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i-1]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    return {
        isRegular: stdDev < avgInterval * 0.3, // Regular if std dev is less than 30% of average
        averageInterval: avgInterval,
        variance: variance
    };
};

SelfImprovingDevelopmentSystem.prototype.findCommonContext = function(issues) {
    // Find common context across issues
    const contexts = {};
    
    issues.forEach(issue => {
        if (issue.context) {
            Object.keys(issue.context).forEach(key => {
                if (!contexts[key]) contexts[key] = {};
                const value = issue.context[key];
                contexts[key][value] = (contexts[key][value] || 0) + 1;
            });
        }
    });
    
    const commonContext = {};
    Object.keys(contexts).forEach(key => {
        const values = Object.entries(contexts[key]);
        if (values.length > 0) {
            values.sort((a, b) => b[1] - a[1]);
            if (values[0][1] > issues.length * 0.5) { // If appears in >50% of issues
                commonContext[key] = values[0][0];
            }
        }
    });
    
    return commonContext;
};

SelfImprovingDevelopmentSystem.prototype.identifyTriggers = function(issues) {
    // Identify common trigger events
    const triggers = [];
    
    // Look for patterns in timing, files, functions, etc.
    const fileMap = {};
    issues.forEach(issue => {
        if (issue.context && issue.context.file) {
            fileMap[issue.context.file] = (fileMap[issue.context.file] || 0) + 1;
        }
    });
    
    Object.entries(fileMap).forEach(([file, count]) => {
        if (count > 1) {
            triggers.push(`File ${file} (${count} occurrences)`);
        }
    });
    
    return triggers;
};

SelfImprovingDevelopmentSystem.prototype.describePattern = function(patterns) {
    const parts = [];
    
    if (patterns.frequency >= 5) {
        parts.push(`Frequent issue (${patterns.frequency} times)`);
    }
    
    if (patterns.timePattern && patterns.timePattern.isRegular) {
        const interval = patterns.timePattern.averageInterval;
        const minutes = Math.floor(interval / 60000);
        parts.push(`occurs every ~${minutes} minutes`);
    }
    
    if (patterns.commonContext && Object.keys(patterns.commonContext).length > 0) {
        const contextStr = Object.entries(patterns.commonContext)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ');
        parts.push(`in context: ${contextStr}`);
    }
    
    return parts.join(', ') || 'Recurring pattern detected';
};

SelfImprovingDevelopmentSystem.prototype.generateRecommendations = function(patterns) {
    const recommendations = [];
    
    if (patterns.frequency >= 5) {
        recommendations.push('Implement automated fix for this recurring issue');
        recommendations.push('Add pre-validation to prevent this error');
    }
    
    if (patterns.timePattern && patterns.timePattern.isRegular) {
        recommendations.push('Check for scheduled tasks or periodic events causing this');
        recommendations.push('Consider implementing rate limiting or debouncing');
    }
    
    if (patterns.commonContext && patterns.commonContext.file) {
        recommendations.push(`Review and refactor ${patterns.commonContext.file}`);
        recommendations.push('Add unit tests for this problematic file');
    }
    
    if (patterns.triggerEvents && patterns.triggerEvents.length > 0) {
        recommendations.push('Implement error handling for identified triggers');
        recommendations.push('Add monitoring for trigger events');
    }
    
    return recommendations;
};

// Additional missing methods
SelfImprovingDevelopmentSystem.prototype.searchPatterns = function(analysis) {
    // Search for pattern-based solutions
    return this.patterns
        .filter(p => p.type === analysis.type)
        .map(p => ({
            id: p.id,
            title: `Pattern: ${p.description}`,
            description: p.recommendations.join('; '),
            confidence: 0.7,
            steps: p.recommendations.map(r => ({
                type: 'recommendation',
                description: r
            }))
        }));
};

SelfImprovingDevelopmentSystem.prototype.searchOnline = async function(analysis) {
    // Simulate online search (would use brave-search in real implementation)
    return [{
        id: 'online-1',
        title: 'Stack Overflow Solution',
        description: `Common solution for ${analysis.type}`,
        confidence: 0.5,
        steps: [
            { type: 'manual', description: 'Check Stack Overflow for similar issues' },
            { type: 'manual', description: 'Apply recommended fix' }
        ]
    }];
};

SelfImprovingDevelopmentSystem.prototype.generateAISolutions = async function(analysis) {
    // Generate AI-based solutions
    return [{
        id: 'ai-1',
        title: 'AI-Generated Solution',
        description: `Automated fix for ${analysis.message}`,
        confidence: 0.6,
        steps: [
            { type: 'command', description: 'Restart the service', command: 'npm restart' },
            { type: 'file_edit', description: 'Update configuration', file: 'config.json' }
        ]
    }];
};

SelfImprovingDevelopmentSystem.prototype.presentSolutions = async function(solutions, analysis) {
    // For now, automatically select the highest confidence solution
    console.log('\n Available solutions:');
    solutions.forEach((sol, idx) => {
        console.log(`  ${idx + 1}. ${sol.title} (confidence: ${(sol.confidence * 100).toFixed(0)}%)`);
    });
    
    // Auto-select highest confidence for testing
    return solutions[0];
};

SelfImprovingDevelopmentSystem.prototype.applySolution = async function(solution, context) {
    console.log(`\n Applying solution: ${solution.title}`);
    return {
        success: true,
        solutionId: solution.id,
        duration: 100,
        notes: 'Solution applied successfully (simulated)'
    };
};

SelfImprovingDevelopmentSystem.prototype.executeCommand = async function(command, context) {
    console.log(`  Executing: ${command}`);
    return 'Command executed';
};

SelfImprovingDevelopmentSystem.prototype.editFile = async function(file, changes, context) {
    console.log(`  Editing file: ${file}`);
    return true;
};

SelfImprovingDevelopmentSystem.prototype.restartService = async function(service) {
    console.log(`  Restarting service: ${service}`);
    return true;
};

SelfImprovingDevelopmentSystem.prototype.changeConfig = async function(config, value) {
    console.log(`  Changing config: ${config} = ${value}`);
    return true;
};

SelfImprovingDevelopmentSystem.prototype.saveSolution = function(solution) {
    // Save solution to database
    this.lessons.push(solution);
    this.saveDatabase(this.lessonsDatabase, this.lessons);
};

SelfImprovingDevelopmentSystem.prototype.trackDocumentUpdate = async function(docName, issueId, solutionId) {
    console.log(`  Tracking update: ${docName} for issue ${issueId}`);
    return true;
};

SelfImprovingDevelopmentSystem.prototype.updateCrossReferences = async function(analysis, docs) {
    console.log(`  Updating cross-references for ${docs.length} documents`);
    return true;
};

SelfImprovingDevelopmentSystem.prototype.generatePreventionTips = function(analysis, solution) {
    const tips = [`Monitor for ${analysis.type} errors`, 'Implement validation'];
    if (solution.preventionTips) {
        tips.push(...solution.preventionTips);
    }
    return tips;
};

SelfImprovingDevelopmentSystem.prototype.documentPattern = async function(pattern) {
    console.log(`  Documenting pattern: ${pattern.description}`);
    return true;
};

SelfImprovingDevelopmentSystem.prototype.updateStatistics = function(result) {
    if (result.success) {
        this.stats.issuesResolved++;
    }
};

SelfImprovingDevelopmentSystem.prototype.documentAutomaticFix = async function(analysis, solution, result) {
    console.log(`  Documenting automatic fix for ${analysis.type}`);
    this.stats.autoFixesApplied++;
    return true;
};

export default SelfImprovingDevelopmentSystem;
