"""
After Effects Asset Processor Sub-Agent
Specialized agent for processing and optimizing media assets
"""

import os
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Optional

class AEAssetProcessor:
    """
    Processes and optimizes media assets for After Effects compositions
    Handles validation, format conversion, proxy generation
    """
    
    def __init__(self):
        self.supported_formats = {
            'video': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
            'image': ['.png', '.jpg', '.jpeg', '.psd', '.tiff', '.exr'],
            'audio': ['.wav', '.mp3', '.aac', '.m4a']
        }
        
        self.ae_optimal_settings = {
            'video_codec': 'h264',
            'video_bitrate': '10M',
            'frame_rate': 30,
            'resolution': (1920, 1080),
            'audio_codec': 'aac',
            'audio_bitrate': '192k'
        }
    
    def process_asset(self, file_path: str) -> Dict:
        """Main entry point for asset processing"""
        path = Path(file_path)
        
        if not path.exists():
            return {'error': 'File not found'}
        
        # Validate asset
        validation = self.validate_asset(path)
        if not validation['valid']:
            return validation
        
        # Optimize based on type
        asset_type = self.get_asset_type(path)
        
        if asset_type == 'video':
            return self.process_video(path)
        elif asset_type == 'image':
            return self.process_image(path)
        elif asset_type == 'audio':
            return self.process_audio(path)
        
        return {'error': 'Unsupported asset type'}
    
    def validate_asset(self, path: Path) -> Dict:
        """Validate media file for AE compatibility"""
        result = {'valid': True, 'issues': []}
        
        # Check file size
        size_mb = path.stat().st_size / (1024 * 1024)
        if size_mb > 4096:  # 4GB limit
            result['issues'].append('File exceeds 4GB limit')
            result['valid'] = False
        
        # Check format
        if not self.is_supported_format(path):
            result['issues'].append(f'Unsupported format: {path.suffix}')
            result['valid'] = False
        
        # Use ffprobe for detailed validation
        if self.get_asset_type(path) in ['video', 'audio']:
            probe_result = self.probe_media(path)
            if probe_result.get('error'):
                result['issues'].append(probe_result['error'])
                result['valid'] = False
        
        return result
    
    def process_video(self, path: Path) -> Dict:
        """Process video files for AE"""
        output_dir = path.parent / 'ae_optimized'
        output_dir.mkdir(exist_ok=True)
        
        # Generate proxy if needed
        probe = self.probe_media(path)
        if self.needs_proxy(probe):
            proxy_path = self.generate_proxy(path, output_dir)
            return {
                'success': True,
                'original': str(path),
                'proxy': str(proxy_path),
                'message': 'Generated proxy for 4K+ footage'
            }
        
        # Convert if needed
        if probe.get('codec') not in ['h264', 'prores']:
            converted = self.convert_video(path, output_dir)
            return {
                'success': True,
                'original': str(path),
                'converted': str(converted),
                'message': 'Converted to AE-compatible format'
            }
        
        return {
            'success': True,
            'original': str(path),
            'message': 'Video is AE-ready'
        }
