// 모든 서버를 Claude Orchestrator와 통합하는 스크립트
// C:\palantir\math\orchestration\integrate-all-servers.js

import { WebSocket } from 'ws';
import axios from 'axios';
import { EventSource } from 'eventsource';

class ServerIntegrator {
    constructor() {
        this.servers = {
            mediapipe: { url: 'http://localhost:5000', status: 'disconnected' },
            nlp: { url: 'http://localhost:3000', status: 'disconnected' },
            websocket: { url: 'ws://localhost:8085', status: 'disconnected' },
            orchestrator: { url: 'ws://localhost:8090', status: 'disconnected' }
        };
        
        this.orchestratorWs = null;
        this.messageQueue = [];
    }
    
    async connectToOrchestrator() {
        return new Promise((resolve) => {
            this.orchestratorWs = new WebSocket('ws://localhost:8090');
            
            this.orchestratorWs.on('open', () => {
                console.log('Connected to Claude Orchestrator');
                this.servers.orchestrator.status = 'connected';
                resolve();
            });
            
            this.orchestratorWs.on('message', (data) => {
                this.handleOrchestratorMessage(JSON.parse(data));
            });
            
            this.orchestratorWs.on('error', (error) => {
                console.error('Orchestrator connection error:', error.message);
            });
        });
    }
    
    async integrateMediaPipe() {
        try {
            const health = await axios.get('http://localhost:5000/health');
            if (health.data.status === 'running') {
                this.servers.mediapipe.status = 'connected';
                console.log('MediaPipe integrated');
            }
        } catch (error) {
            console.error('MediaPipe integration failed - service not running');
        }
    }
    
    async integrateNLP() {
        try {
            const health = await axios.get('http://localhost:3000/health');
            if (health.data.status === 'running') {
                this.servers.nlp.status = 'connected';
                console.log('NLP integrated');
            }
        } catch (error) {
            console.error('NLP integration failed - service not running');
        }
    }
    
    async checkOrchestratorHealth() {
        try {
            const health = await axios.get('http://localhost:8089/health');
            console.log('Orchestrator health:', health.data);
            return health.data;
        } catch (error) {
            console.error('Orchestrator health check failed:', error.message);
            return null;
        }
    }
    
    async listAgents() {
        try {
            const agents = await axios.get('http://localhost:8089/agents/list');
            console.log('\nAvailable Claude Agents:');
            agents.data.forEach(agent => {
                console.log(`  - ${agent.name}: ${agent.role}`);
            });
            return agents.data;
        } catch (error) {
            console.error('Failed to list agents:', error.message);
            return [];
        }
    }
    
    async testNLPProcessing(command) {
        try {
            console.log(`\nTesting NLP: "${command}"`);
            const response = await axios.post('http://localhost:8089/nlp/process', {
                command: command
            });
            console.log('NLP Result:', response.data);
            return response.data;
        } catch (error) {
            console.error('NLP test failed:', error.message);
            return null;
        }
    }
    
    async testOptimization() {
        try {
            console.log('\nTesting System Optimization...');
            const response = await axios.post('http://localhost:8089/system/optimize', {});
            console.log('Optimization Result:', response.data);
            return response.data;
        } catch (error) {
            console.error('Optimization test failed:', error.message);
            return null;
        }
    }
    
    handleOrchestratorMessage(message) {
        console.log('From Orchestrator:', message.type);
    }
    
    async runIntegrationTest() {
        console.log('\n=== Running Integration Test ===\n');
        
        // Check Orchestrator health
        const health = await this.checkOrchestratorHealth();
        if (!health) {
            console.log('Orchestrator not responding. Please start it first.');
            return;
        }
        
        // List available agents
        await this.listAgents();
        
        // Test NLP processing
        await this.testNLPProcessing("draw a triangle");
        await this.testNLPProcessing("삼각형 그려줘");
        
        // Test system optimization
        await this.testOptimization();
        
        // Check service integrations
        await this.integrateMediaPipe();
        await this.integrateNLP();
        
        console.log('\n=== Integration Test Complete ===\n');
        console.log('System Status:');
        Object.entries(this.servers).forEach(([name, server]) => {
            const icon = server.status === 'connected' ? '[OK]' : '[--]';
            console.log(`  ${icon} ${name}: ${server.status}`);
        });
    }
}

// 실행
async function main() {
    console.log('Starting Server Integration...\n');
    
    const integrator = new ServerIntegrator();
    
    try {
        // Connect to Orchestrator
        await integrator.connectToOrchestrator();
        
        // Run integration test
        await integrator.runIntegrationTest();
        
    } catch (error) {
        console.error('Integration failed:', error.message);
    }
    
    console.log('\nIntegration script completed.');
    process.exit(0);
}

main().catch(console.error);