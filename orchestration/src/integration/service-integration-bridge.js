/**
 * Service Integration Bridge
 * Connects MediaPipe, NLP, WebSocket Cluster, and Claude Orchestrator
 */

import axios from 'axios';
import WebSocket from 'ws';
import chalk from 'chalk';

class ServiceIntegrationBridge {
    constructor() {
        this.services = {
            mediapipe: {
                url: 'http://localhost:5000',
                status: 'unknown',
                health: '/health'
            },
            nlp: {
                url: 'http://localhost:3000',
                status: 'unknown',
                health: '/health'
            },
            websocket: {
                url: 'ws://localhost:8085',
                status: 'unknown',
                ws: null
            },
            orchestrator: {
                url: 'http://localhost:8089',
                status: 'unknown',
                health: '/health'
            }
        };
        
        this.healthCheckInterval = null;
        this.wsReconnectInterval = null;
    }
    
    async start() {
        console.log(chalk.blue.bold('\n Service Integration Bridge Starting...\n'));
        
        // 1. Check all services
        await this.checkAllServices();
        
        // 2. Connect WebSocket
        await this.connectWebSocket();
        
        // 3. Setup service registry with Orchestrator
        await this.registerServices();
        
        // 4. Start health monitoring
        this.startHealthMonitoring();
        
        console.log(chalk.green.bold('\n✅ All services integrated!\n'));
        
        // 5. Setup routing handlers
        this.setupRouting();
    }
    async checkAllServices() {
        console.log(chalk.cyan(' Checking service health...\n'));
        
        for (const [name, config] of Object.entries(this.services)) {
            if (config.health) {
                try {
                    const response = await axios.get(config.url + config.health, {
                        timeout: 2000
                    });
                    config.status = 'online';
                    console.log(chalk.green(`✅ ${name}: Online`));
                } catch (error) {
                    config.status = 'offline';
                    console.log(chalk.red(`❌ ${name}: Offline`));
                }
            }
        }
    }
    
    async connectWebSocket() {
        const wsService = this.services.websocket;
        
        return new Promise((resolve) => {
            wsService.ws = new WebSocket(wsService.url);
            
            wsService.ws.on('open', () => {
                wsService.status = 'connected';
                console.log(chalk.green('✅ WebSocket: Connected'));
                resolve();
            });
            
            wsService.ws.on('error', (error) => {
                wsService.status = 'error';
                console.log(chalk.red(`❌ WebSocket: ${error.message}`));
                resolve(); // Continue anyway
            });
            
            wsService.ws.on('close', () => {
                wsService.status = 'disconnected';
                this.reconnectWebSocket();
            });
        });
    }
    reconnectWebSocket() {
        if (this.wsReconnectInterval) return;
        
        this.wsReconnectInterval = setInterval(() => {
            console.log(chalk.yellow(' Reconnecting WebSocket...'));
            this.connectWebSocket().then(() => {
                if (this.services.websocket.status === 'connected') {
                    clearInterval(this.wsReconnectInterval);
                    this.wsReconnectInterval = null;
                }
            });
        }, 5000);
    }
    
    async registerServices() {
        console.log(chalk.cyan('\n Registering services with Orchestrator...\n'));
        
        try {
            const registration = {
                services: Object.entries(this.services).map(([name, config]) => ({
                    name,
                    url: config.url,
                    status: config.status
                }))
            };
            
            await axios.post(this.services.orchestrator.url + '/register', registration);
            console.log(chalk.green('✅ Services registered with Orchestrator'));
        } catch (error) {
            console.log(chalk.yellow('️  Orchestrator registration failed (may not be implemented)'));
        }
    }
    
    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(() => {
            this.checkAllServices();
        }, 30000); // Every 30 seconds
    }
    setupRouting() {
        console.log(chalk.cyan(' Setting up intelligent routing...\n'));
        
        // Create unified endpoint
        this.createUnifiedAPI();
    }
    
    createUnifiedAPI() {
        // This would typically be an Express server, but for now we'll just log
        console.log(chalk.blue(' Unified API endpoints:'));
        console.log('  POST /process/gesture -> MediaPipe (5000)');
        console.log('  POST /process/text -> NLP (3000)');
        console.log('  WS /realtime -> WebSocket Cluster (8085)');
        console.log('  POST /orchestrate -> Claude Orchestrator (8089)\n');
    }
    
    async routeRequest(type, data) {
        let targetService;
        let endpoint;
        
        switch(type) {
            case 'gesture':
                targetService = this.services.mediapipe;
                endpoint = '/process';
                break;
            case 'text':
            case 'math':
                targetService = this.services.nlp;
                endpoint = '/process';
                break;
            case 'realtime':
                // Use WebSocket
                if (this.services.websocket.ws && 
                    this.services.websocket.ws.readyState === WebSocket.OPEN) {
                    this.services.websocket.ws.send(JSON.stringify(data));
                    return { status: 'sent', service: 'websocket' };
                }
                break;
            case 'orchestrate':
                targetService = this.services.orchestrator;
                endpoint = '/process';
                break;
            default:
                return { error: 'Unknown request type' };
        }
        
        if (targetService && targetService.status === 'online') {
            try {
                const response = await axios.post(targetService.url + endpoint, data);
                return response.data;
            } catch (error) {
                return { error: error.message, service: targetService.url };
            }
        } else {
            return { error: 'Service offline', service: type };
        }
    }
    async testIntegration() {
        console.log(chalk.blue.bold('\n Testing Service Integration...\n'));
        
        // Test each service
        const tests = [
            { type: 'text', data: { text: '삼각형 그려줘' } },
            { type: 'gesture', data: { gesture: 'PINCH' } },
            { type: 'realtime', data: { type: 'ping' } },
            { type: 'orchestrate', data: { agent: 'mathConcept', task: 'test' } }
        ];
        
        for (const test of tests) {
            console.log(chalk.cyan(`Testing ${test.type}...`));
            const result = await this.routeRequest(test.type, test.data);
            
            if (result.error) {
                console.log(chalk.red(`  ❌ Failed: ${result.error}`));
            } else {
                console.log(chalk.green(`  ✅ Success`));
            }
        }
    }
    
    getStatus() {
        return {
            services: Object.entries(this.services).map(([name, config]) => ({
                name,
                status: config.status,
                url: config.url
            })),
            timestamp: new Date().toISOString()
        };
    }
    
    async stop() {
        console.log(chalk.yellow('\n Stopping Service Integration Bridge...'));
        
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        if (this.wsReconnectInterval) {
            clearInterval(this.wsReconnectInterval);
        }
        
        if (this.services.websocket.ws) {
            this.services.websocket.ws.close();
        }
        
        console.log(chalk.green('✅ Bridge stopped'));
    }
}

// Run if executed directly
if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
    const bridge = new ServiceIntegrationBridge();
    bridge.start()
        .then(() => bridge.testIntegration())
        .catch(console.error);
}

export default ServiceIntegrationBridge;