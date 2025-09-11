/**
 * PALANTIR 성능 최적화 시스템
 * Redis 캐싱 + Cloudflare CDN 통합
 */

const Redis = require('ioredis');
const LRU = require('lru-cache');
const crypto = require('crypto');

// Redis 클라이언트 설정
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some(e => err.message.includes(e));
    }
});

// 메모리 캐시 (LRU)
const memoryCache = new LRU({
    max: 500,
    maxAge: 1000 * 60 * 5, // 5분
    updateAgeOnGet: true,
    dispose: (key, value) => {
        console.log(`Cache evicted: ${key}`);
    }
});

// 캐시 통계
const cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0
};

class CacheManager {
    constructor() {
        this.defaultTTL = 300; // 5분
        this.keyPrefix = 'palantir:';
    }
    
    /**
     * 캐시 키 생성
     */
    generateKey(namespace, identifier) {
        const hash = crypto
            .createHash('md5')
            .update(`${namespace}:${JSON.stringify(identifier)}`)
            .digest('hex');
        return `${this.keyPrefix}${namespace}:${hash}`;
    }
    
    /**
     * 다층 캐시 조회 (메모리 -> Redis)
     */
    async get(namespace, identifier) {
        const key = this.generateKey(namespace, identifier);
        
        // 1. 메모리 캐시 확인
        const memoryResult = memoryCache.get(key);
        if (memoryResult) {
            cacheStats.hits++;
            this.updateStats();
            return memoryResult;
        }
        
        // 2. Redis 캐시 확인
        try {
            const redisResult = await redis.get(key);
            if (redisResult) {
                const data = JSON.parse(redisResult);
                
                // 메모리 캐시에 저장
                memoryCache.set(key, data);
                
                cacheStats.hits++;
                this.updateStats();
                return data;
            }
        } catch (error) {
            console.error('Redis get error:', error);
        }
        
        cacheStats.misses++;
        this.updateStats();
        return null;
    }
    
    /**
     * 다층 캐시 저장
     */
    async set(namespace, identifier, data, ttl = this.defaultTTL) {
        const key = this.generateKey(namespace, identifier);
        
        // 1. 메모리 캐시 저장
        memoryCache.set(key, data);
        
        // 2. Redis 캐시 저장
        try {
            await redis.setex(key, ttl, JSON.stringify(data));
            cacheStats.sets++;
            this.updateStats();
        } catch (error) {
            console.error('Redis set error:', error);
        }
        
        return true;
    }
    
    /**
     * 캐시 삭제
     */
    async delete(namespace, identifier) {
        const key = this.generateKey(namespace, identifier);
        
        // 1. 메모리 캐시 삭제
        memoryCache.del(key);
        
        // 2. Redis 캐시 삭제
        try {
            await redis.del(key);
            cacheStats.deletes++;
            this.updateStats();
        } catch (error) {
            console.error('Redis delete error:', error);
        }
        
        return true;
    }
    
    /**
     * 패턴으로 캐시 삭제
     */
    async deletePattern(pattern) {
        // 메모리 캐시 클리어
        const keys = memoryCache.keys();
        keys.forEach(key => {
            if (key.includes(pattern)) {
                memoryCache.del(key);
            }
        });
        
        // Redis 캐시 클리어
        try {
            const redisKeys = await redis.keys(`${this.keyPrefix}${pattern}*`);
            if (redisKeys.length > 0) {
                await redis.del(...redisKeys);
            }
        } catch (error) {
            console.error('Redis pattern delete error:', error);
        }
    }
    
    /**
     * 캐시 통계 업데이트
     */
    updateStats() {
        const total = cacheStats.hits + cacheStats.misses;
        cacheStats.hitRate = total > 0 ? (cacheStats.hits / total * 100).toFixed(2) : 0;
    }
    
    /**
     * 캐시 통계 조회
     */
    getStats() {
        return {
            ...cacheStats,
            memorySize: memoryCache.size,
            memoryMax: memoryCache.max
        };
    }
    
    /**
     * 캐시 워밍
     */
    async warmCache(items) {
        console.log(`Warming cache with ${items.length} items...`);
        
        for (const item of items) {
            await this.set(item.namespace, item.identifier, item.data, item.ttl);
        }
        
        console.log('Cache warming completed');
    }
}

/**
 * CDN 최적화 미들웨어
 */
class CDNOptimizer {
    constructor() {
        this.cdnHeaders = {
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
            'CDN-Cache-Control': 'max-age=86400',
            'Surrogate-Control': 'max-age=86400',
            'Vary': 'Accept-Encoding'
        };
    }
    
    /**
     * Express 미들웨어
     */
    middleware() {
        return (req, res, next) => {
            // 정적 자산에 대한 CDN 헤더 설정
            if (this.isStaticAsset(req.path)) {
                Object.entries(this.cdnHeaders).forEach(([key, value]) => {
                    res.setHeader(key, value);
                });
                
                // ETag 생성
                res.setHeader('ETag', this.generateETag(req.path));
            }
            
            // API 응답 캐싱
            if (req.path.startsWith('/api/')) {
                res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
                res.setHeader('Surrogate-Key', this.getSurrogateKey(req.path));
            }
            
            next();
        };
    }
    
    /**
     * 정적 자산 확인
     */
    isStaticAsset(path) {
        const staticExtensions = ['.js', '.css', '.jpg', '.png', '.gif', '.svg', '.woff', '.woff2'];
        return staticExtensions.some(ext => path.endsWith(ext));
    }
    
    /**
     * ETag 생성
     */
    generateETag(content) {
        return crypto
            .createHash('md5')
            .update(content)
            .digest('hex');
    }
    
    /**
     * Surrogate Key 생성
     */
    getSurrogateKey(path) {
        const parts = path.split('/').filter(Boolean);
        return parts.slice(0, 2).join('-');
    }
    
    /**
     * CDN 캐시 무효화
     */
    async purgeCache(keys) {
        const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
        const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
        
        if (!CLOUDFLARE_ZONE_ID || !CLOUDFLARE_API_TOKEN) {
            console.log('Cloudflare credentials not configured');
            return;
        }
        
        try {
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tags: keys
                    })
                }
            );
            
            const result = await response.json();
            console.log('CDN cache purged:', result);
        } catch (error) {
            console.error('CDN purge error:', error);
        }
    }
}

/**
 * 데이터베이스 쿼리 최적화
 */
class QueryOptimizer {
    constructor(cacheManager) {
        this.cache = cacheManager;
        this.queryStats = new Map();
    }
    
    /**
     * 쿼리 실행 with 캐싱
     */
    async executeQuery(query, params = {}, options = {}) {
        const cacheKey = { query, params };
        const namespace = options.namespace || 'query';
        const ttl = options.ttl || 300;
        
        // 캐시 확인
        const cached = await this.cache.get(namespace, cacheKey);
        if (cached && !options.skipCache) {
            this.updateQueryStats(query, true);
            return cached;
        }
        
        // 쿼리 실행
        const startTime = Date.now();
        const result = await this.runQuery(query, params);
        const duration = Date.now() - startTime;
        
        // 통계 업데이트
        this.updateQueryStats(query, false, duration);
        
        // 캐시 저장
        if (!options.noCache) {
            await this.cache.set(namespace, cacheKey, result, ttl);
        }
        
        return result;
    }
    
    /**
     * 실제 쿼리 실행 (구현 필요)
     */
    async runQuery(query, params) {
        // Firestore/BigQuery 쿼리 실행
        // 실제 구현 필요
        return { mock: true, query, params };
    }
    
    /**
     * 쿼리 통계 업데이트
     */
    updateQueryStats(query, fromCache, duration = 0) {
        if (!this.queryStats.has(query)) {
            this.queryStats.set(query, {
                executions: 0,
                cacheHits: 0,
                totalDuration: 0,
                avgDuration: 0
            });
        }
        
        const stats = this.queryStats.get(query);
        stats.executions++;
        
        if (fromCache) {
            stats.cacheHits++;
        } else {
            stats.totalDuration += duration;
            stats.avgDuration = stats.totalDuration / (stats.executions - stats.cacheHits);
        }
    }
    
    /**
     * 느린 쿼리 분석
     */
    getSlowQueries(threshold = 1000) {
        const slowQueries = [];
        
        this.queryStats.forEach((stats, query) => {
            if (stats.avgDuration > threshold) {
                slowQueries.push({
                    query,
                    avgDuration: stats.avgDuration,
                    executions: stats.executions,
                    cacheHitRate: (stats.cacheHits / stats.executions * 100).toFixed(2)
                });
            }
        });
        
        return slowQueries.sort((a, b) => b.avgDuration - a.avgDuration);
    }
}

/**
 * 리소스 최적화
 */
class ResourceOptimizer {
    /**
     * 이미지 최적화 설정
     */
    static getImageOptimizationConfig() {
        return {
            quality: 85,
            formats: ['webp', 'avif'],
            sizes: [320, 640, 1024, 1920],
            lazy: true
        };
    }
    
    /**
     * JavaScript 번들 최적화
     */
    static getBundleOptimizationConfig() {
        return {
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        priority: 10
                    },
                    common: {
                        minChunks: 2,
                        priority: 5,
                        reuseExistingChunk: true
                    }
                }
            },
            minimize: true,
            usedExports: true,
            sideEffects: false
        };
    }
    
    /**
     * CSS 최적화
     */
    static getCSSOptimizationConfig() {
        return {
            autoprefixer: true,
            minify: true,
            purgeUnused: true,
            critical: {
                inline: true,
                width: 1300,
                height: 900
            }
        };
    }
}

// 싱글톤 인스턴스
const cacheManager = new CacheManager();
const cdnOptimizer = new CDNOptimizer();
const queryOptimizer = new QueryOptimizer(cacheManager);

module.exports = {
    cacheManager,
    cdnOptimizer,
    queryOptimizer,
    ResourceOptimizer,
    redis
};
