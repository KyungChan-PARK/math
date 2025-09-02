"""
Base Agent Class for AE Automation v2.0
IndyDevDan Pattern Implementation
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import anthropic
import json
from datetime import datetime

class BaseAgent(ABC):
    """Abstract base class for all specialized agents"""
    
    def __init__(self, name: str, model: str = "sonnet"):
        self.name = name
        self.model = "claude-3-sonnet-20240229" if model == "sonnet" else "claude-3-opus-20240229"
        self.client = anthropic.Anthropic()
        self.execution_history = []
        
    @abstractmethod
    def can_handle(self, task: Dict[str, Any]) -> bool:
        """Determine if this agent can handle the given task"""
        pass
    
    @abstractmethod
    def process(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process the task and return results"""
        pass
    
    def execute(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Execute task with logging and error handling"""
        start_time = datetime.now()
        
        try:
            # Check if agent can handle this task
            if not self.can_handle(task):
                return {"error": f"{self.name} cannot handle this task type"}
            
            # Process the task
            result = self.process(task)
            
            # Log execution
            self.execution_history.append({
                "timestamp": start_time.isoformat(),
                "task": task,
                "result": result,
                "duration": (datetime.now() - start_time).total_seconds()
            })
            
            return result
            
        except Exception as e:
            return {"error": str(e), "agent": self.name}

class WiggleAgent(BaseAgent):
    """Specialized agent for wiggle animations (Sonnet 4)"""
    
    def __init__(self):
        super().__init__("WiggleAgent", "sonnet")
        self.supported_properties = ["position", "scale", "rotation", "opacity"]
        
    def can_handle(self, task: Dict[str, Any]) -> bool:
        """Check if task involves wiggle expressions"""
        keywords = ["wiggle", "random", "shake", "jitter", "noise"]
        task_text = str(task.get("prompt", "")).lower()
        return any(keyword in task_text for keyword in keywords)
    
    def process(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Generate wiggle expression code"""
        prompt = task.get("prompt", "")
        
        # Create specialized prompt for wiggle
        wiggle_prompt = f"""
        Generate After Effects ExtendScript for the following wiggle request:
        {prompt}
        
        Requirements:
        1. Use proper wiggle() expression syntax
        2. Include seedRandom() for consistency
        3. Add error handling with try-catch
        4. Support both 2D and 3D layers
        5. Include clear comments
        
        Return only the ExtendScript code.
        """
        
        # Call Claude Sonnet 4
        response = self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            messages=[{"role": "user", "content": wiggle_prompt}]
        )
        
        return {
            "status": "success",
            "code": response.content[0].text,
            "agent": self.name,
            "model": "Sonnet 4"
        }

class MotionAnalysisAgent(BaseAgent):
    """Complex motion analysis agent (Opus 4.1)"""
    
    def __init__(self):
        super().__init__("MotionAnalysisAgent", "opus")
        
    def can_handle(self, task: Dict[str, Any]) -> bool:
        """Check if task involves video analysis"""
        keywords = ["analyze", "motion", "video", "extract", "track"]
        file_types = [".mp4", ".mov", ".avi"]
        
        task_text = str(task.get("prompt", "")).lower()
        file_path = task.get("file_path", "")
        
        has_keyword = any(keyword in task_text for keyword in keywords)
        has_video = any(file_path.endswith(ext) for ext in file_types)
        
        return has_keyword or has_video
    
    def process(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze video and extract motion data"""
        # Complex analysis requiring Opus 4.1
        analysis_prompt = f"""
        Analyze the video file and generate:
        1. Motion tracking data for key points
        2. Velocity and acceleration curves
        3. Lottie-compatible JSON output
        4. After Effects expression to recreate the motion
        
        Video: {task.get('file_path')}
        Requirements: {task.get('prompt')}
        
        Provide comprehensive motion analysis.
        """
        
        response = self.client.messages.create(
            model=self.model,
            max_tokens=4000,
            messages=[{"role": "user", "content": analysis_prompt}]
        )
        
        return {
            "status": "success",
            "analysis": response.content[0].text,
            "agent": self.name,
            "model": "Opus 4.1"
        }

class MetaAgent(BaseAgent):
    """Revolutionary meta-agent that creates new agents"""
    
    def __init__(self):
        super().__init__("MetaAgent", "opus")
        self.pattern_threshold = 5  # Minimum repetitions to trigger
        self.created_agents = []
        
    def can_handle(self, task: Dict[str, Any]) -> bool:
        """Meta agent handles pattern analysis and agent creation"""
        return task.get("type") == "pattern_analysis" or task.get("type") == "create_agent"
    
    def analyze_patterns(self, history: list) -> Optional[Dict]:
        """Detect repeated patterns in task history"""
        # Pattern detection logic
        pattern_counts = {}
        
        for task in history:
            pattern_key = self._extract_pattern_key(task)
            pattern_counts[pattern_key] = pattern_counts.get(pattern_key, 0) + 1
        
        # Find patterns exceeding threshold
        for pattern, count in pattern_counts.items():
            if count >= self.pattern_threshold:
                return {
                    "pattern": pattern,
                    "count": count,
                    "tasks": [t for t in history if self._extract_pattern_key(t) == pattern]
                }
        
        return None
    
    def _extract_pattern_key(self, task: Dict) -> str:
        """Extract pattern signature from task"""
        # Simplified pattern extraction
        prompt = task.get("prompt", "")
        keywords = []
        
        for word in prompt.lower().split():
            if len(word) > 4:  # Focus on meaningful words
                keywords.append(word)
        
        return "_".join(sorted(keywords[:5]))  # Top 5 keywords
    
    def process(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Create new agent based on detected pattern"""
        
        if task.get("type") == "pattern_analysis":
            pattern = self.analyze_patterns(task.get("history", []))
            
            if pattern:
                # Generate new agent code
                agent_code = self.generate_agent_code(pattern)
                return {
                    "status": "pattern_detected",
                    "pattern": pattern,
                    "agent_code": agent_code
                }
            else:
                return {"status": "no_pattern"}
        
        elif task.get("type") == "create_agent":
            # Create and deploy new agent
            pattern = task.get("pattern")
            agent_code = self.generate_agent_code(pattern)
            
            # Save the new agent
            agent_name = f"AutoAgent_{len(self.created_agents) + 1}"
            self.deploy_agent(agent_code, agent_name)
            
            return {
                "status": "agent_created",
                "name": agent_name,
                "code": agent_code
            }
    
    def generate_agent_code(self, pattern: Dict) -> str:
        """Generate Python code for new agent using Claude"""
        
        generation_prompt = f"""
        Create a new Python agent class based on this pattern:
        Pattern: {pattern['pattern']}
        Frequency: {pattern['count']} occurrences
        Sample tasks: {pattern['tasks'][:3]}
        
        Generate a complete agent class that:
        1. Extends BaseAgent
        2. Specializes in this specific pattern
        3. Uses appropriate Claude model (Sonnet for simple, Opus for complex)
        4. Includes can_handle() and process() methods
        5. Has optimized prompts for this pattern
        
        Return only valid Python code.
        """
        
        response = self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{"role": "user", "content": generation_prompt}]
        )
        
        return response.content[0].text
    
    def deploy_agent(self, code: str, name: str):
        """Deploy new agent to the system"""
        # Save to file
        agent_path = f"agents/generated/{name}.py"
        with open(agent_path, 'w') as f:
            f.write(code)
        
        # Track created agent
        self.created_agents.append({
            "name": name,
            "created_at": datetime.now().isoformat(),
            "code_path": agent_path
        })
        
        print(f"🤖 New agent deployed: {name}")

class OrchestratorAgent:
    """Central orchestrator that coordinates all agents"""
    
    def __init__(self):
        self.agents = []
        self.meta_agent = MetaAgent()
        self.task_history = []
        
        # Register default agents
        self.register_agent(WiggleAgent())
        self.register_agent(MotionAnalysisAgent())
        self.register_agent(self.meta_agent)
    
    def register_agent(self, agent: BaseAgent):
        """Register a new agent with the orchestrator"""
        self.agents.append(agent)
        print(f"✅ Registered agent: {agent.name}")
    
    def route_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Route task to appropriate agent"""
        
        # Record task for pattern analysis
        self.task_history.append(task)
        
        # Check for pattern detection trigger
        if len(self.task_history) % 20 == 0:  # Every 20 tasks
            pattern_task = {
                "type": "pattern_analysis",
                "history": self.task_history
            }
            result = self.meta_agent.execute(pattern_task)
            
            if result.get("status") == "pattern_detected":
                # Create new agent for detected pattern
                create_task = {
                    "type": "create_agent",
                    "pattern": result["pattern"]
                }
                self.meta_agent.execute(create_task)
        
        # Find capable agent
        for agent in self.agents:
            if agent.can_handle(task):
                return agent.execute(task)
        
        # No agent can handle
        return {"error": "No agent available for this task"}

# Example usage
if __name__ == "__main__":
    # Initialize orchestrator
    orchestrator = OrchestratorAgent()
    
    # Test wiggle task
    wiggle_task = {
        "prompt": "Add wiggle to position with frequency 2 and amplitude 50",
        "file_path": "test.txt"
    }
    
    result = orchestrator.route_task(wiggle_task)
    print(f"Result: {result}")
    
    # Test motion analysis
    motion_task = {
        "prompt": "Analyze motion in video and extract keyframes",
        "file_path": "sample.mp4"
    }
    
    result = orchestrator.route_task(motion_task)
    print(f"Result: {result}")