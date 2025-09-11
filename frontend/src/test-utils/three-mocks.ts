// Complete Three.js mocking for Jest tests

// Mock WebGL context
export const mockWebGLContext = {
  canvas: {
    width: 800,
    height: 600,
    style: {},
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    clientWidth: 800,
    clientHeight: 600,
    getContext: jest.fn(() => mockWebGLContext),
  },
  getExtension: jest.fn(),
  getParameter: jest.fn(() => 16384),
  createShader: jest.fn(() => ({})),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  getShaderParameter: jest.fn(() => true),
  createProgram: jest.fn(() => ({})),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  getProgramParameter: jest.fn(() => true),
  useProgram: jest.fn(),
  createBuffer: jest.fn(() => ({})),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  createTexture: jest.fn(() => ({})),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  texParameteri: jest.fn(),
  createFramebuffer: jest.fn(() => ({})),
  bindFramebuffer: jest.fn(),
  framebufferTexture2D: jest.fn(),
  createRenderbuffer: jest.fn(() => ({})),
  bindRenderbuffer: jest.fn(),
  renderbufferStorage: jest.fn(),
  framebufferRenderbuffer: jest.fn(),
  checkFramebufferStatus: jest.fn(() => 36053),
  viewport: jest.fn(),
  clear: jest.fn(),
  clearColor: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  depthFunc: jest.fn(),
  blendFunc: jest.fn(),
  getUniformLocation: jest.fn(() => ({})),
  getAttribLocation: jest.fn(() => 0),
  uniform1f: jest.fn(),
  uniform2f: jest.fn(),
  uniform3f: jest.fn(),
  uniform4f: jest.fn(),
  uniform1i: jest.fn(),
  uniform2i: jest.fn(),
  uniform3i: jest.fn(),
  uniform4i: jest.fn(),
  uniformMatrix3fv: jest.fn(),
  uniformMatrix4fv: jest.fn(),
  vertexAttribPointer: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  disableVertexAttribArray: jest.fn(),
  drawArrays: jest.fn(),
  drawElements: jest.fn(),
  scissor: jest.fn(),
  deleteTexture: jest.fn(),
  deleteBuffer: jest.fn(),
  deleteProgram: jest.fn(),
  deleteShader: jest.fn(),
  deleteFramebuffer: jest.fn(),
  deleteRenderbuffer: jest.fn(),
  readPixels: jest.fn(),
  getError: jest.fn(() => 0),
  TEXTURE_2D: 3553,
  TEXTURE_CUBE_MAP: 34067,
  DEPTH_TEST: 2929,
  LEQUAL: 515,
  COLOR_BUFFER_BIT: 16384,
  DEPTH_BUFFER_BIT: 256,
  STENCIL_BUFFER_BIT: 1024,
  MAX_TEXTURE_SIZE: 3379,
  FRAMEBUFFER: 36160,
  FRAMEBUFFER_COMPLETE: 36053,
  ARRAY_BUFFER: 34962,
  ELEMENT_ARRAY_BUFFER: 34963,
  STATIC_DRAW: 35044,
  FLOAT: 5126,
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
};

// Helper function to create a mock THREE class
const createMockClass = (name: string, props: any = {}) => {
  const MockClass = jest.fn(function(this: any, ...args: any[]) {
    Object.assign(this, {
      isObject3D: true,
      uuid: Math.random().toString(36).substr(2, 9),
      name: '',
      type: name,
      parent: null,
      children: [],
      up: { x: 0, y: 1, z: 0 },
      position: { x: 0, y: 0, z: 0, set: jest.fn() },
      rotation: { x: 0, y: 0, z: 0, set: jest.fn() },
      scale: { x: 1, y: 1, z: 1, set: jest.fn() },
      quaternion: { x: 0, y: 0, z: 0, w: 1, set: jest.fn() },
      matrix: { elements: new Float32Array(16) },
      matrixWorld: { elements: new Float32Array(16) },
      visible: true,
      castShadow: false,
      receiveShadow: false,
      frustumCulled: true,
      renderOrder: 0,
      userData: {},
      add: jest.fn(function(this: any, object: any) {
        if (object && object.parent !== this) {
          if (object.parent) {
            object.parent.remove(object);
          }
          object.parent = this;
          this.children.push(object);
        }
        return this;
      }),
      remove: jest.fn(function(this: any, object: any) {
        const index = this.children.indexOf(object);
        if (index !== -1) {
          object.parent = null;
          this.children.splice(index, 1);
        }
        return this;
      }),
      clear: jest.fn(function(this: any) {
        for (let i = this.children.length - 1; i >= 0; i--) {
          this.remove(this.children[i]);
        }
        return this;
      }),
      getObjectByName: jest.fn(),
      getObjectById: jest.fn(),
      traverse: jest.fn(),
      traverseVisible: jest.fn(),
      traverseAncestors: jest.fn(),
      updateMatrix: jest.fn(),
      updateMatrixWorld: jest.fn(),
      lookAt: jest.fn(),
      raycast: jest.fn(),
      clone: jest.fn(),
      copy: jest.fn(),
      dispose: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      ...props
    });
  });
  return MockClass;
};

// Mock Vector classes
export const Vector2 = jest.fn(function(this: any, x = 0, y = 0) {
  this.x = x;
  this.y = y;
  this.set = jest.fn((x: number, y: number) => {
    this.x = x;
    this.y = y;
    return this;
  });
  this.clone = jest.fn(() => new Vector2(this.x, this.y));
  this.copy = jest.fn();
  this.add = jest.fn(() => this);
  this.sub = jest.fn(() => this);
  this.multiply = jest.fn(() => this);
  this.divide = jest.fn(() => this);
  this.length = jest.fn(() => Math.sqrt(this.x * this.x + this.y * this.y));
  this.normalize = jest.fn(() => this);
});

export const Vector3 = jest.fn(function(this: any, x = 0, y = 0, z = 0) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.set = jest.fn((x: number, y: number, z: number) => {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  });
  this.clone = jest.fn(() => new Vector3(this.x, this.y, this.z));
  this.copy = jest.fn();
  this.add = jest.fn(() => this);
  this.sub = jest.fn(() => this);
  this.multiply = jest.fn(() => this);
  this.divide = jest.fn(() => this);
  this.length = jest.fn(() => Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z));
  this.normalize = jest.fn(() => this);
  this.cross = jest.fn(() => this);
  this.dot = jest.fn(() => 0);
});

// Mock Matrix classes
export const Matrix4 = jest.fn(function(this: any) {
  this.elements = new Float32Array(16);
  this.set = jest.fn(() => this);
  this.identity = jest.fn(() => this);
  this.clone = jest.fn(() => new Matrix4());
  this.copy = jest.fn(() => this);
  this.multiply = jest.fn(() => this);
  this.premultiply = jest.fn(() => this);
  this.makeRotationFromQuaternion = jest.fn(() => this);
  this.makeRotationFromEuler = jest.fn(() => this);
  this.makeRotationX = jest.fn(() => this);
  this.makeRotationY = jest.fn(() => this);
  this.makeRotationZ = jest.fn(() => this);
  this.makeTranslation = jest.fn(() => this);
  this.makeScale = jest.fn(() => this);
  this.compose = jest.fn(() => this);
  this.decompose = jest.fn(() => this);
  this.invert = jest.fn(() => this);
  this.transpose = jest.fn(() => this);
});

// Mock Quaternion
export const Quaternion = jest.fn(function(this: any, x = 0, y = 0, z = 0, w = 1) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.w = w;
  this.set = jest.fn(() => this);
  this.clone = jest.fn(() => new Quaternion(this.x, this.y, this.z, this.w));
  this.copy = jest.fn(() => this);
  this.setFromAxisAngle = jest.fn(() => this);
  this.setFromRotationMatrix = jest.fn(() => this);
  this.setFromEuler = jest.fn(() => this);
  this.multiply = jest.fn(() => this);
  this.slerp = jest.fn(() => this);
  this.normalize = jest.fn(() => this);
});

// Mock Euler
export const Euler = jest.fn(function(this: any, x = 0, y = 0, z = 0, order = 'XYZ') {
  this.x = x;
  this.y = y;
  this.z = z;
  this.order = order;
  this.set = jest.fn(() => this);
  this.clone = jest.fn(() => new Euler(this.x, this.y, this.z, this.order));
  this.copy = jest.fn(() => this);
  this.setFromQuaternion = jest.fn(() => this);
  this.setFromRotationMatrix = jest.fn(() => this);
});

// Mock Color
export const Color = jest.fn(function(this: any, r = 1, g = 1, b = 1) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.set = jest.fn(() => this);
  this.setHex = jest.fn(() => this);
  this.setRGB = jest.fn(() => this);
  this.setHSL = jest.fn(() => this);
  this.clone = jest.fn(() => new Color(this.r, this.g, this.b));
  this.copy = jest.fn(() => this);
  this.getHex = jest.fn(() => 0xffffff);
});

// Create mock Three.js objects
export const Object3D = createMockClass('Object3D');

export const Scene = jest.fn(function(this: any) {
  this.isScene = true;
  this.type = 'Scene';
  this.background = null;
  this.fog = null;
  this.environment = null;
  this.children = [];
  this.position = { x: 0, y: 0, z: 0, set: jest.fn() };
  this.rotation = { x: 0, y: 0, z: 0, set: jest.fn() };
  this.scale = { x: 1, y: 1, z: 1, set: jest.fn() };
  this.userData = {};
  
  this.add = jest.fn(function(this: any, ...objects: any[]) {
    for (const object of objects) {
      if (object && !this.children.includes(object)) {
        this.children.push(object);
        if (object.parent) {
          object.parent.remove(object);
        }
        object.parent = this;
      }
    }
    return this;
  });
  
  this.remove = jest.fn(function(this: any, ...objects: any[]) {
    for (const object of objects) {
      const index = this.children.indexOf(object);
      if (index !== -1) {
        this.children.splice(index, 1);
        object.parent = null;
      }
    }
    return this;
  });
  
  this.clear = jest.fn(function(this: any) {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const object = this.children[i];
      object.parent = null;
    }
    this.children = [];
    return this;
  });
  
  this.traverse = jest.fn();
  this.traverseVisible = jest.fn();
  this.updateMatrix = jest.fn();
  this.updateMatrixWorld = jest.fn();
});

export const PerspectiveCamera = jest.fn(function(this: any, fov = 75, aspect = 1, near = 0.1, far = 1000) {
  this.isPerspectiveCamera = true;
  this.fov = fov;
  this.aspect = aspect;
  this.near = near;
  this.far = far;
  this.zoom = 1;
  this.focus = 10;
  this.filmGauge = 35;
  this.filmOffset = 0;
  this.position = { 
    x: 0, 
    y: 0, 
    z: 0, 
    set: jest.fn(function(this: any, x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    })
  };
  this.rotation = { x: 0, y: 0, z: 0, set: jest.fn() };
  this.scale = { x: 1, y: 1, z: 1, set: jest.fn() };
  this.lookAt = jest.fn();
  this.updateProjectionMatrix = jest.fn();
  this.setViewOffset = jest.fn();
  this.clearViewOffset = jest.fn();
  this.add = jest.fn();
  this.remove = jest.fn();
  this.traverse = jest.fn();
  this.userData = {};
});

export const OrthographicCamera = createMockClass('OrthographicCamera', {
  isOrthographicCamera: true,
  left: -1,
  right: 1,
  top: 1,
  bottom: -1,
  near: 0.1,
  far: 2000,
  zoom: 1,
  updateProjectionMatrix: jest.fn(),
});

export const WebGLRenderer = jest.fn(function(this: any, parameters: any = {}) {
  const domElement = document.createElement('canvas');
  domElement.width = 800;
  domElement.height = 600;
  domElement.style.width = '800px';
  domElement.style.height = '600px';
  Object.defineProperty(domElement, 'clientWidth', { value: 800 });
  Object.defineProperty(domElement, 'clientHeight', { value: 600 });
  
  this.domElement = domElement;
  this.shadowMap = {
    enabled: false,
    type: 2,
  };
  this.toneMapping = 0;
  this.toneMappingExposure = 1;
  this.outputEncoding = 3000;
  this.physicallyCorrectLights = false;
  this.autoClear = true;
  this.autoClearColor = true;
  this.autoClearDepth = true;
  this.autoClearStencil = true;
  this.sortObjects = true;
  this.clippingPlanes = [];
  this.localClippingEnabled = false;
  this.gammaFactor = 2;
  this.gammaInput = false;
  this.gammaOutput = false;
  this.state = {
    reset: jest.fn(),
  };
  this.setSize = jest.fn();
  this.setPixelRatio = jest.fn();
  this.setViewport = jest.fn();
  this.setScissor = jest.fn();
  this.setScissorTest = jest.fn();
  this.setClearColor = jest.fn();
  this.setClearAlpha = jest.fn();
  this.clear = jest.fn();
  this.render = jest.fn();
  this.renderBufferDirect = jest.fn();
  this.compile = jest.fn();
  this.dispose = jest.fn();
  this.getRenderTarget = jest.fn();
  this.setRenderTarget = jest.fn();
  this.readRenderTargetPixels = jest.fn();
  this.getContext = jest.fn(() => mockWebGLContext);
  this.getContextAttributes = jest.fn(() => ({ alpha: true, antialias: false }));
  this.forceContextLoss = jest.fn();
  this.forceContextRestore = jest.fn();
  this.getPixelRatio = jest.fn(() => 1);
  this.getSize = jest.fn(() => ({ width: 800, height: 600 }));
  this.getDrawingBufferSize = jest.fn(() => ({ width: 800, height: 600 }));
});

// Mock Geometries
const createGeometry = (type: string) => jest.fn(function(this: any, ...args: any[]) {
  this.type = type;
  this.uuid = Math.random().toString(36).substr(2, 9);
  this.name = '';
  this.parameters = {};
  this.attributes = {};
  this.index = null;
  this.morphAttributes = {};
  this.morphTargetsRelative = false;
  this.groups = [];
  this.boundingBox = null;
  this.boundingSphere = null;
  this.drawRange = { start: 0, count: Infinity };
  this.userData = {};
  this.dispose = jest.fn();
  this.setAttribute = jest.fn();
  this.getAttribute = jest.fn();
  this.deleteAttribute = jest.fn();
  this.setIndex = jest.fn();
  this.setDrawRange = jest.fn();
  this.setFromPoints = jest.fn();
  this.computeBoundingBox = jest.fn();
  this.computeBoundingSphere = jest.fn();
  this.computeVertexNormals = jest.fn();
  this.normalizeNormals = jest.fn();
  this.toNonIndexed = jest.fn();
  this.toJSON = jest.fn();
  this.clone = jest.fn();
  this.copy = jest.fn();
});

export const BufferGeometry = createGeometry('BufferGeometry');
export const BoxGeometry = createGeometry('BoxGeometry');
export const SphereGeometry = createGeometry('SphereGeometry');
export const PlaneGeometry = createGeometry('PlaneGeometry');
export const CylinderGeometry = createGeometry('CylinderGeometry');
export const ConeGeometry = createGeometry('ConeGeometry');
export const TorusGeometry = createGeometry('TorusGeometry');

// Mock Materials
const createMaterial = (type: string) => jest.fn(function(this: any, parameters: any = {}) {
  this.type = type;
  this.uuid = Math.random().toString(36).substr(2, 9);
  this.name = '';
  this.color = new Color(1, 1, 1);
  this.opacity = 1;
  this.transparent = false;
  this.blending = 1;
  this.side = 0;
  this.vertexColors = false;
  this.fog = true;
  this.map = null;
  this.alphaMap = null;
  this.envMap = null;
  this.wireframe = false;
  this.wireframeLinewidth = 1;
  this.visible = true;
  this.userData = {};
  this.needsUpdate = false;
  this.dispose = jest.fn();
  this.clone = jest.fn();
  this.copy = jest.fn();
  Object.assign(this, parameters);
});

export const Material = createMaterial('Material');
export const MeshBasicMaterial = createMaterial('MeshBasicMaterial');
export const MeshLambertMaterial = createMaterial('MeshLambertMaterial');
export const MeshPhongMaterial = createMaterial('MeshPhongMaterial');
export const MeshStandardMaterial = createMaterial('MeshStandardMaterial');
export const MeshPhysicalMaterial = createMaterial('MeshPhysicalMaterial');
export const LineBasicMaterial = createMaterial('LineBasicMaterial');
export const PointsMaterial = createMaterial('PointsMaterial');

// Mock Mesh
export const Mesh = jest.fn(function(this: any, geometry?: any, material?: any) {
  Object3D.call(this);
  this.type = 'Mesh';
  this.isMesh = true;
  this.geometry = geometry || new BufferGeometry();
  this.material = material || new MeshBasicMaterial();
  this.updateMorphTargets = jest.fn();
  this.raycast = jest.fn();
});

// Mock Lights
export const Light = createMockClass('Light', {
  isLight: true,
  color: new Color(1, 1, 1),
  intensity: 1,
});

export const AmbientLight = createMockClass('AmbientLight', {
  isAmbientLight: true,
  color: new Color(1, 1, 1),
  intensity: 1,
});

export const DirectionalLight = createMockClass('DirectionalLight', {
  isDirectionalLight: true,
  color: new Color(1, 1, 1),
  intensity: 1,
  target: new Object3D(),
  shadow: {
    camera: new OrthographicCamera(),
    bias: 0,
    normalBias: 0,
    radius: 1,
    mapSize: { x: 512, y: 512 },
  },
});

export const PointLight = createMockClass('PointLight', {
  isPointLight: true,
  color: new Color(1, 1, 1),
  intensity: 1,
  distance: 0,
  decay: 1,
});

export const SpotLight = createMockClass('SpotLight', {
  isSpotLight: true,
  color: new Color(1, 1, 1),
  intensity: 1,
  distance: 0,
  angle: Math.PI / 3,
  penumbra: 0,
  decay: 1,
  target: new Object3D(),
});

// Mock Loaders
export const TextureLoader = jest.fn(function(this: any) {
  this.load = jest.fn((url, onLoad, onProgress, onError) => {
    const texture = {
      image: { width: 512, height: 512 },
      needsUpdate: false,
      dispose: jest.fn(),
    };
    if (onLoad) setTimeout(() => onLoad(texture), 0);
    return texture;
  });
  this.loadAsync = jest.fn((url) => Promise.resolve({
    image: { width: 512, height: 512 },
    needsUpdate: false,
    dispose: jest.fn(),
  }));
});

// Mock Raycaster
export const Raycaster = jest.fn(function(this: any) {
  this.ray = {
    origin: new Vector3(),
    direction: new Vector3(),
  };
  this.near = 0;
  this.far = Infinity;
  this.camera = null;
  this.layers = {
    mask: 1,
  };
  this.params = {};
  this.setFromCamera = jest.fn();
  this.intersectObject = jest.fn(() => []);
  this.intersectObjects = jest.fn(() => []);
});

// Mock Clock
export const Clock = jest.fn(function(this: any, autoStart = true) {
  this.autoStart = autoStart;
  this.startTime = 0;
  this.oldTime = 0;
  this.elapsedTime = 0;
  this.running = false;
  this.start = jest.fn();
  this.stop = jest.fn();
  this.getElapsedTime = jest.fn(() => 0);
  this.getDelta = jest.fn(() => 0.016);
});

// Mock BufferAttribute
export const BufferAttribute = jest.fn(function(this: any, array: any, itemSize: number) {
  this.array = array;
  this.itemSize = itemSize;
  this.count = array ? array.length / itemSize : 0;
  this.normalized = false;
  this.usage = 35044;
  this.updateRange = { offset: 0, count: -1 };
  this.version = 0;
  this.onUploadCallback = jest.fn();
  this.needsUpdate = false;
  this.setUsage = jest.fn(() => this);
  this.copy = jest.fn(() => this);
  this.copyAt = jest.fn(() => this);
  this.copyArray = jest.fn(() => this);
  this.set = jest.fn(() => this);
  this.setX = jest.fn(() => this);
  this.setY = jest.fn(() => this);
  this.setZ = jest.fn(() => this);
  this.setW = jest.fn(() => this);
  this.setXY = jest.fn(() => this);
  this.setXYZ = jest.fn(() => this);
  this.setXYZW = jest.fn(() => this);
  this.clone = jest.fn();
});

export const Float32BufferAttribute = BufferAttribute;
export const Uint16BufferAttribute = BufferAttribute;
export const Uint32BufferAttribute = BufferAttribute;

// Helper exports for tests
export const mockScene = () => Scene();
export const mockCamera = () => PerspectiveCamera();
export const mockRenderer = () => WebGLRenderer();
export const simulateCanvasInteraction = jest.fn();
export const waitForAnimation = () => new Promise(resolve => setTimeout(resolve, 100));

// Mock GridHelper and AxesHelper
export const GridHelper = createMockClass('GridHelper', {
  type: 'GridHelper',
});

export const AxesHelper = createMockClass('AxesHelper', {
  type: 'AxesHelper',
});

// Mock Fog
export const Fog = jest.fn(function(this: any, color: any, near: number, far: number) {
  this.color = color;
  this.near = near;
  this.far = far;
});

// Mock MathUtils
export const MathUtils = {
  generateUUID: jest.fn(() => 'test-uuid-' + Math.random()),
  degToRad: jest.fn((deg: number) => (deg * Math.PI) / 180),
  radToDeg: jest.fn((rad: number) => (rad * 180) / Math.PI),
  clamp: jest.fn((value: number, min: number, max: number) => Math.max(min, Math.min(max, value))),
};

// Mock constants
export const PCFSoftShadowMap = 2;
export const TOUCH = {
  ROTATE: 0,
  DOLLY_PAN: 1,
};

// Group all exports for default export
const THREE = {
  Scene,
  PerspectiveCamera,
  OrthographicCamera,
  WebGLRenderer,
  Object3D,
  Mesh,
  BoxGeometry,
  SphereGeometry,
  PlaneGeometry,
  CylinderGeometry,
  ConeGeometry,
  TorusGeometry,
  BufferGeometry,
  Material,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  LineBasicMaterial,
  PointsMaterial,
  Light,
  AmbientLight,
  DirectionalLight,
  PointLight,
  SpotLight,
  Vector2,
  Vector3,
  Matrix4,
  Quaternion,
  Euler,
  Color,
  TextureLoader,
  Raycaster,
  Clock,
  BufferAttribute,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
  GridHelper,
  AxesHelper,
  Fog,
  MathUtils,
  PCFSoftShadowMap,
  TOUCH,
};

// Export as both default and named exports for compatibility
export default THREE;

// Also make THREE available as namespace
module.exports = THREE;
module.exports.default = THREE;

// Add individual exports for backward compatibility
Object.assign(module.exports, THREE);

// Also export as namespace
export {
  Scene,
  PerspectiveCamera,
  OrthographicCamera,
  WebGLRenderer,
  Object3D,
  Mesh,
  BoxGeometry,
  SphereGeometry,
  PlaneGeometry,
  CylinderGeometry,
  ConeGeometry,
  TorusGeometry,
  BufferGeometry,
  Material,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  LineBasicMaterial,
  PointsMaterial,
  Light,
  AmbientLight,
  DirectionalLight,
  PointLight,
  SpotLight,
  Vector2,
  Vector3,
  Matrix4,
  Quaternion,
  Euler,
  Color,
  TextureLoader,
  Raycaster,
  Clock,
  BufferAttribute,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Uint32BufferAttribute,
};

// Mock @react-three/fiber
export const Canvas = jest.fn(({ children }: any) => children);
export const useFrame = jest.fn();
export const useThree = jest.fn(() => ({
  camera: new PerspectiveCamera(),
  scene: new Scene(),
  gl: new WebGLRenderer(),
  size: { width: 800, height: 600 },
  viewport: { width: 800, height: 600, factor: 1 },
  mouse: { x: 0, y: 0 },
  clock: new Clock(),
  raycaster: new Raycaster(),
}));
export const extend = jest.fn();
export const useLoader = jest.fn();

// Mock @react-three/drei
export const OrbitControls = jest.fn(() => null);
export const Box = jest.fn(() => null);
export const Sphere = jest.fn(() => null);
export const Plane = jest.fn(() => null);
export const Text = jest.fn(() => null);
export const Environment = jest.fn(() => null);
export const PresentationControls = jest.fn(({ children }: any) => children);
export const ContactShadows = jest.fn(() => null);
export const Html = jest.fn(({ children }: any) => children);
export const Stats = jest.fn(() => null);
