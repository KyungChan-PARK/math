"""
Performance Optimized Gesture Bridge
Implements frame buffering, gesture prediction, and caching
"""

import asyncio
import json
import time
import cv2
import mediapipe as mp
import numpy as np
import websockets
from dataclasses import dataclass, asdict
from typing import Optional, Dict, List, Tuple, Deque
from collections import deque
import logging
from concurrent.futures import ThreadPoolExecutor
import threading

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class OptimizedGestureData:
    """Optimized gesture data with prediction"""
    gesture: str
    confidence: float
    keypoints: List[List[float]]
    timestamp: float
    frame_id: int
    processing_time: float
    predicted_next: Optional[str] = None
    velocity: Optional[List[float]] = None

class GesturePredictor:
    """Predicts next gesture based on motion patterns"""
    
    def __init__(self, history_size: int = 10):
        self.history = deque(maxlen=history_size)
        self.gesture_transitions = {
            'PINCH': ['SPREAD', 'GRAB'],
            'SPREAD': ['PINCH', 'DRAW'],
            'GRAB': ['POINT', 'PINCH'],
            'POINT': ['DRAW', 'GRAB'],
            'DRAW': ['POINT', 'SPREAD']
        }
    
    def predict_next(self, current_gesture: str, keypoints: List[List[float]]) -> str:
        """Predict next likely gesture based on patterns"""
        if len(self.history) < 2:
            return 'NONE'
        
        # Calculate velocity vectors
        if self.history[-1] and keypoints:
            prev_keypoints = self.history[-1]['keypoints']
            velocities = []
            for i in range(min(len(keypoints), len(prev_keypoints))):
                vel = [
                    keypoints[i][0] - prev_keypoints[i][0],
                    keypoints[i][1] - prev_keypoints[i][1]
                ]
                velocities.append(np.linalg.norm(vel))
            
            avg_velocity = np.mean(velocities)
            
            # High velocity suggests transition
            if avg_velocity > 0.02:
                transitions = self.gesture_transitions.get(current_gesture, [])
                if transitions:
                    return transitions[0]
        
        return current_gesture
    
    def add_frame(self, gesture: str, keypoints: List[List[float]]):
        """Add frame to history"""
        self.history.append({
            'gesture': gesture,
            'keypoints': keypoints,
            'timestamp': time.time()
        })

class OptimizedGestureDetector:
    """Enhanced detector with caching and optimization"""
    
    def __init__(self):
        self.cache = {}
        self.predictor = GesturePredictor()
        self.frame_buffer = deque(maxlen=3)
        self.executor = ThreadPoolExecutor(max_workers=2)
    
    def detect_with_optimization(self, hand_landmarks) -> Tuple[str, float, str]:
        """Detect gesture with caching and prediction"""
        if not hand_landmarks:
            return 'NONE', 0.0, 'NONE'
        
        # Create cache key from landmarks
        cache_key = self._create_cache_key(hand_landmarks)
        
        # Check cache
        if cache_key in self.cache:
            cached = self.cache[cache_key]
            if time.time() - cached['timestamp'] < 0.1:  # 100ms cache
                return cached['gesture'], cached['confidence'], cached['predicted']
        
        # Detect gesture
        gesture, confidence = self._detect_gesture(hand_landmarks)
        
        # Get keypoints
        keypoints = [[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark]
        
        # Predict next gesture
        predicted = self.predictor.predict_next(gesture, keypoints)
        self.predictor.add_frame(gesture, keypoints)
        
        # Cache result
        self.cache[cache_key] = {
            'gesture': gesture,
            'confidence': confidence,
            'predicted': predicted,
            'timestamp': time.time()
        }
        
        # Clean old cache entries
        if len(self.cache) > 100:
            self._clean_cache()
        
        return gesture, confidence, predicted
    
    def _create_cache_key(self, landmarks) -> str:
        """Create hash key from landmarks for caching"""
        key_points = [landmarks.landmark[i] for i in [0, 4, 8, 12, 16, 20]]
        key_str = ''.join([f"{p.x:.2f}{p.y:.2f}" for p in key_points])
        return hash(key_str)
    
    def _clean_cache(self):
        """Remove old cache entries"""
        current_time = time.time()
        self.cache = {k: v for k, v in self.cache.items() 
                     if current_time - v['timestamp'] < 1.0}
    
    def _detect_gesture(self, hand_landmarks) -> Tuple[str, float]:
        """Core gesture detection logic"""
        # Extract key points
        thumb_tip = hand_landmarks.landmark[4]
        index_tip = hand_landmarks.landmark[8]
        
        # Fast distance calculation
        thumb_index_dist = abs(thumb_tip.x - index_tip.x) + abs(thumb_tip.y - index_tip.y)
        
        if thumb_index_dist < 0.05:
            return 'PINCH', 0.95
        
        # Add more gesture detection logic here
        return 'NONE', 0.0

class OptimizedRealtimeBridge:
    """Optimized bridge with frame buffering and parallel processing"""
    
    def __init__(self, websocket_url: str = "ws://localhost:9001"):
        self.websocket_url = websocket_url
        self.detector = OptimizedGestureDetector()
        self.frame_queue = asyncio.Queue(maxsize=5)
        self.result_queue = asyncio.Queue(maxsize=10)
        self.running = False
        self.websocket = None
        
        # Performance tracking
        self.metrics = {
            'frames_processed': 0,
            'frames_skipped': 0,
            'avg_latency': 0,
            'cache_hits': 0
        }
    
    async def process_frames_parallel(self):
        """Process frames in parallel"""
        while self.running:
            try:
                frame = await asyncio.wait_for(self.frame_queue.get(), timeout=0.1)
                
                # Process in thread pool
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    self.detector.executor,
                    self._process_frame_sync,
                    frame
                )
                
                if result:
                    await self.result_queue.put(result)
                    
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Frame processing error: {e}")
    
    def _process_frame_sync(self, frame):
        """Synchronous frame processing for thread pool"""
        # MediaPipe processing here
        return {
            'gesture': 'PINCH',  # Placeholder
            'confidence': 0.95,
            'timestamp': time.time()
        }
    
    async def run_optimized(self):
        """Run with optimizations"""
        logger.info("Starting Optimized Gesture Bridge...")
        
        # Start parallel processing
        asyncio.create_task(self.process_frames_parallel())
        
        # Start WebSocket sender
        asyncio.create_task(self.send_results())
        
        # Main camera loop with frame skipping
        await self.capture_with_frame_skip()
    
    async def capture_with_frame_skip(self):
        """Capture with intelligent frame skipping"""
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Reduce buffer
        
        frame_count = 0
        skip_frames = 2  # Process every 3rd frame
        
        try:
            while self.running:
                ret, frame = cap.read()
                if not ret:
                    continue
                
                frame_count += 1
                
                # Skip frames for performance
                if frame_count % (skip_frames + 1) != 0:
                    self.metrics['frames_skipped'] += 1
                    continue
                
                # Add to queue if not full
                if not self.frame_queue.full():
                    await self.frame_queue.put(frame)
                    self.metrics['frames_processed'] += 1
                
                # Show performance stats
                if frame_count % 100 == 0:
                    self._log_performance()
                
        finally:
            cap.release()
    
    async def send_results(self):
        """Send results via WebSocket"""
        while self.running:
            try:
                result = await asyncio.wait_for(self.result_queue.get(), timeout=0.1)
                if self.websocket:
                    await self.websocket.send(json.dumps(result))
            except asyncio.TimeoutError:
                continue
    
    def _log_performance(self):
        """Log performance metrics"""
        total = self.metrics['frames_processed'] + self.metrics['frames_skipped']
        if total > 0:
            skip_rate = self.metrics['frames_skipped'] / total * 100
            logger.info(f"Performance - Processed: {self.metrics['frames_processed']}, "
                       f"Skip rate: {skip_rate:.1f}%, "
                       f"Cache hits: {self.metrics['cache_hits']}")

def main():
    """Main entry point for optimized bridge"""
    bridge = OptimizedRealtimeBridge()
    asyncio.run(bridge.run_optimized())

if __name__ == "__main__":
    main()
