// Document Optimization Service
// Automatically optimizes and maintains project documentation

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocumentOptimizer {
  constructor() {
    this.projectRoot = 'C:\\palantir\\math';
    this.optimizations = [];
  }

  // Remove redundant content and optimize documents
  async optimizeDocument(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    let optimized = content;
    let changeCount = 0;
    
    // Remove excessive empty lines (more than 2 consecutive)
    optimized = optimized.replace(/\n{4,}/g, '\n\n\n');
    if (optimized !== content) changeCount++;
    
    // Remove trailing whitespace
    optimized = optimized.split('\n').map(line => line.trimEnd()).join('\n');
    
    // Fix TODO comments - convert to actionable items
    optimized = optimized.replace(
      /\/\/\s*TODO:\s*(.+)/g,
      (match, p1) => `<!-- ACTION REQUIRED: ${p1} -->`
    );
    
    // Add proper headers if missing
    if (!optimized.startsWith('#')) {
      const fileName = path.basename(filePath, '.md');
      optimized = `# ${fileName.replace(/_/g, ' ').toUpperCase()}\n\n${optimized}`;
      changeCount++;
    }
    
    // Add ontology references where appropriate
    const ontologyKeywords = ['entity', 'concept', 'relation', 'knowledge', 'graph'];
    const hasOntology = ontologyKeywords.some(kw => optimized.toLowerCase().includes(kw));
    
    if (!hasOntology && !filePath.includes('node_modules')) {
      optimized += `\n\n## Ontology Integration\n\nThis document is part of the Math Education System knowledge graph.\nRelated entities and concepts are managed through the OntologyService.\n`;
      changeCount++;
    }
    
    // Add Claude orchestration references
    if (!optimized.includes('orchestration') && !filePath.includes('node_modules')) {
      optimized += `\n## Claude Orchestration\n\nAI agents can process this document through the ClaudeService orchestration system.\n`;
      changeCount++;
    }
    
    return {
      original: content,
      optimized,
      changes: changeCount,
      saved: content.length - optimized.length
    };
  }

  // Add cross-references between documents
  async addCrossReferences() {
    const docs = [
      'README.md',
      'PROBLEM_SOLVING_GUIDE.md',
      'MASTER_REFERENCE.md',
      'CLAUDE_OPUS_4_1_ADVANCED_FEATURES.md',
      'API_DOCUMENTATION.md'
    ];
    
    const references = {
      'README.md': [
        '- [Problem Solving Guide](./PROBLEM_SOLVING_GUIDE.md)',
        '- [API Documentation](./API_DOCUMENTATION.md)',
        '- [Master Reference](./MASTER_REFERENCE.md)'
      ],
      'PROBLEM_SOLVING_GUIDE.md': [
        '- [Project Overview](./README.md)',
        '- [Claude Features](./CLAUDE_OPUS_4_1_ADVANCED_FEATURES.md)',
        '- [API Reference](./API_DOCUMENTATION.md)'
      ],
      'MASTER_REFERENCE.md': [
        '- [Getting Started](./README.md)',
        '- [Problem Solving](./PROBLEM_SOLVING_GUIDE.md)',
        '- [Claude Integration](./CLAUDE_OPUS_4_1_ADVANCED_FEATURES.md)'
      ]
    };
    
    for (const [doc, refs] of Object.entries(references)) {
      const filePath = path.join(this.projectRoot, doc);
      let content = await fs.readFile(filePath, 'utf-8');
      
      // Check if references section exists
      if (!content.includes('## Related Documentation')) {
        content += '\n\n## Related Documentation\n\n' + refs.join('\n') + '\n';
        await fs.writeFile(filePath, content);
        this.optimizations.push(`Added cross-references to ${doc}`);
      }
    }
  }

  // Create unified index
  async createUnifiedIndex() {
    const indexContent = `#  Math Education System - Documentation Index

## ️ Architecture & Setup
- [README](./README.md) - Project overview and quick start
- [Quick Start Guide](./QUICK_START.md) - Installation and setup
- [Master Reference](./MASTER_REFERENCE.md) - Complete system reference

##  AI & Orchestration
- [Claude Opus 4.1 Features](./CLAUDE_OPUS_4_1_ADVANCED_FEATURES.md) - AI capabilities
- [Claude Integration Status](./CLAUDE_INTEGRATION_STATUS.md) - Integration progress
- [MCP Server Guide](./MCP_SERVER_GUIDE.md) - Server configuration

##  Development
- [Problem Solving Guide](./PROBLEM_SOLVING_GUIDE.md) - Debugging and solutions
- [API Documentation](./API_DOCUMENTATION.md) - API reference
- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md) - Development plan

##  System Status
- [Integration Status Report](./INTEGRATION_STATUS_REPORT.json) - System integration
- [Document Optimization Report](./DOCUMENT_OPTIMIZATION_REPORT.json) - Documentation quality
- [AI Session Context](./AI_SESSION_CONTEXT.md) - Current session state

##  Real-time Features
- **Ontology Service**: Knowledge graph management at \`backend/services/OntologyService.js\`
- **Claude Service**: AI orchestration at \`backend/services/ClaudeService.js\`
- **Session Manager**: Continuity management at \`frontend/session-manager.js\`

##  Active Endpoints
- Frontend: http://localhost:3000
- Backend: http://localhost:8086
- Neo4j: bolt://localhost:7687
- ChromaDB: http://localhost:8000

##  Quick Actions
\`\`\`bash
# Start the system
npm run start

# Run tests
npm test

# Check integration status
node integration-checker.js

# Analyze documents
node document-analyzer.js

# Restore session
node frontend/session-manager.js restore
\`\`\`

---
*Last updated: ${new Date().toISOString()}*
*Auto-generated by Document Optimization Service*
`;
    
    const indexPath = path.join(this.projectRoot, 'DOCUMENTATION_INDEX.md');
    await fs.writeFile(indexPath, indexContent);
    console.log('✅ Created unified documentation index');
    return indexPath;
  }

  // Main optimization process
  async optimizeAll() {
    console.log(' Starting document optimization...\n');
    
    // Optimize main documents
    const mainDocs = [
      'README.md',
      'PROBLEM_SOLVING_GUIDE.md',
      'MASTER_REFERENCE.md',
      'API_DOCUMENTATION.md',
      'QUICK_START.md'
    ];
    
    for (const doc of mainDocs) {
      const filePath = path.join(this.projectRoot, doc);
      try {
        const result = await this.optimizeDocument(filePath);
        
        if (result.changes > 0) {
          await fs.writeFile(filePath, result.optimized);
          console.log(`✅ Optimized ${doc}: ${result.changes} improvements`);
          this.optimizations.push({
            file: doc,
            changes: result.changes,
            saved: result.saved
          });
        } else {
          console.log(`✓ ${doc} is already optimized`);
        }
      } catch (error) {
        console.error(`❌ Failed to optimize ${doc}:`, error.message);
      }
    }
    
    // Add cross-references
    await this.addCrossReferences();
    
    // Create unified index
    await this.createUnifiedIndex();
    
    return this.optimizations;
  }

  // Generate optimization report
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      optimizations: this.optimizations,
      summary: {
        filesOptimized: this.optimizations.filter(o => o.changes > 0).length,
        totalChanges: this.optimizations.reduce((sum, o) => sum + (o.changes || 0), 0),
        byteSaved: this.optimizations.reduce((sum, o) => sum + (o.saved || 0), 0)
      },
      recommendations: [
        'Regular optimization should be scheduled weekly',
        'Consider adding automated tests for documentation',
        'Implement real-time documentation updates'
      ]
    };
    
    const reportPath = path.join(this.projectRoot, 'OPTIMIZATION_REPORT.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }
}

// Execute optimization
async function main() {
  const optimizer = new DocumentOptimizer();
  
  console.log('=' .repeat(60));
  console.log(' DOCUMENT OPTIMIZATION SERVICE');
  console.log('=' .repeat(60));
  
  const results = await optimizer.optimizeAll();
  const report = await optimizer.generateReport();
  
  console.log('\n OPTIMIZATION SUMMARY:');
  console.log(`  Files Optimized: ${report.summary.filesOptimized}`);
  console.log(`  Total Changes: ${report.summary.totalChanges}`);
  console.log(`  Bytes Saved: ${report.summary.byteSaved}`);
  
  console.log('\n✅ Optimization complete!');
  console.log(' Reports saved to:');
  console.log('  - OPTIMIZATION_REPORT.json');
  console.log('  - DOCUMENTATION_INDEX.md');
}

main().catch(console.error);

export default DocumentOptimizer;