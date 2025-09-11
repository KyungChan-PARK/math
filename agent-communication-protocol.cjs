const EventEmitter = require('events');
const crypto = require('crypto');

class AgentCommunicationProtocol extends EventEmitter {
    constructor() {
        super();
        this.agents = new Map();
        this.channels = new Map();
        this.messageQueue = [];
        this.activeConnections = new Map();
        this.messageHandlers = new Map();
        
        this.setupProtocolHandlers();
    }

    registerAgent(agentId, metadata = {}) {
        const agent = {
            id: agentId,
            category: metadata.category || 'general',
            priority: metadata.priority || 1,
            capabilities: metadata.capabilities || [],
            status: 'idle',
            lastActivity: Date.now(),
            messageCount: 0,
            connections: new Set()
        };
        
        this.agents.set(agentId, agent);
        this.emit('agent-registered', agent);
        return agent;
    }

    createChannel(channelName, agents = []) {
        const channelId = crypto.randomBytes(8).toString('hex');
        const channel = {
            id: channelId,
            name: channelName,
            agents: new Set(agents),
            messages: [],
            created: Date.now(),
            type: agents.length === 2 ? 'direct' : 'group'
        };
        
        this.channels.set(channelId, channel);
        agents.forEach(agentId => {
            const agent = this.agents.get(agentId);
            if (agent) {
                agent.connections.add(channelId);
            }
        });
        
        return channelId;
    }

    sendMessage(fromAgent, toAgent, message, priority = 1) {
        const messageId = crypto.randomBytes(8).toString('hex');
        const msg = {
            id: messageId,
            from: fromAgent,
            to: toAgent,
            content: message,
            priority: priority,
            timestamp: Date.now(),
            status: 'pending',
            attempts: 0
        };
        
        if (priority > 5) {
            this.messageQueue.unshift(msg);
        } else {
            this.messageQueue.push(msg);
        }
        
        this.processMessageQueue();
        return messageId;
    }

    broadcast(fromAgent, category, message) {
        const recipients = Array.from(this.agents.values())
            .filter(agent => agent.category === category && agent.id !== fromAgent)
            .map(agent => agent.id);
        
        const broadcasts = recipients.map(toAgent => 
            this.sendMessage(fromAgent, toAgent, message, 3)
        );
        
        return broadcasts;
    }

    async processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            
            try {
                await this.deliverMessage(msg);
                msg.status = 'delivered';
                this.emit('message-delivered', msg);
            } catch (error) {
                msg.attempts++;
                if (msg.attempts < 3) {
                    msg.status = 'retry';
                    this.messageQueue.push(msg);
                } else {
                    msg.status = 'failed';
                    this.emit('message-failed', msg);
                }
            }
        }
    }

    async deliverMessage(msg) {
        const toAgent = this.agents.get(msg.to);
        if (!toAgent) {
            throw new Error(`Agent ${msg.to} not found`);
        }
        
        toAgent.status = 'processing';
        toAgent.lastActivity = Date.now();
        toAgent.messageCount++;
        
        const handler = this.messageHandlers.get(msg.to);
        if (handler) {
            await handler(msg);
        }
        
        toAgent.status = 'idle';
    }

    onMessage(agentId, handler) {
        this.messageHandlers.set(agentId, handler);
    }

    setupProtocolHandlers() {
        // Collaboration request
        this.on('collaboration-request', (request) => {
            const { requester, agents, task } = request;
            const channelId = this.createChannel(`collab-${task}`, [requester, ...agents]);
            
            agents.forEach(agentId => {
                this.sendMessage('system', agentId, {
                    type: 'collaboration-invite',
                    channel: channelId,
                    task: task,
                    requester: requester
                }, 5);
            });
            
            return channelId;
        });
        
        // Task distribution
        this.on('distribute-task', (task) => {
            const eligibleAgents = Array.from(this.agents.values())
                .filter(agent => 
                    agent.status === 'idle' && 
                    task.requiredCapabilities.some(cap => agent.capabilities.includes(cap))
                )
                .sort((a, b) => b.priority - a.priority);
            
            if (eligibleAgents.length > 0) {
                const selectedAgent = eligibleAgents[0];
                this.sendMessage('system', selectedAgent.id, {
                    type: 'task-assignment',
                    task: task
                }, task.priority || 3);
                
                return selectedAgent.id;
            }
            
            return null;
        });
    }

    getStatistics() {
        const agentStats = Array.from(this.agents.values()).map(agent => ({
            id: agent.id,
            category: agent.category,
            status: agent.status,
            messageCount: agent.messageCount,
            connections: agent.connections.size
        }));
        
        return {
            totalAgents: this.agents.size,
            activeChannels: this.channels.size,
            pendingMessages: this.messageQueue.length,
            agentStats: agentStats,
            messageQueueSize: this.messageQueue.length
        };
    }
}

module.exports = AgentCommunicationProtocol;