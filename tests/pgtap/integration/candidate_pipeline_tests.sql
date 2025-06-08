\set ON_ERROR_ROLLBACK 1
\set ON_ERROR_STOP true

BEGIN;

-- Load pgTAP
SELECT plan(14);

-- Load test utilities
\i 'tests/helpers/test_utilities.sql'

-- Create test data for candidate pipeline testing
DO $$
DECLARE
    v_company_id UUID;
    v_admin_id UUID;
    v_recruiter_id UUID;
    v_viewer_id UUID;
    v_job_id UUID;
    v_candidate_id UUID;
BEGIN
    -- Create company
    INSERT INTO companies (name, slug, subscription_plan)
    VALUES ('Pipeline Test Company', 'pipeline-test', 'professional')
    RETURNING id INTO v_company_id;
    
    -- Create users with different roles
    INSERT INTO users (company_id, email, full_name, role, password_hash)
    VALUES 
        (v_company_id, 'pipeline-admin@example.com', 'Pipeline Admin', 'admin', 'hash123'),
        (v_company_id, 'pipeline-recruiter@example.com', 'Pipeline Recruiter', 'recruiter', 'hash123'),
        (v_company_id, 'pipeline-viewer@example.com', 'Pipeline Viewer', 'viewer', 'hash123')
    RETURNING id INTO v_admin_id;
    
    -- Get other user IDs
    SELECT id INTO v_recruiter_id FROM users 
    WHERE email = 'pipeline-recruiter@example.com';
    
    SELECT id INTO v_viewer_id FROM users 
    WHERE email = 'pipeline-viewer@example.com';
    
    -- Create job
    INSERT INTO jobs (company_id, title, description)
    VALUES (v_company_id, 'Pipeline Test Job', 'Testing candidate pipeline functionality')
    RETURNING id INTO v_job_id;
    
    -- Create candidate
    INSERT INTO candidates (
        company_id, 
        full_name, 
        email, 
        phone, 
        resume_text
    )
    VALUES (
        v_company_id,
        'Pipeline Test Candidate',
        'pipeline-candidate@example.com',
        '555-123-4567',
        'Candidate for pipeline testing'
    )
    RETURNING id INTO v_candidate_id;
    
    -- Create initial candidate status (new)
    INSERT INTO candidate_statuses (
        company_id,
        candidate_id,
        status,
        updated_by_user_id
    ) VALUES (
        v_company_id,
        v_candidate_id,
        'new',
        v_admin_id
    );
    
    -- Store values for use in tests
    PERFORM set_config('test.company_id', v_company_id::text, false);
    PERFORM set_config('test.admin_id', v_admin_id::text, false);
    PERFORM set_config('test.recruiter_id', v_recruiter_id::text, false);
    PERFORM set_config('test.viewer_id', v_viewer_id::text, false);
    PERFORM set_config('test.job_id', v_job_id::text, false);
    PERFORM set_config('test.candidate_id', v_candidate_id::text, false);
END $$;

-- Set variables from stored values
\set company_id `SELECT current_setting('test.company_id')`
\set admin_id `SELECT current_setting('test.admin_id')`
\set recruiter_id `SELECT current_setting('test.recruiter_id')`
\set viewer_id `SELECT current_setting('test.viewer_id')`
\set job_id `SELECT current_setting('test.job_id')`
\set candidate_id `SELECT current_setting('test.candidate_id')`

-- Set current user for RLS
SELECT set_current_user_id(:'admin_id'::uuid);

-- Test initial candidate status
SELECT is(
    (SELECT status FROM candidate_statuses WHERE candidate_id = :'candidate_id'::uuid),
    'new',
    'Initial status should be "new"'
);

-- Test updating candidate status as an admin
SELECT lives_ok(
    $$INSERT INTO candidate_statuses (company_id, candidate_id, status, updated_by_user_id)
      VALUES (
        '$$||:'company_id'||$$',
        '$$||:'candidate_id'||$$',
        'reviewed',
        '$$||:'admin_id'||$$'
      )$$,
    'Admin should be able to update candidate status to reviewed'
);

-- Test status was updated correctly
SELECT is(
    (SELECT status FROM candidate_statuses 
     WHERE candidate_id = :'candidate_id'::uuid 
     ORDER BY created_at DESC LIMIT 1),
    'reviewed',
    'Latest status should now be "reviewed"'
);

-- Test history is maintained
SELECT is(
    (SELECT COUNT(*) FROM candidate_statuses WHERE candidate_id = :'candidate_id'::uuid),
    2::bigint,
    'Status history should contain 2 entries'
);

-- Test updating candidate status as a recruiter
SELECT set_current_user_id(:'recruiter_id'::uuid);

SELECT lives_ok(
    $$INSERT INTO candidate_statuses (company_id, candidate_id, status, updated_by_user_id)
      VALUES (
        '$$||:'company_id'||$$',
        '$$||:'candidate_id'||$$',
        'shortlisted',
        '$$||:'recruiter_id'||$$'
      )$$,
    'Recruiter should be able to update candidate status to shortlisted'
);

-- Test status was updated correctly
SELECT is(
    (SELECT status FROM candidate_statuses 
     WHERE candidate_id = :'candidate_id'::uuid 
     ORDER BY created_at DESC LIMIT 1),
    'shortlisted',
    'Latest status should now be "shortlisted"'
);

-- Test viewer cannot update status
SELECT set_current_user_id(:'viewer_id'::uuid);

SELECT throws_ok(
    $$INSERT INTO candidate_statuses (company_id, candidate_id, status, updated_by_user_id)
      VALUES (
        '$$||:'company_id'||$$',
        '$$||:'candidate_id'||$$',
        'interviewed',
        '$$||:'viewer_id'||$$'
      )$$,
    NULL,
    'Viewer should not be able to update candidate status'
);

-- Test admin can add a comment
SELECT set_current_user_id(:'admin_id'::uuid);

SELECT lives_ok(
    $$INSERT INTO candidate_comments (company_id, candidate_id, user_id, comment_text)
      VALUES (
        '$$||:'company_id'||$$',
        '$$||:'candidate_id'||$$',
        '$$||:'admin_id'||$$',
        'This candidate looks promising'
      )$$,
    'Admin should be able to add a comment'
);

-- Test recruiter can add a comment
SELECT set_current_user_id(:'recruiter_id'::uuid);

SELECT lives_ok(
    $$INSERT INTO candidate_comments (company_id, candidate_id, user_id, comment_text)
      VALUES (
        '$$||:'company_id'||$$',
        '$$||:'candidate_id'||$$',
        '$$||:'recruiter_id'||$$',
        'Agreed, should schedule an interview'
      )$$,
    'Recruiter should be able to add a comment'
);

-- Test comments are visible to all roles
SELECT set_current_user_id(:'viewer_id'::uuid);

SELECT is(
    (SELECT COUNT(*) FROM candidate_comments WHERE candidate_id = :'candidate_id'::uuid),
    2::bigint,
    'Viewer should see 2 comments'
);

-- Test viewer can add a comment (read-only for status, but can comment)
SELECT lives_ok(
    $$INSERT INTO candidate_comments (company_id, candidate_id, user_id, comment_text)
      VALUES (
        '$$||:'company_id'||$$',
        '$$||:'candidate_id'||$$',
        '$$||:'viewer_id'||$$',
        'I reviewed their resume - good technical skills'
      )$$,
    'Viewer should be able to add a comment'
);

-- Complete the pipeline flow as admin
SELECT set_current_user_id(:'admin_id'::uuid);

-- Update to interviewed
SELECT lives_ok(
    $$INSERT INTO candidate_statuses (company_id, candidate_id, status, updated_by_user_id)
      VALUES (
        '$$||:'company_id'||$$',
        '$$||:'candidate_id'||$$',
        'interviewed',
        '$$||:'admin_id'||$$'
      )$$,
    'Admin should be able to update candidate status to interviewed'
);

-- Update to offered
SELECT lives_ok(
    $$INSERT INTO candidate_statuses (company_id, candidate_id, status, updated_by_user_id)
      VALUES (
        '$$||:'company_id'||$$',
        '$$||:'candidate_id'||$$',
        'offered',
        '$$||:'admin_id'||$$'
      )$$,
    'Admin should be able to update candidate status to offered'
);

-- Update to hired
SELECT lives_ok(
    $$INSERT INTO candidate_statuses (company_id, candidate_id, status, updated_by_user_id)
      VALUES (
        '$$||:'company_id'||$$',
        '$$||:'candidate_id'||$$',
        'hired',
        '$$||:'admin_id'||$$'
      )$$,
    'Admin should be able to update candidate status to hired'
);

-- Verify full history
SELECT is(
    (SELECT array_agg(status ORDER BY created_at) FROM candidate_statuses 
     WHERE candidate_id = :'candidate_id'::uuid),
    ARRAY['new', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'hired'],
    'Full status history should be correct'
);

-- Clean up test data
SELECT cleanup_test_data();

-- Finish the tests
SELECT * FROM finish();

ROLLBACK;
