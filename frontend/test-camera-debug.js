// Simple test version of Three.js mock for debugging

const mockPerspectiveCamera = function(fov, aspect, near, far) {
  console.log('Creating PerspectiveCamera with:', { fov, aspect, near, far });
  
  this.isPerspectiveCamera = true;
  this.fov = fov || 75;
  this.aspect = aspect || 1;
  this.near = near || 0.1;
  this.far = far || 1000;
  
  // The issue is here - position is being created correctly
  this.position = {
    x: 0,
    y: 0,
    z: 0,
    set: function(x, y, z) {
      console.log('Setting position to:', x, y, z);
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
  };
  
  console.log('Camera position object:', this.position);
  console.log('Camera position.set:', this.position.set);
  
  this.lookAt = function() { console.log('lookAt called'); };
  this.updateProjectionMatrix = function() { console.log('updateProjectionMatrix called'); };
};

// Test it
console.log('Testing PerspectiveCamera mock...');
const camera = new mockPerspectiveCamera(75, 1.5, 0.1, 1000);
console.log('\nCamera object:', camera);
console.log('Camera position:', camera.position);

if (camera.position && camera.position.set) {
  console.log('\nCalling position.set(5, 5, 5)...');
  camera.position.set(5, 5, 5);
  console.log('Position after set:', camera.position);
} else {
  console.error('ERROR: camera.position or camera.position.set is undefined!');
}
