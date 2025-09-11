const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class MathpixAPIClient extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Load configuration
        this.config = config;
        this.credentials = config.credentials || {};
        this.baseURL = 'https://api.mathpix.com/v3';
        
        // Initialize rate limiter
        this.requestQueue = [];
        this.requestCount = 0;
        this.resetTime = Date.now() + 60000;
        this.maxRequestsPerMinute = config.limits?.rate_limit_per_minute || 20;
        
        // Cache system
        this.cache = new Map();
        this.cacheTimeout = config.cacheTimeout || 3600000; // 1 hour
        
        // Statistics
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cacheHits: 0,
            totalLatency: 0
        };
        
        this.setupAxiosInstance();
    }
    
    setupAxiosInstance() {
        this.axios = axios.create({
            baseURL: this.baseURL,
            headers: {
                'app_id': this.credentials.app_id,
                'app_key': this.credentials.app_key,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        // Add request interceptor for logging
        this.axios.interceptors.request.use(
            request => {
                this.emit('request', { 
                    method: request.method,
                    url: request.url,
                    timestamp: Date.now()
                });
                return request;
            },
            error => {
                this.emit('error', error);
                return Promise.reject(error);
            }
        );
        
        // Add response interceptor for statistics
        this.axios.interceptors.response.use(
            response => {
                this.stats.successfulRequests++;
                this.emit('response', {
                    status: response.status,
                    timestamp: Date.now()
                });
                return response;
            },
            error => {
                this.stats.failedRequests++;
                this.emit('error', error);
                return Promise.reject(error);
            }
        );
    }
    
    // Rate limiting
    async checkRateLimit() {
        const now = Date.now();
        
        if (now > this.resetTime) {
            this.requestCount = 0;
            this.resetTime = now + 60000;
        }
        
        if (this.requestCount >= this.maxRequestsPerMinute) {
            const waitTime = this.resetTime - now;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.checkRateLimit();
        }
        
        this.requestCount++;
        return true;
    }
    
    // Generate cache key
    generateCacheKey(endpoint, params) {
        const hash = crypto.createHash('md5');
        hash.update(endpoint + JSON.stringify(params));
        return hash.digest('hex');
    }
    
    // Check cache
    checkCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            this.stats.cacheHits++;
            return cached.data;
        }
        return null;
    }
    
    // Save to cache
    saveToCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        
        // Clean old cache entries
        if (this.cache.size > 1000) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
    }
    
    // Core OCR function for image to LaTeX conversion
    async processImage(imageData, options = {}) {
        const startTime = Date.now();
        
        // Generate cache key based on image content
        const cacheKey = this.generateCacheKey('ocr', { imageData: imageData.substring(0, 100) });
        
        // Check if result exists in cache
        const cached = this.checkCache(cacheKey);
        if (cached) {
            this.emit('cache-hit', { key: cacheKey });
            return cached;
        }
        
        // Apply rate limiting to prevent API overuse
        await this.checkRateLimit();
        
        try {
            this.stats.totalRequests++;
            
            // Prepare request options with sensible defaults
            const requestOptions = {
                src: imageData, // Base64 encoded image or URL
                formats: options.formats || ['text', 'latex_styled', 'mathml'],
                data_options: {
                    include_asciimath: options.includeAsciimath || true,
                    include_latex: options.includeLatex || true,
                    include_mathml: options.includeMathml || true,
                    include_svg: options.includeSvg || false,
                    include_table_html: options.includeTableHtml || true
                },
                // OCR settings optimized for mathematical content
                ocr: {
                    math_inline_delimiters: ['$', '$'],
                    math_display_delimiters: ['$$', '$$'],
                    rm_spaces: true,
                    numbers_default_to_math: true
                }
            };
            
            // Make API request
            const response = await this.axios.post('/text', requestOptions);
            
            // Calculate processing time for performance monitoring
            const latency = Date.now() - startTime;
            this.stats.totalLatency += latency;
            
            // Process and enhance the response
            const result = {
                ...response.data,
                metadata: {
                    processingTime: latency,
                    timestamp: new Date().toISOString(),
                    confidence: response.data.confidence || null,
                    requestId: response.data.request_id || null
                }
            };
            
            // Save to cache for future use
            this.saveToCache(cacheKey, result);
            
            this.emit('ocr-complete', {
                latency,
                formats: Object.keys(result).filter(k => k !== 'metadata')
            });
            
            return result;
            
        } catch (error) {
            this.emit('ocr-error', error);
            throw this.handleError(error);
        }
    }
    
    // Process PDF documents - handles multi-page mathematical documents
    async processPDF(pdfData, options = {}) {
        await this.checkRateLimit();
        
        try {
            const requestOptions = {
                src: pdfData, // Base64 encoded PDF
                conversion_formats: {
                    'docx': options.outputDocx || true,
                    'tex.zip': options.outputLatex || true,
                    'html': options.outputHtml || false,
                    'md': options.outputMarkdown || true
                },
                math_inline_delimiters: ['$', '$'],
                math_display_delimiters: ['\\[', '\\]'],
                enable_tables_fallback: true
            };
            
            // Submit PDF for processing
            const response = await this.axios.post('/pdf', requestOptions);
            const pdfId = response.data.pdf_id;
            
            this.emit('pdf-processing-started', { pdfId });
            
            // Poll for completion (PDFs process asynchronously)
            return await this.pollPDFStatus(pdfId, options.timeout || 300000);
            
        } catch (error) {
            this.emit('pdf-error', error);
            throw this.handleError(error);
        }
    }
    
    // Poll PDF processing status
    async pollPDFStatus(pdfId, timeout = 300000) {
        const startTime = Date.now();
        const pollInterval = 2000; // Check every 2 seconds
        
        while (Date.now() - startTime < timeout) {
            try {
                const response = await this.axios.get(`/pdf/${pdfId}`);
                
                if (response.data.status === 'completed') {
                    this.emit('pdf-complete', { pdfId });
                    return response.data;
                } else if (response.data.status === 'error') {
                    throw new Error(`PDF processing failed: ${response.data.error}`);
                }
                
                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                
            } catch (error) {
                if (error.response?.status === 404) {
                    // PDF not ready yet, continue polling
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                } else {
                    throw error;
                }
            }
        }
        
        throw new Error('PDF processing timeout');
    }
    
    // Batch process multiple images efficiently
    async processBatch(images, options = {}) {
        const batchSize = options.batchSize || 5;
        const results = [];
        const errors = [];
        
        this.emit('batch-started', { totalImages: images.length, batchSize });
        
        // Process images in batches to respect rate limits
        for (let i = 0; i < images.length; i += batchSize) {
            const batch = images.slice(i, i + batchSize);
            
            // Process batch in parallel
            const batchPromises = batch.map(async (image, index) => {
                try {
                    const result = await this.processImage(image.data, image.options || {});
                    return { index: i + index, success: true, result };
                } catch (error) {
                    return { index: i + index, success: false, error: error.message };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            
            // Separate successes and failures
            batchResults.forEach(item => {
                if (item.success) {
                    results[item.index] = item.result;
                } else {
                    errors.push({ index: item.index, error: item.error });
                }
            });
            
            this.emit('batch-progress', {
                processed: Math.min(i + batchSize, images.length),
                total: images.length
            });
            
            // Add delay between batches to avoid rate limiting
            if (i + batchSize < images.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        this.emit('batch-complete', {
            successful: results.filter(r => r).length,
            failed: errors.length
        });
        
        return { results, errors };
    }
    
    // Convert LaTeX to various formats
    async renderLatex(latex, format = 'svg', options = {}) {
        await this.checkRateLimit();
        
        try {
            const requestOptions = {
                latex: latex,
                format: format, // 'svg', 'png', 'mathml'
                display_mode: options.displayMode || false,
                svg_options: format === 'svg' ? {
                    width: options.width || null,
                    ex_height: options.exHeight || 8
                } : undefined
            };
            
            const response = await this.axios.post('/latex', requestOptions);
            
            return {
                rendered: response.data[format],
                format: format,
                metadata: {
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            this.emit('render-error', error);
            throw this.handleError(error);
        }
    }
    
    // Error handling with detailed messages
    handleError(error) {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.error?.message || error.message;
            
            switch (status) {
                case 400:
                    return new Error(`Invalid request: ${message}`);
                case 401:
                    return new Error('Authentication failed. Check API credentials.');
                case 429:
                    return new Error('Rate limit exceeded. Please wait before retrying.');
                case 500:
                    return new Error('Mathpix server error. Please try again later.');
                default:
                    return new Error(`API error (${status}): ${message}`);
            }
        }
        return error;
    }
    
    // Get usage statistics
    getStatistics() {
        const avgLatency = this.stats.totalRequests > 0
            ? Math.round(this.stats.totalLatency / this.stats.totalRequests)
            : 0;
        
        return {
            totalRequests: this.stats.totalRequests,
            successfulRequests: this.stats.successfulRequests,
            failedRequests: this.stats.failedRequests,
            cacheHits: this.stats.cacheHits,
            cacheHitRate: this.stats.totalRequests > 0
                ? ((this.stats.cacheHits / this.stats.totalRequests) * 100).toFixed(2) + '%'
                : '0%',
            averageLatency: avgLatency + 'ms',
            currentCacheSize: this.cache.size
        };
    }
    
    // Clear cache
    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        this.emit('cache-cleared', { entriesCleared: size });
        return size;
    }
}

module.exports = MathpixAPIClient;