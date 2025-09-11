"""
Alternative Gesture Controller for Python 3.13+
Uses OpenCV and numpy instead of MediaPipe
"""
import cv2
import numpy as np
import json
import time
from collections import deque
import threading
import socket

class SimpleGestureController:
    def __init__(self):
        self.gestures = deque(maxlen=10)
        self.last_position = None
        self.velocity = [0, 0]
        self.is_running = True
        
    def detect_touch_gesture(self, x, y, event_type):
        """Simplified gesture detection without MediaPipe"""
        gesture = {
            'type': 'unknown',
            'confidence': 0.8,
            'position': [x, y],
            'timestamp': time.time()
        }
        
        if event_type == 'touch_start':
            gesture['type'] = 'TAP'
            gesture['confidence'] = 0.95
            
        elif event_type == 'touch_move':
            if self.last_position:
                dx = x - self.last_position[0]
                dy = y - self.last_position[1]
                
                # Calculate velocity
                self.velocity = [dx, dy]
                
                # Detect gesture based on movement
                if abs(dx) > abs(dy):
                    gesture['type'] = 'SWIPE_HORIZONTAL'
                else:
                    gesture['type'] = 'SWIPE_VERTICAL'
                    
                gesture['velocity'] = self.velocity
                
        elif event_type == 'touch_end':
            gesture['type'] = 'RELEASE'
            
        self.last_position = [x, y] if event_type != 'touch_end' else None
        self.gestures.append(gesture)
        
        return gesture
    
    def detect_multitouch_gesture(self, touches):
        """Detect pinch, spread, and rotate from multiple touch points"""
        if len(touches) < 2:
            return None
            
        # Calculate distance between first two touches
        p1 = touches[0]
        p2 = touches[1]
        
        distance = np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
        
        gesture = {
            'type': 'MULTITOUCH',
            'confidence': 0.85,
            'distance': distance,
            'center': [(p1[0] + p2[0])/2, (p1[1] + p2[1])/2],
            'timestamp': time.time()
        }
        
        # Compare with previous distance to detect pinch/spread
        if hasattr(self, 'last_distance'):
            if distance > self.last_distance * 1.1:
                gesture['type'] = 'SPREAD'
            elif distance < self.last_distance * 0.9:
                gesture['type'] = 'PINCH'
            else:
                gesture['type'] = 'ROTATE'
                
        self.last_distance = distance
        return gesture
    
    def get_gesture_history(self):
        """Return recent gesture history"""
        return list(self.gestures)
    
    def start_server(self, port=8081):
        """Start a simple socket server for gesture data"""
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.bind(('localhost', port))
        server.listen(5)
        
        print(f"[Gesture Controller] Server started on port {port}")
        
        while self.is_running:
            try:
                client, addr = server.accept()
                data = client.recv(1024).decode()
                
                if data:
                    # Parse touch data
                    touch_data = json.loads(data)
                    
                    # Process gesture
                    if touch_data.get('type') == 'multitouch':
                        gesture = self.detect_multitouch_gesture(touch_data['touches'])
                    else:
                        gesture = self.detect_touch_gesture(
                            touch_data.get('x', 0),
                            touch_data.get('y', 0),
                            touch_data.get('event_type', 'unknown')
                        )
                    
                    # Send response
                    response = json.dumps(gesture)
                    client.send(response.encode())
                    
                client.close()
                
            except Exception as e:
                print(f"[Gesture Controller] Error: {e}")
                
    def stop(self):
        """Stop the gesture controller"""
        self.is_running = False

# Alternative using OpenCV for camera-based gesture (if available)
class CameraGestureDetector:
    def __init__(self):
        self.cap = None
        self.hand_cascade = None
        
    def initialize_camera(self):
        """Try to initialize camera for gesture detection"""
        try:
            self.cap = cv2.VideoCapture(0)
            # Use Haar Cascade for basic hand detection as MediaPipe alternative
            # This would need a cascade file, using placeholder for now
            print("[Camera] Initialized for basic gesture detection")
            return True
        except:
            print("[Camera] Not available, using touch-only mode")
            return False
            
    def detect_hand_gesture(self, frame):
        """Basic hand detection without MediaPipe"""
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Simple skin color detection as alternative
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Define skin color range in HSV
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        
        # Create mask for skin color
        mask = cv2.inRange(hsv, lower_skin, upper_skin)
        
        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Find largest contour (assumed to be hand)
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Get bounding box
            x, y, w, h = cv2.boundingRect(largest_contour)
            
            gesture = {
                'type': 'HAND_DETECTED',
                'position': [x + w//2, y + h//2],
                'size': [w, h],
                'confidence': 0.7
            }
            
            return gesture
            
        return None
        
    def cleanup(self):
        """Release camera resources"""
        if self.cap:
            self.cap.release()
        cv2.destroyAllWindows()

def main():
    """Main function to run gesture controller"""
    print("=" * 60)
    print("  Alternative Gesture Controller for Python 3.13+")
    print("  (MediaPipe-free implementation)")
    print("=" * 60)
    
    # Create gesture controller
    controller = SimpleGestureController()
    
    # Try to initialize camera (optional)
    camera = CameraGestureDetector()
    has_camera = camera.initialize_camera()
    
    if has_camera:
        print("[INFO] Camera gesture detection available")
    else:
        print("[INFO] Using touch-only gesture detection")
    
    # Start server in separate thread
    server_thread = threading.Thread(target=controller.start_server)
    server_thread.daemon = True
    server_thread.start()
    
    print("[INFO] Gesture controller ready!")
    print("[INFO] Listening for touch events on port 8081")
    print("[INFO] Press Ctrl+C to stop")
    
    try:
        while True:
            if has_camera and camera.cap:
                ret, frame = camera.cap.read()
                if ret:
                    gesture = camera.detect_hand_gesture(frame)
                    if gesture:
                        controller.gestures.append(gesture)
                        
            time.sleep(0.016)  # ~60 FPS
            
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down...")
        controller.stop()
        if has_camera:
            camera.cleanup()
        print("[INFO] Gesture controller stopped")

if __name__ == "__main__":
    main()