/**
 * AI Agent Memory Pool Manager
 * Dynamic memory allocation and management for 75 AI agents
 */

import EventEmitter from 'events';
import os from 'os';

export class AgentMemoryPool extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Configuration
        this.totalMemoryMB = config.totalMemoryMB || 1024; // 1GB default
        this.minMemoryPerAgent = config.minMemoryPerAgent || 5; // 5MB minimum
        this.maxMemoryPerAgent = config.maxMemoryPerAgent || 50; // 50MB maximum
        
        // Agent categories with priority
        this.agentCategories = {
            math_concepts: { count: 10, priority: 3, weight: 1.2 },
            pedagogy: { count: 10, priority: 2, weight: 1.0 },
            visualization: { count: 10, priority: 2, weight: 1.1 },
            interaction: { count: 10, priority: 3, weight: 1.0 },
            assessment: { count: 10, priority: 2, weight: 0.9 },
            technical: { count: 10, priority: 1, weight: 0.8 },
            content: { count: 10, priority: 2, weight: 1.0 },
            analytics: { count: 5, priority: 1, weight: 1.5 }
        };
        
        // Memory allocation map
        this.memoryAllocations = new Map();
        this.memoryUsage = new Map();
        
        // Initialize allocations
        this.initializeAllocations();
    }
}
    // Initialize memory allocations for all agents
    initializeAllocations() {
        let totalWeight = 0;
        let agentList = [];
        
        // Calculate total weight
        Object.entries(this.agentCategories).forEach(([category, info]) => {
            totalWeight += info.count * info.weight * info.priority;
            
            // Create agent entries
            for (let i = 0; i < info.count; i++) {
                agentList.push({
                    id: `${category}_${i}`,
                    category: category,
                    priority: info.priority,
                    weight: info.weight
                });
            }
        });
        
        // Allocate memory proportionally
        agentList.forEach(agent => {
            const allocation = Math.max(
                this.minMemoryPerAgent,
                Math.min(
                    this.maxMemoryPerAgent,
                    (this.totalMemoryMB * agent.weight * agent.priority) / totalWeight
                )
            );
            
            this.memoryAllocations.set(agent.id, {
                allocated: allocation,
                used: 0,
                lastAccess: Date.now(),
                category: agent.category,
                priority: agent.priority
            });
        });
        
        console.log(`✅ Initialized memory pool for ${agentList.length} agents`);
    }
    
    // Request memory for an agent
    requestMemory(agentId, requestedMB) {
        const allocation = this.memoryAllocations.get(agentId);
        
        if (!allocation) {
            throw new Error(`Unknown agent: ${agentId}`);
        }
        
        allocation.lastAccess = Date.now();
        
        // Check if request is within allocation
        if (requestedMB <= allocation.allocated - allocation.used) {
            allocation.used += requestedMB;
            this.emit('memory-allocated', { agentId, allocated: requestedMB });
            return true;
        }
        
        // Try to steal memory from low-priority agents
        if (this.reallocateMemory(agentId, requestedMB)) {
            allocation.used += requestedMB;
            this.emit('memory-reallocated', { agentId, allocated: requestedMB });
            return true;
        }
        
        this.emit('memory-denied', { agentId, requested: requestedMB });
        return false;
    }
    // Dynamic memory reallocation
    reallocateMemory(requestingAgentId, neededMB) {
        const requester = this.memoryAllocations.get(requestingAgentId);
        let freedMemory = 0;
        
        // Sort agents by priority and last access time
        const candidates = Array.from(this.memoryAllocations.entries())
            .filter(([id, _]) => id !== requestingAgentId)
            .sort((a, b) => {
                // Lower priority first
                if (a[1].priority !== b[1].priority) {
                    return a[1].priority - b[1].priority;
                }
                // Older access time first
                return a[1].lastAccess - b[1].lastAccess;
            });
        
        // Try to free memory from low-priority agents
        for (const [agentId, allocation] of candidates) {
            if (allocation.priority < requester.priority) {
                const availableToFree = Math.min(
                    allocation.used * 0.5, // Free up to 50% of used memory
                    neededMB - freedMemory
                );
                
                if (availableToFree > 0) {
                    allocation.used -= availableToFree;
                    freedMemory += availableToFree;
                    
                    this.emit('memory-reclaimed', {
                        from: agentId,
                        amount: availableToFree
                    });
                }
                
                if (freedMemory >= neededMB) {
                    return true;
                }
            }
        }
        
        return freedMemory >= neededMB;
    }
    
    // Release memory
    releaseMemory(agentId, releasedMB) {
        const allocation = this.memoryAllocations.get(agentId);
        
        if (allocation) {
            allocation.used = Math.max(0, allocation.used - releasedMB);
            this.emit('memory-released', { agentId, released: releasedMB });
        }
    }
    
    // Get memory statistics
    getStatistics() {
        let totalAllocated = 0;
        let totalUsed = 0;
        const categoryStats = {};
        
        this.memoryAllocations.forEach((allocation, agentId) => {
            totalAllocated += allocation.allocated;
            totalUsed += allocation.used;
            
            if (!categoryStats[allocation.category]) {
                categoryStats[allocation.category] = {
                    allocated: 0,
                    used: 0,
                    agents: 0
                };
            }
            
            categoryStats[allocation.category].allocated += allocation.allocated;
            categoryStats[allocation.category].used += allocation.used;
            categoryStats[allocation.category].agents++;
        });
        
        return {
            pool: {
                total: this.totalMemoryMB,
                allocated: totalAllocated,
                used: totalUsed,
                available: this.totalMemoryMB - totalUsed,
                utilizationPercent: ((totalUsed / this.totalMemoryMB) * 100).toFixed(2)
            },
            categories: categoryStats,
            agents: {
                total: this.memoryAllocations.size,
                active: Array.from(this.memoryAllocations.values())
                    .filter(a => a.used > 0).length
            }
        };
    }
    
    // Optimize memory distribution
    optimize() {
        console.log('🔧 Optimizing memory pool...');
        
        const stats = this.getStatistics();
        const underutilized = [];
        const overutilized = [];
        
        // Identify under and over utilized agents
        this.memoryAllocations.forEach((allocation, agentId) => {
            const utilization = allocation.used / allocation.allocated;
            
            if (utilization < 0.3) {
                underutilized.push({ id: agentId, allocation });
            } else if (utilization > 0.9) {
                overutilized.push({ id: agentId, allocation });
            }
        });
        
        // Redistribute memory
        underutilized.forEach(({ id, allocation }) => {
            const reduceBy = (allocation.allocated - allocation.used) * 0.5;
            allocation.allocated -= reduceBy;
        });
        
        const freedMemory = underutilized.reduce((sum, { allocation }) => 
            sum + (allocation.allocated - allocation.used) * 0.5, 0);
        
        if (freedMemory > 0 && overutilized.length > 0) {
            const perAgent = freedMemory / overutilized.length;
            overutilized.forEach(({ allocation }) => {
                allocation.allocated = Math.min(
                    this.maxMemoryPerAgent,
                    allocation.allocated + perAgent
                );
            });
        }
        
        console.log(`✅ Optimization complete: ${underutilized.length} reduced, ${overutilized.length} increased`);
        this.emit('pool-optimized', stats);
        
        return stats;
    }
}

export default AgentMemoryPool;