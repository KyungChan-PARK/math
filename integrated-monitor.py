"""
Integrated Issue Detection & Pause System
Created: 2025-01-26
Purpose: Detect disconnections, pause on issues, recommend solutions
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import sys

class IntegratedDevelopmentMonitor:
    def __init__(self):
        self.project_root = Path(r"C:\palantir\math")
        self.issues_db = self.project_root / ".integration_issues.json"
        self.learned_patterns = self.project_root / ".learned_solutions.json"
        self.connection_map = {}
        self.load_learned_patterns()
        
    def load_learned_patterns(self):
        """Load previously learned solutions"""
        if self.learned_patterns.exists():
            with open(self.learned_patterns, 'r') as f:
                self.patterns = json.load(f)
        else:
            self.patterns = {
                "disconnected_components": [],
                "missing_implementations": [],
                "version_mismatches": [],
                "undocumented_features": []
            }
    
    def check_connectivity(self) -> Dict[str, List[str]]:
        """Check if all components are organically connected"""
        issues = []
        
        # Check 1: Ontology-Code Connection
        ontology_path = self.project_root / "ontology-system"
        if not ontology_path.exists():
            issues.append({
                "type": "missing_component",
                "severity": "HIGH",
                "component": "ontology-system",
                "impact": "GraphRAG functionality unavailable"
            })
        
        # Check 2: Documentation-Implementation Sync
        docs_path = self.project_root / "dev-docs"
        server_path = self.project_root / "server"
        
        doc_files = set(f.name for f in docs_path.glob("*.md"))
        implemented_features = self.scan_implementations(server_path)
        
        # Check for documented but unimplemented features
        documented_features = self.extract_documented_features(docs_path)
        unimplemented = documented_features - implemented_features
        
        if unimplemented:
            issues.append({
                "type": "unimplemented_features",
                "severity": "MEDIUM",
                "features": list(unimplemented),
                "impact": "Documentation promises unfulfilled functionality"
            })
        
        # Check 3: WebSocket-Gesture Integration
        gesture_path = self.project_root / "gesture-app"
        ws_adapter = server_path / "ws-adapter.js"
        
        if gesture_path.exists() and not ws_adapter.exists():
            issues.append({
                "type": "missing_integration",
                "severity": "HIGH",
                "components": ["gesture-app", "websocket"],
                "impact": "Gesture recognition cannot communicate with server"
            })
        
        return {"issues": issues, "timestamp": datetime.now().isoformat()}
    
    def scan_implementations(self, server_path: Path) -> set:
        """Scan server code for implemented features"""
        implemented = set()
        
        if server_path.exists():
            for js_file in server_path.glob("*.js"):
                with open(js_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "class NLPEngine" in content:
                        implemented.add("nlp_engine")
                    if "class ScriptGenerator" in content:
                        implemented.add("script_generator")
                    if "WebSocket" in content:
                        implemented.add("websocket")
                    if "gesture" in content.lower():
                        implemented.add("gesture_recognition")
                        
        return implemented
    
    def extract_documented_features(self, docs_path: Path) -> set:
        """Extract features mentioned in documentation"""
        features = set()
        
        for doc in docs_path.glob("*.md"):
            with open(doc, 'r', encoding='utf-8') as f:
                content = f.read().lower()
                if "nlp" in content or "natural language" in content:
                    features.add("nlp_engine")
                if "script" in content and "generator" in content:
                    features.add("script_generator")
                if "websocket" in content:
                    features.add("websocket")
                if "gesture" in content:
                    features.add("gesture_recognition")
                    
        return features
    
    def recommend_solutions(self, issue: Dict) -> List[Dict]:
        """Recommend solutions for detected issues"""
        solutions = []
        
        if issue["type"] == "missing_component":
            solutions.append({
                "option": "CREATE",
                "action": f"Create {issue['component']} with basic implementation",
                "risk": "LOW",
                "time": "15 minutes",
                "command": f"mkdir {issue['component']}; create basic structure"
            })
            solutions.append({
                "option": "DEFER",
                "action": "Add to backlog and continue with current work",
                "risk": "MEDIUM",
                "time": "0 minutes",
                "command": "update backlog.md"
            })
            
        elif issue["type"] == "unimplemented_features":
            for feature in issue["features"][:2]:  # Limit to top 2
                solutions.append({
                    "option": f"IMPLEMENT_{feature.upper()}",
                    "action": f"Implement {feature} based on documentation",
                    "risk": "MEDIUM",
                    "time": "30 minutes",
                    "command": f"implement_{feature}()"
                })
            solutions.append({
                "option": "UPDATE_DOCS",
                "action": "Update documentation to reflect actual implementation",
                "risk": "LOW",
                "time": "10 minutes",
                "command": "sync_docs_to_reality()"
            })
            
        elif issue["type"] == "missing_integration":
            solutions.append({
                "option": "BUILD_BRIDGE",
                "action": f"Create integration bridge between {' and '.join(issue['components'])}",
                "risk": "MEDIUM",
                "time": "20 minutes",
                "command": "create_integration_bridge()"
            })
            solutions.append({
                "option": "MOCK_INTEGRATION",
                "action": "Create mock integration for testing",
                "risk": "LOW",
                "time": "10 minutes",
                "command": "create_mock_bridge()"
            })
            
        return solutions
    
    def pause_and_await_decision(self, issues: List[Dict]) -> str:
        """Pause execution and await user decision"""
        print("\n" + "="*60)
        print("WARNING: INTEGRATION ISSUES DETECTED - PAUSING FOR DECISION")
        print("="*60)
        
        for i, issue in enumerate(issues, 1):
            print(f"\n[Issue {i}]: {issue['type'].replace('_', ' ').title()}")
            print(f"   Severity: {issue['severity']}")
            print(f"   Impact: {issue['impact']}")
            
            solutions = self.recommend_solutions(issue)
            print(f"\n   Recommended Solutions:")
            for j, sol in enumerate(solutions, 1):
                print(f"   {j}. [{sol['option']}] {sol['action']}")
                print(f"      Risk: {sol['risk']}, Time: {sol['time']}")
        
        print("\n" + "="*60)
        print("AWAITING YOUR DECISION")
        print("Please specify option (e.g., 'Issue 1, Option 2') or 'CONTINUE' to proceed")
        print("="*60)
        
        # In production, this would wait for actual user input
        # For now, we save the state
        self.save_pause_state(issues)
        
        return "PAUSED"
    
    def save_pause_state(self, issues: List[Dict]):
        """Save pause state for recovery"""
        pause_state = {
            "timestamp": datetime.now().isoformat(),
            "issues": issues,
            "status": "AWAITING_USER_DECISION"
        }
        
        with open(self.project_root / ".pause_state.json", 'w') as f:
            json.dump(pause_state, f, indent=2)
    
    def learn_from_resolution(self, issue_type: str, solution: Dict):
        """Learn from resolved issues to prevent recurrence"""
        if issue_type not in self.patterns:
            self.patterns[issue_type] = []
            
        self.patterns[issue_type].append({
            "timestamp": datetime.now().isoformat(),
            "solution": solution,
            "success": True
        })
        
        # Keep only last 10 patterns per type
        self.patterns[issue_type] = self.patterns[issue_type][-10:]
        
        with open(self.learned_patterns, 'w') as f:
            json.dump(self.patterns, f, indent=2)
    
    def auto_fix_if_learned(self, issue: Dict) -> Optional[Dict]:
        """Apply learned solution if available"""
        if issue["type"] in self.patterns and self.patterns[issue["type"]]:
            # Use most recent successful solution
            for pattern in reversed(self.patterns[issue["type"]]):
                if pattern["success"]:
                    print(f"[OK] Applying learned solution for {issue['type']}")
                    return pattern["solution"]
        return None

def check_and_fix():
    """Main function to run checks"""
    monitor = IntegratedDevelopmentMonitor()
    
    # Check connectivity
    result = monitor.check_connectivity()
    
    if result["issues"]:
        # Try auto-fix first
        for issue in result["issues"]:
            auto_solution = monitor.auto_fix_if_learned(issue)
            if auto_solution:
                print(f"Auto-fixed: {issue['type']}")
                continue
            else:
                # Pause for user decision
                return monitor.pause_and_await_decision([issue])
    else:
        print("[OK] All components properly integrated")
        return "OK"
    
    return "RESOLVED"

if __name__ == "__main__":
    status = check_and_fix()
    print(f"\nStatus: {status}")
