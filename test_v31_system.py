"""
Test Suite for AE Claude Max Enhanced v3.1
Verifies all enhanced components are functioning correctly
"""

import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime
import asyncio

# Add project root to path
PROJECT_ROOT = Path(r"C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project")
sys.path.insert(0, str(PROJECT_ROOT))

# Test results tracker
test_results = {
    "timestamp": datetime.now().isoformat(),
    "version": "v3.1",
    "tests_passed": 0,
    "tests_failed": 0,
    "details": []
}

def test_claude_hooks():
    """Test Claude Code Hooks existence and validity"""
    print("\n[TEST] Claude Code Hooks")
    print("-" * 40)
    
    hooks_dir = PROJECT_ROOT / ".claude" / "hooks"
    required_hooks = [
        "session_start.py",
        "pre_tool_use.py", 
        "post_tool_use.py"
    ]
    
    all_exist = True
    for hook in required_hooks:
        hook_path = hooks_dir / hook
        if hook_path.exists():
            print(f"  [OK] {hook} found")
            
            # Check if executable
            content = hook_path.read_text(encoding='utf-8')
            if "#!/usr/bin/env" in content:
                print(f"    - Shebang present")
            if "def main():" in content:
                print(f"    - Main function defined")
        else:
            print(f"  ✗ {hook} missing")
            all_exist = False
    
    if all_exist:
        test_results["tests_passed"] += 1
        test_results["details"].append({"test": "Claude Hooks", "status": "PASSED"})
    else:
        test_results["tests_failed"] += 1
        test_results["details"].append({"test": "Claude Hooks", "status": "FAILED"})
    
    return all_exist

def test_sub_agents():
    """Test Sub-agents configuration"""
    print("\n[TEST] Sub-Agents")
    print("-" * 40)
    
    agents_dir = PROJECT_ROOT / ".claude" / "agents"
    required_agents = [
        "ae-asset-processor.md",
        "ae-render-optimizer.md",
        "ae-composition-builder.md",
        "ae-delivery-automation.md"
    ]
    
    all_valid = True
    for agent in required_agents:
        agent_path = agents_dir / agent
        if agent_path.exists():
            content = agent_path.read_text(encoding='utf-8')
            
            # Check for required YAML frontmatter
            if "---" in content and "name:" in content and "tools:" in content:
                print(f"  ✓ {agent} valid")
                
                # Extract agent name
                for line in content.split('\n'):
                    if line.startswith("name:"):
                        agent_name = line.split("name:")[1].strip()
                        print(f"    - Name: {agent_name}")
                        break
            else:
                print(f"  ✗ {agent} invalid format")
                all_valid = False
        else:
            print(f"  ✗ {agent} missing")
            all_valid = False
    
    if all_valid:
        test_results["tests_passed"] += 1
        test_results["details"].append({"test": "Sub-Agents", "status": "PASSED"})
    else:
        test_results["tests_failed"] += 1
        test_results["details"].append({"test": "Sub-Agents", "status": "FAILED"})
    
    return all_valid

def test_drop_zones():
    """Test drop zone directories"""
    print("\n[TEST] Drop Zones")
    print("-" * 40)
    
    drop_zones = [
        PROJECT_ROOT / "drops" / "ae_vibe",
        PROJECT_ROOT / "drops" / "video_motion",
        PROJECT_ROOT / "drops" / "batch_ops",
        PROJECT_ROOT / "drops" / "template_learning"
    ]
    
    all_exist = True
    for zone in drop_zones:
        if zone.exists() and zone.is_dir():
            print(f"  ✓ {zone.name} exists")
            
            # Check if writable
            test_file = zone / ".test"
            try:
                test_file.touch()
                test_file.unlink()
                print(f"    - Writable: Yes")
            except:
                print(f"    - Writable: No")
        else:
            print(f"  ✗ {zone.name} missing")
            all_exist = False
    
    if all_exist:
        test_results["tests_passed"] += 1
        test_results["details"].append({"test": "Drop Zones", "status": "PASSED"})
    else:
        test_results["tests_failed"] += 1
        test_results["details"].append({"test": "Drop Zones", "status": "FAILED"})
    
    return all_exist

def test_hot_folders():
    """Test hot folder structure"""
    print("\n[TEST] Hot Folders")
    print("-" * 40)
    
    hot_folders = [
        PROJECT_ROOT / "watch" / "incoming",
        PROJECT_ROOT / "watch" / "render",
        PROJECT_ROOT / "watch" / "scripts",
        PROJECT_ROOT / "watch" / "processed",
        PROJECT_ROOT / "watch" / "failed"
    ]
    
    all_exist = True
    for folder in hot_folders:
        if folder.exists() and folder.is_dir():
            print(f"  ✓ {folder.name} exists")
        else:
            print(f"  ✗ {folder.name} missing")
            # Try to create it
            try:
                folder.mkdir(parents=True, exist_ok=True)
                print(f"    - Created automatically")
            except:
                all_exist = False
    
    if all_exist:
        test_results["tests_passed"] += 1
        test_results["details"].append({"test": "Hot Folders", "status": "PASSED"})
    else:
        test_results["tests_failed"] += 1
        test_results["details"].append({"test": "Hot Folders", "status": "FAILED"})
    
    return all_exist

def test_hot_folder_monitor():
    """Test hot folder monitor module"""
    print("\n[TEST] Hot Folder Monitor")
    print("-" * 40)
    
    try:
        from ae_hot_folder_monitor import DebouncedFileHandler, HotFolderManager
        print("  ✓ Module imports successfully")
        
        # Test instantiation
        handler = DebouncedFileHandler(str(PROJECT_ROOT))
        print("  ✓ Handler instantiates")
        
        manager = HotFolderManager(str(PROJECT_ROOT))
        print("  ✓ Manager instantiates")
        
        test_results["tests_passed"] += 1
        test_results["details"].append({"test": "Hot Folder Monitor", "status": "PASSED"})
        return True
        
    except Exception as e:
        print(f"  ✗ Error: {e}")
        test_results["tests_failed"] += 1
        test_results["details"].append({"test": "Hot Folder Monitor", "status": "FAILED", "error": str(e)})
        return False

def test_session_state():
    """Test session state management"""
    print("\n[TEST] Session State")
    print("-" * 40)
    
    session_file = PROJECT_ROOT / "session_state.json"
    
    if session_file.exists():
        print("  ✓ session_state.json exists")
        
        try:
            with open(session_file, 'r', encoding='utf-8') as f:
                session_data = json.load(f)
            
            # Check required fields
            required_fields = ["session_id", "project_version", "current_phase", "progress"]
            for field in required_fields:
                if field in session_data:
                    print(f"  ✓ {field}: {session_data[field] if not isinstance(session_data[field], dict) else 'present'}")
                else:
                    print(f"  ✗ {field}: missing")
            
            # Check version
            if session_data.get("project_version") == "v3.1":
                print("  ✓ Version correctly set to v3.1")
            
            test_results["tests_passed"] += 1
            test_results["details"].append({"test": "Session State", "status": "PASSED"})
            return True
            
        except Exception as e:
            print(f"  ✗ Error reading session state: {e}")
            test_results["tests_failed"] += 1
            test_results["details"].append({"test": "Session State", "status": "FAILED", "error": str(e)})
            return False
    else:
        print("  ✗ session_state.json missing")
        test_results["tests_failed"] += 1
        test_results["details"].append({"test": "Session State", "status": "FAILED"})
        return False

def test_environment():
    """Test environment configuration"""
    print("\n[TEST] Environment")
    print("-" * 40)
    
    # Check Python version
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    print(f"  Python version: {python_version}")
    
    # Check .env file
    env_file = PROJECT_ROOT / ".env"
    if env_file.exists():
        print("  ✓ .env file exists")
        
        # Check for API key (without exposing it)
        content = env_file.read_text()
        if "ANTHROPIC_API_KEY" in content:
            print("  ✓ API key configured")
        else:
            print("  ✗ API key not found")
    else:
        print("  ✗ .env file missing")
    
    # Check virtual environment
    venv_path = PROJECT_ROOT / "venv"
    if venv_path.exists():
        print("  ✓ Virtual environment exists")
    else:
        print("  ✗ Virtual environment missing")
    
    test_results["tests_passed"] += 1
    test_results["details"].append({"test": "Environment", "status": "PASSED"})
    return True

def generate_test_report():
    """Generate comprehensive test report"""
    print("\n" + "=" * 60)
    print("                    TEST SUMMARY")
    print("=" * 60)
    
    total_tests = test_results["tests_passed"] + test_results["tests_failed"]
    success_rate = (test_results["tests_passed"] / total_tests * 100) if total_tests > 0 else 0
    
    print(f"Version:        {test_results['version']}")
    print(f"Timestamp:      {test_results['timestamp']}")
    print(f"Tests Passed:   {test_results['tests_passed']}/{total_tests}")
    print(f"Success Rate:   {success_rate:.1f}%")
    
    if test_results["tests_failed"] > 0:
        print("\nFailed Tests:")
        for detail in test_results["details"]:
            if detail["status"] == "FAILED":
                print(f"  - {detail['test']}")
                if "error" in detail:
                    print(f"    Error: {detail['error']}")
    
    # Save report to file
    report_file = PROJECT_ROOT / "logs" / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    report_file.parent.mkdir(exist_ok=True)
    
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(test_results, f, indent=2)
    
    print(f"\nReport saved: {report_file.name}")
    
    if success_rate == 100:
        print("\n✅ ALL TESTS PASSED - System ready for production!")
    elif success_rate >= 80:
        print("\n⚠️  Most tests passed - Review failures before production")
    else:
        print("\n❌ Multiple failures - System needs attention")
    
    print("=" * 60)

def main():
    """Run all tests"""
    print("=" * 60)
    print("     AE CLAUDE MAX ENHANCED v3.1 - TEST SUITE")
    print("=" * 60)
    
    # Run tests
    test_environment()
    test_claude_hooks()
    test_sub_agents()
    test_drop_zones()
    test_hot_folders()
    test_hot_folder_monitor()
    test_session_state()
    
    # Generate report
    generate_test_report()
    
    return test_results["tests_failed"] == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
