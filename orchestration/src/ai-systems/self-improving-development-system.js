/**
 * Self-Improving Development System v1.0
 * 
 * Integrates issue resolution with real-time document updates
 * Features:
 * - Automatic issue resolution with lesson learning
 * - Real-time document updates with lessons learned
 * - Cross-reference management between issues and docs
 * - Performance metrics and pattern recognition
 */

import fs from 'fs';
import path from 'path';
import { watch } from 'chokidar';
import axios from 'axios';
import chalk from 'chalk';
import { spawn } from 'child_process';

class SelfImprovingDevelopmentSystem {
    constructor() {
        this.basePath = 'C:\\palantir\\math';
        this.docsPath = path.join(this.basePath, 'dev-docs');
        this.orchestratorUrl = 'http://localhost:8089';
        
        // Issue tracking
        this.issueDatabase = path.join(this.docsPath, '.issues_learned.json');
        this.lessonsDatabase = path.join(this.docsPath, '.lessons_applied.json');
        this.patternsDatabase = path.join(this.docsPath, '.patterns_recognized.json');
        
        // Document mapping
        this.documentMap = {
            'MODULE_ERROR': ['TRIVIAL-ISSUES-PREVENTION.md'],
            'CONNECTION_ERROR': ['IMPLEMENTATION-STATUS.md', '06-WEBSOCKET-OPTIMIZATION.md'],
            'PORT_CONFLICT': ['QUICK-START-COMMANDS.md', 'API-REFERENCE.md'],
            'SYNTAX_ERROR': ['TRIVIAL-ISSUES-PREVENTION.md'],
            'PERFORMANCE_ISSUE': ['06-WEBSOCKET-OPTIMIZATION.md'],
            'INTEGRATION_FAILURE': ['INTELLIGENT-DEV-SYSTEM.md'],
            'API_ERROR': ['API-REFERENCE.md', 'MASTER-GUIDE.md']
        };
        
        // Load databases
        this.issues = this.loadDatabase(this.issueDatabase);
        this.lessons = this.loadDatabase(this.lessonsDatabase);
        this.patterns = this.loadDatabase(this.patternsDatabase);
        
        // Statistics
        this.stats = {
            issuesResolved: 0,
            lessonsLearned: 0,
            documentsUpdated: 0,
            patternsRecognized: 0,
            autoFixesApplied: 0
        };
        
        console.log(chalk.green(' Self-Improving Development System v1.0 initialized'));
        this.printStatus();
    }
    
    /**
     * Main entry point for issue handling
     */
    async handleIssue(error, context = {}) {
        console.log(chalk.red('\n️  ISSUE DETECTED'), error.message);
        
        try {
            // 1. Analyze the issue
            const analysis = await this.analyzeIssue(error, context);
            
            // 2. Check if we've seen this before
            const previousSolution = this.findPreviousSolution(analysis);
            
            if (previousSolution && previousSolution.confidence > 0.8) {
                // 3a. Apply known solution automatically
                console.log(chalk.green('✅ Applying known solution automatically'));
                const result = await this.applyKnownSolution(previousSolution, context);
                
                if (result.success) {
                    // Update statistics
                    this.stats.autoFixesApplied++;
                    
                    // Document the automatic fix
                    await this.documentAutomaticFix(analysis, previousSolution, result);
                    return result;
                }
            }
            
            // 3b. Search for new solutions
            const solutions = await this.searchForSolutions(analysis);
            
            // 4. Present options to user
            const selectedSolution = await this.presentSolutions(solutions, analysis);
            
            // 5. Apply the solution
            const result = await this.applySolution(selectedSolution, context);
            
            // 6. Learn from the resolution
            await this.learnFromResolution(analysis, selectedSolution, result);
            
            // 7. Update documentation with lessons learned
            await this.updateDocumentation(analysis, selectedSolution, result);
            
            // 8. Check for patterns
            await this.recognizePatterns(analysis);
            
            // 9. Update statistics
            this.updateStatistics(result);
            
            return result;
            
        } catch (err) {
            console.error(chalk.red('Failed to handle issue:'), err);
            return { success: false, error: err.message };
        }
    }
    
    /**
     * Analyze the issue in detail
     */
    async analyzeIssue(error, context) {
        const analysis = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type: this.categorizeError(error),
            message: error.message,
            stack: error.stack,
            context: {
                file: context.file || 'unknown',
                line: context.line || 0,
                function: context.function || 'unknown',
                ...context
            },
            severity: this.calculateSeverity(error),
            frequency: this.getErrorFrequency(error.message),
            relatedIssues: []
        };
        
        // Find related issues
        analysis.relatedIssues = this.findRelatedIssues(analysis);
        
        // Use Claude API for deeper analysis if available
        if (this.orchestratorUrl) {
            try {
                const response = await axios.post(`${this.orchestratorUrl}/analyze`, {
                    error: error.message,
                    stack: error.stack,
                    context: context
                });
                
                if (response.data) {
                    analysis.aiInsights = response.data.insights;
                    analysis.suggestedFixes = response.data.suggestions;
                }
            } catch (e) {
                // Claude analysis not available, continue without it
            }
        }
        
        return analysis;
    }
    
    /**
     * Find previous solutions for similar issues
     */
    findPreviousSolution(analysis) {
        const similarIssues = this.issues.filter(issue => {
            // Check type match
            if (issue.type !== analysis.type) return false;
            
            // Check message similarity
            const similarity = this.calculateSimilarity(issue.message, analysis.message);
            return similarity > 0.7;
        });
        
        if (similarIssues.length === 0) return null;
        
        // Find the most successful solution
        const solutions = similarIssues
            .map(issue => this.lessons.find(l => l.issueId === issue.id))
            .filter(Boolean)
            .sort((a, b) => b.successRate - a.successRate);
        
        if (solutions.length > 0) {
            return {
                ...solutions[0],
                confidence: solutions[0].successRate * (solutions[0].usageCount / 10)
            };
        }
        
        return null;
    }
    
    /**
     * Apply a known solution automatically
     */
    async applyKnownSolution(solution, context) {
        console.log(chalk.cyan(`\n Applying solution: ${solution.title}`));
        
        const result = {
            success: false,
            solutionId: solution.id,
            steps: [],
            duration: 0
        };
        
        const startTime = Date.now();
        
        try {
            // Execute solution steps
            for (const step of solution.steps) {
                console.log(chalk.gray(`  → ${step.description}`));
                
                const stepResult = await this.executeStep(step, context);
                result.steps.push({
                    description: step.description,
                    success: stepResult.success,
                    output: stepResult.output
                });
                
                if (!stepResult.success) {
                    throw new Error(`Step failed: ${step.description}`);
                }
            }
            
            result.success = true;
            result.duration = Date.now() - startTime;
            
            // Update solution statistics
            solution.usageCount = (solution.usageCount || 0) + 1;
            solution.lastUsed = new Date().toISOString();
            
            // Save updated solution
            this.saveSolution(solution);
            
            console.log(chalk.green(`✅ Solution applied successfully in ${result.duration}ms`));
            
        } catch (err) {
            result.error = err.message;
            console.log(chalk.red(`❌ Solution failed: ${err.message}`));
        }
        
        return result;
    }
    
    /**
     * Execute a single solution step
     */
    async executeStep(step, context) {
        const result = { success: false, output: '' };
        
        try {
            switch (step.type) {
                case 'command':
                    // Execute shell command
                    result.output = await this.executeCommand(step.command, context);
                    result.success = true;
                    break;
                    
                case 'file_edit':
                    // Edit a file
                    await this.editFile(step.file, step.changes, context);
                    result.success = true;
                    break;
                    
                case 'restart_service':
                    // Restart a service
                    await this.restartService(step.service);
                    result.success = true;
                    break;
                    
                case 'config_change':
                    // Change configuration
                    await this.changeConfig(step.config, step.value);
                    result.success = true;
                    break;
                    
                default:
                    throw new Error(`Unknown step type: ${step.type}`);
            }
        } catch (err) {
            result.error = err.message;
        }
        
        return result;
    }
    
    /**
     * Search for new solutions
     */
    async searchForSolutions(analysis) {
        const solutions = [];
        
        // 1. Search in patterns database
        const patternSolutions = this.searchPatterns(analysis);
        solutions.push(...patternSolutions);
        
        // 2. Search online (GitHub, StackOverflow, etc.)
        // This would use brave-search MCP tool in real implementation
        const onlineSolutions = await this.searchOnline(analysis);
        solutions.push(...onlineSolutions);
        
        // 3. Generate AI solutions
        const aiSolutions = await this.generateAISolutions(analysis);
        solutions.push(...aiSolutions);
        
        // 4. Add manual fallback
        solutions.push({
            id: 'manual',
            title: 'Manual Resolution',
            description: 'Resolve the issue manually',
            confidence: 0.3,
            steps: [
                { type: 'manual', description: 'Debug the issue manually' },
                { type: 'manual', description: 'Apply fix based on debugging' }
            ]
        });
        
        // Sort by confidence
        return solutions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    }
    
    /**
     * Learn from the resolution and save lessons
     */
    async learnFromResolution(analysis, solution, result) {
        const lesson = {
            id: `lesson_${Date.now()}`,
            issueId: analysis.id,
            issueType: analysis.type,
            solution: {
                id: solution.id,
                title: solution.title,
                steps: solution.steps
            },
            result: {
                success: result.success,
                duration: result.duration,
                notes: result.notes
            },
            timestamp: new Date().toISOString(),
            successRate: result.success ? 1.0 : 0.0,
            usageCount: 1
        };
        
        // Save the issue
        this.issues.push({
            id: analysis.id,
            type: analysis.type,
            message: analysis.message,
            timestamp: analysis.timestamp,
            resolved: result.success
        });
        
        // Save the lesson
        this.lessons.push(lesson);
        
        // Update databases
        this.saveDatabase(this.issueDatabase, this.issues);
        this.saveDatabase(this.lessonsDatabase, this.lessons);
        
        console.log(chalk.green(` Lesson learned and saved: ${lesson.id}`));
        
        this.stats.lessonsLearned++;
    }
    
    /**
     * Update documentation with lessons learned
     */
    async updateDocumentation(analysis, solution, result) {
        console.log(chalk.cyan('\n Updating documentation with lessons learned...'));
        
        // Determine which documents to update
        const docsToUpdate = this.documentMap[analysis.type] || ['INTELLIGENT-DEV-SYSTEM.md'];
        
        for (const docName of docsToUpdate) {
            const docPath = path.join(this.docsPath, docName);
            
            if (!fs.existsSync(docPath)) {
                console.log(chalk.yellow(`  Document not found: ${docName}`));
                continue;
            }
            
            // Read current content
            let content = fs.readFileSync(docPath, 'utf8');
            
            // Create lesson section
            const lessonSection = this.createLessonSection(analysis, solution, result);
            
            // Find or create "Lessons Learned" section
            const lessonsHeader = '##  Lessons Learned';
            
            if (content.includes(lessonsHeader)) {
                // Insert after header
                const headerIndex = content.indexOf(lessonsHeader);
                const nextHeaderIndex = content.indexOf('\n## ', headerIndex + 1);
                
                if (nextHeaderIndex === -1) {
                    // Append to end of document
                    content += '\n' + lessonSection;
                } else {
                    // Insert before next header
                    content = content.slice(0, nextHeaderIndex) + 
                             lessonSection + '\n' +
                             content.slice(nextHeaderIndex);
                }
            } else {
                // Create new section
                content += '\n\n' + lessonsHeader + '\n\n' + lessonSection;
            }
            
            // Save updated document
            fs.writeFileSync(docPath, content, 'utf8');
            console.log(chalk.green(`  ✅ Updated: ${docName}`));
            
            this.stats.documentsUpdated++;
            
            // Track the update
            await this.trackDocumentUpdate(docName, analysis.id, solution.id);
        }
        
        // Update cross-references
        await this.updateCrossReferences(analysis, docsToUpdate);
    }
    
    /**
     * Create a lesson section for documentation
     */
    createLessonSection(analysis, solution, result) {
        const date = new Date().toISOString().split('T')[0];
        
        let section = `###  ${analysis.type} - ${date}\n\n`;
        section += `**Issue:** ${analysis.message}\n\n`;
        section += `**Solution:** ${solution.title}\n\n`;
        
        if (solution.steps && solution.steps.length > 0) {
            section += '**Steps:**\n';
            solution.steps.forEach((step, index) => {
                section += `${index + 1}. ${step.description}\n`;
            });
            section += '\n';
        }
        
        section += `**Result:** ${result.success ? '✅ Success' : '❌ Failed'}\n`;
        
        if (result.duration) {
            section += `**Duration:** ${result.duration}ms\n`;
        }
        
        if (result.notes) {
            section += `**Notes:** ${result.notes}\n`;
        }
        
        // Add prevention tips
        const preventionTips = this.generatePreventionTips(analysis, solution);
        if (preventionTips.length > 0) {
            section += '\n**Prevention Tips:**\n';
            preventionTips.forEach(tip => {
                section += `- ${tip}\n`;
            });
        }
        
        // Add related issues
        if (analysis.relatedIssues && analysis.relatedIssues.length > 0) {
            section += '\n**Related Issues:**\n';
            analysis.relatedIssues.forEach(issue => {
                section += `- ${issue.type}: ${issue.message} (${issue.timestamp})\n`;
            });
        }
        
        return section;
    }
    
    /**
     * Generate prevention tips based on the issue
     */
    generatePreventionTips(analysis, solution) {
        const tips = [];
        
        switch (analysis.type) {
            case 'MODULE_ERROR':
                tips.push('Always run npm install after pulling changes');
                tips.push('Check package.json for missing dependencies');
                tips.push('Verify node_modules is not corrupted');
                break;
                
            case 'PORT_CONFLICT':
                tips.push('Use dynamic port allocation when possible');
                tips.push('Check for running processes before starting servers');
                tips.push('Implement port conflict detection in startup scripts');
                break;
                
            case 'SYNTAX_ERROR':
                tips.push('Use ESLint or similar linting tools');
                tips.push('Enable syntax highlighting in your editor');
                tips.push('Run syntax checks before committing');
                break;
                
            case 'CONNECTION_ERROR':
                tips.push('Implement retry logic with exponential backoff');
                tips.push('Add health checks for external services');
                tips.push('Use connection pooling where appropriate');
                break;
                
            case 'PERFORMANCE_ISSUE':
                tips.push('Profile code regularly to identify bottlenecks');
                tips.push('Implement caching strategies');
                tips.push('Use performance monitoring tools');
                break;
        }
        
        // Add solution-specific tips
        if (solution.preventionTips) {
            tips.push(...solution.preventionTips);
        }
        
        return tips;
    }
    
    /**
     * Recognize patterns in issues
     */
    async recognizePatterns(analysis) {
        // Get recent issues of the same type
        const recentIssues = this.issues
            .filter(i => i.type === analysis.type)
            .slice(-10);
        
        if (recentIssues.length < 3) return;
        
        // Look for patterns
        const patterns = {
            frequency: recentIssues.length,
            timePattern: this.analyzeTimePattern(recentIssues),
            commonContext: this.findCommonContext(recentIssues),
            triggerEvents: this.identifyTriggers(recentIssues)
        };
        
        // Check if this is a significant pattern
        if (patterns.frequency >= 5 || patterns.timePattern.isRegular) {
            const pattern = {
                id: `pattern_${Date.now()}`,
                type: analysis.type,
                description: this.describePattern(patterns),
                occurrences: patterns.frequency,
                firstSeen: recentIssues[0].timestamp,
                lastSeen: analysis.timestamp,
                patterns: patterns,
                recommendations: this.generateRecommendations(patterns)
            };
            
            // Save pattern
            this.patterns.push(pattern);
            this.saveDatabase(this.patternsDatabase, this.patterns);
            
            console.log(chalk.yellow(`\n Pattern recognized: ${pattern.description}`));
            console.log(chalk.cyan('Recommendations:'));
            pattern.recommendations.forEach(rec => {
                console.log(chalk.gray(`  - ${rec}`));
            });
            
            this.stats.patternsRecognized++;
            
            // Update documentation with pattern
            await this.documentPattern(pattern);
        }
    }
    
    /**
     * Document a recognized pattern
     */
    async documentPattern(pattern) {
        const docPath = path.join(this.docsPath, 'PATTERNS-RECOGNIZED.md');
        
        let content = '';
        if (fs.existsSync(docPath)) {
            content = fs.readFileSync(docPath, 'utf8');
        } else {
            content = '#  Recognized Patterns\n\n';
            content += 'This document contains automatically recognized patterns from issue resolution.\n\n';
        }
        
        const patternSection = `## Pattern: ${pattern.description}\n\n`;
        const details = [
            `**Type:** ${pattern.type}`,
            `**Occurrences:** ${pattern.occurrences}`,
            `**First Seen:** ${pattern.firstSeen}`,
            `**Last Seen:** ${pattern.lastSeen}`,
            '',
            '**Recommendations:**'
        ];
        
        pattern.recommendations.forEach(rec => {
            details.push(`- ${rec}`);
        });
        
        content += patternSection + details.join('\n') + '\n\n---\n\n';
        
        fs.writeFileSync(docPath, content, 'utf8');
        console.log(chalk.green(`  ✅ Pattern documented in PATTERNS-RECOGNIZED.md`));
    }
    
    /**
     * Update cross-references between documents
     */
    async updateCrossReferences(analysis, updatedDocs) {
        const crossRefFile = path.join(this.docsPath, '.doc-sync', 'cross-references.json');
        
        let crossRefs = {};
        if (fs.existsSync(crossRefFile)) {
            crossRefs = JSON.parse(fs.readFileSync(crossRefFile, 'utf8'));
        }
        
        // Add new cross-references
        updatedDocs.forEach(doc => {
            if (!crossRefs[doc]) {
                crossRefs[doc] = {
                    issues: [],
                    lessons: [],
                    patterns: [],
                    lastUpdated: null
                };
            }
            
            crossRefs[doc].issues.push(analysis.id);
            crossRefs[doc].lastUpdated = new Date().toISOString();
            
            // Keep only last 50 issues
            if (crossRefs[doc].issues.length > 50) {
                crossRefs[doc].issues = crossRefs[doc].issues.slice(-50);
            }
        });
        
        // Save cross-references
        const dir = path.dirname(crossRefFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(crossRefFile, JSON.stringify(crossRefs, null, 2));
    }
    
    /**
     * Utility methods
     */
    
    categorizeError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('module') || message.includes('require')) {
            return 'MODULE_ERROR';
        }
        if (message.includes('econnrefused') || message.includes('connection')) {
            return 'CONNECTION_ERROR';
        }
        if (message.includes('eaddrinuse') || message.includes('port')) {
            return 'PORT_CONFLICT';
        }
        if (message.includes('syntax') || message.includes('unexpected')) {
            return 'SYNTAX_ERROR';
        }
        if (message.includes('timeout') || message.includes('slow')) {
            return 'PERFORMANCE_ISSUE';
        }
        if (message.includes('integration') || message.includes('api')) {
            return 'INTEGRATION_FAILURE';
        }
        
        return 'UNKNOWN_ERROR';
    }
    
    calculateSeverity(error) {
        if (error.critical || error.message.includes('FATAL')) return 'CRITICAL';
        if (error.message.includes('ERROR')) return 'HIGH';
        if (error.message.includes('WARN')) return 'MEDIUM';
        return 'LOW';
    }
    
    calculateSimilarity(str1, str2) {
        // Simple similarity calculation
        const words1 = str1.toLowerCase().split(/\s+/);
        const words2 = str2.toLowerCase().split(/\s+/);
        
        const intersection = words1.filter(w => words2.includes(w));
        const union = [...new Set([...words1, ...words2])];
        
        return intersection.length / union.length;
    }
    
    loadDatabase(filepath) {
        try {
            if (fs.existsSync(filepath)) {
                return JSON.parse(fs.readFileSync(filepath, 'utf8'));
            }
        } catch (err) {
            console.error(`Failed to load database ${filepath}:`, err);
        }
        return [];
    }
    
    saveDatabase(filepath, data) {
        try {
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error(`Failed to save database ${filepath}:`, err);
        }
    }
    
    /**
     * Print system status
     */
    printStatus() {
        console.log(chalk.cyan('\n System Status:'));
        console.log(`  Issues tracked: ${this.issues.length}`);
        console.log(`  Lessons learned: ${this.lessons.length}`);
        console.log(`  Patterns recognized: ${this.patterns.length}`);
        console.log(`  Document mappings: ${Object.keys(this.documentMap).length}`);
    }
    
    /**
     * Generate status report
     */
    generateReport() {
        return {
            timestamp: new Date().toISOString(),
            statistics: this.stats,
            recentIssues: this.issues.slice(-10),
            recentLessons: this.lessons.slice(-5),
            patterns: this.patterns.slice(-3),
            successRate: this.calculateSuccessRate(),
            mostCommonIssues: this.getMostCommonIssues(),
            documentationHealth: this.assessDocumentationHealth()
        };
    }
    
    calculateSuccessRate() {
        const resolved = this.issues.filter(i => i.resolved).length;
        return this.issues.length > 0 ? (resolved / this.issues.length) * 100 : 0;
    }
    
    getMostCommonIssues() {
        const counts = {};
        this.issues.forEach(issue => {
            counts[issue.type] = (counts[issue.type] || 0) + 1;
        });
        
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
    }
    
    assessDocumentationHealth() {
        const docsUpdated = new Set();
        this.lessons.forEach(lesson => {
            const docs = this.documentMap[lesson.issueType] || [];
            docs.forEach(doc => docsUpdated.add(doc));
        });
        
        return {
            documentsWithLessons: docsUpdated.size,
            totalDocuments: Object.values(this.documentMap).flat().length,
            coverage: (docsUpdated.size / Object.values(this.documentMap).flat().length) * 100
        };
    }
}

// Export for use in other modules
export default SelfImprovingDevelopmentSystem;

// CLI interface if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const system = new SelfImprovingDevelopmentSystem();
    
    console.log(chalk.green('\n✅ Self-Improving Development System is running'));
    console.log(chalk.cyan('This system will:'));
    console.log('  1. Automatically detect and resolve issues');
    console.log('  2. Learn from every resolution');
    console.log('  3. Update documentation with lessons learned');
    console.log('  4. Recognize patterns and prevent future issues');
    console.log('  5. Continuously improve the development process');
    
    // Example: Simulate an issue
    if (process.argv[2] === 'test') {
        const testError = new Error('ECONNREFUSED: Connection refused to localhost:8089');
        system.handleIssue(testError, {
            file: 'test.js',
            line: 42,
            function: 'connectToOrchestrator'
        }).then(result => {
            console.log('\nTest completed:', result);
            
            // Generate report
            const report = system.generateReport();
            console.log('\n System Report:');
            console.log(JSON.stringify(report, null, 2));
        });
    }
}
