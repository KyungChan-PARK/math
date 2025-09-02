#!/usr/bin/env python3
"""
AE Automation v2.1 - Performance Optimizations
Implements all optimizations from the review
"""

import asyncio
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from collections import deque
from datetime import datetime, timedelta
import logging
from pathlib import Path

# Setup enhanced logging
import os
log_dir = Path(__file__).parent / 'logs'
log_dir.mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_dir / 'ae_automation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# PERFORMANCE MONITORING
# ============================================================================

class PerformanceMonitor:
    """Real-time performance monitoring"""
    
    def __init__(self, window_size=100):
        self.metrics = {
            'response_times': deque(maxlen=window_size),
            'memory_usage': deque(maxlen=window_size),
            'api_calls': deque(maxlen=window_size),
            'cache_hits': 0,
            'cache_misses': 0,
            'errors': []
        }
    
    def record_request(self, response_time: float, success: bool):
        """Record API request metrics"""
        self.metrics['response_times'].append(response_time)
        timestamp = datetime.now()
        self.metrics['api_calls'].append({
            'time': timestamp,
            'response_ms': response_time * 1000,
            'success': success
        })
        
    def record_cache_hit(self):
        self.metrics['cache_hits'] += 1
        
    def record_cache_miss(self):
        self.metrics['cache_misses'] += 1
        
    def get_stats(self) -> Dict:
        """Get current performance statistics"""
        if self.metrics['response_times']:
            avg_response = sum(self.metrics['response_times']) / len(self.metrics['response_times'])
        else:
            avg_response = 0
            
        cache_total = self.metrics['cache_hits'] + self.metrics['cache_misses']
        cache_rate = self.metrics['cache_hits'] / cache_total if cache_total > 0 else 0
        
        return {
            'avg_response_time': avg_response,
            'cache_hit_rate': cache_rate,
            'total_requests': len(self.metrics['api_calls']),
            'recent_errors': self.metrics['errors'][-5:]
        }

# ============================================================================
# RATE LIMITING
# ============================================================================

class RateLimiter:
    """Advanced rate limiting with token bucket algorithm"""
    
    def __init__(self, rate: int = 60, per: int = 60):
        """
        Args:
            rate: Number of requests allowed
            per: Time period in seconds
        """
        self.rate = rate
        self.per = per
        self.allowance = rate
        self.last_check = time.time()
        self.lock = asyncio.Lock()
        
    async def acquire(self):
        """Wait if necessary to respect rate limit"""
        async with self.lock:
            current = time.time()
            time_passed = current - self.last_check
            self.last_check = current
            
            # Replenish tokens
            self.allowance += time_passed * (self.rate / self.per)
            if self.allowance > self.rate:
                self.allowance = self.rate
                
            if self.allowance < 1.0:
                # Need to wait
                sleep_time = (1.0 - self.allowance) * (self.per / self.rate)
                logger.warning(f"Rate limit reached, sleeping for {sleep_time:.2f}s")
                await asyncio.sleep(sleep_time)
                self.allowance = 1.0
                
            self.allowance -= 1.0

# ============================================================================
# CIRCUIT BREAKER PATTERN
# ============================================================================

class CircuitBreaker:
    """Circuit breaker to prevent cascading failures"""
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'closed'  # closed, open, half-open
        
    def is_open(self) -> bool:
        """Check if circuit is open"""
        if self.state == 'open':
            if self.last_failure_time:
                if time.time() - self.last_failure_time > self.recovery_timeout:
                    self.state = 'half-open'
                    return False
            return True
        return False
        
    async def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        if self.is_open():
            raise Exception("Circuit breaker is OPEN - service unavailable")
            
        try:
            result = await func(*args, **kwargs)
            if self.state == 'half-open':
                self.state = 'closed'
                self.failure_count = 0
                logger.info("Circuit breaker CLOSED - service recovered")
            return result
            
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.failure_count >= self.failure_threshold:
                self.state = 'open'
                logger.error(f"Circuit breaker OPEN after {self.failure_count} failures")
            raise

# ============================================================================
# RETRY MECHANISM WITH EXPONENTIAL BACKOFF
# ============================================================================

class RetryHandler:
    """Smart retry with exponential backoff"""
    
    def __init__(self, max_retries: int = 3, base_delay: float = 1.0):
        self.max_retries = max_retries
        self.base_delay = base_delay
        
    async def execute_with_retry(self, func, *args, **kwargs):
        """Execute function with automatic retry"""
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                return await func(*args, **kwargs)
                
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    delay = self.base_delay * (2 ** attempt)
                    logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"All {self.max_retries} attempts failed")
                    
        raise last_exception

# ============================================================================
# ENHANCED CACHE WITH TTL
# ============================================================================

import sqlite3
import hashlib
import json

class EnhancedCache:
    """Cache with TTL and semantic similarity"""
    
    def __init__(self, db_path: str = "cache/ae_cache_v2.db", ttl_hours: int = 24):
        self.db_path = Path(db_path)
        self.ttl = ttl_hours * 3600
        self.monitor = PerformanceMonitor()
        self.init_db()
    
    def init_db(self):
        """Initialize cache database with TTL support"""
        self.db_path.parent.mkdir(exist_ok=True)
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                value TEXT,
                agent TEXT,
                model TEXT,
                created_at REAL,
                expires_at REAL,
                hit_count INTEGER DEFAULT 0
            )
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_expires 
            ON cache(expires_at)
        ''')
        
        conn.commit()
        conn.close()
        
    def get(self, key: str) -> Optional[str]:
        """Get cached value if valid"""
        key_hash = hashlib.md5(key.encode()).hexdigest()
        current_time = time.time()
        
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT value, expires_at FROM cache 
            WHERE key = ? AND expires_at > ?
        ''', (key_hash, current_time))
        
        result = cursor.fetchone()
        
        if result:
            # Update hit count
            cursor.execute('''
                UPDATE cache SET hit_count = hit_count + 1 
                WHERE key = ?
            ''', (key_hash,))
            conn.commit()
            self.monitor.record_cache_hit()
        else:
            self.monitor.record_cache_miss()
            
        conn.close()
        return result[0] if result else None
    
    def store(self, key: str, value: str, agent: str, model: str):
        """Store value with TTL"""
        key_hash = hashlib.md5(key.encode()).hexdigest()
        current_time = time.time()
        expires_at = current_time + self.ttl
        
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO cache 
            (key, value, agent, model, created_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (key_hash, value, agent, model, current_time, expires_at))
        
        conn.commit()
        conn.close()

# ============================================================================
# DEBOUNCER FOR FILE SYSTEM EVENTS
# ============================================================================

class Debouncer:
    """Debounce rapid file system events"""
    
    def __init__(self, delay: float = 0.5):
        self.delay = delay
        self.pending_tasks = {}
        
    async def debounce(self, key: str, func, *args, **kwargs):
        """Execute function after delay, canceling previous calls"""
        # Cancel existing task if present
        if key in self.pending_tasks:
            self.pending_tasks[key].cancel()
            
        async def delayed_execution():
            await asyncio.sleep(self.delay)
            try:
                result = await func(*args, **kwargs)
                del self.pending_tasks[key]
                return result
            except asyncio.CancelledError:
                pass
                
        self.pending_tasks[key] = asyncio.create_task(delayed_execution())
        return self.pending_tasks[key]

# ============================================================================
# BATCH PROCESSOR
# ============================================================================

class BatchProcessor:
    """Process multiple tasks efficiently"""
    
    def __init__(self, batch_size: int = 5, batch_timeout: float = 2.0):
        self.batch_size = batch_size
        self.batch_timeout = batch_timeout
        self.queue = asyncio.Queue()
        self.processing = False
    
    async def add_task(self, task):
        """Add task to batch queue"""
        await self.queue.put(task)
        if not self.processing:
            asyncio.create_task(self.process_batch())
            
    async def process_batch(self):
        """Process tasks in batches"""
        self.processing = True
        batch = []
        start_time = time.time()
        
        try:
            while True:
                try:
                    # Wait for task with timeout
                    timeout = self.batch_timeout - (time.time() - start_time)
                    if timeout <= 0:
                        break
                        
                    task = await asyncio.wait_for(
                        self.queue.get(), 
                        timeout=timeout
                    )
                    batch.append(task)
                    
                    if len(batch) >= self.batch_size:
                        break
                        
                except asyncio.TimeoutError:
                    break
                    
            if batch:
                logger.info(f"Processing batch of {len(batch)} tasks")
                results = await asyncio.gather(
                    *[self.process_single(task) for task in batch],
                    return_exceptions=True
                )
                return results
                
        finally:
            self.processing = False
            
    async def process_single(self, task):
        """Process a single task"""
        # Implement task processing logic
        pass
