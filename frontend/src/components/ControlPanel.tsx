import React from 'react';

interface ControlPanelProps {
  selectedShape: string;
  onShapeSelect: (shape: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ selectedShape, onShapeSelect }) => {
  const shapes = [
    { id: 'cube', name: 'Cube', icon: '□' },
    { id: 'sphere', name: 'Sphere', icon: '○' },
    { id: 'cylinder', name: 'Cylinder', icon: '▭' },
    { id: 'cone', name: 'Cone', icon: '△' },
    { id: 'torus', name: 'Torus', icon: '◯' },
    { id: 'pyramid', name: 'Pyramid', icon: '▲' }
  ];

  return (
    <div className="controls-panel">
      <h3>Shape Tools</h3>
      <div className="shape-selector">
        {shapes.map(shape => (
          <button
            key={shape.id}
            className={`shape-button ${selectedShape === shape.id ? 'active' : ''}`}
            onClick={() => onShapeSelect(shape.id)}
          >
            <div style={{ fontSize: '24px' }}>{shape.icon}</div>
            <div>{shape.name}</div>
          </button>
        ))}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Instructions</h3>
        <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
          <div>• <strong>Tap</strong>: Select object</div>
          <div>• <strong>Double Tap</strong>: Create shape</div>
          <div>• <strong>Drag</strong>: Move object</div>
          <div>• <strong>Pinch</strong>: Scale object</div>
          <div>• <strong>Rotate</strong>: Rotate object</div>
          <div>• <strong>Two-finger drag</strong>: Pan view</div>
          <div>• <strong>Three-finger tap</strong>: Reset scene</div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
