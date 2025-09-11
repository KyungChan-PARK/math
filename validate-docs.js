/**
 * Documentation Validation Script
 * Validates consistency, completeness, and quality of documentation
 * Last Updated: 2025-09-08
 * Review Cycle: Daily - Run at 09:00 KST
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocumentationValidator {
    constructor() {
        this.rootPath = 'C:\\palantir\\math';
        this.results = {
            passed: [],
            failed: [],
            warnings: []
        };
        
        // Standard port configuration
        this.standardPorts = {
            frontend: 3000,
            backend: 8086,
            'backend api': 8086,
            websocket: 8089,
            monitoring: 8081,
            neo4j: 7687,
            'neo4j browser': 7474,
            mongodb: 27017,
            chromadb: 8000,
            redis: 6379
        };
        
        // Required documents
        this.requiredDocs = [
            'UNIFIED_DOCUMENTATION.md',
            'README.md',
            'QUICK_START.md',
            'API_REFERENCE.md'
        ];
    }

    /**
     * Check if all required documents exist
     */
    checkRequiredDocuments() {
        console.log(' Checking required documents...');
        
        for (const doc of this.requiredDocs) {
            const filePath = path.join(this.rootPath, doc);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const lines = fs.readFileSync(filePath, 'utf-8').split('\n').length;
                
                this.results.passed.push({
                    test: `Document exists: ${doc}`,
                    details: `${lines} lines, ${stats.size} bytes`
                });
                console.log(`  ✅ ${doc} (${lines} lines)`);
            } else {
                this.results.failed.push({
                    test: `Document exists: ${doc}`,
                    error: 'File not found'
                });
                console.log(`  ❌ ${doc} - NOT FOUND`);
            }
        }
    }

    /**
     * Validate port consistency across documents
     */
    validatePortConsistency() {
        console.log('\n Validating port consistency...');
        
        const inconsistencies = [];
        
        for (const doc of this.requiredDocs) {
            const filePath = path.join(this.rootPath, doc);
            
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8').toLowerCase();
                
                for (const [service, expectedPort] of Object.entries(this.standardPorts)) {
                    // Look for service:port patterns
                    const patterns = [
                        new RegExp(`${service}[^\\d]*(\\d{4,5})`, 'gi'),
                        new RegExp(`port[\\s:]+${expectedPort}`, 'gi'),
                        new RegExp(`localhost:(\\d{4,5})`, 'gi')
                    ];
                    
                    patterns.forEach(pattern => {
                        const matches = content.matchAll(pattern);
                        
                        for (const match of matches) {
                            if (match[1]) {
                                const foundPort = parseInt(match[1]);
                                
                                // Check if this port is associated with the right service
                                if (match[0].includes(service) && foundPort !== expectedPort) {
                                    inconsistencies.push({
                                        document: doc,
                                        service,
                                        found: foundPort,
                                        expected: expectedPort,
                                        context: match[0]
                                    });
                                }
                            }
                        }
                    });
                }
            }
        }
        
        if (inconsistencies.length === 0) {
            this.results.passed.push({
                test: 'Port consistency',
                details: 'All ports are consistent across documents'
            });
            console.log('  ✅ All port numbers are consistent');
        } else {
            inconsistencies.forEach(inc => {
                this.results.warnings.push({
                    test: 'Port consistency',
                    warning: `${inc.document}: ${inc.service} has port ${inc.found} (expected ${inc.expected})`
                });
                console.log(`  ️ ${inc.document}: ${inc.service} = ${inc.found} (should be ${inc.expected})`);
            });
        }
    }

    /**
     * Check for broken internal links
     */
    validateInternalLinks() {
        console.log('\n Validating internal links...');
        
        const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
        let brokenLinks = [];
        
        for (const doc of this.requiredDocs) {
            const filePath = path.join(this.rootPath, doc);
            
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                const matches = content.matchAll(linkPattern);
                
                for (const match of matches) {
                    const linkText = match[1];
                    const linkPath = match[2];
                    
                    // Check only relative .md links
                    if (linkPath.endsWith('.md') && !linkPath.startsWith('http')) {
                        const targetPath = path.join(this.rootPath, linkPath.replace('./', ''));
                        
                        if (!fs.existsSync(targetPath)) {
                            brokenLinks.push({
                                document: doc,
                                link: linkPath,
                                text: linkText
                            });
                        }
                    }
                }
            }
        }
        
        if (brokenLinks.length === 0) {
            this.results.passed.push({
                test: 'Internal links',
                details: 'All internal links are valid'
            });
            console.log('  ✅ All internal links are valid');
        } else {
            brokenLinks.forEach(link => {
                this.results.failed.push({
                    test: 'Internal links',
                    error: `${link.document}: Broken link to ${link.link}`
                });
                console.log(`  ❌ ${link.document}: Broken link "${link.text}" → ${link.link}`);
            });
        }
    }

    /**
     * Check documentation completeness
     */
    checkCompleteness() {
        console.log('\n Checking documentation completeness...');
        
        const requiredSections = {
            'UNIFIED_DOCUMENTATION.md': [
                '# quick navigation',
                '## system overview',
                '## quick start',
                '## architecture',
                '## api reference',
                '## troubleshooting'
            ],
            'README.md': [
                '# math learning platform',
                '## quick start',
                '## key features',
                '## project status'
            ],
            'API_REFERENCE.md': [
                '## service endpoints',
                '## authentication',
                '## core apis',
                '## websocket events',
                '## error handling'
            ]
        };
        
        for (const [doc, sections] of Object.entries(requiredSections)) {
            const filePath = path.join(this.rootPath, doc);
            
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8').toLowerCase();
                const missingSections = [];
                
                sections.forEach(section => {
                    if (!content.includes(section)) {
                        missingSections.push(section);
                    }
                });
                
                if (missingSections.length === 0) {
                    this.results.passed.push({
                        test: `Completeness: ${doc}`,
                        details: 'All required sections present'
                    });
                    console.log(`  ✅ ${doc}: Complete`);
                } else {
                    this.results.warnings.push({
                        test: `Completeness: ${doc}`,
                        warning: `Missing sections: ${missingSections.join(', ')}`
                    });
                    console.log(`  ️ ${doc}: Missing ${missingSections.length} sections`);
                }
            }
        }
    }

    /**
     * Analyze documentation metrics
     */
    analyzeMetrics() {
        console.log('\n Documentation metrics...');
        
        let totalLines = 0;
        let totalSize = 0;
        let totalFiles = 0;
        
        for (const doc of this.requiredDocs) {
            const filePath = path.join(this.rootPath, doc);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n').length;
                
                totalLines += lines;
                totalSize += stats.size;
                totalFiles++;
                
                console.log(`   ${doc}: ${lines} lines, ${(stats.size / 1024).toFixed(2)} KB`);
            }
        }
        
        console.log(`   Total: ${totalFiles} files, ${totalLines} lines, ${(totalSize / 1024).toFixed(2)} KB`);
        
        this.results.passed.push({
            test: 'Documentation metrics',
            details: `${totalFiles} files, ${totalLines} lines, ${(totalSize / 1024).toFixed(2)} KB`
        });
    }

    /**
     * Generate validation report
     */
    generateReport() {
        const timestamp = new Date().toISOString();
        
        const report = {
            timestamp,
            summary: {
                passed: this.results.passed.length,
                failed: this.results.failed.length,
                warnings: this.results.warnings.length,
                score: Math.round((this.results.passed.length / 
                    (this.results.passed.length + this.results.failed.length)) * 100)
            },
            results: this.results
        };
        
        // Save report
        fs.writeFileSync(
            path.join(this.rootPath, 'DOCUMENTATION_VALIDATION_REPORT.json'),
            JSON.stringify(report, null, 2)
        );
        
        // Print summary
        console.log('\n' + '='.repeat(50));
        console.log(' VALIDATION REPORT');
        console.log('='.repeat(50));
        console.log(`✅ Passed: ${report.summary.passed}`);
        console.log(`❌ Failed: ${report.summary.failed}`);
        console.log(`️ Warnings: ${report.summary.warnings}`);
        console.log(` Score: ${report.summary.score}%`);
        console.log('='.repeat(50));
        
        if (report.summary.failed === 0) {
            console.log(' Documentation validation PASSED!');
        } else {
            console.log('️ Documentation needs attention');
            this.results.failed.forEach(fail => {
                console.log(`  ❌ ${fail.test}: ${fail.error}`);
            });
        }
        
        return report;
    }

    /**
     * Run all validations
     */
    async run() {
        console.log(' Starting Documentation Validation...\n');
        
        try {
            this.checkRequiredDocuments();
            this.validatePortConsistency();
            this.validateInternalLinks();
            this.checkCompleteness();
            this.analyzeMetrics();
            
            const report = this.generateReport();
            
            console.log('\n Report saved to: DOCUMENTATION_VALIDATION_REPORT.json');
            
            return report.summary.score >= 80;
            
        } catch (error) {
            console.error('❌ Validation failed:', error);
            return false;
        }
    }
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const validator = new DocumentationValidator();
    validator.run().then(success => {
        process.exit(success ? 0 : 1);
    });
}

export default DocumentationValidator;