\set ON_ERROR_ROLLBACK 1
\set ON_ERROR_STOP true

BEGIN;

-- Load pgTAP
SELECT plan(16);

-- Load test utilities
\i 'tests/helpers/test_utilities.sql'

-- Test CRUD operations for companies table

-- CREATE
SELECT lives_ok(
    $$INSERT INTO companies (name, slug, subscription_plan)
      VALUES ('CRUD Test Company', 'crud-test-company', 'professional')
      RETURNING id$$,
    'Should be able to create a new company'
);

-- Get the created company ID
\set company_id `SELECT id FROM companies WHERE name = 'CRUD Test Company'`

-- READ
SELECT is(
    (SELECT name FROM companies WHERE id = :'company_id'),
    'CRUD Test Company',
    'Should be able to read company name'
);

SELECT is(
    (SELECT slug FROM companies WHERE id = :'company_id'),
    'crud-test-company',
    'Should be able to read company slug'
);

SELECT is(
    (SELECT subscription_plan FROM companies WHERE id = :'company_id'),
    'professional'::subscription_plan_type,
    'Should be able to read company subscription plan'
);

-- UPDATE
SELECT lives_ok(
    $$UPDATE companies SET 
        name = 'Updated Company', 
        subscription_plan = 'enterprise'
      WHERE id = '$$||:'company_id'||$$'$$,
    'Should be able to update company'
);

SELECT is(
    (SELECT name FROM companies WHERE id = :'company_id'),
    'Updated Company',
    'Company name should be updated'
);

SELECT is(
    (SELECT subscription_plan FROM companies WHERE id = :'company_id'),
    'enterprise'::subscription_plan_type,
    'Company subscription plan should be updated'
);

-- Test timestamps are updated
SELECT col_not_null('companies', 'updated_at', 'updated_at should not be null after update');
SELECT is(
    (SELECT extract(day from (updated_at - created_at)) FROM companies WHERE id = :'company_id'),
    0::numeric, -- Should be updated on the same day
    'updated_at should be changed after update'
);

-- Create a user for this company
SELECT lives_ok(
    $$INSERT INTO users (company_id, email, full_name, role, password_hash)
      VALUES ('$$||:'company_id'||$$', 'crud-test@example.com', 'CRUD Test User', 'admin', 'hash123')
      RETURNING id$$,
    'Should be able to create a user for the company'
);

-- Get the created user ID
\set user_id `SELECT id FROM users WHERE email = 'crud-test@example.com'`

-- Read user
SELECT is(
    (SELECT full_name FROM users WHERE id = :'user_id'),
    'CRUD Test User',
    'Should be able to read user full_name'
);

SELECT is(
    (SELECT company_id FROM users WHERE id = :'user_id'),
    :'company_id'::uuid,
    'User should belong to the correct company'
);

-- Update user
SELECT lives_ok(
    $$UPDATE users SET
        full_name = 'Updated User',
        role = 'recruiter'
      WHERE id = '$$||:'user_id'||$$'$$,
    'Should be able to update user'
);

SELECT is(
    (SELECT full_name FROM users WHERE id = :'user_id'),
    'Updated User',
    'User full_name should be updated'
);

SELECT is(
    (SELECT role FROM users WHERE id = :'user_id'),
    'recruiter'::user_role_type,
    'User role should be updated'
);

-- DELETE
SELECT lives_ok(
    $$DELETE FROM users WHERE id = '$$||:'user_id'||$$'$$,
    'Should be able to delete user'
);

-- The company deletion will cascade to any remaining relations because of foreign keys
SELECT lives_ok(
    $$DELETE FROM companies WHERE id = '$$||:'company_id'||$$'$$,
    'Should be able to delete company'
);

-- Finish the tests
SELECT * FROM finish();

ROLLBACK;
