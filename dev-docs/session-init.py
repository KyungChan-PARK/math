"""
 AI Agent Session Initialization System
Auto-loads critical configurations and documents
Created: 2025-09-04
"""

import json
import sys
import io
from pathlib import Path
from datetime import datetime

class SessionInitializer:
    def __init__(self):
        # UTF-8 encoding fix
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        
        self.dev_docs = Path(r"C:\palantir\math\dev-docs")
        self.memory = {}
        self.ontology = None
        self.issues = []
        
    def load_memory(self):
        """Load critical system configurations from memory"""
        self.memory = {
            'python': {
                'command': 'py',  # NOT 'python'
                'version': '3.13.7',
                'encoding_fix': 'sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")'
            },
            'ports': {
                '08-REALTIME-INTERACTION': [8080, 8081],
                '11-WEBSOCKET-PERFORMANCE': [8082, 8085],
                '06-VIBE-CODING': [8083],
                '13-GESTURE-RECOGNITION': [8084],
                '14-GESTURE-IMPLEMENTATION': [8086]
            },
            'ontology': {
                'total_docs': 12,
                'layers': {
                    'L0_Core': ['00-UNIFIED-ARCHITECTURE', '01-AGENT-GUIDELINES'],
                    'L1_Integration': ['08-REALTIME-INTERACTION', '10-PLATFORM-MIGRATION', 
                                      '11-WEBSOCKET-PERFORMANCE', '12-WINDOWS-ML-MIGRATION'],
                    'L2_Feature': ['06-VIBE-CODING', '13-GESTURE-RECOGNITION', '07-VIDEO-MOTION'],
                    'L3_Implementation': ['02-IMPLEMENTATION-PLAN', '09-IMPLEMENTATION-ROADMAP', 
                                         '14-GESTURE-IMPLEMENTATION']
                }
            }
        }
        return self.memory
    
    def check_critical_files(self):
        """Check existence of critical documentation"""
        critical_files = [
            'index.md',
            'docs-ontology.py',
            'docs-ontology.json',
            'DEPENDENCY-GRAPH.md'
        ]
        
        for file in critical_files:
            path = self.dev_docs / file
            if not path.exists():
                self.issues.append(f"Missing: {file}")
            else:
                print(f"  ✅ {file}")
        
        return len(self.issues) == 0
    
    def load_ontology(self):
        """Load document ontology if available"""
        ontology_file = self.dev_docs / 'docs-ontology.json'
        if ontology_file.exists():
            with open(ontology_file, 'r', encoding='utf-8') as f:
                self.ontology = json.load(f)
            return True
        return False
    
    def verify_port_consistency(self):
        """Check for port conflicts"""
        if not self.ontology:
            return False
            
        port_allocations = self.ontology.get('port_allocations', {})
        conflicts = []
        
        for port, docs in port_allocations.items():
            if len(docs) > 1:
                conflicts.append({
                    'port': port,
                    'documents': docs
                })
        
        if conflicts:
            print(f"\n️  Port conflicts detected: {len(conflicts)}")
            for conflict in conflicts:
                print(f"  Port {conflict['port']}: {', '.join(conflict['documents'])}")
            return False
        
        return True
    
    def generate_session_report(self):
        """Generate session initialization report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'python_config': self.memory['python'],
            'port_allocations': self.memory['ports'],
            'ontology_status': 'Loaded' if self.ontology else 'Not Available',
            'issues': self.issues
        }
        
        report_path = self.dev_docs / '.session_init.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)
        
        return report
    
    def initialize(self):
        """Main initialization routine"""
        print("=" * 60)
        print(" AI Agent Session Initialization")
        print("=" * 60)
        
        # Load memory
        print("\n Loading Memory...")
        self.load_memory()
        print(f"  Python: {self.memory['python']['command']} v{self.memory['python']['version']}")
        print(f"  Port allocations: {len(self.memory['ports'])} documents")
        
        # Check files
        print("\n Checking Critical Files...")
        files_ok = self.check_critical_files()
        
        # Load ontology
        print("\n Loading Ontology...")
        if self.load_ontology():
            stats = self.ontology.get('statistics', {})
            print(f"  Documents: {stats.get('total_docs', 0)}")
            print(f"  Relationships: {stats.get('total_relationships', 0)}")
            print(f"  Port Conflicts: {stats.get('port_conflicts', 0)}")
        else:
            print("  ️  Ontology not available")
        
        # Verify ports
        print("\n Verifying Port Consistency...")
        if self.verify_port_consistency():
            print("  ✅ No conflicts")
        
        # Generate report
        print("\n Generating Session Report...")
        report = self.generate_session_report()
        
        # Display summary
        print("\n" + "=" * 60)
        if self.issues:
            print(f"️  Session started with {len(self.issues)} issues:")
            for issue in self.issues:
                print(f"  - {issue}")
        else:
            print("✅ Session initialized successfully!")
        
        print("\n Ready for autonomous operation")
        print("=" * 60)
        
        return report


def main():
    """Run session initialization"""
    initializer = SessionInitializer()
    report = initializer.initialize()
    
    # Display quick reference
    print("\n Quick Reference Commands:")
    print("  py docs-ontology.py          # Check document consistency")
    print("  py consistency-keeper.py     # Fix port conflicts")
    print("  py session-init.py           # Re-run initialization")
    
    return report


if __name__ == "__main__":
    main()
