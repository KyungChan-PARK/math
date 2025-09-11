// App.test.tsx - 프론트엔드 기본 테스트
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loading spinner initially', () => {
  const { container } = render(<App />);
  const loadingSpinner = container.querySelector('.loading-spinner');
  expect(loadingSpinner).toBeInTheDocument();
});

// MathCanvas 렌더링 테스트
test('renders MathCanvas after loading', async () => {
  const { container } = render(<App />);
  
  // Wait for loading to complete
  await new Promise((r) => setTimeout(r, 2000));
  
  const canvas = container.querySelector('.canvas-container');
  expect(canvas).toBeInTheDocument();
});

// GestureIndicator 테스트
test('shows gesture indicator', async () => {
  render(<App />);
  
  // Wait for loading
  await new Promise((r) => setTimeout(r, 2000));
  
  const gestureIndicator = screen.getByText(/Gesture:/i);
  expect(gestureIndicator).toBeInTheDocument();
});

// ControlPanel 테스트
test('shows control panel with shapes', async () => {
  render(<App />);
  
  // Wait for loading
  await new Promise((r) => setTimeout(r, 2000));
  
  const shapesTitle = screen.getByText(/Shape Tools/i);
  expect(shapesTitle).toBeInTheDocument();
});
