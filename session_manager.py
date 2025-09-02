"""
AE Claude Max v3.0 - Session Persistence System
Maintains development state across AI agent sessions
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

class SessionManager:
    """
    Manages development state persistence for AI agents
    Ensures continuity across different conversation sessions
    """
    
    def __init__(self, project_root: str = r"C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project"):
        self.project_root = Path(project_root)
        self.state_file = self.project_root / "session_state.json"
        self.checkpoint_dir = self.project_root / "checkpoints"
        self.checkpoint_dir.mkdir(exist_ok=True)
        
        # Load or initialize state
        self.state = self.load_state()
    
    def load_state(self) -> Dict[str, Any]:
        """Load previous session state or create new"""
        if self.state_file.exists():
            with open(self.state_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return self.initialize_state()
    
    def initialize_state(self) -> Dict[str, Any]:
        """Initialize new session state"""
        return {
            "session_id": self.generate_session_id(),
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "project_version": "v3.0",
            "current_phase": "development",
            "progress": {
                "tasks_completed": [],
                "tasks_pending": [],
                "current_task": None,
                "completion_percentage": 0
            },
            "files": {
                "created": [],
                "modified": [],
                "deleted": []
            },
            "errors": {
                "unresolved": [],
                "resolved": []
            },
            "decisions": {
                "pending": [],
                "made": []
            },
            "api_usage": {
                "calls": 0,
                "cost": 0.0,
                "models_used": {}
            },
            "environment": {
                "python_version": "3.13.3",
                "venv_path": "venv",
                "packages_installed": [],
                "system": "Windows 11"
            },
            "next_steps": [],
            "notes": []
        }
    
    def generate_session_id(self) -> str:
        """Generate unique session ID"""
        return f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    def save_state(self):
        """Save current state to disk"""
        self.state["last_updated"] = datetime.now().isoformat()
        with open(self.state_file, 'w', encoding='utf-8') as f:
            json.dump(self.state, f, indent=2, ensure_ascii=False)
    
    def create_checkpoint(self, name: str = None):
        """Create a checkpoint of current state"""
        checkpoint_name = name or f"checkpoint_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        checkpoint_file = self.checkpoint_dir / f"{checkpoint_name}.json"
        
        with open(checkpoint_file, 'w', encoding='utf-8') as f:
            json.dump(self.state, f, indent=2, ensure_ascii=False)
        
        return checkpoint_file
    
    def restore_checkpoint(self, checkpoint_name: str):
        """Restore state from checkpoint"""
        checkpoint_file = self.checkpoint_dir / f"{checkpoint_name}.json"
        if checkpoint_file.exists():
            with open(checkpoint_file, 'r', encoding='utf-8') as f:
                self.state = json.load(f)
            self.save_state()
            return True
        return False
    
    # Task Management
    def start_task(self, task_name: str, description: str = ""):
        """Start a new task"""
        task = {
            "name": task_name,
            "description": description,
            "started_at": datetime.now().isoformat(),
            "completed_at": None,
            "status": "in_progress"
        }
        self.state["progress"]["current_task"] = task
        self.save_state()
    
    def complete_task(self, result: str = "success"):
        """Complete current task"""
        if self.state["progress"]["current_task"]:
            task = self.state["progress"]["current_task"]
            task["completed_at"] = datetime.now().isoformat()
            task["status"] = result
            self.state["progress"]["tasks_completed"].append(task)
            self.state["progress"]["current_task"] = None
            self.update_progress()
            self.save_state()
    
    def add_pending_task(self, task_name: str, priority: int = 5):
        """Add task to pending queue"""
        self.state["progress"]["tasks_pending"].append({
            "name": task_name,
            "priority": priority,
            "added_at": datetime.now().isoformat()
        })
        self.save_state()
    
    # File Tracking
    def track_file_created(self, file_path: str):
        """Track newly created file"""
        if file_path not in self.state["files"]["created"]:
            self.state["files"]["created"].append(file_path)
            self.save_state()
    
    def track_file_modified(self, file_path: str):
        """Track modified file"""
        if file_path not in self.state["files"]["modified"]:
            self.state["files"]["modified"].append(file_path)
            self.save_state()
    
    # Error Management
    def log_error(self, error: str, context: str = ""):
        """Log an error"""
        error_entry = {
            "error": error,
            "context": context,
            "timestamp": datetime.now().isoformat(),
            "resolved": False
        }
        self.state["errors"]["unresolved"].append(error_entry)
        self.save_state()
    
    def resolve_error(self, error_index: int, solution: str):
        """Mark error as resolved"""
        if 0 <= error_index < len(self.state["errors"]["unresolved"]):
            error = self.state["errors"]["unresolved"].pop(error_index)
            error["resolved"] = True
            error["solution"] = solution
            error["resolved_at"] = datetime.now().isoformat()
            self.state["errors"]["resolved"].append(error)
            self.save_state()
    
    # Decision Tracking
    def add_decision_point(self, question: str, options: List[str]):
        """Add a decision that needs user input"""
        decision = {
            "question": question,
            "options": options,
            "timestamp": datetime.now().isoformat(),
            "answered": False
        }
        self.state["decisions"]["pending"].append(decision)
        self.save_state()
        return len(self.state["decisions"]["pending"]) - 1
    
    def record_decision(self, decision_index: int, choice: str):
        """Record user's decision"""
        if 0 <= decision_index < len(self.state["decisions"]["pending"]):
            decision = self.state["decisions"]["pending"].pop(decision_index)
            decision["answered"] = True
            decision["choice"] = choice
            decision["answered_at"] = datetime.now().isoformat()
            self.state["decisions"]["made"].append(decision)
            self.save_state()
    
    # API Usage Tracking
    def track_api_call(self, model: str, cost: float):
        """Track API usage"""
        self.state["api_usage"]["calls"] += 1
        self.state["api_usage"]["cost"] += cost
        
        if model not in self.state["api_usage"]["models_used"]:
            self.state["api_usage"]["models_used"][model] = 0
        self.state["api_usage"]["models_used"][model] += 1
        
        self.save_state()
    
    # Progress Tracking
    def update_progress(self):
        """Update overall progress percentage"""
        completed = len(self.state["progress"]["tasks_completed"])
        pending = len(self.state["progress"]["tasks_pending"])
        total = completed + pending + (1 if self.state["progress"]["current_task"] else 0)
        
        if total > 0:
            self.state["progress"]["completion_percentage"] = int((completed / total) * 100)
    
    # Next Steps Management
    def set_next_steps(self, steps: List[str]):
        """Set next steps for continuation"""
        self.state["next_steps"] = steps
        self.save_state()
    
    def get_next_steps(self) -> List[str]:
        """Get next steps to continue"""
        return self.state["next_steps"]
    
    # Status Report
    def generate_status_report(self) -> str:
        """Generate current status report"""
        report = f"""
# Session Status Report
Generated: {datetime.now().isoformat()}

## Progress
- Current Task: {self.state['progress']['current_task']['name'] if self.state['progress']['current_task'] else 'None'}
- Completed Tasks: {len(self.state['progress']['tasks_completed'])}
- Pending Tasks: {len(self.state['progress']['tasks_pending'])}
- Completion: {self.state['progress']['completion_percentage']}%

## Files
- Created: {len(self.state['files']['created'])}
- Modified: {len(self.state['files']['modified'])}

## Errors
- Unresolved: {len(self.state['errors']['unresolved'])}
- Resolved: {len(self.state['errors']['resolved'])}

## API Usage
- Total Calls: {self.state['api_usage']['calls']}
- Total Cost: ${self.state['api_usage']['cost']:.4f}

## Pending Decisions
{chr(10).join([f"- {d['question']}" for d in self.state['decisions']['pending']])}

## Next Steps
{chr(10).join([f"- {step}" for step in self.state['next_steps']])}
"""
        return report
    
    # Recovery Functions
    def verify_files(self) -> Dict[str, List[str]]:
        """Verify all tracked files exist"""
        missing = []
        existing = []
        
        for file_list in [self.state["files"]["created"], self.state["files"]["modified"]]:
            for file_path in file_list:
                if Path(file_path).exists():
                    existing.append(file_path)
                else:
                    missing.append(file_path)
        
        return {"existing": existing, "missing": missing}
    
    def get_recovery_plan(self) -> Dict[str, Any]:
        """Generate recovery plan for new session"""
        return {
            "current_task": self.state["progress"]["current_task"],
            "next_steps": self.state["next_steps"],
            "pending_decisions": self.state["decisions"]["pending"],
            "unresolved_errors": self.state["errors"]["unresolved"],
            "missing_files": self.verify_files()["missing"]
        }


# Utility functions for AI agent
def initialize_session() -> SessionManager:
    """Initialize or recover session"""
    session = SessionManager()
    
    # Check if recovering from previous session
    if session.state["progress"]["current_task"]:
        print(f"Recovering task: {session.state['progress']['current_task']['name']}")
    
    if session.state["next_steps"]:
        print(f"Next steps: {', '.join(session.state['next_steps'])}")
    
    return session


def quick_status(session: SessionManager):
    """Quick status check"""
    print(f"Progress: {session.state['progress']['completion_percentage']}%")
    print(f"Current: {session.state['progress']['current_task']['name'] if session.state['progress']['current_task'] else 'None'}")
    print(f"Pending: {len(session.state['progress']['tasks_pending'])} tasks")
    print(f"Errors: {len(session.state['errors']['unresolved'])} unresolved")


if __name__ == "__main__":
    # Test the session manager
    session = initialize_session()
    print(session.generate_status_report())
