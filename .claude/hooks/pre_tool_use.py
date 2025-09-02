#!/usr/bin/env python
"""
Pre-Tool Use Hook for After Effects Project Protection
Validates and backs up AE projects before modification
"""

import json
import sys
import re
import shutil
from pathlib import Path
from datetime import datetime

def main():
    """Main hook handler for pre-tool validation"""
    try:
        # Read input from Claude Code
        data = json.load(sys.stdin)
        
        tool_name = data.get('tool_name', '')
        tool_input = data.get('tool_input', {})
        session_id = data.get('session_id', '')
        
        # Log the event
        log_event('pre_tool_use', tool_name, session_id)
        
        # Security checks for dangerous operations
        if tool_name == 'Bash' or tool_name == 'execute_command':
            command = tool_input.get('command', '')
            if is_dangerous_command(command):
                print(f"BLOCKED: Dangerous command detected: {command}", file=sys.stderr)
                sys.exit(2)  # Block with feedback
        
        # Backup AE project files before modification
        if tool_name == 'Write' or tool_name == 'edit_file':
            file_path = tool_input.get('file_path', '')
            if '.aep' in file_path.lower() and Path(file_path).exists():
                backup_path = create_backup(file_path)
                print(f"Created backup: {backup_path}", file=sys.stderr)
        
        # Validate ExtendScript before execution
        if tool_name == 'Write' and '.jsx' in tool_input.get('file_path', '').lower():
            content = tool_input.get('content', '')
            if not validate_extendscript(content):
                print("WARNING: ExtendScript validation failed", file=sys.stderr)
                # Don't block, just warn
        
        sys.exit(0)  # Success, continue
        
    except Exception as e:
        print(f"Hook error: {str(e)}", file=sys.stderr)
        sys.exit(1)  # Non-blocking error

def is_dangerous_command(command: str) -> bool:
    """Check if command is potentially dangerous"""
    dangerous_patterns = [
        r'rm\s+-rf\s+[/\\]',  # Root deletion
        r'format\s+[a-zA-Z]:',  # Drive formatting
        r'del\s+/[sS]\s+/[qQ]',  # Silent deletion
        r'rmdir\s+/[sS]',  # Directory removal
        r'chmod\s+777',  # Dangerous permissions
        r'DROP\s+TABLE',  # Database destruction
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, command, re.IGNORECASE):
            return True
    return False

def create_backup(file_path: str) -> str:
    """Create timestamped backup of file"""
    source = Path(file_path)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = source.parent / 'backups'
    backup_dir.mkdir(exist_ok=True)
    
    backup_path = backup_dir / f"{source.stem}_{timestamp}{source.suffix}"
    shutil.copy2(source, backup_path)
    return str(backup_path)

def validate_extendscript(content: str) -> bool:
    """Basic validation of ExtendScript syntax"""
    # Check for common syntax errors
    if content.count('(') != content.count(')'):
        return False
    if content.count('{') != content.count('}'):
        return False
    if content.count('[') != content.count(']'):
        return False
    
    # Check for required app object
    if 'app.project' not in content and 'app.' not in content:
        return False
    
    return True

def log_event(event_type: str, tool_name: str, session_id: str):
    """Log hook events for audit trail"""
    log_dir = Path(__file__).parent.parent.parent / 'logs' / 'hooks'
    log_dir.mkdir(parents=True, exist_ok=True)
    
    log_file = log_dir / f"hooks_{datetime.now().strftime('%Y%m%d')}.log"
    
    with open(log_file, 'a') as f:
        f.write(f"{datetime.now().isoformat()} | {event_type} | {tool_name} | {session_id}\n")

if __name__ == "__main__":
    main()
