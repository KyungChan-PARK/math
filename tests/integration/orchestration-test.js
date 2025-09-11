/**
 * AI Agent Orchestration System - Integration Tests
 * Tests for 75+ agents and SPARC workflow
 */

import assert from 'assert';
import { describe, it, before, after } from 'node:test';
import MasterOrchestrator from '../../src/orchestration/master-orchestrator.js';
import AgentFactory from '../../src/ai-agents/agent-factory.js';
import SPARCWorkflow from '../../src/orchestration/sparc-workflow.js';

describe('AI Agent Orchestration System Tests', () => {
  let orchestrator;
  let factory;
  let sparc;
  
  before(() => {
    orchestrator = new MasterOrchestrator();
    factory = new AgentFactory();
    sparc = new SPARCWorkflow();
  });
  
  describe('Agent Factory Tests', () => {
    it('should have exactly 75 agents', () => {
      const count = factory.getAgentCount();
      assert.strictEqual(count, 75, 'Should have 75 agents');
    });
    
    it('should categorize agents correctly', () => {
      const categories = [
        { name: 'development', expected: 10 },
        { name: 'database', expected: 10 },
        { name: 'devops', expected: 15 },
        { name: 'security', expected: 10 },
        { name: 'ai_ml', expected: 10 },
        { name: 'education', expected: 10 },
        { name: 'qa_testing', expected: 5 },
        { name: 'management', expected: 5 }
      ];
      
      categories.forEach(cat => {
        const agents = factory.getAgentsByCategory(cat.name);
        assert.strictEqual(agents.length, cat.expected, 
          `${cat.name} should have ${cat.expected} agents`);
      });
    });
    
    it('should create and release agents', () => {
      const agent = factory.createAgent('@react-expert');
      assert.ok(agent, 'Agent should be created');
      assert.strictEqual(agent.id, '@react-expert');
      
      const released = factory.releaseAgent('@react-expert');
      assert.strictEqual(released, true, 'Agent should be released');
    });
    
    it('should select best agent for task', () => {
      const reactTask = factory.getBestAgentForTask('Create React component');
      assert.strictEqual(reactTask, '@react-expert');
      
      const dbTask = factory.getBestAgentForTask('Optimize database queries');
      assert.strictEqual(dbTask, '@database-architect');
      
      const securityTask = factory.getBestAgentForTask('Security audit');
      assert.strictEqual(securityTask, '@security-architect');
    });
  });
  
  describe('SPARC Workflow Tests', () => {
    it('should execute all SPARC steps', async () => {
      const result = await sparc.execute('Test project');
      
      assert.ok(result.specification, 'Should have specification');
      assert.ok(result.planning, 'Should have planning');
      assert.ok(result.architecture, 'Should have architecture');
      assert.ok(result.research, 'Should have research');
      assert.ok(result.coding, 'Should have coding');
    });
    
    it('should generate proper specifications', async () => {
      const spec = await sparc.specification('Math platform');
      
      assert.ok(spec.functionalRequirements.length > 0);
      assert.ok(spec.nonFunctionalRequirements.length > 0);
      assert.ok(spec.constraints);
      assert.ok(spec.successCriteria);
    });
    
    it('should create detailed plans', async () => {
      const spec = await sparc.specification('Test');
      const plan = await sparc.planning(spec);
      
      assert.strictEqual(plan.methodology, 'Agile/Scrum');
      assert.ok(plan.phases.length > 0);
      assert.ok(plan.milestones.length > 0);
    });
  });
  
  describe('Master Orchestrator Tests', () => {
    it('should execute projects successfully', async () => {
      const result = await orchestrator.executeProject('Test project');
      
      assert.strictEqual(result.summary.status, 'completed');
      assert.ok(result.summary.duration);
      assert.strictEqual(result.summary.stepsCompleted, 5);
    });
    
    it('should handle parallel tasks', async () => {
      const tasks = [
        { description: 'Task 1', type: 'development' },
        { description: 'Task 2', type: 'database' },
        { description: 'Task 3', type: 'security' }
      ];
      
      const results = await orchestrator.executeParallelTasks(tasks);
      
      assert.strictEqual(results.length, 3);
      results.forEach(result => {
        assert.strictEqual(result.status, 'completed');
        assert.ok(result.duration);
      });
    });
    
    it('should optimize agent allocation', () => {
      const tasks = [
        { description: 'React task 1', type: 'development' },
        { description: 'React task 2', type: 'development' },
        { description: 'React task 3', type: 'development' },
        { description: 'React task 4', type: 'development' },
        { description: 'DB task 1', type: 'database' }
      ];
      
      const allocation = orchestrator.optimizeAgentAllocation(tasks);
      
      assert.ok(allocation.size > 0);
      allocation.forEach((assignedTasks) => {
        assert.ok(assignedTasks.length <= 3, 'No agent should have more than 3 tasks');
      });
    });
    
    it('should track performance metrics', () => {
      const status = orchestrator.getStatus();
      
      assert.strictEqual(status.agents.total, 75);
      assert.ok(status.performance);
      assert.ok(status.uptime > 0);
    });
  });
  
  describe('Performance Tests', () => {
    it('should achieve expected performance improvement', async () => {
      const report = await orchestrator.generatePerformanceReport();
      
      assert.strictEqual(report.efficiency.theoretical, '12.5x');
      assert.ok(parseFloat(report.efficiency.actual) > 10, 
        'Should achieve at least 10x improvement');
    });
    
    it('should identify top performing agents', () => {
      const report = factory.getPerformanceReport();
      
      assert.strictEqual(report.totalAgents, 75);
      assert.ok(report.topPerformers.length === 10);
      assert.ok(report.topPerformers[0].performance >= 0.9);
    });
  });
});

export default {
  name: 'AI Agent Orchestration Tests',
  tests: 16
};