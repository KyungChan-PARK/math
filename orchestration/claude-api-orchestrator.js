/**
 * Real Claude API Orchestrator
 * Uses actual Claude API orchestration (Claude in Claude / Claudeception)
 * This can be run in artifacts or analysis tool to orchestrate multiple Claude instances
 */

class ClaudeAPIOrchestrator {
    constructor() {
        // Claude API endpoint (no API key needed in artifacts/analysis)
        this.apiEndpoint = "https://api.anthropic.com/v1/messages";
        this.model = "claude-sonnet-4-20250514";
        
        // Specialized prompts for different tasks
        this.specialists = {
            gesture: {
                name: 'Gesture Recognition Specialist',
                systemPrompt: `You are a gesture recognition expert. Analyze hand landmarks and identify mathematical gestures.
                Focus on: pinch (scaling), spread (angle adjustment), grab (movement), point (selection), draw (creation).
                Always respond with JSON containing: {gesture, confidence, parameters, mathOperation}`,
                maxTokens: 500
            },
            math: {
                name: 'Mathematical Problem Solver',
                systemPrompt: `You are a mathematical reasoning expert. Solve math problems step by step.
                Provide clear explanations and visual representations when possible.
                Always respond with JSON containing: {solution, steps, visualization, confidence}`,
                maxTokens: 1000
            },
            visual: {
                name: 'Visual Analysis Specialist',
                systemPrompt: `You are a visual processing expert. Analyze images and geometric shapes.
                Identify mathematical concepts in visual representations.
                Always respond with JSON containing: {objects, relationships, mathConcepts, confidence}`,
                maxTokens: 800
            },
            educator: {
                name: 'Math Education Specialist',
                systemPrompt: `You are a math education expert. Create engaging explanations for students.
                Adapt complexity based on student level. Use metaphors and real-world examples.
                Always respond with JSON containing: {explanation, examples, exercises, difficulty}`,
                maxTokens: 1200
            }
        };
        
        // Task routing rules
        this.routingRules = {
            gesture_recognition: ['gesture'],
            math_problem: ['math', 'educator'],
            visual_analysis: ['visual', 'math'],
            complex_learning: ['gesture', 'math', 'visual', 'educator'],
            explanation: ['educator', 'visual']
        };
        
        // Cache for responses
        this.responseCache = new Map();
        this.cacheTimeout = 60000; // 1 minute
        
        // Metrics
        this.metrics = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            averageLatency: 0,
            specialistMetrics: {}
        };
        
        // Initialize specialist metrics
        Object.keys(this.specialists).forEach(key => {
            this.metrics.specialistMetrics[key] = {
                calls: 0,
                successes: 0,
                failures: 0,
                totalLatency: 0
            };
        });
    }
    
    /**
     * Main orchestration method - routes tasks to appropriate specialists
     */
    async processTask(taskType, input, options = {}) {
        const startTime = Date.now();
        
        try {
            // Check cache first
            const cacheKey = `${taskType}_${JSON.stringify(input)}`;
            if (this.responseCache.has(cacheKey)) {
                const cached = this.responseCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log('Returning cached response');
                    return cached.response;
                }
            }
            
            // Determine which specialists to use
            const specialistKeys = this.routingRules[taskType] || ['educator'];
            
            // Process with each specialist
            const responses = await Promise.all(
                specialistKeys.map(key => this.callSpecialist(key, input, options))
            );
            
            // Combine responses
            const combined = this.combineResponses(responses, taskType);
            
            // Update metrics
            const latency = Date.now() - startTime;
            this.updateMetrics(true, latency);
            
            // Cache response
            this.responseCache.set(cacheKey, {
                response: combined,
                timestamp: Date.now()
            });
            
            // Clean old cache entries
            this.cleanCache();
            
            return combined;
            
        } catch (error) {
            console.error('Task processing failed:', error);
            this.updateMetrics(false, Date.now() - startTime);
            throw error;
        }
    }
    
    /**
     * Call a specific Claude specialist
     */
    async callSpecialist(specialistKey, input, options = {}) {
        const specialist = this.specialists[specialistKey];
        if (!specialist) {
            throw new Error(`Unknown specialist: ${specialistKey}`);
        }
        
        const startTime = Date.now();
        
        try {
            // Prepare the prompt
            const userPrompt = this.formatInputForSpecialist(specialistKey, input);
            
            // Make the API call
            const response = await fetch(this.apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: specialist.maxTokens,
                    messages: [
                        {
                            role: "system",
                            content: specialist.systemPrompt
                        },
                        {
                            role: "user",
                            content: userPrompt
                        }
                    ],
                    temperature: options.temperature || 0.3
                })
            });
            
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status}`);
            }
            
            const data = await response.json();
            const claudeResponse = data.content[0].text;
            
            // Parse JSON response
            let parsedResponse;
            try {
                // Remove markdown code blocks if present
                const cleanJson = claudeResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                parsedResponse = JSON.parse(cleanJson);
            } catch (parseError) {
                console.error('Failed to parse specialist response:', parseError);
                parsedResponse = { 
                    raw: claudeResponse, 
                    error: 'Failed to parse JSON response' 
                };
            }
            
            // Update specialist metrics
            const latency = Date.now() - startTime;
            this.updateSpecialistMetrics(specialistKey, true, latency);
            
            return {
                specialist: specialistKey,
                response: parsedResponse,
                latency,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error(`Specialist ${specialistKey} failed:`, error);
            this.updateSpecialistMetrics(specialistKey, false, Date.now() - startTime);
            
            return {
                specialist: specialistKey,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    
    /**
     * Format input for specific specialist
     */
    formatInputForSpecialist(specialistKey, input) {
        switch (specialistKey) {
            case 'gesture':
                return `Analyze these hand landmarks and identify the mathematical gesture:
                ${JSON.stringify(input)}
                Consider the context of math education and provide actionable insights.`;
                
            case 'math':
                return `Solve this mathematical problem:
                ${typeof input === 'string' ? input : JSON.stringify(input)}
                Show your work step by step and explain the reasoning.`;
                
            case 'visual':
                return `Analyze this visual/geometric information:
                ${JSON.stringify(input)}
                Identify mathematical concepts and relationships.`;
                
            case 'educator':
                return `Create an educational explanation for:
                ${typeof input === 'string' ? input : JSON.stringify(input)}
                Make it engaging and appropriate for K-12 students.`;
                
            default:
                return JSON.stringify(input);
        }
    }
    
    /**
     * Combine responses from multiple specialists
     */
    combineResponses(responses, taskType) {
        const validResponses = responses.filter(r => !r.error);
        
        if (validResponses.length === 0) {
            return {
                success: false,
                error: 'All specialists failed',
                attempts: responses
            };
        }
        
        // Task-specific combination logic
        switch (taskType) {
            case 'gesture_recognition':
                return this.combineGestureResponses(validResponses);
                
            case 'math_problem':
                return this.combineMathResponses(validResponses);
                
            case 'visual_analysis':
                return this.combineVisualResponses(validResponses);
                
            case 'complex_learning':
                return this.combineComplexResponses(validResponses);
                
            default:
                return {
                    success: true,
                    responses: validResponses,
                    consensus: this.findConsensus(validResponses)
                };
        }
    }
    
    /**
     * Combine gesture recognition responses
     */
    combineGestureResponses(responses) {
        const gestureVotes = {};
        let totalConfidence = 0;
        
        responses.forEach(r => {
            if (r.response && r.response.gesture) {
                const gesture = r.response.gesture;
                gestureVotes[gesture] = (gestureVotes[gesture] || 0) + (r.response.confidence || 0.5);
                totalConfidence += r.response.confidence || 0.5;
            }
        });
        
        // Find gesture with highest confidence
        let bestGesture = null;
        let maxVotes = 0;
        
        Object.entries(gestureVotes).forEach(([gesture, votes]) => {
            if (votes > maxVotes) {
                maxVotes = votes;
                bestGesture = gesture;
            }
        });
        
        return {
            success: true,
            gesture: bestGesture,
            confidence: totalConfidence / responses.length,
            details: responses.map(r => r.response),
            consensus: maxVotes / totalConfidence
        };
    }
    
    /**
     * Combine math problem responses
     */
    combineMathResponses(responses) {
        // Extract solutions and steps from all responses
        const solutions = [];
        const allSteps = [];
        
        responses.forEach(r => {
            if (r.response) {
                if (r.response.solution) {
                    solutions.push(r.response.solution);
                }
                if (r.response.steps) {
                    allSteps.push(...r.response.steps);
                }
            }
        });
        
        // Find most common solution
        const solutionCounts = {};
        solutions.forEach(sol => {
            const key = JSON.stringify(sol);
            solutionCounts[key] = (solutionCounts[key] || 0) + 1;
        });
        
        let bestSolution = null;
        let maxCount = 0;
        
        Object.entries(solutionCounts).forEach(([sol, count]) => {
            if (count > maxCount) {
                maxCount = count;
                bestSolution = JSON.parse(sol);
            }
        });
        
        return {
            success: true,
            solution: bestSolution,
            steps: allSteps,
            agreement: maxCount / solutions.length,
            explanations: responses.filter(r => r.specialist === 'educator').map(r => r.response)
        };
    }
    
    /**
     * Combine visual analysis responses
     */
    combineVisualResponses(responses) {
        const allObjects = new Set();
        const allConcepts = new Set();
        const relationships = [];
        
        responses.forEach(r => {
            if (r.response) {
                if (r.response.objects) {
                    r.response.objects.forEach(obj => allObjects.add(obj));
                }
                if (r.response.mathConcepts) {
                    r.response.mathConcepts.forEach(concept => allConcepts.add(concept));
                }
                if (r.response.relationships) {
                    relationships.push(...r.response.relationships);
                }
            }
        });
        
        return {
            success: true,
            objects: Array.from(allObjects),
            mathConcepts: Array.from(allConcepts),
            relationships,
            visualInsights: responses.map(r => r.response)
        };
    }
    
    /**
     * Combine complex learning responses
     */
    combineComplexResponses(responses) {
        const combined = {
            success: true,
            gesture: null,
            math: null,
            visual: null,
            education: null
        };
        
        responses.forEach(r => {
            switch (r.specialist) {
                case 'gesture':
                    combined.gesture = r.response;
                    break;
                case 'math':
                    combined.math = r.response;
                    break;
                case 'visual':
                    combined.visual = r.response;
                    break;
                case 'educator':
                    combined.education = r.response;
                    break;
            }
        });
        
        // Create integrated learning experience
        combined.integratedLesson = this.createIntegratedLesson(combined);
        
        return combined;
    }
    
    /**
     * Create integrated lesson from multiple specialist responses
     */
    createIntegratedLesson(components) {
        const lesson = {
            topic: 'Interactive Math Concept',
            components: [],
            interactionFlow: []
        };
        
        if (components.gesture) {
            lesson.components.push({
                type: 'gesture_interaction',
                data: components.gesture
            });
            lesson.interactionFlow.push('Use gestures to manipulate mathematical objects');
        }
        
        if (components.math) {
            lesson.components.push({
                type: 'mathematical_content',
                data: components.math
            });
            lesson.interactionFlow.push('Solve problems step by step');
        }
        
        if (components.visual) {
            lesson.components.push({
                type: 'visual_representation',
                data: components.visual
            });
            lesson.interactionFlow.push('Visualize mathematical concepts');
        }
        
        if (components.education) {
            lesson.components.push({
                type: 'educational_guidance',
                data: components.education
            });
            lesson.interactionFlow.push('Follow guided explanations');
        }
        
        return lesson;
    }
    
    /**
     * Find consensus among responses
     */
    findConsensus(responses) {
        // Simple consensus: most common response pattern
        const patterns = {};
        
        responses.forEach(r => {
            const key = JSON.stringify(r.response);
            patterns[key] = (patterns[key] || 0) + 1;
        });
        
        let maxCount = 0;
        let consensus = null;
        
        Object.entries(patterns).forEach(([pattern, count]) => {
            if (count > maxCount) {
                maxCount = count;
                consensus = JSON.parse(pattern);
            }
        });
        
        return {
            data: consensus,
            agreement: maxCount / responses.length
        };
    }
    
    /**
     * Update overall metrics
     */
    updateMetrics(success, latency) {
        this.metrics.totalCalls++;
        
        if (success) {
            this.metrics.successfulCalls++;
        } else {
            this.metrics.failedCalls++;
        }
        
        // Update average latency
        const totalLatency = this.metrics.averageLatency * (this.metrics.totalCalls - 1) + latency;
        this.metrics.averageLatency = totalLatency / this.metrics.totalCalls;
    }
    
    /**
     * Update specialist-specific metrics
     */
    updateSpecialistMetrics(specialistKey, success, latency) {
        const metrics = this.metrics.specialistMetrics[specialistKey];
        
        metrics.calls++;
        if (success) {
            metrics.successes++;
        } else {
            metrics.failures++;
        }
        
        metrics.totalLatency += latency;
    }
    
    /**
     * Clean old cache entries
     */
    cleanCache() {
        const now = Date.now();
        const entriesToDelete = [];
        
        this.responseCache.forEach((value, key) => {
            if (now - value.timestamp > this.cacheTimeout) {
                entriesToDelete.push(key);
            }
        });
        
        entriesToDelete.forEach(key => this.responseCache.delete(key));
    }
    
    /**
     * Get current metrics
     */
    getMetrics() {
        const specialistStats = {};
        
        Object.entries(this.metrics.specialistMetrics).forEach(([key, metrics]) => {
            specialistStats[key] = {
                ...metrics,
                averageLatency: metrics.calls > 0 ? metrics.totalLatency / metrics.calls : 0,
                successRate: metrics.calls > 0 ? metrics.successes / metrics.calls : 0
            };
        });
        
        return {
            ...this.metrics,
            specialistStats,
            successRate: this.metrics.totalCalls > 0 
                ? this.metrics.successfulCalls / this.metrics.totalCalls 
                : 0,
            cacheSize: this.responseCache.size
        };
    }
    
    /**
     * Clear all caches and reset metrics
     */
    reset() {
        this.responseCache.clear();
        this.metrics = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            averageLatency: 0,
            specialistMetrics: {}
        };
        
        Object.keys(this.specialists).forEach(key => {
            this.metrics.specialistMetrics[key] = {
                calls: 0,
                successes: 0,
                failures: 0,
                totalLatency: 0
            };
        });
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    export default ClaudeAPIOrchestrator;
}
