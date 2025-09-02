"""
Wrapper MCP Server Pattern Implementation
Based on IndyDevDan's 5 Agent Patterns
Provides unified interface for all AE automation workflows
"""

import asyncio
import json
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
from pathlib import Path
import uvicorn

from orchestrator import AgentOrchestrator
from rich.console import Console

console = Console()

# FastAPI app for MCP Server
app = FastAPI(title="AE Automation MCP Server", version="2.0.0")

# CORS for CEP panel integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global orchestrator instance
orchestrator = AgentOrchestrator()

class WorkflowRequest(BaseModel):
    """Request model for workflow execution"""
    workflow_type: str
    prompt: str
    parallel_tasks: Optional[List[Dict]] = None
    options: Optional[Dict] = {}

class WorkflowResponse(BaseModel):
    """Response model for workflow execution"""
    status: str
    result: Optional[str] = None
    agent_used: Optional[str] = None
    execution_time: Optional[float] = None
    error: Optional[str] = None
@app.get("/")
async def root():
    """Root endpoint with server info"""
    return {
        "name": "AE Automation MCP Server",
        "version": "2.0.0",
        "patterns": "IndyDevDan 5 Agent Patterns",
        "features": [
            "Sub-Agents Architecture",
            "Meta Agent Self-Creation",
            "Parallel Execution",
            "Dynamic Routing",
            "Pattern Learning"
        ]
    }

@app.get("/agents")
async def list_agents():
    """List all available agents"""
    agents_info = []
    for name, agent in orchestrator.agents.items():
        agents_info.append({
            "name": agent.name,
            "description": agent.description,
            "model": agent.model_preference
        })
    return {"agents": agents_info}

@app.post("/execute")
async def execute_workflow(request: WorkflowRequest):
    """Execute a workflow through the orchestrator"""
    import time
    start_time = time.time()
    
    try:
        if request.parallel_tasks:
            # Parallel execution for multiple tasks
            results = await orchestrator.execute_parallel(request.parallel_tasks)
            return WorkflowResponse(
                status="success",
                result=json.dumps(results),
                execution_time=time.time() - start_time
            )
        else:
            # Sequential execution for single task
            result = await orchestrator.execute_sequential(request.prompt)
            return WorkflowResponse(
                status=result.get("status", "unknown"),
                result=result.get("result"),
                agent_used=result.get("agent"),
                execution_time=time.time() - start_time
            )
    except Exception as e:
        return WorkflowResponse(
            status="error",
            error=str(e),
            execution_time=time.time() - start_time
        )

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time communication with CEP panel"""
    await websocket.accept()
    console.print("[green]✅ WebSocket client connected[/green]")
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Process request through orchestrator
            if data.get("type") == "execute":
                result = await orchestrator.execute_sequential(data.get("prompt", ""))
                await websocket.send_json({
                    "type": "result",
                    "data": result
                })
            
            elif data.get("type") == "status":
                orchestrator.show_status()
                await websocket.send_json({
                    "type": "status",
                    "data": "Check console for status"
                })
            
            elif data.get("type") == "analyze":
                await orchestrator.analyze_patterns()
                await websocket.send_json({
                    "type": "analysis",
                    "data": "Pattern analysis complete"
                })
                
    except Exception as e:
        console.print(f"[red]WebSocket error: {e}[/red]")
    finally:
        console.print("[yellow]WebSocket client disconnected[/yellow]")

@app.post("/create-agent")
async def create_custom_agent(spec: Dict):
    """Endpoint for Meta Agent to create new agents"""
    result = await orchestrator.agents["meta"].execute({
        "type": "create",
        "spec": spec
    })
    return result

if __name__ == "__main__":
    console.print("[bold cyan]🚀 Starting AE Automation MCP Server[/bold cyan]")
    console.print("[yellow]Implementing IndyDevDan's 5 Agent Patterns[/yellow]")
    orchestrator.show_status()
    
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)