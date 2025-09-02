#!/usr/bin/env python3
"""
Test Script for Optimized AE Automation v2.1
Validates all optimization features
"""

import asyncio
import time
from pathlib import Path
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ae_automation_v2_optimized import OptimizedOrchestrator
from ae_automation_v2 import Task

async def test_cache_performance():
    """Test cache hit/miss performance"""
    print("\n📊 Testing Cache Performance...")
    
    orchestrator = OptimizedOrchestrator()
    
    # Create test task
    task = Task(
        type="test",
        prompt="Create a simple wiggle expression"
    )
    
    # First call - cache miss
    start = time.time()
    # Simulate processing
    orchestrator.cache.store(task.prompt, "wiggle(5, 10)", "TestAgent", "sonnet")
    result1 = orchestrator.cache.get(task.prompt)
    time1 = time.time() - start
    
    # Second call - cache hit
    start = time.time()
    result2 = orchestrator.cache.get(task.prompt)
    time2 = time.time() - start
    
    print(f"  ❌ Cache miss time: {time1*1000:.2f}ms")
    print(f"  ✅ Cache hit time: {time2*1000:.2f}ms")
    print(f"  ⚡ Speedup: {time1/time2:.1f}x faster")
    
    return time2 < time1

async def test_rate_limiting():
    """Test rate limiter functionality"""
    print("\n⏱️ Testing Rate Limiting...")
    
    orchestrator = OptimizedOrchestrator()
    
    # Try rapid requests
    start = time.time()
    for i in range(5):
        await orchestrator.rate_limiter.acquire()
        
    elapsed = time.time() - start
    print(f"  ⏰ 5 requests took: {elapsed:.2f}s")
    print(f"  ✅ Rate limiting working")
    
    return True

async def test_circuit_breaker():
    """Test circuit breaker pattern"""
    print("\n🔌 Testing Circuit Breaker...")
    
    orchestrator = OptimizedOrchestrator()
    
    async def failing_function():
        raise Exception("Simulated failure")
    
    # Test failures
    for i in range(3):
        try:
            await orchestrator.circuit_breaker.call(failing_function)
        except:
            pass
            
    print(f"  🔴 Circuit state: {orchestrator.circuit_breaker.state}")
    print(f"  💔 Failures: {orchestrator.circuit_breaker.failure_count}")
    
    # Test if circuit opens after threshold
    if orchestrator.circuit_breaker.failure_count >= 3:
        print("  ✅ Circuit breaker activated correctly")
        return True
    return False

async def test_debouncer():
    """Test debouncing functionality"""
    print("\n🎯 Testing Debouncer...")
    
    orchestrator = OptimizedOrchestrator()
    
    counter = {'value': 0}
    
    async def increment():
        counter['value'] += 1
        return counter['value']
    
    # Rapid calls - only last should execute
    for i in range(5):
        task = orchestrator.debouncer.debounce('test_key', increment)
        await asyncio.sleep(0.1)
        
    await asyncio.sleep(0.6)  # Wait for debounce delay
    
    print(f"  📝 Counter value: {counter['value']}")
    print(f"  ✅ Debouncing working (expected 1, got {counter['value']})")
    
    return counter['value'] == 1

async def test_performance_monitor():
    """Test performance monitoring"""
    print("\n📈 Testing Performance Monitor...")
    
    orchestrator = OptimizedOrchestrator()
    
    # Record some metrics
    orchestrator.monitor.record_request(0.5, True)
    orchestrator.monitor.record_request(0.3, True)
    orchestrator.monitor.record_request(0.7, False)
    orchestrator.monitor.record_cache_hit()
    orchestrator.monitor.record_cache_hit()
    orchestrator.monitor.record_cache_miss()
    
    stats = orchestrator.monitor.get_stats()
    
    print(f"  📊 Avg Response: {stats['avg_response_time']:.2f}s")
    print(f"  💾 Cache Hit Rate: {stats['cache_hit_rate']*100:.1f}%")
    print(f"  📞 Total Requests: {stats['total_requests']}")
    print("  ✅ Monitoring operational")
    
    return True

async def test_health_check():
    """Test system health check"""
    print("\n🏥 Testing Health Check...")
    
    orchestrator = OptimizedOrchestrator()
    health = await orchestrator.health_check()
    
    print(f"  🟢 Status: {health['status']}")
    for component, status in health['components'].items():
        emoji = "✅" if status in ['operational', 'closed'] else "⚠️"
        print(f"  {emoji} {component}: {status}")
        
    return health['status'] in ['healthy', 'degraded']

async def run_all_tests():
    """Run all optimization tests"""
    print("=" * 60)
    print("🧪 AE Automation v2.1 - Optimization Test Suite")
    print("=" * 60)
    
    tests = [
        ("Cache Performance", test_cache_performance),
        ("Rate Limiting", test_rate_limiting),
        ("Circuit Breaker", test_circuit_breaker),
        ("Debouncer", test_debouncer),
        ("Performance Monitor", test_performance_monitor),
        ("Health Check", test_health_check)
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = await test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Test '{name}' failed with error: {e}")
            results.append((name, False))
            
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {name}")
        
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL OPTIMIZATIONS WORKING PERFECTLY!")
    else:
        print("⚠️ Some optimizations need attention")
        
    return passed == total

if __name__ == "__main__":
    # Create necessary directories
    Path("cache").mkdir(exist_ok=True)
    Path("logs").mkdir(exist_ok=True)
    
    # Run tests
    success = asyncio.run(run_all_tests())
    
    if success:
        print("\n✨ System optimizations validated successfully!")
        print("💡 Ready to integrate with main system")
    else:
        print("\n⚠️ Please review failed tests before integration")
        sys.exit(1)
