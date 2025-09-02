"""
Specialized Sub-Agents for After Effects Automation
Following IndyDevDan's Sub-Agent Pattern
"""

from base_agent import BaseSubAgent, console
from typing import Dict, Any
import json

class WiggleAgent(BaseSubAgent):
    """Specialized agent for wiggle expressions and animations"""
    
    def __init__(self):
        super().__init__(
            name="WiggleAgent",
            description="Expert in wiggle expressions and random animations",
            model_preference="sonnet"  # Simple enough for Sonnet
        )
    
    def load_system_prompt(self) -> str:
        return """You are a specialized After Effects wiggle expression expert.
        You ONLY generate wiggle-related ExtendScript code.
        
        Your expertise includes:
        - Wiggle expressions with various frequencies and amplitudes
        - Loop expressions
        - Random seed controls
        - Smooth random animations
        
        Always include:
        - Error handling with try/catch
        - Undo groups
        - Clear comments
        
        Output ONLY ExtendScript code, no explanations."""
    
    async def execute(self, task: Dict) -> Dict:
        prompt = task.get('prompt', '')
        
        message = self.client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=2000,
            system=self.system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return {
            "agent": self.name,
            "result": message.content[0].text,
            "status": "success"
        }