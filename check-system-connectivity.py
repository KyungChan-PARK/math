"""
Complete System Connectivity Check
Verifies organic connections between all systems
"""

import json
from pathlib import Path
from datetime import datetime
import re

class SystemConnectivityChecker:
    def __init__(self):
        self.root = Path(r"C:\palantir\math")
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "connections": {},
            "isolated_components": [],
            "missing_links": [],
            "recommendations": []
        }
    
    def check_all_connections(self):
        """Check all system interconnections"""
        
        # 1. Documentation ↔ Implementation
        self.check_doc_implementation_sync()
        
        # 2. Ontology ↔ Orchestration
        self.check_ontology_orchestration()
        
        # 3. Three Core Features Integration
        self.check_core_features()
        
        return self.results
    
    def check_doc_implementation_sync(self):
        """Check if docs match implementation"""
        docs = self.root / "dev-docs"
        server = self.root / "server"
        
        # Map documents to expected implementations
        doc_impl_map = {
            "03-NLP-REALTIME-SYSTEM.md": ["nlp-engine.js", "script-generator.js"],
            "04-GESTURE-RECOGNITION.md": ["gesture-service.js", "gesture-ws-bridge.js"],
            "06-WEBSOCKET-OPTIMIZATION.md": ["optimized-ws-adapter.js", "parallel-ws-adapter.js"],
            "07-WINDOWS-ML-INTEGRATION.md": ["ml-inference.js", "onnx-runtime.js"],
        }
        
        for doc, expected_files in doc_impl_map.items():
            doc_path = docs / doc
            if doc_path.exists():
                implemented = []
                missing = []
                for file in expected_files:
                    if (server / file).exists():
                        implemented.append(file)
                    else:
                        missing.append(file)
                
                if missing:
                    self.results["missing_links"].append({
                        "document": doc,
                        "missing_implementations": missing,
                        "severity": "HIGH" if len(missing) == len(expected_files) else "MEDIUM"
                    })
    
    def check_ontology_orchestration(self):
        """Check if ontology and orchestration are connected"""
        ontology = self.root / "ontology-system" / "complete-neo4j-ontology.js"
        orchestration = self.root / "orchestration" / "orchestration-engine.js"
        
        if ontology.exists() and orchestration.exists():
            # Check if they reference each other
            with open(ontology, 'r', encoding='utf-8') as f:
                ont_content = f.read()
            with open(orchestration, 'r', encoding='utf-8') as f:
                orch_content = f.read()
            
            # Look for cross-references
            if "orchestration" not in ont_content.lower():
                self.results["isolated_components"].append({
                    "component": "ontology-system",
                    "missing_connection": "orchestration",
                    "impact": "Ontology decisions not reflected in orchestration"
                })
            
            if "ontology" not in orch_content.lower() and "neo4j" not in orch_content.lower():
                self.results["isolated_components"].append({
                    "component": "orchestration-engine", 
                    "missing_connection": "ontology",
                    "impact": "Orchestration not using knowledge graph"
                })
    
    def check_core_features(self):
        """Check integration of 3 core features"""
        features = {
            "natural_language": False,
            "gesture_recognition": False,
            "autonomous_decision": False
        }
        
        # Check NLP
        nlp_engine = self.root / "server" / "nlp-engine.js"
        if nlp_engine.exists():
            features["natural_language"] = True
        
        # Check Gesture
        gesture_app = self.root / "gesture-app"
        if gesture_app.exists() and list(gesture_app.glob("*.html")):
            features["gesture_recognition"] = True
        
        # Check Autonomous Decision
        checkpoint = self.root / "complete-memory-checkpoint.py"
        if checkpoint.exists():
            features["autonomous_decision"] = True
        
        # Generate recommendations
        if not all(features.values()):
            missing = [k for k, v in features.items() if not v]
            self.results["recommendations"].append({
                "priority": "CRITICAL",
                "message": f"Core features not fully integrated: {missing}",
                "action": "Implement missing core features immediately"
            })
    
    def generate_report(self):
        """Generate connectivity report"""
        report = []
        report.append("="*60)
        report.append("SYSTEM CONNECTIVITY REPORT")
        report.append("="*60)
        
        if self.results["isolated_components"]:
            report.append("\n[ISOLATED COMPONENTS]:")
            for comp in self.results["isolated_components"]:
                report.append(f"  - {comp['component']}: Missing {comp['missing_connection']}")
                report.append(f"    Impact: {comp['impact']}")
        
        if self.results["missing_links"]:
            report.append("\n[MISSING IMPLEMENTATIONS]:")
            for link in self.results["missing_links"]:
                report.append(f"  - {link['document']}: {len(link['missing_implementations'])} files missing")
                for file in link['missing_implementations']:
                    report.append(f"    * {file}")
        
        if self.results["recommendations"]:
            report.append("\n[RECOMMENDATIONS]:")
            for rec in self.results["recommendations"]:
                report.append(f"  [{rec['priority']}] {rec['message']}")
                report.append(f"  -> {rec['action']}")
        
        if not (self.results["isolated_components"] or self.results["missing_links"]):
            report.append("\n[SUCCESS] All systems are organically connected!")
        
        return "\n".join(report)

if __name__ == "__main__":
    checker = SystemConnectivityChecker()
    checker.check_all_connections()
    print(checker.generate_report())
    
    # Save results
    with open(r"C:\palantir\math\.connectivity_check.json", 'w') as f:
        json.dump(checker.results, f, indent=2)
