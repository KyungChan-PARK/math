import React, { useState, useEffect } from 'react';
import MathCanvas from './components/MathCanvas';
import ControlPanel from './components/ControlPanel';
import GestureIndicator from './components/GestureIndicator';
import './App.css';

interface AppState {
  currentGesture: string;
  selectedShape: string;
  isConnected: boolean;
  aiStatus: string;
}

function App() {
  const [state, setState] = useState<AppState>({
    currentGesture: 'Ready',
    selectedShape: 'cube',
    isConnected: false,
    aiStatus: 'Initializing...'
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize WebSocket connection
    initializeConnections();
    
    // Hide loading after components mount
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  const initializeConnections = async () => {
    try {
      // Check if backend services are running
      const services = [
        { name: 'MediaPipe', url: 'http://localhost:5000/health' },
        { name: 'NLP', url: 'http://localhost:3000/health' },
        { name: 'WebSocket', url: 'http://localhost:8085/health' },
        { name: 'Claude Orchestrator', url: 'http://localhost:8089/health' }
      ];

      const serviceStatuses = await Promise.allSettled(
        services.map(service => 
          fetch(service.url, { method: 'GET', mode: 'no-cors' })
            .then(() => ({ name: service.name, status: 'online' }))
            .catch(() => ({ name: service.name, status: 'offline' }))
        )
      );

      console.log('Service Status:', serviceStatuses);
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        aiStatus: 'AI Agent Ready'
      }));
    } catch (error) {
      console.error('Failed to initialize connections:', error);
      setState(prev => ({
        ...prev,
        aiStatus: 'Running in standalone mode'
      }));
    }
  };

  const handleGestureDetected = (gesture: string) => {
    setState(prev => ({ ...prev, currentGesture: gesture }));
  };

  const handleShapeSelect = (shape: string) => {
    setState(prev => ({ ...prev, selectedShape: shape }));
  };

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <MathCanvas 
        selectedShape={state.selectedShape}
        onGestureDetected={handleGestureDetected}
      />
      <GestureIndicator 
        currentGesture={state.currentGesture}
        aiStatus={state.aiStatus}
      />
      <ControlPanel 
        selectedShape={state.selectedShape}
        onShapeSelect={handleShapeSelect}
      />
    </div>
  );
}

export default App;
