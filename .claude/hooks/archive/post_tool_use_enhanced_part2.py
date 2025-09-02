
def run_tests_if_needed(file_path):
    """Run tests if source files were modified"""
    
    # Check if it's a source file
    if '/src/' in str(file_path) or file_path.name.startswith('test_'):
        test_file = Path(str(file_path).replace('/src/', '/tests/').replace('.py', '_test.py'))
        
        if not test_file.exists():
            # Look for generic test file
            test_file = Path(file_path).parent / 'tests' / f"test_{Path(file_path).stem}.py"
        
        if test_file.exists():
            try:
                result = subprocess.run(
                    ['python', '-m', 'pytest', str(test_file), '-v'],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                return result.returncode == 0, f"Tests {'passed' if result.returncode == 0 else 'failed'}"
            except Exception as e:
                return False, str(e)
    
    return True, None

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
        if file_path.suffix == '.py':
            # Format Python files
            success, msg = run_black_formatter(file_path)
            if success:
                messages.append(f"[FORMATTED] {file_path.name}")
            
            # Lint Python files
            success, msg = run_pylint(file_path)
            if success:
                messages.append(f"[LINTED] {file_path.name}")
            
            # Run tests if needed
            success, msg = run_tests_if_needed(file_path)
            if msg:
                messages.append(f"[TESTS] {msg}")
        
        elif file_path.suffix == '.jsx':
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
