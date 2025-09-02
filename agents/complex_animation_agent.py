"""
Complex Animation Agent - Requires Opus for advanced logic
"""

from base_agent import BaseSubAgent
from typing import Dict

class ComplexAnimationAgent(BaseSubAgent):
    """Agent for complex multi-layer animations and advanced scripting"""
    
    def __init__(self):
        super().__init__(
            name="ComplexAnimationAgent",
            description="Handles complex animations, multi-layer operations, and advanced expressions",
            model_preference="opus"  # Always use Opus for complex tasks
        )
    
    def load_system_prompt(self) -> str:
        return """You are an advanced After Effects automation specialist.
        You handle COMPLEX animations requiring:
        - Multi-layer synchronization
        - Advanced expressions with conditionals
        - Time remapping
        - Parent-child relationships
        - Complex shape animations
        - Motion path generation
        
        Your code must be production-ready with:
        - Comprehensive error handling
        - Performance optimization
        - Memory management
        - Detailed inline documentation
        
        Generate ONLY ExtendScript code."""
    
    async def execute(self, task: Dict) -> Dict:
        prompt = task.get('prompt', '')
        
        message = self.client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=4000,
            system=self.system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "agent": self.name,
            "result": message.content[0].text,
            "status": "success",
            "complexity": "high"
        }