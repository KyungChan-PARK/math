"""
Enhanced Drop Zone Handler with Binary File Support
Fixes permission errors and handles different file types
"""

import asyncio
import time
from pathlib import Path
from typing import Dict
from datetime import datetime

from rich.console import Console
from watchdog.events import FileSystemEventHandler

from extendscript_cleaner import ExtendScriptCleaner
from ae_executor import AfterEffectsExecutor

console = Console()

class DropZoneHandler(FileSystemEventHandler):
    """File system event handler for drop zones with enhanced error handling"""
    
    def __init__(self, zone_config: Dict, router):
        self.zone_config = zone_config
        self.router = router
        self.zone_name = zone_config['name']
        self.file_patterns = zone_config.get('file_patterns', ['*'])
        
        # Silently try to initialize AE executor
        try:
            self.ae_executor = AfterEffectsExecutor()
            # Don't print error if AE not found
            if not self.ae_executor.ae_path:
                self.ae_executor = None
        except:
            self.ae_executor = None
    
    def on_created(self, event):
        """Handle file creation events"""
        if event.is_directory:
            return
            
        file_path = Path(event.src_path)
        
        # Check if file matches patterns
        if not self.matches_pattern(file_path):
            return
        
        console.print(f"\n[cyan]New file detected in {self.zone_name}:[/cyan] {file_path.name}")
        
        # Wait for file to be fully written (important for large files)
        time.sleep(1)
        
        # Check if file is still being written
        if not self.is_file_ready(file_path):
            console.print(f"[yellow]File still being written, waiting...[/yellow]")
            time.sleep(2)
        
        # Process file asynchronously
        asyncio.run(self.process_file(file_path))
    
    def matches_pattern(self, file_path: Path) -> bool:
        """Check if file matches zone patterns"""
        for pattern in self.file_patterns:
            if file_path.match(pattern):
                return True
        return False
    
    def is_file_ready(self, file_path: Path) -> bool:
        """Check if file is ready to be read"""
        try:
            # Try to open file exclusively
            with open(file_path, 'rb') as f:
                pass
            return True
        except (IOError, OSError, PermissionError):
            return False
    
    async def process_file(self, file_path: Path):
        """Process dropped file with enhanced error handling"""
        try:
            # Determine file type
            file_ext = file_path.suffix.lower()
            
            # Handle different file types
            if file_ext in ['.aep', '.aepx', '.aet', '.prproj']:
                # Binary project files - just note the file
                console.print(f"[yellow]Project file detected: {file_path.name}[/yellow]")
                content = f"Analyze the After Effects project file: {file_path.name}\n"
                content += f"File type: {file_ext}\n"
                content += f"Location: {file_path}\n"
                content += "Please provide guidance on working with this project."
            
            elif file_ext in ['.mp4', '.mov', '.avi', '.mkv']:
                # Video files - note for analysis
                console.print(f"[yellow]Video file detected: {file_path.name}[/yellow]")
                content = f"Analyze this video file for After Effects processing: {file_path.name}\n"
                content += f"Format: {file_ext}\n"
                content += "Suggest effects, transitions, or processing techniques."
            
            elif file_ext in ['.jpg', '.jpeg', '.png', '.psd', '.tiff']:
                # Image files
                console.print(f"[yellow]Image file detected: {file_path.name}[/yellow]")
                content = f"Process this image for After Effects: {file_path.name}\n"
                content += f"Format: {file_ext}\n"
                content += "Suggest animation techniques or effects."
            
            else:
                # Text-based files (txt, md, json, csv, etc.)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except UnicodeDecodeError:
                    # Try with different encoding
                    try:
                        with open(file_path, 'r', encoding='latin-1') as f:
                            content = f.read()
                    except:
                        # If all fails, treat as binary
                        content = f"Binary file detected: {file_path.name}\n"
                        content += "Unable to read content directly."
            
            console.print(f"[yellow]Processing: {file_path.name}[/yellow]")
            
            # Route to appropriate model
            result, model = await self.router.route_request(content, self.zone_config)
            
            # Save result
            output_config = self.zone_config.get('output', {})
            output_type = output_config.get('type', 'text')
            output_ext = output_config.get('file_extension', '.txt')
            
            output_dir = file_path.parent / 'output'
            output_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = output_dir / f"{file_path.stem}_{timestamp}_{model}{output_ext}"
            
            # Clean ExtendScript output if needed
            if output_ext == '.jsx':
                cleaner = ExtendScriptCleaner()
                result = cleaner.clean(result)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(result)
            
            console.print(f"[green]OK Output saved: {output_file.name}[/green]")
            
            # Execute if configured and it's a JSX file
            if output_config.get('auto_execute', False) and output_ext == '.jsx':
                self.execute_extendscript(output_file)
            
        except PermissionError as e:
            console.print(f"[red]Permission denied: {file_path.name}[/red]")
            console.print(f"[yellow]File may be open in another program. Close it and try again.[/yellow]")
        except Exception as e:
            console.print(f"[red]Error processing {file_path.name}: {str(e)[:100]}[/red]")
    
    def execute_extendscript(self, jsx_path: Path):
        """Execute ExtendScript in After Effects"""
        if self.ae_executor and self.ae_executor.ae_path:
            console.print(f"[yellow]Executing ExtendScript: {jsx_path.name}[/yellow]")
            success = self.ae_executor.execute_script(str(jsx_path))
            if success:
                console.print(f"[green]Script launched in After Effects[/green]")
            else:
                console.print(f"[red]Failed to execute script[/red]")
        # Don't print warning if AE not configured - just silently skip
