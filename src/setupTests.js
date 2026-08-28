import '@testing-library/jest-dom/vitest';

// jsdom does not implement the Web Serial API, but KinisiClient's constructor
// registers a `disconnect` listener on navigator.serial as soon as the
// ControllerProvider mounts. Provide a minimal stub so components can render.
if (!('serial' in navigator)) {
  Object.defineProperty(navigator, 'serial', {
    configurable: true,
    value: {
      addEventListener() {},
      removeEventListener() {},
      getPorts: async () => [],
      requestPort: async () => {
        throw new Error('navigator.serial.requestPort is not available in tests');
      },
    },
  });
}
