"""
Test script for AE Automation v2.0
Verifies all components are working correctly
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Set test API key if not already set
if not os.getenv('ANTHROPIC_API_KEY'):
    from dotenv import load_dotenv
    load_dotenv()

def test_imports():
    """Test all required imports"""
    print("Testing imports...")
    try:
        import anthropic
        print("✅ anthropic")
        
        import yaml
        print("✅ yaml")
        
        from rich.console import Console
        print("✅ rich")
        
        from watchdog.observers import Observer
        print("✅ watchdog")
        
        print("\nAll imports successful!\n")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_api_connection():
    """Test Anthropic API connection"""
    print("Testing API connection...")
    try:
        import anthropic
        client = anthropic.Anthropic()
        
        # Test with a minimal request
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=10,
            messages=[{"role": "user", "content": "Say 'OK'"}]
        )
        
        if response.content[0].text:
            print("✅ API connection successful!")
            return True
    except Exception as e:
        print(f"❌ API error: {e}")
        return False

def test_directory_structure():
    """Test directory structure creation"""
    print("\nTesting directory structure...")
    
    required_dirs = [
        "drops/ae_vibe",
        "drops/motion",
        "drops/batch",
        "drops/templates",
        "outputs",
        "cache",
        "agents/generated"
    ]
    
    all_exist = True
    for dir_path in required_dirs:
        path = Path(dir_path)
        if path.exists():
            print(f"✅ {dir_path}")
        else:
            print(f"⚠️ {dir_path} (will be created)")
            path.mkdir(parents=True, exist_ok=True)
            all_exist = False
    
    return all_exist

def test_agent_system():
    """Test agent system basics"""
    print("\nTesting agent system...")
    
    try:
        from ae_automation_v2 import (
            BaseAgent, WiggleAgent, MotionAnalysisAgent,
            MetaAgent, Orchestrator, Task
        )
        
        # Test task creation
        task = Task(
            type="wiggle",
            prompt="Add wiggle to position"
        )
        print(f"✅ Task created: {task.id}")
        
        # Test agent instantiation
        wiggle = WiggleAgent()
        print(f"✅ WiggleAgent: {wiggle.name}")
        
        motion = MotionAnalysisAgent()
        print(f"✅ MotionAgent: {motion.name}")
        
        meta = MetaAgent()
        print(f"✅ MetaAgent: {meta.name}")
        
        # Test orchestrator
        orchestrator = Orchestrator()
        print(f"✅ Orchestrator with {len(orchestrator.agents)} agents")
        
        return True
        
    except Exception as e:
        print(f"❌ Agent system error: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 50)
    print("AE AUTOMATION v2.0 - SYSTEM TEST")
    print("=" * 50)
    
    results = {
        "Imports": test_imports(),
        "API Connection": test_api_connection(),
        "Directory Structure": test_directory_structure(),
        "Agent System": test_agent_system()
    }
    
    print("\n" + "=" * 50)
    print("TEST RESULTS:")
    print("=" * 50)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 All tests passed! System is ready to use.")
        print("\nRun 'start_v2.bat' to launch the system.")
    else:
        print("\n⚠️ Some tests failed. Please check the errors above.")
        print("Run 'pip install -r requirements_v2.txt' to install missing dependencies.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)