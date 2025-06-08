\set ON_ERROR_ROLLBACK 1
\set ON_ERROR_STOP true

BEGIN;

-- Load pgTAP
SELECT plan(24);

-- Load test utilities
\i 'tests/helpers/test_utilities.sql'

-- Setup test data
SELECT * FROM setup_test_dataset(2, 2, 2, 3);

-- Get test user IDs for each company
DO $$
DECLARE
    company1_id UUID;
    company2_id UUID;
    company1_admin_id UUID;
    company1_viewer_id UUID;
    company2_admin_id UUID;
    company2_viewer_id UUID;
BEGIN
    -- Get companies
    SELECT id INTO company1_id FROM companies ORDER BY created_at LIMIT 1;
    SELECT id INTO company2_id FROM companies ORDER BY created_at OFFSET 1 LIMIT 1;
    
    -- Get users for company 1
    SELECT id INTO company1_admin_id FROM users 
    WHERE company_id = company1_id AND role = 'admin' 
    ORDER BY created_at LIMIT 1;
    
    SELECT id INTO company1_viewer_id FROM users 
    WHERE company_id = company1_id AND role = 'viewer' 
    ORDER BY created_at LIMIT 1;
    
    -- Get users for company 2
    SELECT id INTO company2_admin_id FROM users 
    WHERE company_id = company2_id AND role = 'admin' 
    ORDER BY created_at LIMIT 1;
    
    SELECT id INTO company2_viewer_id FROM users 
    WHERE company_id = company2_id AND role = 'viewer' 
    ORDER BY created_at LIMIT 1;
    
    -- Store values for tests
    PERFORM set_config('test.company1_id', company1_id::text, false);
    PERFORM set_config('test.company2_id', company2_id::text, false);
    PERFORM set_config('test.company1_admin_id', company1_admin_id::text, false);
    PERFORM set_config('test.company1_viewer_id', company1_viewer_id::text, false);
    PERFORM set_config('test.company2_admin_id', company2_admin_id::text, false);
    PERFORM set_config('test.company2_viewer_id', company2_viewer_id::text, false);
END $$;

-- Store the test user IDs as variables
\set company1_id `SELECT current_setting('test.company1_id')`
\set company2_id `SELECT current_setting('test.company2_id')`
\set company1_admin_id `SELECT current_setting('test.company1_admin_id')`
\set company1_viewer_id `SELECT current_setting('test.company1_viewer_id')`
\set company2_admin_id `SELECT current_setting('test.company2_admin_id')`
\set company2_viewer_id `SELECT current_setting('test.company2_viewer_id')`

-- Test RLS for company isolation
-- Set user context to company1_admin
SELECT set_current_user_id(:'company1_admin_id'::uuid);

-- Test company isolation - should only see own company
SELECT results_eq(
    'SELECT COUNT(*) FROM companies',
    ARRAY[1::bigint],
    'Company 1 admin should only see 1 company'
);

SELECT results_eq(
    'SELECT id FROM companies',
    ARRAY[:'company1_id'::uuid],
    'Company 1 admin should only see their own company'
);

-- Test user isolation - should only see users from own company
SELECT results_eq(
    'SELECT COUNT(*) FROM users',
    ARRAY[(SELECT COUNT(*) FROM users WHERE company_id = :'company1_id'::uuid)],
    'Company 1 admin should only see users from their company'
);

-- Test job isolation - should only see jobs from own company
SELECT results_eq(
    'SELECT COUNT(*) FROM jobs',
    ARRAY[(SELECT COUNT(*) FROM jobs WHERE company_id = :'company1_id'::uuid)],
    'Company 1 admin should only see jobs from their company'
);

-- Test candidate isolation - should only see candidates from own company
SELECT results_eq(
    'SELECT COUNT(*) FROM candidates',
    ARRAY[(SELECT COUNT(*) FROM candidates WHERE company_id = :'company1_id'::uuid)],
    'Company 1 admin should only see candidates from their company'
);

-- Change to company 2 admin
SELECT set_current_user_id(:'company2_admin_id'::uuid);

-- Same tests for company 2
SELECT results_eq(
    'SELECT COUNT(*) FROM companies',
    ARRAY[1::bigint],
    'Company 2 admin should only see 1 company'
);

SELECT results_eq(
    'SELECT id FROM companies',
    ARRAY[:'company2_id'::uuid],
    'Company 2 admin should only see their own company'
);

-- Test user isolation - should only see users from own company
SELECT results_eq(
    'SELECT COUNT(*) FROM users',
    ARRAY[(SELECT COUNT(*) FROM users WHERE company_id = :'company2_id'::uuid)],
    'Company 2 admin should only see users from their company'
);

-- Test job isolation - should only see jobs from own company
SELECT results_eq(
    'SELECT COUNT(*) FROM jobs',
    ARRAY[(SELECT COUNT(*) FROM jobs WHERE company_id = :'company2_id'::uuid)],
    'Company 2 admin should only see jobs from their company'
);

-- Test candidate isolation - should only see candidates from own company
SELECT results_eq(
    'SELECT COUNT(*) FROM candidates',
    ARRAY[(SELECT COUNT(*) FROM candidates WHERE company_id = :'company2_id'::uuid)],
    'Company 2 admin should only see candidates from their company'
);

-- Test role-based permissions
-- Test that admin can create a user
SELECT set_current_user_id(:'company1_admin_id'::uuid);
SELECT lives_ok(
    $$INSERT INTO users (company_id, email, full_name, role, password_hash) 
      VALUES (
        (SELECT company_id FROM users WHERE id = current_user_id()), 
        'new_user@test.com', 
        'New Test User', 
        'recruiter', 
        'password_hash'
      )$$,
    'Admin should be able to create new users'
);

-- Test that viewer cannot create a user
SELECT set_current_user_id(:'company1_viewer_id'::uuid);
SELECT throws_ok(
    $$INSERT INTO users (company_id, email, full_name, role, password_hash) 
      VALUES (
        (SELECT company_id FROM users WHERE id = current_user_id()), 
        'new_user2@test.com', 
        'New Test User 2', 
        'recruiter', 
        'password_hash'
      )$$,
    NULL,
    'Viewer should not be able to create new users'
);

-- Test that admin can create a job
SELECT set_current_user_id(:'company1_admin_id'::uuid);
SELECT lives_ok(
    $$INSERT INTO jobs (company_id, title, description) 
      VALUES (
        (SELECT company_id FROM users WHERE id = current_user_id()),
        'New Test Job',
        'Test job description'
      )$$,
    'Admin should be able to create new jobs'
);

-- Test that viewer cannot create a job
SELECT set_current_user_id(:'company1_viewer_id'::uuid);
SELECT throws_ok(
    $$INSERT INTO jobs (company_id, title, description) 
      VALUES (
        (SELECT company_id FROM users WHERE id = current_user_id()),
        'New Test Job 2',
        'Test job description 2'
      )$$,
    NULL,
    'Viewer should not be able to create new jobs'
);

-- Test cross-company access
SELECT set_current_user_id(:'company1_admin_id'::uuid);
SELECT throws_ok(
    $$INSERT INTO users (company_id, email, full_name, role, password_hash) 
      VALUES (
        :'company2_id'::uuid, 
        'cross_company@test.com', 
        'Cross Company User', 
        'recruiter', 
        'password_hash'
      )$$,
    NULL,
    'Admin should not be able to create users for another company'
);

SELECT throws_ok(
    $$INSERT INTO jobs (company_id, title, description) 
      VALUES (
        :'company2_id'::uuid,
        'Cross Company Job',
        'This job should not be created'
      )$$,
    NULL,
    'Admin should not be able to create jobs for another company'
);

-- Test that admin cannot directly modify records from another company
SELECT throws_ok(
    $$UPDATE companies SET name = 'Hacked Company' WHERE id = :'company2_id'::uuid$$,
    NULL,
    'Admin from company 1 should not be able to modify company 2'
);

SELECT set_current_user_id(:'company2_admin_id'::uuid);
SELECT throws_ok(
    $$UPDATE users SET full_name = 'Hacked User' 
      WHERE company_id = :'company1_id'::uuid 
      LIMIT 1$$,
    NULL,
    'Admin from company 2 should not be able to modify users from company 1'
);

SELECT throws_ok(
    $$DELETE FROM candidates WHERE company_id = :'company1_id'::uuid$$,
    NULL,
    'Admin from company 2 should not be able to delete candidates from company 1'
);

-- Test that a user can't change their own company_id
SELECT set_current_user_id(:'company1_admin_id'::uuid);
SELECT throws_ok(
    $$UPDATE users SET company_id = :'company2_id'::uuid WHERE id = current_user_id()$$,
    NULL,
    'User should not be able to change their own company_id'
);

-- Test that RLS still allows proper administrative functions
SELECT set_current_user_id(:'company1_admin_id'::uuid);
SELECT lives_ok(
    $$UPDATE users SET full_name = 'Updated Name' 
      WHERE company_id = (SELECT company_id FROM users WHERE id = current_user_id())
      AND id <> current_user_id()
      LIMIT 1$$,
    'Admin should be able to update users in their own company'
);

-- Reset test data
SELECT cleanup_test_data();

-- Finish the tests
SELECT * FROM finish();

ROLLBACK;
