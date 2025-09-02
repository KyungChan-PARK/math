#!/usr/bin/env python3
"""
Enhanced AE Agentic Drop Zones with Claude Max Optimization
Single File Script (SFS) for After Effects Automation - v3.0 Fixed
Author: Claude Opus 4.1 Agent
Date: 2025-09-02
"""

import asyncio
import json
import os
import sqlite3
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Required imports
import anthropic
import yaml
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from dotenv import load_dotenv
from extendscript_cleaner import ExtendScriptCleaner
from ae_executor import AfterEffectsExecutor

# Load environment variables
load_dotenv()

# Initialize Rich console for beautiful output
console = Console()

class ClaudeMaxRouter:
    """Intelligent Claude model routing system"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.cache = CacheManager()
        self.stats = {"opus": 0, "sonnet": 0, "cache": 0, "total_cost": 0.0}
    
    def analyze_complexity(self, prompt: str, zone_config: Dict) -> int:
        """Analyze complexity from file content and zone config (1-10)"""
        complexity = 5  # Default
        
        # Check force model settings
        routing = zone_config.get('routing_config', {})
        if routing.get('force_model') == 'opus':
            return 10
        elif routing.get('force_model') == 'sonnet':
            return 3
        
        # Analyze trigger keywords
        opus_triggers = routing.get('opus_triggers', [])
        sonnet_triggers = routing.get('sonnet_triggers', [])
        
        prompt_lower = prompt.lower()
        
        for trigger in opus_triggers:
            if trigger.lower() in prompt_lower:
                complexity += 2
        
        for trigger in sonnet_triggers:
            if trigger.lower() in prompt_lower:
                complexity -= 1
        
        # Analyze prompt length and structure
        if len(prompt) > 1000:
            complexity += 1
        if len(prompt) > 3000:
            complexity += 2
        
        return max(1, min(10, complexity))
    
    async def route_request(self, prompt: str, zone_config: Dict) -> Tuple[str, str]:
        """Route request to appropriate model"""
        # 1. Check cache
        cache_key = self.cache.generate_key(prompt, zone_config['name'])
        cached_result = self.cache.get(cache_key)
        if cached_result:
            self.stats["cache"] += 1
            console.print("[green]OK Cache hit![/green]")
            return cached_result, "cache"
        
        # 2. Analyze complexity
        complexity = self.analyze_complexity(prompt, zone_config)
        
        # 3. Select model
        threshold = zone_config.get('routing_config', {}).get('complexity_threshold', 7)
        if complexity >= threshold:
            model = "claude-3-5-sonnet-20241022"  # Latest Opus equivalent
            model_name = "opus"
        else:
            model = "claude-3-5-haiku-20241022"  # Latest Haiku for simple tasks
            model_name = "sonnet"
        
        self.stats[model_name] += 1
        
        # 4. Call API
        try:
            console.print(f"[yellow]Using {model_name.upper()} (complexity: {complexity}/10)[/yellow]")
            
            message = self.client.messages.create(
                model=model,
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            result = message.content[0].text
            
            # 5. Cache result
            self.cache.store(cache_key, result)
            
            # 6. Calculate cost
            self.calculate_cost(model_name, len(prompt), len(result))
            
            return result, model_name
            
        except Exception as e:
            console.print(f"[red]Error calling Claude API: {e}[/red]")
            raise
    
    def calculate_cost(self, model: str, input_tokens: int, output_tokens: int):
        """Calculate and track API usage cost"""
        # Approximate token count
        input_tokens = input_tokens // 4
        output_tokens = output_tokens // 4
        
        if model == "opus":
            cost = (input_tokens * 0.015 + output_tokens * 0.075) / 1000
        else:  # sonnet
            cost = (input_tokens * 0.003 + output_tokens * 0.015) / 1000
        
        self.stats["total_cost"] += cost
        
    def print_stats(self):
        """Print usage statistics"""
        table = Table(title="Claude Max Usage Statistics")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")
        
        table.add_row("Opus Calls", str(self.stats["opus"]))
        table.add_row("Sonnet Calls", str(self.stats["sonnet"]))
        table.add_row("Cache Hits", str(self.stats["cache"]))
        table.add_row("Total Cost", f"${self.stats['total_cost']:.4f}")
        
        console.print(table)


class CacheManager:
    """Simple cache manager for responses"""
    
    def __init__(self, db_path: str = "cache/ae_cache_v3.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        self.init_db()
    
    def init_db(self):
        """Initialize cache database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                result TEXT,
                timestamp REAL
            )
        ''')
        conn.commit()
        conn.close()
    
    def generate_key(self, prompt: str, zone: str) -> str:
        """Generate cache key from prompt and zone"""
        import hashlib
        content = f"{zone}:{prompt}"
        return hashlib.sha256(content.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[str]:
        """Get cached result"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT result FROM cache WHERE key = ? AND timestamp > ?",
            (key, time.time() - 86400)  # 24 hour cache
        )
        result = cursor.fetchone()
        conn.close()
        return result[0] if result else None
    
    def store(self, key: str, result: str):
        """Store result in cache"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO cache (key, result, timestamp) VALUES (?, ?, ?)",
            (key, result, time.time())
        )
        conn.commit()
        conn.close()


class DropZoneHandler(FileSystemEventHandler):
    """File system event handler for drop zones"""
    
    def __init__(self, zone_config: Dict, router: ClaudeMaxRouter):
        self.zone_config = zone_config
        self.router = router
        self.zone_name = zone_config['name']
        self.file_patterns = zone_config.get('file_patterns', ['*'])
        
        # Silently try to initialize AE executor
        try:
            self.ae_executor = AfterEffectsExecutor(silent=True)
            if not self.ae_executor.ae_path:
                self.ae_executor = None
        except:
            self.ae_executor = None
        
    def on_created(self, event):
        """Handle file creation events"""
        if event.is_directory:
            return
            
        file_path = Path(event.src_path)
        
        # Check if file matches patterns
        if not self.matches_pattern(file_path):
            return
        
        console.print(f"\n[cyan]New file detected in {self.zone_name}:[/cyan] {file_path.name}")
        
        # Wait for file to be fully written
        time.sleep(1)
        
        # Check if file is ready
        if not self.is_file_ready(file_path):
            console.print(f"[yellow]Waiting for file to be ready...[/yellow]")
            time.sleep(2)
        
        # Process file asynchronously
        asyncio.run(self.process_file(file_path))
    
    def matches_pattern(self, file_path: Path) -> bool:
        """Check if file matches zone patterns"""
        for pattern in self.file_patterns:
            if file_path.match(pattern):
                return True
        return False
    
    def is_file_ready(self, file_path: Path) -> bool:
        """Check if file is ready to be read"""
        try:
            with open(file_path, 'rb') as f:
                pass
            return True
        except (IOError, OSError, PermissionError):
            return False
    
    async def process_file(self, file_path: Path):
        """Process dropped file"""
        try:
            # Determine file type
            file_ext = file_path.suffix.lower()
            
            # Handle different file types
            if file_ext in ['.aep', '.aepx', '.aet', '.prproj']:
                # Binary project files
                console.print(f"[yellow]Project file detected: {file_path.name}[/yellow]")
                content = f"Analyze After Effects project: {file_path.name}\n"
                content += f"Type: {file_ext}\nLocation: {file_path}\n"
                content += "Provide guidance for working with this project."
            
            elif file_ext in ['.mp4', '.mov', '.avi', '.mkv']:
                # Video files
                console.print(f"[yellow]Video file detected: {file_path.name}[/yellow]")
                content = f"Analyze video: {file_path.name}\nFormat: {file_ext}\n"
                content += "Suggest After Effects processing techniques."
            
            elif file_ext in ['.jpg', '.jpeg', '.png', '.psd', '.tiff']:
                # Image files
                console.print(f"[yellow]Image file detected: {file_path.name}[/yellow]")
                content = f"Process image: {file_path.name}\nFormat: {file_ext}\n"
                content += "Suggest animation techniques."
            
            else:
                # Text-based files
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except UnicodeDecodeError:
                    try:
                        with open(file_path, 'r', encoding='latin-1') as f:
                            content = f.read()
                    except:
                        content = f"Binary file: {file_path.name}\nUnable to read."
            
            console.print(f"[yellow]Processing: {file_path.name}[/yellow]")
            
            # Route to appropriate model
            result, model = await self.router.route_request(content, self.zone_config)
            
            # Save result
            output_config = self.zone_config.get('output', {})
            output_type = output_config.get('type', 'text')
            output_ext = output_config.get('file_extension', '.txt')
            
            output_dir = file_path.parent / 'output'
            output_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = output_dir / f"{file_path.stem}_{timestamp}_{model}{output_ext}"
            
            # Clean ExtendScript output if needed
            if output_ext == '.jsx':
                cleaner = ExtendScriptCleaner()
                result = cleaner.clean(result)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(result)
            
            console.print(f"[green]OK Output saved: {output_file.name}[/green]")
            
            # Execute if configured
            if output_config.get('auto_execute', False) and output_ext == '.jsx':
                self.execute_extendscript(output_file)
            
        except Exception as e:
            console.print(f"[red]Error processing {file_path.name}: {e}[/red]")
    
    def execute_extendscript(self, jsx_path: Path):
        """Execute ExtendScript in After Effects"""
        console.print(f"[yellow]Executing ExtendScript: {jsx_path.name}[/yellow]")
        
        # Try to execute in After Effects
        if self.ae_executor and self.ae_executor.ae_path:
            success = self.ae_executor.execute_script(str(jsx_path))
            if success:
                console.print(f"[green]Script launched in After Effects[/green]")
            else:
                console.print(f"[red]Failed to execute script[/red]")
        else:
            console.print(f"[yellow]After Effects not configured. Script saved but not executed.[/yellow]")
            console.print(f"[yellow]To enable auto-execution, configure AE path in ae_executor_config.json[/yellow]")


class EnhancedDropZoneSystem:
    """Main system orchestrator"""
    
    def __init__(self, config_path: str = "enhanced_drops.yaml"):
        self.config_path = config_path
        self.config = self.load_config(config_path)
        self.router = ClaudeMaxRouter(self.config)
        self.observers = []
    
    def load_config(self, config_path: str) -> Dict:
        """Load configuration file"""
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    def setup_drop_zones(self):
        """Setup all drop zones"""
        console.print("\n[bold cyan]Setting up Enhanced AE Drop Zones[/bold cyan]\n")
        
        zones = self.config.get('drop_zones', {})
        
        for zone_name, zone_config in zones.items():
            zone_config['name'] = zone_name
            zone_dirs = zone_config.get('zone_dirs', [])
            
            for zone_dir in zone_dirs:
                path = Path(zone_dir)
                path.mkdir(parents=True, exist_ok=True)
                
                # Create output directory
                (path / 'output').mkdir(exist_ok=True)
                
                # Setup file watcher
                event_handler = DropZoneHandler(zone_config, self.router)
                observer = Observer()
                observer.schedule(event_handler, str(path), recursive=False)
                observer.start()
                self.observers.append(observer)
                
                console.print(f"OK {zone_name}: Watching [cyan]{path}[/cyan]")
        
        console.print("\n[green]All drop zones are active![/green]")
        console.print("[yellow]Drop files to process them automatically.[/yellow]\n")
    
    def run(self):
        """Run the system"""
        self.setup_drop_zones()
        
        try:
            console.print("[dim]Press Ctrl+C to stop...[/dim]\n")
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            console.print("\n[yellow]Shutting down...[/yellow]")
            self.shutdown()
    
    def shutdown(self):
        """Shutdown the system"""
        for observer in self.observers:
            observer.stop()
            observer.join()
        
        self.router.print_stats()
        console.print("[green]System stopped successfully.[/green]")


def main():
    """Main entry point"""
    console.print(Panel.fit(
        "[bold cyan]AE Claude Max v3.0[/bold cyan]\n"
        "Enhanced Drop Zones with Intelligent Routing",
        border_style="cyan"
    ))
    
    # Check API key
    if not os.getenv("ANTHROPIC_API_KEY"):
        console.print("[red]Error: ANTHROPIC_API_KEY not found in environment![/red]")
        console.print("Please set your API key in the .env file")
        return
    
    # Run system
    system = EnhancedDropZoneSystem()
    system.run()


if __name__ == "__main__":
    main()
