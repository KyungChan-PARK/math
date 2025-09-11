# unified_decision_system.py
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

class UnifiedDecisionSystem:
    def __init__(self):
        self.decisions_log = Path("C:/palantir/math/dev-docs/.decisions_log.json")
        self.learned_patterns = Path("C:/palantir/math/dev-docs/.learned_patterns.json")
        self.load_patterns()
        
    def load_patterns(self):
        if self.learned_patterns.exists():
            self.patterns = json.loads(self.learned_patterns.read_text(encoding='utf-8'))
        else:
            self.patterns = {
                "require_user_input": [
                    "port_conflict",
                    "file_permission_error",
                    "api_key_missing",
                    "major_architecture_change"
                ],
                "auto_resolve": [
                    "encoding_error",
                    "import_error",
                    "minor_syntax_error"
                ]
            }
            self.save_patterns()
    
    def handle_issue(self, issue_type: str, context: str) -> Dict:
        requires_input = issue_type in self.patterns["require_user_input"]
        options = self.generate_options(issue_type, context)
        
        decision = {
            "timestamp": datetime.now().isoformat(),
            "issue": issue_type,
            "context": context,
            "options": options,
            "requires_user_input": requires_input,
            "status": "WAITING" if requires_input else "AUTO_RESOLVED"
        }
        
        self.log_decision(decision)
        
        if requires_input:
            return self.report_to_user(decision)
        else:
            return self.auto_resolve(decision)
    
    def generate_options(self, issue_type: str, context: str) -> List[Dict]:
        options_map = {
            "port_conflict": [
                {"action": "use_alternative_port", "detail": "8085-8090"},
                {"action": "kill_process", "detail": "terminate existing"},
                {"action": "retry_later", "detail": "wait 10 seconds"}
            ],
            "file_permission_error": [
                {"action": "run_as_admin", "detail": "elevate permissions"},
                {"action": "change_location", "detail": "use different dir"},
                {"action": "skip_file", "detail": "continue without"}
            ]
        }
        
        return options_map.get(issue_type, [
            {"action": "default_retry", "detail": "retry once"},
            {"action": "skip", "detail": "skip this step"},
            {"action": "abort", "detail": "stop process"}
        ])
    
    def report_to_user(self, decision: Dict) -> Dict:
        report = {
            "type": "USER_INPUT_REQUIRED",
            "message": f"\n[ISSUE] {decision['issue']}: {decision['context']}\n[OPTIONS]:",
            "options": decision['options'],
            "instruction": "Select 1-3:",
            "waiting": True
        }
        
        for i, opt in enumerate(decision['options'], 1):
            report["message"] += f"\n  {i}. {opt['action']} - {opt['detail']}"
        
        return report
    
    def auto_resolve(self, decision: Dict) -> Dict:
        return {
            "type": "AUTO_RESOLVED",
            "message": f"[RESOLVED] {decision['issue']}",
            "action_taken": decision['options'][0] if decision['options'] else "default",
            "waiting": False
        }
    
    def save_patterns(self):
        self.learned_patterns.write_text(
            json.dumps(self.patterns, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
    
    def log_decision(self, decision: Dict):
        logs = []
        if self.decisions_log.exists():
            logs = json.loads(self.decisions_log.read_text(encoding='utf-8'))
        
        logs.append(decision)
        if len(logs) > 100:
            logs = logs[-100:]
        
        self.decisions_log.write_text(
            json.dumps(logs, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )

decision_system = UnifiedDecisionSystem()

if __name__ == "__main__":
    result = decision_system.handle_issue("port_conflict", "Port 8080 in use")
    
    if result["waiting"]:
        print(result["message"])
        print(result["instruction"])
    else:
        print(result["message"])