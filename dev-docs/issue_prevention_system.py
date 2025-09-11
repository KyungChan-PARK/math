# issue_prevention_system.py
# [KR] [KR] [KR] [KR] [KR] [KR] [KR]

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List

class IssuePrevention:
    def __init__(self):
        self.issues_db = Path("C:/palantir/math/dev-docs/.issues_learned.json")
        self.solutions_file = Path("C:/palantir/math/dev-docs/LEARNED_SOLUTIONS.md")
        
    def record_issue(self, issue_type: str, context: str, solution: str):
        """[KR] [KR] [KR] [KR]"""
        issue = {
            "timestamp": datetime.now().isoformat(),
            "type": issue_type,
            "context": context,
            "solution": solution,
            "prevention": self._generate_prevention(issue_type, solution)
        }
        
        # JSON [KR] [KR]
        data = {"issues": [], "patterns": {}}
        if self.issues_db.exists():
            data = json.loads(self.issues_db.read_text(encoding='utf-8'))
        
        data["issues"].append(issue)
        
        # [KR] [KR]
        if issue_type not in data["patterns"]:
            data["patterns"][issue_type] = []
        data["patterns"][issue_type].append(solution)
        
        self.issues_db.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        
        # [KR] [KR]
        self._update_docs(issue)
        
        return issue
    
    def _generate_prevention(self, issue_type: str, solution: str) -> str:
        """[KR] [KR] [KR]"""
        preventions = {
            "encoding": "[KR] UTF-8 [KR], CP949 [KR], [KR] [KR]",
            "port_conflict": "[KR] [KR] [KR], 8085-8090 [KR] [KR]",
            "import_error": "[KR] [KR] [KR], sys.path [KR]",
            "memory_error": "[KR] [KR] [KR], 30[KR] [KR] [KR]",
            "powershell": "[KR] [KR], && [KR] ;",
            "path": "[KR] [KR] [KR], C:/palantir/math [KR]"
        }
        
        for key in preventions:
            if key in issue_type.lower():
                return preventions[key]
        
        return f"[KR] [KR]: {solution}"
    
    def _update_docs(self, issue: Dict):
        """[KR] [KR] [KR] [KR]"""
        content = []
        
        if self.solutions_file.exists():
            content = self.solutions_file.read_text(encoding='utf-8').splitlines()
        else:
            content = ["# [KR] [KR] ([KR] [KR])", "", "## [KR] [KR] [KR]", ""]
        
        # [KR] [KR] [KR]
        entry = [
            f"### {issue['type']} ({issue['timestamp'][:10]})",
            f"**[KR]:** {issue['context']}",
            f"**[KR]:** {issue['solution']}",
            f"**[KR]:** {issue['prevention']}",
            ""
        ]
        
        content.extend(entry)
        self.solutions_file.write_text('\n'.join(content), encoding='utf-8')
    
    def check_before_action(self, action_type: str) -> List[str]:
        """[KR] [KR] [KR] [KR]"""
        if not self.issues_db.exists():
            return []
        
        data = json.loads(self.issues_db.read_text(encoding='utf-8'))
        warnings = []
        
        # [KR] [KR] [KR]
        for pattern, solutions in data["patterns"].items():
            if pattern in action_type.lower():
                warnings.append(f"️ {pattern}: {solutions[-1]}")
        
        return warnings

# [KR] [KR]
prevention = IssuePrevention()

# [KR] [KR] [KR] [KR]
def learn_from_errors(func):
    """[KR] [KR] [KR] [KR]"""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            # [KR] [KR] [KR]
            issue_type = type(e).__name__
            context = f"{func.__name__} [KR] [KR]"
            
            # [KR] [KR] [KR]
            solution = "Unknown"
            if "UnicodeEncode" in issue_type:
                solution = "UTF-8 [KR] [KR], [KR] [KR]"
            elif "FileNotFound" in issue_type:
                solution = "[KR] [KR] [KR]"
            elif "Port" in str(e):
                solution = "[KR] [KR] (8085-8090)"
            
            prevention.record_issue(issue_type, context, solution)
            raise
    return wrapper

# [KR] [KR] [KR] [KR]
def learn_issue(category: str, problem: str, solution: str):
    """[KR] [KR] [KR]"""
    prevention.record_issue(category, problem, solution)
    print(f"[OK] [KR] complete: {category}")
    
    # [KR] [KR]
    return {
        "entity": "AI_Agent_System_v3",
        "observations": [
            f"[KR] [KR]: {category}",
            f"[KR]: {problem}",
            f"[KR]: {solution}"
        ]
    }

# [KR] [KR] [KR]
KNOWN_ISSUES = [
    ("encoding_error", "CP949 [KR] [KR]", "UTF-8 [KR], [KR] [KR]"),
    ("port_conflict", "[KR] 8080 [KR]", "8085 [KR] [KR] [KR]"),
    ("powershell_syntax", "&& [KR] [KR]", "[KR] ; [KR]"),
    ("module_not_found", "[KR] [KR] [KR] [KR]", "[KR] [KR] [KR]"),
    ("memory_limit", "[KR] [KR] [KR] [KR]", "30[KR] [KR] [KR] [KR]")
]

# [KR]
if __name__ == "__main__":
    for issue_type, context, solution in KNOWN_ISSUES:
        learn_issue(issue_type, context, solution)
    
    print("\n[LEARNED] [KR] complete[KR] [KR]:")
    for issue in KNOWN_ISSUES:
        print(f"  - {issue[0]}: {issue[2]}")