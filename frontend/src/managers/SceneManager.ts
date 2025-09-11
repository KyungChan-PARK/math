// SceneManager.ts - 3D scene management and object manipulation
import * as THREE from 'three';
import { GestureData } from './GestureManager';

interface SceneObject {
  id: string;
  mesh: THREE.Mesh;
  type: string;
  createdAt: number;
  lastModified: number;
}

interface SceneState {
  objects: Array<{
    id: string;
    type: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
    material: {
      color: string;
      opacity: number;
    };
  }>;
  camera: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
  };
  timestamp: number;
}

class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private objects: Map<string, SceneObject>;
  private selectedObject: THREE.Mesh | null = null;
  
  // Materials for different shapes
  private materials = {
    default: new THREE.MeshPhongMaterial({ color: 0x667eea }),
    selected: new THREE.MeshPhongMaterial({ color: 0xffd700 }),
    hover: new THREE.MeshPhongMaterial({ color: 0x764ba2 }),
    transparent: new THREE.MeshPhongMaterial({ 
      color: 0x667eea, 
      transparent: true, 
      opacity: 0.5 
    })
  };
  
  constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.objects = new Map();
  }
  
  public addObject(mesh: THREE.Mesh): void {
    const id = mesh.userData.id || THREE.MathUtils.generateUUID();
    const sceneObject: SceneObject = {
      id,
      mesh,
      type: mesh.userData.type || 'unknown',
      createdAt: Date.now(),
      lastModified: Date.now()
    };
    
    this.objects.set(id, sceneObject);
  }
  
  public removeObject(id: string): boolean {
    const object = this.objects.get(id);
    if (object) {
      this.scene.remove(object.mesh);
      if (object.mesh.geometry) object.mesh.geometry.dispose();
      if (object.mesh.material) {
        if (Array.isArray(object.mesh.material)) {
          object.mesh.material.forEach(material => material.dispose());
        } else {
          object.mesh.material.dispose();
        }
      }
      this.objects.delete(id);
      return true;
    }
    return false;
  }
  
  public createShape(type: string, position?: THREE.Vector3): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    
    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.7, 32, 16);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(0.5, 1.5, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(0.7, 0.3, 16, 100);
        break;
      case 'pyramid':
        geometry = new THREE.ConeGeometry(1, 1.5, 4);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    
    const material = this.materials.default.clone();
    const mesh = new THREE.Mesh(geometry, material);
    
    if (position) {
      mesh.position.copy(position);
    } else {
      mesh.position.set(
        (Math.random() - 0.5) * 8,
        1,
        (Math.random() - 0.5) * 8
      );
    }
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      id: THREE.MathUtils.generateUUID(),
      type: 'shape',
      shapeType: type,
      createdAt: Date.now()
    };
    
    this.scene.add(mesh);
    this.addObject(mesh);
    
    return mesh;
  }
  
  public processGesture(gestureData: GestureData): void {
    switch (gestureData.type) {
      case 'TAP':
        this.handleTap(gestureData.parameters);
        break;
      case 'DOUBLE_TAP':
        this.handleDoubleTap(gestureData.parameters);
        break;
      case 'DRAG':
        this.handleDrag(gestureData.parameters);
        break;
      case 'PINCH':
        this.handlePinch(gestureData.parameters);
        break;
      case 'ROTATE':
        this.handleRotate(gestureData.parameters);
        break;
      case 'PAN':
        this.handlePan(gestureData.parameters);
        break;
      case 'TRIPLE_TAP':
        this.resetScene();
        break;
    }
  }
  
  private handleTap(params: any): void {
    // Ray casting to select object
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    mouse.x = (params.x / window.innerWidth) * 2 - 1;
    mouse.y = -(params.y / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, this.camera);
    
    const meshes = Array.from(this.objects.values()).map(obj => obj.mesh);
    const intersects = raycaster.intersectObjects(meshes);
    
    if (intersects.length > 0) {
      this.selectObject(intersects[0].object as THREE.Mesh);
    } else {
      this.deselectObject();
    }
  }
  
  private handleDoubleTap(params: any): void {
    // Create new object at tap position
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    mouse.x = (params.x / window.innerWidth) * 2 - 1;
    mouse.y = -(params.y / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, this.camera);
    
    // Create a plane at y=0 for intersection
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    // Create a random shape at the intersection point
    const shapes = ['cube', 'sphere', 'cylinder', 'cone', 'torus'];
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    this.createShape(randomShape, intersection);
  }
  
  private handleDrag(params: any): void {
    if (!this.selectedObject) return;
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    mouse.x = (params.x / window.innerWidth) * 2 - 1;
    mouse.y = -(params.y / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, this.camera);
    
    // Create a plane at the object's y position
    const plane = new THREE.Plane(
      new THREE.Vector3(0, 1, 0), 
      -this.selectedObject.position.y
    );
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    this.selectedObject.position.x = intersection.x;
    this.selectedObject.position.z = intersection.z;
  }
  
  private handlePinch(params: any): void {
    if (!this.selectedObject) return;
    
    const scaleFactor = params.scaleFactor;
    this.selectedObject.scale.multiplyScalar(scaleFactor);
    
    // Clamp scale to reasonable bounds
    const maxScale = 5;
    const minScale = 0.1;
    this.selectedObject.scale.clampScalar(minScale, maxScale);
  }
  
  private handleRotate(params: any): void {
    if (!this.selectedObject) return;
    
    const rotation = params.rotation * (Math.PI / 180); // Convert to radians
    this.selectedObject.rotation.y += rotation;
  }
  
  private handlePan(params: any): void {
    // Pan the camera instead of objects
    const panSpeed = 0.01;
    this.camera.position.x += (params.centerX - window.innerWidth / 2) * panSpeed;
    this.camera.position.z += (params.centerY - window.innerHeight / 2) * panSpeed;
  }
  
  private selectObject(mesh: THREE.Mesh): void {
    // Deselect previous object
    if (this.selectedObject) {
      const prevObject = this.objects.get(this.selectedObject.userData.id);
      if (prevObject) {
        prevObject.mesh.material = this.materials.default.clone();
      }
    }
    
    // Select new object
    this.selectedObject = mesh;
    mesh.material = this.materials.selected.clone();
    
    // Add selection outline
    const outline = new THREE.BoxHelper(mesh, 0xffd700);
    outline.name = 'selection_outline';
    this.scene.add(outline);
  }
  
  private deselectObject(): void {
    if (this.selectedObject) {
      this.selectedObject.material = this.materials.default.clone();
      this.selectedObject = null;
      
      // Remove selection outline
      const outline = this.scene.getObjectByName('selection_outline');
      if (outline) {
        this.scene.remove(outline);
      }
    }
  }
  
  private resetScene(): void {
    // Reset camera position
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
    
    // Reset all objects to default position
    this.objects.forEach(obj => {
      obj.mesh.position.set(
        (Math.random() - 0.5) * 8,
        1,
        (Math.random() - 0.5) * 8
      );
      obj.mesh.rotation.set(0, 0, 0);
      obj.mesh.scale.set(1, 1, 1);
    });
  }
  
  public captureSceneState(): SceneState {
    const objects = Array.from(this.objects.values()).map(obj => {
      const mesh = obj.mesh;
      const material = mesh.material as THREE.MeshPhongMaterial;
      
      return {
        id: obj.id,
        type: obj.type,
        position: {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z
        },
        rotation: {
          x: mesh.rotation.x,
          y: mesh.rotation.y,
          z: mesh.rotation.z
        },
        scale: {
          x: mesh.scale.x,
          y: mesh.scale.y,
          z: mesh.scale.z
        },
        material: {
          color: '#' + material.color.getHexString(),
          opacity: material.opacity
        }
      };
    });
    
    return {
      objects,
      camera: {
        position: {
          x: this.camera.position.x,
          y: this.camera.position.y,
          z: this.camera.position.z
        },
        rotation: {
          x: this.camera.rotation.x,
          y: this.camera.rotation.y,
          z: this.camera.rotation.z
        }
      },
      timestamp: Date.now()
    };
  }
  
  public restoreSceneState(state: SceneState): void {
    // Clear existing objects
    this.objects.forEach(obj => {
      this.scene.remove(obj.mesh);
    });
    this.objects.clear();
    
    // Restore objects from state
    state.objects.forEach(objData => {
      let geometry: THREE.BufferGeometry;
      
      // Recreate geometry based on type
      switch (objData.type) {
        case 'cube':
          geometry = new THREE.BoxGeometry(1, 1, 1);
          break;
        case 'sphere':
          geometry = new THREE.SphereGeometry(0.7, 32, 16);
          break;
        default:
          geometry = new THREE.BoxGeometry(1, 1, 1);
      }
      
      const material = new THREE.MeshPhongMaterial({
        color: objData.material.color,
        opacity: objData.material.opacity
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
      mesh.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z);
      mesh.scale.set(objData.scale.x, objData.scale.y, objData.scale.z);
      mesh.userData = {
        id: objData.id,
        type: objData.type
      };
      
      this.scene.add(mesh);
      this.addObject(mesh);
    });
    
    // Restore camera
    this.camera.position.set(
      state.camera.position.x,
      state.camera.position.y,
      state.camera.position.z
    );
    this.camera.rotation.set(
      state.camera.rotation.x,
      state.camera.rotation.y,
      state.camera.rotation.z
    );
  }
}

export default SceneManager;
