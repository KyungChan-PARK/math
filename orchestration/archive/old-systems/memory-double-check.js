/**
 * Memory Double Check System
 * 모든 작업을 자동으로 메모리에 저장하고 검증하는 시스템
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import crypto from 'crypto';

class MemoryDoubleCheck {
    constructor() {
        this.workLog = [];
        this.checkpointFile = '.memory-checkpoint.json';
        this.verificationFile = '.memory-verification.json';
        this.autoSaveInterval = null;
        this.lastSavedHash = '';
    }
    
    async initialize() {
        console.log(chalk.blue.bold(' Memory Double Check System Initializing...'));
        
        // Load previous checkpoint
        await this.loadCheckpoint();
        
        // Start auto-save every 30 seconds
        this.startAutoSave();
        
        // Register shutdown handler
        this.registerShutdownHandler();
        
        console.log(chalk.green('✅ Memory system ready with double verification\n'));
    }
    
    // 모든 작업을 자동 기록
    async recordWork(category, description, details = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            category,
            description,
            details,
            verified: false
        };
        
        this.workLog.push(entry);
        console.log(chalk.yellow(` Recorded: ${description}`));
        
        // Immediate save for critical work
        if (category === 'CRITICAL' || category === 'ACHIEVEMENT') {
            await this.saveToMemory();
        }
        
        return entry;
    }
    
    // 메모리 저장 with verification
    async saveToMemory() {
        try {
            const currentHash = this.generateHash(this.workLog);
            
            // Skip if no changes
            if (currentHash === this.lastSavedHash) {
                return { status: 'unchanged' };
            }
            
            // Save checkpoint
            await fs.writeFile(
                this.checkpointFile,
                JSON.stringify({
                    timestamp: new Date().toISOString(),
                    entries: this.workLog,
                    hash: currentHash
                }, null, 2)
            );
            
            // Double check: Read back and verify
            const verification = await this.verifyCheckpoint();
            
            if (verification.success) {
                this.lastSavedHash = currentHash;
                console.log(chalk.green(`✅ Memory saved and verified: ${this.workLog.length} entries`));
                
                // Mark entries as verified
                this.workLog.forEach(entry => entry.verified = true);
                
                return {
                    status: 'saved',
                    entries: this.workLog.length,
                    hash: currentHash
                };
            } else {
                console.error(chalk.red('❌ Memory verification failed!'));
                return {
                    status: 'verification_failed',
                    error: verification.error
                };
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Memory save error:'), error);
            return {
                status: 'error',
                error: error.message
            };
        }
    }
    
    // Verification - read back and compare
    async verifyCheckpoint() {
        try {
            const data = await fs.readFile(this.checkpointFile, 'utf8');
            const checkpoint = JSON.parse(data);
            
            // Verify hash matches
            const calculatedHash = this.generateHash(checkpoint.entries);
            const hashMatch = calculatedHash === checkpoint.hash;
            
            // Verify entry count
            const countMatch = checkpoint.entries.length === this.workLog.length;
            
            // Save verification result
            await fs.writeFile(
                this.verificationFile,
                JSON.stringify({
                    timestamp: new Date().toISOString(),
                    hashMatch,
                    countMatch,
                    entriesVerified: checkpoint.entries.length,
                    success: hashMatch && countMatch
                }, null, 2)
            );
            
            return {
                success: hashMatch && countMatch,
                hashMatch,
                countMatch
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Generate hash for change detection
    generateHash(data) {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex')
            .substring(0, 16);
    }
    
    // Load previous checkpoint
    async loadCheckpoint() {
        try {
            const data = await fs.readFile(this.checkpointFile, 'utf8');
            const checkpoint = JSON.parse(data);
            this.workLog = checkpoint.entries || [];
            this.lastSavedHash = checkpoint.hash || '';
            
            console.log(chalk.cyan(` Loaded ${this.workLog.length} previous entries`));
        } catch (error) {
            console.log(chalk.yellow(' Starting fresh memory log'));
            this.workLog = [];
        }
    }
    
    // Auto-save every 30 seconds
    startAutoSave() {
        this.autoSaveInterval = setInterval(async () => {
            const unverified = this.workLog.filter(e => !e.verified).length;
            
            if (unverified > 0) {
                console.log(chalk.cyan(`\n⏱️ Auto-saving ${unverified} unverified entries...`));
                await this.saveToMemory();
            }
        }, 30000);
    }
    
    // Shutdown handler - CRITICAL
    registerShutdownHandler() {
        const saveBeforeExit = async () => {
            console.log(chalk.yellow('\n️ Session ending - Final memory save...'));
            
            // Double save for safety
            await this.saveToMemory();
            await this.saveToMemory(); // Second save for verification
            
            // Generate summary
            const summary = this.generateSummary();
            console.log(chalk.blue.bold('\n Session Summary:'));
            console.log(summary);
            
            // Export to Claude memory format
            await this.exportToClaudeMemory();
            
            process.exit(0);
        };
        
        process.on('SIGINT', saveBeforeExit);
        process.on('SIGTERM', saveBeforeExit);
        process.on('beforeExit', saveBeforeExit);
    }
    
    // Generate session summary
    generateSummary() {
        const categories = {};
        this.workLog.forEach(entry => {
            categories[entry.category] = (categories[entry.category] || 0) + 1;
        });
        
        return {
            totalEntries: this.workLog.length,
            verified: this.workLog.filter(e => e.verified).length,
            categories,
            firstEntry: this.workLog[0]?.timestamp,
            lastEntry: this.workLog[this.workLog.length - 1]?.timestamp
        };
    }
    
    // Export to Claude memory format
    async exportToClaudeMemory() {
        const memoryExport = {
            entityName: 'Session_Work_' + new Date().toISOString().split('T')[0],
            observations: this.workLog.map(entry => 
                `${entry.timestamp}: ${entry.category} - ${entry.description}`
            )
        };
        
        await fs.writeFile(
            '.claude-memory-export.json',
            JSON.stringify(memoryExport, null, 2)
        );
        
        console.log(chalk.green('✅ Memory exported for Claude'));
    }
}

// Singleton instance
const memorySystem = new MemoryDoubleCheck();

// Auto-initialize on import
memorySystem.initialize().catch(console.error);

export default memorySystem;
