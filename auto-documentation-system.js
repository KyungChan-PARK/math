/**
 * Auto Documentation Improvement System
 * Automatically improves all documentation after each task completion
 * Implements self-learning and continuous improvement
 */

import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

class AutoDocumentationSystem extends EventEmitter {
  constructor() {
    super();
    this.projectRoot = 'C:\\palantir\\math';
    this.documentationFiles = [
      'PROJECT_CONTEXT.md',
      'PROJECT_STATUS_20250908.md',
      'UNIFIED_DOCUMENTATION.md',
      'API_REFERENCE.md',
      'README.md',
      'DOCUMENTATION_INDEX.md'
    ];
    this.metricsFile = 'DOCUMENTATION_METRICS.json';
    this.improvementLog = [];
    this.patterns = new Map();
    this.lastUpdate = Date.now();
    
    this.initialize();
  }

  async initialize() {
    console.log('📚 Auto Documentation System Initializing...');
    
    // Load existing metrics
    await this.loadMetrics();
    
    // Start monitoring
    this.startMonitoring();
    
    console.log('✅ Auto Documentation System Ready');
    console.log(`   Monitoring ${this.documentationFiles.length} documentation files`);
  }

  /**
   * Trigger documentation improvement after task completion
   */
  async onTaskComplete(taskInfo) {
    console.log('\n📝 Task Complete - Triggering Documentation Update');
    console.log(`   Task: ${taskInfo.description}`);
    console.log(`   Type: ${taskInfo.type}`);
    console.log(`   Status: ${taskInfo.status}`);
    
    const improvements = await this.improveDocumentation(taskInfo);
    
    if (improvements.length > 0) {
      console.log(`✅ Applied ${improvements.length} documentation improvements`);
      await this.saveMetrics(improvements);
      this.emit('documentation-improved', improvements);
    }
    
    return improvements;
  }

  /**
   * Improve documentation based on task completion
   */
  async improveDocumentation(taskInfo) {
    const improvements = [];
    
    // 1. Update PROJECT_STATUS
    const statusUpdate = await this.updateProjectStatus(taskInfo);
    if (statusUpdate) improvements.push(statusUpdate);
    
    // 2. Update API documentation if needed
    if (taskInfo.type === 'api' || taskInfo.type === 'endpoint') {
      const apiUpdate = await this.updateAPIDocumentation(taskInfo);
      if (apiUpdate) improvements.push(apiUpdate);
    }
    
    // 3. Update unified documentation
    const unifiedUpdate = await this.updateUnifiedDocumentation(taskInfo);
    if (unifiedUpdate) improvements.push(unifiedUpdate);
    
    // 4. Learn patterns for future improvements
    await this.learnPattern(taskInfo, improvements);
    
    // 5. Update metrics
    await this.updateMetrics(improvements);
    
    return improvements;
  }

  /**
   * Update project status documentation
   */
  async updateProjectStatus(taskInfo) {
    const statusFile = path.join(this.projectRoot, 'docs', 'PROJECT_STATUS_20250908.md');
    
    try {
      let content = await fs.readFile(statusFile, 'utf8');
      
      // Add new achievement
      const achievementSection = `
### Latest Achievement - ${new Date().toISOString()}
- **Task**: ${taskInfo.description}
- **Status**: ${taskInfo.status}
- **Impact**: ${taskInfo.impact || 'System improvement'}
- **Performance**: ${taskInfo.performance || 'Optimal'}
`;
      
      // Insert after achievements header
      const insertPoint = content.indexOf('## 🎯 Today\'s Achievements');
      if (insertPoint !== -1) {
        const before = content.substring(0, insertPoint + 27);
        const after = content.substring(insertPoint + 27);
        content = before + achievementSection + after;
        
        await fs.writeFile(statusFile, content);
        
        return {
          file: 'PROJECT_STATUS_20250908.md',
          type: 'status_update',
          changes: 'Added latest achievement',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Error updating project status:', error.message);
    }
    
    return null;
  }

  /**
   * Update API documentation
   */
  async updateAPIDocumentation(taskInfo) {
    const apiFile = path.join(this.projectRoot, 'docs', 'API_REFERENCE.md');
    
    try {
      let content = await fs.readFile(apiFile, 'utf8');
      
      if (taskInfo.endpoint) {
        const apiSection = `
### ${taskInfo.endpoint.method} ${taskInfo.endpoint.path}
**Description**: ${taskInfo.endpoint.description}
**Added**: ${new Date().toISOString()}
**Status**: ${taskInfo.status}

#### Request
\`\`\`javascript
${JSON.stringify(taskInfo.endpoint.request || {}, null, 2)}
\`\`\`

#### Response
\`\`\`javascript
${JSON.stringify(taskInfo.endpoint.response || {}, null, 2)}
\`\`\`
`;
        
        // Append to API documentation
        content += apiSection;
        await fs.writeFile(apiFile, content);
        
        return {
          file: 'API_REFERENCE.md',
          type: 'api_documentation',
          changes: `Added ${taskInfo.endpoint.method} ${taskInfo.endpoint.path}`,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Error updating API documentation:', error.message);
    }
    
    return null;
  }

  /**
   * Update unified documentation
   */
  async updateUnifiedDocumentation(taskInfo) {
    const unifiedFile = path.join(this.projectRoot, 'docs', 'UNIFIED_DOCUMENTATION.md');
    
    try {
      let content = await fs.readFile(unifiedFile, 'utf8');
      
      // Update metrics section
      const metricsPattern = /Innovation Score: (\d+)\/100/;
      const currentScore = content.match(metricsPattern);
      
      if (currentScore && taskInfo.innovationImpact) {
        const newScore = Math.min(100, parseInt(currentScore[1]) + taskInfo.innovationImpact);
        content = content.replace(metricsPattern, `Innovation Score: ${newScore}/100`);
      }
      
      // Update last modified
      const datePattern = /Last Updated: \d{4}-\d{2}-\d{2}/;
      content = content.replace(datePattern, `Last Updated: ${new Date().toISOString().split('T')[0]}`);
      
      await fs.writeFile(unifiedFile, content);
      
      return {
        file: 'UNIFIED_DOCUMENTATION.md',
        type: 'unified_update',
        changes: 'Updated metrics and timestamp',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error updating unified documentation:', error.message);
    }
    
    return null;
  }

  /**
   * Learn patterns from improvements
   */
  async learnPattern(taskInfo, improvements) {
    const pattern = {
      taskType: taskInfo.type,
      improvements: improvements.length,
      timestamp: Date.now(),
      success: taskInfo.status === 'completed'
    };
    
    if (!this.patterns.has(taskInfo.type)) {
      this.patterns.set(taskInfo.type, []);
    }
    
    this.patterns.get(taskInfo.type).push(pattern);
    
    // Apply learned patterns
    if (this.patterns.get(taskInfo.type).length > 5) {
      await this.applyLearnedPatterns(taskInfo.type);
    }
  }

  /**
   * Apply learned patterns to improve future documentation
   */
  async applyLearnedPatterns(taskType) {
    const patterns = this.patterns.get(taskType);
    const successRate = patterns.filter(p => p.success).length / patterns.length;
    
    if (successRate > 0.8) {
      console.log(`📊 High success rate (${(successRate * 100).toFixed(1)}%) for ${taskType} tasks`);
      // Auto-generate templates for this task type
      await this.generateTemplate(taskType, patterns);
    }
  }

  /**
   * Generate documentation template based on patterns
   */
  async generateTemplate(taskType, patterns) {
    const template = {
      type: taskType,
      structure: this.analyzeStructure(patterns),
      requiredFields: this.extractRequiredFields(patterns),
      successCriteria: this.extractSuccessCriteria(patterns)
    };
    
    const templateFile = path.join(
      this.projectRoot, 
      'docs', 
      'templates', 
      `${taskType}_template.md`
    );
    
    await fs.mkdir(path.dirname(templateFile), { recursive: true });
    await fs.writeFile(templateFile, JSON.stringify(template, null, 2));
    
    console.log(`✅ Generated template for ${taskType} tasks`);
  }

  /**
   * Analyze documentation structure from patterns
   */
  analyzeStructure(patterns) {
    return {
      sections: ['Overview', 'Implementation', 'Testing', 'Metrics'],
      averageLength: patterns.reduce((sum, p) => sum + (p.improvements || 0), 0) / patterns.length,
      format: 'markdown'
    };
  }

  /**
   * Extract required fields from patterns
   */
  extractRequiredFields(patterns) {
    return ['description', 'status', 'timestamp', 'impact', 'performance'];
  }

  /**
   * Extract success criteria from patterns
   */
  extractSuccessCriteria(patterns) {
    return {
      minimumDocumentation: true,
      testsRequired: true,
      performanceMetrics: true,
      codeReview: true
    };
  }

  /**
   * Update metrics
   */
  async updateMetrics(improvements) {
    const metrics = {
      totalImprovements: this.improvementLog.length + improvements.length,
      lastUpdate: Date.now(),
      improvementRate: improvements.length / ((Date.now() - this.lastUpdate) / 1000 / 60), // per minute
      patterns: Array.from(this.patterns.entries()).map(([type, patterns]) => ({
        type,
        count: patterns.length,
        successRate: patterns.filter(p => p.success).length / patterns.length
      }))
    };
    
    const metricsFile = path.join(this.projectRoot, 'docs', this.metricsFile);
    await fs.writeFile(metricsFile, JSON.stringify(metrics, null, 2));
    
    this.improvementLog.push(...improvements);
    this.lastUpdate = Date.now();
  }

  /**
   * Load existing metrics
   */
  async loadMetrics() {
    try {
      const metricsFile = path.join(this.projectRoot, 'docs', this.metricsFile);
      const data = await fs.readFile(metricsFile, 'utf8');
      const metrics = JSON.parse(data);
      
      this.improvementLog = metrics.improvements || [];
      this.lastUpdate = metrics.lastUpdate || Date.now();
      
      console.log(`📊 Loaded ${this.improvementLog.length} previous improvements`);
    } catch (error) {
      // No existing metrics, start fresh
      console.log('📊 Starting fresh metrics tracking');
    }
  }

  /**
   * Save metrics
   */
  async saveMetrics(improvements) {
    const metrics = {
      improvements: this.improvementLog.concat(improvements),
      lastUpdate: Date.now(),
      totalImprovements: this.improvementLog.length + improvements.length,
      files: this.documentationFiles,
      patterns: Array.from(this.patterns.entries())
    };
    
    const metricsFile = path.join(this.projectRoot, 'docs', this.metricsFile);
    await fs.writeFile(metricsFile, JSON.stringify(metrics, null, 2));
  }

  /**
   * Start monitoring for changes
   */
  startMonitoring() {
    // Check for updates every 30 seconds
    setInterval(async () => {
      await this.checkForUpdates();
    }, 30000);
  }

  /**
   * Check for documentation updates
   */
  async checkForUpdates() {
    for (const file of this.documentationFiles) {
      try {
        const filePath = path.join(this.projectRoot, 'docs', file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() > this.lastUpdate) {
          console.log(`📝 Detected update in ${file}`);
          this.emit('file-updated', { file, timestamp: stats.mtime });
        }
      } catch (error) {
        // File doesn't exist yet, skip
      }
    }
  }

  /**
   * Generate documentation report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: this.documentationFiles.length,
      totalImprovements: this.improvementLog.length,
      improvementRate: this.improvementLog.length / ((Date.now() - this.lastUpdate) / 1000 / 60 / 60), // per hour
      patterns: Array.from(this.patterns.entries()).map(([type, patterns]) => ({
        type,
        count: patterns.length,
        successRate: (patterns.filter(p => p.success).length / patterns.length * 100).toFixed(1) + '%'
      })),
      lastUpdate: new Date(this.lastUpdate).toISOString(),
      recommendations: [
        'Continue automated documentation updates',
        'Review and refine templates',
        'Increase pattern recognition',
        'Implement version control for docs'
      ]
    };
    
    console.log('\n📊 Documentation Improvement Report');
    console.log('═'.repeat(50));
    console.log(`Total Improvements: ${report.totalImprovements}`);
    console.log(`Improvement Rate: ${report.improvementRate.toFixed(2)}/hour`);
    console.log(`Patterns Learned: ${report.patterns.length}`);
    console.log('═'.repeat(50));
    
    return report;
  }
}

// Export for use
export default AutoDocumentationSystem;

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const autoDoc = new AutoDocumentationSystem();
  
  // Example usage
  setTimeout(async () => {
    await autoDoc.onTaskComplete({
      description: 'Implemented 75+ AI agents system',
      type: 'feature',
      status: 'completed',
      impact: 'Major system enhancement',
      performance: '12.5x improvement',
      innovationImpact: 2
    });
    
    await autoDoc.generateReport();
  }, 2000);
}