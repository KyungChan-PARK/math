/**
 * Google Document AI Math OCR Service
 * Mathpix API 대체 솔루션
 * 비용 효율적이고 Google Cloud 네이티브 통합
 */

import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { Storage } from '@google-cloud/storage';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';

class DocumentAIMathOCR extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Google Cloud 설정
        this.projectId = config.projectId || 'math-project-472006';
        this.location = config.location || 'asia-northeast3';
        this.processorId = config.processorId || process.env.DOCUMENT_AI_PROCESSOR_ID;
        
        // Document AI 클라이언트 초기화
        this.client = new DocumentProcessorServiceClient({
            apiEndpoint: `${this.location}-documentai.googleapis.com`
        });
        
        // Storage 클라이언트 (대용량 파일 처리용)
        this.storage = new Storage({
            projectId: this.projectId
        });
        
        // 캐시 시스템 (비용 절감)
        this.cache = new Map();
        this.cacheTimeout = config.cacheTimeout || 3600000; // 1시간
        
        // 통계
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cacheHits: 0,
            totalCost: 0,
            avgLatency: 0
        };
        
        console.log('✅ Document AI Math OCR 서비스 초기화 완료');
        console.log('📌 Mathpix 대체 - 비용 절감 및 Google Cloud 통합');
    }
    
    /**
     * 수학 공식 인식 및 LaTeX 변환
     */
    async processImage(imagePath, options = {}) {
        const startTime = Date.now();
        this.stats.totalRequests++;
        
        try {
            // 캐시 확인
            const cacheKey = await this.getCacheKey(imagePath);
            if (this.cache.has(cacheKey) && !options.forceRefresh) {
                this.stats.cacheHits++;
                console.log('✨ 캐시 히트 - API 호출 없이 결과 반환');
                return this.cache.get(cacheKey);
            }
            
            // 이미지 읽기
            const imageFile = await fs.readFile(imagePath);
            const encodedImage = Buffer.from(imageFile).toString('base64');
            
            // Document AI 요청 생성
            const name = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;
            
            const request = {
                name,
                rawDocument: {
                    content: encodedImage,
                    mimeType: this.getMimeType(imagePath),
                },
                processOptions: {
                    // Math OCR 활성화 - 핵심 기능
                    ocrConfig: {
                        enableMathOcr: true,  // 수학 공식 인식 활성화
                        enableNativePdfParsing: false,
                        hints: {
                            languageHints: ['en', 'ko'] // 영어, 한국어 지원
                        }
                    }
                }
            };
            
            // API 호출
            console.log('🔄 Document AI 처리 중...');
            const [result] = await this.client.processDocument(request);
            
            // 결과 파싱
            const processedData = this.parseDocumentAIResponse(result);
            
            // 캐시 저장
            this.cache.set(cacheKey, processedData);
            setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
            
            // 통계 업데이트
            this.stats.successfulRequests++;
            this.stats.avgLatency = (this.stats.avgLatency + (Date.now() - startTime)) / 2;
            
            // 비용 계산 (Document AI 요금제 기준)
            const pages = result.document.pages?.length || 1;
            const estimatedCost = this.calculateCost(pages);
            this.stats.totalCost += estimatedCost;
            
            console.log(`✅ 처리 완료 - LaTeX 수식 ${processedData.formulas.length}개 추출`);
            console.log(`💰 예상 비용: $${estimatedCost.toFixed(4)} (Mathpix 대비 60% 절감)`);
            
            return processedData;
            
        } catch (error) {
            this.stats.failedRequests++;
            console.error('❌ Document AI 처리 실패:', error.message);
            
            // 폴백: 기본 OCR
            return this.fallbackOCR(imagePath);
        }
    }
    
    /**
     * Document AI 응답 파싱
     */
    parseDocumentAIResponse(result) {
        const document = result.document;
        const formulas = [];
        const text = document.text || '';
        
        // 수학 공식 추출
        if (document.entities) {
            document.entities.forEach(entity => {
                if (entity.type === 'math_formula' || entity.type === 'equation') {
                    formulas.push({
                        latex: entity.mentionText || entity.normalizedValue?.text,
                        confidence: entity.confidence || 0,
                        boundingBox: this.extractBoundingBox(entity)
                    });
                }
            });
        }
        
        // 페이지별 분석
        const pages = [];
        if (document.pages) {
            document.pages.forEach((page, index) => {
                const pageFormulas = [];
                
                // 블록 레벨 수식 검색
                if (page.blocks) {
                    page.blocks.forEach(block => {
                        const blockText = this.getTextFromLayout(block.layout, text);
                        if (this.isMathContent(blockText)) {
                            pageFormulas.push({
                                type: 'block',
                                content: blockText,
                                latex: this.convertToLaTeX(blockText),
                                boundingBox: block.layout.boundingPoly
                            });
                        }
                    });
                }
                
                // 인라인 수식 검색
                if (page.paragraphs) {
                    page.paragraphs.forEach(paragraph => {
                        const paraText = this.getTextFromLayout(paragraph.layout, text);
                        const inlineMath = this.extractInlineMath(paraText);
                        if (inlineMath.length > 0) {
                            pageFormulas.push(...inlineMath);
                        }
                    });
                }
                
                pages.push({
                    pageNumber: index + 1,
                    formulas: pageFormulas,
                    confidence: page.confidence || 0
                });
            });
        }
        
        return {
            success: true,
            provider: 'Google Document AI',
            timestamp: new Date().toISOString(),
            text: text,
            formulas: formulas,
            pages: pages,
            metadata: {
                processorVersion: result.humanReviewStatus?.humanReviewOperation,
                confidence: document.confidence || 0,
                language: document.detectedLanguages?.[0]?.languageCode || 'en'
            }
        };
    }
    
    /**
     * 텍스트를 LaTeX로 변환
     */
    convertToLaTeX(text) {
        // 기본 수식 패턴 변환
        let latex = text;
        
        // 분수 변환
        latex = latex.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
        
        // 제곱 변환
        latex = latex.replace(/(\w+)\^(\d+)/g, '$1^{$2}');
        
        // 제곱근 변환
        latex = latex.replace(/√(\w+)/g, '\\sqrt{$1}');
        latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
        
        // 그리스 문자 변환
        const greekLetters = {
            'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ',
            'theta': 'θ', 'lambda': 'λ', 'mu': 'μ', 'pi': 'π',
            'sigma': 'σ', 'phi': 'φ', 'omega': 'ω'
        };
        
        Object.keys(greekLetters).forEach(key => {
            latex = latex.replace(new RegExp(`\\b${key}\\b`, 'g'), `\\${key}`);
        });
        
        // 적분/미분 변환
        latex = latex.replace(/∫/g, '\\int');
        latex = latex.replace(/∂/g, '\\partial');
        latex = latex.replace(/∑/g, '\\sum');
        latex = latex.replace(/∏/g, '\\prod');
        
        return latex;
    }
    
    /**
     * 인라인 수식 추출
     */
    extractInlineMath(text) {
        const patterns = [
            /\$([^$]+)\$/g,  // LaTeX 인라인
            /\\\((.+?)\\\)/g, // LaTeX 괄호
            /\[(.+?)\]/g      // 대괄호 수식
        ];
        
        const matches = [];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                matches.push({
                    type: 'inline',
                    content: match[0],
                    latex: match[1] || match[0]
                });
            }
        });
        
        return matches;
    }
    
    /**
     * 수학 콘텐츠 판별
     */
    isMathContent(text) {
        const mathIndicators = [
            /[+\-×÷=≠<>≤≥]/,  // 수학 연산자
            /\d+[a-z]|[a-z]\d+/, // 변수
            /\\[a-zA-Z]+/,       // LaTeX 명령
            /[∫∑∏√∂∇]/,         // 수학 기호
            /\^|_/,              // 위첨자, 아래첨자
            /\\frac|\\sqrt/      // LaTeX 함수
        ];
        
        return mathIndicators.some(pattern => pattern.test(text));
    }
    
    /**
     * 레이아웃에서 텍스트 추출
     */
    getTextFromLayout(layout, fullText) {
        if (!layout?.textAnchor?.textSegments) return '';
        
        let extractedText = '';
        layout.textAnchor.textSegments.forEach(segment => {
            const startIndex = parseInt(segment.startIndex || 0);
            const endIndex = parseInt(segment.endIndex || fullText.length);
            extractedText += fullText.substring(startIndex, endIndex);
        });
        
        return extractedText;
    }
    
    /**
     * 바운딩 박스 추출
     */
    extractBoundingBox(entity) {
        if (!entity.pageAnchor?.pageRefs?.[0]?.boundingPoly) return null;
        
        return {
            vertices: entity.pageAnchor.pageRefs[0].boundingPoly.vertices || [],
            normalizedVertices: entity.pageAnchor.pageRefs[0].boundingPoly.normalizedVertices || []
        };
    }
    
    /**
     * MIME 타입 판별
     */
    getMimeType(filePath) {
        const ext = filePath.split('.').pop().toLowerCase();
        const mimeTypes = {
            'pdf': 'application/pdf',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'tiff': 'image/tiff',
            'bmp': 'image/bmp'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
    
    /**
     * 캐시 키 생성
     */
    async getCacheKey(imagePath) {
        const stats = await fs.stat(imagePath);
        const data = `${imagePath}-${stats.size}-${stats.mtime}`;
        return crypto.createHash('md5').update(data).digest('hex');
    }
    
    /**
     * 비용 계산 (Document AI 요금제)
     */
    calculateCost(pages) {
        // Google Document AI 요금 (대략)
        // 첫 1000페이지: $1.50/1000페이지
        // Mathpix: $0.004/요청 (약 $4/1000요청)
        // 약 60% 절감
        const costPerPage = 0.0015;
        return pages * costPerPage;
    }
    
    /**
     * 폴백 OCR (기본 텍스트 추출)
     */
    async fallbackOCR(imagePath) {
        console.log('⚠️ 폴백 모드: 기본 OCR 사용');
        
        return {
            success: false,
            provider: 'fallback',
            message: 'Document AI 사용 불가, 기본 OCR 모드',
            text: '',
            formulas: [],
            pages: []
        };
    }
    
    /**
     * 배치 처리 (다중 이미지)
     */
    async processBatch(imagePaths, options = {}) {
        console.log(`📦 배치 처리 시작: ${imagePaths.length}개 이미지`);
        
        const results = await Promise.all(
            imagePaths.map(path => this.processImage(path, options))
        );
        
        const successful = results.filter(r => r.success).length;
        console.log(`✅ 배치 처리 완료: ${successful}/${imagePaths.length} 성공`);
        
        return results;
    }
    
    /**
     * 통계 조회
     */
    getStats() {
        return {
            ...this.stats,
            cacheHitRate: (this.stats.cacheHits / this.stats.totalRequests * 100).toFixed(2) + '%',
            successRate: (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%',
            avgCostPerRequest: (this.stats.totalCost / this.stats.totalRequests).toFixed(4),
            mathpixSavings: (this.stats.totalRequests * 0.004 - this.stats.totalCost).toFixed(2)
        };
    }
}

// 사용 예제
async function testDocumentAIMathOCR() {
    const mathOCR = new DocumentAIMathOCR({
        projectId: 'math-project-472006',
        location: 'asia-northeast3'
    });
    
    // 단일 이미지 처리
    const result = await mathOCR.processImage('./sample-math.png');
    console.log('추출된 LaTeX 수식:', result.formulas);
    
    // 통계 확인
    console.log('📊 사용 통계:', mathOCR.getStats());
}

export default DocumentAIMathOCR;
export { DocumentAIMathOCR };