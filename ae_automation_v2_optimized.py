#!/usr/bin/env python3
"""
AE Automation v2.1 - Integration Module
Integrates all optimizations into the main system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ae_optimizations import (
    PerformanceMonitor,
    RateLimiter,
    CircuitBreaker,
    RetryHandler,
    EnhancedCache,
    Debouncer,
    BatchProcessor
)
from ae_automation_v2 import Orchestrator, Task
import asyncio
import logging
import time

logger = logging.getLogger(__name__)

class OptimizedOrchestrator(Orchestrator):
    """Enhanced orchestrator with all optimizations"""
    
    def __init__(self):
        super().__init__()
        
        # Initialize optimization components
        self.monitor = PerformanceMonitor()
        self.rate_limiter = RateLimiter(rate=60, per=60)  # 60 requests per minute
        self.circuit_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60)
        self.retry_handler = RetryHandler(max_retries=3, base_delay=1.0)
        self.cache = EnhancedCache(ttl_hours=24)
        self.debouncer = Debouncer(delay=0.5)
        self.batch_processor = BatchProcessor(batch_size=5, batch_timeout=2.0)
        
        logger.info("Optimized Orchestrator initialized with all enhancements")
        
    async def route_task_optimized(self, task: Task):
        """Route task with all optimizations applied"""
        start_time = time.time()
        
        # Check cache first
        cached_result = self.cache.get(task.prompt)
        if cached_result:
            logger.info(f"Cache hit for task: {task.id}")
            self.monitor.record_cache_hit()
            return cached_result
            
        self.monitor.record_cache_miss()
        
        # Apply rate limiting
        await self.rate_limiter.acquire()
        
        # Execute with circuit breaker and retry
        try:
            result = await self.circuit_breaker.call(
                self.retry_handler.execute_with_retry,
                super().route_task,
                task
            )
            
            # Cache successful result
            if result.success:
                self.cache.store(
                    task.prompt,
                    result.output,
                    result.agent_name,
                    result.model_used
                )
                
            # Record metrics
            response_time = time.time() - start_time
            self.monitor.record_request(response_time, result.success)
            
            return result
            
        except Exception as e:
            logger.error(f"Task routing failed: {e}")
            response_time = time.time() - start_time
            self.monitor.record_request(response_time, False)
            raise
            
    async def process_file_event_debounced(self, file_path: str):
        """Process file events with debouncing"""
        return await self.debouncer.debounce(
            file_path,
            self.process_file,
            file_path
        )
        
    async def process_batch_tasks(self, tasks: List[Task]):
        """Process multiple tasks as a batch"""
        logger.info(f"Processing batch of {len(tasks)} tasks")
        
        # Add tasks to batch processor
        for task in tasks:
            await self.batch_processor.add_task(task)
            
    def get_performance_stats(self):
        """Get current performance statistics"""
        stats = self.monitor.get_stats()
        stats.update({
            'circuit_breaker_state': self.circuit_breaker.state,
            'rate_limiter_allowance': self.rate_limiter.allowance,
            'pending_debounced_tasks': len(self.debouncer.pending_tasks),
            'batch_queue_size': self.batch_processor.queue.qsize()
        })
        return stats
        
    async def health_check(self):
        """System health check"""
        health = {
            'status': 'healthy',
            'components': {}
        }
        
        # Check circuit breaker
        if self.circuit_breaker.is_open():
            health['status'] = 'degraded'
            health['components']['circuit_breaker'] = 'open'
        else:
            health['components']['circuit_breaker'] = 'closed'
            
        # Check cache
        try:
            self.cache.get('health_check_test')
            health['components']['cache'] = 'operational'
        except Exception as e:
            health['status'] = 'degraded'
            health['components']['cache'] = f'error: {e}'
            
        # Check performance
        stats = self.monitor.get_stats()
        if stats['avg_response_time'] > 5.0:  # 5 seconds threshold
            health['status'] = 'degraded'
            health['components']['performance'] = 'slow'
            
        return health

async def main():
    """Main entry point for optimized system"""
    from rich.console import Console
    from rich.table import Table
    import time
    
    console = Console()
    
    console.print("[bold green]🚀 AE Automation v2.1 - Optimized Edition[/bold green]")
    console.print("[yellow]Initializing enhanced system...[/yellow]")
    
    # Initialize orchestrator
    orchestrator = OptimizedOrchestrator()
    
    # Perform health check
    health = await orchestrator.health_check()
    
    # Display health status
    table = Table(title="System Health Check")
    table.add_column("Component", style="cyan")
    table.add_column("Status", style="green")
    
    for component, status in health['components'].items():
        color = "green" if status in ['operational', 'closed'] else "yellow"
        table.add_row(component.replace('_', ' ').title(), f"[{color}]{status}[/{color}]")
        
    console.print(table)
    
    # Display performance stats
    stats = orchestrator.get_performance_stats()
    
    stats_table = Table(title="Performance Statistics")
    stats_table.add_column("Metric", style="cyan")
    stats_table.add_column("Value", style="yellow")
    
    stats_table.add_row("Avg Response Time", f"{stats['avg_response_time']:.2f}s")
    stats_table.add_row("Cache Hit Rate", f"{stats['cache_hit_rate']*100:.1f}%")
    stats_table.add_row("Circuit Breaker", stats['circuit_breaker_state'])
    stats_table.add_row("Rate Limit Available", f"{stats['rate_limiter_allowance']:.1f}")
    
    console.print(stats_table)
    
    console.print("\n[bold green]✅ System ready for operation![/bold green]")
    console.print("[dim]Monitoring drop zones for new tasks...[/dim]")
    
    # Start monitoring
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        console.print("\n[yellow]Shutting down gracefully...[/yellow]")

if __name__ == "__main__":
    asyncio.run(main())
