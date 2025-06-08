# CV Matcher Database Testing Strategy with pgTAP

This document outlines our comprehensive testing strategy for the CV Matcher database using pgTAP, a TAP-compliant testing framework for PostgreSQL.

## Overview

Our testing approach ensures:

1. Database schema integrity
2. Data integrity constraints
3. Row-Level Security (RLS) policies effectiveness
4. CRUD operations functionality
5. Business logic validation
6. Performance baseline validation

## Setup and Requirements

### Prerequisites

- PostgreSQL 12+ installed
- pgTAP extension installed
- pg_prove utility installed (for TAP output)

### Installation

```bash
# Install pgTAP in your PostgreSQL instance
git clone https://github.com/theory/pgtap.git
cd pgtap
make
make installcheck
make install

# Install pg_prove for test runner
cpan TAP::Parser::SourceHandler::pgTAP
```

## Test Directory Structure

```
tests/
├── pgtap/
│   ├── setup/
│   │   └── install_pgtap.sql
│   ├── schema/
│   │   ├── table_tests.sql
│   │   ├── column_tests.sql
│   │   ├── constraint_tests.sql
│   │   └── index_tests.sql
│   ├── functions/
│   │   ├── user_functions_tests.sql
│   │   └── matching_algorithm_tests.sql
│   ├── rls/
│   │   ├── company_isolation_tests.sql
│   │   └── role_based_access_tests.sql
│   ├── crud/
│   │   ├── companies_crud_tests.sql
│   │   ├── users_crud_tests.sql
│   │   ├── jobs_crud_tests.sql
│   │   ├── candidates_crud_tests.sql
│   │   └── job_matches_crud_tests.sql
│   ├── integration/
│   │   ├── matching_flow_tests.sql
│   │   └── candidate_pipeline_tests.sql
│   └── performance/
│       └── query_performance_tests.sql
└── helpers/
    ├── setup_test_data.sql
    └── test_utilities.sql
```

## Test Categories

### 1. Schema Tests

Verify that database objects exist with correct definitions:

- Tables and their columns with correct data types
- Primary keys, foreign keys, and other constraints
- Indexes for performance optimization
- ENUMs and custom types

### 2. Function Tests

Validate that database functions work as expected:

- User management functions
- Security-related functions
- Business logic functions
- Triggers and procedures

### 3. RLS Tests

Comprehensive tests for Row-Level Security:

- Company isolation (tenant separation)
- Role-based access (admin, recruiter, viewer)
- Data visibility rules
- Insertion/modification restrictions

### 4. CRUD Operation Tests

Test Create, Read, Update, and Delete operations for each entity:

- Companies management
- Users management
- Jobs management
- Candidates management
- Job matches and scoring

### 5. Integration Tests

Test complete workflows and interactions between components:

- CV upload and processing flow
- Job matching algorithm
- Candidate pipeline state transitions
- Batch processing systems

### 6. Performance Tests

Establish performance baselines and verify query optimization:

- Query execution time for common operations
- Index usage validation
- Connection overhead tests

## Test Implementation Approach

### Using pgTAP

Each test file will follow this general structure:

```sql
\set ON_ERROR_ROLLBACK 1
\set ON_ERROR_STOP true

BEGIN;

-- Load pgTAP
SELECT plan(N); -- N is the number of tests to run

-- Test fixtures setup
-- ...test setup code...

-- Actual tests
SELECT has_table('public', 'companies', 'Table companies should exist');
SELECT col_is_pk('public', 'companies', 'id', 'Column id should be primary key on companies table');
-- ...more tests...

-- Clean up test data
-- ...cleanup code...

-- Finish the tests
SELECT * FROM finish();

ROLLBACK;
```

## Running Tests

### Single Test File

```bash
pg_prove -d your_database_name tests/pgtap/schema/table_tests.sql
```

### All Tests

```bash
pg_prove -d your_database_name tests/pgtap/**/*.sql
```

### Continuous Integration

Include test runs in the CI/CD pipeline:

```bash
pg_prove -d ci_test_database --recurse tests/pgtap/
```

## Example Test Cases

### Schema Tests

```sql
-- Example test for companies table
SELECT has_table('companies');
SELECT has_pk('companies');
SELECT col_type_is('companies', 'name', 'character varying(255)', 'companies.name should be VARCHAR(255)');
SELECT col_not_null('companies', 'name', 'companies.name should be NOT NULL');
SELECT col_has_default('companies', 'created_at', 'companies.created_at should have default value');
SELECT has_index('companies', 'companies_slug_idx', 'There should be an index on slug column');
```

### RLS Tests

```sql
-- Example test for company isolation
SELECT set_config('app.current_user_id', user1_id::text, false);
SELECT results_eq(
    'SELECT COUNT(*) FROM companies',
    ARRAY[1::bigint],
    'User should only see their own company'
);
```

### CRUD Tests

```sql
-- Example test for creating a new job
SELECT lives_ok(
    $$INSERT INTO jobs (company_id, title, description) VALUES (
      (SELECT company_id FROM users WHERE id = current_user_id()),
      'Software Engineer',
      'Test job description'
    )$$,
    'Recruiter should be able to create a job for their company'
);
```

### Function Tests

```sql
-- Example test for user management functions
SELECT function_returns('public', 'current_user_id', ARRAY[]::text[], 'uuid', 'current_user_id() should return UUID type');
SELECT is(
    current_user_id()::text, 
    test_user_id::text, 
    'current_user_id() should return the ID set with set_current_user_id()'
);
```

## Test Data Management

We'll use consistent test data:

1. Test fixtures created at the beginning of test files
2. Each test runs in a transaction that's rolled back
3. Helper functions to generate realistic test data

## Conclusion

This comprehensive testing strategy ensures our database maintains integrity, security, and performance while supporting all required business functions.

Regular test execution will catch regressions early and provide confidence in our database implementation.