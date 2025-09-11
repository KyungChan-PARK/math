/**
 * LOLA 통합 플랫폼 테스트
 * LOLAIntegratedPlatform.jsx 테스트 스위트
 */

const React = require('react');
const { render, fireEvent, waitFor } = require('@testing-library/react');
const '@testing-library/jest-dom';

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
}));

describe('LOLAIntegratedPlatform', () => {
    let LOLAIntegratedPlatform;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Dynamic import to reset module state
        jest.isolateModules(() => {
            LOLAIntegratedPlatform = require('../src/lola-integration/LOLAIntegratedPlatform.jsx').default;
        });
    });
    
    describe('Component Rendering', () => {
        test('should render without crashing', () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            expect(container).toBeTruthy();
        });
        
        test('should display LOLA branding', () => {
            const { getByText } = render(<LOLAIntegratedPlatform />);
            expect(getByText(/LOLA/i)).toBeInTheDocument();
        });
        
        test('should have canvas element for drawing', () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            const canvas = container.querySelector('canvas');
            expect(canvas).toBeInTheDocument();
        });
    });
    
    describe('WebSocket Connection', () => {
        test('should establish WebSocket connection on mount', () => {
            render(<LOLAIntegratedPlatform />);
            expect(global.WebSocket).toHaveBeenCalledWith(
                expect.stringContaining('ws://')
            );
        });
        
        test('should handle WebSocket messages', async () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            const mockMessage = {
                data: JSON.stringify({
                    type: 'update',
                    content: 'test data'
                })
            };
            
            // Simulate WebSocket message
            const wsInstance = global.WebSocket.mock.results[0].value;
            const messageHandler = wsInstance.addEventListener.mock.calls.find(
                call => call[0] === 'message'
            )?.[1];
            
            if (messageHandler) {
                messageHandler(mockMessage);
            }
            
            // Wait for state update
            await waitFor(() => {
                expect(container.querySelector('.update-indicator')).toBeTruthy();
            });
        });
    });
    
    describe('Touch Interactions', () => {
        test('should handle touch start events', () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            const canvas = container.querySelector('canvas');
            
            const touchEvent = new TouchEvent('touchstart', {
                touches: [
                    { clientX: 100, clientY: 100, identifier: 0 }
                ]
            });
            
            fireEvent(canvas, touchEvent);
            
            // Check if drawing started
            expect(container.querySelector('.drawing-active')).toBeTruthy();
        });
        
        test('should track touch movement', () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            const canvas = container.querySelector('canvas');
            
            // Start touch
            fireEvent.touchStart(canvas, {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            
            // Move touch
            fireEvent.touchMove(canvas, {
                touches: [{ clientX: 150, clientY: 150 }]
            });
            
            // End touch
            fireEvent.touchEnd(canvas, {
                changedTouches: [{ clientX: 150, clientY: 150 }]
            });
            
            // Verify stroke was recorded
            expect(global.WebSocket.mock.results[0].value.send).toHaveBeenCalled();
        });
    });
    
    describe('Physics Simulation', () => {
        test('should initialize physics engine', () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            expect(container.querySelector('.physics-active')).toBeTruthy();
        });
        
        test('should update physics on animation frame', async () => {
            jest.useFakeTimers();
            const { container } = render(<LOLAIntegratedPlatform />);
            
            // Trigger animation frame
            jest.advanceTimersByTime(16); // ~60fps
            
            await waitFor(() => {
                expect(container.querySelector('.physics-updated')).toBeTruthy();
            });
            
            jest.useRealTimers();
        });
    });
    
    describe('Mathematical Intent Recognition', () => {
        test('should detect circular gestures', async () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            const canvas = container.querySelector('canvas');
            
            // Draw circle-like pattern
            const points = [];
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                points.push({
                    x: 100 + Math.cos(angle) * 50,
                    y: 100 + Math.sin(angle) * 50
                });
            }
            
            // Simulate drawing
            points.forEach(point => {
                fireEvent.touchMove(canvas, {
                    touches: [{ clientX: point.x, clientY: point.y }]
                });
            });
            
            await waitFor(() => {
                expect(container.querySelector('.shape-detected')).toBeTruthy();
                expect(container.querySelector('.shape-type')).toHaveTextContent('circle');
            });
        });
        
        test('should detect linear patterns', async () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            const canvas = container.querySelector('canvas');
            
            // Draw straight line
            fireEvent.touchStart(canvas, {
                touches: [{ clientX: 50, clientY: 50 }]
            });
            
            fireEvent.touchMove(canvas, {
                touches: [{ clientX: 150, clientY: 150 }]
            });
            
            fireEvent.touchEnd(canvas, {
                changedTouches: [{ clientX: 150, clientY: 150 }]
            });
            
            await waitFor(() => {
                expect(container.querySelector('.pattern-linear')).toBeTruthy();
            });
        });
    });
    
    describe('Performance', () => {
        test('should maintain 60fps during interaction', async () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            const startTime = performance.now();
            
            // Simulate intensive interaction
            for (let i = 0; i < 60; i++) {
                fireEvent.touchMove(container.querySelector('canvas'), {
                    touches: [{ clientX: i * 5, clientY: i * 5 }]
                });
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should complete 60 frames in ~1000ms for 60fps
            expect(duration).toBeLessThan(1100);
        });
        
        test('should throttle WebSocket messages', () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            const canvas = container.querySelector('canvas');
            
            // Rapid touch events
            for (let i = 0; i < 100; i++) {
                fireEvent.touchMove(canvas, {
                    touches: [{ clientX: i, clientY: i }]
                });
            }
            
            // Should not send 100 messages
            const sendCalls = global.WebSocket.mock.results[0].value.send.mock.calls.length;
            expect(sendCalls).toBeLessThan(20); // Throttled
        });
    });
    
    describe('Error Handling', () => {
        test('should handle WebSocket disconnection', async () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            
            // Simulate disconnection
            const wsInstance = global.WebSocket.mock.results[0].value;
            const closeHandler = wsInstance.addEventListener.mock.calls.find(
                call => call[0] === 'close'
            )?.[1];
            
            if (closeHandler) {
                closeHandler();
            }
            
            await waitFor(() => {
                expect(container.querySelector('.reconnecting')).toBeTruthy();
            });
        });
        
        test('should handle invalid touch data', () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            const canvas = container.querySelector('canvas');
            
            // Invalid touch event
            const invalidEvent = new TouchEvent('touchstart', {
                touches: [] // No touches
            });
            
            expect(() => {
                fireEvent(canvas, invalidEvent);
            }).not.toThrow();
        });
    });
    
    describe('Integration', () => {
        test('should integrate with LOLA physics server', async () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            
            // Check for physics server connection
            await waitFor(() => {
                expect(container.querySelector('.physics-connected')).toBeTruthy();
            });
        });
        
        test('should sync with intent learning system', async () => {
            const { container } = render(<LOLAIntegratedPlatform />);
            
            // Draw pattern
            const canvas = container.querySelector('canvas');
            fireEvent.touchStart(canvas, {
                touches: [{ clientX: 50, clientY: 50 }]
            });
            fireEvent.touchEnd(canvas, {
                changedTouches: [{ clientX: 100, clientY: 100 }]
            });
            
            // Check for intent analysis
            await waitFor(() => {
                expect(container.querySelector('.intent-analyzing')).toBeTruthy();
            });
        });
    });
});

module.exports = {};
