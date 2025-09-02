"""
Meta Agent - The Agent that Creates Other Agents
Based on IndyDevDan's "My Claude Code Sub Agents BUILD THEMSELVES"
"""

import json
import textwrap
from pathlib import Path
from typing import Dict, List, Optional
from base_agent import BaseSubAgent, console
from rich.panel import Panel

class MetaAgent(BaseSubAgent):
    """Meta Agent that analyzes patterns and creates new specialized agents"""
    
    def __init__(self):
        super().__init__(
            name="MetaAgent",
            description="Analyzes patterns and creates new specialized sub-agents",
            model_preference="opus"  # Meta-reasoning requires Opus
        )
        self.agents_dir = Path("agents")
        self.generated_agents = []
    
    def load_system_prompt(self) -> str:
        return """You are a Meta Agent responsible for analyzing patterns and creating new specialized agents.
        
        Your responsibilities:
        1. Analyze user patterns and repetitive tasks
        2. Identify opportunities for new specialized agents
        3. Generate complete Python code for new sub-agents
        4. Define system prompts for new agents
        5. Determine optimal model routing (Opus vs Sonnet)
        
        When creating a new agent, generate:
        1. Complete Python class extending BaseSubAgent
        2. Specialized system prompt
        3. Execution logic
        4. Model preference based on complexity
        
        Output format:
        {
            "agent_name": "string",
            "agent_code": "complete Python code",
            "agent_description": "string",
            "model_preference": "opus|sonnet|auto",
            "trigger_patterns": ["list", "of", "triggers"]
        }"""    
    async def analyze_patterns(self, usage_history: List[Dict]) -> Dict:
        """Analyze usage patterns to identify new agent opportunities"""
        
        analysis_prompt = f"""
        Analyze these usage patterns and identify opportunities for new specialized agents:
        
        {json.dumps(usage_history, indent=2)}
        
        Look for:
        - Repetitive tasks that could be automated
        - Complex workflows that need specialization
        - Common patterns across multiple requests
        
        If you identify a pattern worth creating a new agent for, generate the complete agent code.
        Otherwise, return {"create_agent": false}
        """
        
        message = self.client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=4000,
            system=self.system_prompt,
            messages=[{"role": "user", "content": analysis_prompt}]
        )
        
        try:
            result = json.loads(message.content[0].text)
            if result.get("create_agent", False):
                return await self.create_new_agent(result)
            return {"status": "no_pattern_found"}
        except json.JSONDecodeError:
            return {"status": "analysis_failed"}
    
    async def create_new_agent(self, agent_spec: Dict) -> Dict:
        """Create a new specialized agent based on specifications"""
        
        agent_name = agent_spec.get("agent_name", "CustomAgent")
        agent_code = agent_spec.get("agent_code", "")
        
        # Save the new agent code
        agent_path = self.agents_dir / f"{agent_name.lower()}.py"
        agent_path.write_text(agent_code, encoding='utf-8')
        
        # Update configuration
        self.update_drops_config(agent_spec)
        
        console.print(Panel(
            f"✨ New Agent Created: {agent_name}\n"
            f"📄 File: {agent_path}\n"
            f"🎯 Triggers: {', '.join(agent_spec.get('trigger_patterns', []))}",
            title="Meta Agent Creation",
            border_style="green"
        ))
        
        return {
            "status": "agent_created",
            "agent_name": agent_name,
            "agent_path": str(agent_path)
        }    
    def update_drops_config(self, agent_spec: Dict):
        """Update drops configuration with new agent"""
        import yaml
        
        config_path = Path("enhanced_drops.yaml")
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        # Add new drop zone for the created agent
        new_zone = {
            "name": f"{agent_spec['agent_name']} Zone",
            "description": agent_spec.get("agent_description", "Auto-generated zone"),
            "file_patterns": ["*.txt", "*.md"],
            "zone_dirs": [f"drops/{agent_spec['agent_name'].lower()}"],
            "events": ["created"],
            "agent": agent_spec['agent_name'].lower(),
            "routing_config": {
                "force_model": agent_spec.get("model_preference", "auto"),
                "triggers": agent_spec.get("trigger_patterns", [])
            },
            "auto_generated": True
        }
        
        config['drop_zones'][f"{agent_spec['agent_name'].lower()}_zone"] = new_zone
        
        with open(config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        
        # Create the drop zone directory
        zone_dir = Path(f"drops/{agent_spec['agent_name'].lower()}")
        zone_dir.mkdir(parents=True, exist_ok=True)
    
    async def execute(self, task: Dict) -> Dict:
        """Execute meta agent tasks"""
        task_type = task.get("type", "analyze")
        
        if task_type == "analyze":
            return await self.analyze_patterns(task.get("history", []))
        elif task_type == "create":
            return await self.create_new_agent(task.get("spec", {}))
        else:
            return {"status": "unknown_task_type"}