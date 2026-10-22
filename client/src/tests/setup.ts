/// <reference types="vitest/globals" />
/**
 * Vitest global setup file.
 * Runs before each test file.
 */
import '@testing-library/jest-dom';
import { beforeAll, afterAll } from 'vitest';

// Polyfill crypto.randomUUID for test environment
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => `${Math.random().toString(36).slice(2)}-${Date.now()}`,
  } as unknown as Crypto;
} else if (!globalThis.crypto.randomUUID) {
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    value: () => `${Math.random().toString(36).slice(2)}-${Date.now()}`,
    configurable: true,
  });
}

// Suppress console.error noise from React in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM') || args[0].includes('act('))
    ) return;
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
