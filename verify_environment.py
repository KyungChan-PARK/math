"""
Test import and initialization of main system
"""

import sys
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test all required imports"""
    print("Testing imports...")
    
    try:
        import anthropic
        print("  [OK] anthropic")
    except ImportError as e:
        print(f"  [FAIL] anthropic: {e}")
    
    try:
        import watchdog
        print("  [OK] watchdog")
    except ImportError as e:
        print(f"  [FAIL] watchdog: {e}")
    
    try:
        import yaml
        print("  [OK] yaml")
    except ImportError as e:
        print(f"  [FAIL] yaml: {e}")
    
    try:
        from rich.console import Console
        print("  [OK] rich")
    except ImportError as e:
        print(f"  [FAIL] rich: {e}")
    
    try:
        import dotenv
        print("  [OK] python-dotenv")
    except ImportError as e:
        print(f"  [FAIL] python-dotenv: {e}")
    
    try:
        import aiofiles
        print("  [OK] aiofiles")
    except ImportError as e:
        print(f"  [FAIL] aiofiles: {e}")

def test_environment():
    """Test environment configuration"""
    print("\nTesting environment...")
    
    # Check .env file
    env_file = Path(".env")
    if env_file.exists():
        print("  [OK] .env file exists")
        
        # Try to load it
        from dotenv import load_dotenv
        import os
        
        load_dotenv()
        api_key = os.getenv("ANTHROPIC_API_KEY")
        
        if api_key:
            print(f"  [OK] ANTHROPIC_API_KEY is set ({len(api_key)} chars)")
        else:
            print("  [WARN] ANTHROPIC_API_KEY not found in .env")
    else:
        print("  [WARN] .env file not found")
    
    # Check drop zones
    drops_dir = Path("drops")
    if drops_dir.exists():
        zones = list(drops_dir.iterdir())
        print(f"  [OK] Drop zones directory exists ({len(zones)} zones)")
        for zone in zones:
            print(f"      - {zone.name}")
    else:
        print("  [FAIL] Drop zones directory not found")

def test_configuration():
    """Test YAML configuration"""
    print("\nTesting configuration...")
    
    config_file = Path("enhanced_drops.yaml")
    if config_file.exists():
        print("  [OK] enhanced_drops.yaml exists")
        
        try:
            import yaml
            with open(config_file, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            zones = config.get('drop_zones', {})
            print(f"  [OK] Configuration loaded ({len(zones)} zones defined)")
            
            for zone_name in zones:
                print(f"      - {zone_name}")
        except Exception as e:
            print(f"  [FAIL] Error loading config: {e}")
    else:
        print("  [FAIL] enhanced_drops.yaml not found")

if __name__ == "__main__":
    print("=" * 50)
    print("AE Claude Max v3.0 - Environment Verification")
    print("=" * 50)
    
    test_imports()
    test_environment()
    test_configuration()
    
    print("\n" + "=" * 50)
    print("Verification complete!")
    print("=" * 50)
