\set ON_ERROR_ROLLBACK 1
\set ON_ERROR_STOP true

BEGIN;

-- Load pgTAP
SELECT plan(10);

-- Load test utilities
\i 'tests/helpers/test_utilities.sql'

-- Create test data
DO $$
DECLARE
    v_company_id UUID;
    v_admin_id UUID;
    v_job_id UUID;
    v_config_id UUID;
BEGIN
    -- Create company
    INSERT INTO companies (name, slug, subscription_plan)
    VALUES ('Config Test Company', 'config-test', 'professional')
    RETURNING id INTO v_company_id;
    
    -- Create admin user
    INSERT INTO users (company_id, email, full_name, role, password_hash)
    VALUES (v_company_id, 'config-admin@example.com', 'Config Admin', 'admin', 'hash123')
    RETURNING id INTO v_admin_id;
    
    -- Create job
    INSERT INTO jobs (company_id, title, description)
    VALUES (v_company_id, 'Config Test Job', 'Testing job match configuration')
    RETURNING id INTO v_job_id;
    
    -- Create job match config
    INSERT INTO job_match_configs (
        company_id,
        job_id,
        skills_weight,
        experience_weight,
        education_weight,
        keywords_weight,
        minimum_score
    ) VALUES (
        v_company_id,
        v_job_id,
        0.4,  -- 40% weight on skills
        0.3,  -- 30% weight on experience
        0.1,  -- 10% weight on education
        0.2,  -- 20% weight on keywords
        65.0  -- Minimum score threshold
    )
    RETURNING id INTO v_config_id;
    
    -- Store values for use in tests
    PERFORM set_config('test.company_id', v_company_id::text, false);
    PERFORM set_config('test.admin_id', v_admin_id::text, false);
    PERFORM set_config('test.job_id', v_job_id::text, false);
    PERFORM set_config('test.config_id', v_config_id::text, false);
END $$;

-- Set variables from stored values
\set company_id `SELECT current_setting('test.company_id')`
\set admin_id `SELECT current_setting('test.admin_id')`
\set job_id `SELECT current_setting('test.job_id')`
\set config_id `SELECT current_setting('test.config_id')`

-- Set current user for RLS
SELECT set_current_user_id(:'admin_id'::uuid);

-- Test job match config existence
SELECT is(
    (SELECT COUNT(*) FROM job_match_configs WHERE job_id = :'job_id'::uuid),
    1::bigint,
    'There should be exactly one job match config for the job'
);

-- Test weight sum equals 1.0
SELECT is(
    (SELECT skills_weight + experience_weight + education_weight + keywords_weight 
     FROM job_match_configs WHERE job_id = :'job_id'::uuid),
    1.0::numeric,
    'Weights in job match config should sum to 1.0'
);

-- Test minimum score validation
SELECT throws_ok(
    $$UPDATE job_match_configs SET minimum_score = 101.0 WHERE id = '$$||:'config_id'||$$'$$,
    NULL,
    'Minimum score should not be allowed to exceed 100'
);

SELECT throws_ok(
    $$UPDATE job_match_configs SET minimum_score = -5.0 WHERE id = '$$||:'config_id'||$$'$$,
    NULL,
    'Minimum score should not be allowed to be negative'
);

-- Test weight validation
SELECT throws_ok(
    $$UPDATE job_match_configs 
      SET skills_weight = 0.5, experience_weight = 0.6
      WHERE id = '$$||:'config_id'||$$'$$,
    NULL,
    'Weights should not be allowed to sum to > 1.0'
);

-- Create a new company and user to test isolation
DO $$
DECLARE
    v_company_id2 UUID;
    v_user_id2 UUID;
BEGIN
    -- Create company
    INSERT INTO companies (name, slug, subscription_plan)
    VALUES ('Config Test Company 2', 'config-test-2', 'professional')
    RETURNING id INTO v_company_id2;
    
    -- Create user
    INSERT INTO users (company_id, email, full_name, role, password_hash)
    VALUES (v_company_id2, 'config-test-2@example.com', 'Config Test User 2', 'admin', 'hash123')
    RETURNING id INTO v_user_id2;
    
    -- Store values for use in tests
    PERFORM set_config('test.company_id2', v_company_id2::text, false);
    PERFORM set_config('test.user_id2', v_user_id2::text, false);
END $$;

\set company_id2 `SELECT current_setting('test.company_id2')`
\set user_id2 `SELECT current_setting('test.user_id2')`

-- Test that user from company2 cannot see configs from company1
SELECT set_current_user_id(:'user_id2'::uuid);

SELECT is(
    (SELECT COUNT(*) FROM job_match_configs),
    0::bigint,
    'User from company2 should not see job match configs from company1'
);

-- Test that user from company2 cannot modify configs from company1
SELECT throws_ok(
    $$UPDATE job_match_configs SET minimum_score = 70.0 WHERE id = '$$||:'config_id'||$$'$$,
    NULL,
    'User from company2 should not be able to modify job match configs from company1'
);

-- Create a job for company2
DO $$
DECLARE
    v_job_id2 UUID;
BEGIN
    -- Create job
    INSERT INTO jobs (company_id, title, description)
    VALUES (:'company_id2'::uuid, 'Config Test Job 2', 'Testing job match configuration isolation')
    RETURNING id INTO v_job_id2;
    
    -- Store value for use in tests
    PERFORM set_config('test.job_id2', v_job_id2::text, false);
END $$;

\set job_id2 `SELECT current_setting('test.job_id2')`

-- Create a job match config for company2 job
INSERT INTO job_match_configs (
    company_id,
    job_id,
    skills_weight,
    experience_weight,
    education_weight,
    keywords_weight,
    minimum_score
) VALUES (
    :'company_id2'::uuid,
    :'job_id2'::uuid,
    0.3,
    0.3,
    0.2,
    0.2,
    70.0
);

-- Test that company2 user can see and modify their own configs
SELECT is(
    (SELECT COUNT(*) FROM job_match_configs),
    1::bigint,
    'User from company2 should see 1 job match config'
);

SELECT lives_ok(
    $$UPDATE job_match_configs 
      SET minimum_score = 75.0 
      WHERE job_id = '$$||:'job_id2'||$$'$$,
    'User from company2 should be able to modify their own job match config'
);

SELECT is(
    (SELECT minimum_score FROM job_match_configs WHERE job_id = :'job_id2'::uuid),
    75.0::numeric,
    'Config update from company2 user should be successful'
);

-- Switch back to company1 user and verify their config is unchanged
SELECT set_current_user_id(:'admin_id'::uuid);

SELECT is(
    (SELECT minimum_score FROM job_match_configs WHERE job_id = :'job_id'::uuid),
    65.0::numeric,
    'Company1 config should be unchanged after company2 user modified their config'
);

-- Clean up test data
DELETE FROM job_match_configs WHERE company_id IN (:'company_id'::uuid, :'company_id2'::uuid);
DELETE FROM jobs WHERE company_id IN (:'company_id'::uuid, :'company_id2'::uuid);
DELETE FROM users WHERE company_id IN (:'company_id'::uuid, :'company_id2'::uuid);
DELETE FROM companies WHERE id IN (:'company_id'::uuid, :'company_id2'::uuid);

-- Finish the tests
SELECT * FROM finish();

ROLLBACK;
