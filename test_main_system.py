"""
Test run for main drop zone system
"""

import sys
import os
from pathlib import Path

# Set working directory to project root
project_dir = Path(r"C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project")
os.chdir(project_dir)
sys.path.insert(0, str(project_dir))

print("=" * 50)
print("Starting AE Claude Max v3.0 Test Run")
print("=" * 50)
print()

# Test imports
try:
    from sfs_enhanced_ae_dropzones import ClaudeMaxRouter, DropZoneHandler
    print("[OK] Main modules imported successfully")
except ImportError as e:
    print(f"[FAIL] Import error: {e}")
    sys.exit(1)
except SyntaxError as e:
    print(f"[FAIL] Syntax error: {e}")
    sys.exit(1)

# Test configuration loading
try:
    import yaml
    with open('enhanced_drops.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    zones = config.get('drop_zones', {})
    print(f"[OK] Configuration loaded: {len(zones)} zones")
    
    for zone_name, zone_config in zones.items():
        print(f"    - {zone_name}: {zone_config.get('description', 'No description')}")
except Exception as e:
    print(f"[FAIL] Config loading error: {e}")
    sys.exit(1)

print()
print("=" * 50)
print("Test completed successfully!")
print("System is ready to run.")
print("=" * 50)
print()
print("To start the full system, run:")
print("  venv\\Scripts\\python.exe sfs_enhanced_ae_dropzones.py")
