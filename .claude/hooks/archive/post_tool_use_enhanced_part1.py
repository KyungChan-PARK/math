#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["python-dotenv", "black", "pylint", "subprocess"]
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

def run_black_formatter(file_path):
    """Run Black formatter on Python files"""
    try:
        result = subprocess.run(
            ['black', '--quiet', str(file_path)],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            return True, "Formatted successfully"
        else:
            return False, result.stderr
    except Exception as e:
        return False, str(e)

def run_pylint(file_path):
    """Run pylint on Python files"""
    try:
        result = subprocess.run(
            ['pylint', '--score=no', '--output-format=json', str(file_path)],
            capture_output=True,
            text=True,
            timeout=15
        )
        # Pylint returns non-zero for warnings, so just check if it ran
        return True, "Linting complete"
    except Exception as e:
        return False, str(e)

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
    
    # Check for unclosed parentheses
    open_parens = content.count('(')
    close_parens = content.count(')')
    if open_parens != close_parens:
        issues.append(f"Unmatched parentheses: {open_parens} open, {close_parens} close")
    
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
