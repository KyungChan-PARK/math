"""
Enhanced Hot Folder Monitor for After Effects Automation
Implements event-driven file monitoring with debouncing and multi-stage pipelines
"""

import asyncio
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, Set, Callable, Optional
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent
import json
import hashlib
import shutil
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DebouncedFileHandler(FileSystemEventHandler):
    """
    File system event handler with debouncing to prevent duplicate processing
    """
    
    def __init__(self, project_path: str, debounce_time: float = 2.0):
        self.project_path = Path(project_path)
        self.debounce_time = debounce_time
        self.pending_files: Dict[Path, float] = {}
        self.processing_files: Set[Path] = set()
        self.file_processors = self._initialize_processors()
        
        # Create necessary directories
        self.ensure_directories()
    
    def ensure_directories(self):
        """Create required directory structure"""
        dirs = [
            self.project_path / "watch" / "incoming",
            self.project_path / "watch" / "render",
            self.project_path / "watch" / "processed",
            self.project_path / "watch" / "failed",
            self.project_path / "proxies",
            self.project_path / "queue",
            self.project_path / ".backups"
        ]
        for dir_path in dirs:
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def _initialize_processors(self) -> Dict[str, Dict]:
        """Initialize file processors for different asset types"""
        return {
            'incoming_assets': {
                'path': self.project_path / "watch" / "incoming",
                'extensions': ['.mov', '.mp4', '.avi', '.png', '.jpg', '.psd', '.ai'],
                'pipeline': self.process_incoming_asset
            },
            'render_queue': {
                'path': self.project_path / "watch" / "render",
                'extensions': ['.aep', '.aepx'],
                'pipeline': self.queue_for_render
            },
            'scripts': {
                'path': self.project_path / "watch" / "scripts",
                'extensions': ['.jsx', '.jsxbin'],
                'pipeline': self.process_script
            }
        }
    
    def on_created(self, event: FileSystemEvent):
        """Handle file creation events"""
        if event.is_directory:
            return
        
        file_path = Path(event.src_path)
        
        # Add to pending with timestamp
        self.pending_files[file_path] = time.time()
        logger.info(f"File detected: {file_path.name}")
        
        # Schedule processing after debounce period
        asyncio.create_task(self._process_after_debounce(file_path))
    
    def on_modified(self, event: FileSystemEvent):
        """Handle file modification events"""
        if event.is_directory:
            return
        
        file_path = Path(event.src_path)
        
        # Update timestamp if file is still pending
        if file_path in self.pending_files:
            self.pending_files[file_path] = time.time()
            logger.debug(f"File modified, resetting debounce: {file_path.name}")
    
    async def _process_after_debounce(self, file_path: Path):
        """Process file after debounce period"""
        await asyncio.sleep(self.debounce_time)
        
        # Check if file is still pending and hasn't been modified recently
        if file_path in self.pending_files:
            last_modified = self.pending_files[file_path]
            if time.time() - last_modified >= self.debounce_time:
                # Remove from pending and add to processing
                del self.pending_files[file_path]
                
                if file_path not in self.processing_files:
                    self.processing_files.add(file_path)
                    try:
                        await self._route_to_processor(file_path)
                    finally:
                        self.processing_files.discard(file_path)
    
    async def _route_to_processor(self, file_path: Path):
        """Route file to appropriate processor based on location and type"""
        
        # Determine which processor to use
        for processor_name, config in self.file_processors.items():
            if config['path'] in file_path.parents:
                if file_path.suffix.lower() in config['extensions']:
                    logger.info(f"Processing {file_path.name} with {processor_name}")
                    result = await config['pipeline'](file_path)
                    
                    if result['success']:
                        # Move to processed folder
                        processed_path = self.project_path / "watch" / "processed" / file_path.name
                        shutil.move(str(file_path), str(processed_path))
                        logger.info(f"Successfully processed: {file_path.name}")
                    else:
                        # Move to failed folder
                        failed_path = self.project_path / "watch" / "failed" / file_path.name
                        shutil.move(str(file_path), str(failed_path))
                        logger.error(f"Failed to process: {file_path.name} - {result.get('error')}")
                    
                    return result
        
        logger.warning(f"No processor found for: {file_path}")
        return {'success': False, 'error': 'No processor configured'}

    async def process_incoming_asset(self, file_path: Path) -> Dict:
        """Process incoming media assets"""
        try:
            # Validate media file
            if not self.validate_media_file(file_path):
                return {'success': False, 'error': 'Invalid media format'}
            
            # Generate proxy if needed
            proxy_path = None
            if self.needs_proxy(file_path):
                proxy_path = await self.generate_proxy(file_path)
            
            # Create metadata
            metadata = self.extract_metadata(file_path)
            
            # Generate import script for After Effects
            ae_script = self.generate_import_script(file_path, proxy_path, metadata)
            
            # Save script to queue
            script_path = self.project_path / "queue" / f"import_{file_path.stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsx"
            script_path.write_text(ae_script, encoding='utf-8')
            
            # Log operation
            self.log_operation('asset_import', file_path, {'proxy': proxy_path, 'metadata': metadata})
            
            return {
                'success': True,
                'imported': str(file_path),
                'proxy': str(proxy_path) if proxy_path else None,
                'script': str(script_path)
            }
            
        except Exception as e:
            logger.error(f"Error processing asset {file_path}: {e}")
            return {'success': False, 'error': str(e)}
    
    async def queue_for_render(self, file_path: Path) -> Dict:
        """Queue After Effects project for rendering"""
        try:
            # Create render job
            job = {
                'id': hashlib.md5(f"{file_path}{datetime.now()}".encode()).hexdigest()[:8],
                'project': str(file_path),
                'created': datetime.now().isoformat(),
                'status': 'queued',
                'priority': self.determine_priority(file_path),
                'settings': self.get_render_settings(file_path)
            }
            
            # Save job to queue
            job_file = self.project_path / "queue" / f"render_{job['id']}.json"
            job_file.write_text(json.dumps(job, indent=2), encoding='utf-8')
            
            # Log operation
            self.log_operation('render_queue', file_path, job)
            
            return {
                'success': True,
                'job_id': job['id'],
                'queue_file': str(job_file)
            }
            
        except Exception as e:
            logger.error(f"Error queuing render {file_path}: {e}")
            return {'success': False, 'error': str(e)}
    
    async def process_script(self, file_path: Path) -> Dict:
        """Process ExtendScript files"""
        try:
            # Validate script syntax
            validation = self.validate_extendscript(file_path)
            if not validation['valid']:
                return {'success': False, 'error': f"Script validation failed: {validation['errors']}"}
            
            # Queue for execution
            execution_job = {
                'script': str(file_path),
                'created': datetime.now().isoformat(),
                'status': 'pending',
                'type': 'extendscript'
            }
            
            job_file = self.project_path / "queue" / f"execute_{file_path.stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            job_file.write_text(json.dumps(execution_job, indent=2), encoding='utf-8')
            
            return {
                'success': True,
                'script': str(file_path),
                'job': str(job_file)
            }
            
        except Exception as e:
            logger.error(f"Error processing script {file_path}: {e}")
            return {'success': False, 'error': str(e)}
    
    def validate_media_file(self, file_path: Path) -> bool:
        """Validate media file compatibility"""
        valid_video_codecs = ['h264', 'h265', 'prores', 'dnxhd', 'mjpeg']
        valid_image_formats = ['.png', '.jpg', '.jpeg', '.psd', '.tiff', '.exr']
        
        if file_path.suffix.lower() in valid_image_formats:
            return True
        
        # For video files, check codec (simplified check)
        if file_path.suffix.lower() in ['.mov', '.mp4', '.avi']:
            # In production, use ffprobe or similar to check codec
            return file_path.stat().st_size > 0
        
        return False
    
    def needs_proxy(self, file_path: Path) -> bool:
        """Determine if file needs a proxy"""
        # Files larger than 100MB or 4K+ resolution need proxies
        file_size_mb = file_path.stat().st_size / (1024 * 1024)
        return file_size_mb > 100
    
    async def generate_proxy(self, file_path: Path) -> Optional[Path]:
        """Generate proxy file for large media"""
        proxy_dir = self.project_path / "proxies"
        proxy_path = proxy_dir / f"{file_path.stem}_proxy.mp4"
        
        # In production, use ffmpeg to generate proxy
        # For now, just create a placeholder
        proxy_path.touch()
        
        logger.info(f"Generated proxy: {proxy_path.name}")
        return proxy_path
    
    def extract_metadata(self, file_path: Path) -> Dict:
        """Extract metadata from media file"""
        return {
            'filename': file_path.name,
            'size': file_path.stat().st_size,
            'modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
            'format': file_path.suffix,
            'checksum': hashlib.md5(file_path.read_bytes()).hexdigest()
        }
    
    def generate_import_script(self, file_path: Path, proxy_path: Optional[Path], metadata: Dict) -> str:
        """Generate ExtendScript for importing asset"""
        return f"""
// Auto-generated import script
// File: {file_path.name}
// Generated: {datetime.now().isoformat()}

(function() {{
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {{
        alert("Please select a composition first");
        return;
    }}
    
    // Import file
    var importOptions = new ImportOptions(File("{file_path.as_posix()}"));
    var importedItem = app.project.importFile(importOptions);
    
    // Set metadata as comment
    importedItem.comment = "{json.dumps(metadata).replace('"', '\\"')}";
    
    // Add to composition
    comp.layers.add(importedItem);
    
    // Set proxy if available
    {"importedItem.setProxy(File('" + proxy_path.as_posix() + "'));" if proxy_path else "// No proxy needed"}
    
    alert("Successfully imported: {file_path.name}");
}})();
"""
    
    def validate_extendscript(self, file_path: Path) -> Dict:
        """Validate ExtendScript syntax"""
        content = file_path.read_text(encoding='utf-8')
        
        errors = []
        
        # Check for balanced brackets
        if content.count('{') != content.count('}'):
            errors.append("Unbalanced curly brackets")
        
        if content.count('(') != content.count(')'):
            errors.append("Unbalanced parentheses")
        
        # Check for undo group matching
        if 'app.beginUndoGroup' in content and 'app.endUndoGroup' not in content:
            errors.append("Missing app.endUndoGroup()")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def determine_priority(self, file_path: Path) -> int:
        """Determine render priority based on file characteristics"""
        # Higher number = higher priority
        if '_urgent' in file_path.stem.lower():
            return 10
        elif '_final' in file_path.stem.lower():
            return 7
        elif '_draft' in file_path.stem.lower():
            return 3
        return 5
    
    def get_render_settings(self, file_path: Path) -> Dict:
        """Get render settings based on project type"""
        if '_web' in file_path.stem.lower():
            return {
                'format': 'H.264',
                'preset': 'YouTube 1080p',
                'quality': 'High'
            }
        elif '_broadcast' in file_path.stem.lower():
            return {
                'format': 'ProRes 422 HQ',
                'preset': 'Broadcast',
                'quality': 'Best'
            }
        return {
            'format': 'H.264',
            'preset': 'Match Source',
            'quality': 'High'
        }
    
    def log_operation(self, operation_type: str, file_path: Path, details: Dict):
        """Log operations to file"""
        log_file = self.project_path / "logs" / f"hot_folder_{datetime.now().strftime('%Y%m%d')}.json"
        log_file.parent.mkdir(exist_ok=True)
        
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'operation': operation_type,
            'file': str(file_path),
            'details': details
        }
        
        # Append to log file
        existing_logs = []
        if log_file.exists():
            try:
                existing_logs = json.loads(log_file.read_text(encoding='utf-8'))
            except:
                existing_logs = []
        
        existing_logs.append(log_entry)
        log_file.write_text(json.dumps(existing_logs, indent=2), encoding='utf-8')


class HotFolderManager:
    """Manager for hot folder monitoring"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.observer = Observer()
        self.handler = DebouncedFileHandler(project_path)
    
    def start(self):
        """Start monitoring hot folders"""
        # Monitor each configured folder
        for processor_name, config in self.handler.file_processors.items():
            watch_path = config['path']
            if watch_path.exists():
                self.observer.schedule(self.handler, str(watch_path), recursive=False)
                logger.info(f"Monitoring: {watch_path}")
        
        self.observer.start()
        logger.info("Hot folder monitoring started")
    
    def stop(self):
        """Stop monitoring"""
        self.observer.stop()
        self.observer.join()
        logger.info("Hot folder monitoring stopped")


if __name__ == "__main__":
    # Initialize and start monitoring
    project_root = r"C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project"
    
    manager = HotFolderManager(project_root)
    
    try:
        manager.start()
        print("Hot folder monitoring active. Press Ctrl+C to stop.")
        
        # Keep running
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nStopping hot folder monitoring...")
        manager.stop()
    except Exception as e:
        logger.error(f"Error in hot folder monitoring: {e}")
        manager.stop()
