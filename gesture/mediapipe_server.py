#!/usr/bin/env python3
"""
MediaPipe Hand Gesture Recognition Server for Math Education
Port: 5000
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import mediapipe as mp
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import json
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Initialize MediaPipe
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

# Math gesture definitions
MATH_GESTURES = {
    "PINCH": {"description": "[KR] [KR]", "threshold": 0.05},
    "SPREAD": {"description": "[KR] [KR]", "threshold": 0.15},
    "GRAB": {"description": "[KR] [KR]", "threshold": 0.08},
    "POINT": {"description": "[KR] [KR]", "threshold": 0.1},
    "DRAW": {"description": "[KR] [KR]", "threshold": 0.12}
}

class GestureRecognizer:
    def __init__(self):
        self.gesture_history = []
        self.last_gesture_time = 0
        
    def calculate_distance(self, point1, point2):
        """Calculate Euclidean distance between two points"""
        return np.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)
    
    def detect_pinch(self, landmarks):
        """Detect pinch gesture (thumb-index distance)"""
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        distance = self.calculate_distance(thumb_tip, index_tip)
        return distance < MATH_GESTURES["PINCH"]["threshold"], distance
    
    def detect_spread(self, landmarks):
        """Detect spread gesture (finger spread)"""
        # Calculate average distance between fingers
        distances = []
        finger_tips = [4, 8, 12, 16, 20]  # Thumb, Index, Middle, Ring, Pinky
        
        for i in range(len(finger_tips) - 1):
            dist = self.calculate_distance(
                landmarks[finger_tips[i]], 
                landmarks[finger_tips[i + 1]]
            )
            distances.append(dist)
        
        avg_distance = np.mean(distances)
        return avg_distance > MATH_GESTURES["SPREAD"]["threshold"], avg_distance
    
    def detect_grab(self, landmarks):
        """Detect grab gesture (closed fist)"""
        # Check if all fingertips are close to palm
        palm_center = landmarks[0]
        finger_tips = [8, 12, 16, 20]  # Exclude thumb
        
        distances = [self.calculate_distance(landmarks[tip], palm_center) for tip in finger_tips]
        avg_distance = np.mean(distances)
        
        return avg_distance < MATH_GESTURES["GRAB"]["threshold"], avg_distance
    
    def detect_point(self, landmarks):
        """Detect pointing gesture (index extended)"""
        index_tip = landmarks[8]
        index_mcp = landmarks[5]
        
        # Check if index is extended
        index_extended = landmarks[8][1] < landmarks[6][1]  # Y coordinate comparison
        
        # Check if other fingers are folded
        other_folded = all([
            landmarks[12][1] > landmarks[10][1],  # Middle
            landmarks[16][1] > landmarks[14][1],  # Ring
            landmarks[20][1] > landmarks[18][1]   # Pinky
        ])
        
        return index_extended and other_folded, 1.0 if (index_extended and other_folded) else 0.0
    
    def recognize_gesture(self, landmarks):
        """Main gesture recognition logic"""
        results = {}
        
        # Convert landmarks to array
        landmark_array = [(lm.x, lm.y, lm.z) for lm in landmarks.landmark]
        
        # Check each gesture
        is_pinch, pinch_score = self.detect_pinch(landmark_array)
        is_spread, spread_score = self.detect_spread(landmark_array)
        is_grab, grab_score = self.detect_grab(landmark_array)
        is_point, point_score = self.detect_point(landmark_array)
        
        # Determine primary gesture
        if is_pinch:
            results["gesture"] = "PINCH"
            results["confidence"] = 1 - (pinch_score / MATH_GESTURES["PINCH"]["threshold"])
        elif is_spread:
            results["gesture"] = "SPREAD"
            results["confidence"] = spread_score / MATH_GESTURES["SPREAD"]["threshold"]
        elif is_grab:
            results["gesture"] = "GRAB"
            results["confidence"] = 1 - (grab_score / MATH_GESTURES["GRAB"]["threshold"])
        elif is_point:
            results["gesture"] = "POINT"
            results["confidence"] = point_score
        else:
            results["gesture"] = "DRAW"
            results["confidence"] = 0.8
        
        # Add metadata
        results["landmarks"] = landmark_array
        results["timestamp"] = time.time()
        
        return results

gesture_recognizer = GestureRecognizer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "MediaPipe Gesture Server",
        "port": 5000,
        "gestures": list(MATH_GESTURES.keys())
    })

@app.route('/recognize', methods=['POST'])
def recognize():
    """Main gesture recognition endpoint"""
    try:
        data = request.json
        
        # Decode base64 image
        image_data = base64.b64decode(data['image'])
        image = Image.open(BytesIO(image_data))
        image_np = np.array(image)
        
        # Convert BGR to RGB if needed
        if len(image_np.shape) == 3 and image_np.shape[2] == 4:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_RGBA2RGB)
        elif len(image_np.shape) == 3 and image_np.shape[2] == 3:
            image_np = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = hands.process(image_np)
        
        if results.multi_hand_landmarks:
            # Process first hand
            hand_landmarks = results.multi_hand_landmarks[0]
            gesture_result = gesture_recognizer.recognize_gesture(hand_landmarks)
            
            return jsonify({
                "success": True,
                "gesture": gesture_result["gesture"],
                "confidence": gesture_result["confidence"],
                "description": MATH_GESTURES[gesture_result["gesture"]]["description"],
                "timestamp": gesture_result["timestamp"]
            })
        else:
            return jsonify({
                "success": False,
                "error": "No hands detected"
            })
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/stream', methods=['POST'])
def stream():
    """Stream processing for real-time gesture recognition"""
    try:
        data = request.json
        frame_data = base64.b64decode(data['frame'])
        
        # Quick processing for streaming
        image = Image.open(BytesIO(frame_data))
        image_np = np.array(image)
        
        # Process
        results = hands.process(cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB))
        
        if results.multi_hand_landmarks:
            gesture_result = gesture_recognizer.recognize_gesture(results.multi_hand_landmarks[0])
            
            return jsonify({
                "gesture": gesture_result["gesture"],
                "confidence": gesture_result["confidence"]
            })
        
        return jsonify({"gesture": "NONE", "confidence": 0})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("MediaPipe Gesture Server starting on port 5000...")
    print("Math gestures ready: PINCH, SPREAD, GRAB, POINT, DRAW")
    app.run(host='0.0.0.0', port=5000, debug=False)
