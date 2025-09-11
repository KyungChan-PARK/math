"""
 Consistency Keeper - [KR] [KR] [KR] [KR] [KR]
Automatically fixes port conflicts and maintains document consistency
Created: 2025-01-22
"""

import json
import re
from pathlib import Path
from datetime import datetime
import asyncio
import os

class ConsistencyKeeper:
    def __init__(self):
        self.dev_docs_path = Path(r"C:\palantir\math\dev-docs")
        self.ontology_path = self.dev_docs_path / "docs-ontology.json"
        self.port_mapping = {}
        self.fixed_issues = []
        
    def load_ontology(self):
        """Load current ontology state"""
        with open(self.ontology_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def find_port_conflicts(self, ontology):
        """Identify all port conflicts"""
        conflicts = []
        port_allocations = ontology.get('port_allocations', {})
        
        for port, docs in port_allocations.items():
            if len(docs) > 1:
                conflicts.append({
                    'port': int(port),
                    'documents': docs,
                    'primary': docs[0],  # Keep first doc, reassign others
                    'to_reassign': docs[1:]
                })
        return conflicts
    
    def allocate_new_ports(self, conflicts):
        """Allocate new ports for conflicting documents"""
        used_ports = set()
        
        # Collect all currently used ports
        ontology = self.load_ontology()
        for port in ontology.get('port_allocations', {}).keys():
            used_ports.add(int(port))
        
        # Port allocation plan
        allocation_plan = []
        next_port = 8082
        
        for conflict in conflicts:
            for doc in conflict['to_reassign']:
                # Find next available port
                while next_port in used_ports:
                    next_port += 1
                
                allocation_plan.append({
                    'document': doc,
                    'old_port': conflict['port'],
                    'new_port': next_port
                })
                used_ports.add(next_port)
                next_port += 1
        
        return allocation_plan
    
    def update_document_ports(self, allocation_plan):
        """Update port references in actual document files"""
        for allocation in allocation_plan:
            doc_id = allocation['document']
            old_port = allocation['old_port']
            new_port = allocation['new_port']
            
            # Find corresponding .md file
            doc_files = [
                '06-VIBE-CODING-METHODOLOGY.md',
                '08-REALTIME-INTERACTION.md', 
                '11-WEBSOCKET-PERFORMANCE-OPTIMIZATION.md',
                '13-GESTURE-RECOGNITION-ARCHITECTURE.md',
                '14-GESTURE-IMPLEMENTATION-ROADMAP.md'
            ]
            
            for doc_file in doc_files:
                if doc_id.replace('-', '_').upper() in doc_file.upper().replace('-', '_'):
                    file_path = self.dev_docs_path / doc_file
                    if file_path.exists():
                        self.update_port_in_file(file_path, old_port, new_port)
                        print(f"   Updated {doc_file}: port {old_port} → {new_port}")
                        self.fixed_issues.append({
                            'type': 'PORT_UPDATE',
                            'file': doc_file,
                            'old_port': old_port,
                            'new_port': new_port
                        })
    
    def update_port_in_file(self, file_path, old_port, new_port):
        """Replace port references in a file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to match port references
        patterns = [
            (f'port: {old_port}', f'port: {new_port}'),
            (f'PORT: {old_port}', f'PORT: {new_port}'),
            (f':{old_port}', f':{new_port}'),
            (f'port {old_port}', f'port {new_port}'),
            (f'Port {old_port}', f'Port {new_port}')
        ]
        
        for old_pattern, new_pattern in patterns:
            content = content.replace(old_pattern, new_pattern)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def generate_fix_report(self):
        """Generate report of fixes applied"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'fixes_applied': len(self.fixed_issues),
            'details': self.fixed_issues
        }
        
        report_path = self.dev_docs_path / 'CONSISTENCY-FIX-REPORT.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)
        
        return report_path
    
    def auto_fix_all(self):
        """Main auto-fix routine"""
        print("\n Starting Automatic Consistency Fixes...")
        print("=" * 60)
        
        # Load current state
        ontology = self.load_ontology()
        
        # Find conflicts
        conflicts = self.find_port_conflicts(ontology)
        
        if not conflicts:
            print("✅ No port conflicts found!")
            return
        
        print(f"\n️  Found {len(conflicts)} port conflicts")
        
        # Generate allocation plan
        allocation_plan = self.allocate_new_ports(conflicts)
        
        print(f"\n Port Reallocation Plan:")
        for plan in allocation_plan:
            print(f"  • {plan['document']}: {plan['old_port']} → {plan['new_port']}")
        
        # Apply fixes
        print(f"\n Applying fixes...")
        self.update_document_ports(allocation_plan)
        
        # Generate report
        report_path = self.generate_fix_report()
        print(f"\n Fix report saved: {report_path}")
        
        # Update consistency marker
        marker_path = self.dev_docs_path / '.consistency_fixed'
        with open(marker_path, 'w') as f:
            f.write(datetime.now().isoformat())
        
        print(f"\n✨ Consistency fixes completed! Fixed {len(self.fixed_issues)} issues.")
        return allocation_plan


def main():
    """Run consistency keeper"""
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    keeper = ConsistencyKeeper()
    keeper.auto_fix_all()
    
    # Re-run ontology check to verify fixes
    print("\n Verifying fixes...")
    os.system("py docs-ontology.py")


if __name__ == "__main__":
    main()
