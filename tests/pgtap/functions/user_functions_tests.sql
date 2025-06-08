\set ON_ERROR_ROLLBACK 1
\set ON_ERROR_STOP true

BEGIN;

-- Load pgTAP
SELECT plan(13);

-- Create test data
\i 'tests/helpers/test_utilities.sql'

-- Create test company and user
DO $$
DECLARE
    v_company_id UUID;
    v_user_id UUID;
BEGIN
    INSERT INTO companies (name, slug, subscription_plan)
    VALUES ('Function Test Company', 'function-test', 'professional')
    RETURNING id INTO v_company_id;
    
    INSERT INTO users (company_id, email, full_name, role, password_hash)
    VALUES (v_company_id, 'function-test@example.com', 'Function Test User', 'admin', 'hash123')
    RETURNING id INTO v_user_id;
    
    -- Store for later use
    PERFORM set_config('test.company_id', v_company_id::text, false);
    PERFORM set_config('test.user_id', v_user_id::text, false);
END $$;

-- Store values as variables
\set company_id `SELECT current_setting('test.company_id')`
\set user_id `SELECT current_setting('test.user_id')`

-- Test set_current_user_id and current_user_id
SELECT function_returns('set_current_user_id', ARRAY['uuid'], 'void', 
    'set_current_user_id should return void');

SELECT function_returns('current_user_id', 'uuid', 
    'current_user_id should return uuid');

SELECT lives_ok(
    $$SELECT set_current_user_id('$$||:'user_id'||$$')$$,
    'set_current_user_id should execute without errors'
);

SELECT is(
    current_user_id()::text, 
    :'user_id', 
    'current_user_id() should return the user ID set with set_current_user_id()'
);

-- Test user_company_id
SELECT function_returns('user_company_id', 'uuid', 
    'user_company_id should return uuid');

SELECT is(
    user_company_id()::text, 
    :'company_id', 
    'user_company_id() should return the company ID of the current user'
);

-- Test that RLS functions properly integrate with the set_current_user_id
-- First, create a second company and user
DO $$
DECLARE
    v_company_id2 UUID;
    v_user_id2 UUID;
BEGIN
    INSERT INTO companies (name, slug, subscription_plan)
    VALUES ('Function Test Company 2', 'function-test-2', 'professional')
    RETURNING id INTO v_company_id2;
    
    INSERT INTO users (company_id, email, full_name, role, password_hash)
    VALUES (v_company_id2, 'function-test-2@example.com', 'Function Test User 2', 'admin', 'hash123')
    RETURNING id INTO v_user_id2;
    
    -- Store for later use
    PERFORM set_config('test.company_id2', v_company_id2::text, false);
    PERFORM set_config('test.user_id2', v_user_id2::text, false);
END $$;

-- Store the second user as a variable
\set user_id2 `SELECT current_setting('test.user_id2')`
\set company_id2 `SELECT current_setting('test.company_id2')`

-- Using user from first company
SELECT set_current_user_id(:'user_id'::uuid);

-- Check company visibility
SELECT is(
    (SELECT COUNT(*) FROM companies),
    1::bigint,
    'User 1 should only see 1 company'
);

SELECT is(
    (SELECT id FROM companies LIMIT 1)::text,
    :'company_id',
    'User 1 should only see their own company'
);

-- Change to second user
SELECT set_current_user_id(:'user_id2'::uuid);

-- Check company visibility changed
SELECT is(
    (SELECT COUNT(*) FROM companies),
    1::bigint,
    'User 2 should only see 1 company'
);

SELECT is(
    (SELECT id FROM companies LIMIT 1)::text,
    :'company_id2',
    'User 2 should only see their own company'
);

-- Test update_updated_at_column trigger function
SELECT set_current_user_id(:'user_id'::uuid);

-- Get initial updated_at time
DO $$
DECLARE
    v_initial_updated_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT updated_at INTO v_initial_updated_at FROM companies WHERE id = :'company_id'::uuid;
    -- Wait a bit to ensure timestamp will be different
    PERFORM pg_sleep(0.1);
    -- Update the company
    UPDATE companies SET name = 'Updated Company Name' WHERE id = :'company_id'::uuid;
    -- Store the new updated_at for comparison
    PERFORM set_config('test.initial_updated_at', v_initial_updated_at::text, false);
END $$;

SELECT isnt(
    (SELECT updated_at FROM companies WHERE id = :'company_id'::uuid)::text,
    current_setting('test.initial_updated_at'),
    'updated_at should be changed by the trigger after update'
);

-- Test that timestamp change doesn't affect other rows
SELECT set_current_user_id(:'user_id2'::uuid);
SELECT isnt(
    (SELECT updated_at FROM companies WHERE id = :'company_id2'::uuid)::text,
    current_setting('test.initial_updated_at'),
    'updated_at on other companies should be unaffected'
);

-- Clean up test data
SELECT cleanup_test_data();

-- Finish the tests
SELECT * FROM finish();

ROLLBACK;
