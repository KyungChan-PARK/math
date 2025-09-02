"""
Agent Orchestrator - Central Hub for All Sub-Agents
Implements IndyDevDan's Prompt→Sub-Agent Orchestration Pattern
"""

import asyncio
import json
from typing import Dict, List, Optional, Any
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

# Import all agents
from wiggle_agent import WiggleAgent
from complex_animation_agent import ComplexAnimationAgent
from meta_agent import MetaAgent

console = Console()

class AgentOrchestrator:
    """Central orchestrator following IndyDevDan's pattern"""
    
    def __init__(self):
        self.agents = {
            "wiggle": WiggleAgent(),
            "complex": ComplexAnimationAgent(),
            "meta": MetaAgent()
        }
        self.routing_rules = self.load_routing_rules()
        self.execution_history = []
        
    def load_routing_rules(self) -> Dict:
        """Load routing rules for agent selection"""
        return {
            "wiggle_triggers": ["wiggle", "shake", "jitter", "random movement"],
            "complex_triggers": ["multi-layer", "complex", "synchronize", "advanced"],
            "meta_triggers": ["create agent", "analyze patterns", "optimize workflow"]
        }
    
    def select_agent(self, prompt: str) -> str:
        """Select the most appropriate agent based on prompt analysis"""
        prompt_lower = prompt.lower()
        
        # Check for specific triggers
        for trigger in self.routing_rules["complex_triggers"]:
            if trigger in prompt_lower:
                return "complex"
        
        for trigger in self.routing_rules["wiggle_triggers"]:
            if trigger in prompt_lower:
                return "wiggle"
        
        for trigger in self.routing_rules["meta_triggers"]:
            if trigger in prompt_lower:
                return "meta"
        
        # Default to complex for unknown patterns
        return "complex"    
    async def execute_parallel(self, tasks: List[Dict]) -> List[Dict]:
        """Execute multiple agent tasks in parallel"""
        console.print("[cyan]🚀 Executing parallel agent tasks...[/cyan]")
        
        async_tasks = []
        for task in tasks:
            agent_name = self.select_agent(task.get("prompt", ""))
            agent = self.agents.get(agent_name)
            if agent:
                async_tasks.append(agent.execute(task))
        
        results = await asyncio.gather(*async_tasks)
        return results
    
    async def execute_sequential(self, prompt: str) -> Dict:
        """Execute single task with appropriate agent"""
        agent_name = self.select_agent(prompt)
        
        console.print(f"[yellow]→ Routing to {agent_name} agent[/yellow]")
        
        agent = self.agents.get(agent_name)
        if not agent:
            return {"status": "error", "message": f"Agent {agent_name} not found"}
        
        result = await agent.execute({"prompt": prompt})
        
        # Track execution history for pattern analysis
        self.execution_history.append({
            "prompt": prompt,
            "agent": agent_name,
            "result": result.get("status"),
            "timestamp": asyncio.get_event_loop().time()
        })
        
        # Periodically analyze patterns with Meta Agent
        if len(self.execution_history) % 10 == 0:
            await self.analyze_patterns()
        
        return result
    
    async def analyze_patterns(self):
        """Use Meta Agent to analyze execution patterns"""
        console.print("[magenta]🧠 Analyzing patterns with Meta Agent...[/magenta]")
        
        meta_result = await self.agents["meta"].execute({
            "type": "analyze",
            "history": self.execution_history[-50:]  # Last 50 executions
        })
        
        if meta_result.get("status") == "agent_created":
            console.print(f"[green]✨ New agent created: {meta_result.get('agent_name')}[/green]")
            # Dynamically load the new agent
            await self.reload_agents()
    
    async def reload_agents(self):
        """Dynamically reload agents including newly created ones"""
        agents_dir = Path("agents")
        for agent_file in agents_dir.glob("*_agent.py"):
            # Dynamic import logic here
            pass
    
    def show_status(self):
        """Display current orchestrator status"""
        table = Table(title="🎭 Agent Orchestrator Status")
        table.add_column("Agent", style="cyan")
        table.add_column("Type", style="yellow")
        table.add_column("Model", style="green")
        table.add_column("Status", style="blue")
        
        for name, agent in self.agents.items():
            table.add_row(
                agent.name,
                agent.description[:30] + "...",
                agent.model_preference,
                "✅ Active"
            )
        
        console.print(table)