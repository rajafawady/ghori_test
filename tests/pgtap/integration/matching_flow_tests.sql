\set ON_ERROR_ROLLBACK 1
\set ON_ERROR_STOP true

BEGIN;

-- Load pgTAP
SELECT plan(15);

-- Load test utilities
\i 'tests/helpers/test_utilities.sql'

-- Create test data
DO $$
DECLARE
    v_company_id UUID;
    v_admin_id UUID;
    v_job_id UUID;
    v_candidate_id1 UUID;
    v_candidate_id2 UUID;
    v_candidate_id3 UUID;
    v_job_match_config_id UUID;
    v_match_id1 UUID;
    v_match_id2 UUID;
    v_match_id3 UUID;
BEGIN
    -- Create company
    INSERT INTO companies (name, slug, subscription_plan)
    VALUES ('Matching Test Company', 'matching-test', 'professional')
    RETURNING id INTO v_company_id;
    
    -- Create admin user
    INSERT INTO users (company_id, email, full_name, role, password_hash)
    VALUES (v_company_id, 'matching-admin@example.com', 'Matching Admin', 'admin', 'hash123')
    RETURNING id INTO v_admin_id;
    
    -- Create job
    INSERT INTO jobs (company_id, title, description, skills_required, experience_required)
    VALUES (
        v_company_id, 
        'Software Engineer', 
        'Looking for a skilled software engineer with experience in PostgreSQL and testing',
        ARRAY['postgresql', 'database testing', 'sql', 'pgtap'],
        '3+ years'
    )
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
        0.5,  -- 50% weight on skills
        0.3,  -- 30% weight on experience
        0.1,  -- 10% weight on education
        0.1,  -- 10% weight on keywords
        70.0  -- Minimum score of 70%
    )
    RETURNING id INTO v_job_match_config_id;
    
    -- Create candidates with varying degrees of match
    -- Candidate 1: Good match (85%)
    INSERT INTO candidates (
        company_id, 
        full_name, 
        email, 
        phone, 
        resume_text, 
        skills, 
        experience_years
    )
    VALUES (
        v_company_id,
        'Perfect Match',
        'perfect@example.com',
        '555-123-4567',
        'Expert in PostgreSQL and database testing with pgtap. Experienced SQL developer.',
        ARRAY['postgresql', 'database testing', 'sql', 'pgtap', 'database design'],
        5
    )
    RETURNING id INTO v_candidate_id1;
    
    -- Candidate 2: Moderate match (75%)
    INSERT INTO candidates (
        company_id, 
        full_name, 
        email, 
        phone, 
        resume_text, 
        skills, 
        experience_years
    )
    VALUES (
        v_company_id,
        'Good Match',
        'good@example.com',
        '555-123-4568',
        'Some experience with PostgreSQL and database development. Knowledge of SQL.',
        ARRAY['postgresql', 'sql', 'database development'],
        3
    )
    RETURNING id INTO v_candidate_id2;
    
    -- Candidate 3: Poor match (40%)
    INSERT INTO candidates (
        company_id, 
        full_name, 
        email, 
        phone, 
        resume_text, 
        skills, 
        experience_years
    )
    VALUES (
        v_company_id,
        'Poor Match',
        'poor@example.com',
        '555-123-4569',
        'General IT professional with basic SQL knowledge.',
        ARRAY['general it', 'basic sql'],
        1
    )
    RETURNING id INTO v_candidate_id3;
    
    -- Create job matches
    INSERT INTO job_matches (
        company_id,
        job_id,
        candidate_id,
        match_score,
        match_details,
        created_at
    ) VALUES
    (
        v_company_id,
        v_job_id,
        v_candidate_id1,
        85.0,
        '{"skills_score": 90, "experience_score": 80, "education_score": 70, "keywords_score": 85}',
        NOW()
    ),
    (
        v_company_id,
        v_job_id,
        v_candidate_id2,
        75.0,
        '{"skills_score": 70, "experience_score": 80, "education_score": 70, "keywords_score": 60}',
        NOW()
    ),
    (
        v_company_id,
        v_job_id,
        v_candidate_id3,
        40.0,
        '{"skills_score": 30, "experience_score": 40, "education_score": 60, "keywords_score": 35}',
        NOW()
    );
    
    -- Store values for use in tests
    PERFORM set_config('test.company_id', v_company_id::text, false);
    PERFORM set_config('test.admin_id', v_admin_id::text, false);
    PERFORM set_config('test.job_id', v_job_id::text, false);
    PERFORM set_config('test.job_match_config_id', v_job_match_config_id::text, false);
    PERFORM set_config('test.candidate_id1', v_candidate_id1::text, false);
    PERFORM set_config('test.candidate_id2', v_candidate_id2::text, false);
    PERFORM set_config('test.candidate_id3', v_candidate_id3::text, false);
END $$;

-- Set variables from stored values
\set company_id `SELECT current_setting('test.company_id')`
\set admin_id `SELECT current_setting('test.admin_id')`
\set job_id `SELECT current_setting('test.job_id')`
\set job_match_config_id `SELECT current_setting('test.job_match_config_id')`
\set candidate_id1 `SELECT current_setting('test.candidate_id1')`
\set candidate_id2 `SELECT current_setting('test.candidate_id2')`
\set candidate_id3 `SELECT current_setting('test.candidate_id3')`

-- Set current user for RLS
SELECT set_current_user_id(:'admin_id'::uuid);

-- Test job match configs existence and data integrity
SELECT is(
    (SELECT COUNT(*) FROM job_match_configs WHERE job_id = :'job_id'::uuid),
    1::bigint,
    'There should be exactly one job match config for the job'
);

SELECT is(
    (SELECT skills_weight + experience_weight + education_weight + keywords_weight 
     FROM job_match_configs WHERE job_id = :'job_id'::uuid),
    1.0::numeric,
    'Weights in job match config should sum to 1.0'
);

-- Test job matches
SELECT is(
    (SELECT COUNT(*) FROM job_matches WHERE job_id = :'job_id'::uuid),
    3::bigint,
    'There should be three job matches for the job'
);

-- Test candidate with highest score
SELECT is(
    (SELECT candidate_id FROM job_matches WHERE job_id = :'job_id'::uuid ORDER BY match_score DESC LIMIT 1)::text,
    :'candidate_id1',
    'Candidate 1 should have the highest match score'
);

-- Test match score values
SELECT ok(
    (SELECT match_score FROM job_matches WHERE candidate_id = :'candidate_id1'::uuid) >= 80.0,
    'Perfect match candidate should have score >= 80'
);

SELECT ok(
    (SELECT match_score FROM job_matches WHERE candidate_id = :'candidate_id2'::uuid) BETWEEN 70.0 AND 80.0,
    'Good match candidate should have score between 70 and 80'
);

SELECT ok(
    (SELECT match_score FROM job_matches WHERE candidate_id = :'candidate_id3'::uuid) < 50.0,
    'Poor match candidate should have score < 50'
);

-- Test match details
SELECT is(
    (SELECT jsonb_extract_path_text(match_details::jsonb, 'skills_score')::numeric FROM job_matches WHERE candidate_id = :'candidate_id1'::uuid),
    90.0,
    'Perfect match candidate should have skills score = 90'
);

SELECT is(
    (SELECT jsonb_extract_path_text(match_details::jsonb, 'experience_score')::numeric FROM job_matches WHERE candidate_id = :'candidate_id1'::uuid),
    80.0,
    'Perfect match candidate should have experience score = 80'
);

-- Test filtering by minimum score
SELECT is(
    (SELECT COUNT(*) FROM job_matches jm
     JOIN job_match_configs jmc ON jm.job_id = jmc.job_id
     WHERE jm.job_id = :'job_id'::uuid AND jm.match_score >= jmc.minimum_score),
    2::bigint,
    'Only 2 candidates should meet the minimum score threshold'
);

-- Test candidate with skills exact match
SELECT is(
    (SELECT COUNT(*) FROM candidates c
     WHERE c.company_id = :'company_id'::uuid
     AND 'postgresql' = ANY(c.skills)
     AND 'sql' = ANY(c.skills)),
    2::bigint,
    '2 candidates should have both PostgreSQL and SQL skills'
);

-- Test integrating job match data with candidates
SELECT is(
    (SELECT COUNT(*) FROM candidates c
     JOIN job_matches jm ON c.id = jm.candidate_id
     WHERE jm.job_id = :'job_id'::uuid
     AND jm.match_score >= 70.0
     AND c.experience_years >= 3),
    2::bigint,
    '2 candidates should have sufficient experience and match score'
);

-- Test updating match config and how it would filter candidates
UPDATE job_match_configs SET minimum_score = 80.0 WHERE id = :'job_match_config_id'::uuid;

SELECT is(
    (SELECT COUNT(*) FROM job_matches jm
     JOIN job_match_configs jmc ON jm.job_id = jmc.job_id
     WHERE jm.job_id = :'job_id'::uuid AND jm.match_score >= jmc.minimum_score),
    1::bigint,
    'After raising minimum score, only 1 candidate should meet the threshold'
);

-- Test ranking candidates by match score
SELECT is(
    (SELECT array_agg(candidate_id::text) FROM (
        SELECT candidate_id FROM job_matches
        WHERE job_id = :'job_id'::uuid
        ORDER BY match_score DESC
     ) sub),
    array[:'candidate_id1', :'candidate_id2', :'candidate_id3'],
    'Candidates should be correctly ordered by match score'
);

-- Test that match scores are correctly bound between 0 and 100
SELECT ok(
    NOT EXISTS (
        SELECT 1 FROM job_matches
        WHERE job_id = :'job_id'::uuid
        AND (match_score < 0 OR match_score > 100)
    ),
    'Match scores should always be between 0 and 100'
);

-- Clean up test data
SELECT cleanup_test_data();

-- Finish the tests
SELECT * FROM finish();

ROLLBACK;
