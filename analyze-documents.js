// Document Analysis and Improvement System
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class DocumentAnalyzer {
    constructor() {
        this.documents = new Map();
        this.duplicates = [];
        this.improvements = [];
        this.categories = {
            core: [],
            archive: [],
            development: [],
            library: [],
            obsolete: []
        };
    }

    async analyzeProject(projectPath) {
        console.log('===  Document Analysis Starting ===\n');
        
        // Core documents (root level)
        const coreDocPaths = [
            'README.md',
            'MASTER_REFERENCE.md',
            'API_DOCUMENTATION.md',
            'IMPLEMENTATION_ROADMAP.md',
            'QUICK_START.md',
            'MCP_SERVER_GUIDE.md',
            'CLAUDE_OPUS_4_1_ADVANCED_FEATURES.md',
            'CLAUDE_INTEGRATION_STATUS.md',
            'TRIVIAL_ISSUE_PREVENTION_README.md'
        ];
        
        // Analyze core documents
        console.log('1. Analyzing Core Documents...');
        for (const docPath of coreDocPaths) {
            const fullPath = path.join(projectPath, docPath);
            await this.analyzeDocument(fullPath, 'core');
        }
        
        // Analyze dev-docs
        console.log('\n2. Analyzing Dev Documentation...');
        const devDocsPath = path.join(projectPath, 'dev-docs');
        await this.analyzeDirectory(devDocsPath, 'development');
        
        // Analyze archives
        console.log('\n3. Analyzing Archived Documents...');
        const archivePaths = [
            path.join(projectPath, 'docs-archive'),
            path.join(projectPath, 'docs-archive-20250906'),
            path.join(projectPath, 'dev-docs', 'archive-20250131')
        ];
        
        for (const archivePath of archivePaths) {
            await this.analyzeDirectory(archivePath, 'archive');
        }
        
        // Find duplicates
        console.log('\n4. Finding Duplicates...');
        this.findDuplicates();
        
        // Generate improvements
        console.log('\n5. Generating Improvement Recommendations...');
        this.generateImprovements();
        
        return this.getReport();
    }
    
    async analyzeDocument(filePath, category) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const stats = await fs.stat(filePath);
            
            const hash = crypto.createHash('md5').update(content).digest('hex');
            const lines = content.split('\n').length;
            const words = content.split(/\s+/).length;
            
            const docInfo = {
                path: filePath,
                name: path.basename(filePath),
                category,
                size: stats.size,
                modified: stats.mtime,
                lines,
                words,
                hash,
                content: content.substring(0, 500), // First 500 chars for preview
                headings: this.extractHeadings(content),
                hasCode: content.includes('```'),
                hasTODO: content.includes('TODO') || content.includes('[ ]'),
                lastUpdated: this.extractLastUpdated(content)
            };
            
            this.documents.set(filePath, docInfo);
            this.categories[category].push(filePath);
            
        } catch (error) {
            // File doesn't exist or can't be read
        }
    }
    
    async analyzeDirectory(dirPath, category) {
        try {
            const files = await fs.readdir(dirPath);
            
            for (const file of files) {
                if (file.endsWith('.md')) {
                    const fullPath = path.join(dirPath, file);
                    const stat = await fs.stat(fullPath);
                    
                    if (stat.isFile()) {
                        await this.analyzeDocument(fullPath, category);
                    }
                }
            }
        } catch (error) {
            // Directory doesn't exist
        }
    }
    
    extractHeadings(content) {
        const headings = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const match = line.match(/^(#{1,6})\s+(.+)/);
            if (match) {
                headings.push({
                    level: match[1].length,
                    text: match[2]
                });
            }
        }
        
        return headings;
    }
    
    extractLastUpdated(content) {
        const patterns = [
            /Updated:\s*(\d{4}-\d{2}-\d{2})/i,
            /Last (?:updated?|review):\s*(\d{4}-\d{2}-\d{2})/i,
            /Date:\s*(\d{4}-\d{2}-\d{2})/i
        ];
        
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        return null;
    }
    
    findDuplicates() {
        const hashMap = new Map();
        
        for (const [path, doc] of this.documents) {
            if (!hashMap.has(doc.hash)) {
                hashMap.set(doc.hash, []);
            }
            hashMap.get(doc.hash).push(path);
        }
        
        for (const [hash, paths] of hashMap) {
            if (paths.length > 1) {
                this.duplicates.push({
                    hash,
                    paths,
                    category: 'exact_duplicate'
                });
            }
        }
        
        // Find similar documents by title
        const titleMap = new Map();
        
        for (const [path, doc] of this.documents) {
            const baseName = doc.name.replace(/[-_v\d\.]/g, '').toLowerCase();
            
            if (!titleMap.has(baseName)) {
                titleMap.set(baseName, []);
            }
            titleMap.get(baseName).push(path);
        }
        
        for (const [title, paths] of titleMap) {
            if (paths.length > 1) {
                this.duplicates.push({
                    title,
                    paths,
                    category: 'similar_name'
                });
            }
        }
    }
    
    generateImprovements() {
        // Check for outdated documents
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        for (const [path, doc] of this.documents) {
            // Outdated documents
            if (doc.modified < thirtyDaysAgo && doc.category === 'core') {
                this.improvements.push({
                    type: 'outdated',
                    path,
                    message: `Not updated in ${Math.floor((Date.now() - doc.modified) / (1000 * 60 * 60 * 24))} days`,
                    priority: 'high'
                });
            }
            
            // Missing structure
            if (doc.category === 'core' && doc.headings.length < 3) {
                this.improvements.push({
                    type: 'structure',
                    path,
                    message: 'Document lacks proper heading structure',
                    priority: 'medium'
                });
            }
            
            // TODOs in core documents
            if (doc.category === 'core' && doc.hasTODO) {
                this.improvements.push({
                    type: 'incomplete',
                    path,
                    message: 'Contains TODO items or incomplete sections',
                    priority: 'high'
                });
            }
            
            // Very large documents
            if (doc.lines > 1000) {
                this.improvements.push({
                    type: 'size',
                    path,
                    message: `Document is very large (${doc.lines} lines) - consider splitting`,
                    priority: 'low'
                });
            }
            
            // Very small documents
            if (doc.category === 'core' && doc.lines < 50) {
                this.improvements.push({
                    type: 'size',
                    path,
                    message: `Document is very small (${doc.lines} lines) - may need expansion`,
                    priority: 'medium'
                });
            }
        }
    }
    
    getReport() {
        const report = {
            summary: {
                total: this.documents.size,
                core: this.categories.core.length,
                development: this.categories.development.length,
                archive: this.categories.archive.length,
                duplicates: this.duplicates.length,
                improvements: this.improvements.length
            },
            duplicates: this.duplicates,
            improvements: this.improvements,
            categories: this.categories,
            documents: Array.from(this.documents.values())
        };
        
        return report;
    }
}

// Run analysis
const analyzer = new DocumentAnalyzer();
const projectPath = 'C:\\palantir\\math';

analyzer.analyzeProject(projectPath).then(report => {
    console.log('\n===  ANALYSIS REPORT ===\n');
    
    console.log('Summary:');
    console.log(`  Total Documents: ${report.summary.total}`);
    console.log(`  Core Documents: ${report.summary.core}`);
    console.log(`  Development Docs: ${report.summary.development}`);
    console.log(`  Archived Docs: ${report.summary.archive}`);
    console.log(`  Duplicate Groups: ${report.summary.duplicates}`);
    console.log(`  Improvements Needed: ${report.summary.improvements}`);
    
    console.log('\n Critical Issues:');
    const critical = report.improvements.filter(i => i.priority === 'high');
    critical.forEach(issue => {
        console.log(`  - ${path.basename(issue.path)}: ${issue.message}`);
    });
    
    console.log('\n Duplicates Found:');
    report.duplicates.slice(0, 5).forEach(dup => {
        if (dup.category === 'exact_duplicate') {
            console.log(`  Exact duplicates:`);
            dup.paths.forEach(p => console.log(`    - ${p.replace(projectPath, '.')}`));
        }
    });
    
    console.log('\n Recommendations:');
    console.log('  1. Consolidate duplicate documents');
    console.log('  2. Update outdated core documentation');
    console.log('  3. Complete TODO items in core docs');
    console.log('  4. Archive obsolete documentation');
    console.log('  5. Standardize document structure');
    
    // Save detailed report
    fs.writeFile(
        path.join(projectPath, 'DOCUMENT_ANALYSIS_REPORT.json'),
        JSON.stringify(report, null, 2)
    );
});
