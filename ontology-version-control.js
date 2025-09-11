/**
 * Ontology Version Control System
 * Tracks changes, maintains history, and provides rollback capabilities
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class OntologyVersionControl {
    constructor(config = {}) {
        this.basePath = config.basePath || __dirname;
        this.ontologyFile = path.join(this.basePath, 'ontology-state.json');
        this.versionsDir = path.join(this.basePath, 'ontology-versions');
        this.historyFile = path.join(this.versionsDir, 'version-history.json');
        this.maxVersions = config.maxVersions || 50;
        
        // Initialize version directory
        this.initializeVersionControl();
    }
    
    // Initialize version control system
    async initializeVersionControl() {
        try {
            await fs.promises.mkdir(this.versionsDir, { recursive: true });
            
            // Load or create history
            try {
                const historyData = await fs.promises.readFile(this.historyFile, 'utf8');
                this.history = JSON.parse(historyData);
            } catch {
                this.history = {
                    versions: [],
                    currentVersion: null,
                    created: new Date().toISOString()
                };
                await this.saveHistory();
            }
            
            console.log(`✅ Ontology version control initialized with ${this.history.versions.length} versions`);
        } catch (error) {
            console.error('Failed to initialize version control:', error);
        }
    }
}
    // Create a new version snapshot
    async createSnapshot(metadata = {}) {
        try {
            // Read current ontology state
            const currentState = await fs.promises.readFile(this.ontologyFile, 'utf8');
            const ontology = JSON.parse(currentState);
            
            // Generate version ID
            const versionId = this.generateVersionId();
            const timestamp = new Date().toISOString();
            
            // Calculate hash for integrity
            const hash = crypto.createHash('sha256').update(currentState).digest('hex');
            
            // Create version entry
            const version = {
                id: versionId,
                timestamp: timestamp,
                hash: hash,
                metadata: {
                    ...metadata,
                    entities: ontology.entities?.total || 0,
                    nodes: ontology.knowledge_graph?.nodes || 0,
                    edges: ontology.knowledge_graph?.edges || 0,
                    author: metadata.author || 'system',
                    message: metadata.message || 'Auto-snapshot'
                }
            };
            
            // Save snapshot file
            const snapshotPath = path.join(this.versionsDir, `${versionId}.json`);
            await fs.promises.writeFile(snapshotPath, currentState);
            
            // Update history
            this.history.versions.push(version);
            this.history.currentVersion = versionId;
            
            // Cleanup old versions if needed
            await this.cleanupOldVersions();
            
            // Save history
            await this.saveHistory();
            
            console.log(`📸 Created snapshot: ${versionId}`);
            return version;
            
        } catch (error) {
            console.error('Failed to create snapshot:', error);
            throw error;
        }
    }
    
    // Rollback to a specific version
    async rollback(versionId) {
        try {
            const version = this.history.versions.find(v => v.id === versionId);
            
            if (!version) {
                throw new Error(`Version ${versionId} not found`);
            }
            
            // Create backup of current state before rollback
            await this.createSnapshot({
                message: `Pre-rollback backup (rolling back to ${versionId})`,
                author: 'rollback-system'
            });
            
            // Load version snapshot
            const snapshotPath = path.join(this.versionsDir, `${versionId}.json`);
            const snapshotData = await fs.promises.readFile(snapshotPath, 'utf8');
            
            // Verify integrity
            const hash = crypto.createHash('sha256').update(snapshotData).digest('hex');
            if (hash !== version.hash) {
                throw new Error('Version integrity check failed');
            }
            
            // Apply rollback
            await fs.promises.writeFile(this.ontologyFile, snapshotData);
            
            // Update history
            this.history.currentVersion = versionId;
            this.history.versions.push({
                id: this.generateVersionId(),
                timestamp: new Date().toISOString(),
                hash: hash,
                metadata: {
                    ...version.metadata,
                    message: `Rolled back to ${versionId}`,
                    author: 'rollback-system',
                    rollbackFrom: this.history.currentVersion
                }
            });
            
            await this.saveHistory();
            
            console.log(`✅ Rolled back to version: ${versionId}`);
            return true;
            
        } catch (error) {
            console.error('Rollback failed:', error);
            throw error;
        }
    }
    // Compare two versions
    async compareVersions(versionId1, versionId2) {
        try {
            const v1Path = path.join(this.versionsDir, `${versionId1}.json`);
            const v2Path = path.join(this.versionsDir, `${versionId2}.json`);
            
            const v1Data = JSON.parse(await fs.promises.readFile(v1Path, 'utf8'));
            const v2Data = JSON.parse(await fs.promises.readFile(v2Path, 'utf8'));
            
            const comparison = {
                version1: versionId1,
                version2: versionId2,
                changes: {
                    entities: {
                        before: v1Data.entities?.total || 0,
                        after: v2Data.entities?.total || 0,
                        delta: (v2Data.entities?.total || 0) - (v1Data.entities?.total || 0)
                    },
                    nodes: {
                        before: v1Data.knowledge_graph?.nodes || 0,
                        after: v2Data.knowledge_graph?.nodes || 0,
                        delta: (v2Data.knowledge_graph?.nodes || 0) - (v1Data.knowledge_graph?.nodes || 0)
                    },
                    edges: {
                        before: v1Data.knowledge_graph?.edges || 0,
                        after: v2Data.knowledge_graph?.edges || 0,
                        delta: (v2Data.knowledge_graph?.edges || 0) - (v1Data.knowledge_graph?.edges || 0)
                    }
                }
            };
            
            return comparison;
            
        } catch (error) {
            console.error('Comparison failed:', error);
            throw error;
        }
    }
    
    // Get version history
    getHistory(limit = 10) {
        return {
            current: this.history.currentVersion,
            versions: this.history.versions.slice(-limit).reverse(),
            total: this.history.versions.length
        };
    }
    
    // Generate unique version ID
    generateVersionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `v${timestamp}-${random}`;
    }
    
    // Save history to file
    async saveHistory() {
        await fs.promises.writeFile(
            this.historyFile,
            JSON.stringify(this.history, null, 2)
        );
    }
    
    // Cleanup old versions
    async cleanupOldVersions() {
        if (this.history.versions.length > this.maxVersions) {
            const toRemove = this.history.versions.length - this.maxVersions;
            const removedVersions = this.history.versions.splice(0, toRemove);
            
            // Delete snapshot files
            for (const version of removedVersions) {
                const snapshotPath = path.join(this.versionsDir, `${version.id}.json`);
                try {
                    await fs.promises.unlink(snapshotPath);
                } catch (error) {
                    console.warn(`Failed to delete old snapshot: ${version.id}`);
                }
            }
            
            console.log(`🗑️ Cleaned up ${toRemove} old versions`);
        }
    }
    
    // Export version for backup
    async exportVersion(versionId, exportPath) {
        try {
            const version = this.history.versions.find(v => v.id === versionId);
            if (!version) {
                throw new Error(`Version ${versionId} not found`);
            }
            
            const snapshotPath = path.join(this.versionsDir, `${versionId}.json`);
            const snapshotData = await fs.promises.readFile(snapshotPath, 'utf8');
            
            const exportData = {
                version: version,
                ontology: JSON.parse(snapshotData),
                exported: new Date().toISOString()
            };
            
            await fs.promises.writeFile(
                exportPath,
                JSON.stringify(exportData, null, 2)
            );
            
            console.log(`📦 Exported version ${versionId} to ${exportPath}`);
            return true;
            
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }
}

export default OntologyVersionControl;