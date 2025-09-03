# 🎬 Video Motion Extraction & Analysis Framework
**Technical Implementation Guide for AE Claude Max v3.1**
*Last Updated: 2025-01-22*

## 📋 Overview

This document provides a comprehensive framework for extracting structured animation data from video files and converting it into actionable After Effects automations. The system combines computer vision, deep learning, and motion analysis to transform video content into reusable animation templates.

## 🔬 Technical Architecture

### Processing Pipeline

```
Video Input → Frame Extraction → Element Detection → Motion Tracking → Data Structuring → AE Script Generation
```

### Core Components

1. **Video Processor**: Frame extraction and preprocessing
2. **Element Detector**: YOLOv8-seg + EAST for object/text detection
3. **Motion Tracker**: Optical flow + object tracking
4. **Data Structurer**: Lottie JSON format conversion
5. **Script Generator**: ExtendScript code generation

## 📹 Stage 1: Video Processing

### Frame Extraction
```python
import cv2
import numpy as np

class VideoProcessor:
    def __init__(self, video_path):
        self.cap = cv2.VideoCapture(video_path)
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.frame_count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
    def extract_frames(self, sample_rate=1):
        """Extract frames at specified sample rate"""
        frames = []
        frame_idx = 0
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
                
            if frame_idx % sample_rate == 0:
                frames.append({
                    'index': frame_idx,
                    'time': frame_idx / self.fps,
                    'data': frame
                })
            frame_idx += 1
            
        return frames
    
    def preprocess_frame(self, frame):
        """Prepare frame for analysis"""
        # Color space conversion
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Noise reduction
        denoised = cv2.fastNlMeansDenoising(gray)
        
        return {
            'original': frame,
            'hsv': hsv,
            'gray': gray,
            'denoised': denoised
        }
```

## 🎯 Stage 2: Element Detection

### Multi-Model Approach
```python
from ultralytics import YOLO
import easyocr

class ElementDetector:
    def __init__(self):
        # Instance segmentation for shapes
        self.yolo = YOLO('yolov8x-seg.pt')
        
        # Text detection
        self.text_detector = easyocr.Reader(['en'])
        
        # Custom trained model for motion graphics
        self.custom_model = self.load_custom_model()
        
    def detect_elements(self, frame):
        """Comprehensive element detection"""
        elements = {
            'shapes': [],
            'text': [],
            'abstract': []
        }
        
        # 1. Detect general objects/shapes
        yolo_results = self.yolo(frame)
        for r in yolo_results:
            if r.masks is not None:
                elements['shapes'].extend(self.process_masks(r.masks))
        
        # 2. Detect text regions
        text_results = self.text_detector.readtext(frame)
        elements['text'] = self.process_text(text_results)
        
        # 3. Detect abstract graphics (custom model)
        abstract_results = self.custom_model.predict(frame)
        elements['abstract'] = self.process_abstract(abstract_results)
        
        return elements
    
    def process_masks(self, masks):
        """Convert masks to structured data"""
        processed = []
        for mask in masks:
            contours, _ = cv2.findContours(
                mask.numpy().astype(np.uint8),
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE
            )
            
            for contour in contours:
                processed.append({
                    'type': 'shape',
                    'contour': contour,
                    'bbox': cv2.boundingRect(contour),
                    'area': cv2.contourArea(contour),
                    'centroid': self.calculate_centroid(contour)
                })
        
        return processed
```

### Custom Model Training
```python
class CustomModelTrainer:
    def __init__(self):
        self.dataset_path = "motion_graphics_dataset/"
        self.model = YOLO('yolov8x-seg.yaml')
        
    def prepare_dataset(self):
        """Prepare motion graphics specific dataset"""
        # Dataset structure:
        # - Logos, icons, geometric shapes
        # - Abstract animations
        # - UI elements
        # - Particle effects
        
        dataset_config = {
            'path': self.dataset_path,
            'train': 'train/images',
            'val': 'val/images',
            'nc': 10,  # Number of classes
            'names': [
                'logo', 'icon', 'shape', 'particle',
                'text', 'button', 'transition', 'effect',
                'mask', 'gradient'
            ]
        }
        
        return dataset_config
    
    def train(self):
        """Fine-tune on motion graphics"""
        results = self.model.train(
            data=self.prepare_dataset(),
            epochs=100,
            imgsz=640,
            batch=16,
            device='cuda'
        )
        return results
```

## 🔄 Stage 3: Motion Analysis

### Optical Flow Computation
```python
class MotionAnalyzer:
    def __init__(self):
        self.flow_params = {
            'pyr_scale': 0.5,
            'levels': 3,
            'winsize': 15,
            'iterations': 3,
            'poly_n': 5,
            'poly_sigma': 1.2
        }
        
    def calculate_dense_flow(self, frame1, frame2):
        """Farneback dense optical flow"""
        gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
        
        flow = cv2.calcOpticalFlowFarneback(
            gray1, gray2, None, **self.flow_params
        )
        
        # Convert to magnitude and angle
        mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        
        return {
            'flow': flow,
            'magnitude': mag,
            'angle': ang,
            'average_motion': np.mean(mag)
        }
    
    def track_element(self, element, frames):
        """Track specific element across frames"""
        tracker = cv2.TrackerCSRT_create()
        
        # Initialize tracker
        first_frame = frames[0]['data']
        bbox = element['bbox']
        tracker.init(first_frame, bbox)
        
        trajectory = []
        for frame in frames[1:]:
            success, bbox = tracker.update(frame['data'])
            if success:
                trajectory.append({
                    'frame': frame['index'],
                    'time': frame['time'],
                    'bbox': bbox,
                    'center': self.get_center(bbox)
                })
            else:
                # Re-detect if tracking fails
                trajectory.append(self.redetect_element(element, frame))
        
        return trajectory
```

### Transform Parameter Extraction
```python
class TransformExtractor:
    def extract_transforms(self, trajectory):
        """Extract AE transform parameters from trajectory"""
        transforms = {
            'position': [],
            'scale': [],
            'rotation': []
        }
        
        for i in range(1, len(trajectory)):
            prev = trajectory[i-1]
            curr = trajectory[i]
            
            # Position (translation)
            dx = curr['center'][0] - prev['center'][0]
            dy = curr['center'][1] - prev['center'][1]
            transforms['position'].append({
                'time': curr['time'],
                'value': [dx, dy]
            })
            
            # Scale (size change)
            scale_x = curr['bbox'][2] / prev['bbox'][2]
            scale_y = curr['bbox'][3] / prev['bbox'][3]
            transforms['scale'].append({
                'time': curr['time'],
                'value': [scale_x * 100, scale_y * 100]
            })
            
            # Rotation (using PCA or moments)
            angle = self.calculate_rotation(prev, curr)
            transforms['rotation'].append({
                'time': curr['time'],
                'value': angle
            })
        
        return transforms
    
    def identify_keyframes(self, transforms):
        """Identify keyframes from continuous data"""
        keyframes = []
        
        # Detect significant changes
        for param in ['position', 'scale', 'rotation']:
            data = transforms[param]
            
            # Calculate derivatives (velocity/acceleration)
            velocity = np.diff([d['value'] for d in data])
            acceleration = np.diff(velocity)
            
            # Find peaks (keyframe moments)
            peaks = self.find_peaks(acceleration)
            
            for peak in peaks:
                keyframes.append({
                    'time': data[peak]['time'],
                    'parameter': param,
                    'value': data[peak]['value']
                })
        
        return keyframes
```

## 📊 Stage 4: Data Structuring (Lottie Format)

### JSON Schema Implementation
```python
class LottieExporter:
    def __init__(self, fps=30, width=1920, height=1080):
        self.schema = {
            'v': '1.0.0',  # Version
            'fr': fps,      # Frame rate
            'ip': 0,        # In point
            'op': 0,        # Out point (will be set)
            'w': width,     # Canvas width
            'h': height,    # Canvas height
            'layers': []    # Animation layers
        }
    
    def create_layer(self, element, transforms):
        """Convert element to Lottie layer"""
        layer = {
            'ind': element['id'],
            'nm': f"Element_{element['id']}",
            'ip': 0,
            'op': self.schema['op'],
            'ks': {  # Transform properties
                'p': self.create_position_keyframes(transforms['position']),
                's': self.create_scale_keyframes(transforms['scale']),
                'r': self.create_rotation_keyframes(transforms['rotation']),
                'o': {'a': 0, 'k': 100}  # Opacity (static)
            }
        }
        
        # Add shape data if available
        if element['type'] == 'shape':
            layer['shapes'] = self.create_shape_data(element)
        
        return layer
    
    def create_position_keyframes(self, positions):
        """Format position data for Lottie"""
        return {
            'a': 1,  # Animated
            'k': [
                {
                    't': p['time'] * self.schema['fr'],  # Frame number
                    's': p['value'],  # Start value [x, y]
                    'e': positions[i+1]['value'] if i+1 < len(positions) else p['value'],
                    'to': [0, 0],
                    'ti': [0, 0]
                }
                for i, p in enumerate(positions)
            ]
        }
    
    def export(self, elements, all_transforms):
        """Generate complete Lottie JSON"""
        for element, transforms in zip(elements, all_transforms):
            layer = self.create_layer(element, transforms)
            self.schema['layers'].append(layer)
        
        # Set out point
        max_time = max([t['position'][-1]['time'] for t in all_transforms])
        self.schema['op'] = int(max_time * self.schema['fr'])
        
        return json.dumps(self.schema, indent=2)
```

## 🎯 Stage 5: After Effects Script Generation

### ExtendScript Generation
```python
class AEScriptGenerator:
    def __init__(self):
        self.templates = self.load_templates()
    
    def generate_from_lottie(self, lottie_data):
        """Convert Lottie to ExtendScript"""
        script = []
        
        # Header
        script.append('app.beginUndoGroup("Import Motion Data");')
        script.append('var comp = app.project.activeItem;')
        script.append('if (!(comp instanceof CompItem)) { alert("Please select a composition"); }')
        
        # Process each layer
        for layer in lottie_data['layers']:
            script.extend(self.generate_layer_script(layer))
        
        # Footer
        script.append('app.endUndoGroup();')
        
        return '\n'.join(script)
    
    def generate_layer_script(self, layer_data):
        """Generate script for single layer"""
        script = []
        
        # Create or select layer
        script.append(f'var layer = comp.layers.byName("{layer_data["nm"]}");')
        script.append('if (!layer) { layer = comp.layers.addNull(); }')
        script.append(f'layer.name = "{layer_data["nm"]}";')
        
        # Apply transforms
        transforms = layer_data['ks']
        
        # Position keyframes
        if 'p' in transforms and transforms['p']['a'] == 1:
            script.extend(self.generate_position_keyframes(transforms['p']))
        
        # Scale keyframes
        if 's' in transforms and transforms['s']['a'] == 1:
            script.extend(self.generate_scale_keyframes(transforms['s']))
        
        # Rotation keyframes
        if 'r' in transforms and transforms['r']['a'] == 1:
            script.extend(self.generate_rotation_keyframes(transforms['r']))
        
        return script
    
    def generate_expression(self, motion_pattern):
        """Generate expression from detected pattern"""
        if motion_pattern['type'] == 'oscillation':
            return f'wiggle({motion_pattern["frequency"]}, {motion_pattern["amplitude"]})'
        
        elif motion_pattern['type'] == 'bounce':
            return '''
n = 0;
if (numKeys > 0){
    n = nearestKey(time).index;
    if (key(n).time > time) n--;
}
if (n > 0){
    t = time - key(n).time;
    amp = velocityAtTime(key(n).time - 0.001);
    w = 2 * Math.PI * 2.5;
    value + amp * Math.sin(t * w) / Math.exp(t * 4);
} else value;
'''
        
        elif motion_pattern['type'] == 'loop':
            return f'loopOut("{motion_pattern["mode"]}")'
```

## 🎮 Integration with AE Claude Max

### Pipeline Integration
```python
class VideoToAEPipeline:
    def __init__(self):
        self.processor = VideoProcessor()
        self.detector = ElementDetector()
        self.analyzer = MotionAnalyzer()
        self.exporter = LottieExporter()
        self.generator = AEScriptGenerator()
    
    async def process_video(self, video_path):
        """Complete pipeline execution"""
        # 1. Extract frames
        frames = self.processor.extract_frames(video_path)
        
        # 2. Detect elements in first frame
        elements = self.detector.detect_elements(frames[0]['data'])
        
        # 3. Track elements across frames
        trajectories = []
        for element in elements['shapes']:
            trajectory = self.analyzer.track_element(element, frames)
            trajectories.append(trajectory)
        
        # 4. Extract transforms
        all_transforms = []
        for trajectory in trajectories:
            transforms = self.analyzer.extract_transforms(trajectory)
            all_transforms.append(transforms)
        
        # 5. Generate Lottie JSON
        lottie_json = self.exporter.export(elements['shapes'], all_transforms)
        
        # 6. Generate AE script
        ae_script = self.generator.generate_from_lottie(json.loads(lottie_json))
        
        return {
            'elements': len(elements['shapes']),
            'duration': frames[-1]['time'],
            'lottie': lottie_json,
            'script': ae_script
        }
```

## 📊 Performance Optimization

### GPU Acceleration
```python
# Use CUDA for OpenCV operations
if cv2.cuda.getCudaEnabledDeviceCount() > 0:
    gpu_frame = cv2.cuda_GpuMat()
    gpu_frame.upload(frame)
    # Process on GPU
    gpu_result = cv2.cuda.operation(gpu_frame)
    result = gpu_result.download()
```

### Batch Processing
```python
def process_in_batches(frames, batch_size=30):
    """Process frames in memory-efficient batches"""
    for i in range(0, len(frames), batch_size):
        batch = frames[i:i+batch_size]
        yield process_batch(batch)
```

### Caching Strategy
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def cached_detection(frame_hash):
    """Cache detection results for identical frames"""
    return detect_elements(frame_hash)
```

## 🎯 Use Cases

### 1. Template Extraction
Extract reusable animation templates from reference videos

### 2. Motion Matching
Find and replicate specific motion patterns

### 3. Style Transfer
Apply motion characteristics from one video to AE compositions

### 4. Performance Analysis
Analyze and optimize existing animations

## 📈 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Detection Accuracy | >85% | Testing |
| Tracking Stability | >90% | Testing |
| Processing Speed | <5s/sec video | Testing |
| Script Success Rate | >95% | Testing |

## 🚀 Future Enhancements

1. **3D Motion Analysis**: Depth estimation and 3D tracking
2. **AI Pattern Learning**: Neural networks for pattern recognition
3. **Real-time Processing**: Live video stream analysis
4. **Cloud Processing**: Distributed processing for large videos
5. **Mobile Integration**: iOS/Android capture apps

## 📝 Conclusion

This video motion extraction framework transforms static video analysis into dynamic, actionable After Effects automations. By combining state-of-the-art computer vision with practical AE scripting, we bridge the gap between inspiration and implementation, enabling creators to learn from and build upon existing motion graphics work.