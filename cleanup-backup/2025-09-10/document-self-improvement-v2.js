// Real-time Documentation Self-Improvement System
// Version 2.0.0 - 2025-09-09

import fs from 'fs/promises';
import path from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';

class DocumentSelfImprovementSystem {
    constructor() {
        this.projectRoot = 'C:\\palantir\\math';
        this.docsPath = path.join(this.projectRoot, 'docs-organized');
        this.statusFile = path.join(this.projectRoot, 'SELF_IMPROVEMENT_STATUS.json');
        this.issues = [];
        this.fixes = [];
        this.metrics = {
            documentsScanned: 0,
            issuesFound: 0,
            issuesFixed: 0,
            duplicatesFound: 0,
            brokenLinks: 0,
            lastScan: null
        };
    }

    async initialize() {
        console.log(chalk.cyan('🚀 Initializing Documentation Self-Improvement System v2.0'));
        
        // Create necessary directories
        await this.ensureDirectories();
        
        // Start file watcher
        this.startWatcher();
        
        // Run initial scan
        await this.fullScan();
        
        // Start periodic scans
        this.startPeriodicScans();
        
        console.log(chalk.green('✅ Self-Improvement System Active'));
    }

    async ensureDirectories() {
        const dirs = [
            'docs-organized',
            'docs-organized/01-overview',
            'docs-organized/02-architecture', 
            'docs-organized/03-api-reference',
            'docs-organized/04-components',
            'docs-organized/05-deployment',
            'docs-organized/06-development'
        ];

        for (const dir of dirs) {
            const fullPath = path.join(this.projectRoot, dir);
            try {
                await fs.mkdir(fullPath, { recursive: true });
            } catch (error) {
                // Directory already exists
            }
        }
    }

    startWatcher() {
        const watcher = chokidar.watch([
            path.join(this.projectRoot, '*.md'),
            path.join(this.projectRoot, 'docs-organized/**/*.md')
        ], {
            ignored: /node_modules/,
            persistent: true
        });

        watcher
            .on('add', path => this.analyzeFile(path))
            .on('change', path => this.analyzeFile(path))
            .on('unlink', path => console.log(`File removed: ${path}`));

        console.log(chalk.blue('👁️ File watcher started'));
    }

    async analyzeFile(filePath) {
        console.log(chalk.yellow(`📄 Analyzing: ${path.basename(filePath)}`));
        
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const issues = [];

            // Check for common issues
            if (content.length < 100) {
                issues.push({
                    file: filePath,
                    type: 'empty_content',
                    severity: 'warning',
                    message: 'Document appears to be empty or too short'
                });
            }

            // Check for broken links
            const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
            let match;
            while ((match = linkRegex.exec(content)) !== null) {
                const linkPath = match[2];
                if (linkPath.startsWith('.') || linkPath.startsWith('/')) {
                    const absolutePath = path.resolve(path.dirname(filePath), linkPath);
                    try {
                        await fs.access(absolutePath);
                    } catch {
                        issues.push({
                            file: filePath,
                            type: 'broken_link',
                            severity: 'error',
                            message: `Broken link: ${linkPath}`,
                            autoFixable: false
                        });
                    }
                }
            }

            // Check for outdated dates
            const dateRegex = /\d{4}-\d{2}-\d{2}/g;
            const dates = content.match(dateRegex) || [];
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            for (const dateStr of dates) {
                const date = new Date(dateStr);
                if (date < thirtyDaysAgo) {
                    issues.push({
                        file: filePath,
                        type: 'outdated_date',
                        severity: 'info',
                        message: `Potentially outdated date: ${dateStr}`,
                        autoFixable: false
                    });
                }
            }

            this.issues.push(...issues);
            this.metrics.issuesFound += issues.length;

            if (issues.length > 0) {
                console.log(chalk.red(`❌ Found ${issues.length} issues`));
            }

        } catch (error) {
            console.error(chalk.red(`Error analyzing ${filePath}:`, error.message));
        }
    }

    async fullScan() {
        console.log(chalk.cyan('🔍 Running full documentation scan...'));
        
        this.metrics.documentsScanned = 0;
        this.issues = [];
        
        // Scan all markdown files
        const files = await this.getAllMarkdownFiles();
        
        for (const file of files) {
            await this.analyzeFile(file);
            this.metrics.documentsScanned++;
        }

        // Check for duplicates
        await this.findDuplicates(files);
        
        // Save status
        await this.saveStatus();
        
        console.log(chalk.green(`✅ Scan complete: ${this.metrics.documentsScanned} documents, ${this.issues.length} issues found`));
    }

    async getAllMarkdownFiles() {
        const files = [];
        
        async function scanDir(dir) {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    await scanDir(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.md')) {
                    files.push(fullPath);
                }
            }
        }
        
        await scanDir(this.projectRoot);
        return files;
    }

    async findDuplicates(files) {
        const contentMap = new Map();
        
        for (const file of files) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const hash = this.hashContent(content);
                
                if (contentMap.has(hash)) {
                    const duplicate = contentMap.get(hash);
                    this.issues.push({
                        file: file,
                        type: 'duplicate',
                        severity: 'warning',
                        message: `Duplicate content with ${duplicate}`,
                        autoFixable: false
                    });
                    this.metrics.duplicatesFound++;
                } else {
                    contentMap.set(hash, file);
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
    }

    hashContent(content) {
        // Simple hash function for content comparison
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    startPeriodicScans() {
        // Run full scan every hour
        setInterval(() => {
            this.fullScan();
        }, 3600000);
        
        // Save status every 5 minutes
        setInterval(() => {
            this.saveStatus();
        }, 300000);
    }

    async saveStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            issues: this.issues.slice(0, 50), // Save only recent 50 issues
            fixes: this.fixes.slice(0, 50),
            health: this.calculateHealth()
        };

        try {
            await fs.writeFile(
                this.statusFile,
                JSON.stringify(status, null, 2),
                'utf-8'
            );
            console.log(chalk.green('💾 Status saved'));
        } catch (error) {
            console.error(chalk.red('Failed to save status:', error.message));
        }
    }

    calculateHealth() {
        const score = 100 - (this.issues.length * 2);
        return {
            score: Math.max(0, Math.min(100, score)),
            status: score > 80 ? 'excellent' : score > 60 ? 'good' : score > 40 ? 'fair' : 'poor'
        };
    }

    async autoFix(issue) {
        // Implement auto-fix logic for simple issues
        if (issue.type === 'empty_content') {
            // Add template content
            const template = `# Document Title\n\n## Overview\n\nThis document needs content.\n\n## Details\n\nPlease add relevant information here.\n`;
            await fs.writeFile(issue.file, template, 'utf-8');
            
            this.fixes.push({
                file: issue.file,
                type: issue.type,
                action: 'Added template content',
                timestamp: new Date().toISOString()
            });
            
            this.metrics.issuesFixed++;
            return true;
        }
        
        return false;
    }

    async generateReport() {
        const report = `# Documentation Health Report
Generated: ${new Date().toISOString()}

## Metrics
- Documents Scanned: ${this.metrics.documentsScanned}
- Issues Found: ${this.metrics.issuesFound}
- Issues Fixed: ${this.metrics.issuesFixed}
- Duplicates Found: ${this.metrics.duplicatesFound}
- Broken Links: ${this.metrics.brokenLinks}

## Health Score
${this.calculateHealth().score}/100 - ${this.calculateHealth().status}

## Top Issues
${this.issues.slice(0, 10).map(issue => 
    `- **${issue.type}** in ${path.basename(issue.file)}: ${issue.message}`
).join('\\n')}

## Recent Fixes
${this.fixes.slice(0, 10).map(fix =>
    `- Fixed **${fix.type}** in ${path.basename(fix.file)}: ${fix.action}`
).join('\\n')}
`;

        await fs.writeFile(
            path.join(this.projectRoot, 'DOCUMENTATION_HEALTH_REPORT.md'),
            report,
            'utf-8'
        );
        
        return report;
    }
}

// Start the system
const system = new DocumentSelfImprovementSystem();
system.initialize().catch(console.error);

export default DocumentSelfImprovementSystem;