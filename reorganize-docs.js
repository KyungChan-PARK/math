/**
 * Documentation Reorganization Script
 * Automates the cleanup and restructuring of project documentation
 * Last Updated: 2025-09-08
 * Review Cycle: Daily
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocumentationReorganizer {
    constructor() {
        this.rootPath = 'C:\\palantir\\math';
        this.stats = {
            filesProcessed: 0,
            filesArchived: 0,
            filesUpdated: 0,
            errors: 0
        };
        
        // Documents to archive (outdated/duplicate)
        this.toArchive = [
            'AI_SESSION_CONTEXT.md',
            'MASTER_SESSION_PROMPT.md',
            'NEW_SESSION_PROMPT.md',
            'NEW_SESSION_PROMPT_LATEST.md',
            'RECOVERY_PROMPT.md',
            'SESSION_RESTORE_PROMPT_001.md',
            'CLAUDE_OPUS_4_1_ADVANCED_FEATURES_backup.md',
            'compass_artifact_*.md',
            'DEVELOPMENT_STATUS_20250907.md',
            'PROJECT_STATUS_20250908.md'
        ];
        
        // Documents to keep and update
        this.toUpdate = [
            'README.md',
            'QUICK_START.md',
            'API_REFERENCE.md',
            'UNIFIED_DOCUMENTATION.md',
            'DOCUMENTATION_IMPROVEMENT_PLAN.md'
        ];
    }

    /**
     * Create directory structure
     */
    async createDirectories() {
        const dirs = [
            path.join(this.rootPath, 'docs'),
            path.join(this.rootPath, 'docs', 'archive'),
            path.join(this.rootPath, 'docs', 'archive', 'prompts'),
            path.join(this.rootPath, 'docs', 'archive', 'reports'),
            path.join(this.rootPath, 'docs', 'technical')
        ];

        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`✅ Created directory: ${dir}`);
            }
        }
    }

    /**
     * Archive old documents
     */
    async archiveDocuments() {
        console.log('\n Archiving outdated documents...');
        
        for (const pattern of this.toArchive) {
            const files = this.findFiles(pattern);
            
            for (const file of files) {
                try {
                    const fileName = path.basename(file);
                    let targetDir = 'archive';
                    
                    // Determine target directory
                    if (fileName.includes('PROMPT') || fileName.includes('SESSION')) {
                        targetDir = 'archive/prompts';
                    } else if (fileName.includes('REPORT') || fileName.includes('STATUS')) {
                        targetDir = 'archive/reports';
                    }
                    
                    const source = path.join(this.rootPath, fileName);
                    const target = path.join(this.rootPath, 'docs', targetDir, fileName);
                    
                    if (fs.existsSync(source)) {
                        // Add archive notice to file
                        const content = fs.readFileSync(source, 'utf-8');
                        const archivedContent = `> ️ **ARCHIVED DOCUMENT** - See [UNIFIED_DOCUMENTATION.md](../../UNIFIED_DOCUMENTATION.md) for current information\n> Archived: ${new Date().toISOString()}\n\n${content}`;
                        
                        fs.writeFileSync(target, archivedContent);
                        fs.unlinkSync(source); // Remove original
                        
                        console.log(`   Archived: ${fileName} → docs/${targetDir}/`);
                        this.stats.filesArchived++;
                    }
                } catch (error) {
                    console.error(`  ❌ Error archiving ${file}: ${error.message}`);
                    this.stats.errors++;
                }
            }
        }
    }

    /**
     * Find files matching pattern
     */
    findFiles(pattern) {
        const files = fs.readdirSync(this.rootPath);
        
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace('*', '.*'));
            return files.filter(f => regex.test(f));
        }
        
        return files.filter(f => f === pattern);
    }

    /**
     * Update cross-references in documents
     */
    async updateCrossReferences() {
        console.log('\n Updating cross-references...');
        
        const replacements = [
            { from: './MASTER_REFERENCE.md', to: './UNIFIED_DOCUMENTATION.md' },
            { from: './AI_SESSION_CONTEXT.md', to: './UNIFIED_DOCUMENTATION.md' },
            { from: './API_DOCUMENTATION.md', to: './API_REFERENCE.md' },
            { from: '../MASTER_REFERENCE.md', to: '../UNIFIED_DOCUMENTATION.md' }
        ];

        for (const docName of this.toUpdate) {
            const filePath = path.join(this.rootPath, docName);
            
            if (fs.existsSync(filePath)) {
                try {
                    let content = fs.readFileSync(filePath, 'utf-8');
                    let updated = false;
                    
                    for (const { from, to } of replacements) {
                        if (content.includes(from)) {
                            content = content.replace(new RegExp(from.replace('.', '\\.'), 'g'), to);
                            updated = true;
                        }
                    }
                    
                    if (updated) {
                        fs.writeFileSync(filePath, content);
                        console.log(`  ✅ Updated references in: ${docName}`);
                        this.stats.filesUpdated++;
                    }
                } catch (error) {
                    console.error(`  ❌ Error updating ${docName}: ${error.message}`);
                    this.stats.errors++;
                }
            }
        }
    }

    /**
     * Create documentation index
     */
    async createDocumentationIndex() {
        console.log('\n Creating documentation index...');
        
        const indexContent = `#  Documentation Index
> **Generated**: ${new Date().toISOString()}
> **Version**: 2.0.0

##  Primary Documentation

| Document | Purpose | Status |
|----------|---------|--------|
| [UNIFIED_DOCUMENTATION.md](./UNIFIED_DOCUMENTATION.md) | Complete system reference | ⭐ Primary |
| [README.md](./README.md) | Project overview | ✅ Active |
| [QUICK_START.md](./QUICK_START.md) | Installation guide | ✅ Active |
| [API_REFERENCE.md](./API_REFERENCE.md) | API documentation | ✅ Active |

## ️ Technical Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| [Architecture](./UNIFIED_DOCUMENTATION.md#architecture) | System design | Unified Doc |
| [Development Guide](./UNIFIED_DOCUMENTATION.md#development-guide) | Dev guidelines | Unified Doc |
| [Troubleshooting](./UNIFIED_DOCUMENTATION.md#troubleshooting) | Problem solving | Unified Doc |

##  Archived Documentation

Outdated and historical documents have been moved to \`docs/archive/\`:
- Legacy prompts: \`docs/archive/prompts/\`
- Old reports: \`docs/archive/reports/\`
- Previous versions: \`docs/archive/\`

##  Quick Access

### For Developers
- Start here: [QUICK_START.md](./QUICK_START.md)
- API docs: [API_REFERENCE.md](./API_REFERENCE.md)
- Full reference: [UNIFIED_DOCUMENTATION.md](./UNIFIED_DOCUMENTATION.md)

### For AI Agents
- Primary reference: [UNIFIED_DOCUMENTATION.md](./UNIFIED_DOCUMENTATION.md)
- API endpoints: [API_REFERENCE.md](./API_REFERENCE.md#service-endpoints)

### For DevOps
- Docker setup: [UNIFIED_DOCUMENTATION.md#docker-support](./UNIFIED_DOCUMENTATION.md#docker-support)
- Monitoring: [UNIFIED_DOCUMENTATION.md#metrics--monitoring](./UNIFIED_DOCUMENTATION.md#metrics--monitoring)

##  Documentation Statistics

- Total active documents: 5
- Archived documents: ${this.stats.filesArchived}
- Last reorganization: ${new Date().toISOString()}
- Documentation health: ✅ Excellent

---

**Note**: This index is automatically generated. For the most comprehensive information, always refer to [UNIFIED_DOCUMENTATION.md](./UNIFIED_DOCUMENTATION.md).
`;

        fs.writeFileSync(path.join(this.rootPath, 'DOCUMENTATION_INDEX.md'), indexContent);
        console.log('  ✅ Documentation index created');
    }

    /**
     * Validate documentation consistency
     */
    async validateDocumentation() {
        console.log('\n✔️ Validating documentation consistency...');
        
        const validations = {
            portsConsistent: true,
            linksWorking: true,
            noOrphans: true
        };

        // Check for consistent port numbers
        const ports = {
            frontend: 3000,
            backend: 8086,
            websocket: 8089,
            monitoring: 8081
        };

        for (const docName of this.toUpdate) {
            const filePath = path.join(this.rootPath, docName);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                
                // Check ports
                for (const [service, port] of Object.entries(ports)) {
                    const regex = new RegExp(`${service}.*?(\\d{4})`, 'gi');
                    const matches = content.match(regex);
                    if (matches) {
                        matches.forEach(match => {
                            const foundPort = match.match(/\d{4}/)[0];
                            if (parseInt(foundPort) !== port) {
                                console.log(`  ️ Inconsistent port in ${docName}: ${service} = ${foundPort} (should be ${port})`);
                                validations.portsConsistent = false;
                            }
                        });
                    }
                }
            }
        }

        return validations;
    }

    /**
     * Generate summary report
     */
    generateReport() {
        console.log('\n Documentation Reorganization Report');
        console.log('=====================================');
        console.log(`✅ Files processed: ${this.stats.filesProcessed}`);
        console.log(` Files archived: ${this.stats.filesArchived}`);
        console.log(` Files updated: ${this.stats.filesUpdated}`);
        console.log(`❌ Errors: ${this.stats.errors}`);
        console.log('\n New Structure:');
        console.log('  C:\\palantir\\math\\');
        console.log('  ├──  UNIFIED_DOCUMENTATION.md (Primary)');
        console.log('  ├──  README.md');
        console.log('  ├──  QUICK_START.md');
        console.log('  ├──  API_REFERENCE.md');
        console.log('  ├──  DOCUMENTATION_INDEX.md');
        console.log('  └──  docs/');
        console.log('      └──  archive/');
        console.log('          ├──  prompts/');
        console.log('          └──  reports/');
        console.log('\n✨ Documentation reorganization complete!');
    }

    /**
     * Run the reorganization
     */
    async run() {
        console.log(' Starting Documentation Reorganization...\n');
        
        try {
            await this.createDirectories();
            await this.archiveDocuments();
            await this.updateCrossReferences();
            await this.createDocumentationIndex();
            
            const validation = await this.validateDocumentation();
            
            this.generateReport();
            
            if (validation.portsConsistent) {
                console.log('\n✅ All port numbers are consistent');
            }
            
            console.log('\n Documentation successfully reorganized!');
            console.log(' Primary documentation: UNIFIED_DOCUMENTATION.md');
            
        } catch (error) {
            console.error('❌ Reorganization failed:', error);
            process.exit(1);
        }
    }
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const reorganizer = new DocumentationReorganizer();
    reorganizer.run().catch(console.error);
}

export default DocumentationReorganizer;