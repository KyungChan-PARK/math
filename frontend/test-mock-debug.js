// Test to debug Three.js mock
const THREE = require('./__mocks__/three');

console.log('Testing THREE mock...');

// Test Scene
const scene = new THREE.Scene();
console.log('Scene created:', scene);

// Test PerspectiveCamera
const camera = new THREE.PerspectiveCamera(75, 1.5, 0.1, 1000);
console.log('Camera created:', camera);
console.log('Camera position:', camera.position);

// Test position.set
if (camera.position && camera.position.set) {
  camera.position.set(5, 5, 5);
  console.log('Position after set:', camera.position);
} else {
  console.error('ERROR: camera.position or camera.position.set is undefined!');
}

console.log('Test complete.');
