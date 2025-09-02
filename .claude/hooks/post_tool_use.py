#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["python-dotenv"]
# ///

"""
Enhanced Post Tool Use Hook for After Effects Automation
Automatically triggers quality checks and automation after operations
"""

import json
import sys
import subprocess
from pathlib import Path
from datetime import datetime
import re

def validate_extendscript(file_path):
    """Validate ExtendScript syntax"""
    content = Path(file_path).read_text(encoding='utf-8')
    
    # Check for common ExtendScript issues
    issues = []
    
    # Check for unclosed brackets
    open_brackets = content.count('{')
    close_brackets = content.count('}')
    if open_brackets != close_brackets:
        issues.append(f"Unmatched brackets: {open_brackets} open, {close_brackets} close")
    
    # Check for app.beginUndoGroup without endUndoGroup
    if 'app.beginUndoGroup' in content and 'app.endUndoGroup' not in content:
        issues.append("Missing app.endUndoGroup()")
    
    return len(issues) == 0, issues

def trigger_ae_automation(file_path):
    """Trigger After Effects automation for new scripts"""
    
    project_root = Path(r"C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project")
    
    # Check if it's a new ExtendScript in output directory
    if str(file_path).endswith('.jsx') and 'output' in str(file_path):
        # Create a queue file for processing
        queue_dir = project_root / "queue"
        queue_dir.mkdir(exist_ok=True)
        
        queue_file = queue_dir / f"pending_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        queue_data = {
            "script": str(file_path),
            "created": datetime.now().isoformat(),
            "status": "pending",
            "type": "extendscript"
        }
        
        with open(queue_file, 'w', encoding='utf-8') as f:
            json.dump(queue_data, f, indent=2)
        
        return True, f"Queued for AE execution: {queue_file.name}"
    
    return False, None
def main():
    """Main post-processing logic"""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        tool_output = input_data.get('tool_output', {})
        session_id = input_data.get('session_id', '')
        
        # Get file path from tool input
        file_path = None
        if tool_name in ['Write', 'write_file', 'edit_file']:
            file_path = tool_input.get('file_path') or tool_input.get('path')
        
        if not file_path:
            sys.exit(0)  # Nothing to post-process
        
        file_path = Path(file_path)
        
        # Log the operation
        project_root = Path(r"C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project")
        log_file = project_root / "logs" / f"post_tool_{datetime.now().strftime('%Y%m%d')}.log"
        log_file.parent.mkdir(exist_ok=True)
        
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"[{datetime.now().isoformat()}] Processing: {file_path}\n")
        
        messages = []
        
        # Process based on file type
        if file_path.suffix == '.jsx':
            # Validate ExtendScript
            valid, issues = validate_extendscript(file_path)
            if not valid:
                messages.append(f"[VALIDATION] ExtendScript issues found:")
                for issue in issues:
                    messages.append(f"  - {issue}")
            else:
                messages.append(f"[VALIDATED] ExtendScript syntax OK")
            
            # Queue for AE execution
            success, msg = trigger_ae_automation(file_path)
            if msg:
                messages.append(f"[AUTOMATION] {msg}")
        
        # Output messages to stderr for Claude to see
        if messages:
            for msg in messages:
                print(msg, file=sys.stderr)
        
        # Update session state with post-processing info
        session_file = project_root / "session_state.json"
        if session_file.exists():
            with open(session_file, 'r', encoding='utf-8') as f:
                session_state = json.load(f)
            
            if 'post_processing' not in session_state:
                session_state['post_processing'] = []
            
            session_state['post_processing'].append({
                "timestamp": datetime.now().isoformat(),
                "file": str(file_path),
                "actions": messages
            })
            
            # Keep only last 50 entries
            session_state['post_processing'] = session_state['post_processing'][-50:]
            
            with open(session_file, 'w', encoding='utf-8') as f:
                json.dump(session_state, f, indent=2)
        
        sys.exit(0)  # Success
        
    except Exception as e:
        print(f"Error in post_tool_use hook: {e}", file=sys.stderr)
        sys.exit(0)  # Don't block on errors

if __name__ == "__main__":
    main()