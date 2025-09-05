// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock crypto.randomUUID
Object.defineProperty(global.self, 'crypto', {
    value: {
        randomUUID: () => Math.random().toString(36).substring(2, 15)
    }
});

// Mock canvas.toDataURL
HTMLCanvasElement.prototype.toDataURL = (type, quality) => {
    return 'data:image/jpeg;base64,';
};
