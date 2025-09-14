/**
 * Database Connection Pool Manager
 * MongoDB, Neo4j, Redis 연결 풀 최적화
 */

import { MongoClient } from 'mongodb';
import neo4j from 'neo4j-driver';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseConnectionPool extends EventEmitter {
    constructor() {
        super();
        
        // 연결 풀 설정
        this.config = {
            mongodb: {
                url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
                database: process.env.MONGODB_DB || 'mathlearning',
                poolSize: 10,
                maxPoolSize: 50,
                minPoolSize: 5,
                maxIdleTimeMS: 60000,
                waitQueueTimeoutMS: 5000
            },
            neo4j: {
                uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
                user: process.env.NEO4J_USER || 'neo4j',
                password: process.env.NEO4J_PASSWORD || 'password',
                maxConnectionPoolSize: 50,
                connectionAcquisitionTimeout: 60000,
                maxTransactionRetryTime: 30000
            },
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: false,
                retryStrategy: (times) => Math.min(times * 50, 2000)
            }
        };
        
        // 연결 인스턴스
        this.connections = {
            mongodb: null,
            mongoDb: null,
            neo4j: null,
            redis: null
        };
        
        // 연결 상태
        this.status = {
            mongodb: 'disconnected',
            neo4j: 'disconnected',
            redis: 'disconnected'
        };
        
        // 메트릭
        this.metrics = {
            mongodb: { queries: 0, errors: 0, avgTime: 0, connections: 0 },
            neo4j: { queries: 0, errors: 0, avgTime: 0, connections: 0 },
            redis: { operations: 0, errors: 0, avgTime: 0, hits: 0, misses: 0 }
        };
        
        // 헬스체크 인터벌
        this.healthCheckInterval = null;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Database Connection Pool 초기화 중...');
        
        // 모든 데이터베이스 연결을 병렬로 시작
        const connections = await Promise.allSettled([
            this.connectMongoDB(),
            this.connectNeo4j(),
            this.connectRedis()
        ]);
        
        // 연결 결과 확인
        connections.forEach((result, index) => {
            const dbName = ['MongoDB', 'Neo4j', 'Redis'][index];
            if (result.status === 'fulfilled') {
                console.log(`✅ ${dbName} 연결 성공`);
            } else {
                console.error(`❌ ${dbName} 연결 실패:`, result.reason);
            }
        });
        
        // 헬스체크 시작
        this.startHealthCheck();
        
        console.log('✅ Database Connection Pool 준비 완료');
    }
    
    /**
     * MongoDB 연결 풀
     */
    async connectMongoDB() {
        try {
            const options = {
                maxPoolSize: this.config.mongodb.maxPoolSize,
                minPoolSize: this.config.mongodb.minPoolSize,
                maxIdleTimeMS: this.config.mongodb.maxIdleTimeMS,
                waitQueueTimeoutMS: this.config.mongodb.waitQueueTimeoutMS,
                serverSelectionTimeoutMS: 5000
            };
            
            this.connections.mongodb = new MongoClient(this.config.mongodb.url, options);
            await this.connections.mongodb.connect();
            
            this.connections.mongoDb = this.connections.mongodb.db(this.config.mongodb.database);
            this.status.mongodb = 'connected';
            
            // 연결 이벤트 리스너
            this.connections.mongodb.on('serverOpening', () => {
                this.metrics.mongodb.connections++;
            });
            
            this.connections.mongodb.on('serverClosed', () => {
                this.metrics.mongodb.connections--;
            });
            
            return true;
        } catch (error) {
            this.status.mongodb = 'error';
            throw error;
        }
    }
    
    /**
     * Neo4j 연결 풀
     */
    async connectNeo4j() {
        try {
            this.connections.neo4j = neo4j.driver(
                this.config.neo4j.uri,
                neo4j.auth.basic(this.config.neo4j.user, this.config.neo4j.password),
                {
                    maxConnectionPoolSize: this.config.neo4j.maxConnectionPoolSize,
                    connectionAcquisitionTimeout: this.config.neo4j.connectionAcquisitionTimeout,
                    maxTransactionRetryTime: this.config.neo4j.maxTransactionRetryTime,
                    logging: {
                        level: 'info',
                        logger: (level, message) => {
                            if (level === 'error') {
                                this.metrics.neo4j.errors++;
                            }
                        }
                    }
                }
            );
            
            // 연결 테스트
            const session = this.connections.neo4j.session();
            await session.run('RETURN 1');
            await session.close();
            
            this.status.neo4j = 'connected';
            return true;
        } catch (error) {
            this.status.neo4j = 'error';
            throw error;
        }
    }
    
    /**
     * Redis 연결 풀
     */
    async connectRedis() {
        try {
            this.connections.redis = new Redis({
                host: this.config.redis.host,
                port: this.config.redis.port,
                maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
                enableReadyCheck: this.config.redis.enableReadyCheck,
                lazyConnect: this.config.redis.lazyConnect,
                retryStrategy: this.config.redis.retryStrategy
            });
            
            // 연결 이벤트
            this.connections.redis.on('connect', () => {
                this.status.redis = 'connected';
                console.log('Redis 연결됨');
            });
            
            this.connections.redis.on('error', (error) => {
                this.metrics.redis.errors++;
                console.error('Redis 에러:', error.message);
            });
            
            // Ping 테스트
            await this.connections.redis.ping();
            
            return true;
        } catch (error) {
            this.status.redis = 'error';
            throw error;
        }
    }
    
    /**
     * MongoDB 쿼리 실행 (연결 풀 사용)
     */
    async mongoQuery(collection, operation, ...args) {
        if (!this.connections.mongoDb) {
            throw new Error('MongoDB not connected');
        }
        
        const startTime = Date.now();
        this.metrics.mongodb.queries++;
        
        try {
            const coll = this.connections.mongoDb.collection(collection);
            const result = await coll[operation](...args);
            
            this.updateMetrics('mongodb', Date.now() - startTime);
            return result;
        } catch (error) {
            this.metrics.mongodb.errors++;
            throw error;
        }
    }
    
    /**
     * Neo4j 쿼리 실행 (세션 재사용)
     */
    async neo4jQuery(query, params = {}) {
        if (!this.connections.neo4j) {
            throw new Error('Neo4j not connected');
        }
        
        const startTime = Date.now();
        this.metrics.neo4j.queries++;
        
        const session = this.connections.neo4j.session();
        
        try {
            const result = await session.run(query, params);
            this.updateMetrics('neo4j', Date.now() - startTime);
            return result;
        } catch (error) {
            this.metrics.neo4j.errors++;
            throw error;
        } finally {
            await session.close();
        }
    }
    
    /**
     * Redis 캐시 작업
     */
    async redisGet(key) {
        if (!this.connections.redis) {
            throw new Error('Redis not connected');
        }
        
        const startTime = Date.now();
        this.metrics.redis.operations++;
        
        try {
            const value = await this.connections.redis.get(key);
            
            if (value) {
                this.metrics.redis.hits++;
            } else {
                this.metrics.redis.misses++;
            }
            
            this.updateMetrics('redis', Date.now() - startTime);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            this.metrics.redis.errors++;
            throw error;
        }
    }
    
    async redisSet(key, value, ttl = 3600) {
        if (!this.connections.redis) {
            throw new Error('Redis not connected');
        }
        
        const startTime = Date.now();
        this.metrics.redis.operations++;
        
        try {
            const result = await this.connections.redis.setex(
                key, 
                ttl, 
                JSON.stringify(value)
            );
            
            this.updateMetrics('redis', Date.now() - startTime);
            return result;
        } catch (error) {
            this.metrics.redis.errors++;
            throw error;
        }
    }
    
    /**
     * 트랜잭션 처리
     */
    async mongoTransaction(callback) {
        if (!this.connections.mongodb) {
            throw new Error('MongoDB not connected');
        }
        
        const session = this.connections.mongodb.startSession();
        
        try {
            await session.withTransaction(callback);
        } finally {
            await session.endSession();
        }
    }
    
    async neo4jTransaction(callback) {
        if (!this.connections.neo4j) {
            throw new Error('Neo4j not connected');
        }
        
        const session = this.connections.neo4j.session();
        const tx = session.beginTransaction();
        
        try {
            const result = await callback(tx);
            await tx.commit();
            return result;
        } catch (error) {
            await tx.rollback();
            throw error;
        } finally {
            await session.close();
        }
    }
    
    /**
     * 배치 작업
     */
    async mongoBulkWrite(collection, operations) {
        if (!this.connections.mongoDb) {
            throw new Error('MongoDB not connected');
        }
        
        const startTime = Date.now();
        
        try {
            const result = await this.connections.mongoDb
                .collection(collection)
                .bulkWrite(operations);
            
            this.updateMetrics('mongodb', Date.now() - startTime);
            return result;
        } catch (error) {
            this.metrics.mongodb.errors++;
            throw error;
        }
    }
    
    async redisPipeline(commands) {
        if (!this.connections.redis) {
            throw new Error('Redis not connected');
        }
        
        const pipeline = this.connections.redis.pipeline();
        
        commands.forEach(cmd => {
            pipeline[cmd.method](...cmd.args);
        });
        
        return await pipeline.exec();
    }
    
    /**
     * 헬스체크
     */
    startHealthCheck() {
        this.healthCheckInterval = setInterval(async () => {
            await this.checkHealth();
        }, 30000); // 30초마다
    }
    
    async checkHealth() {
        const health = {
            timestamp: new Date(),
            databases: {}
        };
        
        // MongoDB 체크
        if (this.connections.mongodb) {
            try {
                await this.connections.mongodb.db('admin').command({ ping: 1 });
                health.databases.mongodb = { status: 'healthy', ...this.metrics.mongodb };
            } catch (error) {
                health.databases.mongodb = { status: 'unhealthy', error: error.message };
                await this.reconnectMongoDB();
            }
        }
        
        // Neo4j 체크
        if (this.connections.neo4j) {
            try {
                const session = this.connections.neo4j.session();
                await session.run('RETURN 1');
                await session.close();
                health.databases.neo4j = { status: 'healthy', ...this.metrics.neo4j };
            } catch (error) {
                health.databases.neo4j = { status: 'unhealthy', error: error.message };
                await this.reconnectNeo4j();
            }
        }
        
        // Redis 체크
        if (this.connections.redis) {
            try {
                await this.connections.redis.ping();
                health.databases.redis = { status: 'healthy', ...this.metrics.redis };
            } catch (error) {
                health.databases.redis = { status: 'unhealthy', error: error.message };
                await this.reconnectRedis();
            }
        }
        
        this.emit('healthCheck', health);
        return health;
    }
    
    /**
     * 재연결 로직
     */
    async reconnectMongoDB() {
        console.log('MongoDB 재연결 시도...');
        try {
            await this.connections.mongodb.close();
            await this.connectMongoDB();
            console.log('MongoDB 재연결 성공');
        } catch (error) {
            console.error('MongoDB 재연결 실패:', error);
        }
    }
    
    async reconnectNeo4j() {
        console.log('Neo4j 재연결 시도...');
        try {
            await this.connections.neo4j.close();
            await this.connectNeo4j();
            console.log('Neo4j 재연결 성공');
        } catch (error) {
            console.error('Neo4j 재연결 실패:', error);
        }
    }
    
    async reconnectRedis() {
        console.log('Redis 재연결 시도...');
        try {
            this.connections.redis.disconnect();
            await this.connectRedis();
            console.log('Redis 재연결 성공');
        } catch (error) {
            console.error('Redis 재연결 실패:', error);
        }
    }
    
    /**
     * 메트릭 업데이트
     */
    updateMetrics(db, responseTime) {
        const metrics = this.metrics[db];
        const totalQueries = metrics.queries || metrics.operations || 0;
        
        metrics.avgTime = metrics.avgTime 
            ? (metrics.avgTime * (totalQueries - 1) + responseTime) / totalQueries
            : responseTime;
    }
    
    /**
     * 통계 조회
     */
    getStats() {
        return {
            status: this.status,
            metrics: this.metrics,
            cacheHitRate: this.metrics.redis.hits 
                ? (this.metrics.redis.hits / (this.metrics.redis.hits + this.metrics.redis.misses) * 100).toFixed(2) + '%'
                : '0%'
        };
    }
    
    /**
     * 정리 및 종료
     */
    async shutdown() {
        console.log('Database connections 종료 중...');
        
        clearInterval(this.healthCheckInterval);
        
        const closePromises = [];
        
        if (this.connections.mongodb) {
            closePromises.push(this.connections.mongodb.close());
        }
        
        if (this.connections.neo4j) {
            closePromises.push(this.connections.neo4j.close());
        }
        
        if (this.connections.redis) {
            this.connections.redis.disconnect();
        }
        
        await Promise.allSettled(closePromises);
        
        console.log('모든 데이터베이스 연결 종료됨');
    }
}

export default DatabaseConnectionPool;

// 테스트 및 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    const pool = new DatabaseConnectionPool();
    
    pool.on('healthCheck', (health) => {
        console.log('📊 Health Check:', JSON.stringify(health, null, 2));
    });
    
    // 테스트 쿼리
    setTimeout(async () => {
        console.log('\n🧪 연결 풀 테스트\n');
        
        try {
            // MongoDB 테스트
            const mongoResult = await pool.mongoQuery('test', 'findOne', {});
            console.log('MongoDB 테스트:', mongoResult ? '성공' : '빈 결과');
            
            // Neo4j 테스트
            const neo4jResult = await pool.neo4jQuery('MATCH (n) RETURN COUNT(n) as count LIMIT 1');
            console.log('Neo4j 테스트:', neo4jResult.records[0]?.get('count') || 0, '노드');
            
            // Redis 테스트
            await pool.redisSet('test:key', { value: 'test' }, 60);
            const redisResult = await pool.redisGet('test:key');
            console.log('Redis 테스트:', redisResult?.value === 'test' ? '성공' : '실패');
            
        } catch (error) {
            console.error('테스트 에러:', error.message);
        }
        
        console.log('\n📈 통계:', pool.getStats());
    }, 2000);
}

export default DatabaseConnectionPool;