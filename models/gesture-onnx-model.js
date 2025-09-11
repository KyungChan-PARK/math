/**
 * ONNX-based Gesture Recognition Model
 * Integrates with MediaPipe hand tracking for real-time gesture recognition
 */

const ort = require('onnxruntime-node');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs').promises;
const path = require('path');

class GestureONNXModel {
    constructor() {
        this.session = null;
        this.modelPath = path.join(__dirname, 'gesture_recognition.onnx');
        this.labels = [
            'tap', 'swipe_left', 'swipe_right', 'swipe_up', 'swipe_down',
            'circle', 'rectangle', 'triangle', 'line', 'pinch',
            'spread', 'grab', 'point', 'draw', 'rotate'
        ];
        
        // Hand landmark indices for MediaPipe
        this.HAND_LANDMARKS = {
            WRIST: 0,
            THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
            INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
            MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
            RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
            PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20
        };
        
        // Gesture patterns for math operations
        this.mathGestures = {
            'pinch': { operation: 'scale', params: ['thumb_index_distance'] },
            'spread': { operation: 'angle', params: ['finger_spread_angle'] },
            'grab': { operation: 'move', params: ['hand_center'] },
            'point': { operation: 'select', params: ['index_tip_position'] },
            'draw': { operation: 'create', params: ['trajectory'] },
            'circle': { operation: 'create_circle', params: ['radius', 'center'] },
            'line': { operation: 'create_line', params: ['start', 'end'] },
            'rotate': { operation: 'rotate', params: ['angle', 'center'] }
        };
    }
    
    async initialize() {
        try {
            // Check if ONNX model exists, if not create a placeholder
            const modelExists = await this.checkModelExists();
            if (!modelExists) {
                console.log('ONNX model not found, creating TensorFlow fallback...');
                await this.createTensorFlowModel();
            } else {
                // Load ONNX model
                this.session = await ort.InferenceSession.create(this.modelPath);
                console.log('ONNX model loaded successfully');
            }
            
            return true;
        } catch (error) {
            console.error('Error initializing ONNX model:', error);
            // Fallback to TensorFlow.js
            await this.createTensorFlowModel();
            return true;
        }
    }
    
    async checkModelExists() {
        try {
            await fs.access(this.modelPath);
            return true;
        } catch {
            return false;
        }
    }
    
    async createTensorFlowModel() {
        // Create a simple TensorFlow model as fallback
        this.tfModel = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [63], units: 128, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: this.labels.length, activation: 'softmax' })
            ]
        });
        
        this.tfModel.compile({
            optimizer: 'adam',
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
        
        console.log('TensorFlow fallback model created');
    }
    
    async predict(handLandmarks) {
        try {
            // Extract features from hand landmarks
            const features = this.extractFeatures(handLandmarks);
            
            if (this.session) {
                // Use ONNX model
                return await this.predictONNX(features);
            } else if (this.tfModel) {
                // Use TensorFlow fallback
                return await this.predictTensorFlow(features);
            } else {
                // Rule-based fallback
                return this.predictRuleBased(handLandmarks);
            }
        } catch (error) {
            console.error('Prediction error:', error);
            return this.getDefaultPrediction();
        }
    }
    
    extractFeatures(landmarks) {
        const features = [];
        
        // Normalize landmarks relative to wrist
        const wrist = landmarks[this.HAND_LANDMARKS.WRIST];
        
        for (let i = 0; i < 21; i++) {
            const point = landmarks[i];
            features.push(point.x - wrist.x);
            features.push(point.y - wrist.y);
            features.push(point.z - wrist.z);
        }
        
        return features;
    }
    
    async predictONNX(features) {
        // Create input tensor
        const inputTensor = new ort.Tensor('float32', features, [1, 63]);
        
        // Run inference
        const feeds = { input: inputTensor };
        const results = await this.session.run(feeds);
        
        // Get output probabilities
        const output = results.output.data;
        const maxIndex = output.indexOf(Math.max(...output));
        
        return {
            gesture: this.labels[maxIndex],
            confidence: output[maxIndex],
            probabilities: this.labels.map((label, i) => ({
                label,
                probability: output[i]
            }))
        };
    }
    
    async predictTensorFlow(features) {
        const inputTensor = tf.tensor2d([features]);
        const prediction = this.tfModel.predict(inputTensor);
        const probabilities = await prediction.data();
        
        inputTensor.dispose();
        prediction.dispose();
        
        const maxIndex = probabilities.indexOf(Math.max(...probabilities));
        
        return {
            gesture: this.labels[maxIndex],
            confidence: probabilities[maxIndex],
            probabilities: this.labels.map((label, i) => ({
                label,
                probability: probabilities[i]
            }))
        };
    }
    
    predictRuleBased(landmarks) {
        // Rule-based gesture detection
        const gesture = this.detectGestureFromRules(landmarks);
        
        return {
            gesture: gesture.name,
            confidence: gesture.confidence,
            probabilities: [{
                label: gesture.name,
                probability: gesture.confidence
            }]
        };
    }
    
    detectGestureFromRules(landmarks) {
        // Calculate key distances and angles
        const thumbTip = landmarks[this.HAND_LANDMARKS.THUMB_TIP];
        const indexTip = landmarks[this.HAND_LANDMARKS.INDEX_TIP];
        const middleTip = landmarks[this.HAND_LANDMARKS.MIDDLE_TIP];
        const ringTip = landmarks[this.HAND_LANDMARKS.RING_TIP];
        const pinkyTip = landmarks[this.HAND_LANDMARKS.PINKY_TIP];
        const wrist = landmarks[this.HAND_LANDMARKS.WRIST];
        
        // Pinch detection
        const pinchDistance = this.calculateDistance(thumbTip, indexTip);
        if (pinchDistance < 0.05) {
            return { name: 'pinch', confidence: 0.9 };
        }
        
        // Point detection (index extended, others folded)
        const indexExtended = this.isFingerExtended(landmarks, 'INDEX');
        const othersFolder = !this.isFingerExtended(landmarks, 'MIDDLE') &&
                            !this.isFingerExtended(landmarks, 'RING') &&
                            !this.isFingerExtended(landmarks, 'PINKY');
        
        if (indexExtended && othersFolder) {
            return { name: 'point', confidence: 0.85 };
        }
        
        // Spread detection (all fingers extended)
        const allExtended = indexExtended &&
                           this.isFingerExtended(landmarks, 'MIDDLE') &&
                           this.isFingerExtended(landmarks, 'RING') &&
                           this.isFingerExtended(landmarks, 'PINKY');
        
        if (allExtended) {
            return { name: 'spread', confidence: 0.8 };
        }
        
        // Grab detection (all fingers folded)
        const allFolded = !indexExtended &&
                         !this.isFingerExtended(landmarks, 'MIDDLE') &&
                         !this.isFingerExtended(landmarks, 'RING') &&
                         !this.isFingerExtended(landmarks, 'PINKY');
        
        if (allFolded) {
            return { name: 'grab', confidence: 0.75 };
        }
        
        return { name: 'unknown', confidence: 0.3 };
    }
    
    isFingerExtended(landmarks, finger) {
        const indices = this.getFingerIndices(finger);
        const tip = landmarks[indices.tip];
        const pip = landmarks[indices.pip];
        const mcp = landmarks[indices.mcp];
        
        // Check if finger is extended based on joint positions
        const extendedLength = this.calculateDistance(tip, mcp);
        const bentLength = this.calculateDistance(tip, pip) + this.calculateDistance(pip, mcp);
        
        return extendedLength > (bentLength * 0.8);
    }
    
    getFingerIndices(finger) {
        switch (finger) {
            case 'INDEX':
                return {
                    mcp: this.HAND_LANDMARKS.INDEX_MCP,
                    pip: this.HAND_LANDMARKS.INDEX_PIP,
                    tip: this.HAND_LANDMARKS.INDEX_TIP
                };
            case 'MIDDLE':
                return {
                    mcp: this.HAND_LANDMARKS.MIDDLE_MCP,
                    pip: this.HAND_LANDMARKS.MIDDLE_PIP,
                    tip: this.HAND_LANDMARKS.MIDDLE_TIP
                };
            case 'RING':
                return {
                    mcp: this.HAND_LANDMARKS.RING_MCP,
                    pip: this.HAND_LANDMARKS.RING_PIP,
                    tip: this.HAND_LANDMARKS.RING_TIP
                };
            case 'PINKY':
                return {
                    mcp: this.HAND_LANDMARKS.PINKY_MCP,
                    pip: this.HAND_LANDMARKS.PINKY_PIP,
                    tip: this.HAND_LANDMARKS.PINKY_TIP
                };
        }
    }
    
    calculateDistance(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }
    
    getMathOperation(gesture) {
        return this.mathGestures[gesture] || null;
    }
    
    getDefaultPrediction() {
        return {
            gesture: 'unknown',
            confidence: 0,
            probabilities: []
        };
    }
    
    async saveModel(modelPath) {
        if (this.tfModel) {
            await this.tfModel.save(`file://${modelPath}`);
            console.log(`Model saved to ${modelPath}`);
        }
    }
    
    async loadModel(modelPath) {
        try {
            this.tfModel = await tf.loadLayersModel(`file://${modelPath}/model.json`);
            console.log(`Model loaded from ${modelPath}`);
            return true;
        } catch (error) {
            console.error('Error loading model:', error);
            return false;
        }
    }
}

export default GestureONNXModel;
