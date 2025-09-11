export default class GestureController {
    constructor() {
        this.canvas = document.getElementById('gesture-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ws = null;
        this.isDrawing = false;
        this.currentPath = [];
        
        this.initCanvas();
        this.connectWebSocket();
        this.setupEventListeners();
    }
    
    initCanvas() {
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Style setup
        this.ctx.strokeStyle = '#5E5CE6';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }
    
    connectWebSocket() {
        this.ws = new WebSocket('ws://localhost:8081/gesture');
        
        this.ws.onopen = () => {
            console.log('Connected to gesture service');
            this.showFeedback('Connected', 'success');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.showFeedback('Connection error', 'error');
        };
        
        this.ws.onclose = () => {
            console.log('Disconnected from gesture service');
            this.showFeedback('Disconnected', 'warning');
            // Attempt reconnection
            setTimeout(() => this.connectWebSocket(), 3000);
        };
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.endDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.endDrawing.bind(this));
        
        // Touch events for tablet support
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.endDrawing.bind(this));
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        this.currentPath = [];
        
        const point = this.getPoint(e);
        this.currentPath.push(point);
        
        // Start visual feedback
        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y);
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const point = this.getPoint(e);
        this.currentPath.push(point);
        
        // Draw on canvas
        this.ctx.lineTo(point.x, point.y);
        this.ctx.stroke();
        
        // Show point count
        this.showFeedback(`Drawing... (${this.currentPath.length} points)`, 'info');
    }
    
    endDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        // Process gesture if we have enough points
        if (this.currentPath.length > 5) {
            this.processGesture();
        } else {
            this.clearCanvas();
        }
    }
    
    processGesture() {
        // Send to server
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'gesture',
                points: this.currentPath,
                timestamp: Date.now()
            }));
            
            this.showFeedback('Processing gesture...', 'info');
        } else {
            this.showFeedback('Not connected to server', 'error');
        }
        
        // Clear canvas after delay
        setTimeout(() => this.clearCanvas(), 1000);
    }
    
    handleServerMessage(data) {
        switch (data.type) {
            case 'connected':
                console.log('Client ID:', data.clientId);
                break;
                
            case 'gesture_result':
                this.handleGestureResult(data);
                break;
                
            case 'error':
                this.showFeedback(data.message, 'error');
                break;
        }
    }
    
    handleGestureResult(result) {
        const { gesture, confidence, naturalLanguage } = result;
        
        // Show result
        this.showFeedback(
            `Recognized: ${gesture} (${Math.round(confidence * 100)}%) - ${naturalLanguage}`,
            confidence > 0.7 ? 'success' : 'warning'
        );
        
        // Send to After Effects if high confidence
        if (confidence > 0.8 && window.parent && window.parent.postMessage) {
            window.parent.postMessage({
                type: 'GESTURE_COMMAND',
                gesture: gesture,
                naturalLanguage: naturalLanguage
            }, '*');
        }
        
        this.clearCanvas();
    }
    
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    getPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            time: Date.now()
        };
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentPath = [];
    }
    
    showFeedback(message, type = 'info') {
        const feedback = document.getElementById('feedback');
        if (!feedback) return;
        
        feedback.className = `feedback ${type}`;
        feedback.textContent = message;
        
        // Auto-hide after 3 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                feedback.textContent = '';
            }, 3000);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new GestureController();
    });
} else {
    new GestureController();
}
