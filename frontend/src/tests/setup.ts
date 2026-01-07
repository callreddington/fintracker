import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, beforeEach } from 'vitest';

// Global test setup
beforeAll(() => {
  // Any global setup (e.g., mocking APIs) goes here
});

afterAll(() => {
  // Any global cleanup goes here
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
