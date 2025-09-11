"""
LOLA Physics Server for Math Learning Platform
Simple HTTP server for physics emulation
"""
import json
import time
import random
import numpy as np
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

class LOLAPhysicsEmulator:
    def __init__(self):
        self.compression_rate = 256
        self.fps = 60
        self.running = True
        
    def compress(self, data, rate):
        """Simulate LOLA compression"""
        if isinstance(data, list):
            data = np.array(data)
        if len(data) < rate:
            return data.tolist()
        compressed_size = max(1, len(data) // rate)
        compressed = np.mean(data.reshape(-1, rate), axis=1) if len(data) >= rate else data
        return compressed.tolist() if hasattr(compressed, 'tolist') else compressed
        
    def emulate_physics(self, state, steps=10):
        """Simple physics emulation"""
        trajectory = []
        current = np.array(state) if isinstance(state, list) else state
        for i in range(steps):
            # Simple wave equation simulation
            current = current * np.cos(i * 0.1) + np.random.randn(*current.shape) * 0.01
            trajectory.append(current.tolist() if hasattr(current, 'tolist') else current)
        return trajectory

class LOLAHandler(BaseHTTPRequestHandler):
    emulator = LOLAPhysicsEmulator()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        status = {
            'status': 'running',
            'compression': self.emulator.compression_rate,
            'fps': self.emulator.fps,
            'timestamp': time.time()
        }
        self.wfile.write(json.dumps(status).encode())
        
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        try:
            data = json.loads(post_data)
            action = data.get('action', 'emulate')
            
            if action == 'compress':
                result = self.emulator.compress(data.get('state', []), self.emulator.compression_rate)
            elif action == 'emulate':
                result = self.emulator.emulate_physics(data.get('state', [1.0]), data.get('steps', 10))
            else:
                result = {'processed': True}
                
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'result': result, 'timestamp': time.time()}).encode())
        except Exception as e:
            self.send_error(500, str(e))
            
    def log_message(self, format, *args):
        # Suppress default logging
        pass

if __name__ == '__main__':
    print('=' * 60)
    print('  LOLA Physics Server')
    print('=' * 60)
    
    server = HTTPServer(('localhost', 8080), LOLAHandler)
    print('[LOLA Server] Starting on http://localhost:8080')
    print('[LOLA Server] Compression: 256x')
    print('[LOLA Server] Ready!')
    print('[INFO] Press Ctrl+C to stop')
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[LOLA Server] Shutting down...')
        server.shutdown()