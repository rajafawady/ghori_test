// Jest setup file - runs before all test suites
const { setupTestDatabase, cleanupTestDatabase } = require('../helpers/db');

// Set longer timeout for database operations
jest.setTimeout(30000);

// Global setup before all tests
beforeAll(async () => {
  // Ensure we're in test environment
  process.env.NODE_ENV = 'test';
  
  // Setup test database connection
  await setupTestDatabase();
  
  console.log('Test database setup complete');
});

// Global cleanup after all tests
afterAll(async () => {
  await cleanupTestDatabase();
  console.log('Test database cleanup complete');
});

// Setup before each test
beforeEach(async () => {
  // Reset any global test state if needed
});

// Cleanup after each test
afterEach(async () => {
  // Clean up any test-specific data if needed
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});
