import 'dotenv/config';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Global test setup
beforeAll(async () => {
  // Any global setup (e.g., database connection) goes here
});

// Global test teardown
afterAll(async () => {
  // Any global cleanup goes here
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
