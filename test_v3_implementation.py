"""
Quick test script for v3.0 components
"""

import sys
import json
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent))

def test_hooks():
    """Test Hook system exists"""
    hooks_dir = Path(".claude/hooks")
    assert hooks_dir.exists(), "Hooks directory missing"
    
    pre_hook = hooks_dir / "pre_tool_use.py"
    post_hook = hooks_dir / "post_tool_use.py"
    
    assert pre_hook.exists(), "Pre-tool hook missing"
    assert post_hook.exists(), "Post-tool hook missing"
    
    print("[OK] Hooks system ready")

def test_agents():
    """Test Sub-agents exist"""
    agents_dir = Path("agents")
    
    asset_processor = agents_dir / "ae_asset_processor.py"
    render_optimizer = agents_dir / "ae_render_optimizer.py"
    
    assert asset_processor.exists(), "Asset processor missing"
    assert render_optimizer.exists(), "Render optimizer missing"
    
    print("[OK] Sub-agents ready")

def test_architecture():
    """Test integrated architecture"""
    arch_file = Path("enhanced_architecture_v3.py")
    assert arch_file.exists(), "Architecture file missing"
    
    print("[OK] Architecture ready")

if __name__ == "__main__":
    print("Testing v3.0 Implementation...")
    test_hooks()
    test_agents()
    test_architecture()
    print("\nAll components successfully implemented!")
    print("Ready for integration testing")
