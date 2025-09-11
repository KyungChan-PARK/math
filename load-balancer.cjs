class LoadBalancer {
    constructor(config = {}) {
        this.algorithm = config.algorithm || 'round-robin';
        this.agents = new Map();
        this.currentIndex = 0;
        this.healthCheckInterval = config.healthCheckInterval || 5000;
        this.maxLoad = config.maxLoad || 10;
        
        this.startHealthCheck();
    }

    registerAgent(agentId, metadata = {}) {
        this.agents.set(agentId, {
            id: agentId,
            load: 0,
            capacity: metadata.capacity || 10,
            weight: metadata.weight || 1,
            healthy: true,
            lastHealthCheck: Date.now(),
            requestsHandled: 0,
            totalResponseTime: 0,
            errors: 0,
            category: metadata.category
        });
    }

    selectAgent(taskType) {
        const eligibleAgents = Array.from(this.agents.values())
            .filter(agent => agent.healthy && agent.load < agent.capacity);
        
        if (eligibleAgents.length === 0) return null;
        
        switch (this.algorithm) {
            case 'round-robin':
                return this.roundRobin(eligibleAgents);
            case 'least-connections':
                return this.leastConnections(eligibleAgents);
            case 'weighted':
                return this.weighted(eligibleAgents);
            case 'response-time':
                return this.responseTime(eligibleAgents);
            default:
                return this.roundRobin(eligibleAgents);
        }
    }

    roundRobin(agents) {
        const agent = agents[this.currentIndex % agents.length];
        this.currentIndex++;
        return agent;
    }

    leastConnections(agents) {
        return agents.reduce((min, agent) => 
            agent.load < min.load ? agent : min
        );
    }

    weighted(agents) {
        const totalWeight = agents.reduce((sum, agent) => sum + agent.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const agent of agents) {
            random -= agent.weight;
            if (random <= 0) return agent;
        }
        
        return agents[agents.length - 1];
    }

    responseTime(agents) {
        return agents.reduce((best, agent) => {
            const avgResponseTime = agent.requestsHandled > 0
                ? agent.totalResponseTime / agent.requestsHandled
                : 0;
            const bestAvg = best.requestsHandled > 0
                ? best.totalResponseTime / best.requestsHandled
                : 0;
            
            return avgResponseTime < bestAvg ? agent : best;
        });
    }

    assignTask(agentId, task) {
        const agent = this.agents.get(agentId);
        if (!agent) return false;
        
        agent.load++;
        return true;
    }

    releaseTask(agentId, responseTime) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        agent.load = Math.max(0, agent.load - 1);
        agent.requestsHandled++;
        agent.totalResponseTime += responseTime;
    }

    reportError(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        agent.errors++;
        if (agent.errors > 5) {
            agent.healthy = false;
        }
    }

    startHealthCheck() {
        setInterval(() => {
            this.agents.forEach(agent => {
                if (Date.now() - agent.lastHealthCheck > this.healthCheckInterval * 2) {
                    agent.healthy = false;
                }
            });
        }, this.healthCheckInterval);
    }

    updateHealth(agentId, healthy = true) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.healthy = healthy;
            agent.lastHealthCheck = Date.now();
            if (healthy) agent.errors = 0;
        }
    }

    getStatistics() {
        const stats = Array.from(this.agents.values()).map(agent => ({
            id: agent.id,
            load: agent.load,
            capacity: agent.capacity,
            utilization: ((agent.load / agent.capacity) * 100).toFixed(2) + '%',
            healthy: agent.healthy,
            requestsHandled: agent.requestsHandled,
            avgResponseTime: agent.requestsHandled > 0
                ? (agent.totalResponseTime / agent.requestsHandled).toFixed(2)
                : 0,
            errors: agent.errors
        }));
        
        return {
            algorithm: this.algorithm,
            totalAgents: this.agents.size,
            healthyAgents: stats.filter(a => a.healthy).length,
            totalLoad: stats.reduce((sum, a) => sum + a.load, 0),
            totalCapacity: stats.reduce((sum, a) => sum + a.capacity, 0),
            agents: stats
        };
    }
}

module.exports = LoadBalancer;