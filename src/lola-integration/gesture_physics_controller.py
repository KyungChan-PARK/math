"""
Gesture Physics Controller for Math Learning Platform
Handles touch and gesture input
"""
import json
import time
import socket
import threading
import sys

# Try to import MediaPipe
try:
    import mediapipe as mp
    mp_hands = mp.solutions.hands
    MEDIAPIPE_AVAILABLE = True
    print('[Gesture] MediaPipe loaded successfully')
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    print('[Gesture] MediaPipe not available, using touch-only mode')

class GestureController:
    def __init__(self):
        self.running = True
        self.gestures = []
        
        if MEDIAPIPE_AVAILABLE:
            self.hands = mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            print('[Gesture] MediaPipe hands initialized')
        else:
            self.hands = None
            print('[Gesture] Running in touch-only mode')
        
    def process_gesture(self, data):
        """Process touch or gesture data"""
        gesture = {
            'type': data.get('type', 'unknown'),
            'position': data.get('position', [0, 0]),
            'confidence': 0.9,
            'timestamp': time.time()
        }
        
        # Map touch events to gestures
        event_type = data.get('event_type', '')
        if event_type == 'touchstart':
            gesture['type'] = 'TAP'
        elif event_type == 'touchmove':
            gesture['type'] = 'DRAG'
        elif event_type == 'touchend':
            gesture['type'] = 'RELEASE'
        elif event_type == 'pinch':
            gesture['type'] = 'PINCH'
        elif event_type == 'spread':
            gesture['type'] = 'SPREAD'
            
        self.gestures.append(gesture)
        return gesture
        
    def start_server(self, port=8081):
        """Start socket server for gesture data"""
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(('localhost', port))
        server.listen(5)
        server.settimeout(1.0)
        
        print(f'[Gesture Controller] Server started on port {port}')
        print('[Gesture Controller] Waiting for connections...')
        
        while self.running:
            try:
                client, addr = server.accept()
                client.settimeout(1.0)
                
                try:
                    data = client.recv(1024).decode()
                    if data:
                        touch_data = json.loads(data)
                        gesture = self.process_gesture(touch_data)
                        response = json.dumps(gesture)
                        client.send(response.encode())
                except socket.timeout:
                    pass
                except Exception as e:
                    print(f'[Gesture Controller] Processing error: {e}')
                finally:
                    client.close()
                    
            except socket.timeout:
                continue
            except Exception as e:
                if self.running:
                    print(f'[Gesture Controller] Server error: {e}')
                    
        server.close()
        print('[Gesture Controller] Server stopped')

if __name__ == '__main__':
    print('=' * 60)
    print('  Gesture Physics Controller')
    print('=' * 60)
    
    controller = GestureController()
    
    print('[INFO] Features:')
    if MEDIAPIPE_AVAILABLE:
        print('  ✓ MediaPipe gesture recognition: ENABLED')
    else:
        print('  ⚠ MediaPipe gesture recognition: DISABLED')
    print('  ✓ Touch input processing: ENABLED')
    print('[INFO] Press Ctrl+C to stop')
    
    try:
        controller.start_server()
    except KeyboardInterrupt:
        controller.running = False
        print('\n[Gesture Controller] Shutting down...')