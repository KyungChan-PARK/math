// Document Quality Analyzer for Math Education System
// Analyzes all project documents for meaningful content and optimization

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocumentAnalyzer {
  constructor() {
    this.projectRoot = 'C:\\palantir\\math';
    this.issues = [];
    this.stats = {
      totalDocs: 0,
      optimizedDocs: 0,
      issuesFound: 0,
      redundantContent: 0,
      missingContent: 0
    };
  }

  // Check if sentence is meaningful (not boilerplate or redundant)
  isMeaningfulSentence(sentence) {
    const boilerplate = [
      'TODO:', 'FIXME:', 'NOTE:', 'HACK:', 'XXX:',
      'This is a', 'This file', 'Created by', 'Generated',
      'Lorem ipsum', 'test test', '...'
    ];
    
    // Skip empty or too short sentences
    if (!sentence || sentence.trim().length < 10) return false;
    
    // Check for boilerplate
    for (const pattern of boilerplate) {
      if (sentence.includes(pattern)) return false;
    }
    
    // Check for repetitive patterns
    const words = sentence.split(' ');
    const uniqueWords = new Set(words);
    if (uniqueWords.size < words.length * 0.5) return false;
    
    return true;
  }

  // Analyze document content quality
  async analyzeDocument(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
      
      const analysis = {
        file: path.basename(filePath),
        path: filePath,
        lines: lines.length,
        sentences: sentences.length,
        meaningfulSentences: 0,
        redundantLines: 0,
        emptyLines: 0,
        issues: [],
        suggestions: []
      };

      // Analyze sentences
      sentences.forEach(sentence => {
        if (this.isMeaningfulSentence(sentence)) {
          analysis.meaningfulSentences++;
        } else {
          analysis.issues.push(`Low value content: "${sentence.substring(0, 50)}..."`);
        }
      });

      // Check for empty/redundant lines
      lines.forEach((line, index) => {
        if (!line.trim()) {
          analysis.emptyLines++;
        } else if (line.trim().startsWith('//') && line.includes('TODO')) {
          analysis.redundantLines++;
          analysis.issues.push(`Unresolved TODO at line ${index + 1}`);
        }
      });

      // Calculate quality score
      analysis.qualityScore = (analysis.meaningfulSentences / Math.max(sentences.length, 1)) * 100;
      
      // Add suggestions based on issues
      if (analysis.qualityScore < 70) {
        analysis.suggestions.push('Document needs content optimization');
      }
      if (analysis.emptyLines > lines.length * 0.3) {
        analysis.suggestions.push('Remove excessive empty lines');
      }
      if (analysis.redundantLines > 0) {
        analysis.suggestions.push('Address TODO items or remove them');
      }

      return analysis;
    } catch (error) {
      return {
        file: path.basename(filePath),
        error: error.message
      };
    }
  }

  // Check ontology integration
  async checkOntologyIntegration(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const ontologyPatterns = [
      'entity', 'relation', 'concept', 'knowledge',
      'graph', 'semantic', 'taxonomy', 'schema'
    ];
    
    let ontologyScore = 0;
    for (const pattern of ontologyPatterns) {
      if (content.toLowerCase().includes(pattern)) {
        ontologyScore++;
      }
    }
    
    return {
      hasOntologyIntegration: ontologyScore > 2,
      ontologyScore,
      suggestion: ontologyScore < 3 ? 'Add ontology concepts for better knowledge management' : null
    };
  }

  // Check Claude orchestration features
  async checkClaudeOrchestration(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const orchestrationPatterns = [
      'claude', 'anthropic', 'orchestration', 'agent',
      'workflow', 'automation', 'pipeline', 'integration'
    ];
    
    let orchestrationScore = 0;
    for (const pattern of orchestrationPatterns) {
      if (content.toLowerCase().includes(pattern)) {
        orchestrationScore++;
      }
    }
    
    return {
      hasOrchestration: orchestrationScore > 2,
      orchestrationScore,
      suggestion: orchestrationScore < 3 ? 'Enhance Claude orchestration documentation' : null
    };
  }

  // Main analysis function
  async analyzeAllDocuments() {
    console.log('Starting comprehensive document analysis...\n');
    
    // Get all markdown files
    const mdFiles = [
      'README.md',
      'PROBLEM_SOLVING_GUIDE.md',
      'MASTER_REFERENCE.md',
      'CLAUDE_OPUS_4_1_ADVANCED_FEATURES.md',
      'IMPLEMENTATION_ROADMAP.md',
      'API_DOCUMENTATION.md',
      'AI_SESSION_CONTEXT.md',
      'CLAUDE_INTEGRATION_STATUS.md',
      'MCP_SERVER_GUIDE.md',
      'QUICK_START.md'
    ];

    const results = [];
    
    for (const file of mdFiles) {
      const filePath = path.join(this.projectRoot, file);
      console.log(`Analyzing ${file}...`);
      
      const docAnalysis = await this.analyzeDocument(filePath);
      const ontologyCheck = await this.checkOntologyIntegration(filePath);
      const orchestrationCheck = await this.checkClaudeOrchestration(filePath);
      
      results.push({
        ...docAnalysis,
        ontology: ontologyCheck,
        orchestration: orchestrationCheck
      });
      
      this.stats.totalDocs++;
      if (docAnalysis.qualityScore > 70) this.stats.optimizedDocs++;
      this.stats.issuesFound += docAnalysis.issues?.length || 0;
    }
    
    return {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      documents: results,
      recommendations: this.generateRecommendations(results)
    };
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    // Check overall quality
    const avgQuality = results.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / results.length;
    if (avgQuality < 75) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Improve overall document quality',
        details: `Average quality score is ${avgQuality.toFixed(1)}%. Target is 75%+`
      });
    }
    
    // Check ontology integration
    const ontologyDocs = results.filter(r => r.ontology?.hasOntologyIntegration).length;
    if (ontologyDocs < results.length * 0.5) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Enhance ontology integration',
        details: `Only ${ontologyDocs}/${results.length} documents have proper ontology concepts`
      });
    }
    
    // Check orchestration
    const orchestrationDocs = results.filter(r => r.orchestration?.hasOrchestration).length;
    if (orchestrationDocs < results.length * 0.3) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Improve Claude orchestration documentation',
        details: `Only ${orchestrationDocs}/${results.length} documents reference orchestration`
      });
    }
    
    return recommendations;
  }

  async saveReport(report) {
    const reportPath = path.join(this.projectRoot, 'DOCUMENT_OPTIMIZATION_REPORT.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Report saved to ${reportPath}`);
    return reportPath;
  }
}

// Execute analysis
async function main() {
  const analyzer = new DocumentAnalyzer();
  const report = await analyzer.analyzeAllDocuments();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log(' DOCUMENT ANALYSIS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Documents: ${report.stats.totalDocs}`);
  console.log(`Optimized Documents: ${report.stats.optimizedDocs}`);
  console.log(`Issues Found: ${report.stats.issuesFound}`);
  
  console.log('\n RECOMMENDATIONS:');
  report.recommendations.forEach(rec => {
    console.log(`\n[${rec.priority}] ${rec.action}`);
    console.log(`  ${rec.details}`);
  });
  
  await analyzer.saveReport(report);
}

// Run if executed directly
main().catch(console.error);

export default DocumentAnalyzer;