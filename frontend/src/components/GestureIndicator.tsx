import React from 'react';

interface GestureIndicatorProps {
  currentGesture: string;
  aiStatus: string;
}

const GestureIndicator: React.FC<GestureIndicatorProps> = ({ currentGesture, aiStatus }) => {
  return (
    <div className="gesture-indicator">
      <div style={{ marginBottom: '5px' }}>
        <strong>Gesture:</strong> {currentGesture}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        <strong>AI:</strong> {aiStatus}
      </div>
    </div>
  );
};

export default GestureIndicator;
