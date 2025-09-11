"""
MediaPipe 21 Keypoints Test - Simple Version
Tests hand landmark detection without webcam
"""

import mediapipe as mp
import numpy as np

def test_mediapipe_import():
    """Test if MediaPipe is properly installed"""
    print("[START] Testing MediaPipe Installation")
    print("=" * 50)
    
    try:
        # Test import
        print("[TEST] Importing MediaPipe modules...")
        mp_hands = mp.solutions.hands
        mp_drawing = mp.solutions.drawing_utils
        print("[OK] MediaPipe modules imported successfully")
        
        # Test hand model initialization
        print("[TEST] Initializing hand detection model...")
        hands = mp_hands.Hands(
            static_image_mode=True,
            max_num_hands=2,
            min_detection_confidence=0.5
        )
        print("[OK] Hand model initialized")
        
        # List all 21 keypoints
        print("\n[INFO] MediaPipe Hand Landmarks (21 keypoints):")
        print("-" * 50)
        landmarks_list = [
            "WRIST",
            "THUMB_CMC", "THUMB_MCP", "THUMB_IP", "THUMB_TIP",
            "INDEX_FINGER_MCP", "INDEX_FINGER_PIP", "INDEX_FINGER_DIP", "INDEX_FINGER_TIP",
            "MIDDLE_FINGER_MCP", "MIDDLE_FINGER_PIP", "MIDDLE_FINGER_DIP", "MIDDLE_FINGER_TIP",
            "RING_FINGER_MCP", "RING_FINGER_PIP", "RING_FINGER_DIP", "RING_FINGER_TIP",
            "PINKY_MCP", "PINKY_PIP", "PINKY_DIP", "PINKY_TIP"
        ]
        
        for i, landmark in enumerate(landmarks_list):
            print(f"  {i:2d}: {landmark}")
        
        # Test with dummy data
        print("\n[TEST] Processing dummy image...")
        dummy_image = np.zeros((480, 640, 3), dtype=np.uint8)
        results = hands.process(dummy_image)
        print("[OK] Image processing successful")
        
        # Clean up
        hands.close()
        
        print("\n" + "=" * 50)
        print("[SUCCESS] MediaPipe is properly installed and working!")
        print("[INFO] Version:", mp.__version__ if hasattr(mp, '__version__') else "Unknown")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return False

if __name__ == "__main__":
    test_mediapipe_import()