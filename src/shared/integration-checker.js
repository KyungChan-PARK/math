// Ontology and Orchestration Integration Checker
// Verifies real-time interaction between documents and systems

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class IntegrationChecker {
  constructor() {
    this.projectRoot = 'C:\\palantir\\math';
    this.ontologyFiles = [];
    this.orchestrationFiles = [];
    this.issues = [];
  }

  async checkOntologySystem() {
    console.log('\n Checking Ontology System Integration...');
    
    // Check if ontology system exists
    const ontologyPaths = [
      'ontology/ontology.json',
      'ontology-system/core/ontology-manager.js',
      'backend/services/OntologyService.js'
    ];
    
    const results = {
      exists: [],
      missing: [],
      integration: []
    };
    
    for (const relPath of ontologyPaths) {
      const fullPath = path.join(this.projectRoot, relPath);
      try {
        await fs.access(fullPath);
        results.exists.push(relPath);
        
        // Check if file has proper integration
        const content = await fs.readFile(fullPath, 'utf-8');
        if (content.includes('export') || content.includes('module.exports')) {
          results.integration.push(`✅ ${relPath} is exportable`);
        } else {
          results.integration.push(`️ ${relPath} may not be properly integrated`);
        }
      } catch {
        results.missing.push(relPath);
      }
    }
    
    return results;
  }

  async checkOrchestrationSystem() {
    console.log('\n Checking Claude Orchestration System...');
    
    const orchestrationPaths = [
      'orchestration/claude-orchestrator.js',
      'orchestration/services/multi-claude-service.js',
      'backend/services/ClaudeService.js'
    ];
    
    const results = {
      exists: [],
      missing: [],
      activeEndpoints: []
    };
    
    for (const relPath of orchestrationPaths) {
      const fullPath = path.join(this.projectRoot, relPath);
      try {
        await fs.access(fullPath);
        results.exists.push(relPath);
        
        // Check for active endpoints
        const content = await fs.readFile(fullPath, 'utf-8');
        const endpoints = content.match(/app\.(get|post|put|delete)\(['"]([^'"]+)/g) || [];
        results.activeEndpoints.push(...endpoints.map(e => e.replace(/app\.\w+\(['"]/, '')));
      } catch {
        results.missing.push(relPath);
      }
    }
    
    return results;
  }

  async checkDocumentInterconnection() {
    console.log('\n Checking Document Interconnections...');
    
    const docs = [
      'README.md',
      'PROBLEM_SOLVING_GUIDE.md',
      'MASTER_REFERENCE.md',
      'CLAUDE_OPUS_4_1_ADVANCED_FEATURES.md'
    ];
    
    const connections = {};
    
    for (const doc of docs) {
      const fullPath = path.join(this.projectRoot, doc);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      connections[doc] = {
        references: [],
        backlinks: []
      };
      
      // Check for references to other docs
      for (const otherDoc of docs) {
        if (doc !== otherDoc && content.includes(otherDoc)) {
          connections[doc].references.push(otherDoc);
        }
      }
      
      // Check for imports/requires
      const imports = content.match(/import .* from ['"]([^'"]+)/g) || [];
      const requires = content.match(/require\(['"]([^'"]+)/g) || [];
      connections[doc].codeReferences = [...imports, ...requires];
    }
    
    // Calculate backlinks
    for (const doc in connections) {
      for (const ref of connections[doc].references) {
        if (connections[ref]) {
          connections[ref].backlinks.push(doc);
        }
      }
    }
    
    return connections;
  }

  async testRealTimeInteraction() {
    console.log('\n Testing Real-Time Interaction Capabilities...');
    
    const tests = {
      fileWatching: false,
      apiEndpoints: false,
      memorySystem: false,
      orchestration: false
    };
    
    // Check if file watching is set up
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8')
      );
      tests.fileWatching = packageJson.scripts?.watch || packageJson.scripts?.dev ? true : false;
    } catch {}
    
    // Check API endpoints
    try {
      const apiDoc = await fs.readFile(
        path.join(this.projectRoot, 'API_DOCUMENTATION.md'), 
        'utf-8'
      );
      tests.apiEndpoints = apiDoc.includes('/api/') || apiDoc.includes('endpoint');
    } catch {}
    
    // Check memory system
    try {
      await fs.access(path.join(this.projectRoot, 'backend/services/MemoryService.js'));
      tests.memorySystem = true;
    } catch {}
    
    // Check orchestration
    try {
      await fs.access(path.join(this.projectRoot, 'orchestration'));
      tests.orchestration = true;
    } catch {}
    
    return tests;
  }

  async generateOptimizationPlan() {
    const ontology = await this.checkOntologySystem();
    const orchestration = await this.checkOrchestrationSystem();
    const connections = await this.checkDocumentInterconnection();
    const realtime = await this.testRealTimeInteraction();
    
    const plan = {
      timestamp: new Date().toISOString(),
      status: {
        ontology: ontology.exists.length > 0 ? 'PARTIAL' : 'MISSING',
        orchestration: orchestration.exists.length > 0 ? 'PARTIAL' : 'MISSING',
        documentLinks: Object.values(connections).some(c => c.references.length > 0) ? 'GOOD' : 'POOR',
        realtime: Object.values(realtime).filter(v => v).length >= 2 ? 'ACTIVE' : 'INACTIVE'
      },
      actions: []
    };
    
    // Generate action items
    if (ontology.missing.length > 0) {
      plan.actions.push({
        priority: 'HIGH',
        task: 'Create missing ontology files',
        files: ontology.missing
      });
    }
    
    if (orchestration.missing.length > 0) {
      plan.actions.push({
        priority: 'HIGH',
        task: 'Set up Claude orchestration',
        files: orchestration.missing
      });
    }
    
    if (!realtime.fileWatching) {
      plan.actions.push({
        priority: 'MEDIUM',
        task: 'Add file watching for real-time updates',
        command: 'Add "watch" script to package.json'
      });
    }
    
    if (!realtime.memorySystem) {
      plan.actions.push({
        priority: 'HIGH',
        task: 'Implement memory system',
        file: 'backend/services/MemoryService.js'
      });
    }
    
    // Check for isolated documents
    for (const [doc, conn] of Object.entries(connections)) {
      if (conn.references.length === 0 && conn.backlinks.length === 0) {
        plan.actions.push({
          priority: 'LOW',
          task: `Connect isolated document: ${doc}`,
          suggestion: 'Add cross-references to other documentation'
        });
      }
    }
    
    return plan;
  }

  async saveReport(report) {
    const reportPath = path.join(this.projectRoot, 'INTEGRATION_STATUS_REPORT.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Integration report saved to ${reportPath}`);
    return reportPath;
  }
}

// Main execution
async function main() {
  const checker = new IntegrationChecker();
  
  console.log('=' .repeat(60));
  console.log(' ONTOLOGY & ORCHESTRATION INTEGRATION CHECK');
  console.log('=' .repeat(60));
  
  const plan = await checker.generateOptimizationPlan();
  
  console.log('\n INTEGRATION STATUS:');
  console.log(`  Ontology: ${plan.status.ontology}`);
  console.log(`  Orchestration: ${plan.status.orchestration}`);
  console.log(`  Document Links: ${plan.status.documentLinks}`);
  console.log(`  Real-time: ${plan.status.realtime}`);
  
  console.log('\n ACTION PLAN:');
  plan.actions.forEach((action, i) => {
    console.log(`\n${i + 1}. [${action.priority}] ${action.task}`);
    if (action.files) console.log(`   Files: ${action.files.join(', ')}`);
    if (action.command) console.log(`   Command: ${action.command}`);
    if (action.suggestion) console.log(`   Suggestion: ${action.suggestion}`);
  });
  
  await checker.saveReport(plan);
}

main().catch(console.error);

export default IntegrationChecker;