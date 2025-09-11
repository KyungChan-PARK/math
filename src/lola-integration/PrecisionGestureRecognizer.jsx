/**
 * Enhanced MediaPipe Integration for Precision Gesture Recognition
 * Optimized for Samsung Galaxy Book 4 Pro 360 Touch Screen
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import * as tf from '@tensorflow/tfjs';

class PrecisionGestureRecognizer {
  constructor() {
    this.hands = null;
    this.camera = null;
    this.model = null;
    this.gestureHistory = [];
    this.calibrationData = {};
    this.recognitionThreshold = 0.85;
    this.touchMode = 'hybrid'; // 'touch', 'camera', 'hybrid'
    this.initialized = false;
    
    // Enhanced gesture definitions
    this.gestures = {
      // Basic gestures
      POINT: { fingers: [1], confidence: 0.9 },
      PEACE: { fingers: [1, 2], confidence: 0.9 },
      THUMBS_UP: { fingers: [0], thumb_up: true, confidence: 0.85 },
      FIST: { fingers: [], confidence: 0.9 },
      OPEN_PALM: { fingers: [0, 1, 2, 3, 4], confidence: 0.9 },
      
      // Math-specific gestures
      DRAW: { fingers: [1], motion: 'continuous', confidence: 0.8 },
      ERASE: { fingers: [], motion: 'back_forth', confidence: 0.75 },
      MEASURE: { fingers: [1, 2], spread: true, confidence: 0.85 },
      ROTATE: { fingers: [1, 2], motion: 'circular', confidence: 0.8 },
      SCALE: { motion: 'pinch_zoom', confidence: 0.85 },
      
      // Advanced gestures
      GRAB: { fingers: [], motion: 'closing', confidence: 0.8 },
      RELEASE: { fingers: [0, 1, 2, 3, 4], motion: 'opening', confidence: 0.8 },
      SWIPE_LEFT: { motion: 'left', velocity: 'fast', confidence: 0.75 },
      SWIPE_RIGHT: { motion: 'right', velocity: 'fast', confidence: 0.75 },
      SWIPE_UP: { motion: 'up', velocity: 'fast', confidence: 0.75 },
      SWIPE_DOWN: { motion: 'down', velocity: 'fast', confidence: 0.75 },
      
      // Touch-enhanced gestures
      TAP: { contact: true, duration: '<500ms', confidence: 0.95 },
      DOUBLE_TAP: { contact: true, taps: 2, confidence: 0.9 },
      LONG_PRESS: { contact: true, duration: '>1000ms', confidence: 0.95 },
      DRAG: { contact: true, motion: 'continuous', confidence: 0.9 },
      PINCH: { fingers: [0, 1], motion: 'converging', confidence: 0.85 },
      SPREAD: { fingers: [0, 1], motion: 'diverging', confidence: 0.85 },
      
      // Mathematical operations
      EQUALS: { shape: '=', confidence: 0.8 },
      PLUS: { shape: '+', confidence: 0.8 },
      MINUS: { shape: '-', confidence: 0.8 },
      MULTIPLY: { shape: 'x', confidence: 0.8 },
      DIVIDE: { shape: '/', confidence: 0.8 },
      PARENTHESIS_OPEN: { shape: '(', confidence: 0.75 },
      PARENTHESIS_CLOSE: { shape: ')', confidence: 0.75 }
    };
    
    // Gesture combination patterns
    this.combinations = {
      'COPY': ['GRAB', 'SWIPE_RIGHT'],
      'PASTE': ['RELEASE', 'TAP'],
      'UNDO': ['SWIPE_LEFT', 'SWIPE_LEFT'],
      'REDO': ['SWIPE_RIGHT', 'SWIPE_RIGHT'],
      'ZOOM_IN': ['SPREAD', 'SPREAD'],
      'ZOOM_OUT': ['PINCH', 'PINCH'],
      'RESET': ['OPEN_PALM', 'ROTATE']
    };
  }

  async initialize(options = {}) {
    try {
      // Initialize MediaPipe Hands
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        ...options
      });

      // Set up result callback
      this.hands.onResults(this.onResults.bind(this));

      // Initialize TensorFlow.js model for gesture classification
      await this.initializeMLModel();

      // Load calibration data if exists
      await this.loadCalibration();

      this.initialized = true;
      console.log('✅ Precision Gesture Recognizer initialized');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize gesture recognizer:', error);
      return false;
    }
  }

  async initializeMLModel() {
    // Create or load a custom gesture recognition model
    try {
      // Try to load existing model
      this.model = await tf.loadLayersModel('localstorage://gesture-model');
      console.log('Loaded existing gesture model');
    } catch (error) {
      // Create new model if doesn't exist
      this.model = this.createGestureModel();
      console.log('Created new gesture model');
    }
  }

  createGestureModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [63], // 21 landmarks × 3 coordinates
          units: 128,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: Object.keys(this.gestures).length,
          activation: 'softmax'
        })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  async startCamera(videoElement) {
    if (!this.initialized) {
      await this.initialize();
    }

    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        await this.hands.send({ image: videoElement });
      },
      width: 1280,
      height: 720
    });

    await this.camera.start();
    console.log('📷 Camera started for gesture recognition');
  }

  async stopCamera() {
    if (this.camera) {
      this.camera.stop();
      this.camera = null;
    }
  }

  onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const handedness = results.multiHandedness[0];
      
      // Process landmarks
      const processedData = this.processLandmarks(landmarks, handedness);
      
      // Recognize gesture
      const gesture = this.recognizeGesture(processedData);
      
      // Add to history for combination detection
      this.updateGestureHistory(gesture);
      
      // Check for gesture combinations
      const combination = this.detectCombination();
      
      // Emit results
      this.emitGestureEvent(gesture, combination, processedData);
    }
  }

  processLandmarks(landmarks, handedness) {
    // Calculate hand metrics
    const metrics = {
      landmarks: landmarks,
      handedness: handedness.label,
      center: this.calculateCenter(landmarks),
      boundingBox: this.calculateBoundingBox(landmarks),
      fingerStates: this.analyzeFingerStates(landmarks),
      palmOrientation: this.calculatePalmOrientation(landmarks),
      velocity: this.calculateVelocity(landmarks),
      acceleration: this.calculateAcceleration(landmarks)
    };

    // Apply calibration if available
    if (this.calibrationData[handedness.label]) {
      metrics.calibrated = this.applyCalibration(metrics, handedness.label);
    }

    return metrics;
  }

  calculateCenter(landmarks) {
    const sum = landmarks.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
      z: acc.z + point.z
    }), { x: 0, y: 0, z: 0 });

    return {
      x: sum.x / landmarks.length,
      y: sum.y / landmarks.length,
      z: sum.z / landmarks.length
    };
  }

  calculateBoundingBox(landmarks) {
    const xs = landmarks.map(p => p.x);
    const ys = landmarks.map(p => p.y);
    const zs = landmarks.map(p => p.z);

    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      minZ: Math.min(...zs),
      maxZ: Math.max(...zs),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
      depth: Math.max(...zs) - Math.min(...zs)
    };
  }

  analyzeFingerStates(landmarks) {
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerBases = [2, 5, 9, 13, 17];
    const states = {};

    fingerTips.forEach((tip, index) => {
      const fingerName = ['thumb', 'index', 'middle', 'ring', 'pinky'][index];
      const base = fingerBases[index];
      
      // Check if finger is extended
      const extended = landmarks[tip].y < landmarks[base].y;
      
      // Calculate finger angle
      const angle = this.calculateFingerAngle(landmarks, tip, base);
      
      // Check if finger is bent
      const bent = angle < 160;
      
      states[fingerName] = {
        extended,
        bent,
        angle,
        tip: landmarks[tip],
        base: landmarks[base]
      };
    });

    return states;
  }

  calculateFingerAngle(landmarks, tipIndex, baseIndex) {
    const tip = landmarks[tipIndex];
    const base = landmarks[baseIndex];
    const middle = landmarks[Math.floor((tipIndex + baseIndex) / 2)];

    const v1 = {
      x: middle.x - base.x,
      y: middle.y - base.y
    };
    const v2 = {
      x: tip.x - middle.x,
      y: tip.y - middle.y
    };

    const angle = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
    return Math.abs(angle * 180 / Math.PI);
  }

  calculatePalmOrientation(landmarks) {
    // Use palm base points
    const wrist = landmarks[0];
    const index_base = landmarks[5];
    const pinky_base = landmarks[17];

    // Calculate palm normal vector
    const v1 = {
      x: index_base.x - wrist.x,
      y: index_base.y - wrist.y,
      z: index_base.z - wrist.z
    };
    const v2 = {
      x: pinky_base.x - wrist.x,
      y: pinky_base.y - wrist.y,
      z: pinky_base.z - wrist.z
    };

    // Cross product for normal
    const normal = {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x
    };

    // Normalize
    const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
    
    return {
      x: normal.x / length,
      y: normal.y / length,
      z: normal.z / length,
      pitch: Math.atan2(normal.y, normal.z) * 180 / Math.PI,
      yaw: Math.atan2(normal.x, normal.z) * 180 / Math.PI
    };
  }

  calculateVelocity(landmarks) {
    if (this.previousLandmarks) {
      const dt = (Date.now() - this.previousTimestamp) / 1000;
      const velocity = landmarks.map((point, i) => {
        const prev = this.previousLandmarks[i];
        return {
          x: (point.x - prev.x) / dt,
          y: (point.y - prev.y) / dt,
          z: (point.z - prev.z) / dt
        };
      });

      const avgVelocity = velocity.reduce((acc, v) => ({
        x: acc.x + v.x / landmarks.length,
        y: acc.y + v.y / landmarks.length,
        z: acc.z + v.z / landmarks.length
      }), { x: 0, y: 0, z: 0 });

      this.previousVelocity = avgVelocity;
      return avgVelocity;
    }

    this.previousLandmarks = landmarks;
    this.previousTimestamp = Date.now();
    return { x: 0, y: 0, z: 0 };
  }

  calculateAcceleration(landmarks) {
    const velocity = this.calculateVelocity(landmarks);
    
    if (this.previousVelocity) {
      const dt = (Date.now() - this.previousAccelTimestamp) / 1000;
      const acceleration = {
        x: (velocity.x - this.previousVelocity.x) / dt,
        y: (velocity.y - this.previousVelocity.y) / dt,
        z: (velocity.z - this.previousVelocity.z) / dt
      };
      
      this.previousAccelTimestamp = Date.now();
      return acceleration;
    }

    this.previousAccelTimestamp = Date.now();
    return { x: 0, y: 0, z: 0 };
  }

  recognizeGesture(processedData) {
    // Prepare input for ML model
    const input = this.prepareMLInput(processedData);
    
    // Get prediction from model
    const prediction = this.model.predict(input);
    const probabilities = prediction.dataSync();
    
    // Find gesture with highest probability
    const gestureNames = Object.keys(this.gestures);
    let maxProb = 0;
    let recognizedGesture = null;

    probabilities.forEach((prob, index) => {
      if (prob > maxProb && prob > this.recognitionThreshold) {
        maxProb = prob;
        recognizedGesture = gestureNames[index];
      }
    });

    // Additional rule-based checks for precision
    if (recognizedGesture) {
      recognizedGesture = this.validateGesture(recognizedGesture, processedData);
    }

    return {
      gesture: recognizedGesture,
      confidence: maxProb,
      data: processedData,
      timestamp: Date.now()
    };
  }

  prepareMLInput(processedData) {
    // Flatten landmarks to 1D array
    const flattened = [];
    processedData.landmarks.forEach(point => {
      flattened.push(point.x, point.y, point.z);
    });

    return tf.tensor2d([flattened], [1, 63]);
  }

  validateGesture(gesture, data) {
    // Additional validation based on gesture rules
    const rules = this.gestures[gesture];
    
    if (rules.fingers) {
      const extendedFingers = Object.values(data.fingerStates)
        .filter(f => f.extended)
        .length;
      
      if (extendedFingers !== rules.fingers.length) {
        return null;
      }
    }

    if (rules.motion) {
      const velocity = Math.sqrt(
        data.velocity.x ** 2 + 
        data.velocity.y ** 2 + 
        data.velocity.z ** 2
      );

      if (rules.motion === 'continuous' && velocity < 0.1) {
        return null;
      }
    }

    return gesture;
  }

  updateGestureHistory(gesture) {
    if (gesture && gesture.gesture) {
      this.gestureHistory.push(gesture);
      
      // Keep only last 10 gestures
      if (this.gestureHistory.length > 10) {
        this.gestureHistory.shift();
      }
    }
  }

  detectCombination() {
    if (this.gestureHistory.length < 2) return null;

    for (const [combo, pattern] of Object.entries(this.combinations)) {
      const recent = this.gestureHistory.slice(-pattern.length);
      const matches = recent.every((g, i) => g.gesture === pattern[i]);
      
      if (matches) {
        // Clear history after detecting combination
        this.gestureHistory = [];
        return combo;
      }
    }

    return null;
  }

  emitGestureEvent(gesture, combination, data) {
    const event = new CustomEvent('gesture', {
      detail: {
        gesture: gesture?.gesture,
        combination,
        confidence: gesture?.confidence,
        data,
        timestamp: Date.now()
      }
    });

    window.dispatchEvent(event);
  }

  // Touch integration methods
  processTouchGesture(touchData) {
    // Convert touch data to gesture format
    const gesture = this.touchToGesture(touchData);
    
    // Combine with camera data if in hybrid mode
    if (this.touchMode === 'hybrid' && this.lastCameraGesture) {
      return this.fuseGestures(gesture, this.lastCameraGesture);
    }

    return gesture;
  }

  touchToGesture(touchData) {
    const { type, touches, timestamp } = touchData;
    
    switch (type) {
      case 'touchstart':
        if (touches.length === 1) {
          return { gesture: 'TAP', confidence: 0.95 };
        } else if (touches.length === 2) {
          return { gesture: 'PINCH', confidence: 0.9 };
        }
        break;
        
      case 'touchmove':
        if (touches.length === 1) {
          return { gesture: 'DRAG', confidence: 0.9 };
        } else if (touches.length === 2) {
          const distance = this.calculateTouchDistance(touches);
          if (distance > this.lastTouchDistance) {
            return { gesture: 'SPREAD', confidence: 0.85 };
          } else {
            return { gesture: 'PINCH', confidence: 0.85 };
          }
        }
        break;
        
      case 'touchend':
        const duration = timestamp - this.touchStartTime;
        if (duration > 1000) {
          return { gesture: 'LONG_PRESS', confidence: 0.95 };
        }
        break;
    }

    return null;
  }

  calculateTouchDistance(touches) {
    if (touches.length < 2) return 0;
    
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  fuseGestures(touchGesture, cameraGesture) {
    // Weighted fusion based on confidence
    if (!touchGesture) return cameraGesture;
    if (!cameraGesture) return touchGesture;

    const touchWeight = touchGesture.confidence * 0.7;
    const cameraWeight = cameraGesture.confidence * 0.3;

    if (touchWeight > cameraWeight) {
      return touchGesture;
    } else {
      return cameraGesture;
    }
  }

  // Calibration methods
  async startCalibration(hand = 'Right') {
    console.log(`Starting calibration for ${hand} hand...`);
    
    this.calibrationData[hand] = {
      samples: [],
      gestures: {}
    };

    // Collect samples for each gesture
    for (const gesture of Object.keys(this.gestures)) {
      console.log(`Please perform ${gesture} gesture`);
      await this.collectCalibrationSamples(hand, gesture);
    }

    // Save calibration
    await this.saveCalibration();
    
    console.log('✅ Calibration complete');
  }

  async collectCalibrationSamples(hand, gesture, count = 10) {
    const samples = [];
    
    return new Promise((resolve) => {
      const collectSample = (event) => {
        if (event.detail.data.handedness === hand) {
          samples.push(event.detail.data);
          
          if (samples.length >= count) {
            window.removeEventListener('gesture', collectSample);
            this.calibrationData[hand].gestures[gesture] = samples;
            resolve();
          }
        }
      };

      window.addEventListener('gesture', collectSample);
    });
  }

  applyCalibration(metrics, hand) {
    const calibration = this.calibrationData[hand];
    if (!calibration) return metrics;

    // Apply calibration adjustments
    // This would involve transforming the metrics based on calibration data
    return {
      ...metrics,
      calibrated: true
    };
  }

  async saveCalibration() {
    localStorage.setItem('gestureCalibration', JSON.stringify(this.calibrationData));
  }

  async loadCalibration() {
    const saved = localStorage.getItem('gestureCalibration');
    if (saved) {
      this.calibrationData = JSON.parse(saved);
      console.log('Loaded gesture calibration data');
    }
  }

  // Training methods for continuous improvement
  async trainOnUserData(gestureLabel, landmarkData) {
    if (!this.trainingData) {
      this.trainingData = [];
    }

    this.trainingData.push({
      label: gestureLabel,
      data: landmarkData
    });

    // Retrain model periodically
    if (this.trainingData.length >= 100) {
      await this.retrainModel();
    }
  }

  async retrainModel() {
    console.log('Retraining gesture model with user data...');
    
    // Prepare training data
    const xs = [];
    const ys = [];
    
    this.trainingData.forEach(sample => {
      xs.push(this.prepareMLInput(sample.data));
      ys.push(this.gestureLabelToOneHot(sample.label));
    });

    const xsTensor = tf.stack(xs);
    const ysTensor = tf.stack(ys);

    // Train model
    await this.model.fit(xsTensor, ysTensor, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
        }
      }
    });

    // Save updated model
    await this.model.save('localstorage://gesture-model');
    
    // Clear training data
    this.trainingData = [];
    
    console.log('✅ Model retrained and saved');
  }

  gestureLabelToOneHot(label) {
    const gestureNames = Object.keys(this.gestures);
    const index = gestureNames.indexOf(label);
    const oneHot = new Array(gestureNames.length).fill(0);
    
    if (index >= 0) {
      oneHot[index] = 1;
    }
    
    return oneHot;
  }

  // Utility methods
  setTouchMode(mode) {
    if (['touch', 'camera', 'hybrid'].includes(mode)) {
      this.touchMode = mode;
      console.log(`Touch mode set to: ${mode}`);
    }
  }

  setRecognitionThreshold(threshold) {
    this.recognitionThreshold = Math.max(0, Math.min(1, threshold));
  }

  getGestureStats() {
    const stats = {};
    
    this.gestureHistory.forEach(g => {
      if (!stats[g.gesture]) {
        stats[g.gesture] = { count: 0, avgConfidence: 0 };
      }
      stats[g.gesture].count++;
      stats[g.gesture].avgConfidence += g.confidence;
    });

    Object.keys(stats).forEach(gesture => {
      stats[gesture].avgConfidence /= stats[gesture].count;
    });

    return stats;
  }

  reset() {
    this.gestureHistory = [];
    this.previousLandmarks = null;
    this.previousVelocity = null;
    this.lastCameraGesture = null;
  }

  destroy() {
    this.stopCamera();
    this.hands = null;
    this.model = null;
    this.reset();
  }
}

// React Hook for Gesture Recognition
export const usePrecisionGestures = (options = {}) => {
  const [recognizer, setRecognizer] = useState(null);
  const [currentGesture, setCurrentGesture] = useState(null);
  const [gestureHistory, setGestureHistory] = useState([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const initRecognizer = async () => {
      const rec = new PrecisionGestureRecognizer();
      await rec.initialize(options);
      setRecognizer(rec);

      // Listen for gesture events
      const handleGesture = (event) => {
        setCurrentGesture(event.detail);
        setGestureHistory(prev => [...prev.slice(-9), event.detail]);
      };

      window.addEventListener('gesture', handleGesture);

      return () => {
        window.removeEventListener('gesture', handleGesture);
        rec.destroy();
      };
    };

    initRecognizer();
  }, []);

  const startCamera = useCallback(async () => {
    if (recognizer && videoRef.current) {
      await recognizer.startCamera(videoRef.current);
    }
  }, [recognizer]);

  const stopCamera = useCallback(() => {
    if (recognizer) {
      recognizer.stopCamera();
    }
  }, [recognizer]);

  const calibrate = useCallback(async (hand = 'Right') => {
    if (recognizer) {
      setIsCalibrating(true);
      await recognizer.startCalibration(hand);
      setIsCalibrating(false);
    }
  }, [recognizer]);

  const trainGesture = useCallback(async (label, data) => {
    if (recognizer) {
      await recognizer.trainOnUserData(label, data);
    }
  }, [recognizer]);

  const processTouchGesture = useCallback((touchData) => {
    if (recognizer) {
      return recognizer.processTouchGesture(touchData);
    }
  }, [recognizer]);

  return {
    recognizer,
    currentGesture,
    gestureHistory,
    isCalibrating,
    videoRef,
    startCamera,
    stopCamera,
    calibrate,
    trainGesture,
    processTouchGesture
  };
};

export default PrecisionGestureRecognizer;