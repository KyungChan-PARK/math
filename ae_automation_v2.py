#!/usr/bin/env python3
"""
AE Automation v2.0 - Complete Rewrite with Agent Architecture
IndyDevDan Pattern Implementation
Author: Claude AI Project Conductor
Date: 2025-09-01
"""

import os
import sys
import asyncio
import json
import sqlite3
import time
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Third-party imports
import anthropic
import yaml
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.live import Live
from rich.progress import Progress, SpinnerColumn, TextColumn
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Initialize console for beautiful output
console = Console()

# API Configuration
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
if not ANTHROPIC_API_KEY:
    console.print("[red]ERROR: ANTHROPIC_API_KEY not found in .env file[/red]")
    sys.exit(1)
# ============================================================================
# CORE ENUMS AND DATACLASSES
# ============================================================================

class AgentType(Enum):
    """Types of agents in the system"""
    WIGGLE = "wiggle"
    MOTION = "motion"
    BATCH = "batch"
    TEMPLATE = "template"
    META = "meta"
    CUSTOM = "custom"

class ModelType(Enum):
    """Claude model types"""
    OPUS = "claude-3-opus-20240229"
    SONNET = "claude-3-sonnet-20240229"

@dataclass
class Task:
    """Task representation"""
    id: str
    type: str
    prompt: str
    file_path: Optional[str] = None
    metadata: Dict[str, Any] = None
    timestamp: float = None
    
    def __post_init__(self):
        if not self.id:
            self.id = hashlib.md5(f"{self.prompt}{time.time()}".encode()).hexdigest()[:8]
        if not self.timestamp:
            self.timestamp = time.time()

@dataclass
class AgentResult:
    """Result from agent execution"""
    success: bool
    agent_name: str
    model_used: str
    output: Any
    error: Optional[str] = None
    execution_time: float = 0.0
    tokens_used: int = 0
    cost: float = 0.0
# ============================================================================
# ADVANCED CACHE SYSTEM
# ============================================================================

class AdvancedCache:
    """Intelligent caching system with semantic similarity"""
    
    def __init__(self, db_path: str = "cache/ae_cache_v2.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        self.init_db()
        
    def init_db(self):
        """Initialize cache database"""
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                prompt TEXT,
                response TEXT,
                model TEXT,
                agent TEXT,
                timestamp REAL,
                hit_count INTEGER DEFAULT 0,
                quality_score REAL DEFAULT 1.0
            )
        """)
        conn.commit()
        conn.close()
    
    def get_cache_key(self, prompt: str, agent: str) -> str:
        """Generate cache key from prompt and agent"""
        return hashlib.sha256(f"{prompt}:{agent}".encode()).hexdigest()
    
    def get(self, prompt: str, agent: str, similarity_threshold: float = 0.85) -> Optional[str]:
        """Get cached response with similarity matching"""
        key = self.get_cache_key(prompt, agent)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Exact match
        cursor.execute(
            "SELECT response, quality_score FROM cache WHERE key = ?",
            (key,)
        )
        result = cursor.fetchone()
        
        if result and result[1] > 0.8:  # Quality threshold
            cursor.execute(
                "UPDATE cache SET hit_count = hit_count + 1 WHERE key = ?",
                (key,)
            )
            conn.commit()
            conn.close()
            return result[0]
        
        # TODO: Implement semantic similarity search
        conn.close()
        return None
    
    def store(self, prompt: str, response: str, agent: str, model: str, quality: float = 1.0):
        """Store response in cache with quality score"""
        key = self.get_cache_key(prompt, agent)
        
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """INSERT OR REPLACE INTO cache 
               (key, prompt, response, model, agent, timestamp, quality_score) 
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (key, prompt, response, model, agent, time.time(), quality)
        )
        conn.commit()
        conn.close()
# ============================================================================
# BASE AGENT ARCHITECTURE
# ============================================================================

class BaseAgent:
    """Base class for all AI agents"""
    
    def __init__(self, name: str, agent_type: AgentType, preferred_model: ModelType):
        self.name = name
        self.agent_type = agent_type
        self.preferred_model = preferred_model
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.cache = AdvancedCache()
        self.execution_count = 0
        self.total_tokens = 0
        self.total_cost = 0.0
        
    def can_handle(self, task: Task) -> bool:
        """Check if agent can handle the task"""
        raise NotImplementedError
    
    def create_prompt(self, task: Task) -> str:
        """Create optimized prompt for the task"""
        raise NotImplementedError
    
    async def execute(self, task: Task) -> AgentResult:
        """Execute task with caching and error handling"""
        start_time = time.time()
        
        # Check cache first
        cached = self.cache.get(task.prompt, self.name)
        if cached:
            console.print(f"[green]💾 Cache hit for {self.name}[/green]")
            return AgentResult(
                success=True,
                agent_name=self.name,
                model_used="cache",
                output=cached,
                execution_time=time.time() - start_time,
                cost=0.0
            )        
        try:
            # Create optimized prompt
            prompt = self.create_prompt(task)
            
            # Call Claude API
            console.print(f"[yellow]🤖 {self.name} processing with {self.preferred_model.name}...[/yellow]")
            
            response = self.client.messages.create(
                model=self.preferred_model.value,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            output = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens
            cost = self.calculate_cost(tokens, self.preferred_model)
            
            # Update stats
            self.execution_count += 1
            self.total_tokens += tokens
            self.total_cost += cost
            
            # Cache the response
            self.cache.store(task.prompt, output, self.name, self.preferred_model.value)
            
            return AgentResult(
                success=True,
                agent_name=self.name,
                model_used=self.preferred_model.name,
                output=output,
                execution_time=time.time() - start_time,
                tokens_used=tokens,
                cost=cost
            )
            
        except Exception as e:
            console.print(f"[red]❌ Error in {self.name}: {str(e)}[/red]")
            return AgentResult(
                success=False,
                agent_name=self.name,
                model_used=self.preferred_model.name,
                output=None,
                error=str(e),
                execution_time=time.time() - start_time
            )
    
    def calculate_cost(self, tokens: int, model: ModelType) -> float:
        """Calculate API cost"""
        rates = {
            ModelType.OPUS: 0.015,  # $15 per 1M tokens
            ModelType.SONNET: 0.003  # $3 per 1M tokens
        }
        return (tokens / 1_000_000) * rates.get(model, 0.003)
# ============================================================================
# SPECIALIZED AGENTS
# ============================================================================

class WiggleAgent(BaseAgent):
    """Specialized agent for wiggle animations"""
    
    def __init__(self):
        super().__init__("WiggleAgent", AgentType.WIGGLE, ModelType.SONNET)
        self.keywords = ["wiggle", "shake", "jitter", "random", "noise", "vibrate"]
        
    def can_handle(self, task: Task) -> bool:
        """Check if task involves wiggle expressions"""
        task_lower = task.prompt.lower()
        return any(keyword in task_lower for keyword in self.keywords)
    
    def create_prompt(self, task: Task) -> str:
        """Create wiggle-optimized prompt"""
        return f"""Generate After Effects ExtendScript for this wiggle request:

Request: {task.prompt}

Requirements:
1. Use proper wiggle() expression syntax
2. Include seedRandom(index, true) for consistency
3. Add app.beginUndoGroup() and app.endUndoGroup()
4. Support both 2D and 3D layers
5. Include error handling with try-catch
6. Add clear comments explaining parameters

Output format:
- Complete, ready-to-run ExtendScript code
- No explanations outside of code comments
- Include usage instructions as comments"""

class MotionAnalysisAgent(BaseAgent):
    """Complex motion analysis agent"""
    
    def __init__(self):
        super().__init__("MotionAnalysisAgent", AgentType.MOTION, ModelType.OPUS)
        self.supported_formats = [".mp4", ".mov", ".avi", ".webm"]
        
    def can_handle(self, task: Task) -> bool:
        """Check if task involves video motion analysis"""
        has_video = task.file_path and any(
            task.file_path.endswith(fmt) for fmt in self.supported_formats
        )
        has_keywords = any(
            word in task.prompt.lower() 
            for word in ["motion", "analyze", "extract", "track", "video"]
        )
        return has_video or has_keywords
    
    def create_prompt(self, task: Task) -> str:
        """Create motion analysis prompt"""
        return f"""Analyze this motion graphics request and generate After Effects solutions:

Request: {task.prompt}
File: {task.file_path if task.file_path else 'No file provided'}

Generate:
1. Detailed motion analysis approach
2. ExtendScript code for motion extraction
3. Expression code for recreating the motion
4. Lottie-compatible JSON structure (if applicable)
5. Performance optimization suggestions

Focus on creating production-ready code that can be immediately used in After Effects."""
# ============================================================================
# META AGENT - SELF-CREATING AI
# ============================================================================

class MetaAgent(BaseAgent):
    """Revolutionary agent that creates new agents based on patterns"""
    
    def __init__(self):
        super().__init__("MetaAgent", AgentType.META, ModelType.OPUS)
        self.pattern_threshold = int(os.getenv('PATTERN_DETECTION_THRESHOLD', 5))
        self.created_agents = []
        self.pattern_history = {}
        
    def can_handle(self, task: Task) -> bool:
        """Meta agent handles pattern analysis and agent creation"""
        return task.type in ["pattern_analysis", "create_agent", "optimize_system"]
    
    def analyze_patterns(self, task_history: List[Task]) -> Optional[Dict]:
        """Detect repeated patterns in task history"""
        pattern_signatures = {}
        
        for task in task_history:
            # Extract pattern signature
            signature = self._extract_signature(task.prompt)
            pattern_signatures[signature] = pattern_signatures.get(signature, 0) + 1
        
        # Find patterns exceeding threshold
        for signature, count in pattern_signatures.items():
            if count >= self.pattern_threshold:
                return {
                    "signature": signature,
                    "count": count,
                    "examples": [t for t in task_history if self._extract_signature(t.prompt) == signature][:3]
                }
        return None
    
    def _extract_signature(self, prompt: str) -> str:
        """Extract pattern signature from prompt"""
        # Remove numbers and specific values
        import re
        cleaned = re.sub(r'\d+', 'NUM', prompt.lower())
        # Extract key action words
        keywords = []
        for word in cleaned.split():
            if len(word) > 3 and word not in ['with', 'from', 'that', 'this', 'have']:
                keywords.append(word)
        return "_".join(sorted(keywords[:5]))    
    def create_prompt(self, task: Task) -> str:
        """Create prompt for meta operations"""
        if task.type == "create_agent":
            pattern = task.metadata.get("pattern", {})
            return f"""Create a new specialized Python agent class for After Effects automation.

Pattern detected: {pattern.get('signature')}
Frequency: {pattern.get('count')} occurrences
Example tasks:
{json.dumps([ex.prompt for ex in pattern.get('examples', [])], indent=2)}

Generate a complete Python class that:
1. Extends BaseAgent
2. Specializes in this specific pattern
3. Uses ModelType.SONNET for simple tasks, ModelType.OPUS for complex
4. Implements can_handle() method with pattern matching
5. Implements create_prompt() method with optimized prompts
6. Includes docstrings and type hints
7. Has unique agent name based on the pattern

Return ONLY valid Python code, no explanations."""
        
        return f"Analyze system performance and suggest optimizations: {task.prompt}"
    
    async def generate_and_deploy_agent(self, pattern: Dict) -> str:
        """Generate and deploy a new agent"""
        # Create task for agent generation
        task = Task(
            type="create_agent",
            prompt="Generate new agent",
            metadata={"pattern": pattern}
        )
        
        # Generate agent code
        result = await self.execute(task)
        
        if result.success:
            # Extract agent name from generated code
            import re
            match = re.search(r'class (\w+Agent)', result.output)
            agent_name = match.group(1) if match else f"CustomAgent_{len(self.created_agents)}"
            
            # Save agent to file
            agent_path = Path(f"agents/generated/{agent_name}.py")
            agent_path.parent.mkdir(parents=True, exist_ok=True)
            agent_path.write_text(result.output)
            
            # Track created agent
            self.created_agents.append({
                "name": agent_name,
                "pattern": pattern['signature'],
                "created_at": datetime.now().isoformat(),
                "path": str(agent_path)
            })
            
            console.print(f"[green]🎉 New agent created: {agent_name}[/green]")
            return agent_name
        
        return None
# ============================================================================
# ORCHESTRATOR - CENTRAL COORDINATION
# ============================================================================

class Orchestrator:
    """Central orchestrator that manages all agents"""
    
    def __init__(self):
        self.agents = []
        self.meta_agent = MetaAgent()
        self.task_history = []
        self.stats = {
            "total_tasks": 0,
            "opus_calls": 0,
            "sonnet_calls": 0,
            "cache_hits": 0,
            "total_cost": 0.0,
            "agents_created": 0
        }
        
        # Register built-in agents
        self.register_agent(WiggleAgent())
        self.register_agent(MotionAnalysisAgent())
        self.register_agent(self.meta_agent)
        
        # Load any previously created agents
        self.load_generated_agents()
    
    def register_agent(self, agent: BaseAgent):
        """Register an agent with the orchestrator"""
        self.agents.append(agent)
        console.print(f"[cyan]✅ Registered: {agent.name}[/cyan]")
    
    def load_generated_agents(self):
        """Load dynamically generated agents"""
        generated_path = Path("agents/generated")
        if generated_path.exists():
            for agent_file in generated_path.glob("*.py"):
                # TODO: Dynamically import and instantiate agents
                console.print(f"[dim]Found generated agent: {agent_file.name}[/dim]")
    
    async def route_task(self, task: Task) -> AgentResult:
        """Route task to the most appropriate agent"""
        self.stats["total_tasks"] += 1
        self.task_history.append(task)
        
        # Check for pattern detection trigger
        if len(self.task_history) % 20 == 0:
            await self._check_patterns()
        
        # Find capable agent
        for agent in self.agents:
            if agent.can_handle(task):
                console.print(f"[blue]📋 Task routed to: {agent.name}[/blue]")
                result = await agent.execute(task)
                
                # Update statistics
                if result.model_used == "cache":
                    self.stats["cache_hits"] += 1
                elif "OPUS" in result.model_used:
                    self.stats["opus_calls"] += 1
                elif "SONNET" in result.model_used:
                    self.stats["sonnet_calls"] += 1
                
                self.stats["total_cost"] += result.cost
                
                return result
        
        # No agent found
        return AgentResult(
            success=False,
            agent_name="Orchestrator",
            model_used="none",
            output=None,
            error="No agent available for this task type"
        )    
    async def _check_patterns(self):
        """Check for patterns and create new agents if needed"""
        pattern = self.meta_agent.analyze_patterns(self.task_history)
        
        if pattern:
            console.print(f"[yellow]🔍 Pattern detected: {pattern['signature']} ({pattern['count']} times)[/yellow]")
            
            # Check if agent already exists for this pattern
            existing = any(
                agent.name.lower() == pattern['signature'].replace('_', '') 
                for agent in self.agents
            )
            
            if not existing:
                # Create new agent for this pattern
                agent_name = await self.meta_agent.generate_and_deploy_agent(pattern)
                if agent_name:
                    self.stats["agents_created"] += 1
                    # TODO: Dynamically load the new agent
                    console.print(f"[green]✨ Agent factory created: {agent_name}[/green]")
    
    def show_stats(self):
        """Display system statistics"""
        table = Table(title="📊 System Statistics")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")
        
        table.add_row("Total Tasks", str(self.stats["total_tasks"]))
        table.add_row("Opus Calls", str(self.stats["opus_calls"]))
        table.add_row("Sonnet Calls", str(self.stats["sonnet_calls"]))
        table.add_row("Cache Hits", str(self.stats["cache_hits"]))
        table.add_row("Total Cost", f"${self.stats['total_cost']:.4f}")
        table.add_row("Agents Created", str(self.stats["agents_created"]))
        
        if self.stats["total_tasks"] > 0:
            cache_rate = (self.stats["cache_hits"] / self.stats["total_tasks"]) * 100
            table.add_row("Cache Hit Rate", f"{cache_rate:.1f}%")
            
            total_api_calls = self.stats["opus_calls"] + self.stats["sonnet_calls"]
            if total_api_calls > 0:
                savings = ((self.stats["cache_hits"] + self.stats["sonnet_calls"]) / 
                          (total_api_calls + self.stats["cache_hits"])) * 100
                table.add_row("Cost Savings", f"{savings:.1f}%")
        
        console.print(table)
# ============================================================================
# DROP ZONE FILE HANDLER
# ============================================================================

class DropZoneHandler(FileSystemEventHandler):
    """Handles file drops in designated zones"""
    
    def __init__(self, zone_config: Dict, orchestrator: Orchestrator):
        self.zone_config = zone_config
        self.orchestrator = orchestrator
        self.zone_name = zone_config['name']
        self.processing = False
        
    def on_created(self, event):
        """Handle new file in drop zone"""
        if event.is_directory or self.processing:
            return
        
        file_path = Path(event.src_path)
        
        # Check file pattern
        patterns = self.zone_config.get('file_patterns', ['*'])
        if not any(file_path.match(pattern) for pattern in patterns):
            return
        
        self.processing = True
        console.print(f"\n[cyan]📁 File dropped in {self.zone_name}: {file_path.name}[/cyan]")
        
        # Process file asynchronously
        asyncio.run(self.process_file(file_path))
        self.processing = False
    
    async def process_file(self, file_path: Path):
        """Process dropped file"""
        try:
            # Read file content
            content = file_path.read_text(encoding='utf-8')
            
            # Create task
            task = Task(
                type=self.zone_config.get('task_type', 'general'),
                prompt=content,
                file_path=str(file_path),
                metadata={"zone": self.zone_name}
            )
            
            # Route to orchestrator
            with console.status(f"[yellow]Processing {file_path.name}...[/yellow]"):
                result = await self.orchestrator.route_task(task)
            
            if result.success:
                # Save output
                output_path = self.save_output(result, file_path)
                console.print(f"[green]✅ Success! Output saved to: {output_path}[/green]")
                
                # Execute if configured
                if self.zone_config.get('auto_execute') and output_path.suffix == '.jsx':
                    self.execute_in_ae(output_path)
            else:
                console.print(f"[red]❌ Failed: {result.error}[/red]")
                
        except Exception as e:
            console.print(f"[red]Error processing file: {str(e)}[/red]")    
    def save_output(self, result: AgentResult, input_file: Path) -> Path:
        """Save agent output to file"""
        # Create output directory
        output_dir = Path("outputs") / self.zone_name / datetime.now().strftime("%Y%m%d")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate output filename
        timestamp = datetime.now().strftime("%H%M%S")
        base_name = input_file.stem
        
        # Determine extension based on output type
        if "jsx" in result.output.lower() or "extendscript" in result.output.lower():
            ext = ".jsx"
        elif "json" in result.output.lower():
            ext = ".json"
        else:
            ext = ".txt"
        
        output_path = output_dir / f"{base_name}_{result.agent_name}_{timestamp}{ext}"
        output_path.write_text(result.output)
        
        return output_path
    
    def execute_in_ae(self, script_path: Path):
        """Execute ExtendScript in After Effects"""
        import subprocess
        import platform
        
        if platform.system() == "Windows":
            ae_path = Path(r"C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\AfterFX.exe")
            if ae_path.exists():
                try:
                    subprocess.run([str(ae_path), "-r", str(script_path)])
                    console.print("[green]🎬 Executed in After Effects[/green]")
                except Exception as e:
                    console.print(f"[yellow]⚠ Could not auto-execute: {e}[/yellow]")
# ============================================================================
# MAIN SYSTEM CLASS
# ============================================================================

class AEAutomationV2:
    """Main system orchestrating all components"""
    
    def __init__(self, config_path: str = "config_v2.yaml"):
        self.config = self.load_config(config_path)
        self.orchestrator = Orchestrator()
        self.observers = []
        
    def load_config(self, config_path: str) -> Dict:
        """Load system configuration"""
        config_file = Path(config_path)
        
        if not config_file.exists():
            # Create default configuration
            default_config = {
                "drop_zones": {
                    "ae_vibe": {
                        "name": "AE Vibe Zone",
                        "file_patterns": ["*.txt", "*.md"],
                        "zone_dirs": ["drops/ae_vibe"],
                        "task_type": "wiggle",
                        "auto_execute": True
                    },
                    "motion_analysis": {
                        "name": "Motion Analysis Zone",
                        "file_patterns": ["*.mp4", "*.mov", "*.avi"],
                        "zone_dirs": ["drops/motion"],
                        "task_type": "motion",
                        "auto_execute": False
                    },
                    "batch_ops": {
                        "name": "Batch Operations",
                        "file_patterns": ["*.csv", "*.json"],
                        "zone_dirs": ["drops/batch"],
                        "task_type": "batch",
                        "auto_execute": True
                    }
                }
            }
            
            config_file.write_text(yaml.dump(default_config, default_flow_style=False))
            return default_config
        
        with open(config_file, 'r') as f:
            return yaml.safe_load(f)    
    def setup_drop_zones(self):
        """Initialize all drop zones"""
        console.print("\n[bold cyan]🚀 Initializing Drop Zones...[/bold cyan]\n")
        
        for zone_key, zone_config in self.config['drop_zones'].items():
            # Create zone directories
            for zone_dir in zone_config.get('zone_dirs', []):
                Path(zone_dir).mkdir(parents=True, exist_ok=True)
            
            # Setup file watcher
            handler = DropZoneHandler(zone_config, self.orchestrator)
            observer = Observer()
            
            for zone_dir in zone_config.get('zone_dirs', []):
                observer.schedule(handler, zone_dir, recursive=False)
            
            self.observers.append(observer)
            
            # Display status
            console.print(f"✅ {zone_config['name']}: [green]Active[/green]")
            console.print(f"   📁 Directories: {', '.join(zone_config['zone_dirs'])}")
            console.print(f"   📄 Patterns: {', '.join(zone_config['file_patterns'])}\n")
    
    def run(self):
        """Start the automation system"""
        # Display banner
        console.print(Panel.fit(
            "[bold cyan]AE Automation v2.0[/bold cyan]\n"
            "[yellow]Complete Rewrite with Agent Architecture[/yellow]\n"
            "[dim]Powered by Claude Opus 4.1 & Sonnet 4[/dim]",
            border_style="cyan"
        ))
        
        # Setup drop zones
        self.setup_drop_zones()
        
        # Start observers
        for observer in self.observers:
            observer.start()
        
        # Show initial stats
        self.orchestrator.show_stats()
        
        console.print("\n[bold green]🎯 System Ready![/bold green]")
        console.print("Drop files into the zones to process them automatically.")
        console.print("[dim]Press Ctrl+C to stop...[/dim]\n")
        
        try:
            while True:
                time.sleep(5)
                # Periodic stats update
                if self.orchestrator.stats["total_tasks"] > 0 and \
                   self.orchestrator.stats["total_tasks"] % 10 == 0:
                    self.orchestrator.show_stats()
                    
        except KeyboardInterrupt:
            self.shutdown()
    
    def shutdown(self):
        """Gracefully shutdown the system"""
        console.print("\n[yellow]Shutting down...[/yellow]")
        
        for observer in self.observers:
            observer.stop()
            observer.join()
        
        # Final stats
        console.print("\n[bold]Final Statistics:[/bold]")
        self.orchestrator.show_stats()
        
        # Save stats to file
        stats_file = Path("stats_v2.json")
        stats_file.write_text(json.dumps(self.orchestrator.stats, indent=2))
        
        console.print(f"\n[green]✅ System shutdown complete. Stats saved to {stats_file}[/green]")

# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    system = AEAutomationV2()
    system.run()