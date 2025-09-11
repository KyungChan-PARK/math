import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import GestureManager from '../managers/GestureManager';
import SceneManager from '../managers/SceneManager';
import InteractionLogger from '../managers/InteractionLogger';

interface MathCanvasProps {
  selectedShape: string;
  onGestureDetected: (gesture: string) => void;
}

const MathCanvas: React.FC<MathCanvasProps> = ({ selectedShape, onGestureDetected }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const gestureManagerRef = useRef<GestureManager | null>(null);
  const loggerRef = useRef<InteractionLogger | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    scene.fog = new THREE.Fog(0xf0f0f0, 1, 100);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Initialize OrbitControls for camera movement
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.screenSpacePanning = true;
    orbitControls.minDistance = 3;
    orbitControls.maxDistance = 30;
    orbitControls.maxPolarAngle = Math.PI / 2;

    // Touch-specific settings for OrbitControls
    orbitControls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    // Initialize managers
    const sceneManager = new SceneManager(scene, camera, renderer);
    sceneRef.current = sceneManager;

    // Create interaction logger
    const logger = new InteractionLogger();
    loggerRef.current = logger;

    // Initialize gesture manager
    const gestureManager = new GestureManager(
      renderer.domElement,
      (gestureData) => {
        onGestureDetected(gestureData.type);
        
        // Log interaction
        if (loggerRef.current) {
          const scene_state_before = sceneManager.captureSceneState();
          
          // Process gesture
          sceneManager.processGesture(gestureData);
          
          // Capture state after processing
          const scene_state_after = sceneManager.captureSceneState();
          
          loggerRef.current.logInteraction({
            event_type: 'USER_GESTURE',
            user_action: {
              gesture_type: gestureData.type,
              parameters: gestureData.parameters
            },
            scene_state_before,
            scene_state_after
          });
        }
      }
    );
    gestureManagerRef.current = gestureManager;

    // Add initial shapes for demonstration
    const geometries = [
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.SphereGeometry(0.7, 32, 16),
      new THREE.ConeGeometry(0.5, 1.5, 32),
      new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32)
    ];

    const materials = [
      new THREE.MeshPhongMaterial({ color: 0x667eea }),
      new THREE.MeshPhongMaterial({ color: 0x764ba2 }),
      new THREE.MeshPhongMaterial({ color: 0xf093fb }),
      new THREE.MeshPhongMaterial({ color: 0xf5576c })
    ];

    // Add a few initial objects
    const initialObjects: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 2,
        (Math.random() - 0.5) * 8
      );
      
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = {
        id: THREE.MathUtils.generateUUID(),
        type: 'shape',
        createdAt: Date.now()
      };
      
      scene.add(mesh);
      initialObjects.push(mesh);
      sceneManager.addObject(mesh);
    }

    // Setup drag controls for objects
    const dragControls = new DragControls(
      initialObjects,
      camera,
      renderer.domElement
    );

    dragControls.addEventListener('dragstart', (event) => {
      orbitControls.enabled = false;
      if (event.object.userData) {
        console.log('Drag started:', event.object.userData.id);
      }
    });

    dragControls.addEventListener('drag', (event) => {
      if (event.object.userData) {
        // Update position in real-time
        event.object.position.y = Math.max(0.5, event.object.position.y);
      }
    });

    dragControls.addEventListener('dragend', (event) => {
      orbitControls.enabled = true;
      if (event.object.userData && loggerRef.current) {
        console.log('Drag ended:', event.object.userData.id);
        // Log the drag interaction
        loggerRef.current.logInteraction({
          event_type: 'USER_GESTURE',
          user_action: {
            gesture_type: 'DRAG_END',
            parameters: {
              objectId: event.object.userData.id,
              position: event.object.position
            }
          },
          scene_state_before: {},
          scene_state_after: sceneManager.captureSceneState()
        });
      }
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      orbitControls.update();
      
      // Rotate objects slowly for visual effect
      initialObjects.forEach((object, index) => {
        object.rotation.y += 0.001 * (index + 1);
      });
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      
      if (gestureManagerRef.current) {
        gestureManagerRef.current.destroy();
      }
    };
  }, [onGestureDetected]);

  // Handle shape creation based on selected shape
  useEffect(() => {
    if (sceneRef.current && selectedShape) {
      console.log('Selected shape changed:', selectedShape);
      // This will be used for creating new shapes
    }
  }, [selectedShape]);

  return (
    <div 
      ref={mountRef} 
      className="canvas-container"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};

export default MathCanvas;
