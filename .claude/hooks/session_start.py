#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["python-dotenv", "requests", "rich"]
# ///

"""
Session Start Hook for After Effects Automation
Automatically loads project context when Claude Code starts
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime
from rich.console import Console

console = Console()

def main():
    """Initialize session with AE project context"""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        session_id = input_data.get('session_id', 'unknown')
        
        # Project root
        project_root = Path(r"C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project")
        
        # Load session state
        session_file = project_root / "session_state.json"
        if session_file.exists():
            with open(session_file, 'r', encoding='utf-8') as f:
                session_state = json.load(f)
        else:
            session_state = {"notes": [], "next_steps": []}
        
        # Build context for Claude
        context_parts = []
        
        # Add project status
        context_parts.append("=== After Effects Automation Project Status ===")
        context_parts.append(f"Session ID: {session_id}")
        context_parts.append(f"Project Version: {session_state.get('project_version', 'v3.0')}")
        context_parts.append(f"Phase: {session_state.get('current_phase', 'production_ready')}")
        context_parts.append(f"Completion: {session_state.get('progress', {}).get('completion_percentage', 0)}%")
        
        # Add recent notes
        if session_state.get('notes'):
            context_parts.append("\n=== Recent Notes ===")
            for note in session_state['notes'][-3:]:  # Last 3 notes
                context_parts.append(f"- {note}")
        
        # Add next steps
        if session_state.get('next_steps'):
            context_parts.append("\n=== Priority Tasks ===")
            for i, step in enumerate(session_state['next_steps'][:5], 1):  # Top 5 priorities
                context_parts.append(f"{i}. {step}")
        
        # Check drop zones
        drop_zones = [
            project_root / "drops" / "ae_vibe",
            project_root / "drops" / "video_motion",
            project_root / "drops" / "batch_ops",
            project_root / "drops" / "template_learning"
        ]
        
        pending_files = []
        for zone in drop_zones:
            if zone.exists():
                files = list(zone.glob("*"))
                if files:
                    pending_files.extend([f"{zone.name}/{f.name}" for f in files])
        
        if pending_files:
            context_parts.append("\n=== Pending Files in Drop Zones ===")
            for file in pending_files[:10]:  # Show up to 10 files
                context_parts.append(f"- {file}")
        
        # Output context to stdout
        context = "\n".join(context_parts)
        print(context)
        
        # Log session start
        log_dir = project_root / "logs"
        log_dir.mkdir(exist_ok=True)
        log_file = log_dir / f"session_{datetime.now().strftime('%Y%m%d')}.log"
        
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"\n[{datetime.now().isoformat()}] Session started: {session_id}\n")
            f.write(f"Context loaded: {len(context)} characters\n")
        
        sys.exit(0)  # Success
        
    except Exception as e:
        print(f"Error in session_start hook: {e}", file=sys.stderr)
        sys.exit(1)  # Non-blocking error

if __name__ == "__main__":
    main()
