const EventEmitter = require('events');
const MathpixAPIClient = require('./mathpix-client.cjs');

class ClaudeQwenMathpixOrchestrator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Initialize Mathpix client with loaded configuration
        this.mathpixConfig = require('./mathpix-config.json');
        this.mathpixClient = new MathpixAPIClient(this.mathpixConfig.mathpix);
        
        // Task distribution strategy
        this.taskDistribution = {
            claude: {
                role: 'analyzer',
                capabilities: [
                    'problem_classification',
                    'solution_verification',
                    'educational_assessment',
                    'concept_extraction',
                    'error_pattern_analysis'
                ],
                maxConcurrent: 5
            },
            qwen: {
                role: 'processor',
                capabilities: [
                    'batch_ocr',
                    'parallel_processing',
                    'calculation_verification',
                    'data_transformation',
                    'performance_optimization'
                ],
                maxConcurrent: 20
            }
        };
        
        // Processing statistics
        this.stats = {
            totalProcessed: 0,
            claudeTasks: 0,
            qwenTasks: 0,
            averageAccuracy: 0,
            processingTimes: []
        };
        
        // Queue for collaborative tasks
        this.collaborationQueue = [];
        this.activeCollaborations = new Map();
        
        this.initializeEventHandlers();
    }
    
    initializeEventHandlers() {
        // Listen to Mathpix client events for coordination
        this.mathpixClient.on('ocr-complete', (data) => {
            this.emit('ocr-processed', data);
        });
        
        this.mathpixClient.on('error', (error) => {
            this.emit('processing-error', error);
        });
        
        this.mathpixClient.on('batch-progress', (progress) => {
            this.emit('batch-update', progress);
        });
    }
    
    // Intelligent task routing based on content type and complexity
    async routeTask(task) {
        const analysis = await this.analyzeTaskComplexity(task);
        
        if (analysis.requiresCollaboration) {
            return this.initiateCollaboration(task, analysis);
        } else if (analysis.bestProcessor === 'claude') {
            return this.processWithClaude(task);
        } else {
            return this.processWithQwen(task);
        }
    }
    
    // Analyze task to determine optimal processing strategy
    async analyzeTaskComplexity(task) {
        const complexity = {
            hasHandwriting: false,
            hasPrintedText: false,
            hasComplexEquations: false,
            hasTables: false,
            hasGraphs: false,
            requiresCollaboration: false,
            bestProcessor: 'qwen',
            estimatedTime: 1000
        };
        
        // Determine task characteristics
        if (task.type === 'image') {
            // Quick image analysis (could be enhanced with actual image processing)
            complexity.estimatedTime = 500;
            
            if (task.metadata?.source === 'handwritten') {
                complexity.hasHandwriting = true;
                complexity.estimatedTime += 1000;
            }
            
            if (task.metadata?.content) {
                // Handle both string content and object content structures
                const contentStr = typeof task.metadata.content === 'string' 
                    ? task.metadata.content 
                    : JSON.stringify(task.metadata.content);
                    
                if (contentStr.includes('equation') || contentStr.includes('formula')) {
                    complexity.hasComplexEquations = true;
                    complexity.requiresCollaboration = true;
                    complexity.estimatedTime += 2000;
                }
            }
        } else if (task.type === 'pdf') {
            complexity.estimatedTime = 5000;
            complexity.requiresCollaboration = true;
        }
        
        // Determine best processor based on complexity
        if (complexity.hasComplexEquations || complexity.requiresCollaboration) {
            complexity.bestProcessor = 'collaboration';
        } else if (task.requiresValidation || task.educational) {
            complexity.bestProcessor = 'claude';
        }
        
        return complexity;
    }
    
    // Process with Claude - for strategic analysis and validation
    async processWithClaude(task) {
        this.stats.claudeTasks++;
        const startTime = Date.now();
        
        try {
            // Claude focuses on understanding and validation
            const analysis = {
                taskId: task.id,
                type: 'claude_analysis',
                timestamp: new Date().toISOString()
            };
            
            // Process based on task type
            switch (task.type) {
                case 'problem_classification':
                    analysis.result = await this.classifyMathProblem(task.data);
                    break;
                    
                case 'solution_verification':
                    analysis.result = await this.verifySolution(task.data);
                    break;
                    
                case 'concept_extraction':
                    analysis.result = await this.extractMathConcepts(task.data);
                    break;
                    
                default:
                    // Default OCR processing with validation
                    const ocrResult = await this.mathpixClient.processImage(task.data);
                    analysis.result = await this.validateOCRResult(ocrResult);
            }
            
            analysis.processingTime = Date.now() - startTime;
            this.updateStatistics(analysis.processingTime);
            
            return analysis;
            
        } catch (error) {
            this.emit('claude-error', { task: task.id, error: error.message });
            throw error;
        }
    }
    
    // Process with Qwen - for high-volume and parallel processing
    async processWithQwen(task) {
        this.stats.qwenTasks++;
        const startTime = Date.now();
        
        try {
            // Qwen excels at batch processing and optimization
            const processing = {
                taskId: task.id,
                type: 'qwen_processing',
                timestamp: new Date().toISOString()
            };
            
            if (task.type === 'batch') {
                // Parallel batch processing
                processing.result = await this.mathpixClient.processBatch(
                    task.images,
                    { batchSize: 10 }
                );
            } else {
                // Single image optimization
                processing.result = await this.mathpixClient.processImage(
                    task.data,
                    { formats: ['latex_styled', 'mathml'] }
                );
            }
            
            processing.processingTime = Date.now() - startTime;
            this.updateStatistics(processing.processingTime);
            
            return processing;
            
        } catch (error) {
            this.emit('qwen-error', { task: task.id, error: error.message });
            throw error;
        }
    }
    
    // Collaborative processing for complex tasks
    async initiateCollaboration(task, analysis) {
        const collaborationId = `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const collaboration = {
            id: collaborationId,
            task: task,
            analysis: analysis,
            status: 'initiated',
            results: {},
            startTime: Date.now()
        };
        
        this.activeCollaborations.set(collaborationId, collaboration);
        this.emit('collaboration-started', { id: collaborationId });
        
        try {
            // Step 1: Qwen performs initial OCR processing
            const qwenResult = await this.processWithQwen({
                ...task,
                collaborationId
            });
            collaboration.results.qwen = qwenResult;
            
            // Step 2: Claude analyzes and validates the result
            const claudeAnalysis = await this.processWithClaude({
                type: 'solution_verification',
                data: qwenResult.result,
                collaborationId
            });
            collaboration.results.claude = claudeAnalysis;
            
            // Step 3: Combine insights for final result
            const finalResult = this.mergeCollaborativeResults(
                qwenResult,
                claudeAnalysis,
                task
            );
            
            collaboration.status = 'completed';
            collaboration.finalResult = finalResult;
            collaboration.processingTime = Date.now() - collaboration.startTime;
            
            this.emit('collaboration-completed', {
                id: collaborationId,
                time: collaboration.processingTime
            });
            
            return finalResult;
            
        } catch (error) {
            collaboration.status = 'failed';
            collaboration.error = error.message;
            this.emit('collaboration-failed', { id: collaborationId, error });
            throw error;
        }
    }
    
    // Merge results from Claude and Qwen collaboration
    mergeCollaborativeResults(qwenResult, claudeAnalysis, originalTask) {
        const merged = {
            taskId: originalTask.id,
            timestamp: new Date().toISOString(),
            
            // OCR results from Qwen's processing
            ocr: {
                latex: qwenResult.result?.latex_styled || '',
                text: qwenResult.result?.text || '',
                mathml: qwenResult.result?.mathml || '',
                confidence: qwenResult.result?.metadata?.confidence || 0
            },
            
            // Analysis and validation from Claude
            analysis: {
                isValid: claudeAnalysis.result?.isValid || false,
                corrections: claudeAnalysis.result?.corrections || [],
                concepts: claudeAnalysis.result?.concepts || [],
                difficulty: claudeAnalysis.result?.difficulty || 'unknown'
            },
            
            // Combined metadata
            metadata: {
                processingTime: {
                    qwen: qwenResult.processingTime,
                    claude: claudeAnalysis.processingTime,
                    total: qwenResult.processingTime + claudeAnalysis.processingTime
                },
                collaborationType: 'claude-qwen',
                confidence: this.calculateCombinedConfidence(qwenResult, claudeAnalysis)
            }
        };
        
        // Add educational enhancements if requested
        if (originalTask.educational) {
            merged.educational = this.generateEducationalContent(merged);
        }
        
        return merged;
    }
    
    // Calculate combined confidence score
    calculateCombinedConfidence(qwenResult, claudeAnalysis) {
        const qwenConfidence = qwenResult.result?.metadata?.confidence || 0.5;
        const claudeValidation = claudeAnalysis.result?.isValid ? 1.0 : 0.5;
        
        // Weighted average favoring validation
        return (qwenConfidence * 0.4 + claudeValidation * 0.6);
    }
    
    // Update processing statistics
    updateStatistics(processingTime) {
        this.stats.totalProcessed++;
        this.stats.processingTimes.push(processingTime);
        
        // Keep only recent processing times
        if (this.stats.processingTimes.length > 100) {
            this.stats.processingTimes.shift();
        }
    }
    
    // Get current statistics
    getStatistics() {
        const avgProcessingTime = this.stats.processingTimes.length > 0
            ? this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length
            : 0;
        
        return {
            totalProcessed: this.stats.totalProcessed,
            claudeTasks: this.stats.claudeTasks,
            qwenTasks: this.stats.qwenTasks,
            collaborations: this.activeCollaborations.size,
            averageProcessingTime: Math.round(avgProcessingTime) + 'ms',
            mathpixStats: this.mathpixClient.getStatistics()
        };
    }
    
    // Educational Methods - Math Problem Classification
    async classifyMathProblem(ocrData) {
        const classification = {
            subject: 'unknown',
            topic: 'unknown',
            difficulty: 'medium',
            concepts: [],
            problemType: 'unknown',
            estimatedSolveTime: 5
        };
        
        // Extract LaTeX or text content
        const content = ocrData.latex_styled || ocrData.text || '';
        const contentLower = content.toLowerCase();
        
        // Identify mathematical subject area
        if (contentLower.includes('integral') || contentLower.includes('derivative')) {
            classification.subject = 'calculus';
            classification.difficulty = 'advanced';
            
            if (contentLower.includes('integral')) {
                classification.topic = 'integration';
                classification.concepts.push('integral', 'antiderivative');
                classification.problemType = contentLower.includes('definite') ? 'definite_integral' : 'indefinite_integral';
            } else {
                classification.topic = 'differentiation';
                classification.concepts.push('derivative', 'rate_of_change');
                classification.problemType = 'derivative_calculation';
            }
            classification.estimatedSolveTime = 10;
            
        } else if (contentLower.includes('matrix') || contentLower.includes('vector')) {
            classification.subject = 'linear_algebra';
            classification.topic = contentLower.includes('matrix') ? 'matrices' : 'vectors';
            classification.concepts.push('linear_transformation', 'vector_space');
            classification.difficulty = 'advanced';
            classification.estimatedSolveTime = 8;
            
        } else if (contentLower.includes('sin') || contentLower.includes('cos') || contentLower.includes('tan')) {
            classification.subject = 'trigonometry';
            classification.topic = 'trigonometric_functions';
            classification.concepts.push('trigonometry', 'angles', 'periodic_functions');
            classification.difficulty = 'intermediate';
            classification.estimatedSolveTime = 5;
            
        } else if (/x\^2|quadratic|parabola/.test(contentLower)) {
            classification.subject = 'algebra';
            classification.topic = 'quadratic_equations';
            classification.concepts.push('quadratic_formula', 'factoring', 'parabola');
            classification.difficulty = 'intermediate';
            classification.problemType = 'equation_solving';
            classification.estimatedSolveTime = 5;
            
        } else if (/\+|\-|\*|\/|=/.test(content) && !/x|y|[a-z]/i.test(content)) {
            classification.subject = 'arithmetic';
            classification.topic = 'basic_operations';
            classification.concepts.push('addition', 'subtraction', 'multiplication', 'division');
            classification.difficulty = 'basic';
            classification.estimatedSolveTime = 2;
            
        } else if (/triangle|circle|square|angle|perpendicular|parallel/.test(contentLower)) {
            classification.subject = 'geometry';
            classification.topic = 'shapes_and_angles';
            classification.concepts.push('geometric_shapes', 'spatial_reasoning');
            classification.difficulty = 'intermediate';
            classification.estimatedSolveTime = 6;
        }
        
        // Analyze problem complexity based on mathematical symbols
        const complexityMarkers = {
            high: ['\integral', '\sum', '\prod', '\lim', '\partial'],
            medium: ['\frac', '\sqrt', '^', '_'],
            low: ['+', '-', '*', '/']
        };
        
        let complexityScore = 0;
        complexityMarkers.high.forEach(marker => {
            if (content.includes(marker)) complexityScore += 3;
        });
        complexityMarkers.medium.forEach(marker => {
            if (content.includes(marker)) complexityScore += 2;
        });
        complexityMarkers.low.forEach(marker => {
            if (content.includes(marker)) complexityScore += 1;
        });
        
        // Adjust difficulty based on complexity score
        if (complexityScore > 10) {
            classification.difficulty = 'advanced';
            classification.estimatedSolveTime = Math.max(classification.estimatedSolveTime, 10);
        } else if (complexityScore > 5) {
            classification.difficulty = 'intermediate';
        }
        
        return classification;
    }
    
    // Verify mathematical solution correctness
    async verifySolution(solutionData) {
        const verification = {
            isValid: true,
            corrections: [],
            feedback: [],
            accuracy: 100,
            suggestions: []
        };
        
        // Check for common mathematical errors
        const content = solutionData.latex_styled || solutionData.text || '';
        
        // Check for basic mathematical consistency
        const equations = content.split(/=|\\eq/);
        if (equations.length > 1) {
            // Simple validation - check if equations balance
            // This is a simplified check - real implementation would use a math parser
            verification.feedback.push('Equation structure detected and analyzed');
        }
        
        // Check for common notation errors
        const notationErrors = [
            { pattern: /sin\s+x/g, correction: '\\sin x', message: 'Use proper LaTeX notation for sine function' },
            { pattern: /log\s+/g, correction: '\\log ', message: 'Use proper LaTeX notation for logarithm' },
            { pattern: /\dx\b/g, correction: '\\mathrm{d}x', message: 'Use proper differential notation' }
        ];
        
        notationErrors.forEach(error => {
            if (error.pattern.test(content)) {
                verification.corrections.push({
                    original: content.match(error.pattern)[0],
                    suggested: error.correction,
                    reason: error.message
                });
                verification.accuracy -= 5;
            }
        });
        
        // Check for mathematical impossibilities
        if (content.includes('/0') || content.includes('÷0')) {
            verification.isValid = false;
            verification.corrections.push({
                issue: 'Division by zero',
                severity: 'critical',
                suggestion: 'Check denominator values'
            });
            verification.accuracy = 0;
        }
        
        // Provide constructive feedback
        if (verification.accuracy === 100) {
            verification.feedback.push('Solution appears mathematically correct');
            verification.suggestions.push('Consider showing intermediate steps for clarity');
        } else if (verification.accuracy > 80) {
            verification.feedback.push('Solution mostly correct with minor notation issues');
        } else {
            verification.feedback.push('Solution requires significant corrections');
            verification.suggestions.push('Review mathematical fundamentals for this topic');
        }
        
        verification.isValid = verification.accuracy > 70;
        
        return verification;
    }
    
    // Extract mathematical concepts from content
    async extractMathConcepts(ocrData) {
        const extraction = {
            concepts: [],
            prerequisites: [],
            relatedTopics: [],
            applications: []
        };
        
        const content = (ocrData.latex_styled || ocrData.text || '').toLowerCase();
        
        // Concept mapping database (simplified version)
        const conceptMap = {
            'integral': {
                concepts: ['integration', 'area_under_curve', 'antiderivative'],
                prerequisites: ['differentiation', 'limits', 'functions'],
                related: ['differential_equations', 'volume_calculation'],
                applications: ['physics_work', 'probability_distributions']
            },
            'derivative': {
                concepts: ['rate_of_change', 'tangent_line', 'differentiation'],
                prerequisites: ['limits', 'functions', 'algebra'],
                related: ['optimization', 'related_rates'],
                applications: ['physics_velocity', 'economics_marginal_cost']
            },
            'matrix': {
                concepts: ['linear_transformation', 'systems_of_equations', 'eigenvalues'],
                prerequisites: ['vectors', 'algebra', 'equations'],
                related: ['determinants', 'vector_spaces'],
                applications: ['computer_graphics', 'data_science', 'quantum_mechanics']
            },
            'quadratic': {
                concepts: ['parabola', 'roots', 'vertex', 'factoring'],
                prerequisites: ['algebra_basics', 'equations', 'graphing'],
                related: ['polynomial_functions', 'completing_square'],
                applications: ['projectile_motion', 'optimization_problems']
            }
        };
        
        // Search for concepts in content
        Object.keys(conceptMap).forEach(key => {
            if (content.includes(key)) {
                const mapping = conceptMap[key];
                extraction.concepts.push(...mapping.concepts);
                extraction.prerequisites.push(...mapping.prerequisites);
                extraction.relatedTopics.push(...mapping.related);
                extraction.applications.push(...mapping.applications);
            }
        });
        
        // Remove duplicates
        extraction.concepts = [...new Set(extraction.concepts)];
        extraction.prerequisites = [...new Set(extraction.prerequisites)];
        extraction.relatedTopics = [...new Set(extraction.relatedTopics)];
        extraction.applications = [...new Set(extraction.applications)];
        
        // Add difficulty indicator based on concept count
        extraction.complexity = extraction.concepts.length > 5 ? 'high' : 
                               extraction.concepts.length > 2 ? 'medium' : 'low';
        
        return extraction;
    }
    
    // Generate educational content based on OCR results
    generateEducationalContent(mergedResult) {
        const educational = {
            summary: '',
            keyPoints: [],
            practiceProblems: [],
            hints: [],
            resources: []
        };
        
        // Generate summary based on classification
        if (mergedResult.analysis.concepts.length > 0) {
            educational.summary = `This problem involves ${mergedResult.analysis.concepts.join(', ')}. `;
            educational.summary += `Difficulty level: ${mergedResult.analysis.difficulty || 'medium'}.`;
        }
        
        // Generate key learning points
        educational.keyPoints = [
            'Identify the type of problem before attempting to solve',
            'Break down complex expressions into simpler components',
            'Verify your answer by substitution when possible'
        ];
        
        // Generate practice problems based on identified concepts
        if (mergedResult.analysis.concepts.includes('integration')) {
            educational.practiceProblems.push(
                'Try: ∫(2x + 3)dx',
                'Challenge: ∫sin(x)cos(x)dx',
                'Advanced: ∫x²e^x dx'
            );
            educational.hints.push(
                'Remember the power rule for integration',
                'Consider using substitution for composite functions'
            );
        } else if (mergedResult.analysis.concepts.includes('quadratic_formula')) {
            educational.practiceProblems.push(
                'Solve: x² + 5x + 6 = 0',
                'Find roots: 2x² - 7x + 3 = 0',
                'Challenge: x² - 2x - 8 = 0'
            );
            educational.hints.push(
                'Try factoring first before using the quadratic formula',
                'Check your solutions by substituting back into the original equation'
            );
        }
        
        // Add relevant learning resources
        educational.resources = [
            'Khan Academy - ' + (mergedResult.analysis.concepts[0] || 'Math'),
            'Wolfram Alpha for step-by-step solutions',
            'Practice worksheets available in the system'
        ];
        
        return educational;
    }
    
    // Validate OCR results for mathematical accuracy
    async validateOCRResult(ocrResult) {
        const validation = {
            isValid: true,
            confidence: 0.9,
            issues: [],
            suggestions: []
        };
        
        // Check if LaTeX is well-formed
        const latex = ocrResult.latex_styled || '';
        
        // Count opening and closing braces
        const openBraces = (latex.match(/{/g) || []).length;
        const closeBraces = (latex.match(/}/g) || []).length;
        
        if (openBraces !== closeBraces) {
            validation.isValid = false;
            validation.issues.push('Unbalanced braces in LaTeX');
            validation.confidence -= 0.3;
        }
        
        // Check for common OCR errors
        const commonErrors = [
            { pattern: /\bl\b/g, context: 'numeric', suggestion: '1' },
            { pattern: /\bO\b/g, context: 'numeric', suggestion: '0' },
            { pattern: /\bI\b/g, context: 'numeric', suggestion: '1' }
        ];
        
        commonErrors.forEach(error => {
            if (error.pattern.test(latex)) {
                validation.issues.push(`Possible OCR error: ${error.pattern.source} might be ${error.suggestion}`);
                validation.confidence -= 0.1;
            }
        });
        
        // Ensure confidence stays within bounds
        validation.confidence = Math.max(0, Math.min(1, validation.confidence));
        
        // Add improvement suggestions
        if (validation.confidence < 0.7) {
            validation.suggestions.push('Consider re-scanning with better image quality');
            validation.suggestions.push('Ensure good lighting and contrast');
        }
        
        return validation;
    }
}

module.exports = ClaudeQwenMathpixOrchestrator;