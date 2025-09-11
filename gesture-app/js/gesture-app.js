/**
 * External Gesture Web App for AE Claude Max
 * Bypasses CEP canvas limitations using Figma-inspired architecture
 */

import { GestureHandler } from '@use-gesture/vanilla';
import { $QRecognizer } from './lib/dollar-q.js';

class ExternalGestureApp {
    constructor() {
        this.canvas = document.getElementById('gesture-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ws = null;
        this.recognizer = new $QRecognizer();
        this.points = [];
        this.isDrawing = false;
        
        this.init();
    }
    
    init() {
        // Connect to AE Claude Max gesture service
        this.connectWebSocket();
        
        // Setup canvas to match AE composition size
        this.setupCanvas();
        
        // Initialize gesture handler
        this.setupGestureHandler();
        
        // Load AE-specific gesture templates
        this.loadTemplates();
    }
    
    connectWebSocket() {
        // Connect to our µWebSocket server (8.5x performance)
        this.ws = new WebSocket('ws://localhost:8081');
        
        this.ws.onopen = () => {
            console.log('Connected to AE gesture service');
            this.updateStatus('Connected');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'ae_state') {
                // Sync with After Effects state
                this.syncWithAE(data.state);
            } else if (data.type === 'gesture_feedback') {
                // Show recognition feedback
                this.showFeedback(data);
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateStatus('Connection Error');
        };
    }