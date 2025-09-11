"""
 Documentation Ontology System - 1[KR] [KR]
Palantir [KR] [KR] [KR] [KR] [KR] [KR]
Created: 2025-01-22
"""

import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Tuple, Optional

class DocumentOntology:
    """1[KR] [KR] [KR] [KR] [KR] [KR]"""
    
    def __init__(self):
        self.documents: Dict = {}
        self.relationships: List = []
        self.dependencies: Dict = {}
        self.validation_rules: List = []
        self.port_allocations: Dict = {}
        
    def register_document(self, doc_id: str, metadata: Dict):
        """[KR] [KR] [KR] [KR] [KR] [KR]"""
        self.documents[doc_id] = {
            'id': doc_id,
            'type': metadata['type'],  # core, feature, implementation, config
            'layer': metadata['layer'], # L0(core), L1(integration), L2(feature)
            'dependencies': [],
            'dependents': [],
            'ports': metadata.get('ports', []),
            'status': metadata.get('status', 'draft'),
            'auto_update': metadata.get('auto_update', True),
            'last_updated': datetime.now().isoformat(),
            'version': metadata.get('version', '3.4.0')
        }
        
        # [KR] [KR]
        for port in metadata.get('ports', []):
            if port not in self.port_allocations:
                self.port_allocations[port] = []
            self.port_allocations[port].append(doc_id)
        
        # [KR] [KR] [KR]
        self._infer_dependencies(doc_id)
    
    def _infer_dependencies(self, doc_id: str):
        """[KR], [KR], [KR] [KR] [KR] [KR] [KR]"""
        doc = self.documents[doc_id]
        
        for other_id, other_doc in self.documents.items():
            if other_id != doc_id:
                # [KR] [KR] [KR]
                common_ports = set(doc['ports']) & set(other_doc['ports'])
                if common_ports:
                    self.add_relationship(doc_id, other_id, 'PORT_CONFLICT', list(common_ports))
                
                # [KR] [KR] [KR]
                if doc['layer'] > other_doc['layer']:
                    self.add_relationship(doc_id, other_id, 'DEPENDS_ON')
    
    def add_relationship(self, from_doc: str, to_doc: str, rel_type: str, metadata: Optional[any] = None):
        """[KR] [KR] [KR] [KR]"""
        relationship = {
            'from': from_doc,
            'to': to_doc,
            'type': rel_type,
            'metadata': metadata,
            'created': datetime.now().isoformat()
        }
        self.relationships.append(relationship)
        
        # [KR] [KR]
        if rel_type == 'DEPENDS_ON':
            if from_doc not in self.dependencies:
                self.dependencies[from_doc] = []
            self.dependencies[from_doc].append(to_doc)
    
    def validate_consistency(self) -> List[Dict]:
        """[KR] [KR] [KR] [KR]"""
        issues = []
        
        # 1. [KR] [KR] [KR]
        for port, docs in self.port_allocations.items():
            if len(docs) > 1:
                issues.append({
                    'type': 'PORT_CONFLICT',
                    'severity': 'HIGH',
                    'docs': docs,
                    'port': port,
                    'suggestion': f'[KR] [KR]: {docs[1:]} -> {self.suggest_free_port()}'
                })
        
        # 2. [KR] [KR] [KR]
        for doc_id in self.documents:
            if self._has_circular_dependency(doc_id, []):
                issues.append({
                    'type': 'CIRCULAR_DEPENDENCY',
                    'severity': 'CRITICAL',
                    'doc': doc_id,
                    'suggestion': '[KR] [KR] [KR] [KR]'
                })
        
        # 3. [KR] [KR] [KR]
        versions = {}
        for doc_id, doc in self.documents.items():
            v = doc.get('version', 'unknown')
            if v not in versions:
                versions[v] = []
            versions[v].append(doc_id)
        
        if len(versions) > 1:
            issues.append({
                'type': 'VERSION_MISMATCH',
                'severity': 'MEDIUM',
                'versions': versions,
                'suggestion': f'[KR] [KR] {max(versions.keys())}[KR] [KR]'
            })
        
        # 4. [KR] [KR] [KR] ([KR] [KR])
        for doc_id, doc in self.documents.items():
            if doc['layer'] > 0:  # Core [KR]
                has_dependency = False
                for rel in self.relationships:
                    if rel['from'] == doc_id and rel['type'] == 'DEPENDS_ON':
                        has_dependency = True
                        break
                
                if not has_dependency:
                    issues.append({
                        'type': 'ORPHAN_DOCUMENT',
                        'severity': 'LOW',
                        'doc': doc_id,
                        'suggestion': 'Core [KR] Integration [KR] connection [KR]'
                    })
        
        return issues
    
    def _has_circular_dependency(self, doc_id: str, visited: List[str]) -> bool:
        """[KR] [KR] [KR]"""
        if doc_id in visited:
            return True
        
        visited.append(doc_id)
        
        if doc_id in self.dependencies:
            for dep in self.dependencies[doc_id]:
                if self._has_circular_dependency(dep, visited.copy()):
                    return True
        
        return False
    
    def suggest_free_port(self) -> int:
        """[KR] [KR] [KR] [KR]"""
        used_ports = set(self.port_allocations.keys())
        for port in range(8082, 9000):
            if port not in used_ports:
                return port
        return 9000
    
    def generate_dependency_graph(self) -> str:
        """Mermaid [KR] [KR] [KR] [KR]"""
        graph = ["graph TD"]
        
        # [KR] [KR]
        for doc_id, doc in self.documents.items():
            style = {
                0: "fill:#ff9999",  # L0 Core - Red
                1: "fill:#99ccff",  # L1 Integration - Blue
                2: "fill:#99ff99",  # L2 Feature - Green
                3: "fill:#ffff99"   # L3 Implementation - Yellow
            }.get(doc['layer'], "fill:#cccccc")
            
            graph.append(f'    {doc_id}["{doc_id}<br/>Layer {doc["layer"]}<br/>{doc["type"]}"]')
            graph.append(f'    style {doc_id} {style}')
        
        # [KR] [KR]
        for rel in self.relationships:
            if rel['type'] == 'DEPENDS_ON':
                graph.append(f'    {rel["from"]} --> {rel["to"]}')
            elif rel['type'] == 'PORT_CONFLICT':
                graph.append(f'    {rel["from"]} -.->|Port {rel["metadata"][0]}| {rel["to"]}')
        
        return "\n".join(graph)
    
    def to_json(self) -> str:
        """Ontology[KR] JSON[KR] [KR]"""
        return json.dumps({
            'documents': self.documents,
            'relationships': self.relationships,
            'port_allocations': self.port_allocations,
            'statistics': {
                'total_docs': len(self.documents),
                'total_relationships': len(self.relationships),
                'port_conflicts': len([r for r in self.relationships if r['type'] == 'PORT_CONFLICT']),
                'layers': {
                    'L0_Core': len([d for d in self.documents.values() if d['layer'] == 0]),
                    'L1_Integration': len([d for d in self.documents.values() if d['layer'] == 1]),
                    'L2_Feature': len([d for d in self.documents.values() if d['layer'] == 2]),
                    'L3_Implementation': len([d for d in self.documents.values() if d['layer'] == 3])
                }
            }
        }, indent=2)


def main():
    """Phase 1: [KR] [KR] Ontology [KR] [KR] [KR]"""
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    print("=" * 60)
    print(" AE Claude Max Documentation Ontology System")
    print("=" * 60)
    
    # 1. Ontology [KR]
    ontology = DocumentOntology()
    
    # 2. [KR] [KR] [KR]
    docs = [
        # L0 - Core
        {'id': '00-UNIFIED-ARCHITECTURE', 'type': 'core', 'layer': 0, 'ports': [], 'version': '3.4.0'},
        {'id': '01-AGENT-GUIDELINES', 'type': 'core', 'layer': 0, 'ports': [], 'version': '3.4.0'},
        
        # L1 - Integration
        {'id': '08-REALTIME-INTERACTION', 'type': 'integration', 'layer': 1, 'ports': [8080, 8081], 'version': '3.4.0'},
        {'id': '10-PLATFORM-MIGRATION', 'type': 'integration', 'layer': 1, 'ports': [], 'version': '3.4.0'},
        {'id': '11-WEBSOCKET-PERFORMANCE', 'type': 'integration', 'layer': 1, 'ports': [8080, 8085], 'version': '3.4.0'},
        {'id': '12-WINDOWS-ML-MIGRATION', 'type': 'integration', 'layer': 1, 'ports': [], 'version': '3.4.0'},
        
        # L2 - Feature
        {'id': '06-VIBE-CODING', 'type': 'feature', 'layer': 2, 'ports': [8080], 'version': '3.4.0'},
        {'id': '13-GESTURE-RECOGNITION', 'type': 'feature', 'layer': 2, 'ports': [8081], 'version': '3.4.0', 'status': 'COMPLETED'},
        {'id': '07-VIDEO-MOTION', 'type': 'feature', 'layer': 2, 'ports': [], 'version': '3.4.0'},
        
        # L3 - Implementation
        {'id': '02-IMPLEMENTATION-PLAN', 'type': 'implementation', 'layer': 3, 'ports': [], 'version': '3.4.0'},
        {'id': '09-IMPLEMENTATION-ROADMAP', 'type': 'implementation', 'layer': 3, 'ports': [], 'version': '3.4.0'},
        {'id': '14-GESTURE-IMPLEMENTATION', 'type': 'implementation', 'layer': 3, 'ports': [8081], 'version': '3.4.0'},
    ]
    
    print("\n [KR] [KR] [KR]...")
    for doc in docs:
        ontology.register_document(doc['id'], doc)
        print(f"  ✅ {doc['id']} (Layer {doc['layer']})")
    
    # 3. [KR] [KR]
    print("\n [KR] [KR] [KR]...")
    issues = ontology.validate_consistency()
    
    if issues:
        print(f"\n️  [KR] [KR]: {len(issues)}[KR]")
        for issue in issues:
            print(f"\n  [{issue['severity']}] {issue['type']}")
            if issue['type'] == 'PORT_CONFLICT':
                print(f"    [KR] {issue['port']}: {' vs '.join(issue['docs'])}")
                print(f"     {issue['suggestion']}")
            elif issue['type'] == 'VERSION_MISMATCH':
                print(f"    [KR] [KR]: {issue['versions']}")
                print(f"     {issue['suggestion']}")
            else:
                print(f"    [KR]: {issue.get('doc', issue.get('docs', 'N/A'))}")
                print(f"     {issue['suggestion']}")
    else:
        print("  ✅ [KR] [KR]!")
    
    # 4. [KR] [KR]
    stats = json.loads(ontology.to_json())['statistics']
    print("\n Ontology [KR]:")
    print(f"  [KR] [KR]: {stats['total_docs']}")
    print(f"  [KR] [KR]: {stats['total_relationships']}")
    print(f"  [KR] [KR]: {stats['port_conflicts']}")
    print(f"  [KR] [KR]:")
    for layer, count in stats['layers'].items():
        print(f"    - {layer}: {count}")
    
    # 5. [KR] [KR] [KR]
    print("\n [KR] [KR] [KR]...")
    graph = ontology.generate_dependency_graph()
    
    # [KR] [KR]
    graph_path = Path(__file__).parent / "DEPENDENCY-GRAPH.md"
    with open(graph_path, 'w', encoding='utf-8') as f:
        f.write("# [KR] [KR] [KR]\n\n")
        f.write("```mermaid\n")
        f.write(graph)
        f.write("\n```\n")
    print(f"  ✅ [KR] [KR]: {graph_path}")
    
    # 6. JSON [KR] [KR]
    json_path = Path(__file__).parent / "docs-ontology.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        f.write(ontology.to_json())
    print(f"  ✅ Ontology [KR]: {json_path}")
    
    print("\n✨ Phase 1 complete! [KR] [KR]: [KR] [KR] [KR] [KR]")


if __name__ == "__main__":
    main()
