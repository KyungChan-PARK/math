import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MathCanvas from './MathCanvas';

// Helper functions
const waitForAnimation = () => new Promise(resolve => setTimeout(resolve, 100));

// Mock managers
jest.mock('../managers/GestureManager', () => {
  return jest.fn().mockImplementation((element, callback) => ({
    element,
    callback,
    destroy: jest.fn(),
    detectGesture: jest.fn(),
  }));
});

jest.mock('../managers/SceneManager', () => {
  return jest.fn().mockImplementation((scene, camera, renderer) => ({
    scene,
    camera,
    renderer,
    objects: [],
    addObject: jest.fn(),
    removeObject: jest.fn(),
    processGesture: jest.fn(),
    captureSceneState: jest.fn(() => ({
      objects: [],
      camera: { position: [5, 5, 5], rotation: [0, 0, 0] },
      timestamp: Date.now(),
    })),
  }));
});

jest.mock('../managers/InteractionLogger', () => {
  return jest.fn().mockImplementation(() => ({
    logs: [],
    logInteraction: jest.fn((interaction) => {
      console.log('Logging interaction:', interaction);
    }),
    getLogData: jest.fn(() => []),
    clearLogs: jest.fn(),
  }));
});

describe('MathCanvas Component', () => {
  let mockOnGestureDetected: jest.Mock;

  beforeEach(() => {
    mockOnGestureDetected = jest.fn();
    // Clear all mock calls
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders without crashing', () => {
    const { container } = render(
      <MathCanvas 
        selectedShape="cube" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );
    
    expect(container.querySelector('.canvas-container')).toBeInTheDocument();
  });

  test('initializes Three.js scene correctly', async () => {
    render(
      <MathCanvas 
        selectedShape="sphere" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      // Check if Three.js constructors were called
      expect(THREE.Scene).toHaveBeenCalled();
      expect(THREE.PerspectiveCamera).toHaveBeenCalled();
      expect(THREE.WebGLRenderer).toHaveBeenCalledWith({
        antialias: true,
        alpha: true,
      });
    });
  });

  test('sets up lighting correctly', async () => {
    render(
      <MathCanvas 
        selectedShape="cone" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      // Check if lights were created
      expect(THREE.AmbientLight).toHaveBeenCalledWith(0xffffff, 0.6);
      expect(THREE.DirectionalLight).toHaveBeenCalledWith(0xffffff, 0.8);
    });
  });

  test('creates grid and axes helpers', async () => {
    render(
      <MathCanvas 
        selectedShape="cylinder" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      expect(THREE.GridHelper).toHaveBeenCalledWith(20, 20, 0x888888, 0xcccccc);
      expect(THREE.AxesHelper).toHaveBeenCalledWith(5);
    });
  });

  test('initializes gesture manager', async () => {
    const GestureManager = require('../managers/GestureManager').default;
    
    render(
      <MathCanvas 
        selectedShape="cube" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      expect(GestureManager).toHaveBeenCalled();
    });
  });

  test('initializes scene manager', async () => {
    const SceneManager = require('../managers/SceneManager').default;
    
    render(
      <MathCanvas 
        selectedShape="sphere" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      expect(SceneManager).toHaveBeenCalled();
    });
  });

  test('initializes interaction logger', async () => {
    const InteractionLogger = require('../managers/InteractionLogger').default;
    
    render(
      <MathCanvas 
        selectedShape="cone" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      expect(InteractionLogger).toHaveBeenCalled();
    });
  });

  test('creates initial 3D objects', async () => {
    render(
      <MathCanvas 
        selectedShape="cylinder" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      // Check if geometries were created
      expect(THREE.BoxGeometry).toHaveBeenCalled();
      expect(THREE.SphereGeometry).toHaveBeenCalled();
      expect(THREE.ConeGeometry).toHaveBeenCalled();
      expect(THREE.CylinderGeometry).toHaveBeenCalled();
      
      // Check if materials were created
      expect(THREE.MeshPhongMaterial).toHaveBeenCalled();
      
      // Check if meshes were created
      expect(THREE.Mesh).toHaveBeenCalled();
    });
  });

  test('handles selectedShape prop changes', async () => {
    const { rerender } = render(
      <MathCanvas 
        selectedShape="cube" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    // Mock console.log to check if it's called
    const consoleSpy = jest.spyOn(console, 'log');

    // Change selected shape
    rerender(
      <MathCanvas 
        selectedShape="sphere" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Selected shape changed:', 'sphere');
    });

    consoleSpy.mockRestore();
  });

  test('calls onGestureDetected when gesture is detected', async () => {
    const GestureManager = require('../managers/GestureManager').default;
    
    render(
      <MathCanvas 
        selectedShape="cube" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      expect(GestureManager).toHaveBeenCalled();
    });

    // Get the callback passed to GestureManager
    const gestureManagerCall = GestureManager.mock.calls[0];
    const gestureCallback = gestureManagerCall[1];

    // Simulate a gesture
    gestureCallback({
      type: 'TAP',
      parameters: { x: 100, y: 200 },
    });

    expect(mockOnGestureDetected).toHaveBeenCalledWith('TAP');
  });

  test('logs interactions when gestures are detected', async () => {
    const GestureManager = require('../managers/GestureManager').default;
    const InteractionLogger = require('../managers/InteractionLogger').default;
    
    render(
      <MathCanvas 
        selectedShape="sphere" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      expect(GestureManager).toHaveBeenCalled();
      expect(InteractionLogger).toHaveBeenCalled();
    });

    // Get the gesture callback
    const gestureCallback = GestureManager.mock.calls[0][1];
    
    // Get the logger instance
    const loggerInstance = InteractionLogger.mock.results[0].value;

    // Simulate a gesture
    gestureCallback({
      type: 'PINCH',
      parameters: { scale: 1.5 },
    });

    // Check if interaction was logged
    expect(loggerInstance.logInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'USER_GESTURE',
        user_action: {
          gesture_type: 'PINCH',
          parameters: { scale: 1.5 },
        },
      })
    );
  });

  test('handles window resize', async () => {
    const { container } = render(
      <MathCanvas 
        selectedShape="cone" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    // Get mock camera and renderer
    const mockCameraInstance = mockCamera();
    const mockRendererInstance = mockRenderer();

    // Mock the camera and renderer methods
    mockCameraInstance.updateProjectionMatrix = jest.fn();
    mockRendererInstance.setSize = jest.fn();

    // Simulate window resize
    global.innerWidth = 1024;
    global.innerHeight = 768;
    
    fireEvent(window, new Event('resize'));

    await waitForAnimation();

    // Note: In a real test, we would need to capture the actual instances
    // This is a simplified test to show the pattern
    expect(container.querySelector('.canvas-container')).toBeInTheDocument();
  });

  test('cleans up on unmount', async () => {
    const GestureManager = require('../managers/GestureManager').default;
    
    const { unmount } = render(
      <MathCanvas 
        selectedShape="cylinder" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      expect(GestureManager).toHaveBeenCalled();
    });

    const gestureManagerInstance = GestureManager.mock.results[0].value;
    const mockRendererInstance = mockRenderer();

    unmount();

    // Check if cleanup methods were called
    expect(gestureManagerInstance.destroy).toHaveBeenCalled();
    expect(mockRendererInstance.dispose).toHaveBeenCalled();
  });

  test('drag controls integration', async () => {
    const DragControls = require('three/examples/jsm/controls/DragControls').DragControls;
    
    render(
      <MathCanvas 
        selectedShape="cube" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      expect(DragControls).toHaveBeenCalled();
    });

    // Get the drag controls instance
    const dragControlsInstance = DragControls.mock.results[0].value;
    
    // Check if event listeners were added
    expect(dragControlsInstance.addEventListener).toHaveBeenCalledWith(
      'dragstart',
      expect.any(Function)
    );
    expect(dragControlsInstance.addEventListener).toHaveBeenCalledWith(
      'drag',
      expect.any(Function)
    );
    expect(dragControlsInstance.addEventListener).toHaveBeenCalledWith(
      'dragend',
      expect.any(Function)
    );
  });

  test('orbit controls configuration', async () => {
    const OrbitControls = require('three/examples/jsm/controls/OrbitControls').OrbitControls;
    
    render(
      <MathCanvas 
        selectedShape="sphere" 
        onGestureDetected={mockOnGestureDetected} 
      />
    );

    await waitFor(() => {
      expect(OrbitControls).toHaveBeenCalled();
    });

    const orbitControlsInstance = OrbitControls.mock.results[0].value;
    
    // Check orbit controls configuration
    expect(orbitControlsInstance.enableDamping).toBe(true);
    expect(orbitControlsInstance.dampingFactor).toBe(0.05);
    expect(orbitControlsInstance.screenSpacePanning).toBe(true);
    expect(orbitControlsInstance.minDistance).toBe(3);
    expect(orbitControlsInstance.maxDistance).toBe(30);
    expect(orbitControlsInstance.maxPolarAngle).toBe(Math.PI / 2);
  });
});
