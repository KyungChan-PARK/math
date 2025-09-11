# behavior_learning_system.py
# [KR] [KR] [KR] [KR] [KR] [KR]

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

class BehaviorLearning:
    def __init__(self):
        self.rules_file = Path("C:/palantir/math/dev-docs/.behavior_rules.json")
        self.patterns_file = Path("C:/palantir/math/dev-docs/BEHAVIOR_PATTERNS.md")
        self.load_rules()
        
    def load_rules(self):
        """[KR] [KR] [KR]"""
        if self.rules_file.exists():
            self.rules = json.loads(self.rules_file.read_text(encoding='utf-8'))
        else:
            self.rules = {
                "on_error": [],
                "on_decision": [],
                "on_completion": [],
                "always": []
            }
            # [KR] [KR] [KR]
            self.add_rule("on_error", {
                "condition": "any_error",
                "action": "report_to_user",
                "options": "provide_3_solutions",
                "wait": True
            })
    
    def add_rule(self, trigger: str, rule: Dict):
        """[KR] [KR] [KR] [KR]"""
        rule["learned_at"] = datetime.now().isoformat()
        rule["usage_count"] = 0
        
        if trigger not in self.rules:
            self.rules[trigger] = []
        
        # [KR] [KR]
        for existing in self.rules[trigger]:
            if existing.get("condition") == rule.get("condition"):
                existing["usage_count"] += 1
                self.save_rules()
                return
        
        self.rules[trigger].append(rule)
        self.save_rules()
        self.update_documentation()
        
    def get_action(self, trigger: str, context: Dict) -> Optional[Dict]:
        """[KR] [KR] [KR] [KR]"""
        actions = []
        
        # Always [KR] [KR]
        for rule in self.rules.get("always", []):
            if self._matches_condition(rule["condition"], context):
                actions.append(rule)
        
        # [KR] [KR] [KR]
        for rule in self.rules.get(trigger, []):
            if self._matches_condition(rule["condition"], context):
                actions.append(rule)
                rule["usage_count"] += 1
        
        self.save_rules()
        return actions[0] if actions else None
    
    def _matches_condition(self, condition: str, context: Dict) -> bool:
        """[KR] [KR]"""
        if condition == "any_error":
            return "error" in context
        elif condition == "major_decision":
            return context.get("impact", 0) > 30
        elif condition == "task_complete":
            return context.get("status") == "completed"
        return True if condition == "always" else False
    
    def save_rules(self):
        """[KR] [KR]"""
        self.rules_file.write_text(
            json.dumps(self.rules, ensure_ascii=False, indent=2),
            encoding='utf-8'
        )
    
    def update_documentation(self):
        """[KR] [KR]"""
        content = ["# [KR] [KR] [KR]\n"]
        
        for trigger, rules in self.rules.items():
            if rules:
                content.append(f"\n## {trigger.upper()}\n")
                for rule in rules:
                    content.append(f"- **[KR]**: {rule['condition']}")
                    content.append(f"  - [KR]: {rule.get('action', 'N/A')}")
                    content.append(f"  - [KR]: {rule.get('wait', False)}")
                    content.append(f"  - [KR]: {rule.get('usage_count', 0)}[KR]\n")
        
        self.patterns_file.write_text('\n'.join(content), encoding='utf-8')

# [KR] [KR]
behavior = BehaviorLearning()

# [KR] [KR] ([KR] [KR] [KR])
def handle_issue(error_type: str, context: str, options: List[str]) -> str:
    """[KR] [KR] [KR]"""
    # [KR] [KR] [KR]
    action = behavior.get_action("on_error", {"error": error_type})
    
    if action and action.get("wait"):
        print(f"\n[ISSUE] {error_type}: {context}")
        print("\n[OPTIONS] [KR]:")
        for i, opt in enumerate(options, 1):
            print(f"  {i}. {opt}")
        
        # [KR] [KR] [KR]
        return "WAITING_USER_INPUT"
    
    # [KR] [KR]
    return options[0] if options else "DEFAULT_ACTION"

# [KR] [KR]
def learn_behavior(trigger: str):
    """[KR] [KR] [KR]"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # [KR] [KR]
            if trigger == "on_error" and hasattr(result, '__traceback__'):
                behavior.add_rule(trigger, {
                    "condition": "any_error",
                    "action": "report_and_wait",
                    "options": "provide_solutions",
                    "wait": True
                })
            
            return result
        return wrapper
    return decorator

# [KR] [KR] [KR]
CORE_BEHAVIORS = [
    ("on_error", {"condition": "any_error", "action": "report_to_user", "options": "3_solutions", "wait": True}),
    ("on_decision", {"condition": "major_decision", "action": "present_options", "wait": True}),
    ("on_completion", {"condition": "task_complete", "action": "update_memory", "wait": False}),
    ("always", {"condition": "always", "action": "check_issues_before_action", "wait": False})
]

if __name__ == "__main__":
    # [KR]
    for trigger, rule in CORE_BEHAVIORS:
        behavior.add_rule(trigger, rule)
    
    print("[BEHAVIOR] [KR] complete:")
    for trigger in behavior.rules:
        print(f"  - {trigger}: {len(behavior.rules[trigger])} rules")