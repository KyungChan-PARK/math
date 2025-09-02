"""
After Effects Render Optimizer Sub-Agent
Optimizes render settings and manages render queue
"""

import json
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

class AERenderOptimizer:
    """
    Specialized agent for render optimization
    Analyzes compositions and configures optimal render settings
    """
    
    def __init__(self):
        self.render_presets = {
            'preview': {
                'format': 'H.264',
                'quality': 'Draft',
                'resolution': 'Half',
                'frame_rate': 'Auto',
                'bitrate': '5M'
            },
            'web': {
                'format': 'H.264',
                'quality': 'High',
                'resolution': 'Full',
                'frame_rate': 30,
                'bitrate': '10M'
            },
            'broadcast': {
                'format': 'ProRes 422',
                'quality': 'Best',
                'resolution': 'Full',
                'frame_rate': 'Auto',
                'color_depth': '10-bit'
            },
            'archive': {
                'format': 'ProRes 4444',
                'quality': 'Best',
                'resolution': 'Full',
                'alpha': True,
                'color_depth': '12-bit'
            }
        }
        
        self.multi_frame_threshold = 60  # seconds
    
    def optimize_render(self, comp_data: Dict, output_type: str = 'web') -> Dict:
        """
        Optimize render settings based on composition analysis
        
        Args:
            comp_data: Composition metadata
            output_type: Target output format (preview/web/broadcast/archive)
        
        Returns:
            Optimized render configuration
        """
        
        # Get base preset
        preset = self.render_presets.get(output_type, self.render_presets['web'])
        
        # Analyze composition complexity
        complexity = self.analyze_complexity(comp_data)
        
        # Adjust settings based on complexity
        optimized = self.adjust_for_complexity(preset, complexity)
        
        # Configure multi-frame rendering if beneficial
        if self.should_use_multiframe(comp_data, complexity):
            optimized['multi_frame_rendering'] = True
            optimized['concurrent_frames'] = self.calculate_optimal_frames(complexity)
        
        # Set up disk cache strategy
        optimized['disk_cache'] = self.configure_disk_cache(comp_data)
        
        # Generate ExtendScript for render setup
        optimized['setup_script'] = self.generate_render_script(optimized)
        
        return optimized
    
    def analyze_complexity(self, comp_data: Dict) -> Dict:
        """Analyze composition complexity"""
        complexity = {
            'score': 5,  # 1-10 scale
            'factors': []
        }
        
        # Check layer count
        layer_count = comp_data.get('layer_count', 0)
        if layer_count > 50:
            complexity['score'] += 2
            complexity['factors'].append('High layer count')
        
        # Check effects
        effects = comp_data.get('effects', [])
        heavy_effects = ['Particular', 'Element 3D', 'Optical Flares']
        if any(effect in effects for effect in heavy_effects):
            complexity['score'] += 3
            complexity['factors'].append('Heavy effects detected')
        
        # Check resolution
        width = comp_data.get('width', 1920)
        if width >= 3840:  # 4K or higher
            complexity['score'] += 2
            complexity['factors'].append('High resolution')
        
        # Check duration
        duration = comp_data.get('duration', 0)
        if duration > 300:  # 5+ minutes
            complexity['score'] += 1
            complexity['factors'].append('Long duration')
        
        complexity['score'] = min(10, complexity['score'])
        return complexity
    
    def generate_render_script(self, settings: Dict) -> str:
        """Generate ExtendScript for render setup"""
        script = f'''
        // Auto-generated render optimization script
        // Generated: {datetime.now().isoformat()}
        
        var comp = app.project.activeItem;
        if (comp && comp instanceof CompItem) {{
            // Add to render queue
            var renderItem = app.project.renderQueue.items.add(comp);
            var outputModule = renderItem.outputModule(1);
            
            // Configure output settings
            outputModule.format = "{settings.get('format', 'H.264')}";
            
            // Set quality
            var omSettings = outputModule.getSettings();
            omSettings.Quality = "{settings.get('quality', 'High')}";
            outputModule.setSettings(omSettings);
            
            // Configure multi-frame rendering if enabled
            if ({str(settings.get('multi_frame_rendering', False)).lower()}) {{
                app.project.renderQueue.render();
            }}
            
            alert("Render settings optimized for {settings.get('format')} output");
        }}
        '''
        
        return script

# Export for use
agent = AERenderOptimizer()
