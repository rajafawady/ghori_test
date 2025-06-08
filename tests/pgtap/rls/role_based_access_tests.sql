\set ON_ERROR_ROLLBACK 1
\set ON_ERROR_STOP true

BEGIN;

-- Load pgTAP
SELECT plan(18);

-- Load test utilities
\i 'tests/helpers/test_utilities.sql'

-- Create test data with users of different roles
DO $$
DECLARE
    v_company_id UUID;
    v_admin_id UUID;
    v_recruiter_id UUID;
    v_viewer_id UUID;
BEGIN
    -- Create company
    INSERT INTO companies (name, slug, subscription_plan)
    VALUES ('RLS Role Test Company', 'rls-role-test', 'professional')
    RETURNING id INTO v_company_id;
    
    -- Create users with different roles
    INSERT INTO users (company_id, email, full_name, role, password_hash)
    VALUES 
        (v_company_id, 'rls-admin@example.com', 'RLS Admin', 'admin', 'hash123'),
        (v_company_id, 'rls-recruiter@example.com', 'RLS Recruiter', 'recruiter', 'hash123'),
        (v_company_id, 'rls-viewer@example.com', 'RLS Viewer', 'viewer', 'hash123')
    RETURNING id INTO v_admin_id;
    
    -- Get other user IDs
    SELECT id INTO v_recruiter_id FROM users 
    WHERE email = 'rls-recruiter@example.com';
    
    SELECT id INTO v_viewer_id FROM users 
    WHERE email = 'rls-viewer@example.com';
    
    -- Store values for use in tests
    PERFORM set_config('test.company_id', v_company_id::text, false);
    PERFORM set_config('test.admin_id', v_admin_id::text, false);
    PERFORM set_config('test.recruiter_id', v_recruiter_id::text, false);
    PERFORM set_config('test.viewer_id', v_viewer_id::text, false);
END $$;

-- Set variables from stored values
\set company_id `SELECT current_setting('test.company_id')`
\set admin_id `SELECT current_setting('test.admin_id')`
\set recruiter_id `SELECT current_setting('test.recruiter_id')`
\set viewer_id `SELECT current_setting('test.viewer_id')`

-- Test 1: Admin should be able to create a new user
SELECT set_current_user_id(:'admin_id'::uuid);

SELECT lives_ok(
    $$INSERT INTO users (company_id, email, full_name, role, password_hash)
      VALUES (
        '$$||:'company_id'||$$',
        'new-user@example.com',
        'New Test User',
        'recruiter',
        'hash123'
      )$$,
    'Admin should be able to create a new user'
);

-- Test 2: Recruiter should NOT be able to create a new user
SELECT set_current_user_id(:'recruiter_id'::uuid);

SELECT throws_ok(
    $$INSERT INTO users (company_id, email, full_name, role, password_hash)
      VALUES (
        '$$||:'company_id'||$$',
        'recruiter-created@example.com',
        'Recruiter Created User',
        'viewer',
        'hash123'
      )$$,
    NULL,
    'Recruiter should not be able to create a new user'
);

-- Test 3: Admin should be able to create a new job
SELECT set_current_user_id(:'admin_id'::uuid);

SELECT lives_ok(
    $$INSERT INTO jobs (company_id, title, description)
      VALUES (
        '$$||:'company_id'||$$',
        'Admin Created Job',
        'This job was created by an admin'
      )$$,
    'Admin should be able to create a new job'
);

-- Test 4: Recruiter should be able to create a new job
SELECT set_current_user_id(:'recruiter_id'::uuid);

SELECT lives_ok(
    $$INSERT INTO jobs (company_id, title, description)
      VALUES (
        '$$||:'company_id'||$$',
        'Recruiter Created Job',
        'This job was created by a recruiter'
      )$$,
    'Recruiter should be able to create a new job'
);

-- Test 5: Viewer should NOT be able to create a new job
SELECT set_current_user_id(:'viewer_id'::uuid);

SELECT throws_ok(
    $$INSERT INTO jobs (company_id, title, description)
      VALUES (
        '$$||:'company_id'||$$',
        'Viewer Created Job',
        'This job should not be creatable by a viewer'
      )$$,
    NULL,
    'Viewer should not be able to create a new job'
);

-- Create some candidates for further testing
SELECT set_current_user_id(:'admin_id'::uuid);

DO $$
DECLARE
    v_candidate_id UUID;
    v_job_id UUID;
BEGIN
    -- Create a test candidate
    INSERT INTO candidates (company_id, full_name, email)
    VALUES (:'company_id'::uuid, 'RLS Test Candidate', 'rls-candidate@example.com')
    RETURNING id INTO v_candidate_id;
    
    -- Create a test job
    INSERT INTO jobs (company_id, title, description)
    VALUES (:'company_id'::uuid, 'RLS Test Job', 'Job for RLS testing')
    RETURNING id INTO v_job_id;
    
    -- Store for later tests
    PERFORM set_config('test.candidate_id', v_candidate_id::text, false);
    PERFORM set_config('test.job_id', v_job_id::text, false);
END $$;

\set candidate_id `SELECT current_setting('test.candidate_id')`
\set job_id `SELECT current_setting('test.job_id')`

-- Test 6: Admin should be able to update a candidate
SELECT set_current_user_id(:'admin_id'::uuid);

SELECT lives_ok(
    $$UPDATE candidates 
      SET full_name = 'Updated by Admin'
      WHERE id = '$$||:'candidate_id'||$$'$$,
    'Admin should be able to update a candidate'
);

-- Test 7: Recruiter should be able to update a candidate
SELECT set_current_user_id(:'recruiter_id'::uuid);

SELECT lives_ok(
    $$UPDATE candidates 
      SET full_name = 'Updated by Recruiter'
      WHERE id = '$$||:'candidate_id'||$$'$$,
    'Recruiter should be able to update a candidate'
);

-- Test 8: Viewer should NOT be able to update a candidate
SELECT set_current_user_id(:'viewer_id'::uuid);

SELECT throws_ok(
    $$UPDATE candidates 
      SET full_name = 'Updated by Viewer'
      WHERE id = '$$||:'candidate_id'||$$'$$,
    NULL,
    'Viewer should not be able to update a candidate'
);

-- Test 9: All roles should be able to read data
SELECT set_current_user_id(:'admin_id'::uuid);
SELECT ok(
    EXISTS(SELECT 1 FROM candidates WHERE id = :'candidate_id'::uuid),
    'Admin should be able to read candidate data'
);

SELECT set_current_user_id(:'recruiter_id'::uuid);
SELECT ok(
    EXISTS(SELECT 1 FROM candidates WHERE id = :'candidate_id'::uuid),
    'Recruiter should be able to read candidate data'
);

SELECT set_current_user_id(:'viewer_id'::uuid);
SELECT ok(
    EXISTS(SELECT 1 FROM candidates WHERE id = :'candidate_id'::uuid),
    'Viewer should be able to read candidate data'
);

-- Test 10: Admin should be able to delete a job
SELECT set_current_user_id(:'admin_id'::uuid);

-- First create a job to delete
DO $$
DECLARE
    v_delete_job_id UUID;
BEGIN
    INSERT INTO jobs (company_id, title, description)
    VALUES (:'company_id'::uuid, 'Job to Delete', 'This job will be deleted')
    RETURNING id INTO v_delete_job_id;
    
    PERFORM set_config('test.delete_job_id', v_delete_job_id::text, false);
END $$;

\set delete_job_id `SELECT current_setting('test.delete_job_id')`

SELECT lives_ok(
    $$DELETE FROM jobs WHERE id = '$$||:'delete_job_id'||$$'$$,
    'Admin should be able to delete a job'
);

-- Test 11: Create a job for recruiter deletion test
DO $$
DECLARE
    v_recruiter_delete_job_id UUID;
BEGIN
    INSERT INTO jobs (company_id, title, description)
    VALUES (:'company_id'::uuid, 'Recruiter Job to Delete', 'This job will be deleted by recruiter')
    RETURNING id INTO v_recruiter_delete_job_id;
    
    PERFORM set_config('test.recruiter_delete_job_id', v_recruiter_delete_job_id::text, false);
END $$;

\set recruiter_delete_job_id `SELECT current_setting('test.recruiter_delete_job_id')`

-- Test that recruiter can delete their own job
SELECT set_current_user_id(:'recruiter_id'::uuid);

SELECT lives_ok(
    $$DELETE FROM jobs WHERE id = '$$||:'recruiter_delete_job_id'||$$'$$,
    'Recruiter should be able to delete a job'
);

-- Test 12: Viewer should NOT be able to delete a job
SELECT set_current_user_id(:'viewer_id'::uuid);

SELECT throws_ok(
    $$DELETE FROM jobs WHERE id = '$$||:'job_id'||$$'$$,
    NULL,
    'Viewer should not be able to delete a job'
);

-- Test 13: Only admin can update user roles
SELECT set_current_user_id(:'admin_id'::uuid);

SELECT lives_ok(
    $$UPDATE users SET role = 'viewer' 
      WHERE email = 'rls-recruiter@example.com'$$,
    'Admin should be able to change user roles'
);

-- Test 14: Recruiter should NOT be able to update user roles
SELECT set_current_user_id(:'recruiter_id'::uuid);

SELECT throws_ok(
    $$UPDATE users SET role = 'admin' 
      WHERE email = 'rls-viewer@example.com'$$,
    NULL,
    'Recruiter should not be able to change user roles'
);

-- Test 15: Create a new API usage tracking entry
SELECT set_current_user_id(:'admin_id'::uuid);

SELECT lives_ok(
    $$INSERT INTO api_usage (
        company_id, 
        endpoint, 
        request_count,
        date
      ) VALUES (
        '$$||:'company_id'||$$',
        '/api/candidates',
        10,
        CURRENT_DATE
      )$$,
    'Should be able to create API usage entries'
);

-- Test 16: Admin should be able to update company subscription
SELECT lives_ok(
    $$UPDATE companies 
      SET subscription_plan = 'enterprise', max_users = 20
      WHERE id = '$$||:'company_id'||$$'$$,
    'Admin should be able to update company subscription'
);

-- Clean up test data
SELECT cleanup_test_data();

-- Finish the tests
SELECT * FROM finish();

ROLLBACK;
