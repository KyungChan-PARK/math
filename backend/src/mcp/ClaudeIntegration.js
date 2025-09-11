/**
 * Claude Integration for MCP Server
 * Provides direct Claude API integration for response validation and improvement
 */

import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';
import crypto from 'crypto';

export class ClaudeIntegration extends EventEmitter {
    constructor(config = {}) {
        super();
        this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
        this.anthropic = null;
        this.model = config.model || 'claude-3-5-sonnet-20241022';
        this.maxTokens = config.maxTokens || 4096;
        this.cache = new Map();
        this.cacheTimeout = config.cacheTimeout || 3600000; // 1 hour
        this.validationHistory = [];
        
        this.initialize();
    }

    async initialize() {
        if (this.apiKey) {
            this.anthropic = new Anthropic({ apiKey: this.apiKey });
            console.log('Claude Integration: Initialized with API key');
        } else {
            console.warn('Claude Integration: No API key - running in simulation mode');
        }
    }

    /**
     * Validate AI response against current documentation
     */
    async validateResponse(response, documentation) {
        const cacheKey = this.getCacheKey(response);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.result;
            }
        }

        const validation = {
            valid: true,
            issues: [],
            suggestions: [],
            confidence: 0,
            timestamp: Date.now()
        };

        try {
            if (this.anthropic) {
                // Real Claude API validation
                const systemPrompt = this.buildValidationPrompt(documentation);
                const result = await this.anthropic.messages.create({
                    model: this.model,
                    max_tokens: 1024,
                    system: systemPrompt,
                    messages: [{
                        role: 'user',
                        content: `Validate this AI response for accuracy and potential hallucinations:\n\n${response}`
                    }]
                });

                const analysis = this.parseValidationResponse(result.content[0].text);
                validation.valid = analysis.valid;
                validation.issues = analysis.issues;
                validation.suggestions = analysis.suggestions;
                validation.confidence = analysis.confidence;
            } else {
                // Simulation mode - basic validation
                validation.valid = !response.includes('undefined');
                validation.confidence = 0.7;
                if (!validation.valid) {
                    validation.issues.push('Potential undefined reference detected');
                    validation.suggestions.push('Check API documentation for correct endpoints');
                }
            }

            // Cache the result
            this.cache.set(cacheKey, {
                result: validation,
                timestamp: Date.now()
            });

            // Store in history
            this.validationHistory.push({
                response: response.substring(0, 100),
                validation,
                timestamp: Date.now()
            });

            // Emit validation event
            this.emit('validation', validation);

            return validation;
        } catch (error) {
            console.error('Claude validation error:', error);
            validation.valid = false;
            validation.issues.push(`Validation error: ${error.message}`);
            return validation;
        }
    }

    /**
     * Generate improved version of the response
     */
    async improveResponse(response, documentation, issues) {
        if (!this.anthropic) {
            return {
                improved: response,
                changes: [],
                confidence: 0
            };
        }

        try {
            const systemPrompt = this.buildImprovementPrompt(documentation);
            const result = await this.anthropic.messages.create({
                model: this.model,
                max_tokens: this.maxTokens,
                system: systemPrompt,
                messages: [{
                    role: 'user',
                    content: `Improve this response to fix these issues:\n\nIssues:\n${issues.join('\n')}\n\nOriginal Response:\n${response}`
                }]
            });

            const improved = result.content[0].text;
            const changes = this.detectChanges(response, improved);

            return {
                improved,
                changes,
                confidence: 0.9,
                model: this.model
            };
        } catch (error) {
            console.error('Claude improvement error:', error);
            return {
                improved: response,
                changes: [],
                confidence: 0,
                error: error.message
            };
        }
    }

    /**
     * Generate documentation from code
     */
    async generateDocumentation(code, context = {}) {
        if (!this.anthropic) {
            return this.generateSimulatedDocs(code);
        }

        try {
            const result = await this.anthropic.messages.create({
                model: this.model,
                max_tokens: 2048,
                messages: [{
                    role: 'user',
                    content: `Generate comprehensive API documentation for this code:\n\n${code}\n\nContext: ${JSON.stringify(context)}`
                }]
            });

            return {
                documentation: result.content[0].text,
                format: 'markdown',
                generated: true,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Documentation generation error:', error);
            return this.generateSimulatedDocs(code);
        }
    }

    /**
     * Analyze code for potential improvements
     */
    async analyzeCode(code, type = 'general') {
        const suggestions = [];
        
        if (this.anthropic) {
            try {
                const result = await this.anthropic.messages.create({
                    model: this.model,
                    max_tokens: 1024,
                    messages: [{
                        role: 'user',
                        content: `Analyze this ${type} code for improvements:\n\n${code}\n\nProvide specific, actionable suggestions.`
                    }]
                });

                const analysis = result.content[0].text;
                suggestions.push(...this.parseSuggestions(analysis));
            } catch (error) {
                console.error('Code analysis error:', error);
            }
        }

        // Add basic static analysis
        if (code.includes('var ')) {
            suggestions.push('Consider using const or let instead of var');
        }
        if (!code.includes('try')) {
            suggestions.push('Add error handling with try-catch blocks');
        }
        if (code.length > 500 && !code.includes('/**')) {
            suggestions.push('Add JSDoc comments for better documentation');
        }

        return {
            suggestions,
            type,
            timestamp: Date.now()
        };
    }

    /**
     * Real-time hallucination detection
     */
    async detectHallucination(statement, facts) {
        const factMap = new Map(facts.map(f => [f.key, f.value]));
        
        // Quick checks
        const patterns = [
            /api\/(\w+)/g,  // API endpoints
            /port\s+(\d+)/g, // Port numbers
            /version\s+([\d.]+)/g // Version numbers
        ];

        const issues = [];
        
        for (const pattern of patterns) {
            const matches = statement.matchAll(pattern);
            for (const match of matches) {
                const key = match[0];
                if (factMap.has(key) && factMap.get(key) !== match[1]) {
                    issues.push({
                        type: 'factual_error',
                        found: match[1],
                        expected: factMap.get(key),
                        context: match[0]
                    });
                }
            }
        }

        // Use Claude for deeper analysis if available
        if (this.anthropic && issues.length === 0) {
            try {
                const result = await this.anthropic.messages.create({
                    model: this.model,
                    max_tokens: 512,
                    messages: [{
                        role: 'user',
                        content: `Check if this statement contains hallucinations:\n\nStatement: ${statement}\n\nFacts:\n${facts.map(f => `- ${f.key}: ${f.value}`).join('\n')}\n\nRespond with JSON: {"hallucinated": boolean, "issues": []}`
                    }]
                });

                const analysis = JSON.parse(result.content[0].text);
                if (analysis.hallucinated) {
                    issues.push(...analysis.issues);
                }
            } catch (error) {
                console.error('Hallucination detection error:', error);
            }
        }

        return {
            hallucinated: issues.length > 0,
            issues,
            confidence: this.anthropic ? 0.95 : 0.7
        };
    }

    // Helper methods
    buildValidationPrompt(documentation) {
        return `You are a code validator. You have access to the following current documentation:

APIs: ${JSON.stringify(documentation.apis)}
Schemas: ${JSON.stringify(documentation.schemas)}

Validate responses for:
1. Correct API endpoint usage
2. Valid parameter types
3. Accurate schema references
4. No hallucinated features

Respond with JSON: {"valid": boolean, "issues": [], "suggestions": [], "confidence": 0-1}`;
    }

    buildImprovementPrompt(documentation) {
        return `You are a code improver with access to current documentation:

${JSON.stringify(documentation)}

Fix issues while maintaining functionality. Be precise and accurate.`;
    }

    parseValidationResponse(text) {
        try {
            // Try to parse as JSON first
            return JSON.parse(text);
        } catch {
            // Fallback to text parsing
            const validation = {
                valid: !text.toLowerCase().includes('invalid'),
                issues: [],
                suggestions: [],
                confidence: 0.5
            };

            // Extract issues and suggestions from text
            const lines = text.split('\n');
            lines.forEach(line => {
                if (line.includes('Issue:') || line.includes('Error:')) {
                    validation.issues.push(line.replace(/^.*?:/, '').trim());
                }
                if (line.includes('Suggestion:') || line.includes('Fix:')) {
                    validation.suggestions.push(line.replace(/^.*?:/, '').trim());
                }
            });

            return validation;
        }
    }

    parseSuggestions(text) {
        const suggestions = [];
        const lines = text.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#') && line.length > 10) {
                // Remove bullet points and numbers
                const cleaned = line.replace(/^[\d\-\*\•]+\.?\s*/, '');
                if (cleaned.length > 10) {
                    suggestions.push(cleaned);
                }
            }
        });

        return suggestions;
    }

    detectChanges(original, improved) {
        const changes = [];
        const originalLines = original.split('\n');
        const improvedLines = improved.split('\n');

        for (let i = 0; i < Math.max(originalLines.length, improvedLines.length); i++) {
            if (originalLines[i] !== improvedLines[i]) {
                changes.push({
                    line: i + 1,
                    original: originalLines[i] || '',
                    improved: improvedLines[i] || '',
                    type: this.classifyChange(originalLines[i], improvedLines[i])
                });
            }
        }

        return changes;
    }

    classifyChange(original, improved) {
        if (!original) return 'addition';
        if (!improved) return 'deletion';
        if (original.includes('var ') && improved.includes('const ')) return 'modernization';
        if (!original.includes('try') && improved.includes('try')) return 'error_handling';
        return 'modification';
    }

    generateSimulatedDocs(code) {
        // Basic documentation generation for simulation mode
        const lines = code.split('\n');
        const functions = [];
        
        lines.forEach(line => {
            const funcMatch = line.match(/(?:async\s+)?function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/);
            if (funcMatch) {
                functions.push(funcMatch[1] || funcMatch[2]);
            }
        });

        const docs = `# API Documentation\n\n${functions.map(f => `## ${f}\n\nFunction documentation pending.\n`).join('\n')}`;
        
        return {
            documentation: docs,
            format: 'markdown',
            generated: true,
            simulated: true,
            timestamp: Date.now()
        };
    }

    getCacheKey(content) {
        return crypto.createHash('md5').update(content).digest('hex');
    }

    clearCache() {
        this.cache.clear();
        this.validationHistory = [];
    }

    getStats() {
        return {
            cacheSize: this.cache.size,
            validationHistory: this.validationHistory.length,
            apiKeyPresent: !!this.apiKey,
            model: this.model
        };
    }
}

export default ClaudeIntegration;
