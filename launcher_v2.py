"""
AE Automation v2.0 - Universal Launcher
This script handles all setup and launching
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Install required packages"""
    print("Installing required packages...")
    packages = ["anthropic", "python-dotenv", "pyyaml", "rich", "watchdog"]
    
    for package in packages:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", package])
    
    print("✅ All packages installed!\n")

def setup_directories():
    """Create required directories"""
    print("Setting up directories...")
    
    dirs = [
        "drops/ae_vibe",
        "drops/motion", 
        "drops/batch",
        "drops/templates",
        "outputs",
        "cache",
        "agents/generated"
    ]
    
    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"✅ {dir_path}")
    
    print("\n")

def main():
    """Main launcher"""
    print("=" * 50)
    print("AE AUTOMATION v2.0 - LAUNCHER")
    print("=" * 50)
    print()
    
    # Change to script directory
    os.chdir(Path(__file__).parent)
    
    # Install requirements
    try:
        install_requirements()
    except Exception as e:
        print(f"⚠️ Could not install packages: {e}")
        print("Please install manually: pip install anthropic python-dotenv pyyaml rich watchdog")
    
    # Setup directories
    setup_directories()
    
    # Launch main system
    print("Launching AE Automation v2.0...")
    print("=" * 50)
    print()
    
    try:
        # Import and run the main system
        from ae_automation_v2 import AEAutomationV2
        system = AEAutomationV2()
        system.run()
    except ImportError as e:
        print(f"Error importing system: {e}")
        print("\nTrying alternative launch method...")
        subprocess.call([sys.executable, "ae_automation_v2.py"])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()