/**
 * Bridge to connect Self-Improving System with Claude Orchestrator
 * Enhances issue resolution with AI agent intelligence
 */

import SelfImprovingDevelopmentSystem from './self-improving-development-system.js';
import OrchestratorIntegration from './orchestrator-integration.js';
import chalk from 'chalk';

// Create orchestrator integration instance
const orchestrator = new OrchestratorIntegration();

// Store original methods
const originalAnalyzeIssue = SelfImprovingDevelopmentSystem.prototype.analyzeIssue;
const originalSearchForSolutions = SelfImprovingDevelopmentSystem.prototype.searchForSolutions;
const originalUpdateDocumentation = SelfImprovingDevelopmentSystem.prototype.updateDocumentation;

// Enhanced analyzeIssue with orchestrator
SelfImprovingDevelopmentSystem.prototype.analyzeIssue = async function(error, context) {
    console.log(chalk.cyan('\n Enhanced Analysis with Claude Orchestrator'));
    
    // First, do original analysis
    const analysis = await originalAnalyzeIssue.call(this, error, context);
    
    // Then enhance with orchestrator
    const orchestratorResult = await orchestrator.enhanceIssueResolution(analysis, context);
    
    if (orchestratorResult && orchestratorResult.success) {
        // Merge orchestrator insights
        analysis.aiEnhanced = true;
        analysis.agentUsed = orchestratorResult.agent;
        analysis.enhancedInsights = orchestratorResult.analysis;
        analysis.confidence = orchestratorResult.confidence;
        
        console.log(chalk.green(`  ✅ Enhanced by ${orchestratorResult.agent} agent`));
    }
    
    return analysis;
};

// Enhanced searchForSolutions with orchestrator
SelfImprovingDevelopmentSystem.prototype.searchForSolutions = async function(analysis) {
    console.log(chalk.cyan('\n Searching for solutions with AI assistance'));
    
    // Get original solutions
    const originalSolutions = await originalSearchForSolutions.call(this, analysis);
    
    // If analysis was AI-enhanced, prioritize those solutions
    if (analysis.aiEnhanced && analysis.enhancedInsights) {
        const aiSolutions = (analysis.enhancedInsights.solutions || []).map(sol => ({
            ...sol,
            confidence: sol.confidence * 1.2, // Boost AI solutions
            source: 'Claude Orchestrator'
        }));
        
        // Merge with original solutions
        const allSolutions = [...aiSolutions, ...originalSolutions];
        
        // Sort by confidence and return top 5
        return allSolutions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    }
    
    return originalSolutions;
};

// Enhanced documentation update
SelfImprovingDevelopmentSystem.prototype.updateDocumentation = async function(analysis, solution, result) {
    console.log(chalk.cyan('\n Updating documentation with AI enhancement'));
    
    // First, do original update
    await originalUpdateDocumentation.call(this, analysis, solution, result);
    
    // Then enhance with orchestrator
    const lesson = {
        issue: analysis.type,
        solution: solution.title,
        result: result.success ? 'success' : 'failed'
    };
    
    const enhancementResult = await orchestrator.enhanceDocumentUpdate(
        'MASTER-GUIDE.md',
        '', // Current content would be loaded in real implementation
        lesson
    );
    
    if (enhancementResult && enhancementResult.success) {
        console.log(chalk.green('  ✅ Documentation enhanced by Claude'));
        this.stats.documentsUpdated++;
    }
    
    return true;
};

// Add method to get orchestrator stats
SelfImprovingDevelopmentSystem.prototype.getOrchestratorStats = function() {
    return orchestrator.getStats();
};

console.log(chalk.green('✅ Orchestrator Integration Loaded'));
console.log(chalk.cyan(' 5 Claude Agents Ready:'));
console.log('  • mathConcept - Math expertise');
console.log('  • gestureAnalyzer - Gesture analysis');
console.log('  • scriptGenerator - Code generation');
console.log('  • documentManager - Documentation');
console.log('  • performanceOptimizer - Performance tuning');

export default SelfImprovingDevelopmentSystem;
