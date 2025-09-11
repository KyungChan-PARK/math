/**
 * Claude Orchestrator Integration for Self-Improving Development System
 * Connects the self-improving system with Claude's 5 specialized agents
 */

import axios from 'axios';
import chalk from 'chalk';

class OrchestratorIntegration {
    constructor() {
        this.orchestratorUrl = 'http://localhost:8089';
        this.agents = [
            'mathConcept',
            'gestureAnalyzer', 
            'scriptGenerator',
            'documentManager',
            'performanceOptimizer'
        ];
        
        this.integrationStats = {
            requestsSent: 0,
            responsesReceived: 0,
            agentsUsed: {},
            averageResponseTime: 0
        };
    }
    
    async enhanceIssueResolution(issue, context) {
        console.log(chalk.cyan(' Requesting Claude Orchestrator assistance...'));
        
        const startTime = Date.now();
        
        try {
            // Determine which agent to use based on issue type
            const agent = this.selectAgent(issue.type);
            
            // Send to orchestrator
            const response = await axios.post(`${this.orchestratorUrl}/system/analyze`, {
                issue: {
                    type: issue.type,
                    message: issue.message,
                    context: context
                },
                agent: agent,
                requestEnhancedAnalysis: true
            }, {
                timeout: 30000
            });
            
            const responseTime = Date.now() - startTime;
            this.updateStats(agent, responseTime);
            
            console.log(chalk.green(`✅ Orchestrator response received in ${responseTime}ms`));
            
            return {
                success: true,
                agent: agent,
                analysis: response.data.analysis,
                solutions: response.data.solutions || [],
                confidence: response.data.confidence || 0.8,
                recommendations: response.data.recommendations || []
            };
            
        } catch (error) {
            console.log(chalk.yellow('️ Orchestrator unavailable, falling back to local analysis'));
            return null;
        }
    }
    
    selectAgent(issueType) {
        const agentMap = {
            'MODULE_ERROR': 'documentManager',
            'CONNECTION_ERROR': 'performanceOptimizer',
            'PORT_CONFLICT': 'performanceOptimizer',
            'SYNTAX_ERROR': 'scriptGenerator',
            'PERFORMANCE_ISSUE': 'performanceOptimizer',
            'INTEGRATION_FAILURE': 'gestureAnalyzer',
            'API_ERROR': 'mathConcept'
        };
        
        return agentMap[issueType] || 'documentManager';
    }
    
    async enhanceDocumentUpdate(docName, content, lesson) {
        console.log(chalk.cyan(' Requesting document enhancement from Claude...'));
        
        try {
            const response = await axios.post(`${this.orchestratorUrl}/document/enhance`, {
                document: docName,
                currentContent: content,
                newLesson: lesson,
                agent: 'documentManager'
            }, {
                timeout: 20000
            });
            
            console.log(chalk.green('✅ Document enhancement received'));
            
            return {
                success: true,
                enhancedContent: response.data.content,
                metadata: response.data.metadata
            };
            
        } catch (error) {
            console.log(chalk.yellow('️ Document enhancement unavailable'));
            return null;
        }
    }
    
    async suggestPatternActions(pattern) {
        console.log(chalk.cyan(' Requesting pattern analysis from Claude...'));
        
        try {
            const response = await axios.post(`${this.orchestratorUrl}/pattern/analyze`, {
                pattern: pattern,
                agent: 'performanceOptimizer'
            }, {
                timeout: 15000
            });
            
            console.log(chalk.green('✅ Pattern analysis received'));
            
            return {
                success: true,
                preventiveActions: response.data.actions || [],
                automationSuggestions: response.data.automation || [],
                priority: response.data.priority || 'medium'
            };
            
        } catch (error) {
            console.log(chalk.yellow('️ Pattern analysis unavailable'));
            return null;
        }
    }
    
    updateStats(agent, responseTime) {
        this.integrationStats.requestsSent++;
        this.integrationStats.responsesReceived++;
        
        if (!this.integrationStats.agentsUsed[agent]) {
            this.integrationStats.agentsUsed[agent] = 0;
        }
        this.integrationStats.agentsUsed[agent]++;
        
        // Update average response time
        const total = this.integrationStats.averageResponseTime * (this.integrationStats.responsesReceived - 1);
        this.integrationStats.averageResponseTime = (total + responseTime) / this.integrationStats.responsesReceived;
    }
    
    getStats() {
        return this.integrationStats;
    }
}

export default OrchestratorIntegration;
