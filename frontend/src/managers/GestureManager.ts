// GestureManager.ts - Touch gesture detection and interpretation
import * as THREE from 'three';

export interface TouchPoint {
  identifier: number;
  x: number;
  y: number;
  timestamp: number;
  force: number;
  pointerType?: string; // 'touch', 'pen', 'mouse'
}

export interface GestureData {
  type: string;
  parameters: any;
  confidence: number;
  timestamp: number;
}

export type GestureCallback = (gesture: GestureData) => void;

class GestureManager {
  private canvas: HTMLElement;
  private ongoingTouches: Map<number, TouchPoint>;
  private gestureCallback: GestureCallback;
  
  // Gesture detection parameters
  private readonly PINCH_THRESHOLD = 10;
  private readonly ROTATION_THRESHOLD = 5; // degrees
  private readonly TAP_DURATION = 200; // ms
  private readonly DOUBLE_TAP_INTERVAL = 300; // ms
  private readonly DRAG_THRESHOLD = 10; // pixels
  
  // Gesture state tracking
  private lastTapTime = 0;
  private lastGesture = '';
  private initialPinchDistance = 0;
  private initialRotationAngle = 0;
  private gestureInProgress = false;
  
  constructor(canvas: HTMLElement, callback: GestureCallback) {
    this.canvas = canvas;
    this.ongoingTouches = new Map();
    this.gestureCallback = callback;
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Touch events
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    
    // Pointer events for S Pen support
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('pointercancel', this.handlePointerCancel.bind(this));
    
    // Prevent default gestures
    this.canvas.addEventListener('gesturestart', (e) => e.preventDefault());
    this.canvas.addEventListener('gesturechange', (e) => e.preventDefault());
    this.canvas.addEventListener('gestureend', (e) => e.preventDefault());
  }
  
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    Array.from(event.changedTouches).forEach(touch => {
      this.ongoingTouches.set(touch.identifier, {
        identifier: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
        force: touch.force || 1.0,
        pointerType: 'touch'
      });
    });
    
    this.analyzeGesture('start');
  }
  
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    Array.from(event.changedTouches).forEach(touch => {
      const existingTouch = this.ongoingTouches.get(touch.identifier);
      if (existingTouch) {
        existingTouch.x = touch.clientX;
        existingTouch.y = touch.clientY;
        existingTouch.force = touch.force || 1.0;
      }
    });
    
    if (this.ongoingTouches.size > 0) {
      this.analyzeGesture('move');
    }
  }
  
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    Array.from(event.changedTouches).forEach(touch => {
      const touchPoint = this.ongoingTouches.get(touch.identifier);
      if (touchPoint) {
        const duration = Date.now() - touchPoint.timestamp;
        
        // Check for tap
        if (duration < this.TAP_DURATION && this.ongoingTouches.size === 1) {
          this.detectTap(touchPoint);
        }
        
        this.ongoingTouches.delete(touch.identifier);
      }
    });
    
    this.analyzeGesture('end');
  }
  
  private handleTouchCancel(event: TouchEvent): void {
    event.preventDefault();
    
    Array.from(event.changedTouches).forEach(touch => {
      this.ongoingTouches.delete(touch.identifier);
    });
    
    this.gestureInProgress = false;
  }
  
  // Pointer events for S Pen support
  private handlePointerDown(event: PointerEvent): void {
    if (event.pointerType === 'touch') return; // Already handled by touch events
    
    this.ongoingTouches.set(event.pointerId, {
      identifier: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      force: event.pressure,
      pointerType: event.pointerType
    });
    
    this.analyzeGesture('start');
  }
  
  private handlePointerMove(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    
    const existingTouch = this.ongoingTouches.get(event.pointerId);
    if (existingTouch) {
      existingTouch.x = event.clientX;
      existingTouch.y = event.clientY;
      existingTouch.force = event.pressure;
      
      this.analyzeGesture('move');
    }
  }
  
  private handlePointerUp(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    
    this.ongoingTouches.delete(event.pointerId);
    this.analyzeGesture('end');
  }
  
  private handlePointerCancel(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    
    this.ongoingTouches.delete(event.pointerId);
    this.gestureInProgress = false;
  }
  
  private analyzeGesture(phase: 'start' | 'move' | 'end'): void {
    const touchCount = this.ongoingTouches.size;
    
    if (touchCount === 0) {
      this.gestureInProgress = false;
      return;
    }
    
    if (touchCount === 1) {
      this.analyzeSingleTouch(phase);
    } else if (touchCount === 2) {
      this.analyzeDoubleTouch(phase);
    } else if (touchCount === 3) {
      this.analyzeTripleTouch(phase);
    }
  }
  
  private analyzeSingleTouch(phase: string): void {
    const touch = Array.from(this.ongoingTouches.values())[0];
    
    if (phase === 'start') {
      this.gestureInProgress = true;
    } else if (phase === 'move' && this.gestureInProgress) {
      // Single finger drag
      this.emitGesture({
        type: 'DRAG',
        parameters: {
          x: touch.x,
          y: touch.y,
          force: touch.force,
          pointerType: touch.pointerType
        },
        confidence: 0.95,
        timestamp: Date.now()
      });
    }
  }
  
  private analyzeDoubleTouch(phase: string): void {
    const touches = Array.from(this.ongoingTouches.values());
    if (touches.length !== 2) return;
    
    const [touch1, touch2] = touches;
    const dx = touch2.x - touch1.x;
    const dy = touch2.y - touch1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    if (phase === 'start') {
      this.initialPinchDistance = distance;
      this.initialRotationAngle = angle;
      this.gestureInProgress = true;
    } else if (phase === 'move' && this.gestureInProgress) {
      const distanceChange = Math.abs(distance - this.initialPinchDistance);
      const angleChange = Math.abs(angle - this.initialRotationAngle);
      
      if (distanceChange > this.PINCH_THRESHOLD) {
        // Pinch gesture detected
        const scaleFactor = distance / this.initialPinchDistance;
        this.emitGesture({
          type: 'PINCH',
          parameters: {
            scaleFactor,
            centerX: (touch1.x + touch2.x) / 2,
            centerY: (touch1.y + touch2.y) / 2
          },
          confidence: 0.9,
          timestamp: Date.now()
        });
      } else if (angleChange > this.ROTATION_THRESHOLD) {
        // Rotation gesture detected
        const rotation = angle - this.initialRotationAngle;
        this.emitGesture({
          type: 'ROTATE',
          parameters: {
            rotation,
            centerX: (touch1.x + touch2.x) / 2,
            centerY: (touch1.y + touch2.y) / 2
          },
          confidence: 0.9,
          timestamp: Date.now()
        });
      } else {
        // Two-finger pan
        this.emitGesture({
          type: 'PAN',
          parameters: {
            centerX: (touch1.x + touch2.x) / 2,
            centerY: (touch1.y + touch2.y) / 2
          },
          confidence: 0.85,
          timestamp: Date.now()
        });
      }
    }
  }
  
  private analyzeTripleTouch(phase: string): void {
    // Three-finger gestures (e.g., reset view, undo)
    if (phase === 'start') {
      this.emitGesture({
        type: 'TRIPLE_TAP',
        parameters: {
          touchCount: 3
        },
        confidence: 0.95,
        timestamp: Date.now()
      });
    }
  }
  
  private detectTap(touchPoint: TouchPoint): void {
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - this.lastTapTime;
    
    if (timeSinceLastTap < this.DOUBLE_TAP_INTERVAL) {
      // Double tap detected
      this.emitGesture({
        type: 'DOUBLE_TAP',
        parameters: {
          x: touchPoint.x,
          y: touchPoint.y
        },
        confidence: 0.95,
        timestamp: currentTime
      });
    } else {
      // Single tap
      this.emitGesture({
        type: 'TAP',
        parameters: {
          x: touchPoint.x,
          y: touchPoint.y,
          pointerType: touchPoint.pointerType
        },
        confidence: 0.98,
        timestamp: currentTime
      });
    }
    
    this.lastTapTime = currentTime;
  }
  
  private emitGesture(gesture: GestureData): void {
    // Avoid duplicate emissions
    if (gesture.type === this.lastGesture && 
        Date.now() - gesture.timestamp < 50) {
      return;
    }
    
    this.lastGesture = gesture.type;
    this.gestureCallback(gesture);
  }
  
  public destroy(): void {
    // Remove all event listeners
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.removeEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.removeEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel.bind(this));
    
    this.ongoingTouches.clear();
  }
}

export default GestureManager;
