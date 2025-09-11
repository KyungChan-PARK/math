// Mock for three/examples/jsm/controls/OrbitControls
export default class OrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.enabled = true;
    this.enableDamping = true;
    this.dampingFactor = 0.05;
    this.screenSpacePanning = true;
    this.minDistance = 3;
    this.maxDistance = 30;
    this.maxPolarAngle = Math.PI / 2;
    this.touches = {};
  }

  update = jest.fn();
  dispose = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  saveState = jest.fn();
  reset = jest.fn();
  getPolarAngle = jest.fn(() => 0);
  getAzimuthalAngle = jest.fn(() => 0);
}

// Mock for three/examples/jsm/controls/DragControls
export class DragControls {
  constructor(objects, camera, domElement) {
    this.objects = objects;
    this.camera = camera;
    this.domElement = domElement;
    this.enabled = true;
  }

  addEventListener = jest.fn((type, callback) => {
    // Store callbacks for testing
    if (!this._callbacks) {
      this._callbacks = {};
    }
    if (!this._callbacks[type]) {
      this._callbacks[type] = [];
    }
    this._callbacks[type].push(callback);
  });

  removeEventListener = jest.fn();
  dispose = jest.fn();
  activate = jest.fn();
  deactivate = jest.fn();
  
  // Helper method for testing
  _trigger(type, event) {
    if (this._callbacks && this._callbacks[type]) {
      this._callbacks[type].forEach(cb => cb(event));
    }
  }
}
