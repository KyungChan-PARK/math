const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DuplicateScanner {
    constructor() {
        this.projectRoot = 'C:\\palantir\\math';
        this.ignoreFolders = [
            'node_modules', '.git', '.venv', 'venv', 
            'venv311', 'cache', '.vs', 'chromadb'
        ];
        this.fileHashes = new Map();
        this.duplicates = [];
    }

    scanDirectory(dir) {
        try {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory()) {
                    // Skip ignored folders
                    if (!this.ignoreFolders.some(ignore => item.name.includes(ignore))) {
                        this.scanDirectory(fullPath);
                    }
                } else if (item.name.endsWith('.md') || item.name.endsWith('.json')) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        const hash = crypto.createHash('md5').update(content).digest('hex');
                        
                        if (this.fileHashes.has(hash)) {
                            this.duplicates.push({
                                original: this.fileHashes.get(hash),
                                duplicate: fullPath,
                                size: fs.statSync(fullPath).size
                            });
                        } else {
                            this.fileHashes.set(hash, fullPath);
                        }
                    } catch (err) {
                        // Skip unreadable files
                    }
                }
            }
        } catch (err) {
            // Skip inaccessible directories
        }
    }

    run() {
        console.log('=== Duplicate File Scanner ===\n');
        console.log('Scanning for duplicate .md and .json files...\n');
        
        this.scanDirectory(this.projectRoot);
        
        console.log(`Total unique files: ${this.fileHashes.size}`);
        console.log(`Duplicate files found: ${this.duplicates.length}\n`);
        
        if (this.duplicates.length > 0) {
            console.log('=== Duplicate Files ===\n');
            let totalSize = 0;
            
            this.duplicates.forEach((dup, index) => {
                const relOriginal = path.relative(this.projectRoot, dup.original);
                const relDuplicate = path.relative(this.projectRoot, dup.duplicate);
                
                console.log(`${index + 1}. Original: ${relOriginal}`);
                console.log(`   Duplicate: ${relDuplicate}`);
                console.log(`   Size: ${dup.size} bytes\n`);
                
                totalSize += dup.size;
            });
            
            console.log(`Total space wasted: ${(totalSize / 1024).toFixed(2)} KB`);
            console.log(`\nRecommendation: Review and remove unnecessary duplicates.`);
        } else {
            console.log('No duplicate files found!');
        }
    }
}

// Run the scanner
const scanner = new DuplicateScanner();
scanner.run();
