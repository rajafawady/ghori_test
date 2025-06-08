# CV Matcher Database Testing Strategy with Node.js/Jest

This document outlines our comprehensive testing strategy for the CV Matcher database using Jest and Node.js, providing a modern JavaScript-based testing framework for PostgreSQL databases.

## Overview

Our testing approach ensures:

1. Database schema integrity
2. Data integrity constraints
3. Row-Level Security (RLS) policies effectiveness
4. CRUD operations functionality
5. Business logic validation
6. Performance baseline validation

## Prerequisites

- Node.js (version 16 or higher)
- npm package manager
- PostgreSQL database
- Test database environment

## Setup

```bash
# Navigate to tests directory
cd tests

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your test database credentials
```

## Test Directory Structure

```
tests/
├── package.json              # Node.js dependencies and Jest configuration
├── .env.example              # Environment variables template
├── jest.setup.js             # Jest global setup
├── schema/
│   └── schema.test.js        # Database schema validation tests
├── crud/
│   └── crud.test.js          # CRUD operations tests
├── security/
│   └── security.test.js      # Security and RLS policy tests
├── integration/
│   └── integration.test.js   # End-to-end workflow tests
├── performance/
│   └── performance.test.js   # Performance benchmark tests
├── helpers/
│   ├── db.js                 # Database connection utilities
│   └── testHelpers.js        # Test data generation utilities
└── setup/
    └── jest.setup.js         # Jest test environment setup
```

## Test Categories

### 1. Schema Tests (`tests/schema/schema.test.js`)

Verify that database objects exist with correct definitions:

- Tables and their columns with correct data types
- Primary keys, foreign keys, and other constraints
- Indexes for performance optimization
- ENUMs and custom types
- Row-Level Security policies

### 2. CRUD Operation Tests (`tests/crud/crud.test.js`)

Test Create, Read, Update, and Delete operations for each entity:

- Companies management
- Users management
- Jobs management
- Candidates management
- Job matches and scoring
- All supporting tables

### 3. Security Tests (`tests/security/security.test.js`)

Comprehensive tests for database security:

- Company isolation (tenant separation)
- Role-based access (admin, recruiter, viewer)
- SQL injection protection
- Data visibility rules
- Input validation and constraints

### 4. Integration Tests (`tests/integration/integration.test.js`)

Test complete workflows and interactions between components:

- CV upload and processing flow
- Job matching algorithm
- Candidate pipeline state transitions
- User authentication and authorization workflows

### 5. Performance Tests (`tests/performance/performance.test.js`)

Establish performance baselines and verify query optimization:

- Query execution time for common operations
- Index usage validation
- Bulk operation performance
- Concurrent access patterns

## Test Implementation Approach

### Using Jest with Node.js

Each test file follows this general structure:

```javascript
const { Pool } = require('pg');
const { setupTestDb, cleanupTestDb, createTestData } = require('../helpers/testHelpers');

describe('Entity Tests', () => {
  let db;

  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb(db);
  });

  beforeEach(async () => {
    await createTestData(db);
  });

  afterEach(async () => {
    await db.query('ROLLBACK');
  });

  test('should validate entity creation', async () => {
    const result = await db.query('SELECT * FROM entities WHERE id = $1', [testId]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe('Test Entity');
  });
});
```

## Running Tests

### All Tests

```bash
# From project root
cd tests
npm test

# Or using the convenience scripts
./run_tests.sh
./run_tests.ps1
```

### Specific Test Categories

```bash
# Schema tests only
npm test -- tests/schema

# CRUD tests only
npm test -- tests/crud

# Security tests only
npm test -- tests/security

# Integration tests only
npm test -- tests/integration

# Performance tests only
npm test -- tests/performance
```

### Test Options

```bash
# Run with coverage report
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run with verbose output
npm test -- --verbose
```

### Using the Shell Scripts

```bash
# Run all tests
./run_tests.sh

# Run specific test type with coverage
./run_tests.sh schema true

# Run in watch mode
./run_tests.sh all false true
```

## Environment Configuration

Create a `.env` file in the tests directory:

```env
# Test Database Configuration
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=job_matcher_test
TEST_DB_USER=test_user
TEST_DB_PASSWORD=test_password
TEST_DB_SSL=false

# Test Configuration
NODE_ENV=test
LOG_LEVEL=error
```

## Test Data Management

We use consistent test data management:

1. **Test Database**: Separate database for testing
2. **Transactions**: Each test runs in a transaction that's rolled back
3. **Test Fixtures**: Helper functions generate realistic test data
4. **Isolation**: Tests are isolated and can run in parallel

### Test Data Helpers

```javascript
// Create test company
const testCompany = await createTestCompany(db, {
  name: 'Test Company',
  slug: 'test-company'
});

// Create test user
const testUser = await createTestUser(db, {
  email: 'test@example.com',
  company_id: testCompany.id,
  role: 'recruiter'
});

// Create test job
const testJob = await createTestJob(db, {
  title: 'Software Engineer',
  company_id: testCompany.id
});
```

## Continuous Integration

Include test runs in the CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Database Tests
  run: |
    cd tests
    npm install
    npm test -- --coverage
  env:
    TEST_DB_HOST: localhost
    TEST_DB_NAME: job_matcher_test
    TEST_DB_USER: postgres
    TEST_DB_PASSWORD: postgres
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear, descriptive test names
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Use mocks for external services
5. **Performance Awareness**: Keep tests fast and efficient

## Debugging Tests

```bash
# Run specific test file
npm test -- tests/schema/schema.test.js

# Run with debug output
DEBUG=* npm test

# Run single test
npm test -- --testNamePattern="should create company"
```

## Coverage Reporting

Jest generates comprehensive coverage reports:

```bash
# Generate coverage report
npm test -- --coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Conclusion

This comprehensive testing strategy ensures our database maintains integrity, security, and performance while supporting all required business functions using modern JavaScript tooling.

Regular test execution will catch regressions early and provide confidence in our database implementation.