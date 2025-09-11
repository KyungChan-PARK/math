// Aggressive Duplicate Remover v4.0
// Smart duplicate detection and removal with priority system

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';

class AggressiveDuplicateRemover {
    constructor() {
        this.projectRoot = 'C:\\palantir\\math';
        this.removed = 0;
        this.kept = 0;
        
        // Priority folders (keep files here, remove from others)
        this.priorityFolders = [
            'docs-organized',
            'docs',
            'dev-docs'
        ];
        
        // Folders to ignore
        this.ignoreFolders = [
            'node_modules',
            '.git',
            '.venv',
            'venv',
            'venv311',
            'cache',
            '.vs'
        ];
    }

    async scanAllFiles() {
        console.log(chalk.cyan('📂 Scanning all markdown files...'));
        const files = [];
        
        const scanDir = async (dir) => {
            try {
                const items = await fs.readdir(dir, { withFileTypes: true });
                
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    
                    if (item.isDirectory()) {
                        // Skip ignored folders
                        if (!this.ignoreFolders.some(ignore => item.name.includes(ignore))) {
                            await scanDir(fullPath);
                        }
                    } else if (item.name.endsWith('.md')) {
                        const stats = await fs.stat(fullPath);
                        files.push({
                            path: fullPath,
                            name: item.name,
                            size: stats.size,
                            folder: path.dirname(fullPath)
                        });
                    }
                }
            } catch (error) {
                // Skip inaccessible directories
            }
        };
        
        await scanDir(this.projectRoot);
        return files;
    }

    async findDuplicateGroups(files) {
        console.log(chalk.cyan(`🔍 Analyzing ${files.length} files for duplicates...`));
        
        // Group by size first (fast)
        const sizeGroups = {};
        for (const file of files) {
            if (!sizeGroups[file.size]) {
                sizeGroups[file.size] = [];
            }
            sizeGroups[file.size].push(file);
        }
        
        // Only hash files with same size
        const duplicateGroups = [];
        for (const size in sizeGroups) {
            if (sizeGroups[size].length > 1) {
                // Calculate hashes for this group
                const hashMap = {};
                
                for (const file of sizeGroups[size]) {
                    try {
                        const content = await fs.readFile(file.path, 'utf-8');
                        const hash = crypto.createHash('md5').update(content).digest('hex');
                        
                        if (!hashMap[hash]) {
                            hashMap[hash] = [];
                        }
                        hashMap[hash].push(file);
                    } catch (error) {
                        // Skip unreadable files
                    }
                }
                
                // Add groups with duplicates
                for (const hash in hashMap) {
                    if (hashMap[hash].length > 1) {
                        duplicateGroups.push(hashMap[hash]);
                    }
                }
            }
        }
        
        return duplicateGroups;
    }

    getPriority(filePath) {
        // Lower number = higher priority (keep these)
        const relativePath = path.relative(this.projectRoot, filePath).toLowerCase();
        
        // Highest priority: main project files
        if (relativePath.split(path.sep).length === 1) return 1;
        
        // High priority: organized docs
        if (relativePath.includes('docs-organized')) return 2;
        if (relativePath.includes('docs') && !relativePath.includes('backup')) return 3;
        if (relativePath.includes('dev-docs') && !relativePath.includes('backup')) return 4;
        
        // Medium priority: other project folders
        if (relativePath.includes('tasks')) return 5;
        if (relativePath.includes('reports')) return 6;
        
        // Low priority: backups and duplicates
        if (relativePath.includes('backup')) return 10;
        if (relativePath.includes('archive')) return 11;
        if (relativePath.includes('old')) return 12;
        if (relativePath.includes('copy')) return 13;
        if (relativePath.includes('duplicate')) return 14;
        
        // Default
        return 7;
    }

    async removeDuplicates(groups) {
        console.log(chalk.yellow(`\n🗑️  Processing ${groups.length} duplicate groups...`));
        
        for (const group of groups) {
            // Sort by priority (keep lowest priority number)
            group.sort((a, b) => this.getPriority(a.path) - this.getPriority(b.path));
            
            const keep = group[0];
            console.log(chalk.green(`\n✓ Keeping: ${path.relative(this.projectRoot, keep.path)}`));
            this.kept++;
            
            // Remove all others
            for (let i = 1; i < group.length; i++) {
                const remove = group[i];
                try {
                    await fs.unlink(remove.path);
                    this.removed++;
                    console.log(chalk.red(`  ✗ Removed: ${path.relative(this.projectRoot, remove.path)}`));
                } catch (error) {
                    console.log(chalk.yellow(`  ⚠ Could not remove: ${path.relative(this.projectRoot, remove.path)}`));
                }
            }
        }
    }

    async run() {
        console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan.bold(' Aggressive Duplicate Remover v4.0'));
        console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        // 1. Scan all files
        const files = await this.scanAllFiles();
        console.log(chalk.blue(`  Found ${files.length} markdown files`));
        
        // 2. Find duplicate groups
        const groups = await this.findDuplicateGroups(files);
        console.log(chalk.blue(`  Found ${groups.length} duplicate groups`));
        
        // 3. Remove duplicates
        if (groups.length > 0) {
            await this.removeDuplicates(groups);
        }
        
        // Summary
        console.log(chalk.green.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green.bold(' Summary'));
        console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green(`  ✓ Files kept: ${this.kept}`));
        console.log(chalk.green(`  ✓ Duplicates removed: ${this.removed}`));
        console.log(chalk.green(`  ✓ Space saved: ~${Math.round(this.removed * 10)} KB`));
        console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    }
}

// Run
const remover = new AggressiveDuplicateRemover();
remover.run().catch(console.error);
