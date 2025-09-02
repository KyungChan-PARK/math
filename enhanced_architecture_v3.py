"""
Enhanced After Effects Automation Architecture v3.0
Integrates Claude Code Hooks, Sub-agents, and Drop Zones
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

# Import existing components
from agents.ae_asset_processor import AEAssetProcessor
from agents.ae_render_optimizer import AERenderOptimizer

class HookEvent(Enum):
    """Hook event types matching Claude Code specification"""
    USER_PROMPT_SUBMIT = "UserPromptSubmit"
    PRE_TOOL_USE = "PreToolUse"
    POST_TOOL_USE = "PostToolUse"
    NOTIFICATION = "Notification"
    STOP = "Stop"
    SUBAGENT_STOP = "SubagentStop"
    PRE_COMPACT = "PreCompact"
    SESSION_START = "SessionStart"
    SESSION_END = "SessionEnd"

@dataclass
class HookPayload:
    """Standard hook payload structure"""
    event: HookEvent
    session_id: str
    tool_name: Optional[str] = None
    tool_input: Optional[Dict] = None
    tool_output: Optional[Dict] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class EnhancedAEOrchestrator:
    """
    Central orchestrator for AE automation
    Coordinates Hooks, Sub-agents, and Drop Zones
    """
    
    def __init__(self, config_path: str = "enhanced_drops.yaml"):
        self.config_path = config_path
        self.hooks_dir = Path(".claude/hooks")
        self.agents_dir = Path("agents")
        self.drops_dir = Path("drops")
        
        # Initialize components
        self.asset_processor = AEAssetProcessor()
        self.render_optimizer = AERenderOptimizer()
        
        # Hook registry
        self.hooks = self._load_hooks()
        
        # Sub-agent registry
        self.sub_agents = self._load_sub_agents()
        
        # Statistics
        self.stats = {
            'hooks_executed': 0,
            'agents_invoked': 0,
            'files_processed': 0,
            'errors': 0
        }
    
    async def process_drop(self, file_path: str, zone_config: Dict) -> Dict:
        """
        Process a file drop with full Hook chain and Sub-agent delegation
        """
        result = {'success': False, 'steps': []}
        
        try:
            # Trigger SESSION_START hook if new session
            await self._execute_hook(HookEvent.SESSION_START, {
                'file': file_path,
                'zone': zone_config.get('name')
            })
            
            # Pre-processing validation hook
            pre_result = await self._execute_hook(HookEvent.PRE_TOOL_USE, {
                'tool_name': 'process_file',
                'tool_input': {'file_path': file_path}
            })
            
            if pre_result.get('blocked'):
                result['error'] = 'Pre-validation failed'
                return result
            
            # Delegate to appropriate Sub-agent
            agent_name = zone_config.get('agent', 'default')
            agent_result = await self._invoke_sub_agent(agent_name, file_path, zone_config)
            
            result['steps'].append({
                'agent': agent_name,
                'result': agent_result
            })
            
            # Post-processing hook
            post_result = await self._execute_hook(HookEvent.POST_TOOL_USE, {
                'tool_name': 'process_file',
                'tool_input': {'file_path': file_path},
                'tool_output': agent_result
            })
            
            result['success'] = True
            result['output'] = agent_result
            
        except Exception as e:
            result['error'] = str(e)
            self.stats['errors'] += 1
        
        finally:
            # Always trigger STOP hook
            await self._execute_hook(HookEvent.STOP, {
                'result': result
            })
        
        return result
