/**
 * Orchestration Engine for AE Claude Max
 * Hub-and-Spoke pattern with constraint-based validation
 */

import { EventEmitter } from 'events';
import neo4j from 'neo4j-driver';
import fs from 'fs/promises';
import path from 'path';

class OrchestrationEngine extends EventEmitter {
    constructor() {
        super();
        this.hub = {
            status: 'initializing',
            spokes: new Map(),
            constraints: [],
            workflows: new Map()
        };
        
        this.neo4jDriver = neo4j.driver(
            'neo4j://localhost:7687',
            neo4j.auth.basic('neo4j', 'aeclaudemax')
        );
    }
    
    async initialize() {
        console.log('[ORCH] Initializing Orchestration Engine...');
        
        // Try to load constraints from Neo4j, but don't fail if it's not available
        try {
            await this.loadConstraints();
        } catch (error) {
            console.warn('[ORCH] Neo4j not available, using default constraints:', error.message);
            // Add default constraints when Neo4j is not available
            this.hub.constraints = [
                { type: 'resource', name: 'memory', max: 16000 },
                { type: 'resource', name: 'cpu', max: 80 },
                { type: 'timing', name: 'response_time', max: 100 }
            ];
        }
        
        // Register default spokes
        await this.registerSpoke('nlp', { port: 8083, capability: 'natural-language' });
        await this.registerSpoke('gesture', { port: 8088, capability: 'gesture-recognition' });
        await this.registerSpoke('websocket', { port: 8085, capability: 'real-time-comm' });
        await this.registerSpoke('ml', { port: 8090, capability: 'machine-learning' });
        
        this.hub.status = 'ready';
        console.log('[ORCH] Engine ready with', this.hub.spokes.size, 'spokes');
        return true;
    }
    
    async registerSpoke(name, config) {
        this.hub.spokes.set(name, {
            name,
            config,
            status: 'registered',
            lastSeen: Date.now()
        });
        
        this.emit('spoke:registered', { name, config });
    }
    
    async loadConstraints() {
        const session = this.neo4jDriver.session();
        
        try {
            // Load document relationships as constraints
            const result = await session.run(`
                MATCH (d1:Document)-[r]->(d2:Document)
                RETURN d1.name as from, type(r) as constraint, d2.name as to
            `);
            
            this.hub.constraints = result.records.map(r => ({
                from: r.get('from'),
                constraint: r.get('constraint'),
                to: r.get('to'),
                type: 'dependency'
            }));
            
            // Add system constraints
            this.hub.constraints.push(
                { type: 'resource', name: 'memory', max: 16000 },
                { type: 'resource', name: 'cpu', max: 80 },
                { type: 'timing', name: 'response_time', max: 100 }
            );
            
            console.log('[ORCH] Loaded', this.hub.constraints.length, 'constraints');
            
        } finally {
            await session.close();
        }
    }
    
    async orchestrateWorkflow(workflow) {
        console.log('[ORCH] Starting workflow:', workflow.name);
        
        // Validate constraints
        const validation = await this.validateConstraints(workflow);
        if (!validation.valid) {
            console.error('[ORCH] Constraint violation:', validation.errors);
            return { success: false, errors: validation.errors };
        }
        
        // Create execution plan
        const plan = this.createExecutionPlan(workflow);
        
        // Execute steps
        const results = [];
        for (const step of plan.steps) {
            const result = await this.executeStep(step);
            results.push(result);
            
            if (!result.success) {
                console.error('[ORCH] Step failed:', step.name);
                break;
            }
        }
        
        return { success: true, results };
    }
    
    async validateConstraints(workflow) {
        const errors = [];
        
        // Check dependencies
        for (const step of workflow.steps) {
            const deps = this.hub.constraints.filter(c => 
                c.type === 'dependency' && c.from === step.component
            );
            
            for (const dep of deps) {
                const hasRequired = workflow.steps.some(s => s.component === dep.to);
                if (!hasRequired) {
                    errors.push(`Missing dependency: ${dep.to} required by ${step.component}`);
                }
            }
        }
        
        // Check resources
        const resourceConstraints = this.hub.constraints.filter(c => c.type === 'resource');
        for (const constraint of resourceConstraints) {
            const usage = workflow.steps.reduce((sum, step) => 
                sum + (step.resources?.[constraint.name] || 0), 0
            );
            
            if (usage > constraint.max) {
                errors.push(`Resource limit exceeded: ${constraint.name} (${usage}/${constraint.max})`);
            }
        }
        
        return { valid: errors.length === 0, errors };
    }
    
    createExecutionPlan(workflow) {
        // Topological sort based on dependencies
        const plan = { steps: [] };
        const visited = new Set();
        const temp = new Set();
        
        const visit = (step) => {
            if (temp.has(step.name)) {
                throw new Error(`Circular dependency detected: ${step.name}`);
            }
            if (visited.has(step.name)) return;
            
            temp.add(step.name);
            
            // Visit dependencies first
            const deps = workflow.steps.filter(s => 
                step.dependencies?.includes(s.name)
            );
            deps.forEach(visit);
            
            temp.delete(step.name);
            visited.add(step.name);
            plan.steps.push(step);
        };
        
        workflow.steps.forEach(visit);
        
        return plan;
    }
    
    async executeStep(step) {
        console.log('[ORCH] Executing:', step.name);
        
        const spoke = this.hub.spokes.get(step.component);
        if (!spoke) {
            return { success: false, error: `Spoke not found: ${step.component}` };
        }
        
        // Simulate execution (would call actual service)
        const start = Date.now();
        
        try {
            // Here would call the actual service
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const duration = Date.now() - start;
            
            return {
                success: true,
                step: step.name,
                component: step.component,
                duration
            };
            
        } catch (error) {
            return {
                success: false,
                step: step.name,
                error: error.message
            };
        }
    }
    
    async shutdown() {
        await this.neo4jDriver.close();
        this.hub.status = 'shutdown';
        console.log('[ORCH] Engine shutdown complete');
    }
}

// Test workflow
async function testOrchestration() {
    const engine = new OrchestrationEngine();
    await engine.initialize();
    
    const workflow = {
        name: 'gesture-to-animation',
        steps: [
            {
                name: 'capture-gesture',
                component: 'gesture',
                resources: { memory: 100, cpu: 10 }
            },
            {
                name: 'process-nlp',
                component: 'nlp',
                dependencies: ['capture-gesture'],
                resources: { memory: 200, cpu: 20 }
            },
            {
                name: 'send-websocket',
                component: 'websocket',
                dependencies: ['process-nlp'],
                resources: { memory: 50, cpu: 5 }
            }
        ]
    };
    
    const result = await engine.orchestrateWorkflow(workflow);
    console.log('\n[TEST] Result:', result);
    
    await engine.shutdown();
}

export default OrchestrationEngine;

// Export the class
export { OrchestrationEngine };

// Run test if main
const isMain = process.argv[1] && process.argv[1].endsWith('orchestration-engine.js');
if (isMain) {
    testOrchestration().catch(console.error);
}
