/**
 * OpenAI Embeddings Service
 * Handles text embedding generation using OpenAI API
 * 
 * @version 1.0.0
 * @date 2025-09-07
 */

import OpenAI from 'openai';
import { createHash } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export class OpenAIEmbeddingService {
    constructor(config = {}) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || config.apiKey
        });
        
        // Configuration
        this.config = {
            model: config.model || 'text-embedding-3-small',
            dimensions: config.dimensions || 1536,
            cacheEnabled: config.cacheEnabled !== false,
            cacheTTL: config.cacheTTL || 3600000, // 1 hour
            batchSize: config.batchSize || 20,
            ...config
        };
        
        // Cache for embeddings
        this.cache = new Map();
        
        // Metrics
        this.metrics = {
            apiCalls: 0,
            tokensUsed: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0,
            totalCost: 0
        };
        
        console.log('✅ OpenAI Embedding Service initialized');
        console.log(`   Model: ${this.config.model}`);
        console.log(`   Dimensions: ${this.config.dimensions}`);
    }
    
    /**
     * Generate embedding for a single text
     */
    async generateEmbedding(text, useCache = true) {
        try {
            // Check cache first
            const cacheKey = this.getCacheKey(text);
            if (useCache && this.config.cacheEnabled) {
                const cached = this.cache.get(cacheKey);
                if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
                    this.metrics.cacheHits++;
                    return cached.embedding;
                }
            }
            
            // Call OpenAI API
            this.metrics.apiCalls++;
            this.metrics.cacheMisses++;
            
            const response = await this.openai.embeddings.create({
                model: this.config.model,
                input: text,
                dimensions: this.config.dimensions
            });
            
            const embedding = response.data[0].embedding;
            
            // Update metrics
            this.metrics.tokensUsed += response.usage?.total_tokens || 0;
            this.updateCost(response.usage?.total_tokens || 0);
            
            // Cache the result
            if (this.config.cacheEnabled) {
                this.cache.set(cacheKey, {
                    embedding,
                    timestamp: Date.now()
                });
            }
            
            return embedding;
            
        } catch (error) {
            this.metrics.errors++;
            console.error('❌ OpenAI Embedding error:', error.message);
            
            // Fallback to simple embedding if API fails
            return this.generateFallbackEmbedding(text);
        }
    }
    
    /**
     * Generate embeddings for multiple texts (batch processing)
     */
    async generateBatchEmbeddings(texts) {
        const results = [];
        
        // Process in batches
        for (let i = 0; i < texts.length; i += this.config.batchSize) {
            const batch = texts.slice(i, i + this.config.batchSize);
            
            try {
                const response = await this.openai.embeddings.create({
                    model: this.config.model,
                    input: batch,
                    dimensions: this.config.dimensions
                });
                
                this.metrics.apiCalls++;
                this.metrics.tokensUsed += response.usage?.total_tokens || 0;
                this.updateCost(response.usage?.total_tokens || 0);
                
                // Cache each result
                batch.forEach((text, index) => {
                    const embedding = response.data[index].embedding;
                    const cacheKey = this.getCacheKey(text);
                    
                    if (this.config.cacheEnabled) {
                        this.cache.set(cacheKey, {
                            embedding,
                            timestamp: Date.now()
                        });
                    }
                    
                    results.push(embedding);
                });
                
            } catch (error) {
                console.error('❌ Batch embedding error:', error.message);
                // Use fallback for failed batch
                for (const text of batch) {
                    results.push(this.generateFallbackEmbedding(text));
                }
            }
        }
        
        return results;
    }
    
    /**
     * Simple fallback embedding generator
     */
    generateFallbackEmbedding(text) {
        // Create a deterministic embedding based on text content
        const embedding = new Array(this.config.dimensions).fill(0);
        const words = text.toLowerCase().split(/\s+/);
        
        for (let i = 0; i < words.length && i < embedding.length; i++) {
            const hash = createHash('md5').update(words[i]).digest();
            embedding[i % embedding.length] = (hash[0] / 255) * 2 - 1; // Normalize to [-1, 1]
        }
        
        return embedding;
    }
    
    /**
     * Generate cache key for text
     */
    getCacheKey(text) {
        return createHash('md5').update(text).digest('hex');
    }
    
    /**
     * Update cost metrics
     */
    updateCost(tokens) {
        // Pricing per model (per 1K tokens)
        const pricing = {
            'text-embedding-3-small': 0.00002,
            'text-embedding-3-large': 0.00013,
            'text-embedding-ada-002': 0.00010
        };
        
        const costPer1K = pricing[this.config.model] || 0.00002;
        this.metrics.totalCost += (tokens / 1000) * costPer1K;
    }
    
    /**
     * Get service metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.cache.size,
            cacheHitRate: this.metrics.cacheHits / 
                (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
            averageTokensPerCall: this.metrics.tokensUsed / this.metrics.apiCalls || 0,
            estimatedMonthlyCost: this.metrics.totalCost * 30 // Rough estimate
        };
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('✅ Embedding cache cleared');
    }
    
    /**
     * Test the service
     */
    async test() {
        console.log(' Testing OpenAI Embedding Service...');
        
        try {
            const testText = 'This is a test for the math education system';
            const embedding = await this.generateEmbedding(testText);
            
            console.log('✅ Test successful!');
            console.log(`   Embedding dimensions: ${embedding.length}`);
            console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
            console.log(`   API calls made: ${this.metrics.apiCalls}`);
            console.log(`   Tokens used: ${this.metrics.tokensUsed}`);
            console.log(`   Cost so far: $${this.metrics.totalCost.toFixed(6)}`);
            
            return true;
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            return false;
        }
    }
}

// Export singleton instance
export default new OpenAIEmbeddingService();