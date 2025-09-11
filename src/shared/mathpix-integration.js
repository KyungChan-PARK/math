/**
 * Mathpix Integration Service for Math Learning Platform
 * SAT 시험 문제 추출 및 데이터화 시스템
 * 
 * Features:
 * - 수식, 한글, 영어 통합 OCR
 * - SAT 문제 자동 추출 및 분류
 * - Neo4j Knowledge Graph 연동
 * - 재사용 가능한 문제 은행 구축
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs/promises';
import neo4j from 'neo4j-driver';
import { ChromaClient } from 'chromadb';
import path from 'path';

class MathpixIntegrationService {
    constructor() {
        // Mathpix API configuration
        this.mathpixConfig = {
            baseURL: 'https://api.mathpix.com/v3',
            headers: {
                'app_id': process.env.MATHPIX_APP_ID,
                'app_key': process.env.MATHPIX_APP_KEY
            }
        };

        // Neo4j for knowledge graph
        this.neo4jDriver = neo4j.driver(
            'bolt://localhost:7687',
            neo4j.auth.basic('neo4j', 'password')
        );

        // ChromaDB for vector storage
        this.chromaClient = new ChromaClient({
            path: 'http://localhost:8000'
        });

        // SAT problem patterns
        this.satPatterns = {
            multipleChoice: /^\d+\.\s+(.+?)\n\s*[A-E]\)/,
            gridIn: /Grid-In|Student-Produced Response/i,
            problemNumber: /^(\d+)\./,
            choices: /([A-E])\)\s*(.+?)(?=[A-E]\)|$)/g,
            equation: /\$\$?(.+?)\$\$?/g,
            koreanText: /[\u3131-\uD79D]/,
            difficulty: /(easy|medium|hard|difficulty:\s*\d+)/i
        };

        // Problem categories
        this.categories = {
            ALGEBRA: ['equation', 'variable', 'solve', 'function'],
            GEOMETRY: ['angle', 'triangle', 'circle', 'area', 'perimeter'],
            STATISTICS: ['mean', 'median', 'probability', 'data'],
            CALCULUS: ['derivative', 'integral', 'limit', 'rate']
        };

        // Metrics
        this.metrics = {
            problemsExtracted: 0,
            equationsProcessed: 0,
            languagesDetected: new Set(),
            processingTime: 0
        };
    }

    /**
     * Initialize the service
     */
    async initialize() {
        console.log(' Initializing Mathpix Integration Service...');
        
        try {
            // Setup Neo4j schema
            await this.setupKnowledgeGraph();
            
            // Initialize ChromaDB collection
            this.problemCollection = await this.chromaClient.createCollection({
                name: 'sat_problems'
            }).catch(async () => {
                return await this.chromaClient.getCollection({
                    name: 'sat_problems'
                });
            });
            
            console.log('✅ Mathpix Integration ready');
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Setup Knowledge Graph for SAT problems
     */
    async setupKnowledgeGraph() {
        const session = this.neo4jDriver.session();
        
        try {
            await session.run(`
                // Create SAT Problem structure
                CREATE CONSTRAINT problem_id IF NOT EXISTS 
                FOR (p:Problem) REQUIRE p.id IS UNIQUE;
                
                CREATE INDEX problem_category IF NOT EXISTS 
                FOR (p:Problem) ON (p.category);
                
                CREATE INDEX problem_difficulty IF NOT EXISTS 
                FOR (p:Problem) ON (p.difficulty);
            `);
            
            console.log('✅ Knowledge Graph schema ready');
        } catch (error) {
            console.log('Schema might already exist:', error.message);
        } finally {
            await session.close();
        }
    }

    /**
     * Process image with Mathpix OCR
     */
    async processImage(imagePath, options = {}) {
        const startTime = Date.now();
        
        try {
            const imageBuffer = await fs.readFile(imagePath);
            const formData = new FormData();
            
            formData.append('file', imageBuffer, {
                filename: path.basename(imagePath)
            });
            
            // Configure OCR options
            const ocrOptions = {
                math_inline_delimiters: ['$', '$'],
                math_display_delimiters: ['$$', '$$'],
                formats: ['text', 'latex', 'mathml', 'data'],
                data_options: {
                    include_asciimath: true,
                    include_latex: true,
                    include_mathml: true,
                    include_table_data: true
                },
                ocr: ['math', 'text'],
                skip_recrop: false,
                ...options
            };
            
            formData.append('options_json', JSON.stringify(ocrOptions));
            
            // Call Mathpix API
            const response = await axios.post(
                `${this.mathpixConfig.baseURL}/text`,
                formData,
                {
                    headers: {
                        ...this.mathpixConfig.headers,
                        ...formData.getHeaders()
                    }
                }
            );
            
            const processingTime = Date.now() - startTime;
            this.metrics.processingTime += processingTime;
            
            console.log(`✅ Image processed in ${processingTime}ms`);
            
            return {
                text: response.data.text,
                latex: response.data.latex,
                data: response.data.data,
                confidence: response.data.confidence,
                processingTime
            };
            
        } catch (error) {
            console.error('❌ Mathpix OCR failed:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Extract SAT problems from processed text
     */
    async extractSATProblems(ocrResult) {
        const problems = [];
        const text = ocrResult.text || ocrResult.latex;
        
        // Split by problem numbers
        const problemTexts = text.split(/(?=^\d+\.)/m);
        
        for (const problemText of problemTexts) {
            if (!problemText.trim()) continue;
            
            // Extract problem number
            const numberMatch = problemText.match(this.satPatterns.problemNumber);
            if (!numberMatch) continue;
            
            const problemNumber = parseInt(numberMatch[1]);
            
            // Extract question text
            const questionText = problemText
                .replace(this.satPatterns.problemNumber, '')
                .trim();
            
            // Extract choices (if multiple choice)
            const choices = [];
            let choiceMatch;
            while ((choiceMatch = this.satPatterns.choices.exec(questionText))) {
                choices.push({
                    letter: choiceMatch[1],
                    text: choiceMatch[2].trim()
                });
            }
            
            // Extract equations
            const equations = [];
            let equationMatch;
            while ((equationMatch = this.satPatterns.equation.exec(questionText))) {
                equations.push({
                    latex: equationMatch[1],
                    type: equationMatch[0].startsWith('$$') ? 'display' : 'inline'
                });
            }
            
            // Detect languages
            const hasKorean = this.satPatterns.koreanText.test(questionText);
            const hasEnglish = /[a-zA-Z]/.test(questionText);
            
            if (hasKorean) this.metrics.languagesDetected.add('korean');
            if (hasEnglish) this.metrics.languagesDetected.add('english');
            
            // Categorize problem
            const category = this.categorizeProblem(questionText);
            
            // Estimate difficulty
            const difficulty = this.estimateDifficulty(questionText, equations);
            
            // Create problem object
            const problem = {
                id: `SAT_${Date.now()}_${problemNumber}`,
                number: problemNumber,
                question: questionText,
                choices,
                equations,
                category,
                difficulty,
                languages: {
                    korean: hasKorean,
                    english: hasEnglish
                },
                type: choices.length > 0 ? 'multiple_choice' : 'grid_in',
                metadata: {
                    extractedAt: new Date().toISOString(),
                    confidence: ocrResult.confidence
                }
            };
            
            problems.push(problem);
            this.metrics.problemsExtracted++;
            this.metrics.equationsProcessed += equations.length;
        }
        
        return problems;
    }

    /**
     * Categorize problem based on content
     */
    categorizeProblem(text) {
        const lowerText = text.toLowerCase();
        let maxScore = 0;
        let bestCategory = 'GENERAL';
        
        for (const [category, keywords] of Object.entries(this.categories)) {
            const score = keywords.filter(keyword => 
                lowerText.includes(keyword)
            ).length;
            
            if (score > maxScore) {
                maxScore = score;
                bestCategory = category;
            }
        }
        
        return bestCategory;
    }

    /**
     * Estimate problem difficulty
     */
    estimateDifficulty(text, equations) {
        let difficultyScore = 1;
        
        // Length factor
        if (text.length > 200) difficultyScore++;
        if (text.length > 400) difficultyScore++;
        
        // Equation complexity
        difficultyScore += equations.length * 0.5;
        equations.forEach(eq => {
            if (eq.latex.includes('frac')) difficultyScore += 0.5;
            if (eq.latex.includes('sqrt')) difficultyScore += 0.5;
            if (eq.latex.includes('int')) difficultyScore += 1;
        });
        
        // Check for explicit difficulty
        const difficultyMatch = text.match(this.satPatterns.difficulty);
        if (difficultyMatch) {
            if (difficultyMatch[1].toLowerCase() === 'hard') difficultyScore = 5;
            else if (difficultyMatch[1].toLowerCase() === 'medium') difficultyScore = 3;
            else if (difficultyMatch[1].toLowerCase() === 'easy') difficultyScore = 1;
        }
        
        return Math.min(5, Math.max(1, Math.round(difficultyScore)));
    }

    /**
     * Store problems in Neo4j and ChromaDB
     */
    async storeProblems(problems) {
        const session = this.neo4jDriver.session();
        
        try {
            for (const problem of problems) {
                // Store in Neo4j
                await session.run(`
                    CREATE (p:Problem {
                        id: $id,
                        number: $number,
                        question: $question,
                        category: $category,
                        difficulty: $difficulty,
                        type: $type,
                        hasKorean: $hasKorean,
                        hasEnglish: $hasEnglish,
                        equationCount: $equationCount,
                        createdAt: datetime()
                    })
                    
                    // Create category relationship
                    MERGE (c:Category {name: $category})
                    MERGE (p)-[:BELONGS_TO]->(c)
                    
                    // Create difficulty level
                    MERGE (d:Difficulty {level: $difficulty})
                    MERGE (p)-[:HAS_DIFFICULTY]->(d)
                    
                    RETURN p
                `, {
                    id: problem.id,
                    number: problem.number,
                    question: problem.question,
                    category: problem.category,
                    difficulty: problem.difficulty,
                    type: problem.type,
                    hasKorean: problem.languages.korean,
                    hasEnglish: problem.languages.english,
                    equationCount: problem.equations.length
                });
                
                // Store in ChromaDB for vector search
                const embedding = await this.generateEmbedding(problem.question);
                
                await this.problemCollection.add({
                    ids: [problem.id],
                    embeddings: [embedding],
                    metadatas: [{
                        number: problem.number,
                        category: problem.category,
                        difficulty: problem.difficulty,
                        type: problem.type
                    }],
                    documents: [problem.question]
                });
                
                // Store choices if multiple choice
                if (problem.choices.length > 0) {
                    for (const choice of problem.choices) {
                        await session.run(`
                            MATCH (p:Problem {id: $problemId})
                            CREATE (c:Choice {
                                letter: $letter,
                                text: $text
                            })
                            CREATE (p)-[:HAS_CHOICE]->(c)
                        `, {
                            problemId: problem.id,
                            letter: choice.letter,
                            text: choice.text
                        });
                    }
                }
                
                // Store equations
                for (const equation of problem.equations) {
                    await session.run(`
                        MATCH (p:Problem {id: $problemId})
                        CREATE (e:Equation {
                            latex: $latex,
                            type: $type
                        })
                        CREATE (p)-[:CONTAINS_EQUATION]->(e)
                    `, {
                        problemId: problem.id,
                        latex: equation.latex,
                        type: equation.type
                    });
                }
            }
            
            console.log(`✅ Stored ${problems.length} problems in database`);
            
        } finally {
            await session.close();
        }
    }

    /**
     * Generate embedding for text (simplified)
     */
    async generateEmbedding(text) {
        // Simplified embedding generation
        // In production, use OpenAI or similar service
        const hash = text.split('').reduce((acc, char) => {
            return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);
        
        // Generate deterministic embedding
        const embedding = new Array(384).fill(0).map((_, i) => {
            return Math.sin(hash * (i + 1)) * Math.cos(hash / (i + 1));
        });
        
        return embedding;
    }

    /**
     * Process SAT exam document
     */
    async processSATExam(filePath) {
        console.log(` Processing SAT exam: ${filePath}`);
        
        try {
            // Process with Mathpix
            const ocrResult = await this.processImage(filePath, {
                include_detected_alphabets: true,
                include_line_data: true
            });
            
            // Extract problems
            const problems = await this.extractSATProblems(ocrResult);
            
            console.log(` Extracted ${problems.length} problems`);
            
            // Store in databases
            await this.storeProblems(problems);
            
            // Generate report
            const report = await this.generateReport(problems);
            
            return {
                success: true,
                problemCount: problems.length,
                problems,
                report,
                metrics: this.metrics
            };
            
        } catch (error) {
            console.error('❌ SAT processing failed:', error);
            throw error;
        }
    }

    /**
     * Search similar problems
     */
    async searchSimilarProblems(query, options = {}) {
        const { category, difficulty, limit = 5 } = options;
        
        // Vector search in ChromaDB
        const embedding = await this.generateEmbedding(query);
        const results = await this.problemCollection.query({
            queryEmbeddings: [embedding],
            nResults: limit,
            where: {
                ...(category && { category }),
                ...(difficulty && { difficulty })
            }
        });
        
        // Get full problem data from Neo4j
        const session = this.neo4jDriver.session();
        const problems = [];
        
        try {
            for (const id of results.ids[0]) {
                const result = await session.run(`
                    MATCH (p:Problem {id: $id})
                    OPTIONAL MATCH (p)-[:HAS_CHOICE]->(c:Choice)
                    OPTIONAL MATCH (p)-[:CONTAINS_EQUATION]->(e:Equation)
                    RETURN p, collect(distinct c) as choices, 
                           collect(distinct e) as equations
                `, { id });
                
                if (result.records.length > 0) {
                    const record = result.records[0];
                    problems.push({
                        ...record.get('p').properties,
                        choices: record.get('choices').map(c => c.properties),
                        equations: record.get('equations').map(e => e.properties)
                    });
                }
            }
        } finally {
            await session.close();
        }
        
        return problems;
    }

    /**
     * Generate analytics report
     */
    async generateReport(problems) {
        const report = {
            timestamp: new Date().toISOString(),
            totalProblems: problems.length,
            byCategory: {},
            byDifficulty: {},
            byType: {},
            languages: Array.from(this.metrics.languagesDetected),
            equationStats: {
                total: this.metrics.equationsProcessed,
                average: this.metrics.equationsProcessed / problems.length
            }
        };
        
        // Analyze problems
        problems.forEach(problem => {
            // By category
            report.byCategory[problem.category] = 
                (report.byCategory[problem.category] || 0) + 1;
            
            // By difficulty
            report.byDifficulty[problem.difficulty] = 
                (report.byDifficulty[problem.difficulty] || 0) + 1;
            
            // By type
            report.byType[problem.type] = 
                (report.byType[problem.type] || 0) + 1;
        });
        
        // Save report
        await fs.writeFile(
            'SAT_ANALYSIS_REPORT.json',
            JSON.stringify(report, null, 2)
        );
        
        return report;
    }

    /**
     * Get system metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            averageProcessingTime: this.metrics.processingTime / 
                Math.max(1, this.metrics.problemsExtracted)
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        await this.neo4jDriver.close();
        console.log(' Mathpix Integration cleaned up');
    }
}

// Export for use
export default MathpixIntegrationService;

// CLI support
if (process.argv[1] === import.meta.url.slice(7)) {
    const service = new MathpixIntegrationService();
    
    const command = process.argv[2];
    const filePath = process.argv[3];
    
    if (command === 'process' && filePath) {
        service.initialize()
            .then(() => service.processSATExam(filePath))
            .then(result => {
                console.log('✅ Processing complete:', result);
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Processing failed:', error);
                process.exit(1);
            });
    } else {
        console.log('Usage: node mathpix-integration.js process <file_path>');
    }
}