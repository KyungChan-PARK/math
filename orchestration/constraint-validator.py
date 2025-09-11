import json
from typing import Dict, List, Any
from dataclasses import dataclass
from enum import Enum

class ImpactLevel(Enum):
    LOW = 0.1
    MEDIUM = 0.3
    HIGH = 0.5
    CRITICAL = 0.9

@dataclass
class Action:
    name: str
    type: str
    target: str
    impact: float
    cost: float = 0.0
    dependencies: List[str] = None

class PalantirStyleConstraints:
    """Lightweight constraint manager inspired by Palantir Apollo"""
    
    def __init__(self):
        self.constraints = {
            'impact': self.check_impact_threshold,
            'dependency': self.check_dependencies,
            'cost': self.check_cost_limit,
            'safety': self.check_safety_rules,
            'rollback': self.check_rollback_capability
        }
        self.constraint_history = []
        
    def check_impact_threshold(self, action: Action) -> bool:
        """Impact must be < 30% for autonomous execution"""
        return action.impact < 0.3
        
    def check_dependencies(self, action: Action) -> bool:
        """All dependencies must be satisfied"""
        if not action.dependencies:
            return True
        # Check if AE is running, layers exist, etc.
        return all(self._dependency_exists(dep) for dep in action.dependencies)
    
    def check_cost_limit(self, action: Action) -> bool:
        """API cost must be < $10"""
        return action.cost < 10.0
    
    def check_safety_rules(self, action: Action) -> bool:
        """No destructive operations without backup"""
        destructive = ['DELETE', 'CLEAR', 'RESET', 'OVERWRITE']
        if action.type in destructive:
            return self._has_backup()
        return True
    
    def check_rollback_capability(self, action: Action) -> bool:
        """Must be able to undo the action"""
        return action.type != 'PERMANENT'
    
    def can_execute_autonomously(self, action: Action) -> Dict[str, Any]:
        """Multi-dimensional constraint validation"""
        results = {}
        for name, check in self.constraints.items():
            results[name] = check(action)
        
        can_execute = all(results.values())
        
        # Log decision
        self.constraint_history.append({
            'action': action.name,
            'timestamp': self._get_timestamp(),
            'results': results,
            'decision': 'AUTONOMOUS' if can_execute else 'REQUIRES_USER'
        })
        
        return {
            'can_execute': can_execute,
            'constraints': results,
            'reason': self._get_failure_reason(results) if not can_execute else None
        }
    
    def _dependency_exists(self, dep: str) -> bool:
        """Check if dependency is available"""
        # Simplified check - would connect to actual systems
        return True
    
    def _has_backup(self) -> bool:
        """Check if backup exists"""
        # Would check actual backup system
        return True
    
    def _get_timestamp(self) -> str:
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _get_failure_reason(self, results: Dict) -> str:
        failed = [k for k, v in results.items() if not v]
        return f"Failed constraints: {', '.join(failed)}"
    
    def get_history(self) -> List[Dict]:
        """Get constraint check history"""
        return self.constraint_history

# Integration with AE automation
class AEActionValidator:
    """Validates After Effects actions using constraints"""
    
    def __init__(self):
        self.constraints = PalantirStyleConstraints()
        self.action_impacts = {
            'CREATE_LAYER': ImpactLevel.LOW.value,
            'ADD_EFFECT': ImpactLevel.LOW.value,
            'ANIMATE_PROPERTY': ImpactLevel.MEDIUM.value,
            'DELETE_LAYER': ImpactLevel.HIGH.value,
            'CLEAR_COMPOSITION': ImpactLevel.CRITICAL.value,
            'RENDER': ImpactLevel.MEDIUM.value,
            'SAVE_PROJECT': ImpactLevel.LOW.value
        }
    
    def validate_command(self, command: str, intent: Dict) -> Dict:
        """Validate if command can run autonomously"""
        
        # Create action from intent
        action = Action(
            name=command,
            type=intent.get('action', 'UNKNOWN'),
            target=intent.get('target', 'layer'),
            impact=self.action_impacts.get(intent['action'], 0.5),
            cost=self._estimate_cost(intent),
            dependencies=self._get_dependencies(intent)
        )
        
        # Check constraints
        result = self.constraints.can_execute_autonomously(action)
        
        if result['can_execute']:
            print(f"[APPROVED] Autonomous execution approved for: {command}")
        else:
            print(f"[REQUIRES USER] User confirmation required: {result['reason']}")
        
        return result
    
    def _estimate_cost(self, intent: Dict) -> float:
        """Estimate API cost for action"""
        # $0.003 per API call (example)
        complexity = len(str(intent)) / 100
        return 0.003 * complexity
    
    def _get_dependencies(self, intent: Dict) -> List[str]:
        """Get required dependencies for action"""
        deps = []
        if 'layer' in str(intent).lower():
            deps.append('ae_running')
            deps.append('composition_exists')
        if 'effect' in str(intent).lower():
            deps.append('layer_selected')
        return deps

if __name__ == "__main__":
    # Test the constraint system
    validator = AEActionValidator()
    
    test_intents = [
        {'action': 'CREATE_LAYER', 'target': 'text'},
        {'action': 'DELETE_LAYER', 'target': 'all'},
        {'action': 'ADD_EFFECT', 'target': 'wiggle'},
        {'action': 'CLEAR_COMPOSITION', 'target': 'main'}
    ]
    
    for intent in test_intents:
        print(f"\nTesting: {intent}")
        result = validator.validate_command(str(intent), intent)
        print(f"Result: {result['can_execute']}")
