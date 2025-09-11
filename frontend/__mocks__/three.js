// Manual mock for Three.js - using regular functions for constructors
// Only mock the methods, not the constructors themselves

function MockScene() {
  this.isScene = true;
  this.type = 'Scene';
  this.background = null;
  this.fog = null;
  this.children = [];
  this.add = jest.fn();
  this.remove = jest.fn();
  this.traverse = jest.fn();
}

function MockPerspectiveCamera(fov, aspect, near, far) {
  this.isPerspectiveCamera = true;
  this.fov = fov || 75;
  this.aspect = aspect || 1;
  this.near = near || 0.1;
  this.far = far || 1000;
  this.position = {
    x: 0,
    y: 0,
    z: 0,
    set: jest.fn(function(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    })
  };
  this.lookAt = jest.fn();
  this.updateProjectionMatrix = jest.fn();
}

function MockWebGLRenderer(params) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  
  this.domElement = canvas;
  this.setSize = jest.fn();
  this.setPixelRatio = jest.fn();
  this.setClearColor = jest.fn();
  this.render = jest.fn();
  this.dispose = jest.fn();
  this.shadowMap = { enabled: false, type: 2 };
}

function MockColor(color) {
  this.r = 1;
  this.g = 1;
  this.b = 1;
  this.isColor = true;
}

function MockFog(color, near, far) {
  this.color = color;
  this.near = near;
  this.far = far;
}

function MockLight(color, intensity) {
  this.color = color;
  this.intensity = intensity;
  this.position = {
    set: jest.fn(),
    x: 0,
    y: 0,
    z: 0
  };
  this.castShadow = false;
  this.shadow = {
    camera: {
      far: 50,
      left: -10,
      right: 10,
      top: 10,
      bottom: -10
    }
  };
}

function MockMesh(geometry, material) {
  this.geometry = geometry;
  this.material = material;
  this.position = {
    set: jest.fn(),
    x: 0,
    y: 0,
    z: 0
  };
  this.rotation = { x: 0, y: 0, z: 0 };
  this.castShadow = false;
  this.receiveShadow = false;
  this.userData = {};
}

function MockGeometry() {
  this.type = 'Geometry';
}

function MockMaterial(params) {
  this.type = 'Material';
  this.color = params?.color;
}

function MockGridHelper(size, divisions) {
  this.type = 'GridHelper';
  this.size = size;
  this.divisions = divisions;
}

function MockAxesHelper(size) {
  this.type = 'AxesHelper';
  this.size = size;
}

function MockVector3(x, y, z) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.set = jest.fn(function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  });
}

// Create the THREE namespace with spied constructors
const THREE = {
  Scene: jest.fn(MockScene),
  PerspectiveCamera: jest.fn(MockPerspectiveCamera),
  WebGLRenderer: jest.fn(MockWebGLRenderer),
  Color: jest.fn(MockColor),
  Fog: jest.fn(MockFog),
  AmbientLight: jest.fn(MockLight),
  DirectionalLight: jest.fn(MockLight),
  PointLight: jest.fn(MockLight),
  SpotLight: jest.fn(MockLight),
  Mesh: jest.fn(MockMesh),
  BoxGeometry: jest.fn(MockGeometry),
  SphereGeometry: jest.fn(MockGeometry),
  CylinderGeometry: jest.fn(MockGeometry),
  ConeGeometry: jest.fn(MockGeometry),
  PlaneGeometry: jest.fn(MockGeometry),
  MeshBasicMaterial: jest.fn(MockMaterial),
  MeshLambertMaterial: jest.fn(MockMaterial),
  MeshPhongMaterial: jest.fn(MockMaterial),
  MeshStandardMaterial: jest.fn(MockMaterial),
  GridHelper: jest.fn(MockGridHelper),
  AxesHelper: jest.fn(MockAxesHelper),
  Vector3: jest.fn(MockVector3),
  MathUtils: {
    generateUUID: jest.fn(() => 'test-uuid-' + Math.random()),
  },
  PCFSoftShadowMap: 2,
  TOUCH: {
    ROTATE: 0,
    DOLLY_PAN: 1,
  },
};

export default THREE;
