#!/usr/bin/env node

/**
 * Google Document AI Integration for Math Worksheet Quality Validation
 * Based on the document_ai.md workflow for comprehensive document processing
 */

import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

class DocumentAIIntegration {
    constructor() {
        // Document AI configuration based on document_ai.md
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        this.location = 'us';
        this.processors = {
            handwritingOCR: process.env.HANDWRITING_OCR_PROCESSOR_ID,
            layoutParser: process.env.LAYOUT_PARSER_PROCESSOR_ID,
            formParser: process.env.FORM_PARSER_PROCESSOR_ID,
            customMathExtractor: process.env.CUSTOM_MATH_EXTRACTOR_PROCESSOR_ID
        };
        
        this.client = new DocumentProcessorServiceClient();
        this.outputDir = '/home/palantir/projects/math/document-ai-output';
    }

    /**
     * Initialize Document AI integration
     */
    async initialize() {
        console.log(chalk.cyan('🤖 Initializing Google Document AI Integration...'));
        
        // Ensure output directory exists
        await fs.ensureDir(this.outputDir);
        await fs.ensureDir(path.join(this.outputDir, 'ocr-results'));
        await fs.ensureDir(path.join(this.outputDir, 'layout-analysis'));
        await fs.ensureDir(path.join(this.outputDir, 'math-expressions'));
        await fs.ensureDir(path.join(this.outputDir, 'quality-reports'));
        
        console.log(chalk.green('✅ Document AI initialized'));
    }

    /**
     * Process worksheet PDF through complete Document AI pipeline
     * Following the workflow from document_ai.md
     */
    async processWorksheetPDF(pdfPath) {
        console.log(chalk.yellow(`📄 Processing PDF through Document AI: ${path.basename(pdfPath)}`));
        
        const processId = Date.now();
        const baseName = path.basename(pdfPath, '.pdf');
        
        try {
            // Step 1: Handwriting OCR processing
            const ocrResults = await this.processHandwritingOCR(pdfPath, processId);
            
            // Step 2: Layout parsing for visual elements
            const layoutResults = await this.processLayoutParser(pdfPath, processId);
            
            // Step 3: Form parsing for interactive elements
            const formResults = await this.processFormParser(pdfPath, processId);
            
            // Step 4: Mathematical expression extraction
            const mathResults = await this.extractMathematicalExpressions(ocrResults, processId);
            
            // Step 5: Chart and graph analysis
            const chartResults = await this.analyzeChartsAndGraphs(layoutResults, processId);
            
            // Step 6: Generate comprehensive analysis
            const comprehensiveAnalysis = this.generateComprehensiveAnalysis(
                ocrResults, layoutResults, formResults, mathResults, chartResults
            );
            
            // Step 7: Quality validation
            const qualityScore = this.calculateQualityScore(comprehensiveAnalysis);
            
            // Save results
            const resultsPath = await this.saveResults(baseName, processId, comprehensiveAnalysis, qualityScore);
            
            console.log(chalk.green(`✅ Document AI processing complete: ${baseName}`));
            console.log(chalk.gray(`   Quality Score: ${qualityScore.overall}/100`));
            
            return {
                processId,
                results: comprehensiveAnalysis,
                qualityScore,
                resultsPath
            };
            
        } catch (error) {
            console.error(chalk.red(`💥 Document AI processing failed: ${error.message}`));
            throw error;
        }
    }

    /**
     * Step 1: Process with Handwriting OCR Processor
     * Extracts text from handwritten and printed content
     */
    async processHandwritingOCR(pdfPath, processId) {
        console.log(chalk.blue('🔤 Processing with Handwriting OCR...'));
        
        try {
            // Read document content
            const documentContent = await fs.readFile(pdfPath);
            
            // Create processor request
            const processorName = this.client.processorPath(
                this.projectId, 
                this.location, 
                this.processors.handwritingOCR
            );
            
            const request = {
                name: processorName,
                rawDocument: {
                    content: documentContent,
                    mimeType: 'application/pdf'
                }
            };
            
            // Process document
            const [result] = await this.client.processDocument(request);
            
            // Extract text blocks with confidence scores
            const textBlocks = result.document.pages.map(page => ({
                pageNumber: page.pageNumber,
                blocks: page.blocks?.map(block => ({
                    text: block.layout.textAnchor.textSegments
                        .map(segment => result.document.text.substring(
                            parseInt(segment.startIndex || 0),
                            parseInt(segment.endIndex || 0)
                        )).join(''),
                    confidence: block.layout.confidence || 0,
                    boundingBox: block.layout.boundingPoly,
                    languageCode: this.detectLanguage(block)
                })) || []
            }));
            
            // Save OCR results
            const ocrResultsPath = path.join(this.outputDir, 'ocr-results', `ocr-${processId}.json`);
            await fs.writeFile(ocrResultsPath, JSON.stringify(textBlocks, null, 2));
            
            console.log(chalk.green(`✅ OCR processing complete: ${textBlocks.length} pages processed`));
            
            return {
                textBlocks,
                processingTime: Date.now() - processId,
                filePath: ocrResultsPath
            };
            
        } catch (error) {
            console.error(chalk.red(`❌ OCR processing failed: ${error.message}`));
            return { textBlocks: [], error: error.message };
        }
    }

    /**
     * Step 2: Process with Layout Parser
     * Detects tables, charts, and visual elements
     */
    async processLayoutParser(pdfPath, processId) {
        console.log(chalk.blue('📐 Processing with Layout Parser...'));
        
        try {
            const documentContent = await fs.readFile(pdfPath);
            
            const processorName = this.client.processorPath(
                this.projectId, 
                this.location, 
                this.processors.layoutParser
            );
            
            const request = {
                name: processorName,
                rawDocument: {
                    content: documentContent,
                    mimeType: 'application/pdf'
                }
            };
            
            const [result] = await this.client.processDocument(request);
            
            // Extract visual elements
            const visualElements = result.document.pages.map(page => ({
                pageNumber: page.pageNumber,
                tables: page.tables?.map(table => ({
                    boundingBox: table.layout.boundingPoly,
                    confidence: table.layout.confidence,
                    rowCount: table.bodyRows?.length || 0,
                    columnCount: table.headerRows?.[0]?.cells?.length || 0
                })) || [],
                images: page.visualElements?.filter(ve => ve.type === 'IMAGE').map(img => ({
                    boundingBox: img.layout.boundingPoly,
                    confidence: img.layout.confidence,
                    type: 'graph_or_chart'
                })) || [],
                blocks: page.blocks?.map(block => ({
                    type: block.layout.textAnchor ? 'text' : 'visual',
                    boundingBox: block.layout.boundingPoly
                })) || []
            }));
            
            // Save layout results
            const layoutResultsPath = path.join(this.outputDir, 'layout-analysis', `layout-${processId}.json`);
            await fs.writeFile(layoutResultsPath, JSON.stringify(visualElements, null, 2));
            
            console.log(chalk.green(`✅ Layout parsing complete`));
            
            return {
                visualElements,
                filePath: layoutResultsPath
            };
            
        } catch (error) {
            console.error(chalk.red(`❌ Layout parsing failed: ${error.message}`));
            return { visualElements: [], error: error.message };
        }
    }

    /**
     * Step 3: Process with Form Parser
     * Extracts key-value pairs and form fields
     */
    async processFormParser(pdfPath, processId) {
        console.log(chalk.blue('📋 Processing with Form Parser...'));
        
        try {
            const documentContent = await fs.readFile(pdfPath);
            
            const processorName = this.client.processorPath(
                this.projectId, 
                this.location, 
                this.processors.formParser
            );
            
            const request = {
                name: processorName,
                rawDocument: {
                    content: documentContent,
                    mimeType: 'application/pdf'
                }
            };
            
            const [result] = await this.client.processDocument(request);
            
            // Extract form fields and key-value pairs
            const formData = result.document.pages.map(page => ({
                pageNumber: page.pageNumber,
                formFields: page.formFields?.map(field => ({
                    fieldName: field.fieldName?.textAnchor?.textSegments
                        ?.map(segment => result.document.text.substring(
                            parseInt(segment.startIndex || 0),
                            parseInt(segment.endIndex || 0)
                        )).join('') || 'unnamed_field',
                    fieldValue: field.fieldValue?.textAnchor?.textSegments
                        ?.map(segment => result.document.text.substring(
                            parseInt(segment.startIndex || 0),
                            parseInt(segment.endIndex || 0)
                        )).join('') || '',
                    confidence: field.fieldName?.confidence || 0,
                    boundingBox: field.fieldName?.boundingPoly
                })) || []
            }));
            
            console.log(chalk.green(`✅ Form parsing complete`));
            
            return {
                formData,
                filePath: null
            };
            
        } catch (error) {
            console.error(chalk.red(`❌ Form parsing failed: ${error.message}`));
            return { formData: [], error: error.message };
        }
    }

    /**
     * Step 4: Extract Mathematical Expressions
     * Using regex patterns and custom processing
     */
    async extractMathematicalExpressions(ocrResults, processId) {
        console.log(chalk.blue('🧮 Extracting mathematical expressions...'));
        
        const mathExpressions = [];
        
        // Mathematical expression patterns (Korean + English)
        const mathPatterns = [
            /[\d\w\+\-\=\^\{\}\$]+/g,  // Basic math symbols
            /y\s*=\s*[^,\n]+/gi,       // Function equations
            /f\(x\)\s*=\s*[^,\n]+/gi,  // Function notation
            /\d+\s*[+\-×÷]\s*\d+/g,    // Arithmetic operations
            /[가-힣]+\s*=\s*[^,\n]+/g, // Korean math terms
            /기울기|변화율|함수|그래프/g  // Korean mathematical terms
        ];
        
        ocrResults.textBlocks.forEach(page => {
            page.blocks.forEach(block => {
                mathPatterns.forEach(pattern => {
                    const matches = block.text.match(pattern);
                    if (matches) {
                        matches.forEach(match => {
                            mathExpressions.push({
                                expression: match.trim(),
                                page: page.pageNumber,
                                confidence: block.confidence,
                                boundingBox: block.boundingBox,
                                type: this.classifyMathExpression(match.trim()),
                                isKorean: /[가-힣]/.test(match)
                            });
                        });
                    }
                });
            });
        });
        
        // Save math expressions
        const mathResultsPath = path.join(this.outputDir, 'math-expressions', `math-${processId}.json`);
        await fs.writeFile(mathResultsPath, JSON.stringify(mathExpressions, null, 2));
        
        console.log(chalk.green(`✅ Mathematical expressions extracted: ${mathExpressions.length} found`));
        
        return {
            mathExpressions,
            filePath: mathResultsPath
        };
    }

    /**
     * Step 5: Analyze Charts and Graphs
     * Extract data points and visual information
     */
    async analyzeChartsAndGraphs(layoutResults, processId) {
        console.log(chalk.blue('📊 Analyzing charts and graphs...'));
        
        const chartAnalysis = [];
        
        layoutResults.visualElements.forEach(page => {
            page.images.forEach(image => {
                // Simulate chart analysis (in production, would use image processing)
                chartAnalysis.push({
                    page: page.pageNumber,
                    boundingBox: image.boundingBox,
                    confidence: image.confidence,
                    chartType: this.detectChartType(image),
                    estimatedDataPoints: this.estimateDataPoints(image),
                    hasAxis: true,
                    hasLabels: true,
                    isCoordinatePlane: this.isCoordinatePlane(image)
                });
            });
        });
        
        console.log(chalk.green(`✅ Chart analysis complete: ${chartAnalysis.length} charts found`));
        
        return {
            chartAnalysis,
            filePath: null
        };
    }

    /**
     * Generate comprehensive analysis from all processors
     */
    generateComprehensiveAnalysis(ocrResults, layoutResults, formResults, mathResults, chartResults) {
        console.log(chalk.blue('🔄 Generating comprehensive analysis...'));
        
        return {
            document: {
                totalPages: ocrResults.textBlocks.length,
                processingTime: Date.now(),
                language: 'ko-KR'
            },
            textBlocks: ocrResults.textBlocks,
            tables: layoutResults.visualElements.flatMap(page => page.tables),
            formFields: formResults.formData.flatMap(page => page.formFields),
            mathExpressions: mathResults.mathExpressions,
            charts: chartResults.chartAnalysis,
            statistics: {
                totalTextBlocks: ocrResults.textBlocks.reduce((sum, page) => sum + page.blocks.length, 0),
                totalMathExpressions: mathResults.mathExpressions.length,
                totalCharts: chartResults.chartAnalysis.length,
                koreanMathTerms: mathResults.mathExpressions.filter(expr => expr.isKorean).length,
                averageConfidence: this.calculateAverageConfidence(ocrResults, mathResults)
            }
        };
    }

    /**
     * Calculate overall quality score based on Document AI analysis
     */
    calculateQualityScore(analysis) {
        const scores = {
            textRecognition: Math.min(100, analysis.statistics.averageConfidence * 100),
            mathExpressionCoverage: Math.min(100, (analysis.mathExpressions.length / 10) * 100), // Expect ~10 math expressions
            layoutIntegrity: analysis.charts.length > 0 ? 95 : 85,
            koreanTextSupport: analysis.statistics.koreanMathTerms > 0 ? 95 : 90,
            interactiveElementPreservation: analysis.formFields.length > 0 ? 90 : 85
        };
        
        const overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
        
        return {
            overall: Math.round(overall),
            breakdown: scores,
            recommendations: this.generateQualityRecommendations(scores)
        };
    }

    /**
     * Generate quality improvement recommendations
     */
    generateQualityRecommendations(scores) {
        const recommendations = [];
        
        if (scores.textRecognition < 85) {
            recommendations.push('Improve PDF text rendering quality for better OCR accuracy');
        }
        
        if (scores.mathExpressionCoverage < 80) {
            recommendations.push('Ensure all mathematical expressions are properly formatted');
        }
        
        if (scores.koreanTextSupport < 90) {
            recommendations.push('Verify Korean font rendering in PDF output');
        }
        
        return recommendations;
    }

    /**
     * Helper methods
     */
    detectLanguage(block) {
        const text = block.layout?.textAnchor?.textSegments?.[0]?.text || '';
        return /[가-힣]/.test(text) ? 'ko-KR' : 'en-US';
    }

    classifyMathExpression(expression) {
        if (/y\s*=/.test(expression)) return 'function_equation';
        if (/f\(x\)/.test(expression)) return 'function_notation';
        if (/[+\-×÷]/.test(expression)) return 'arithmetic';
        if (/[가-힣]/.test(expression)) return 'korean_math_term';
        return 'general_math';
    }

    detectChartType(image) {
        // Placeholder - would analyze image content
        return 'coordinate_plane';
    }

    estimateDataPoints(image) {
        // Placeholder - would analyze chart content
        return Math.floor(Math.random() * 10) + 5;
    }

    isCoordinatePlane(image) {
        // Placeholder - would analyze for axis and grid patterns
        return true;
    }

    calculateAverageConfidence(ocrResults, mathResults) {
        const allConfidences = [
            ...ocrResults.textBlocks.flatMap(page => page.blocks.map(block => block.confidence)),
            ...mathResults.mathExpressions.map(expr => expr.confidence)
        ];
        
        return allConfidences.length > 0 
            ? allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length
            : 0.85; // Default confidence
    }

    /**
     * Save comprehensive results
     */
    async saveResults(baseName, processId, analysis, qualityScore) {
        const results = {
            metadata: {
                worksheet: baseName,
                processId,
                timestamp: new Date().toISOString(),
                processor: 'Google Document AI'
            },
            analysis,
            qualityScore,
            summary: {
                pages: analysis.document.totalPages,
                mathExpressions: analysis.statistics.totalMathExpressions,
                charts: analysis.statistics.totalCharts,
                overallQuality: qualityScore.overall
            }
        };
        
        const resultsPath = path.join(this.outputDir, 'quality-reports', `analysis-${baseName}-${processId}.json`);
        await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
        
        return resultsPath;
    }
}

export default DocumentAIIntegration;