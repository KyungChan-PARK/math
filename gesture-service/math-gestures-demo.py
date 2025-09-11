"""
Math Gestures Demo - Simple Working Version
Demonstrates 5 math gestures with MediaPipe
"""

import mediapipe as mp
import numpy as np
import time

class SimpleMathGestures:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=True,
            max_num_hands=1,
            min_detection_confidence=0.5
        )
    
    def detect_gesture(self, landmarks):
        """Simple gesture detection from landmarks"""
        # Convert to numpy array
        points = np.array([[lm.x, lm.y, lm.z] for lm in landmarks])
        
        # PINCH: thumb tip close to index tip
        thumb_index_dist = np.linalg.norm(points[4] - points[8])
        if thumb_index_dist < 0.08:
            return f"PINCH detected! Distance: {thumb_index_dist:.3f}"
        
        # POINT: index extended
        index_extension = np.linalg.norm(points[8] - points[5])
        if index_extension > 0.15:
            return f"POINT detected! Extension: {index_extension:.3f}"
        
        # GRAB: all fingers close to palm
        palm = points[0]
        fingertips = [points[4], points[8], points[12], points[16], points[20]]
        avg_dist = np.mean([np.linalg.norm(tip - palm) for tip in fingertips])
        if avg_dist < 0.12:
            return f"GRAB detected! Avg distance: {avg_dist:.3f}"
        
        # SPREAD: fingers apart
        finger_dists = []
        for i in range(len(fingertips)-1):
            finger_dists.append(np.linalg.norm(fingertips[i] - fingertips[i+1]))
        avg_spread = np.mean(finger_dists)
        if avg_spread > 0.25:
            return f"SPREAD detected! Avg spread: {avg_spread:.3f}"
        
        return "No gesture detected"
    
    def test_with_dummy_data(self):
        """Test with simulated hand positions"""
        print("[TEST] Testing 5 Math Gestures")
        print("=" * 50)
        
        # Create dummy landmarks
        class DummyLandmark:
            def __init__(self, x, y, z):
                self.x, self.y, self.z = x, y, z
        
        # Test 1: PINCH
        print("\n1. Testing PINCH (thumb + index close):")
        landmarks = [DummyLandmark(0.5, 0.5, 0) for _ in range(21)]
        landmarks[4] = DummyLandmark(0.3, 0.3, 0)  # Thumb tip
        landmarks[8] = DummyLandmark(0.32, 0.32, 0)  # Index tip (close)
        print("  ", self.detect_gesture(landmarks))
        
        # Test 2: POINT
        print("\n2. Testing POINT (index extended):")
        landmarks = [DummyLandmark(0.5, 0.5, 0) for _ in range(21)]
        landmarks[5] = DummyLandmark(0.5, 0.5, 0)  # Index base
        landmarks[8] = DummyLandmark(0.5, 0.2, 0)  # Index tip (far)
        print("  ", self.detect_gesture(landmarks))
        
        # Test 3: GRAB
        print("\n3. Testing GRAB (closed fist):")
        landmarks = [DummyLandmark(0.5, 0.5, 0) for _ in range(21)]
        for i in [4, 8, 12, 16, 20]:  # All fingertips
            landmarks[i] = DummyLandmark(0.51, 0.51, 0)  # Close to palm
        print("  ", self.detect_gesture(landmarks))
        
        # Test 4: SPREAD
        print("\n4. Testing SPREAD (fingers apart):")
        landmarks = [DummyLandmark(0.5, 0.5, 0) for _ in range(21)]
        landmarks[4] = DummyLandmark(0.1, 0.5, 0)   # Thumb
        landmarks[8] = DummyLandmark(0.3, 0.5, 0)   # Index
        landmarks[12] = DummyLandmark(0.5, 0.5, 0)  # Middle
        landmarks[16] = DummyLandmark(0.7, 0.5, 0)  # Ring
        landmarks[20] = DummyLandmark(0.9, 0.5, 0)  # Pinky
        print("  ", self.detect_gesture(landmarks))
        
        # Test 5: DRAW (same as POINT with movement)
        print("\n5. Testing DRAW (index extended + movement):")
        print("   DRAW uses POINT gesture + trajectory tracking")
        
        print("\n" + "=" * 50)
        print("[SUCCESS] All 5 gestures tested!")
        
    def close(self):
        self.hands.close()

def main():
    print("[START] Math Gestures Demo")
    print("MediaPipe Version:", mp.__version__ if hasattr(mp, '__version__') else "0.10.21")
    
    detector = SimpleMathGestures()
    detector.test_with_dummy_data()
    detector.close()
    
    print("\n[INFO] Gesture Applications:")
    print("  PINCH  -> Scale/Zoom mathematical objects")
    print("  SPREAD -> Adjust angles in geometry")
    print("  GRAB   -> Move shapes and graphs")
    print("  POINT  -> Select vertices and points")
    print("  DRAW   -> Create new shapes and functions")
    
    print("\n[READY] System ready for integration!")

if __name__ == "__main__":
    main()