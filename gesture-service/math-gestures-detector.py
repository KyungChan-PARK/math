"""
Math Gestures Recognition System
Implements 5 core math gestures using MediaPipe 21 keypoints
"""

import mediapipe as mp
import numpy as np
import json
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional
from enum import Enum
import time

# Math gesture types
class MathGesture(Enum):
    PINCH = "pinch"        # Scale adjustment (thumb-index distance)
    SPREAD = "spread"      # Angle adjustment (finger spread)
    GRAB = "grab"          # Shape movement (closed fist)
    POINT = "point"        # Vertex selection (index pointing)
    DRAW = "draw"          # Shape drawing (index trajectory)
    NONE = "none"          # No gesture detected

@dataclass
class GestureResult:
    """Result of gesture detection"""
    gesture: MathGesture
    confidence: float
    parameters: Dict
    timestamp: float    
class MathGestureDetector:
    """Detects mathematical gestures from hand landmarks"""
    
    def __init__(self):
        # Initialize MediaPipe
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        # Gesture thresholds
        self.PINCH_THRESHOLD = 0.08  # Max distance for pinch
        self.GRAB_THRESHOLD = 0.12   # Max avg distance for grab
        self.POINT_THRESHOLD = 0.15  # Min extension for point
        self.SPREAD_THRESHOLD = 0.25  # Min spread for spread gesture
        
        # Gesture history for smoothing
        self.gesture_history = []
        self.history_size = 5