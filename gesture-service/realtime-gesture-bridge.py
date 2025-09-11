"""
Real-time Gesture Bridge for Math Education System
Connects MediaPipe gesture detection to WebSocket server
Author: AI-in-the-Loop Team
Date: 2025-09-08
Performance Target: <50ms latency, >30 FPS
"""

import asyncio
import json
import time
import cv2
import mediapipe as mp
import numpy as np
import websockets
from dataclasses import dataclass, asdict
from typing import Optional, Dict, List, Tuple
from collections import deque
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MediaPipe setup
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

@dataclass
class GestureData:
    """Data structure for gesture information"""
    gesture: str
    confidence: float
    keypoints: List[List[float]]
    timestamp: float
    frame_id: int
    processing_time: float
    
class GestureDetector:
    """Enhanced gesture detection with 5 math gestures"""
    
    GESTURES = {
        'PINCH': 'Scale adjustment',
        'SPREAD': 'Angle adjustment',
        'GRAB': 'Object movement',
        'POINT': 'Vertex selection',
        'DRAW': 'Shape drawing'
    }
    
    def __init__(self, confidence_threshold: float = 0.8):
        self.confidence_threshold = confidence_threshold
        self.previous_gesture = None
        self.gesture_history = deque(maxlen=5)
        
    def detect_gesture(self, hand_landmarks) -> Tuple[str, float]:
        """Detect math gesture from hand landmarks"""
        if not hand_landmarks:
            return 'NONE', 0.0
            
        # Extract key points
        thumb_tip = hand_landmarks.landmark[4]
        thumb_mcp = hand_landmarks.landmark[2]
        index_tip = hand_landmarks.landmark[8]
        index_mcp = hand_landmarks.landmark[5]
        middle_tip = hand_landmarks.landmark[12]
        ring_tip = hand_landmarks.landmark[16]
        pinky_tip = hand_landmarks.landmark[20]
        wrist = hand_landmarks.landmark[0]
        
        # Calculate distances and angles
        thumb_index_dist = self._calculate_distance(thumb_tip, index_tip)
        fingers_spread = self._calculate_spread([index_tip, middle_tip, ring_tip, pinky_tip])
        index_extended = self._is_finger_extended(index_tip, index_mcp, wrist)
        fist_score = self._calculate_fist_score(hand_landmarks)
        
        # Gesture detection logic
        if thumb_index_dist < 0.05 and index_extended:
            return 'PINCH', 0.95
        elif fingers_spread > 0.3:
            return 'SPREAD', 0.92
        elif fist_score > 0.8:
            return 'GRAB', 0.90
        elif index_extended and not self._is_finger_extended(middle_tip, hand_landmarks.landmark[9], wrist):
            return 'POINT', 0.93
        elif index_extended:
            return 'DRAW', 0.88
        else:
            return 'NONE', 0.0
    
    def _calculate_distance(self, point1, point2) -> float:
        """Calculate Euclidean distance between two points"""
        return np.sqrt((point1.x - point2.x)**2 + (point1.y - point2.y)**2)
    
    def _calculate_spread(self, finger_tips) -> float:
        """Calculate finger spread metric"""
        distances = []
        for i in range(len(finger_tips) - 1):
            distances.append(self._calculate_distance(finger_tips[i], finger_tips[i+1]))
        return np.mean(distances)
    
    def _is_finger_extended(self, tip, mcp, wrist) -> bool:
        """Check if finger is extended"""
        tip_to_wrist = self._calculate_distance(tip, wrist)
        mcp_to_wrist = self._calculate_distance(mcp, wrist)
        return tip_to_wrist > mcp_to_wrist * 1.3
    
    def _calculate_fist_score(self, hand_landmarks) -> float:
        """Calculate how closed the fist is"""
        finger_tips = [4, 8, 12, 16, 20]
        palm_center = hand_landmarks.landmark[9]
        
        distances = []
        for tip_idx in finger_tips:
            tip = hand_landmarks.landmark[tip_idx]
            distances.append(self._calculate_distance(tip, palm_center))
        
        avg_distance = np.mean(distances)
        return 1.0 - min(avg_distance * 3, 1.0)

class RealtimeGestureBridge:
    """Bridge between MediaPipe and WebSocket server"""
    
    def __init__(self, websocket_url: str = "ws://localhost:9001"):
        self.websocket_url = websocket_url
        self.detector = GestureDetector()
        self.frame_count = 0
        self.fps_counter = deque(maxlen=30)
        self.websocket = None
        self.running = False
        
        # Performance metrics
        self.metrics = {
            'total_frames': 0,
            'sent_messages': 0,
            'avg_latency': 0,
            'avg_fps': 0
        }
    
    async def connect_websocket(self):
        """Establish WebSocket connection with retry logic"""
        max_retries = 5
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Connecting to WebSocket server at {self.websocket_url}...")
                self.websocket = await websockets.connect(self.websocket_url)
                logger.info("WebSocket connection established!")
                return True
            except Exception as e:
                logger.error(f"Connection attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 2
        
        return False
    
    async def send_gesture_data(self, gesture_data: GestureData):
        """Send gesture data to WebSocket server"""
        if not self.websocket:
            return
        
        try:
            message = json.dumps(asdict(gesture_data))
            await self.websocket.send(message)
            self.metrics['sent_messages'] += 1
        except Exception as e:
            logger.error(f"Failed to send data: {e}")
            # Try to reconnect
            await self.connect_websocket()
    
    async def process_frame(self, frame, hands_processor):
        """Process a single frame and detect gestures"""
        start_time = time.time()
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands_processor.process(rgb_frame)
        
        gesture = 'NONE'
        confidence = 0.0
        keypoints = []
        
        if results.multi_hand_landmarks:
            hand_landmarks = results.multi_hand_landmarks[0]
            
            # Extract keypoints
            keypoints = [[lm.x, lm.y, lm.z] for lm in hand_landmarks.landmark]
            
            # Detect gesture
            gesture, confidence = self.detector.detect_gesture(hand_landmarks)
            
            # Draw landmarks on frame
            mp_drawing.draw_landmarks(
                frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
        
        processing_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Only send if gesture changed or confidence is high
        if gesture != 'NONE' and (gesture != self.detector.previous_gesture or confidence > 0.9):
            gesture_data = GestureData(
                gesture=gesture,
                confidence=confidence,
                keypoints=keypoints,
                timestamp=time.time(),
                frame_id=self.frame_count,
                processing_time=processing_time
            )
            
            await self.send_gesture_data(gesture_data)
            self.detector.previous_gesture = gesture
        
        # Update metrics
        self.frame_count += 1
        self.metrics['total_frames'] += 1
        self.fps_counter.append(time.time())
        
        if len(self.fps_counter) > 1:
            self.metrics['avg_fps'] = len(self.fps_counter) / (self.fps_counter[-1] - self.fps_counter[0])
        
        return frame, gesture, confidence, processing_time

    async def run(self):
        """Main execution loop"""
        logger.info("Starting Real-time Gesture Bridge...")
        
        # Connect to WebSocket
        if not await self.connect_websocket():
            logger.error("Failed to establish WebSocket connection")
            return
        
        # Initialize MediaPipe
        hands = mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        # Open camera
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_FPS, 30)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        self.running = True
        
        try:
            while self.running:
                ret, frame = cap.read()
                if not ret:
                    logger.error("Failed to read frame from camera")
                    break
                
                # Process frame
                processed_frame, gesture, confidence, latency = await self.process_frame(frame, hands)
                
                # Display info on frame
                self._draw_info(processed_frame, gesture, confidence, latency)
                
                # Show frame
                cv2.imshow('Math Gesture Detection - Real-time', processed_frame)
                
                # Check for exit
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                
                # Log performance every 100 frames
                if self.frame_count % 100 == 0:
                    self._log_performance()
        
        except KeyboardInterrupt:
            logger.info("Interrupted by user")
        finally:
            # Cleanup
            cap.release()
            cv2.destroyAllWindows()
            hands.close()
            if self.websocket:
                await self.websocket.close()
            
            logger.info("Bridge stopped")
            self._log_final_metrics()
    
    def _draw_info(self, frame, gesture, confidence, latency):
        """Draw information overlay on frame"""
        h, w = frame.shape[:2]
        
        # Background for text
        cv2.rectangle(frame, (0, 0), (w, 80), (0, 0, 0), -1)
        
        # Gesture info
        cv2.putText(frame, f"Gesture: {gesture}", (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(frame, f"Confidence: {confidence:.2f}", (10, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 1)
        
        # Performance info
        fps_text = f"FPS: {self.metrics['avg_fps']:.1f}"
        latency_text = f"Latency: {latency:.1f}ms"
        
        cv2.putText(frame, fps_text, (w - 150, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1)
        cv2.putText(frame, latency_text, (w - 150, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1)
        
        # Gesture indicator
        if gesture != 'NONE':
            color = (0, 255, 0) if confidence > 0.9 else (0, 165, 255)
            cv2.circle(frame, (w - 30, 40), 15, color, -1)
    
    def _log_performance(self):
        """Log performance metrics"""
        logger.info(f"Performance - FPS: {self.metrics['avg_fps']:.1f}, "
                   f"Frames: {self.metrics['total_frames']}, "
                   f"Messages: {self.metrics['sent_messages']}")
    
    def _log_final_metrics(self):
        """Log final metrics on shutdown"""
        logger.info("=== Final Metrics ===")
        logger.info(f"Total frames processed: {self.metrics['total_frames']}")
        logger.info(f"Total messages sent: {self.metrics['sent_messages']}")
        logger.info(f"Average FPS: {self.metrics['avg_fps']:.1f}")
        logger.info(f"Message rate: {self.metrics['sent_messages']/max(self.metrics['total_frames'], 1)*100:.1f}%")

def main():
    """Main entry point"""
    bridge = RealtimeGestureBridge()
    asyncio.run(bridge.run())

if __name__ == "__main__":
    main()
