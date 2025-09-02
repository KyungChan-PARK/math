"""
After Effects Script Executor
Finds AE installation and executes ExtendScript files
"""

import os
import subprocess
import json
from pathlib import Path
from typing import Optional, List
import winreg

class AfterEffectsExecutor:
    """
    Handles After Effects script execution on Windows
    """
    
    def __init__(self, silent=True):
        self.silent = silent
        self.ae_path = self.find_after_effects()
        self.config_file = Path("ae_executor_config.json")
        self.load_config()
    
    def find_after_effects(self) -> Optional[Path]:
        """
        Find After Effects installation on Windows
        """
        # Common installation paths
        common_paths = [
            r"C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\AfterFX.exe",
            r"C:\Program Files\Adobe\Adobe After Effects 2023\Support Files\AfterFX.exe",
            r"C:\Program Files\Adobe\Adobe After Effects 2022\Support Files\AfterFX.exe",
            r"C:\Program Files\Adobe\Adobe After Effects CC 2019\Support Files\AfterFX.exe",
            r"C:\Program Files\Adobe\Adobe After Effects CC\Support Files\AfterFX.exe",
        ]
        
        # Check common paths first
        for path in common_paths:
            if Path(path).exists():
                if not self.silent:
                    print(f"[OK] Found After Effects: {path}")
                return Path(path)
        
        # Try to find via registry
        ae_path = self.find_in_registry()
        if ae_path:
            return ae_path
        
        # Search in Program Files
        ae_path = self.search_program_files()
        if ae_path:
            return ae_path
        
        if not self.silent:
            print("[!] After Effects not found. Please configure manually.")
        return None
    
    def find_in_registry(self) -> Optional[Path]:
        """
        Search Windows registry for After Effects
        """
        try:
            # Try to find in registry
            key_paths = [
                r"SOFTWARE\Adobe\After Effects",
                r"SOFTWARE\WOW6432Node\Adobe\After Effects",
            ]
            
            for key_path in key_paths:
                try:
                    with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path) as key:
                        # Get subkeys (version numbers)
                        i = 0
                        while True:
                            try:
                                version = winreg.EnumKey(key, i)
                                with winreg.OpenKey(key, version) as version_key:
                                    install_path = winreg.QueryValueEx(version_key, "InstallPath")[0]
                                    exe_path = Path(install_path) / "Support Files" / "AfterFX.exe"
                                    if exe_path.exists():
                                        if not self.silent:
                                            print(f"[OK] Found in registry: {exe_path}")
                                        return exe_path
                                i += 1
                            except WindowsError:
                                break
                except:
                    continue
        except:
            pass
        
        return None
    
    def search_program_files(self) -> Optional[Path]:
        """
        Search for After Effects in Program Files
        """
        program_files = [
            Path(os.environ.get("ProgramFiles", r"C:\Program Files")),
            Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")),
        ]
        
        for pf in program_files:
            adobe_dir = pf / "Adobe"
            if adobe_dir.exists():
                for ae_dir in adobe_dir.glob("*After Effects*"):
                    exe_path = ae_dir / "Support Files" / "AfterFX.exe"
                    if exe_path.exists():
                        if not self.silent:
                            print(f"[OK] Found by search: {exe_path}")
                        return exe_path
        
        return None
    
    def load_config(self):
        """
        Load saved configuration
        """
        if self.config_file.exists():
            with open(self.config_file, 'r') as f:
                config = json.load(f)
                saved_path = config.get("ae_path")
                if saved_path and Path(saved_path).exists():
                    self.ae_path = Path(saved_path)
                    if not self.silent:
                        print(f"[OK] Loaded saved path: {self.ae_path}")
    
    def save_config(self):
        """
        Save configuration
        """
        config = {
            "ae_path": str(self.ae_path) if self.ae_path else None
        }
        with open(self.config_file, 'w') as f:
            json.dump(config, f, indent=2)
    
    def set_ae_path(self, path: str):
        """
        Manually set After Effects path
        """
        ae_path = Path(path)
        if ae_path.exists():
            self.ae_path = ae_path
            self.save_config()
            print(f"[OK] After Effects path set: {ae_path}")
            return True
        else:
            print(f"[!] Path does not exist: {path}")
            return False
    
    def execute_script(self, script_path: str, wait: bool = False) -> bool:
        """
        Execute ExtendScript in After Effects
        
        Args:
            script_path: Path to .jsx file
            wait: Wait for AE to finish execution
        
        Returns:
            Success status
        """
        if not self.ae_path:
            print("[!] After Effects path not configured")
            return False
        
        script_file = Path(script_path)
        if not script_file.exists():
            print(f"[!] Script not found: {script_path}")
            return False
        
        if not script_file.suffix.lower() == '.jsx':
            print(f"[!] Not a JSX file: {script_path}")
            return False
        
        # Build command
        # Use absolute path and quote it
        cmd = [str(self.ae_path), "-r", str(script_file.absolute())]
        
        print(f"[*] Executing: {script_file.name}")
        print(f"    Command: {' '.join(cmd)}")
        
        try:
            if wait:
                # Wait for completion
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                if result.returncode == 0:
                    print("[OK] Script executed successfully")
                    return True
                else:
                    print(f"[!] Execution failed: {result.stderr}")
                    return False
            else:
                # Launch and don't wait
                subprocess.Popen(cmd)
                print("[OK] Script launched in After Effects")
                return True
                
        except subprocess.TimeoutExpired:
            print("[!] Execution timed out")
            return False
        except Exception as e:
            print(f"[!] Error executing script: {e}")
            return False
    
    def execute_code(self, code: str, wait: bool = False) -> bool:
        """
        Execute ExtendScript code by creating temporary file
        
        Args:
            code: ExtendScript code to execute
            wait: Wait for completion
        
        Returns:
            Success status
        """
        # Create temp script
        temp_dir = Path("temp_scripts")
        temp_dir.mkdir(exist_ok=True)
        
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_script = temp_dir / f"temp_{timestamp}.jsx"
        
        # Write code to temp file
        with open(temp_script, 'w', encoding='utf-8') as f:
            f.write(code)
        
        # Execute
        success = self.execute_script(str(temp_script), wait)
        
        # Optionally delete temp file
        # temp_script.unlink()
        
        return success
    
    def test_connection(self) -> bool:
        """
        Test After Effects connection with simple script
        """
        test_code = '''
// Test connection
alert("After Effects connected successfully!");
app.project.save();
'''
        
        print("[*] Testing After Effects connection...")
        return self.execute_code(test_code, wait=True)


def main():
    """
    Test and setup After Effects executor
    """
    executor = AfterEffectsExecutor()
    
    if not executor.ae_path:
        print("\n[!] After Effects not found automatically.")
        print("Please provide the path to AfterFX.exe:")
        print("Example: C:\\Program Files\\Adobe\\Adobe After Effects 2024\\Support Files\\AfterFX.exe")
        
        ae_path = input("Path: ").strip('"')
        if ae_path:
            executor.set_ae_path(ae_path)
    
    if executor.ae_path:
        print(f"\n[OK] After Effects configured: {executor.ae_path}")
        
        # Test connection
        # executor.test_connection()
        
        # Look for existing scripts to test
        jsx_files = list(Path("drops/ae_vibe/output").glob("*.clean.jsx"))
        if jsx_files:
            print(f"\n[*] Found {len(jsx_files)} clean JSX files")
            latest = max(jsx_files, key=lambda p: p.stat().st_mtime)
            print(f"[*] Testing with: {latest.name}")
            executor.execute_script(str(latest))
        
        # Save config
        executor.save_config()
        print("[OK] Configuration saved")
    
    return executor


if __name__ == "__main__":
    executor = main()
