/**
 *  Documentation Ontology System - JavaScript Version
 * Palantir 개념을 차용한 경량 문서 관리 시스템
 * Created: 2025-01-22
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocumentOntology {
    constructor() {
        this.documents = {};
        this.relationships = [];
        this.dependencies = {};
        this.portAllocations = {};
    }
    
    registerDocument(docId, metadata) {
        this.documents[docId] = {
            id: docId,
            type: metadata.type,
            layer: metadata.layer,
            dependencies: [],
            dependents: [],
            ports: metadata.ports || [],
            status: metadata.status || 'draft',
            version: metadata.version || '3.4.0',
            lastUpdated: new Date().toISOString()
        };
        
        // Port registration
        (metadata.ports || []).forEach(port => {
            if (!this.portAllocations[port]) {
                this.portAllocations[port] = [];
            }
            this.portAllocations[port].push(docId);
        });
        
        this._inferDependencies(docId);
    }
    
    _inferDependencies(docId) {
        const doc = this.documents[docId];
        
        Object.entries(this.documents).forEach(([otherId, otherDoc]) => {
            if (otherId !== docId) {
                // Port conflict detection
                const commonPorts = doc.ports.filter(p => otherDoc.ports.includes(p));
                if (commonPorts.length > 0) {
                    this.addRelationship(docId, otherId, 'PORT_CONFLICT', commonPorts);
                }
                
                // Layer-based dependencies
                if (doc.layer > otherDoc.layer) {
                    this.addRelationship(docId, otherId, 'DEPENDS_ON');
                }
            }
        });
    }
    
    addRelationship(fromDoc, toDoc, relType, metadata = null) {
        this.relationships.push({
            from: fromDoc,
            to: toDoc,
            type: relType,
            metadata: metadata,
            created: new Date().toISOString()
        });
        
        if (relType === 'DEPENDS_ON') {
            if (!this.dependencies[fromDoc]) {
                this.dependencies[fromDoc] = [];
            }
            this.dependencies[fromDoc].push(toDoc);
        }
    }
    
    validateConsistency() {
        const issues = [];
        
        // 1. Port conflict check
        Object.entries(this.portAllocations).forEach(([port, docs]) => {
            if (docs.length > 1) {
                issues.push({
                    type: 'PORT_CONFLICT',
                    severity: 'HIGH',
                    docs: docs,
                    port: parseInt(port),
                    suggestion: `재할당 필요: ${docs.slice(1).join(', ')} -> ${this.suggestFreePort()}`
                });
            }
        });
        
        // 2. Version mismatch check
        const versions = {};
        Object.values(this.documents).forEach(doc => {
            const v = doc.version;
            if (!versions[v]) versions[v] = [];
            versions[v].push(doc.id);
        });
        
        if (Object.keys(versions).length > 1) {
            issues.push({
                type: 'VERSION_MISMATCH',
                severity: 'MEDIUM',
                versions: versions,
                suggestion: `모든 문서를 ${Object.keys(versions).sort().pop()}로 통일`
            });
        }
        
        return issues;
    }
    
    suggestFreePort() {
        const usedPorts = new Set(Object.keys(this.portAllocations).map(p => parseInt(p)));
        for (let port = 8082; port < 9000; port++) {
            if (!usedPorts.has(port)) return port;
        }
        return 9000;
    }
    
    generateDependencyGraph() {
        const lines = ['graph TD'];
        
        // Document nodes
        Object.values(this.documents).forEach(doc => {
            const colors = {
                0: '#ff9999',  // L0 Core - Red
                1: '#99ccff',  // L1 Integration - Blue  
                2: '#99ff99',  // L2 Feature - Green
                3: '#ffff99'   // L3 Implementation - Yellow
            };
            const color = colors[doc.layer] || '#cccccc';
            
            lines.push(`    ${doc.id}["${doc.id}<br/>Layer ${doc.layer}<br/>${doc.type}"]`);
            lines.push(`    style ${doc.id} fill:${color}`);
        });
        
        // Relationship edges
        this.relationships.forEach(rel => {
            if (rel.type === 'DEPENDS_ON') {
                lines.push(`    ${rel.from} --> ${rel.to}`);
            } else if (rel.type === 'PORT_CONFLICT') {
                lines.push(`    ${rel.from} -.->|Port ${rel.metadata[0]}| ${rel.to}`);
            }
        });
        
        return lines.join('\n');
    }
    
    toJSON() {
        return {
            documents: this.documents,
            relationships: this.relationships,
            portAllocations: this.portAllocations,
            statistics: {
                totalDocs: Object.keys(this.documents).length,
                totalRelationships: this.relationships.length,
                portConflicts: this.relationships.filter(r => r.type === 'PORT_CONFLICT').length,
                layers: {
                    L0_Core: Object.values(this.documents).filter(d => d.layer === 0).length,
                    L1_Integration: Object.values(this.documents).filter(d => d.layer === 1).length,
                    L2_Feature: Object.values(this.documents).filter(d => d.layer === 2).length,
                    L3_Implementation: Object.values(this.documents).filter(d => d.layer === 3).length
                }
            }
        };
    }
}

// Main execution
function main() {
    console.log("=".repeat(60));
    console.log(" AE Claude Max Documentation Ontology System");
    console.log("=".repeat(60));
    
    // 1. Initialize Ontology
    const ontology = new DocumentOntology();
    
    // 2. Register existing documents
    const docs = [
        // L0 - Core
        {id: '00-UNIFIED-ARCHITECTURE', type: 'core', layer: 0, ports: [], version: '3.4.0'},
        {id: '01-AGENT-GUIDELINES', type: 'core', layer: 0, ports: [], version: '3.4.0'},
        
        // L1 - Integration  
        {id: '08-REALTIME-INTERACTION', type: 'integration', layer: 1, ports: [8080, 8081], version: '3.4.0'},
        {id: '10-PLATFORM-MIGRATION', type: 'integration', layer: 1, ports: [], version: '3.4.0'},
        {id: '11-WEBSOCKET-PERFORMANCE', type: 'integration', layer: 1, ports: [8080, 8085], version: '3.4.0'},
        {id: '12-WINDOWS-ML-MIGRATION', type: 'integration', layer: 1, ports: [], version: '3.4.0'},
        
        // L2 - Feature
        {id: '06-VIBE-CODING', type: 'feature', layer: 2, ports: [8080], version: '3.4.0'},
        {id: '13-GESTURE-RECOGNITION', type: 'feature', layer: 2, ports: [8081], version: '3.4.0', status: 'COMPLETED'},
        {id: '07-VIDEO-MOTION', type: 'feature', layer: 2, ports: [], version: '3.4.0'},
        
        // L3 - Implementation
        {id: '02-IMPLEMENTATION-PLAN', type: 'implementation', layer: 3, ports: [], version: '3.4.0'},
        {id: '09-IMPLEMENTATION-ROADMAP', type: 'implementation', layer: 3, ports: [], version: '3.4.0'},
        {id: '14-GESTURE-IMPLEMENTATION', type: 'implementation', layer: 3, ports: [8081], version: '3.4.0'}
    ];
    
    console.log("\n 문서 등록 중...");
    docs.forEach(doc => {
        ontology.registerDocument(doc.id, doc);
        console.log(`  ✅ ${doc.id} (Layer ${doc.layer})`);
    });
    
    // 3. Validate consistency
    console.log("\n 일관성 검증 실행...");
    const issues = ontology.validateConsistency();
    
    if (issues.length > 0) {
        console.log(`\n️  발견된 문제: ${issues.length}개`);
        issues.forEach(issue => {
            console.log(`\n  [${issue.severity}] ${issue.type}`);
            if (issue.type === 'PORT_CONFLICT') {
                console.log(`    포트 ${issue.port}: ${issue.docs.join(' vs ')}`);
                console.log(`     ${issue.suggestion}`);
            } else if (issue.type === 'VERSION_MISMATCH') {
                console.log(`    버전 분포:`, issue.versions);
                console.log(`     ${issue.suggestion}`);
            }
        });
    } else {
        console.log("  ✅ 문제 없음!");
    }
    
    // 4. Output statistics
    const stats = ontology.toJSON().statistics;
    console.log("\n Ontology 통계:");
    console.log(`  총 문서: ${stats.totalDocs}`);
    console.log(`  총 관계: ${stats.totalRelationships}`);
    console.log(`  포트 충돌: ${stats.portConflicts}`);
    console.log(`  레이어 분포:`);
    Object.entries(stats.layers).forEach(([layer, count]) => {
        console.log(`    - ${layer}: ${count}`);
    });
    
    // 5. Generate dependency graph
    console.log("\n 의존성 그래프 생성...");
    const graph = ontology.generateDependencyGraph();
    
    // Save graph
    const graphPath = path.join(__dirname, 'DEPENDENCY-GRAPH.md');
    fs.writeFileSync(graphPath, 
        "# 문서 의존성 그래프\n\n```mermaid\n" + graph + "\n```\n",
        'utf8'
    );
    console.log(`  ✅ 그래프 저장: ${graphPath}`);
    
    // 6. Save JSON output
    const jsonPath = path.join(__dirname, 'docs-ontology.json');
    fs.writeFileSync(jsonPath, JSON.stringify(ontology.toJSON(), null, 2), 'utf8');
    console.log(`  ✅ Ontology 저장: ${jsonPath}`);
    
    console.log("\n✨ Phase 1 완료! 다음 단계: 자동 모니터링 시스템 구축");
}

// Run main
main();

export { DocumentOntology };
