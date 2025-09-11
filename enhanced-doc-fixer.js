// Enhanced Document Self-Improvement System v3.0
// Automatic issue resolution with aggressive fixing

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';

class EnhancedDocumentFixer {
    constructor() {
        this.projectRoot = 'C:\\palantir\\math';
        this.statusFile = path.join(this.projectRoot, 'SELF_IMPROVEMENT_STATUS.json');
        this.fixedCount = 0;
        this.duplicatesRemoved = 0;
        this.linksFixed = 0;
    }

    async loadStatus() {
        try {
            const data = await fs.readFile(this.statusFile, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.log(chalk.yellow('Status file not found'));
            return null;
        }
    }

    async findDuplicates() {
        console.log(chalk.cyan('\n🔍 Finding duplicate files...'));
        const fileHashes = new Map();
        const duplicates = [];
        
        const scanDir = async (dir) => {
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory()) {
                    // Skip node_modules and .git
                    if (!item.name.includes('node_modules') && !item.name.startsWith('.')) {
                        await scanDir(fullPath);
                    }
                } else if (item.name.endsWith('.md')) {
                    try {
                        const content = await fs.readFile(fullPath, 'utf-8');
                        const hash = crypto.createHash('md5').update(content).digest('hex');
                        
                        if (fileHashes.has(hash)) {
                            duplicates.push({
                                original: fileHashes.get(hash),
                                duplicate: fullPath,
                                hash: hash
                            });
                        } else {
                            fileHashes.set(hash, fullPath);
                        }
                    } catch (error) {
                        // Skip unreadable files
                    }
                }
            }
        };
        
        await scanDir(this.projectRoot);
        return duplicates;
    }

    async removeDuplicates() {
        const duplicates = await this.findDuplicates();
        console.log(chalk.yellow(`Found ${duplicates.length} duplicate files`));
        
        // Group duplicates by priority (keep files in main folders, remove backups)
        for (const dup of duplicates) {
            const original = dup.original;
            const duplicate = dup.duplicate;
            
            // Prioritize keeping files NOT in backup/checkpoint folders
            const isOriginalBackup = original.includes('backup') || original.includes('checkpoint');
            const isDuplicateBackup = duplicate.includes('backup') || duplicate.includes('checkpoint');
            
            let fileToRemove = null;
            
            if (isDuplicateBackup && !isOriginalBackup) {
                fileToRemove = duplicate;
            } else if (isOriginalBackup && !isDuplicateBackup) {
                fileToRemove = original;
                // Update the hash map
                dup.original = duplicate;
            } else if (isDuplicateBackup && isOriginalBackup) {
                // Both are backups, remove the older one (based on path length)
                fileToRemove = original.length > duplicate.length ? original : duplicate;
            }
            
            if (fileToRemove) {
                try {
                    await fs.unlink(fileToRemove);
                    this.duplicatesRemoved++;
                    console.log(chalk.red(`  ✗ Removed duplicate: ${path.basename(fileToRemove)}`));
                } catch (error) {
                    console.log(chalk.yellow(`  ⚠ Could not remove: ${path.basename(fileToRemove)}`));
                }
            }
        }
        
        return this.duplicatesRemoved;
    }

    async fixBrokenLinks() {
        console.log(chalk.cyan('\n🔗 Fixing broken links...'));
        const status = await this.loadStatus();
        
        if (!status || !status.issues) return 0;
        
        for (const issue of status.issues) {
            if (issue.type === 'broken_link') {
                try {
                    const content = await fs.readFile(issue.file, 'utf-8');
                    let fixed = content;
                    
                    // Extract the broken link
                    const linkMatch = issue.message.match(/Broken link: (.+)/);
                    if (linkMatch) {
                        const brokenLink = linkMatch[1];
                        const linkName = path.basename(brokenLink, '.md');
                        
                        // Try to find the correct file
                        const correctPath = await this.findCorrectPath(linkName);
                        
                        if (correctPath) {
                            // Calculate relative path from the file location
                            const fileDir = path.dirname(issue.file);
                            const relativePath = path.relative(fileDir, correctPath).replace(/\\/g, '/');
                            
                            // Replace the broken link
                            fixed = fixed.replace(brokenLink, relativePath);
                            await fs.writeFile(issue.file, fixed, 'utf-8');
                            
                            this.linksFixed++;
                            console.log(chalk.green(`  ✓ Fixed link in ${path.basename(issue.file)}: ${brokenLink} → ${relativePath}`));
                        }
                    }
                } catch (error) {
                    console.log(chalk.yellow(`  ⚠ Could not fix: ${issue.file}`));
                }
            }
        }
        
        return this.linksFixed;
    }

    async findCorrectPath(fileName) {
        const searchName = fileName.toLowerCase();
        
        const searchDir = async (dir) => {
            const items = await fs.readdir(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                
                if (item.isDirectory()) {
                    if (!item.name.includes('node_modules') && !item.name.startsWith('.')) {
                        const result = await searchDir(fullPath);
                        if (result) return result;
                    }
                } else if (item.name.toLowerCase().includes(searchName)) {
                    return fullPath;
                }
            }
            return null;
        };
        
        return await searchDir(this.projectRoot);
    }

    async cleanupCheckpoints() {
        console.log(chalk.cyan('\n🧹 Cleaning up old checkpoint files...'));
        const checkpointPattern = /checkpoint_\d{8}T\d+\.md$/;
        let removed = 0;
        
        const cleanDir = async (dir) => {
            try {
                const items = await fs.readdir(dir, { withFileTypes: true });
                
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    
                    if (item.isDirectory() && !item.name.includes('node_modules')) {
                        await cleanDir(fullPath);
                    } else if (checkpointPattern.test(item.name)) {
                        await fs.unlink(fullPath);
                        removed++;
                        console.log(chalk.red(`  ✗ Removed checkpoint: ${item.name}`));
                    }
                }
            } catch (error) {
                // Skip inaccessible directories
            }
        };
        
        await cleanDir(this.projectRoot);
        return removed;
    }

    async run() {
        console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan.bold(' Enhanced Document Fixer v3.0'));
        console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        // 1. Remove duplicates
        const duplicatesRemoved = await this.removeDuplicates();
        
        // 2. Fix broken links
        const linksFixed = await this.fixBrokenLinks();
        
        // 3. Clean up checkpoints
        const checkpointsRemoved = await this.cleanupCheckpoints();
        
        // Summary
        console.log(chalk.green.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green.bold(' Summary'));
        console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green(`  ✓ Duplicates removed: ${duplicatesRemoved}`));
        console.log(chalk.green(`  ✓ Links fixed: ${linksFixed}`));
        console.log(chalk.green(`  ✓ Checkpoints removed: ${checkpointsRemoved}`));
        console.log(chalk.green(`  ✓ Total fixes: ${duplicatesRemoved + linksFixed + checkpointsRemoved}`));
        console.log(chalk.green.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    }
}

// Run the fixer
const fixer = new EnhancedDocumentFixer();
fixer.run().catch(console.error);
