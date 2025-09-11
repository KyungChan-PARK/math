import GestureManager from './GestureManager';

describe('GestureManager', () => {
  let element: HTMLElement;
  let callback: jest.Mock;
  let gestureManager: GestureManager;

  beforeEach(() => {
    // Create a mock DOM element
    element = document.createElement('div');
    element.style.width = '800px';
    element.style.height = '600px';
    
    // Mock getBoundingClientRect
    element.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    document.body.appendChild(element);
    
    // Create mock callback
    callback = jest.fn();
    
    // Create GestureManager instance
    gestureManager = new GestureManager(element, callback);
  });

  afterEach(() => {
    // Clean up
    gestureManager.destroy();
    document.body.removeChild(element);
    jest.clearAllMocks();
  });

  describe('Touch Events', () => {
    test('detects TAP gesture', () => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 200, identifier: 0 } as Touch,
        ],
      });

      const touchEnd = new TouchEvent('touchend', {
        touches: [],
        changedTouches: [
          { clientX: 100, clientY: 200, identifier: 0 } as Touch,
        ],
      });

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchEnd);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TAP',
          parameters: expect.objectContaining({
            x: 100,
            y: 200,
          }),
        })
      );
    });

    test('detects DRAG gesture', () => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 200, identifier: 0 } as Touch,
        ],
      });

      const touchMove = new TouchEvent('touchmove', {
        touches: [
          { clientX: 200, clientY: 300, identifier: 0 } as Touch,
        ],
      });

      const touchEnd = new TouchEvent('touchend', {
        touches: [],
        changedTouches: [
          { clientX: 200, clientY: 300, identifier: 0 } as Touch,
        ],
      });

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DRAG',
          parameters: expect.objectContaining({
            startX: 100,
            startY: 200,
            endX: 200,
            endY: 300,
            deltaX: 100,
            deltaY: 100,
          }),
        })
      );
    });

    test('detects PINCH gesture', () => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 200, identifier: 0 } as Touch,
          { clientX: 200, clientY: 200, identifier: 1 } as Touch,
        ],
      });

      const touchMove = new TouchEvent('touchmove', {
        touches: [
          { clientX: 50, clientY: 200, identifier: 0 } as Touch,
          { clientX: 250, clientY: 200, identifier: 1 } as Touch,
        ],
      });

      const touchEnd = new TouchEvent('touchend', {
        touches: [],
        changedTouches: [
          { clientX: 50, clientY: 200, identifier: 0 } as Touch,
          { clientX: 250, clientY: 200, identifier: 1 } as Touch,
        ],
      });

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PINCH',
          parameters: expect.objectContaining({
            scale: expect.any(Number),
            centerX: expect.any(Number),
            centerY: expect.any(Number),
          }),
        })
      );
    });

    test('detects ROTATE gesture', () => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100, identifier: 0 } as Touch,
          { clientX: 200, clientY: 100, identifier: 1 } as Touch,
        ],
      });

      const touchMove = new TouchEvent('touchmove', {
        touches: [
          { clientX: 100, clientY: 100, identifier: 0 } as Touch,
          { clientX: 100, clientY: 200, identifier: 1 } as Touch,
        ],
      });

      const touchEnd = new TouchEvent('touchend', {
        touches: [],
        changedTouches: [
          { clientX: 100, clientY: 100, identifier: 0 } as Touch,
          { clientX: 100, clientY: 200, identifier: 1 } as Touch,
        ],
      });

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ROTATE',
          parameters: expect.objectContaining({
            angle: expect.any(Number),
            centerX: expect.any(Number),
            centerY: expect.any(Number),
          }),
        })
      );
    });

    test('detects PAN gesture with three fingers', () => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100, identifier: 0 } as Touch,
          { clientX: 150, clientY: 100, identifier: 1 } as Touch,
          { clientX: 200, clientY: 100, identifier: 2 } as Touch,
        ],
      });

      const touchMove = new TouchEvent('touchmove', {
        touches: [
          { clientX: 150, clientY: 150, identifier: 0 } as Touch,
          { clientX: 200, clientY: 150, identifier: 1 } as Touch,
          { clientX: 250, clientY: 150, identifier: 2 } as Touch,
        ],
      });

      const touchEnd = new TouchEvent('touchend', {
        touches: [],
        changedTouches: [
          { clientX: 150, clientY: 150, identifier: 0 } as Touch,
          { clientX: 200, clientY: 150, identifier: 1 } as Touch,
          { clientX: 250, clientY: 150, identifier: 2 } as Touch,
        ],
      });

      element.dispatchEvent(touchStart);
      element.dispatchEvent(touchMove);
      element.dispatchEvent(touchEnd);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PAN',
          parameters: expect.objectContaining({
            deltaX: expect.any(Number),
            deltaY: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Mouse Events', () => {
    test('detects mouse click as TAP', () => {
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 300,
        clientY: 400,
        button: 0,
      });

      const mouseUp = new MouseEvent('mouseup', {
        clientX: 300,
        clientY: 400,
        button: 0,
      });

      element.dispatchEvent(mouseDown);
      element.dispatchEvent(mouseUp);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TAP',
          parameters: expect.objectContaining({
            x: 300,
            y: 400,
          }),
        })
      );
    });

    test('detects mouse drag', () => {
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
        button: 0,
      });

      const mouseMove = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 200,
        buttons: 1,
      });

      const mouseUp = new MouseEvent('mouseup', {
        clientX: 200,
        clientY: 200,
        button: 0,
      });

      element.dispatchEvent(mouseDown);
      element.dispatchEvent(mouseMove);
      element.dispatchEvent(mouseUp);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DRAG',
          parameters: expect.objectContaining({
            startX: 100,
            startY: 100,
            endX: 200,
            endY: 200,
            deltaX: 100,
            deltaY: 100,
          }),
        })
      );
    });

    test('detects mouse wheel as PINCH (zoom)', () => {
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100,
        clientX: 400,
        clientY: 300,
      });

      element.dispatchEvent(wheelEvent);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PINCH',
          parameters: expect.objectContaining({
            scale: expect.any(Number),
            centerX: 400,
            centerY: 300,
          }),
        })
      );
    });

    test('detects right mouse button for context menu', () => {
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 250,
        clientY: 350,
        button: 2, // Right button
      });

      const contextMenu = new MouseEvent('contextmenu', {
        clientX: 250,
        clientY: 350,
      });

      element.dispatchEvent(mouseDown);
      element.dispatchEvent(contextMenu);

      // Context menu is typically prevented in gesture managers
      expect(callback).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CONTEXT_MENU',
        })
      );
    });
  });

  describe('Pointer Events (Stylus/S Pen)', () => {
    test('detects stylus tap with pressure', () => {
      const pointerDown = new PointerEvent('pointerdown', {
        clientX: 150,
        clientY: 250,
        pointerId: 1,
        pointerType: 'pen',
        pressure: 0.8,
        button: 0,
      } as any);

      const pointerUp = new PointerEvent('pointerup', {
        clientX: 150,
        clientY: 250,
        pointerId: 1,
        pointerType: 'pen',
        pressure: 0,
        button: 0,
      } as any);

      element.dispatchEvent(pointerDown);
      element.dispatchEvent(pointerUp);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TAP',
          parameters: expect.objectContaining({
            x: 150,
            y: 250,
            pressure: 0.8,
            pointerType: 'pen',
          }),
        })
      );
    });

    test('detects stylus drag with pressure variations', () => {
      const pointerDown = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        pointerType: 'pen',
        pressure: 0.5,
        button: 0,
      } as any);

      const pointerMove1 = new PointerEvent('pointermove', {
        clientX: 150,
        clientY: 150,
        pointerId: 1,
        pointerType: 'pen',
        pressure: 0.7,
        buttons: 1,
      } as any);

      const pointerMove2 = new PointerEvent('pointermove', {
        clientX: 200,
        clientY: 200,
        pointerId: 1,
        pointerType: 'pen',
        pressure: 0.9,
        buttons: 1,
      } as any);

      const pointerUp = new PointerEvent('pointerup', {
        clientX: 200,
        clientY: 200,
        pointerId: 1,
        pointerType: 'pen',
        pressure: 0,
        button: 0,
      } as any);

      element.dispatchEvent(pointerDown);
      element.dispatchEvent(pointerMove1);
      element.dispatchEvent(pointerMove2);
      element.dispatchEvent(pointerUp);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DRAG',
          parameters: expect.objectContaining({
            startX: 100,
            startY: 100,
            endX: 200,
            endY: 200,
            pressureData: expect.any(Array),
            pointerType: 'pen',
          }),
        })
      );
    });
  });

  describe('Gesture Recognition Utilities', () => {
    test('calculates distance between two points correctly', () => {
      const distance = (gestureManager as any).calculateDistance(
        { x: 0, y: 0 },
        { x: 3, y: 4 }
      );
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    test('calculates angle between two points correctly', () => {
      const angle = (gestureManager as any).calculateAngle(
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      );
      expect(angle).toBeCloseTo(Math.PI / 4); // 45 degrees in radians
    });

    test('determines gesture velocity', () => {
      const velocity = (gestureManager as any).calculateVelocity(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        100 // 100ms duration
      );
      expect(velocity).toBe(1); // 100 pixels / 100ms = 1 pixel/ms
    });

    test('normalizes coordinates to canvas space', () => {
      const normalized = (gestureManager as any).normalizeCoordinates(400, 300);
      expect(normalized).toEqual({
        x: 0, // (400 - 400) / 400 = 0 (center)
        y: 0, // (300 - 300) / 300 = 0 (center)
      });
    });
  });

  describe('Error Handling', () => {
    test('handles invalid touch events gracefully', () => {
      const invalidTouchEvent = new TouchEvent('touchstart', {
        touches: [], // Empty touches
      });

      expect(() => {
        element.dispatchEvent(invalidTouchEvent);
      }).not.toThrow();
    });

    test('handles rapid successive gestures', () => {
      const events = [];
      for (let i = 0; i < 10; i++) {
        events.push(
          new MouseEvent('mousedown', { clientX: i * 10, clientY: i * 10 }),
          new MouseEvent('mouseup', { clientX: i * 10, clientY: i * 10 })
        );
      }

      events.forEach((event) => {
        element.dispatchEvent(event);
      });

      // Should have detected 10 TAP gestures
      expect(callback).toHaveBeenCalledTimes(10);
    });

    test('ignores gestures when destroyed', () => {
      gestureManager.destroy();

      const mouseDown = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      });

      element.dispatchEvent(mouseDown);

      // Callback should not be called after destroy
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    test('throttles gesture callbacks', (done) => {
      // Simulate many rapid mouse moves
      for (let i = 0; i < 100; i++) {
        const mouseMove = new MouseEvent('mousemove', {
          clientX: i,
          clientY: i,
          buttons: 1,
        });
        element.dispatchEvent(mouseMove);
      }

      // Check that callbacks are throttled
      setTimeout(() => {
        // Should be called less than 100 times due to throttling
        expect(callback.mock.calls.length).toBeLessThan(100);
        done();
      }, 500);
    });

    test('batches multi-touch updates', () => {
      const touchMove = new TouchEvent('touchmove', {
        touches: [
          { clientX: 100, clientY: 100, identifier: 0 } as Touch,
          { clientX: 200, clientY: 200, identifier: 1 } as Touch,
          { clientX: 300, clientY: 300, identifier: 2 } as Touch,
        ],
      });

      element.dispatchEvent(touchMove);

      // Should batch all touches into a single gesture event
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
