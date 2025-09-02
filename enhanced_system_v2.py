#!/usr/bin/env python3
"""
Enhanced AE Drop Zones v2.0 - With IndyDevDan Agent Patterns
Integrates:
- 5 Agent Patterns
- Meta Agent Self-Creation
- Wrapper MCP Server
- Sub-Agents Architecture
"""

import asyncio
import sys
from pathlib import Path

# Add agents directory to path
sys.path.append(str(Path(__file__).parent / "agents"))

from agents.orchestrator import AgentOrchestrator
from agents.mcp_server import app
import uvicorn
from rich.console import Console
from rich.panel import Panel
from rich.layout import Layout
from rich.live import Live
from rich.table import Table
import threading

console = Console()

class EnhancedDropZonesV2:
    """Version 2.0 with IndyDevDan patterns integrated"""
    
    def __init__(self):
        self.orchestrator = AgentOrchestrator()
        self.server_thread = None
        
    def start_mcp_server(self):
        """Start the MCP server in a separate thread"""
        def run_server():
            uvicorn.run(app, host="0.0.0.0", port=8000)
        
        self.server_thread = threading.Thread(target=run_server, daemon=True)
        self.server_thread.start()
        console.print("[green]✅ MCP Server started on http://localhost:8000[/green]")
    
    def display_dashboard(self):
        """Display live dashboard"""
        layout = Layout()
        
        # Create panels
        header = Panel(
            "[bold cyan]Enhanced AE Drop Zones v2.0[/bold cyan]\n"
            "[yellow]Powered by IndyDevDan's Agent Patterns[/yellow]",
            style="cyan"
        )
        
        # Agent status table
        agent_table = Table(title="🎭 Active Agents")
        agent_table.add_column("Agent", style="cyan")
        agent_table.add_column("Type", style="yellow")
        agent_table.add_column("Status", style="green")
        
        for name, agent in self.orchestrator.agents.items():
            agent_table.add_row(
                agent.name,
                agent.model_preference,
                "✅ Active"
            )
        
        # Features panel
        features = Panel(
            "✨ [bold]New Features:[/bold]\n"
            "• Sub-Agents Architecture\n"
            "• Meta Agent Self-Creation\n"
            "• Parallel Task Execution\n"
            "• Pattern Learning\n"
            "• MCP Server Integration\n"
            "• Dynamic Agent Loading",
            title="v2.0 Features",
            style="green"
        )
        
        # Instructions panel
        instructions = Panel(
            "[bold]Usage:[/bold]\n"
            "1. Drop files in zones as before\n"
            "2. Access MCP Server at http://localhost:8000\n"
            "3. Use WebSocket for real-time updates\n"
            "4. Meta Agent creates new agents automatically\n\n"
            "[dim]Press Ctrl+C to stop[/dim]",
            title="Instructions",
            style="blue"
        )
        
        layout.split_column(
            Layout(header, size=5),
            Layout(agent_table, size=10),
            Layout(features, size=8),
            Layout(instructions, size=8)
        )
        
        return layout    
    async def run(self):
        """Main execution loop"""
        console.clear()
        
        # Start MCP server
        self.start_mcp_server()
        
        # Show dashboard
        layout = self.display_dashboard()
        
        with Live(layout, refresh_per_second=1) as live:
            try:
                # Keep the program running
                while True:
                    await asyncio.sleep(1)
                    
                    # Periodically check for pattern analysis
                    if len(self.orchestrator.execution_history) % 20 == 0:
                        await self.orchestrator.analyze_patterns()
                        
            except KeyboardInterrupt:
                console.print("\n[yellow]Shutting down gracefully...[/yellow]")
                
        console.print("[green]✅ System stopped[/green]")

def main():
    """Entry point"""
    console.print(Panel.fit(
        "[bold cyan]Enhanced AE Drop Zones v2.0[/bold cyan]\n"
        "[yellow]IndyDevDan Agent Patterns Integration[/yellow]\n"
        "[green]Meta Agents • Sub Agents • MCP Server[/green]",
        border_style="cyan"
    ))
    
    system = EnhancedDropZonesV2()
    
    # Run async main loop
    try:
        asyncio.run(system.run())
    except KeyboardInterrupt:
        console.print("\n[red]Interrupted by user[/red]")
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")

if __name__ == "__main__":
    main()