#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["python-dotenv", "re2", "pathlib"]
# ///

"""
Enhanced Pre Tool Use Hook for After Effects Automation
Validates and secures all tool operations before execution
"""

import json
import sys
import re
from pathlib import Path
import shutil
from datetime import datetime

# Security patterns to block
DANGEROUS_PATTERNS = [
    r'rm\s+-rf\s+/',           # Recursive force delete from root
    r'format\s+[CD]:',         # Format drives
    r'del\s+/[SF]\s+',         # Windows force delete
    r'chmod\s+777',            # Dangerous permissions
    r'sudo\s+rm',              # Elevated deletions
    r'reg\s+delete',           # Registry deletion
    r'bcdedit',                # Boot configuration
    r'diskpart',               # Disk partitioning
]

# Protected files that should not be modified
PROTECTED_FILES = [
    '.env',
    'package-lock.json',
    'yarn.lock',
    'Gemfile.lock',
    'composer.lock',
    'session_state.json',  # Protect session state
]

# After Effects specific validations
AE_FILE_PATTERNS = {
    '.aep': 'After Effects Project',
    '.aepx': 'After Effects XML Project',
    '.jsx': 'ExtendScript',
    '.jsxbin': 'ExtendScript Binary',
    '.mogrt': 'Motion Graphics Template',
}

def validate_ae_operation(tool_name, tool_input):
    """Validate After Effects specific operations"""
    
    if tool_name == 'Write' or tool_name == 'write_file':
        file_path = tool_input.get('file_path', '') or tool_input.get('path', '')
        
        # Check if it's an AE project file
        for ext, desc in AE_FILE_PATTERNS.items():
            if file_path.endswith(ext):
                # Create backup before modifying
                source = Path(file_path)
                if source.exists():
                    backup_dir = source.parent / '.backups'
                    backup_dir.mkdir(exist_ok=True)
                    
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    backup_path = backup_dir / f"{source.stem}_{timestamp}{source.suffix}"
                    
                    try:
                        shutil.copy2(source, backup_path)
                        print(f"[BACKUP] Created backup: {backup_path}", file=sys.stderr)
                    except Exception as e:
                        print(f"[WARNING] Could not create backup: {e}", file=sys.stderr)
                
                return True, f"Modifying {desc}: {file_path}"
    
    return True, None

def validate_command(command):
    """Validate shell commands for security"""
    
    # Check against dangerous patterns
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return False, f"Dangerous command pattern detected: {pattern}"
    
    # Check for attempts to modify protected files
    for protected in PROTECTED_FILES:
        if protected in command:
            # Allow reading but not writing
            if any(op in command.lower() for op in ['rm', 'del', 'remove', '>', 'echo']):
                return False, f"Attempt to modify protected file: {protected}"
    
    return True, None

def main():
    """Main validation logic"""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
        
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        session_id = input_data.get('session_id', '')
        
        # Log the operation
        project_root = Path(r"C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project")
        log_dir = project_root / "logs"
        log_dir.mkdir(exist_ok=True)
        
        log_file = log_dir / f"tools_{datetime.now().strftime('%Y%m%d')}.log"
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"[{datetime.now().isoformat()}] Tool: {tool_name}, Session: {session_id}\n")
        
        # Validate based on tool type
        if tool_name in ['Bash', 'run_command', 'execute_command']:
            command = tool_input.get('command', '')
            valid, reason = validate_command(command)
            
            if not valid:
                print(f"[BLOCKED] {reason}", file=sys.stderr)
                print(f"Command: {command}", file=sys.stderr)
                sys.exit(2)  # Block with feedback to Claude
        
        elif tool_name in ['Write', 'write_file', 'edit_file']:
            valid, message = validate_ae_operation(tool_name, tool_input)
            
            if message:
                print(f"[AE OPERATION] {message}", file=sys.stderr)
        
        # Check for file deletions
        elif tool_name in ['Delete', 'delete_file', 'remove_file']:
            file_path = tool_input.get('file_path', '') or tool_input.get('path', '')
            
            # Never allow deletion of project root
            if str(project_root) in str(file_path):
                print(f"[BLOCKED] Cannot delete project files: {file_path}", file=sys.stderr)
                sys.exit(2)
            
            # Create backup before deletion
            if Path(file_path).exists():
                backup_dir = project_root / '.trash'
                backup_dir.mkdir(exist_ok=True)
                
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_name = f"{Path(file_path).name}_{timestamp}"
                backup_path = backup_dir / backup_name
                
                try:
                    shutil.move(file_path, backup_path)
                    print(f"[TRASH] Moved to trash: {backup_path}", file=sys.stderr)
                    # Prevent actual deletion
                    sys.exit(0)
                except Exception as e:
                    print(f"[ERROR] Could not move to trash: {e}", file=sys.stderr)
        
        # Additional check for API usage
        if tool_name in ['api_call', 'anthropic_api']:
            # Track API usage for cost monitoring
            with open(project_root / "api_usage.json", 'a', encoding='utf-8') as f:
                json.dump({
                    "timestamp": datetime.now().isoformat(),
                    "tool": tool_name,
                    "session": session_id
                }, f)
                f.write("\n")
        
        sys.exit(0)  # Allow operation
        
    except Exception as e:
        print(f"Error in pre_tool_use hook: {e}", file=sys.stderr)
        sys.exit(0)  # Don't block on errors

if __name__ == "__main__":
    main()
