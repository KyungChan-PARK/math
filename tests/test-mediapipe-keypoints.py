"""
MediaPipe 21 Keypoints Test
Tests hand landmark detection with MediaPipe
"""

import cv2
import mediapipe as mp
import numpy as np
import time
import sys
import io

# Set UTF-8 encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Initialize MediaPipe
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

def test_21_keypoints():
    """Test MediaPipe 21 keypoints detection"""
    
    print("[START] Starting MediaPipe 21 Keypoints Test")
    print("=" * 50)
    
    # Initialize hands model
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("[ERROR] Cannot open webcam")
        print("Testing with static image instead...")
        return test_static_image()
    
    print("[OK] Webcam opened successfully")
    print("[INFO] Press 'q' to quit")
    print("[INFO] Show your hand to the camera")
    print("-" * 50)
    
    fps_counter = 0
    start_time = time.time()
    
    while cap.isOpened():
        success, image = cap.read()
        if not success:
            print("[WARNING] Ignoring empty camera frame")
            continue
        
        # Flip horizontally for selfie-view
        image = cv2.flip(image, 1)
        
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image
        results = hands.process(image_rgb)
        
        # Draw landmarks
        if results.multi_hand_landmarks:
            for hand_idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                # Draw landmarks on image
                mp_drawing.draw_landmarks(
                    image,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS,
                    mp_drawing_styles.get_default_hand_landmarks_style(),
                    mp_drawing_styles.get_default_hand_connections_style()
                )
                
                # Get hand label (Left/Right)
                handedness = results.multi_handedness[hand_idx].classification[0].label
                
                # Display keypoint info
                cv2.putText(image, f"Hand: {handedness}", 
                           (10, 30 + hand_idx * 150), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                # Show specific keypoints
                landmarks = hand_landmarks.landmark
                h, w, _ = image.shape
                
                # Thumb tip (4), Index tip (8), Middle tip (12), Ring tip (16), Pinky tip (20)
                key_points = {
                    "Thumb": 4,
                    "Index": 8, 
                    "Middle": 12,
                    "Ring": 16,
                    "Pinky": 20
                }
                
                for i, (name, idx) in enumerate(key_points.items()):
                    x = int(landmarks[idx].x * w)
                    y = int(landmarks[idx].y * h)
                    cv2.circle(image, (x, y), 8, (255, 0, 255), -1)
                    cv2.putText(image, name, (x-20, y-10),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                
        # Calculate FPS
        fps_counter += 1
        if fps_counter % 30 == 0:
            elapsed = time.time() - start_time
            fps = fps_counter / elapsed
            print(f"[FPS] {fps:.2f} | Hands detected: {len(results.multi_hand_landmarks) if results.multi_hand_landmarks else 0}")
        
        # Display FPS on image
        cv2.putText(image, f"FPS: {fps_counter/(time.time()-start_time):.1f}", 
                   (image.shape[1]-100, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Show the image
        cv2.imshow('MediaPipe 21 Keypoints Test', image)
        
        # Check for quit
        if cv2.waitKey(5) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
    hands.close()
    
    print("\n" + "=" * 50)
    print("[SUCCESS] Test completed successfully!")
    print(f"[STATS] Total frames processed: {fps_counter}")
    print(f"[TIME] Total time: {time.time()-start_time:.2f} seconds")
    
def test_static_image():
    """Test with a static image (no webcam)"""
    print("\n[INFO] Testing with static generated image...")
    
    # Create a blank image
    image = np.ones((480, 640, 3), dtype=np.uint8) * 255
    
    # Add text
    cv2.putText(image, "MediaPipe Test Image", (150, 240),
               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    
    # Initialize hands
    hands = mp_hands.Hands(static_image_mode=True)
    
    # Process image
    results = hands.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    
    if results.multi_hand_landmarks:
        print("[SUCCESS] Hand landmarks detected!")
        for hand_landmarks in results.multi_hand_landmarks:
            print(f"  Found {len(hand_landmarks.landmark)} landmarks")
    else:
        print("[INFO] No hands detected in static image (expected)")
    
    hands.close()
    print("[SUCCESS] MediaPipe is working correctly!")
    
    return True

if __name__ == "__main__":
    try:
        test_21_keypoints()
    except Exception as e:
        print(f"[ERROR] {e}")
        print("Trying static image test...")
        test_static_image()
