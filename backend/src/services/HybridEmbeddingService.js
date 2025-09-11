/**
 * Hybrid Embedding Service
 * Supports both OpenAI API and Local Embeddings
 * Falls back to local model when API fails
 * 
 * @version 2.0.0
 * @date 2025-09-07
 */

import { createHash } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export class HybridEmbeddingService {
    constructor(config = {}) {
        // Try OpenAI if API key exists
        this.openaiEnabled = false;
        this.openai = null;
        
        if (process.env.OPENAI_API_KEY) {
            this.initOpenAI().catch(err => {
                console.log('️ OpenAI not available, using local embeddings:', err.message);
            });
        }
        
        // Configuration
        this.config = {
            model: config.model || 'text-embedding-3-small',
            dimensions: config.dimensions || 384, // Local model dimensions
            openaiDimensions: 1536,
            useOpenAI: config.useOpenAI !== false && this.openaiEnabled,
            cacheEnabled: config.cacheEnabled !== false,
            cacheTTL: config.cacheTTL || 3600000,
            ...config
        };
        
        // Cache
        this.cache = new Map();
        
        // Metrics
        this.metrics = {
            apiCalls: 0,
            localCalls: 0,
            cacheHits: 0,
            errors: 0
        };
        
        console.log('✅ Hybrid Embedding Service initialized');
        console.log(`   Mode: ${this.config.useOpenAI ? 'OpenAI + Local Fallback' : 'Local Only'}`);
        console.log(`   Dimensions: ${this.config.dimensions}`);
    }
    
    /**
     * Dynamically import and initialize OpenAI
     */
    async initOpenAI() {
        try {
            const { default: OpenAI } = await import('openai');
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
            this.openaiEnabled = true;
            console.log('✅ OpenAI initialized successfully');
        } catch (error) {
            console.log('️ Could not initialize OpenAI:', error.message);
            this.openaiEnabled = false;
        }
    }
    
    /**
     * Generate embedding using best available method
     */
    async generateEmbedding(text, forceLocal = false) {
        try {
            // Check cache
            const cacheKey = this.getCacheKey(text);
            if (this.config.cacheEnabled) {
                const cached = this.cache.get(cacheKey);
                if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
                    this.metrics.cacheHits++;
                    return cached.embedding;
                }
            }
            
            let embedding;
            
            // Try OpenAI first if enabled
            if (this.config.useOpenAI && !forceLocal && this.openaiEnabled && this.openai) {
                try {
                    // Ensure OpenAI is initialized
                    if (!this.openai) {
                        await this.initOpenAI();
                    }
                    
                    if (this.openai) {
                        const response = await this.openai.embeddings.create({
                            model: this.config.model,
                            input: text,
                            dimensions: this.config.openaiDimensions
                        });
                        
                        embedding = response.data[0].embedding;
                        this.metrics.apiCalls++;
                        console.log('✅ Used OpenAI embedding');
                    }
                    
                } catch (apiError) {
                    console.log('️ OpenAI failed, using local embedding:', apiError.message);
                    this.metrics.errors++;
                    // Fall through to local embedding
                }
            }
            
            // Use local embedding if OpenAI failed or disabled
            if (!embedding) {
                embedding = this.generateLocalEmbedding(text);
                this.metrics.localCalls++;
            }
            
            // Cache result
            if (this.config.cacheEnabled) {
                this.cache.set(cacheKey, {
                    embedding,
                    timestamp: Date.now()
                });
            }
            
            return embedding;
            
        } catch (error) {
            this.metrics.errors++;
            console.error('❌ Embedding error:', error.message);
            return this.generateLocalEmbedding(text);
        }
    }
    
    /**
     * Advanced local embedding using TF-IDF inspired approach
     */
    generateLocalEmbedding(text) {
        const dimensions = this.config.dimensions;
        const embedding = new Array(dimensions).fill(0);
        
        // Tokenize and clean
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2);
        
        if (words.length === 0) {
            return embedding;
        }
        
        // Generate features
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            
            // Word position feature
            const positionWeight = 1 - (i / words.length) * 0.3;
            
            // Hash word to multiple dimensions
            for (let j = 0; j < 3; j++) {
                const hash = createHash('md5')
                    .update(word + j.toString())
                    .digest();
                
                // Map to embedding dimensions
                const dim1 = Math.abs(hash.readInt32LE(0)) % dimensions;
                const dim2 = Math.abs(hash.readInt32LE(4)) % dimensions;
                const dim3 = Math.abs(hash.readInt32LE(8)) % dimensions;
                
                // Add weighted values
                embedding[dim1] += (hash[12] / 255) * positionWeight;
                embedding[dim2] += (hash[13] / 255) * positionWeight * 0.7;
                embedding[dim3] += (hash[14] / 255) * positionWeight * 0.5;
            }
            
            // Bigram features
            if (i < words.length - 1) {
                const bigram = words[i] + '_' + words[i + 1];
                const bigramHash = createHash('md5').update(bigram).digest();
                const bigramDim = Math.abs(bigramHash.readInt32LE(0)) % dimensions;
                embedding[bigramDim] += (bigramHash[4] / 255) * 0.8;
            }
        }
        
        // Normalize to unit vector
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
            for (let i = 0; i < dimensions; i++) {
                embedding[i] = embedding[i] / magnitude;
            }
        }
        
        return embedding;
    }
    
    /**
     * Batch processing
     */
    async generateBatchEmbeddings(texts, forceLocal = false) {
        const results = [];
        
        for (const text of texts) {
            const embedding = await this.generateEmbedding(text, forceLocal);
            results.push(embedding);
        }
        
        return results;
    }
    
    /**
     * Calculate similarity between two texts
     */
    async calculateSimilarity(text1, text2) {
        const [emb1, emb2] = await Promise.all([
            this.generateEmbedding(text1),
            this.generateEmbedding(text2)
        ]);
        
        // Cosine similarity
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < emb1.length; i++) {
            dotProduct += emb1[i] * emb2[i];
            norm1 += emb1[i] * emb1[i];
            norm2 += emb2[i] * emb2[i];
        }
        
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
    
    /**
     * Get cache key
     */
    getCacheKey(text) {
        return createHash('md5').update(text).digest('hex');
    }
    
    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.cache.size,
            cacheHitRate: this.metrics.cacheHits / 
                (this.metrics.cacheHits + this.metrics.apiCalls + this.metrics.localCalls) || 0,
            apiUsageRate: this.metrics.apiCalls / 
                (this.metrics.apiCalls + this.metrics.localCalls) || 0
        };
    }
    
    /**
     * Test the service
     */
    async test() {
        console.log('\n Testing Hybrid Embedding Service...\n');
        
        const testTexts = [
            'Mathematics education system',
            'AI-powered learning platform',
            'Mathematics education system with AI'
        ];
        
        // Test embeddings
        console.log(' Generating embeddings...');
        const embeddings = await this.generateBatchEmbeddings(testTexts);
        
        console.log(`✅ Generated ${embeddings.length} embeddings`);
        console.log(`   Dimensions: ${embeddings[0].length}`);
        
        // Test similarity
        console.log('\n Testing similarity:');
        const sim1 = await this.calculateSimilarity(testTexts[0], testTexts[1]);
        const sim2 = await this.calculateSimilarity(testTexts[0], testTexts[2]);
        
        console.log(`   "${testTexts[0]}" vs "${testTexts[1]}": ${(sim1 * 100).toFixed(1)}%`);
        console.log(`   "${testTexts[0]}" vs "${testTexts[2]}": ${(sim2 * 100).toFixed(1)}%`);
        
        // Show metrics
        console.log('\n Metrics:', this.getMetrics());
        
        return true;
    }
}

// Export singleton
export default new HybridEmbeddingService();