// MultiModalProcessor.js - Process multi-modal inputs (scene graphs + gestures)
import { logger } from '../utils/logger.js';

class MultiModalProcessor {
  constructor() {
    this.sceneEncoder = new SceneGraphEncoder();
    this.gestureEncoder = new GestureSequenceEncoder();
    this.fusionLayer = new CrossAttentionFusion();
  }

  async processSceneTransition(stateBefore, stateAfter) {
    try {
      // Encode scene states
      const beforeEncoding = this.sceneEncoder.encode(stateBefore);
      const afterEncoding = this.sceneEncoder.encode(stateAfter);
      
      // Calculate transition features
      const transitionFeatures = this.calculateTransitionFeatures(
        beforeEncoding,
        afterEncoding
      );
      
      return transitionFeatures;
    } catch (error) {
      logger.error('Error processing scene transition:', error);
      return null;
    }
  }

  async processGestureSequence(gestureData) {
    try {
      // Encode gesture sequence
      const encoding = this.gestureEncoder.encode(gestureData);
      
      return encoding;
    } catch (error) {
      logger.error('Error processing gesture sequence:', error);
      return null;
    }
  }

  async fuseModalities(sceneFeatures, gestureFeatures) {
    try {
      // Fuse scene and gesture features
      const fusedFeatures = this.fusionLayer.fuse(sceneFeatures, gestureFeatures);
      
      return fusedFeatures;
    } catch (error) {
      logger.error('Error fusing modalities:', error);
      return null;
    }
  }

  calculateTransitionFeatures(beforeEncoding, afterEncoding) {
    // Calculate differences and changes
    const features = {
      object_count_change: afterEncoding.object_count - beforeEncoding.object_count,
      total_movement: this.calculateTotalMovement(beforeEncoding, afterEncoding),
      rotation_change: this.calculateRotationChange(beforeEncoding, afterEncoding),
      scale_change: this.calculateScaleChange(beforeEncoding, afterEncoding),
      complexity_change: afterEncoding.scene_complexity - beforeEncoding.scene_complexity
    };
    
    return features;
  }

  calculateTotalMovement(before, after) {
    let totalMovement = 0;
    
    // Match objects by ID and calculate position changes
    if (before.objects && after.objects) {
      before.objects.forEach(objBefore => {
        const objAfter = after.objects.find(o => o.id === objBefore.id);
        if (objAfter) {
          const dx = objAfter.position.x - objBefore.position.x;
          const dy = objAfter.position.y - objBefore.position.y;
          const dz = objAfter.position.z - objBefore.position.z;
          totalMovement += Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
      });
    }
    
    return totalMovement;
  }

  calculateRotationChange(before, after) {
    let totalRotation = 0;
    
    if (before.objects && after.objects) {
      before.objects.forEach(objBefore => {
        const objAfter = after.objects.find(o => o.id === objBefore.id);
        if (objAfter) {
          const dx = objAfter.rotation.x - objBefore.rotation.x;
          const dy = objAfter.rotation.y - objBefore.rotation.y;
          const dz = objAfter.rotation.z - objBefore.rotation.z;
          totalRotation += Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
        }
      });
    }
    
    return totalRotation;
  }

  calculateScaleChange(before, after) {
    let totalScale = 0;
    
    if (before.objects && after.objects) {
      before.objects.forEach(objBefore => {
        const objAfter = after.objects.find(o => o.id === objBefore.id);
        if (objAfter) {
          const dx = objAfter.scale.x - objBefore.scale.x;
          const dy = objAfter.scale.y - objBefore.scale.y;
          const dz = objAfter.scale.z - objBefore.scale.z;
          totalScale += Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
        }
      });
    }
    
    return totalScale;
  }
}

// Scene Graph Encoder
class SceneGraphEncoder {
  encode(sceneState) {
    if (!sceneState) {
      return {
        object_count: 0,
        scene_complexity: 0,
        objects: []
      };
    }
    
    const encoding = {
      object_count: sceneState.objects ? sceneState.objects.length : 0,
      scene_complexity: this.calculateComplexity(sceneState),
      objects: this.encodeObjects(sceneState.objects || []),
      camera: this.encodeCamera(sceneState.camera),
      timestamp: sceneState.timestamp
    };
    
    return encoding;
  }

  calculateComplexity(sceneState) {
    if (!sceneState.objects) return 0;
    
    let complexity = sceneState.objects.length;
    
    // Add complexity for object types
    sceneState.objects.forEach(obj => {
      if (obj.type === 'torus' || obj.type === 'complex') {
        complexity += 2;
      }
    });
    
    return Math.min(complexity, 10);
  }

  encodeObjects(objects) {
    return objects.map(obj => ({
      id: obj.id,
      type: obj.type,
      position: obj.position || { x: 0, y: 0, z: 0 },
      rotation: obj.rotation || { x: 0, y: 0, z: 0 },
      scale: obj.scale || { x: 1, y: 1, z: 1 },
      material: obj.material || {}
    }));
  }

  encodeCamera(camera) {
    if (!camera) {
      return {
        position: { x: 5, y: 5, z: 5 },
        rotation: { x: 0, y: 0, z: 0 }
      };
    }
    
    return {
      position: camera.position || { x: 5, y: 5, z: 5 },
      rotation: camera.rotation || { x: 0, y: 0, z: 0 }
    };
  }
}

// Gesture Sequence Encoder
class GestureSequenceEncoder {
  constructor() {
    this.gestureTypes = [
      'TAP', 'DOUBLE_TAP', 'DRAG', 'PINCH', 
      'ROTATE', 'PAN', 'TRIPLE_TAP'
    ];
  }

  encode(gestureData) {
    if (!gestureData) {
      return {
        type_index: -1,
        has_parameters: false,
        parameter_count: 0,
        encoded_vector: new Array(10).fill(0)
      };
    }
    
    const encoding = {
      type_index: this.gestureTypes.indexOf(gestureData.gesture_type),
      has_parameters: !!gestureData.parameters,
      parameter_count: gestureData.parameters ? 
        Object.keys(gestureData.parameters).length : 0,
      encoded_vector: this.createVector(gestureData)
    };
    
    return encoding;
  }

  createVector(gestureData) {
    const vector = new Array(10).fill(0);
    
    // One-hot encoding for gesture type
    const typeIndex = this.gestureTypes.indexOf(gestureData.gesture_type);
    if (typeIndex >= 0 && typeIndex < 7) {
      vector[typeIndex] = 1;
    }
    
    // Add parameter features
    if (gestureData.parameters) {
      if (gestureData.parameters.x !== undefined) {
        vector[7] = gestureData.parameters.x / 1000; // Normalize
      }
      if (gestureData.parameters.y !== undefined) {
        vector[8] = gestureData.parameters.y / 1000; // Normalize
      }
      if (gestureData.parameters.force !== undefined) {
        vector[9] = gestureData.parameters.force;
      }
    }
    
    return vector;
  }
}

// Cross-Attention Fusion Layer
class CrossAttentionFusion {
  fuse(sceneFeatures, gestureFeatures) {
    // Simple fusion for now - can be replaced with neural network
    const fusedFeatures = {
      scene: sceneFeatures,
      gesture: gestureFeatures,
      interaction_score: this.calculateInteractionScore(sceneFeatures, gestureFeatures),
      timestamp: Date.now()
    };
    
    return fusedFeatures;
  }

  calculateInteractionScore(sceneFeatures, gestureFeatures) {
    // Calculate a simple interaction score
    let score = 0;
    
    // Scene complexity contributes to score
    if (sceneFeatures) {
      score += sceneFeatures.scene_complexity * 0.3;
      score += sceneFeatures.object_count * 0.1;
    }
    
    // Gesture complexity contributes to score
    if (gestureFeatures) {
      score += gestureFeatures.parameter_count * 0.2;
      if (gestureFeatures.type_index >= 3) { // Complex gestures
        score += 2;
      }
    }
    
    return Math.min(score, 10);
  }
}

export default MultiModalProcessor;
